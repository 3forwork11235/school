// Генератор иконок: node tools/make_icons.js  → icons/*.png и android/res/mipmap-*/ic_launcher.png
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const root = path.join(__dirname, '..');

function crc32(buf) { let c, crc = ~0; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
// фигуры в единичных координатах 0..1
function inRR(x, y, x0, y0, x1, y1, r) { if (x < x0 || x > x1 || y < y0 || y > y1) return false; const cx = Math.max(x0 + r, Math.min(x1 - r, x)), cy = Math.max(y0 + r, Math.min(y1 - r, y)); return (x - cx) ** 2 + (y - cy) ** 2 <= r * r; }
function inPoly(x, y, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; } return c; }
function inCirc(x, y, cx, cy, r) { return (x - cx) ** 2 + (y - cy) ** 2 <= r * r; }
function rot(x, y, cx, cy, a) { const c = Math.cos(a), s = Math.sin(a), dx = x - cx, dy = y - cy; return [cx + dx * c + dy * s, cy - dx * s + dy * c]; }
function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

function shade(x, y) { // цвет в точке (x, y) ∈ [0,1]²; null — прозрачно; возвращает [r,g,b,a]
  // фон — скруглённый квадрат
  if (!inRR(x, y, 0, 0, 1, 1, .22)) return null;
  let col = mix([88, 70, 220], [26, 18, 80], y * .9 + x * .1), a = 255;
  // блик
  const gl = Math.max(0, 1 - Math.hypot(x - .3, y - .15) / .55); col = mix(col, [255, 255, 255], gl * .18);
  // линии скорости
  [[.07, .38, .30], [.04, .52, .26], [.09, .66, .22]].forEach(l => { if (inRR(x, y, l[0], l[1] - .018, l[0] + l[2] * .5, l[1] + .018, .018)) col = mix(col, [255, 255, 255], .35); });
  // тетрадный лист (повёрнутый)
  const q = rot(x, y, .52, .52, -.12);
  if (inRR(q[0], q[1], .24, .2, .8, .82, .04)) {
    col = [255, 251, 234];
    if (q[0] < .335 && q[0] > .325) col = [232, 69, 107];
    if (q[0] > .335 && (Math.abs((q[1] - .2) % .062) < .0045 || Math.abs((q[0] - .24) % .062) < .0045)) col = mix(col, [70, 100, 190], .35);
  } else if (inRR(q[0], q[1] + .015, .24, .2, .8, .82, .04)) col = mix(col, [0, 0, 0], .25);
  // академическая шапочка
  const cap = [[.5, .25], [.86, .42], [.5, .58], [.14, .42]];
  const base = [[.3, .5], [.5, .6], [.7, .5], [.7, .66], [.5, .76], [.3, .66]];
  if (inPoly(x, y + .02, cap) && !inPoly(x, y, cap)) col = [60, 40, 0];
  if (inPoly(x, y, base)) col = [38, 32, 96]; if (inPoly(x, y, [[.3, .5], [.5, .6], [.7, .5], [.7, .53], [.5, .63], [.3, .53]])) col = [20, 16, 60];
  if (inPoly(x, y, cap)) col = mix([255, 213, 74], [255, 160, 20], (y - .25) / .33);
  if (inPoly(x, y, [[.5, .27], [.78, .42], [.5, .5], [.22, .42]])) col = mix(col, [255, 255, 255], .18);
  // кисточка
  if (inRR(x, y, .83, .42, .845, .66, .01)) col = [255, 213, 74]; if (inCirc(x, y, .8375, .69, .035)) col = [255, 150, 30]; if (inRR(x, y, .815, .68, .86, .76, .015)) col = [255, 180, 40];
  if (inCirc(x, y, .5, .42, .026)) col = [200, 120, 0];
  return [col[0], col[1], col[2], a];
}
function render(size, SS) {
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) { const c = shade((px + (sx + .5) / SS) / size, (py + (sy + .5) / SS) / size); if (c) { r += c[0]; g += c[1]; b += c[2]; a += 255; } }
    const n = SS * SS, o = (py * size + px) * 4, aa = a / n;
    buf[o] = aa ? r / (a / 255) : 0; buf[o + 1] = aa ? g / (a / 255) : 0; buf[o + 2] = aa ? b / (a / 255) : 0; buf[o + 3] = aa;
  }
  return png(size, size, buf);
}
const out = [['icons/icon-512.png', 512], ['icons/icon-192.png', 192], ['icons/icon-180.png', 180], ['android/res/mipmap-xxhdpi/ic_launcher.png', 180], ['android/res/mipmap-xxxhdpi/ic_launcher.png', 192]];
const cache = {};
out.forEach(([f, s]) => { const p = path.join(root, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, cache[s] || (cache[s] = render(s, s > 300 ? 3 : 4))); console.log('wrote', f, s); });
