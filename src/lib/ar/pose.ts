/**
 * AR placement math + smoothing (pure TS, no three.js so it stays testable).
 *
 * Browser AR without depth: we anchor the bracelet to the 2D wrist landmark,
 * estimate scale from a hand bone length, and orientation from the forearm
 * direction — an APPROXIMATE overlay, tuned for calm motion (see AR_TUNING).
 */

/** A single hand landmark, normalized to the input video frame (0..1). */
export type Landmark = { x: number; y: number; z: number };

/** Live-tunable parameters (mutated by the on-screen debug panel). */
export const AR_TUNING = {
  /** One-Euro filter: lower = smoother/calmer, higher = snappier. */
  smoothingMinCutoff: 1.2,
  /** One-Euro speed coefficient: higher = less lag on fast motion. */
  smoothingBeta: 0.02,
  /** Bracelet ring radius vs. the wrist→index-MCP distance. */
  scaleMultiplier: 1.15,
  /** Pitch the ring out of the screen plane so it reads as a 3D band (deg). */
  ringTiltOffsetDeg: 32,
  /** Slide the anchor up the wrist toward the fingers (fraction of bone len). */
  anchorForearmShift: 0.12,
  /** Detection cadence; render runs at display refresh and interpolates. */
  detectionFps: 26,
};

export type ArTuning = typeof AR_TUNING;

/** Everything the renderer needs, in the AR canvas's orthographic world space
 *  (x ∈ [-aspect, aspect], y ∈ [-1, 1]). */
export type ArPose = {
  visible: boolean;
  x: number;
  y: number;
  /** In-plane forearm angle (radians), continuous/unwrapped for smoothing. */
  angle: number;
  /** Target ring radius in world units. */
  radius: number;
};

/** DOM-derived mapping needed to place raw landmarks into world space. */
export type Viewport = {
  containerW: number;
  containerH: number;
  videoW: number;
  videoH: number;
  /** True when the (front) camera video is mirrored on screen. */
  mirrored: boolean;
};

// Landmark indices we rely on (MediaPipe hand model).
const WRIST = 0;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;

/**
 * Map a landmark (normalized to the raw video frame) into the AR canvas's
 * orthographic world coords, matching what the user sees under `object-cover`
 * (+ horizontal mirror for the front camera). World units are isotropic:
 * 1 world unit spans half the container height, so circles stay circular.
 */
function landmarkToWorld(l: Landmark, vp: Viewport) {
  const { containerW: cw, containerH: ch, videoW: vw, videoH: vh } = vp;
  // object-cover: scale to cover, centered (overflow cropped equally).
  const s = Math.max(cw / vw, ch / vh);
  const dw = vw * s;
  const dh = vh * s;
  let cx = l.x * vw * s - (dw - cw) / 2;
  const cy = l.y * vh * s - (dh - ch) / 2;
  if (vp.mirrored) cx = cw - cx;
  // Container px → world. worldPerPx = 2/ch on both axes (isotropic).
  const worldX = (cx - cw / 2) * (2 / ch);
  const worldY = -((cy - ch / 2) * (2 / ch));
  return { x: worldX, y: worldY };
}

/** World-space distance between two landmarks. */
function worldDist(a: Landmark, b: Landmark, vp: Viewport) {
  const pa = landmarkToWorld(a, vp);
  const pb = landmarkToWorld(b, vp);
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

/**
 * Build the raw (unsmoothed) pose from one hand's landmarks. `prevAngle` keeps
 * the forearm angle continuous (unwrapped) so the smoother never sees a ±2π
 * jump. Returns null if landmarks are missing.
 */
export function computeRawPose(
  landmarks: Landmark[] | undefined,
  vp: Viewport,
  tuning: ArTuning,
  prevAngle: number
): ArPose | null {
  if (!landmarks || landmarks.length <= MIDDLE_MCP) return null;
  const wrist = landmarks[WRIST]!;
  const indexMcp = landmarks[INDEX_MCP]!;
  const middleMcp = landmarks[MIDDLE_MCP]!;

  const anchor = landmarkToWorld(wrist, vp);
  const toMiddle = landmarkToWorld(middleMcp, vp);

  // Forearm direction (wrist → middle-MCP), unwrapped near prevAngle.
  let angle = Math.atan2(toMiddle.y - anchor.y, toMiddle.x - anchor.x);
  while (angle - prevAngle > Math.PI) angle -= Math.PI * 2;
  while (angle - prevAngle < -Math.PI) angle += Math.PI * 2;

  // Scale reference: wrist → index-MCP distance (≈ wrist breadth).
  const boneLen = worldDist(wrist, indexMcp, vp);
  const radius = boneLen * tuning.scaleMultiplier;

  // Nudge the anchor up the wrist toward the fingers a touch.
  const shift = tuning.anchorForearmShift;
  const x = anchor.x + (toMiddle.x - anchor.x) * shift;
  const y = anchor.y + (toMiddle.y - anchor.y) * shift;

  return { visible: true, x, y, angle, radius };
}

/* --------------------------------------------------------- One-Euro ------ */
/* Casiez et al. "1€ Filter": low jitter at rest, low lag in motion — the
   standard choice for calm landmark smoothing. One instance per scalar. */

class OneEuro {
  private hadPrev = false;
  private xPrev = 0;
  private dxPrev = 0;
  private tPrev = 0;
  constructor(
    private minCutoff: number,
    private beta: number,
    private dCutoff = 1
  ) {}

  private alpha(cutoff: number, dt: number) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  filter(value: number, tSeconds: number, minCutoff: number, beta: number) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    if (!this.hadPrev) {
      this.hadPrev = true;
      this.xPrev = value;
      this.tPrev = tSeconds;
      return value;
    }
    const dt = Math.max(1e-3, tSeconds - this.tPrev);
    this.tPrev = tSeconds;
    const dx = (value - this.xPrev) / dt;
    const aD = this.alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = this.alpha(cutoff, dt);
    const xHat = a * value + (1 - a) * this.xPrev;
    this.xPrev = xHat;
    this.dxPrev = dxHat;
    return xHat;
  }

  reset() {
    this.hadPrev = false;
  }
}

/** Smooths a full pose (x, y, angle, radius) with independent One-Euro filters. */
export class PoseSmoother {
  private fx = new OneEuro(1, 0);
  private fy = new OneEuro(1, 0);
  private fa = new OneEuro(1, 0);
  private fr = new OneEuro(1, 0);

  smooth(raw: ArPose, tSeconds: number, tuning: ArTuning): ArPose {
    const { smoothingMinCutoff: mc, smoothingBeta: b } = tuning;
    return {
      visible: true,
      x: this.fx.filter(raw.x, tSeconds, mc, b),
      y: this.fy.filter(raw.y, tSeconds, mc, b),
      angle: this.fa.filter(raw.angle, tSeconds, mc, b),
      radius: this.fr.filter(raw.radius, tSeconds, mc, b),
    };
  }

  /** Drop history so re-acquisition snaps rather than drifts from stale state. */
  reset() {
    this.fx.reset();
    this.fy.reset();
    this.fa.reset();
    this.fr.reset();
  }
}
