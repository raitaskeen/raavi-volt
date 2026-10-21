// Generates the app icons and social share image as PNGs with no dependencies:
// a tiny anti-aliased rasterizer (rounded rects + the bolt polygon) and a PNG
// encoder on node:zlib. Run: `bun run icons`
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

type RGBA = [number, number, number, number];
const MATTE: RGBA = [21, 21, 21, 255];
const VOLT: RGBA = [212, 255, 58, 255];
const CLEAR: RGBA = [0, 0, 0, 0];

// The logo bolt, in a 32×32 design grid (same path as the SVG logo).
const BOLT: [number, number][] = [
  [18.5, 5],
  [9, 18],
  [15.2, 18],
  [13.5, 27],
  [23, 14],
  [16.7, 14],
  [18.5, 5],
];

function inPolygon(x: number, y: number, poly: [number, number][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inRoundRect(x: number, y: number, rx: number, ry: number, w: number, h: number, r: number) {
  if (x < rx || y < ry || x > rx + w || y > ry + h) return false;
  const cx = Math.min(Math.max(x, rx + r), rx + w - r);
  const cy = Math.min(Math.max(y, ry + r), ry + h - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

type Shape = (x: number, y: number) => boolean;

/** Paints shapes in order with 4×4 supersampling for smooth edges. */
function render(width: number, height: number, background: RGBA, layers: { shape: Shape; color: RGBA }[]) {
  const px = new Uint8Array(width * height * 4);
  const S = 4;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const fx = x + (sx + 0.5) / S;
          const fy = y + (sy + 0.5) / S;
          let c = background;
          for (const l of layers) if (l.shape(fx, fy)) c = l.color;
          const alpha = c[3] / 255;
          r += c[0] * alpha; g += c[1] * alpha; b += c[2] * alpha; a += alpha;
        }
      }
      const i = (y * width + x) * 4;
      const n = S * S;
      px[i] = a ? Math.round(r / a) : 0;
      px[i + 1] = a ? Math.round(g / a) : 0;
      px[i + 2] = a ? Math.round(b / a) : 0;
      px[i + 3] = Math.round((a / n) * 255);
    }
  }
  return px;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf: Uint8Array) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Uint8Array) {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(new TextEncoder().encode(type), 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
function png(width: number, height: number, rgba: Uint8Array) {
  const raw = new Uint8Array((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
  const ihdr = new Uint8Array(13);
  const v = new DataView(ihdr.buffer);
  v.setUint32(0, width);
  v.setUint32(4, height);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", new Uint8Array())];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) (out.set(p, o), (o += p.length));
  return out;
}

/** Bolt scaled so its 32-unit design box maps to `size` px at (ox, oy). */
const bolt = (ox: number, oy: number, size: number): Shape => {
  const k = size / 32;
  const poly = BOLT.map(([x, y]) => [ox + x * k, oy + y * k] as [number, number]);
  return (x, y) => inPolygon(x, y, poly);
};

/** Logo tile: matte rounded square + volt bolt (transparent outside). */
function logoIcon(size: number) {
  return render(size, size, CLEAR, [
    { shape: (x, y) => inRoundRect(x, y, 0, 0, size, size, size * 0.22), color: MATTE },
    { shape: bolt(0, 0, size), color: VOLT },
  ]);
}

/** Full-bleed square (maskable / Apple): bolt kept inside the 80% safe zone. */
function fullBleed(size: number, boltScale: number) {
  const b = size * boltScale;
  return render(size, size, MATTE, [{ shape: bolt((size - b) / 2, (size - b) / 2, b), color: VOLT }]);
}

/** 1200×630 share card: volt field, faint grid, large logo tile. */
function shareImage() {
  const W = 1200, H = 630, tile = 300;
  const tx = (W - tile) / 2, ty = (H - tile) / 2;
  const grid: Shape = (x, y) => x % 48 < 1.5 || y % 48 < 1.5;
  return render(W, H, VOLT, [
    { shape: grid, color: [190, 232, 40, 255] },
    { shape: (x, y) => inRoundRect(x, y, tx + 14, ty + 18, tile, tile, 66), color: [150, 190, 20, 255] },
    { shape: (x, y) => inRoundRect(x, y, tx, ty, tile, tile, 66), color: MATTE },
    { shape: bolt(tx, ty, tile), color: VOLT },
  ]);
}

mkdirSync("public/icons", { recursive: true });
const write = (path: string, w: number, h: number, data: Uint8Array) => {
  writeFileSync(path, png(w, h, data));
  console.log(`  ${path} (${w}×${h})`);
};
console.log("Generating icons…");
write("public/icons/icon-192.png", 192, 192, logoIcon(192));
write("public/icons/icon-512.png", 512, 512, logoIcon(512));
write("public/icons/maskable-512.png", 512, 512, fullBleed(512, 0.62));
write("src/app/apple-icon.png", 180, 180, fullBleed(180, 0.78));
write("src/app/opengraph-image.png", 1200, 630, shareImage());
write("src/app/twitter-image.png", 1200, 630, shareImage());
