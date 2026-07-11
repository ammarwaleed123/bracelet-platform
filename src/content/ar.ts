/**
 * User-facing copy for the AR "See It On My Wrist" prototype.
 *
 * Per CLAUDE.md, no user-facing string is hardcoded in a component — they live
 * here so the UI can be translated later without an i18n framework.
 */

export const arContent = {
  title: "See it on your wrist",

  // Branded pre-permission explainer, shown before we request the camera.
  explainer: {
    eyebrow: "Try it on",
    heading: "See your bracelet on your wrist",
    body: "We’ll use your camera to place your design on your wrist in real time. Nothing is recorded or uploaded — the preview stays on your device.",
    cta: "Enable camera",
    back: "Back to the studio",
  },

  // Shown while the camera + tracking model are loading.
  loading: "Warming up the camera…",

  // Guidance overlay when no wrist is detected in frame.
  guidance: {
    heading: "Point the camera at your wrist",
    body: "Hold your hand up, palm toward the camera, at a comfortable distance.",
  },

  // Camera permission denied / blocked.
  denied: {
    heading: "Camera access is off",
    body: "To try the wrist preview, allow camera access for this site in your browser settings, then reload. You can keep designing in the 3D studio in the meantime.",
    retry: "Try again",
    back: "Back to the studio",
  },

  // Desktop or a device without a usable camera.
  unsupported: {
    heading: "Open this on your phone",
    body: "The wrist preview needs a phone camera. Scan this code with your phone to try it on.",
    back: "Back to the studio",
  },

  controls: {
    flipCamera: "Flip camera",
    exit: "Exit",
  },
} as const;
