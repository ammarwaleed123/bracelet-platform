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
  /** Bracelet ring radius vs. the knuckle-breadth reference. Tuned so the ring
   *  sits snug on the wrist rather than engulfing the whole hand. */
  scaleMultiplier: 0.4,
  /** Slide the anchor toward the elbow (× ring radius) so it rests where a
   *  bracelet sits, just below the wrist bone rather than up on the hand. */
  anchorForearmShift: 0.4,
  /** Orientation slerp factor per 1/60 s (frame-rate corrected in the renderer).
   *  Lower = calmer/laggier, higher = snappier. */
  orientSlerp: 0.4,
  /** Consistent tilt of the ring toward the camera (deg): sets how open the
   *  bracelet ELLIPSE is. ~20° gives a foreshortened ~3:1 ellipse (a worn
   *  bracelet wrapping the wrist); 0 = edge-on line, 90 = face-on circle. Stable
   *  constant (depth is too noisy to drive per-frame), same in every position. */
  wrapTiltDeg: 20,
  /** Invisible wrist occluder radius vs. the ring radius. 0 disables it so the
   *  FULL bracelet ellipse (the whole loop) shows — matching a worn-bracelet
   *  preview. Raise it to hide the back of the ring behind the wrist instead. */
  occluderRadiusFactor: 0,
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
  /** Target ring radius in world units. */
  radius: number;
  /** Ring normal in camera space (three.js coords: +x right, +y up, +z toward
   *  camera): the forearm's screen direction plus a consistent wrap tilt. */
  ax: number;
  ay: number;
  az: number;
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

// Landmark indices we rely on (MediaPipe hand model — MCP = knuckle joints).
const WRIST = 0;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const RING_MCP = 13;
const PINKY_MCP = 17;

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

/**
 * Build the raw (unsmoothed) pose. Screen anchor + scale come from the 2D image
 * landmarks; the 3D orientation (so the band tilts with the real wrist) comes
 * from the metric world landmarks. Returns null if landmarks are missing.
 */
export function computeRawPose(
  image: Landmark[] | undefined,
  vp: Viewport,
  tuning: ArTuning
): ArPose | null {
  if (!image || image.length <= PINKY_MCP) return null;

  const wrist = landmarkToWorld(image[WRIST]!, vp);
  const p5 = landmarkToWorld(image[INDEX_MCP]!, vp);
  const p9 = landmarkToWorld(image[MIDDLE_MCP]!, vp);
  const p13 = landmarkToWorld(image[RING_MCP]!, vp);
  const p17 = landmarkToWorld(image[PINKY_MCP]!, vp);

  // Direction from the WRIST to the CENTRE OF THE KNUCKLES. This is the bracelet
  // axis: the charm (centre point) faces along it toward the knuckles, and the
  // band lies perpendicular to it (across the wrist). This is what stays correct
  // as the arm rotates (vertical arm → horizontal band, and vice-versa).
  const kcx = (p5.x + p9.x + p13.x + p17.x) / 4;
  const kcy = (p5.y + p9.y + p13.y + p17.y) / 4;
  let kx = kcx - wrist.x;
  let ky = kcy - wrist.y;
  const kLen = Math.hypot(kx, ky) || 1;
  kx /= kLen;
  ky /= kLen;

  // Scale from the knuckle breadth (index-MCP → pinky-MCP), stable for a fist.
  const breadth = Math.hypot(p17.x - p5.x, p17.y - p5.y) || 1;
  const radius = breadth * tuning.scaleMultiplier;

  // Sit the ring at the wrist, nudged toward the elbow (away from the knuckles).
  const off = radius * tuning.anchorForearmShift;
  const x = wrist.x - kx * off;
  const y = wrist.y - ky * off;

  // Ring normal: screen projection points toward the knuckles (kx,ky), plus a
  // consistent depth tilt so the ring reads as a foreshortened ellipse. The band
  // therefore spans perpendicular to the knuckle direction = across the wrist.
  const tilt = (tuning.wrapTiltDeg * Math.PI) / 180;
  const inPlane = Math.cos(tilt);
  return { visible: true, x, y, radius, ax: kx * inPlane, ay: ky * inPlane, az: Math.sin(tilt) };
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

/** Smooths a full pose (position, radius, and 3D axis) with One-Euro filters.
 *  Smoothing the axis components then normalizing keeps orientation continuous
 *  with no angle wraparound to worry about. */
export class PoseSmoother {
  private fx = new OneEuro(1, 0);
  private fy = new OneEuro(1, 0);
  private fr = new OneEuro(1, 0);
  private fax = new OneEuro(1, 0);
  private fay = new OneEuro(1, 0);
  private faz = new OneEuro(1, 0);

  smooth(raw: ArPose, tSeconds: number, tuning: ArTuning): ArPose {
    const { smoothingMinCutoff: mc, smoothingBeta: b } = tuning;
    return {
      visible: true,
      x: this.fx.filter(raw.x, tSeconds, mc, b),
      y: this.fy.filter(raw.y, tSeconds, mc, b),
      radius: this.fr.filter(raw.radius, tSeconds, mc, b),
      ax: this.fax.filter(raw.ax, tSeconds, mc, b),
      ay: this.fay.filter(raw.ay, tSeconds, mc, b),
      az: this.faz.filter(raw.az, tSeconds, mc, b),
    };
  }

  /** Drop history so re-acquisition snaps rather than drifts from stale state. */
  reset() {
    this.fx.reset();
    this.fy.reset();
    this.fr.reset();
    this.fax.reset();
    this.fay.reset();
    this.faz.reset();
  }
}
