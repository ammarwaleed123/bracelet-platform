/**
 * Bridge for capturing a PNG thumbnail of the studio canvas from outside the
 * R3F tree. The scene registers a capture function (which renders a fresh
 * frame and reads the WebGL buffer); the Save flow calls captureThumbnail().
 */
type CaptureFn = () => string | null;

let captureFn: CaptureFn | null = null;

export function registerCapture(fn: CaptureFn | null) {
  captureFn = fn;
}

export function captureThumbnail(): string | null {
  try {
    return captureFn?.() ?? null;
  } catch {
    return null;
  }
}
