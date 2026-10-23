const fs=require('fs');
let f=fs.readFileSync('figures.js','utf8');
f=f.replace("function figSize(f, maxW) {\n  const w = Math.min(maxW, 380);\n  const r =","function figSize(f, maxW, maxH) {\n  let w = Math.min(maxW, 380);\n  const r =");
f=f.replace("  return [w, Math.round(w * r)];\n}","  if (maxH && w * r > maxH) w = Math.max(150, maxH / r);\n  return [Math.round(w), Math.round(w * r)];\n}");
fs.writeFileSync('figures.js',f);
let s=fs.readFileSync('lesson.js','utf8');
s=s.replace("  if (t.fig) { const sz = figSize(t.fig, Math.min(q.clientWidth - 76, 380) || 300); drawFigure($('lsFig'), t.fig, sz[0], sz[1]); }",
"  { const qq = q.querySelector('.q'), plain = t.q.replace(/<[^>]+>/g, '').length, k = plain > 150 ? .6 : plain > 100 ? .72 : plain > 64 ? .86 : 1; qq.style.fontSize = 'calc(clamp(20px,4.8vh,40px) * ' + (t.fig ? Math.min(k, .8) : k) + ')'; }\n  if (t.fig) { const sz = figSize(t.fig, Math.min(q.clientWidth - 76, 380) || 300, Math.max(120, q.clientHeight * (t.fig.t === 'fn' || t.fig.t === 'bars' ? .5 : .46))); drawFigure($('lsFig'), t.fig, sz[0], sz[1]); }");
fs.writeFileSync('lesson.js',s);
