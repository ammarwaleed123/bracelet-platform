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
  /** Slide the anchor along the wrist; negative sits it toward the forearm
   *  (below the wrist crease) rather than up onto the hand. */
  anchorForearmShift: -0.08,
  /** Orientation slerp factor per 1/60 s (frame-rate corrected in the renderer).
   *  Lower = calmer/laggier, higher = snappier. */
  orientSlerp: 0.4,
  /** Corrects the world-landmark depth sign (+1 or −1). Flip once on-device if
   *  the band tips the wrong way toward/away from the camera. */
  axisZSign: -1,
  /** Invisible wrist occluder radius vs. the ring radius. Hides the back half
   *  of the bracelet behind the wrist so it wraps like a real bracelet. Larger
   *  = more of the bracelet hidden (thicker apparent wrist), leaving mainly the
   *  front arc over the top of the wrist. */
  occluderRadiusFactor: 0.9,
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
  /** Forearm axis in camera space (three.js coords: +x right, +y up, +z toward
   *  camera). The ring wraps around this; its 3D tilt tracks the real wrist. */
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

// Landmark indices we rely on (MediaPipe hand model).
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

/** World-space distance between two landmarks. */
function worldDist(a: Landmark, b: Landmark, vp: Viewport) {
  const pa = landmarkToWorld(a, vp);
  const pb = landmarkToWorld(b, vp);
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

/**
 * Build the raw (unsmoothed) pose. Screen anchor + scale come from the 2D image
 * landmarks; the 3D orientation (so the band tilts with the real wrist) comes
 * from the metric world landmarks. Returns null if landmarks are missing.
 */
export function computeRawPose(
  image: Landmark[] | undefined,
  world: Landmark[] | undefined,
  vp: Viewport,
  tuning: ArTuning
): ArPose | null {
  if (!image || image.length <= PINKY_MCP) return null;

  const wrist = image[WRIST]!;
  const indexMcp = image[INDEX_MCP]!;
  const pinkyMcp = image[PINKY_MCP]!;

  const anchor = landmarkToWorld(wrist, vp);
  const toMiddle = landmarkToWorld(image[MIDDLE_MCP]!, vp);

  // Scale reference: knuckle breadth (index-MCP → pinky-MCP). Far more stable
  // than palm length as the hand tilts, and tracks wrist width well.
  const boneLen = worldDist(indexMcp, pinkyMcp, vp);
  const radius = boneLen * tuning.scaleMultiplier;

  // Nudge the anchor along the wrist (negative = toward the forearm).
  const shift = tuning.anchorForearmShift;
  const x = anchor.x + (toMiddle.x - anchor.x) * shift;
  const y = anchor.y + (toMiddle.y - anchor.y) * shift;

  // The ring normal = the forearm axis, as a genuine unit 3D vector:
  //  • screen direction (ux,uy) from the reliable 2D image landmarks — this
  //    guarantees the band lines up with the visible arm (reading the screen
  //    direction from world landmarks is what flipped it face-on before);
  //  • depth az from the world landmarks (true toward/away-camera pitch).
  // Arm across frame → az≈0 → edge-on band; arm at camera → |az|→1 → circle.
  let ux = toMiddle.x - anchor.x;
  let uy = toMiddle.y - anchor.y;
  const ulen = Math.hypot(ux, uy) || 1;
  ux /= ulen;
  uy /= ulen;

  const az = clamp(forearmDepth(world, tuning), -0.98, 0.98);
  const inPlane = Math.sqrt(Math.max(0, 1 - az * az));

  return { visible: true, x, y, radius, ax: ux * inPlane, ay: uy * inPlane, az };
}

/**
 * Normalized depth (z-component) of the forearm axis from the metric world
 * landmarks: the axis runs from the knuckle centroid (avg MCP 5/9/13) to the
 * wrist. MediaPipe world is x-right, y-DOWN, smaller z = closer to camera; we
 * only need the z-ratio here, so the whole coordinate mapping reduces to the
 * single `axisZSign` flip (three.js +z is toward the camera). Mirror-invariant.
 */
function forearmDepth(world: Landmark[] | undefined, tuning: ArTuning): number {
  if (!world || world.length <= PINKY_MCP) return 0;
  const w0 = world[WRIST]!;
  let mx = 0;
  let my = 0;
  let mz = 0;
  for (const i of [INDEX_MCP, MIDDLE_MCP, RING_MCP]) {
    const w = world[i]!;
    mx += w.x;
    my += w.y;
    mz += w.z;
  }
  const dx = w0.x - mx / 3;
  const dy = w0.y - my / 3;
  const dz = w0.z - mz / 3;
  const len = Math.hypot(dx, dy, dz) || 1;
  return (dz / len) * tuning.axisZSign;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
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
