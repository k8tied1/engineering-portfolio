import { BOARD_SIZE } from "./SudokuBoard";

export interface ImageBoard {
  grid: number[][];
  /** Cells where the match was weak or ambiguous; worth a human double-check. */
  uncertain: boolean[][];
}

const N = 24; // every glyph is normalized to an N x N bitmap

async function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Otsu's method: picks the gray level that best separates ink from background. */
function otsu(gray: Uint8Array): number {
  const hist = new Array(256).fill(0);
  for (const v of gray) hist[v]++;
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];
  let wB = 0, sumB = 0, best = 0, thr = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = gray.length - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sumAll - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; thr = t; }
  }
  return thr;
}

/** Runs of consecutive true values, as [start, end] pairs. */
function runs(flags: boolean[]): [number, number][] {
  const out: [number, number][] = [];
  let start = -1;
  flags.forEach((f, i) => {
    if (f && start < 0) start = i;
    if (!f && start >= 0) { out.push([start, i - 1]); start = -1; }
  });
  if (start >= 0) out.push([start, flags.length - 1]);
  return out;
}

/** Finds the outer edges of the grid from long horizontal/vertical lines. Falls back to the whole image. */
function findAxis(profile: Float32Array, length: number): [number, number] {
  const max = Math.max(...profile);
  const groups = runs(Array.from(profile, (p) => max > 0 && p >= 0.5 * max));
  // A full grid shows either 10 lines (all drawn) or 4 (only the thick box lines)
  if (groups.length === 4 || groups.length === 10) {
    const [a, b] = [groups[0][0], groups[groups.length - 1][1] + 1];
    if (b - a > length * 0.4) return [a, b];
  }
  return [0, length];
}

/** Connected components of the ink mask (4-connectivity). */
function components(mask: Uint8Array, w: number, h: number) {
  const label = new Int32Array(w * h).fill(-1);
  const comps: { pixels: number[]; x0: number; y0: number; x1: number; y1: number; edge: boolean }[] = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || label[i] >= 0) continue;
    const id = comps.length;
    const comp = { pixels: [] as number[], x0: w, y0: h, x1: 0, y1: 0, edge: false };
    const stack = [i];
    label[i] = id;
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % w, y = (p / w) | 0;
      comp.pixels.push(p);
      comp.x0 = Math.min(comp.x0, x); comp.x1 = Math.max(comp.x1, x);
      comp.y0 = Math.min(comp.y0, y); comp.y1 = Math.max(comp.y1, y);
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) comp.edge = true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (mask[q] && label[q] < 0) { label[q] = id; stack.push(q); }
      }
    }
    comps.push(comp);
  }
  return comps;
}

/** Scales the glyph's bounding box into an N x N bitmap (aspect kept, centered), then lightly blurs it. */
function normalize(mask: Uint8Array, w: number, x0: number, y0: number, x1: number, y1: number): Float32Array {
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const scale = (N - 4) / Math.max(bw, bh);
  const tw = bw * scale, th = bh * scale;
  const ox = (N - tw) / 2, oy = (N - th) / 2;
  const raw = new Float32Array(N * N);
  for (let ty = 0; ty < N; ty++) {
    for (let tx = 0; tx < N; tx++) {
      const sx0 = x0 + (tx - ox) / scale, sx1 = x0 + (tx + 1 - ox) / scale;
      const sy0 = y0 + (ty - oy) / scale, sy1 = y0 + (ty + 1 - oy) / scale;
      let sum = 0, count = 0;
      for (let y = Math.floor(sy0); y < Math.ceil(sy1); y++)
        for (let x = Math.floor(sx0); x < Math.ceil(sx1); x++) {
          if (x < x0 || x > x1 || y < y0 || y > y1) { count++; continue; }
          sum += mask[y * w + x]; count++;
        }
      raw[ty * N + tx] = count ? sum / count : 0;
    }
  }
  const out = new Float32Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy, xx = x + dx;
          if (yy >= 0 && yy < N && xx >= 0 && xx < N) { s += raw[yy * N + xx]; n++; }
        }
      out[y * N + x] = s / n;
    }
  return out;
}

/** Correlation between two glyph bitmaps, from -1 to 1. */
function similarity(a: Float32Array, b: Float32Array): number {
  let ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) { ma += a[i]; mb += b[i]; }
  ma /= a.length; mb /= b.length;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

const FONTS = ["Arial", "Helvetica", "Verdana", "Tahoma", "Trebuchet MS", "Georgia", "Times New Roman",
  "Courier New", "Segoe UI", "Roboto", "system-ui", "sans-serif", "serif", "monospace"];
let templates: Float32Array[][] | null = null; // templates[digit - 1] = list of bitmaps

/** Renders digits 1-9 in many system fonts to compare against. Built once. */
function getTemplates(): Float32Array[][] {
  if (templates) return templates;
  const size = 120;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  templates = Array.from({ length: 9 }, () => []);
  for (const font of FONTS)
    for (const weight of ["400", "700"])
      for (let d = 1; d <= 9; d++) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = "#000";
        ctx.font = `${weight} 90px ${font.includes(" ") ? `"${font}"` : font}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(d), size / 2, size / 2);
        const px = ctx.getImageData(0, 0, size, size).data;
        const mask = new Uint8Array(size * size);
        let x0 = size, y0 = size, x1 = 0, y1 = 0;
        for (let i = 0; i < size * size; i++) {
          if (px[i * 4] < 128) {
            mask[i] = 1;
            const x = i % size, y = (i / size) | 0;
            x0 = Math.min(x0, x); x1 = Math.max(x1, x);
            y0 = Math.min(y0, y); y1 = Math.max(y1, y);
          }
        }
        if (x1 > x0 && y1 > y0) templates[d - 1].push(normalize(mask, size, x0, y0, x1, y1));
      }
  return templates;
}

/**
 * Reads a sudoku board from an image. The grid is located automatically when its lines are visible;
 * each cell is cleaned of grid-line fragments, and the digit is matched against rendered font templates.
 */
export async function readBoardFromImage(
  blob: Blob,
  onProgress?: (cellsDone: number) => void,
): Promise<ImageBoard> {
  const img = await loadImage(blob);
  const W = img.width, H = img.height;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, W, H).data;

  const gray = new Uint8Array(W * H);
  for (let i = 0; i < gray.length; i++)
    gray[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  const thr = otsu(gray);
  let darkCount = 0;
  for (const v of gray) if (v < thr) darkCount++;
  const inkIsDark = darkCount < gray.length / 2; // ink is whichever side is the minority (handles dark themes)
  const ink = new Uint8Array(W * H);
  for (let i = 0; i < ink.length; i++) ink[i] = (inkIsDark ? gray[i] < thr : gray[i] >= thr) ? 1 : 0;

  // Locate the grid
  const rowP = new Float32Array(H), colP = new Float32Array(W);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (ink[y * W + x]) { rowP[y] += 1 / W; colP[x] += 1 / H; }
  const [gy0, gy1] = findAxis(rowP, H);
  const [gx0, gx1] = findAxis(colP, W);
  const cw = (gx1 - gx0) / BOARD_SIZE, ch = (gy1 - gy0) / BOARD_SIZE;

  const tpl = getTemplates();
  const grid: number[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
  const uncertain: boolean[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const inset = Math.max(1, Math.round(Math.min(cw, ch) * 0.05));
      const cx = Math.round(gx0 + c * cw) + inset, cy = Math.round(gy0 + r * ch) + inset;
      const w = Math.max(2, Math.round(cw) - 2 * inset), h = Math.max(2, Math.round(ch) - 2 * inset);

      const cell = new Uint8Array(w * h);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) cell[y * w + x] = ink[(cy + y) * W + (cx + x)];

      // Drop anything touching the crop edge (grid-line remnants); keep the digit's pieces
      const comps = components(cell, w, h).filter((k) => !k.edge);
      const maxArea = Math.max(0, ...comps.map((k) => k.pixels.length));
      const parts = comps.filter((k) => k.pixels.length >= 0.1 * maxArea);
      if (maxArea < 0.012 * w * h || !parts.length) { onProgress?.(r * BOARD_SIZE + c + 1); continue; } // empty

      const x0 = Math.min(...parts.map((k) => k.x0)), x1 = Math.max(...parts.map((k) => k.x1));
      const y0 = Math.min(...parts.map((k) => k.y0)), y1 = Math.max(...parts.map((k) => k.y1));
      if (y1 - y0 + 1 < 0.25 * h) { onProgress?.(r * BOARD_SIZE + c + 1); continue; } // specks, not a digit

      const clean = new Uint8Array(w * h);
      for (const k of parts) for (const p of k.pixels) clean[p] = 1;
      const glyph = normalize(clean, w, x0, y0, x1, y1);

      const scores = tpl.map((list) => Math.max(...list.map((t) => similarity(glyph, t))));
      const order = scores.map((s, i) => [s, i + 1] as const).sort((a, b) => b[0] - a[0]);
      grid[r][c] = order[0][1];
      uncertain[r][c] = order[0][0] < 0.6 || order[0][0] - order[1][0] < 0.08;

      onProgress?.(r * BOARD_SIZE + c + 1);
    }
    await new Promise((res) => setTimeout(res)); // let the UI update between rows
  }
  return { grid, uncertain };
}
