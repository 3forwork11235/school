const fs=require('fs');let s=fs.readFileSync('content4.js','utf8');
// helper
s=s.replace("def('derivgraph', {", `// рисунок кубической функции с экстремумами в m и n, график центрирован вокруг оси Ox
function cubicFig(e) {
  const f0 = x => x * x * x + e.A * x * x + e.B * x, fm = f0(e.m), fn = f0(e.n), a0 = -Math.round((fm + fn) / 2);
  const lo = Math.min(fm, fn) + a0, hi = Math.max(fm, fn) + a0, pad = Math.max(2, Math.ceil((hi - lo) * .5));
  return { t: 'fn', kind: 'cubic', p: { a3: 1, a2: e.A, a1: e.B, a0: a0 }, xr: [-7, 7], yr: [Math.min(Math.floor(lo - pad), -1), Math.max(Math.ceil(hi + pad), 1)] };
}
def('derivgraph', {`);
// replace the three usages
s=s.replace(/const e = cubicExt\(\), fn = x => x \* x \* x \+ e\.A \* x \* x \+ e\.B \* x;\n      const lo = [^\n]*\n      const fig = [^\n]*\n/, "const e = cubicExt(), fig = cubicFig(e);\n");
s=s.replace(/const e = cubicExt\(\), fn = x => x \* x \* x \+ e\.A \* x \* x \+ e\.B \* x, lo = [^\n]*\n      const fig = [^\n]*\n/, "const e = cubicExt(), fig = cubicFig(e);\n");
s=s.replace(/const e = cubicExt\(\), fn = x => x \* x \* x \+ e\.A \* x \* x \+ e\.B \* x, lo = [^\n]*\n      const fig = [^\n]*\n/, "const e = cubicExt(), fig = cubicFig(e);\n");
fs.writeFileSync('content4.js',s);
// figures: parallelogram height only without ang; rhomb label positions
let f=fs.readFileSync('figures.js','utf8');
f=f.replace("  const ft = [Q[3][0], Q[0][1]];\n  c.save(); dashed(c, true); c.strokeStyle = FI.acc; c.beginPath(); c.moveTo(Q[3][0], Q[3][1]); c.lineTo(ft[0], ft[1]); c.stroke(); c.restore();\n  rightMark(c, ft, Q[3], Q[1], 9);\n  fgText(c, 'h = ' + f.h, ft[0] + 24, (Q[3][1] + ft[1]) / 2, { color: FI.acc });\n  if (f.ang)","  const ft = [Q[3][0], Q[0][1]];\n  if (!f.ang) {\n    c.save(); dashed(c, true); c.strokeStyle = FI.acc; c.beginPath(); c.moveTo(Q[3][0], Q[3][1]); c.lineTo(ft[0], ft[1]); c.stroke(); c.restore();\n    rightMark(c, ft, Q[3], Q[1], 9);\n    fgText(c, 'h = ' + f.h, ft[0] + 24, (Q[3][1] + ft[1]) / 2, { color: FI.acc });\n  }\n  if (f.ang)");
f=f.replace("  fgText(c, 'd₂ = ' + f.d2, r.cen[0] + 6, (Q[2][1] + r.cen[1]) / 2, { color: FI.acc, align: 'left' });\n  fgText(c, 'd₁ = ' + f.d1, (r.cen[0] + Q[1][0]) / 2, r.cen[1] - 11, { color: FI.acc });","  fgText(c, 'd₂ = ' + f.d2, r.cen[0] + 8, (Q[2][1] + r.cen[1]) / 2 + 6, { color: FI.acc, align: 'left' });\n  fgText(c, 'd₁ = ' + f.d1, (r.cen[0] + Q[3][0]) / 2, r.cen[1] - 12, { color: FI.acc });");
fs.writeFileSync('figures.js',f);
