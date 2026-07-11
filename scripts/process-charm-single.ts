/**
 * Process ONE already-transparent charm PNG into a web-sized cut-out + traced
 * 3D outline (no background removal needed). Usage:
 *   npx tsx scripts/process-charm-single.ts <input.png> <slug> [maxDim]
 */
import Jimp from "jimp";

const [, , INPUT, SLUG, MAX = "640"] = process.argv;
const OUT = "public/charms";
const maxDim = Number(MAX);

type Img = Awaited<ReturnType<typeof Jimp.read>>;
const A = 128; // alpha threshold for "opaque"

function idx(x: number, y: number, w: number) {
  return (y * w + x) * 4;
}

function alphaBBox(img: Img) {
  const { data, width: w, height: h } = img.bitmap;
  let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[idx(x, y, w) + 3]! > A) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
  if (!found) return { x: 0, y: 0, w, h };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

const N8: [number, number][] = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];

function traceContour(img: Img): [number, number][] | null {
  const { data, width: w, height: h } = img.bitmap;
  const on = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && data[idx(x, y, w) + 3]! > A;
  let sx = -1, sy = -1;
  outer: for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!on(x, y)) continue;
      for (const [dx, dy] of N8) if (on(x + dx, y + dy)) { sx = x; sy = y; break outer; }
    }
  if (sx < 0) return null;
  const contour: [number, number][] = [];
  let cx = sx, cy = sy, bx = sx - 1, by = sy, guard = w * h * 8;
  do {
    contour.push([cx, cy]);
    let bi = 0;
    for (let i = 0; i < 8; i++)
      if (cx + N8[i]![0] === bx && cy + N8[i]![1] === by) { bi = i; break; }
    let found = false;
    for (let k = 1; k <= 8; k++) {
      const i = (bi + k) % 8;
      const nx = cx + N8[i]![0], ny = cy + N8[i]![1];
      if (on(nx, ny)) {
        const pi = (bi + k - 1) % 8;
        bx = cx + N8[pi]![0]; by = cy + N8[pi]![1];
        cx = nx; cy = ny; found = true; break;
      }
    }
    if (!found || --guard <= 0) break;
  } while (!(cx === sx && cy === sy));
  return contour.length > 8 ? contour : null;
}

function rdp(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length < 3) return pts;
  let maxD = 0, index = 0;
  const [ax, ay] = pts[0]!, [bx, by] = pts[pts.length - 1]!;
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i]!;
    const d = Math.abs((px - ax) * dy - (py - ay) * dx) / len;
    if (d > maxD) { maxD = d; index = i; }
  }
  if (maxD > eps) {
    const l = rdp(pts.slice(0, index + 1), eps);
    const r = rdp(pts.slice(index), eps);
    return [...l.slice(0, -1), ...r];
  }
  return [pts[0]!, pts[pts.length - 1]!];
}

async function rasterize(pts: [number, number][], w: number, h: number, path: string) {
  const img = new Jimp(w, h, 0xfaf8f5ff);
  const gold = Jimp.rgbaToInt(176, 141, 87, 255);
  for (let y = 0; y < h; y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i]!, [x2, y2] = pts[(i + 1) % pts.length]!;
      if (y1 <= y === y2 <= y) continue;
      xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.ceil(xs[k]!); x <= Math.floor(xs[k + 1]!); x++)
        if (x >= 0 && x < w) img.setPixelColor(gold, x, y);
  }
  await img.writeAsync(path);
}

async function main() {
  if (!INPUT || !SLUG) throw new Error("usage: <input.png> <slug> [maxDim]");
  const fs = await import("node:fs/promises");
  const src = await Jimp.read(INPUT);
  const box = alphaBBox(src);
  const img = src.clone().crop(box.x, box.y, box.w, box.h);
  const scale = Math.min(1, maxDim / Math.max(img.bitmap.width, img.bitmap.height));
  if (scale < 1) img.resize(Math.round(img.bitmap.width * scale), Math.round(img.bitmap.height * scale));
  await img.writeAsync(`${OUT}/${SLUG}.png`);

  const w = img.bitmap.width, h = img.bitmap.height;
  const raw = traceContour(img);
  if (!raw) throw new Error("no contour traced");
  const simp = rdp(raw, 1.6);
  const s = 1 / Math.max(w, h);
  const points = simp.map(([x, y]) => [(x - w / 2) * s, (h / 2 - y) * s] as [number, number]);
  await fs.writeFile(`${OUT}/${SLUG}.json`, JSON.stringify({ points, aspect: w / h }));
  await rasterize(simp, w, h, `${OUT}/${SLUG}-outline.png`);
  console.log(`  ✓ ${SLUG}: ${w}x${h}, ${points.length} outline pts`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
