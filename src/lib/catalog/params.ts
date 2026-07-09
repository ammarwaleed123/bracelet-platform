import type { Material3dParams, Model3dParams } from "@/lib/db/schema";

export type BaseType = "chain" | "cord" | "bangle";
export type BeadFinish = "polished" | "matte" | "faceted" | "metallic";

/**
 * Derive a base's 3D/material params from its type + color. Centralized so the
 * seed and the admin produce identical params the studio can rely on.
 */
export function baseParams(type: BaseType, colorHex: string): Model3dParams {
  switch (type) {
    case "chain":
      return { color: colorHex, thickness: 0.14, metalness: 0.9, roughness: 0.25 };
    case "cord":
      return { color: colorHex, thickness: 0.22, metalness: 0, roughness: 0.85 };
    case "bangle":
      return { color: colorHex, thickness: 0.3, metalness: 0.9, roughness: 0.2 };
  }
}

/** Derive a bead/charm PBR material from its finish + color. */
export function beadParams(
  finish: BeadFinish,
  colorHex: string,
  transmission?: number
): Material3dParams {
  switch (finish) {
    case "polished":
      return { color: colorHex, roughness: 0.25, metalness: 0 };
    case "matte":
      return { color: colorHex, roughness: 0.85, metalness: 0 };
    case "faceted":
      return { color: colorHex, roughness: 0.1, metalness: 0, transmission: transmission ?? 0.4 };
    case "metallic":
      return { color: colorHex, roughness: 0.3, metalness: 1 };
  }
}
