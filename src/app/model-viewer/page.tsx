import type { Metadata } from "next";

import { ModelViewer } from "@/components/studio/model-viewer";

// Hidden test route (not linked anywhere, not indexed) for comparing a real 3D
// model charm against the flat/extruded photo charms.
export const metadata: Metadata = {
  title: "3D charm test",
  robots: { index: false, follow: false },
};

export default function ModelViewerPage() {
  return <ModelViewer src="/charms/keyheart.glb" />;
}
