/**
 * Slim a .glb charm model for the web, in place: decimate geometry with
 * meshoptimizer and shrink/recompress its textures. A ~half-million-triangle,
 * 20MB photogrammetry scan comes out ~1-2MB with no visible loss at charm size.
 *
 * Usage: npx tsx scripts/optimize-model.mjs <path.glb> [triangleRatio=0.08]
 */
import { NodeIO } from "@gltf-transform/core";
import { simplify, weld, prune, dedup, textureCompress } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import { promises as fs } from "node:fs";

const [, , FILE, RATIO = "0.08"] = process.argv;
if (!FILE) throw new Error("usage: npx tsx scripts/optimize-model.mjs <path.glb> [ratio]");

const before = (await fs.stat(FILE)).size;
const io = new NodeIO();
const doc = await io.read(FILE);

await MeshoptSimplifier.ready;
await doc.transform(
  weld({ tolerance: 0.0001 }),
  simplify({ simplifier: MeshoptSimplifier, ratio: Number(RATIO), error: 0.0015 }),
  dedup(),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: "jpeg", resize: [1024, 1024], quality: 85 }),
);

await io.write(FILE, doc);
const after = (await fs.stat(FILE)).size;
console.log(`${FILE}: ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB`);
