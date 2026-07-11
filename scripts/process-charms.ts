/**
 * One-off: split public/charms/source.png (a 2x2 grid of antique-gold charms on
 * a cream background) into four clean, background-free, trimmed PNGs, and emit a
 * simple extrusion outline (contour) for each so the studio can render them as
 * real 3D charms. Run: npx tsx scripts/process-charms.ts
 */
import Jimp from "jimp";

const SRC = "public/charms/source.png";
const OUT = "public/charms";

// Quadrant crops (322x365). Bottom labels fall away with keep-largest-component.
const REGIONS = [
  { name: "key", x: 0, y: 0, w: 161, h: 182 },
  { name: "padlock", x: 161, y: 0, w: 161, h: 182 },
  { name: "butterfly", x: 0, y: 182, w: 161, h: 183 },
  { name: "feather", x: 161, y: 182, w: 161, h: 183 },
];

const TOL = 60; // colour distance to background that counts as background
const SOFT = 26; // soft feather band above TOL to avoid a hard cream halo

type Img = Awaited<ReturnType<typeof Jimp.read>>;

function idx(x: number, y: number, w: number) {
  return (y * w + x) * 4;
}

/** Median-ish background colour from the border pixels. */
function borderBg(img: Img): [number, number, number] {
  const { data, width: w, height: h } = img.bitmap;
  let r = 0, g = 0, b = 0, n = 0;
  const sample = (x: number, y: number) => {
    const i = idx(x, y, w);
    r += data[i]!; g += data[i + 1]!; b += data[i + 2]!; n++;
  };
  for (let x = 0; x < w; x++) { sample(x, 0); sample(x, h - 1); }
  for (let y = 0; y < h; y++) { sample(0, y); sample(w - 1, y); }
  return [r / n, g / n, b / n];
}

/** Knock out background by colour distance, with a soft edge. */
function removeBg(img: Img) {
  const { data, width: w, height: h } = img.bitmap;
  const [br, bg, bb] = borderBg(img);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y, w);
      const d = Math.hypot(data[i]! - br, data[i + 1]! - bg, data[i + 2]! - bb);
      if (d < TOL) data[i + 3] = 0;
      else if (d < TOL + SOFT) data[i + 3] = Math.round(((d - TOL) / SOFT) * 255);
    }
  }
}

/** Keep only the largest opaque connected component (drops specks / label text). */
function keepLargest(img: Img) {
  const { data, width: w, height: h } = img.bitmap;
  const label = new Int32Array(w * h).fill(-1);
  const opaque = (p: number) => data[idx((p % w), Math.floor(p / w), w) + 3]! > 20;
  let best = -1, bestCount = 0, cur = 0;
  const stack: number[] = [];
  for (let p = 0; p < w * h; p++) {
    if (label[p] !== -1 || !opaque(p)) continue;
    let count = 0;
    stack.push(p);
    label[p] = cur;
    while (stack.length) {
      const q = stack.pop()!;
      count++;
      const qx = q % w, qy = Math.floor(q / w);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = qx + dx, ny = qy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const np = ny * w + nx;
          if (label[np] === -1 && opaque(np)) { label[np] = cur; stack.push(np); }
        }
      }
    }
    if (count > bestCount) { bestCount = count; best = cur; }
    cur++;
  }
  for (let p = 0; p < w * h; p++) {
    if (label[p] !== best) data[idx((p % w), Math.floor(p / w), w) + 3] = 0;
  }
}

/** Tight bounding box of opaque pixels. */
function bbox(img: Img) {
  const { data, width: w, height: h } = img.bitmap;
  let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[idx(x, y, w) + 3]! > 20) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) return { x: 0, y: 0, w, h };
  const pad = 2;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/* ---- outline tracing (Moore-neighbour) + simplify, for 3D extrusion ---- */

// 8 neighbours clockwise starting East.
const N8: [number, number][] = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];

function traceContour(img: Img): [number, number][] | null {
  const { data, width: w, height: h } = img.bitmap;
  const on = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && data[idx(x, y, w) + 3]! > 100;

  // Start at the first foreground pixel that has a foreground neighbour (so we
  // never start on an isolated feathered speck, which stalls the trace).
  let sx = -1, sy = -1;
  outer: for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!on(x, y)) continue;
      let hasN = false;
      for (const [dx, dy] of N8) if (on(x + dx, y + dy)) { hasN = true; break; }
      if (hasN) { sx = x; sy = y; break outer; }
    }
  if (sx < 0) return null;

  const contour: [number, number][] = [];
  let cx = sx, cy = sy, bx = sx - 1, by = sy;
  let guard = w * h * 8;
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

/** Ramer–Douglas–Peucker polyline simplification. */
function rdp(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length < 3) return pts;
  let maxD = 0, index = 0;
  const [ax, ay] = pts[0]!;
  const [bx, by] = pts[pts.length - 1]!;
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i]!;
    const d = Math.abs((px - ax) * dy - (py - ay) * dx) / len;
    if (d > maxD) { maxD = d; index = i; }
  }
  if (maxD > eps) {
    const left = rdp(pts.slice(0, index + 1), eps);
    const right = rdp(pts.slice(index), eps);
    return [...left.slice(0, -1), ...right];
  }
  return [pts[0]!, pts[pts.length - 1]!];
}

/** Normalise pixel contour → centred, y-up, max dimension 1. */
function normalize(pts: [number, number][], w: number, h: number) {
  const s = 1 / Math.max(w, h);
  return pts.map(([x, y]) => [(x - w / 2) * s, (h / 2 - y) * s] as [number, number]);
}

/** Rasterise the simplified polygon (even-odd fill) to a PNG for visual review. */
async function rasterize(pts: [number, number][], w: number, h: number, path: string) {
  const img = new Jimp(w, h, 0xfaf8f5ff);
  const gold = Jimp.rgbaToInt(176, 141, 87, 255);
  for (let y = 0; y < h; y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i]!;
      const [x2, y2] = pts[(i + 1) % pts.length]!;
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
  const src = await Jimp.read(SRC);
  const fs = await import("node:fs/promises");
  for (const r of REGIONS) {
    const img = src.clone().crop(r.x, r.y, r.w, r.h);
    removeBg(img);
    keepLargest(img);
    const box = bbox(img);
    const out = img.clone().crop(box.x, box.y, box.w, box.h);
    await out.writeAsync(`${OUT}/${r.name}.png`);

    const w = box.w, h = box.h;
    const raw = traceContour(out);
    if (!raw) { console.log(`  ! ${r.name}: no contour`); continue; }
    const simp = rdp(raw, 1.4);
    const points = normalize(simp, w, h);
    await fs.writeFile(
      `${OUT}/${r.name}.json`,
      JSON.stringify({ points, aspect: w / h })
    );
    await rasterize(simp, w, h, `${OUT}/${r.name}-outline.png`);
    console.log(`  ✓ ${r.name}: ${w}x${h}, ${points.length} outline pts`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
