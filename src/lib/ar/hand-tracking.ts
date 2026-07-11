/**
 * MediaPipe HandLandmarker wrapper (Tasks API). Dynamically imported so the
 * heavy WASM + model load ONLY on the AR route. Assets are self-hosted under
 * /public/mediapipe (works on any HTTPS origin — no CDN, no localhost baked in).
 */
import type { Landmark } from "./pose";

const WASM_PATH = "/mediapipe/wasm";
const MODEL_PATH = "/mediapipe/hand_landmarker.task";
// Downscale detection input for speed; landmarks are normalized so the on-screen
// mapping is unaffected by this resolution.
const DETECT_MAX = 256;

/** One frame of detection: 2D image landmarks (for screen placement) + 3D
 *  metric world landmarks (for orientation). */
export type HandFrame = { image: Landmark[]; world: Landmark[] };

export class HandTracker {
  // Loosely typed: the class shape comes from the dynamically-imported module.
  private landmarker: {
    detectForVideo: (
      input: HTMLCanvasElement,
      t: number
    ) => { landmarks?: Landmark[][]; worldLandmarks?: Landmark[][] };
    close: () => void;
  } | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  async init(): Promise<void> {
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_PATH);
    this.landmarker = (await vision.HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATH, delegate: "GPU" },
      runningMode: "VIDEO",
      numHands: 1,
    })) as unknown as HandTracker["landmarker"];

    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
  }

  /** Detect on the current video frame; returns the first hand's 2D + 3D
   *  landmarks or null. `tMs` must be monotonically increasing. */
  detect(video: HTMLVideoElement, tMs: number): HandFrame | null {
    if (!this.landmarker || !this.canvas || !this.ctx) return null;
    if (!video.videoWidth || !video.videoHeight) return null;

    const scale = Math.min(1, DETECT_MAX / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    this.ctx.drawImage(video, 0, 0, w, h);

    const result = this.landmarker.detectForVideo(this.canvas, tMs);
    const image = result.landmarks?.[0];
    const world = result.worldLandmarks?.[0];
    if (!image || image.length === 0 || !world || world.length === 0) return null;
    return { image, world };
  }

  close(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
