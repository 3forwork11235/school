'use strict';
// ============================================================================
//  РИСУНКИ К ЗАДАЧАМ: фигуры, графики функций, тела, диаграммы.
//  drawFigure(canvas, fig, w, h) рисует «чернилами на клетчатой бумаге».
// ============================================================================
const FI = { ink: '#1d2a5b', acc: '#e8456b', grid: 'rgba(60,90,170,.16)', grid2: 'rgba(60,90,170,.30)', lab: '#0b6b4f', fill: 'rgba(110,150,255,.16)', fill2: 'rgba(232,69,107,.14)', mute: '#6a74a6' };

function fgSetup(cv, w, h) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = FI.ink; c.fillStyle = FI.ink; c.lineWidth = 2;
  return c;
}
function fgText(c, t, x, y, o) {
  o = o || {};
  c.save();
  c.font = (o.size || 15) + 'px "Nunito","Segoe UI",system-ui,sans-serif'; c.font = 'bold ' + c.font;
  c.textAlign = o.align || 'center'; c.textBaseline = o.base || 'middle';
  c.lineWidth = 4; c.strokeStyle = 'rgba(255,252,240,.95)'; c.strokeText(String(t), x, y);
  c.fillStyle = o.color || FI.lab; c.fillText(String(t), x, y);
  c.restore();
}
function niceStep(span, target) {
  const raw = span / target, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 5, 10]) if (m * mag >= raw) return m * mag;
  return 10 * mag;
}
// преобразование математических точек в пиксели с отступом и сохранением пропорций
function fitPts(pts, w, h, pad) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  pts.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
  const bw = Math.max(x1 - x0, 1e-6), bh = Math.max(y1 - y0, 1e-6);
  const s = Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh);
  const ox = (w - bw * s) / 2, oy = (h - bh * s) / 2;
  return p => [ox + (p[0] - x0) * s, h - oy - (p[1] - y0) * s];
}
function dashed(c, on) { c.setLineDash(on ? [6, 5] : []); }
function edgeLabel(c, a, b, cen, txt, dist) {
  if (txt === '' || txt === undefined || txt === null) return;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
  if ((mx - cen[0]) * nx + (my - cen[1]) * ny < 0) { nx = -nx; ny = -ny; }
  const d = dist || 14;
  fgText(c, txt, mx + nx * d, my + ny * d, { color: txt === '?' || txt === 'x' ? FI.acc : FI.lab });
}
function polygon(c, P, fill) {
  c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
  c.fillStyle = fill || FI.fill; c.fill(); c.strokeStyle = FI.ink; c.lineWidth = 2.4; c.stroke();
}
function rightMark(c, v, a, b, size) {
  // прямой угол в вершине v между направлениями к a и b
  const ua = [a[0] - v[0], a[1] - v[1]], ub = [b[0] - v[0], b[1] - v[1]], la = Math.hypot(...ua) || 1, lb = Math.hypot(...ub) || 1;
  ua[0] /= la; ua[1] /= la; ub[0] /= lb; ub[1] /= lb; size = size || 11;
  c.beginPath(); c.moveTo(v[0] + ua[0] * size, v[1] + ua[1] * size);
  c.lineTo(v[0] + (ua[0] + ub[0]) * size, v[1] + (ua[1] + ub[1]) * size); c.lineTo(v[0] + ub[0] * size, v[1] + ub[1] * size);
  c.lineWidth = 1.6; c.strokeStyle = FI.ink; c.stroke();
}
function poly(c, f, pts, e, w, h, opts) {
  opts = opts || {};
  const P = fitPts(pts, w, h, opts.pad || 34), Q = pts.map(P);
  const cen = Q.reduce((s, p) => [s[0] + p[0] / Q.length, s[1] + p[1] / Q.length], [0, 0]);
  polygon(c, Q);
  (e || []).forEach((t, i) => edgeLabel(c, Q[i], Q[(i + 1) % Q.length], cen, t, opts.dist));
  if (f.names) Q.forEach((p, i) => {
    let dx = p[0] - cen[0], dy = p[1] - cen[1]; const L = Math.hypot(dx, dy) || 1;
    fgText(c, f.names[i], p[0] + dx / L * 15, p[1] + dy / L * 15, { color: FI.ink, size: 14 });
  });
  if (f.ang) Q.forEach((p, i) => {
    if (!f.ang[i]) return;
    const q = [p[0] + (cen[0] - p[0]) * .32, p[1] + (cen[1] - p[1]) * .32];
    fgText(c, f.ang[i], q[0], q[1], { size: 13, color: f.ang[i] === '?' ? FI.acc : '#8a3b00' });
  });
  return { Q: Q, cen: cen };
}

// ---------------------------------------------------------------- виды рисунков
function figTri(c, f, w, h) {
  const r = poly(c, f, f.pts, f.e, w, h), Q = r.Q;
  if (f.rt !== undefined) rightMark(c, Q[f.rt], Q[(f.rt + 1) % 3], Q[(f.rt + 2) % 3]);
  if (f.alt) {
    const v = Q[f.alt.from], a = Q[(f.alt.from + 1) % 3], b = Q[(f.alt.from + 2) % 3];
    const dx = b[0] - a[0], dy = b[1] - a[1], t = ((v[0] - a[0]) * dx + (v[1] - a[1]) * dy) / (dx * dx + dy * dy);
    const ft = [a[0] + dx * t, a[1] + dy * t];
    c.save(); dashed(c, true); c.strokeStyle = FI.acc; c.lineWidth = 2; c.beginPath(); c.moveTo(v[0], v[1]); c.lineTo(ft[0], ft[1]); c.stroke(); c.restore();
    rightMark(c, ft, v, b, 9);
    fgText(c, f.alt.label, (v[0] + ft[0]) / 2 + 20, (v[1] + ft[1]) / 2, { color: FI.acc });
  }
}
function figRect(c, f, w, h) { poly(c, f, [[0, 0], [f.a, 0], [f.a, f.b], [0, f.b]], [f.a, '', '', f.b], w, h); }
function figPar(c, f, w, h) {
  const s = Math.min(f.a * .4, f.h * .5);
  const r = poly(c, f, [[0, 0], [f.a, 0], [f.a + s, f.h], [s, f.h]], [f.a, '', '', ''], w, h), Q = r.Q;
  const ft = [Q[3][0], Q[0][1]];
  if (!f.ang) {
    c.save(); dashed(c, true); c.strokeStyle = FI.acc; c.beginPath(); c.moveTo(Q[3][0], Q[3][1]); c.lineTo(ft[0], ft[1]); c.stroke(); c.restore();
    rightMark(c, ft, Q[3], Q[1], 9);
    fgText(c, 'h = ' + f.h, ft[0] + 24, (Q[3][1] + ft[1]) / 2, { color: FI.acc });
  }
  if (f.ang) { fgText(c, 'A', Q[0][0] - 14, Q[0][1] + 8, { color: FI.ink }); fgText(c, f.ang[0], Q[0][0] + 26, Q[0][1] - 10, { size: 13, color: '#8a3b00' }); fgText(c, 'B', Q[1][0] + 14, Q[1][1] + 8, { color: FI.ink }); fgText(c, f.ang[1], Q[1][0] - 26, Q[1][1] - 10, { size: 13, color: FI.acc }); }
}
function figTrap(c, f, w, h) {
  const r = poly(c, f, [[0, 0], [f.b, 0], [(f.b + f.a) / 2, f.h], [(f.b - f.a) / 2, f.h]], [f.b, '', f.a, ''], w, h), Q = r.Q;
  const ft = [Q[3][0], Q[0][1]];
  c.save(); dashed(c, true); c.strokeStyle = FI.acc; c.beginPath(); c.moveTo(Q[3][0], Q[3][1]); c.lineTo(ft[0], ft[1]); c.stroke(); c.restore();
  rightMark(c, ft, Q[3], Q[1], 9); fgText(c, 'h = ' + f.h, ft[0] + 26, (Q[3][1] + ft[1]) / 2, { color: FI.acc });
}
function figRhomb(c, f, w, h) {
  const r = poly(c, f, [[f.d1 / 2, 0], [f.d1, f.d2 / 2], [f.d1 / 2, f.d2], [0, f.d2 / 2]], [], w, h), Q = r.Q;
  c.save(); dashed(c, true); c.strokeStyle = FI.acc; c.lineWidth = 2;
  c.beginPath(); c.moveTo(Q[0][0], Q[0][1]); c.lineTo(Q[2][0], Q[2][1]); c.moveTo(Q[1][0], Q[1][1]); c.lineTo(Q[3][0], Q[3][1]); c.stroke(); c.restore();
  fgText(c, 'd₂ = ' + f.d2, r.cen[0] + 8, (Q[2][1] + r.cen[1]) / 2 + 6, { color: FI.acc, align: 'left' });
  fgText(c, 'd₁ = ' + f.d1, (r.cen[0] + Q[3][0]) / 2, r.cen[1] - 12, { color: FI.acc });
}
function figCirc(c, f, w, h) {
  const cx = w / 2, cy = h / 2, R0 = Math.min(w, h) / 2 - 22;
  c.fillStyle = FI.fill; c.beginPath(); c.arc(cx, cy, R0, 0, 7); c.fill(); c.lineWidth = 2.4; c.stroke();
  if (f.inscr) {
    const a = f.inscr * Math.PI / 180, a0 = Math.PI / 2 + a / 2, A = [cx + R0 * Math.cos(a0 + a), cy - R0 * Math.sin(a0 + a)], B = [cx + R0 * Math.cos(a0), cy - R0 * Math.sin(a0)];
    const C = [cx + R0 * Math.cos(a0 + a / 2 + Math.PI), cy - R0 * Math.sin(a0 + a / 2 + Math.PI)];
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(A[0], A[1]); c.moveTo(cx, cy); c.lineTo(B[0], B[1]); c.stroke();
    c.save(); c.strokeStyle = FI.acc; c.beginPath(); c.moveTo(C[0], C[1]); c.lineTo(A[0], A[1]); c.moveTo(C[0], C[1]); c.lineTo(B[0], B[1]); c.stroke(); c.restore();
    fgText(c, 'O', cx, cy + 14, { color: FI.ink }); fgText(c, f.inscr + '°', cx, cy - 24, { size: 13, color: '#8a3b00' });
    fgText(c, '?', C[0], C[1] + (C[1] > cy ? -16 : 16), { color: FI.acc });
    return;
  }
  fgText(c, 'O', cx - 10, cy + 12, { color: FI.ink });
  c.fillStyle = FI.ink; c.beginPath(); c.arc(cx, cy, 3, 0, 7); c.fill();
  if (f.sector) {
    const a = f.sector * Math.PI / 180;
    c.fillStyle = FI.fill2; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R0, -a, 0); c.closePath(); c.fill(); c.strokeStyle = FI.acc; c.lineWidth = 2.4; c.stroke();
    fgText(c, f.sector + '°', cx + R0 * .38, cy - R0 * .13, { size: 13, color: '#8a3b00' });
  }
  c.strokeStyle = FI.ink; c.lineWidth = 2.4;
  if (f.show === 'd') { c.beginPath(); c.moveTo(cx - R0, cy); c.lineTo(cx + R0, cy); c.stroke(); fgText(c, 'd = ' + (f.r * 2), cx, cy - 14, { color: FI.acc }); }
  else { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + R0, cy); c.stroke(); fgText(c, 'r = ' + f.r, cx + R0 / 2, cy + 14, { color: FI.acc }); }
}
function figPlane(c, f, w, h) {
  let xs = f.pts.map(p => p.x), ys = f.pts.map(p => p.y);
  let x0 = Math.min(...xs, 0) - 2, x1 = Math.max(...xs, 0) + 2, y0 = Math.min(...ys, 0) - 2, y1 = Math.max(...ys, 0) + 2;
  const spanX = Math.max(x1 - x0, 8), spanY = Math.max(y1 - y0, 6), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  figGraph(c, { xr: [cx - spanX / 2, cx + spanX / 2], yr: [cy - spanY / 2, cy + spanY / 2], grid: true }, w, h, (X, Y) => {
    if (f.seg) { c.strokeStyle = FI.acc; c.lineWidth = 2.6; c.beginPath(); const a = f.pts[f.seg[0]], b = f.pts[f.seg[1]]; c.moveTo(X(a.x), Y(a.y)); c.lineTo(X(b.x), Y(b.y)); c.stroke(); }
    f.pts.forEach(p => { c.fillStyle = FI.ink; c.beginPath(); c.arc(X(p.x), Y(p.y), 4.5, 0, 7); c.fill(); fgText(c, p.n, X(p.x) + 12, Y(p.y) - 12, { color: FI.ink }); });
  });
}
// система координат с сеткой; cb(X, Y) рисует поверх
function figGraph(c, f, w, h, cb) {
  const mini = f.mini, padL = mini ? 6 : 22, padR = 8, padT = 8, padB = mini ? 6 : 18;
  const xr = f.xr, yr = f.yr, sx = (w - padL - padR) / (xr[1] - xr[0]), sy = (h - padT - padB) / (yr[1] - yr[0]);
  const X = x => padL + (x - xr[0]) * sx, Y = y => h - padB - (y - yr[0]) * sy;
  const stx = f.trig ? Math.PI / 2 : niceStep(xr[1] - xr[0], mini ? 8 : 14), sty = niceStep(yr[1] - yr[0], mini ? 6 : 12);
  c.lineWidth = 1; c.strokeStyle = FI.grid;
  for (let x = Math.ceil(xr[0] / stx) * stx; x <= xr[1] + 1e-9; x += stx) { c.beginPath(); c.moveTo(X(x), padT); c.lineTo(X(x), h - padB); c.stroke(); }
  for (let y = Math.ceil(yr[0] / sty) * sty; y <= yr[1] + 1e-9; y += sty) { c.beginPath(); c.moveTo(padL, Y(y)); c.lineTo(w - padR, Y(y)); c.stroke(); }
  const ax = xr[0] <= 0 && xr[1] >= 0 ? X(0) : padL, ay = yr[0] <= 0 && yr[1] >= 0 ? Y(0) : h - padB;
  c.strokeStyle = FI.ink; c.lineWidth = 2;
  c.beginPath(); c.moveTo(padL, ay); c.lineTo(w - padR, ay); c.moveTo(ax, h - padB); c.lineTo(ax, padT); c.stroke();
  // стрелки
  c.fillStyle = FI.ink; c.beginPath(); c.moveTo(w - padR + 1, ay); c.lineTo(w - padR - 7, ay - 4); c.lineTo(w - padR - 7, ay + 4); c.fill();
  c.beginPath(); c.moveTo(ax, padT - 1); c.lineTo(ax - 4, padT + 7); c.lineTo(ax + 4, padT + 7); c.fill();
  if (!mini) {
    const lx = f.trig ? stx : Math.max(stx, niceStep(xr[1] - xr[0], 10)), ly = Math.max(sty, niceStep(yr[1] - yr[0], 9));
    for (let x = Math.ceil(xr[0] / lx) * lx; x <= xr[1] + 1e-9; x += lx) {
      if (Math.abs(x) < 1e-9) continue;
      let t = '' + Math.round(x * 100) / 100;
      if (f.trig) { const k = Math.round(x / (Math.PI / 2)); t = k % 2 === 0 ? (k / 2 === 1 ? 'π' : k / 2 === -1 ? '−π' : (k / 2) + 'π') : (k === 1 ? 'π/2' : k === -1 ? '−π/2' : k + 'π/2'); t = t.replace('-', '−'); }
      else t = t.replace('-', '−');
      fgText(c, t, X(x), Math.min(ay + 11, h - 7), { size: 11, color: FI.mute });
    }
    for (let y = Math.ceil(yr[0] / ly) * ly; y <= yr[1] + 1e-9; y += ly) {
      if (Math.abs(y) < 1e-9) continue;
      fgText(c, ('' + Math.round(y * 100) / 100).replace('-', '−'), Math.max(ax - 9, 10), Y(y), { size: 11, color: FI.mute, align: ax - 9 < 10 ? 'left' : 'center' });
    }
    fgText(c, 'x', w - 7, ay - 11, { size: 12, color: FI.ink }); fgText(c, 'y', ax + 11, padT + 4, { size: 12, color: FI.ink });
  }
  cb && cb(X, Y, sx, sy);
}
function fnEval(f, x) {
  const p = f.p;
  switch (f.kind) {
    case 'line': return p.k * x + p.b;
    case 'quad': return p.a * x * x + p.b * x + p.c;
    case 'hyp': return p.k / x;
    case 'sin': return p.A * Math.sin(p.w * x) + (p.c || 0);
    case 'cos': return p.A * Math.cos(p.w * x) + (p.c || 0);
    case 'cubic': return p.a3 * x * x * x + p.a2 * x * x + p.a1 * x + p.a0;
  }
  return 0;
}
function figFn(c, f, w, h) {
  figGraph(c, f, w, h, (X, Y) => {
    c.save(); c.strokeStyle = FI.acc; c.lineWidth = f.mini ? 2.6 : 3.2;
    c.beginPath(); c.rect(0, 0, w, h); c.clip();
    const segs = f.kind === 'hyp' ? [[f.xr[0], -0.02], [0.02, f.xr[1]]] : [[f.xr[0], f.xr[1]]];
    segs.forEach(sg => {
      const N = Math.max(40, Math.round(w * 1.2));
      c.beginPath();
      let pen = false;
      for (let i = 0; i <= N; i++) {
        const x = sg[0] + (sg[1] - sg[0]) * i / N, y = fnEval(f, x);
        if (!isFinite(y) || Math.abs(y) > 1e4) { pen = false; continue; }
        if (!pen) { c.moveTo(X(x), Y(y)); pen = true; } else c.lineTo(X(x), Y(y));
      }
      c.stroke();
    });
c.restore();
    if (f.pts && !f.mini) {
      c.fillStyle = FI.ink;
      for (let x = Math.ceil(f.xr[0]); x <= f.xr[1]; x++) {
        if (f.kind === 'hyp' && x === 0) continue;
        const y = fnEval(f, x);
        if (Math.abs(y - Math.round(y)) < 1e-9 && y >= f.yr[0] && y <= f.yr[1]) { c.beginPath(); c.arc(X(x), Y(y), 3.6, 0, 7); c.fill(); }
      }
    }
  });
}
// ---------------------------------------------------------------- тела
function figBox(c, f, w, h) {
  const a = f.a, b = f.b, cc = f.c, k = .5;
  const totW = a + b * k, totH = cc + b * k * .8, s = Math.min((w - 50) / totW, (h - 46) / totH);
  const ox = b * s * k, oy = b * s * k * .8, x0 = (w - (a * s + ox)) / 2, yb = h - (h - (cc * s + oy)) / 2;
  const F = [[x0, yb], [x0 + a * s, yb], [x0 + a * s, yb - cc * s], [x0, yb - cc * s]];
  const Bk = F.map(p => [p[0] + ox, p[1] - oy]);
  c.lineWidth = 2.4; c.strokeStyle = FI.ink;
  // верхняя и правая грани
  c.fillStyle = FI.fill; c.beginPath(); c.moveTo(...F[3]); c.lineTo(...F[2]); c.lineTo(...Bk[2]); c.lineTo(...Bk[3]); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(110,150,255,.28)'; c.beginPath(); c.moveTo(...F[1]); c.lineTo(...Bk[1]); c.lineTo(...Bk[2]); c.lineTo(...F[2]); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = FI.fill; c.beginPath(); F.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.fill(); c.stroke();
  c.save(); dashed(c, true); c.lineWidth = 1.6; c.beginPath(); c.moveTo(...F[0]); c.lineTo(...Bk[0]); c.lineTo(...Bk[1]); c.moveTo(...Bk[0]); c.lineTo(...Bk[3]); c.stroke(); c.restore();
  if (f.diag) { c.save(); dashed(c, true); c.strokeStyle = FI.acc; c.lineWidth = 2.4; c.beginPath(); c.moveTo(...F[0]); c.lineTo(...Bk[2]); c.stroke(); c.restore(); fgText(c, 'd', (F[0][0] + Bk[2][0]) / 2 - 10, (F[0][1] + Bk[2][1]) / 2 - 4, { color: FI.acc }); }
  fgText(c, a, (F[0][0] + F[1][0]) / 2, F[0][1] + 13); fgText(c, cc, F[0][0] - 12, (F[0][1] + F[3][1]) / 2); fgText(c, b, (F[1][0] + Bk[1][0]) / 2 + 12, (F[1][1] + Bk[1][1]) / 2 + 6);
}
function ell(c, cx, cy, rx, ry, fill, stroke, half) {
  c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, half === 'low' ? 0 : half === 'up' ? Math.PI : 0, half === 'low' ? Math.PI : half === 'up' ? 2 * Math.PI : 2 * Math.PI);
  if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) c.stroke();
}
function figCyl(c, f, w, h) {
  const s = Math.min((w - 60) / (2 * f.r), (h - 60) / (f.h + f.r * .7)), rx = f.r * s, ry = rx * .32, hh = f.h * s, cx = w / 2, top = (h - hh - ry * 2) / 2 + ry;
  c.lineWidth = 2.4; c.fillStyle = FI.fill;
  c.beginPath(); c.moveTo(cx - rx, top); c.lineTo(cx - rx, top + hh); c.ellipse(cx, top + hh, rx, ry, 0, Math.PI, 0, true); c.lineTo(cx + rx, top); c.fill(); c.stroke();
  c.save(); dashed(c, true); c.lineWidth = 1.6; c.beginPath(); c.ellipse(cx, top + hh, rx, ry, 0, 0, Math.PI, true); c.stroke(); c.restore();
  ell(c, cx, top, rx, ry, 'rgba(110,150,255,.3)', true);
  c.save(); c.strokeStyle = FI.acc; c.beginPath(); c.moveTo(cx, top); c.lineTo(cx + rx, top); c.stroke(); c.restore();
  fgText(c, 'r = ' + f.r, cx + rx / 2, top - 11, { color: FI.acc }); fgText(c, 'h = ' + f.h, cx + rx + 28, top + hh / 2);
}
function figCone(c, f, w, h) {
  const s = Math.min((w - 60) / (2 * f.r), (h - 50) / (f.h + f.r * .5)), rx = f.r * s, ry = rx * .3, hh = f.h * s, cx = w / 2, base = (h + hh) / 2 - ry * .5, apex = base - hh;
  c.lineWidth = 2.4; c.fillStyle = FI.fill;
  c.beginPath(); c.moveTo(cx - rx, base); c.lineTo(cx, apex); c.lineTo(cx + rx, base); c.ellipse(cx, base, rx, ry, 0, 0, Math.PI); c.fill(); c.stroke();
  c.save(); dashed(c, true); c.lineWidth = 1.6; c.beginPath(); c.ellipse(cx, base, rx, ry, 0, Math.PI, 0); c.stroke(); c.restore();
  c.save(); dashed(c, true); c.strokeStyle = FI.acc; c.beginPath(); c.moveTo(cx, apex); c.lineTo(cx, base); c.lineTo(cx + rx, base); c.stroke(); c.restore();
  fgText(c, 'h = ' + f.h, cx - 22, (apex + base) / 2, { color: FI.acc }); fgText(c, 'r = ' + f.r, cx + rx / 2, base + 13, { color: FI.acc });
}
function figSph(c, f, w, h) {
  const R0 = Math.min(w, h) / 2 - 22, cx = w / 2, cy = h / 2;
  c.lineWidth = 2.4; c.fillStyle = FI.fill; c.beginPath(); c.arc(cx, cy, R0, 0, 7); c.fill(); c.stroke();
  c.save(); dashed(c, true); c.lineWidth = 1.6; c.beginPath(); c.ellipse(cx, cy, R0, R0 * .3, 0, 0, Math.PI, true); c.stroke(); c.restore();
  c.beginPath(); c.ellipse(cx, cy, R0, R0 * .3, 0, 0, Math.PI); c.stroke();
  c.save(); c.strokeStyle = FI.acc; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + R0, cy); c.stroke(); c.restore();
  fgText(c, 'r = ' + f.r, cx + R0 / 2, cy - 12, { color: FI.acc });
}
function figPyr(c, f, w, h) {
  const s = Math.min((w - 60) / (f.a * 1.5), (h - 50) / (f.h + f.a * .5)), a = f.a * s, hh = f.h * s, ox = a * .45, oy = a * .28, x0 = (w - a - ox) / 2, yb = (h + hh + oy) / 2 - 4;
  const A = [x0, yb], B = [x0 + a, yb], Cc = [x0 + a + ox, yb - oy], D = [x0 + ox, yb - oy], ap = [x0 + a / 2 + ox / 2, yb - oy / 2 - hh];
  c.lineWidth = 2.4; c.fillStyle = FI.fill;
  c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.lineTo(...ap); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(110,150,255,.28)'; c.beginPath(); c.moveTo(...B); c.lineTo(...Cc); c.lineTo(...ap); c.closePath(); c.fill(); c.stroke();
  c.save(); dashed(c, true); c.lineWidth = 1.6; c.beginPath(); c.moveTo(...A); c.lineTo(...D); c.lineTo(...Cc); c.moveTo(...D); c.lineTo(...ap); c.stroke(); c.restore();
  const m = [x0 + a / 2 + ox / 2, yb - oy / 2];
  c.save(); dashed(c, true); c.strokeStyle = FI.acc; c.beginPath(); c.moveTo(...ap); c.lineTo(...m); c.stroke(); c.restore();
  fgText(c, 'h = ' + f.h, m[0] + 28, (ap[1] + m[1]) / 2, { color: FI.acc }); fgText(c, f.a, (A[0] + B[0]) / 2, A[1] + 13);
}
function figBars(c, f, w, h) {
  const n = f.vals.length, pl = 36, pr = 10, pt = 22, pb = 24, mx = Math.max(...f.vals, 0), mn = Math.min(...f.vals, 0);
  const span = (mx - mn) || 1, step = niceStep(span, 6), top = Math.ceil(mx / step) * step, bot = Math.floor(mn / step) * step;
  const Y = v => pt + (top - v) / (top - bot) * (h - pt - pb), bw = (w - pl - pr) / n;
  c.lineWidth = 1; c.strokeStyle = FI.grid2;
  for (let v = bot; v <= top + 1e-9; v += step) { c.beginPath(); c.moveTo(pl, Y(v)); c.lineTo(w - pr, Y(v)); c.stroke(); fgText(c, ('' + v).replace('-', '−'), pl - 6, Y(v), { size: 11, color: FI.mute, align: 'right' }); }
  c.strokeStyle = FI.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(pl, Y(0)); c.lineTo(w - pr, Y(0)); c.stroke();
  f.vals.forEach((v, i) => {
    const x = pl + i * bw + bw * .15;
    c.fillStyle = v >= 0 ? 'rgba(110,150,255,.75)' : 'rgba(232,69,107,.7)'; c.fillRect(x, Math.min(Y(v), Y(0)), bw * .7, Math.abs(Y(v) - Y(0)));
    c.strokeStyle = FI.ink; c.lineWidth = 1.6; c.strokeRect(x, Math.min(Y(v), Y(0)), bw * .7, Math.abs(Y(v) - Y(0)));
    fgText(c, ('' + v).replace('-', '−'), x + bw * .35, v >= 0 ? Y(v) - 9 : Y(v) + 10, { size: 12, color: FI.ink });
    fgText(c, f.labels[i], x + bw * .35, h - 10, { size: 12, color: FI.mute });
  });
  if (f.unit) fgText(c, f.unit, pl + 4, 8, { size: 11, color: FI.mute, align: 'left' });
}
function figSim(c, f, w, h) {
  const base = [[0, 0], [6, 0], [2, 4]], e = [f.s, f.b];
  const k = Math.min(1.9, 1 + (f.k || 2) * .25), W = 6 * (1 + k) + 3;
  const Pbig = fitPts(base.map(p => [p[0] * k + 6.8, p[1] * k]).concat([[0, 0]]), w, h, 22);
  const Ps = p => Pbig([p[0] + 0, p[1]]);
  const small = base.map(Ps), big = base.map(p => Pbig([p[0] * k + 6.8, p[1] * k]));
  const cs = small.reduce((s, p) => [s[0] + p[0] / 3, s[1] + p[1] / 3], [0, 0]), cb = big.reduce((s, p) => [s[0] + p[0] / 3, s[1] + p[1] / 3], [0, 0]);
  polygon(c, small, FI.fill); polygon(c, big, FI.fill2);
  for (let i = 0; i < 3; i++) { edgeLabel(c, small[i], small[(i + 1) % 3], cs, f.s[i], 13); edgeLabel(c, big[i], big[(i + 1) % 3], cb, f.b[i], 13); }
}
function figBarsWrap() { }

function drawFigure(cv, f, w, h) {
  const c = fgSetup(cv, w, h);
  switch (f.t) {
    case 'tri': figTri(c, f, w, h); break;
    case 'rect': figRect(c, f, w, h); break;
    case 'par': figPar(c, f, w, h); break;
    case 'trap': figTrap(c, f, w, h); break;
    case 'rhomb': figRhomb(c, f, w, h); break;
    case 'circ': figCirc(c, f, w, h); break;
    case 'plane': figPlane(c, f, w, h); break;
    case 'fn': figFn(c, f, w, h); break;
    case 'box': figBox(c, f, w, h); break;
    case 'cyl': figCyl(c, f, w, h); break;
    case 'cone': figCone(c, f, w, h); break;
    case 'sph': figSph(c, f, w, h); break;
    case 'pyr': figPyr(c, f, w, h); break;
    case 'bars': figBars(c, f, w, h); break;
    case 'sim': figSim(c, f, w, h); break;
  }
}
// высота холста по типу рисунка (для вёрстки)
function figSize(f, maxW, maxH) {
  let w = Math.min(maxW, 380);
  const r = { tri: .62, rect: .5, par: .52, trap: .52, rhomb: .62, circ: .72, plane: .7, fn: .62, box: .62, cyl: .68, cone: .66, sph: .7, pyr: .66, bars: .6, sim: .5 }[f.t] || .6;
  if (maxH && w * r > maxH) w = Math.max(150, maxH / r);
  return [Math.round(w), Math.round(w * r)];
}
