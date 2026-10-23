'use strict';
// ============================================================================
//  КОРИДОРНЫЙ ЗАБЕГ: бежим по коридору и ныряем в ворота с верным ответом
// ============================================================================
const RUN = { active: false };

function runTask() {
  const mx = Math.min(maxChapter(), 6), pool = [];
  for (let c = 0; c <= mx; c++) topicsOfChapter(c).forEach(t => { if (!['graphline', 'graphid', 'derivgraph', 'charts', 'stereo', 'tables', 'logic', 'trigfun'].includes(t)) pool.push(t); });
  for (let k = 0; k < 40; k++) {
    const t = makeTask(R.pick(pool), R.ri(1, 2));
    if (t.fig || t.q.length > 90 || /<table|eqsys/.test(t.q)) continue;
    if (t.kind === 'num' && Number.isInteger(t.ans) && Math.abs(t.ans) < 100000) {
      let w = near(t.ans, 6).map(String); const wrong = []; w.forEach(v => { if (wrong.length < 2 && v !== String(t.ans)) wrong.push(v.replace('-', '−')); });
      if (wrong.length < 2) continue; const opts = R.sh([fm(t.ans)].concat(wrong)); return { q: t.q, opts: opts, ans: opts.indexOf(fm(t.ans)) };
    }
    if (t.kind === 'choice' && t.choices.every(c => typeof c === 'string') && t.choices.length >= 3) {
      const right = t.choices[t.ans], wr = R.sh(t.choices.filter((_, i) => i !== t.ans)).slice(0, 2), opts = R.sh([right].concat(wr));
      if (opts.some(o => o.length > 22)) continue; return { q: t.q, opts: opts, ans: opts.indexOf(right) };
    }
  }
  const a = R.ri(3, 9), b = R.ri(3, 9), opts = R.sh([String(a * b), String(a * b + R.ri(1, 4)), String(a * b - R.ri(1, 4))]); return { q: `${a} × ${b} = ?`, opts: opts, ans: opts.indexOf(String(a * b)) };
}

function startRunner() {
  Snd.init(); closeScreen();
  const wrap = document.createElement('div'); wrap.id = 'runner'; wrap.innerHTML = '<canvas id="rcv"></canvas>'; $('game').appendChild(wrap);
  const cv = $('rcv'), dpr = Math.min(2, window.devicePixelRatio || 1);
  Object.assign(RUN, { active: true, cv: cv, c: cv.getContext('2d'), dpr: dpr, lane: 1, tl: 1, x: 0, rows: [], t: 0, time: 75, score: 0, lives: 3, combo: 0, speed: 150, spawnIn: 0, over: false, fx: [], phase: 0, last: performance.now(), correct: 0, shake: 0, started: false, msg: '' });
  UI_OPEN = true; hideJoy && hideJoy();
  rsize(); window.addEventListener('resize', rsize);
  window.addEventListener('keydown', rKey, true);
  cv.addEventListener('touchstart', rTouch, { passive: false }); cv.addEventListener('mousedown', rMouse);
  RUN.raf = requestAnimationFrame(rloop);
  spawnRow(true);
}
function rsize() { const w = innerWidth, h = innerHeight; RUN.W = w; RUN.H = h; RUN.cv.width = w * RUN.dpr; RUN.cv.height = h * RUN.dpr; RUN.cv.style.width = w + 'px'; RUN.cv.style.height = h + 'px'; }
function spawnRow(first) { RUN.rows.push(Object.assign(runTask(), { y: first ? 60 : -20, done: false, res: null })); }
function rKey(e) {
  if (!RUN.active) return;
  if (e.key === 'ArrowLeft' || e.code === 'KeyA') { RUN.tl = Math.max(0, RUN.tl - 1); e.preventDefault(); e.stopPropagation(); }
  else if (e.key === 'ArrowRight' || e.code === 'KeyD') { RUN.tl = Math.min(2, RUN.tl + 1); e.preventDefault(); e.stopPropagation(); }
  else if (e.key === '1' || e.key === '2' || e.key === '3') { RUN.tl = +e.key - 1; e.stopPropagation(); }
  else if (e.key === 'Escape') endRun(true);
}
function rTouch(e) { e.preventDefault(); const t = e.changedTouches[0]; rTap(t.clientX, t.clientY); }
function rMouse(e) { rTap(e.clientX, e.clientY); }
function rTap(x, y) {
  if (!RUN.active || RUN.over) return;
  if (y < 56 && x > RUN.W - 70) { endRun(true); return; }
  const lw = RUN.W / 3; RUN.tl = Math.max(0, Math.min(2, Math.floor(x / lw))); // тап по дорожке
}
function rloop(now) {
  if (!RUN.active) return; const dt = Math.min(.05, (now - RUN.last) / 1000); RUN.last = now;
  if (!RUN.over) rupdate(dt); rdraw();
  RUN.raf = requestAnimationFrame(rloop);
}
function rupdate(dt) {
  RUN.t += dt; RUN.phase += dt * 14; RUN.time -= dt; RUN.speed = 150 + Math.min(150, RUN.t * 2.2);
  const laneX = l => RUN.W * (l + .5) / 3; RUN.x += (laneX(RUN.tl) - (RUN.x || laneX(RUN.tl))) * Math.min(1, dt * 14); if (!RUN.x) RUN.x = laneX(1);
  const heroY = RUN.H * .8;
  RUN.rows.forEach(r => {
    r.y += RUN.speed * dt;
    if (!r.done && r.y >= heroY - 20) {
      r.done = true; const lane = Math.max(0, Math.min(2, Math.round((RUN.x / RUN.W) * 3 - .5)));
      if (lane === r.ans) { RUN.combo++; RUN.correct++; const pts = 10 + Math.min(10, RUN.combo * 2); RUN.score += pts; r.res = 'ok'; RUN.fx.push({ x: RUN.x, y: heroY - 80, t: 1, txt: '+' + pts }); Snd.play('ok'); }
      else { RUN.combo = 0; RUN.lives--; r.res = 'bad'; RUN.shake = .3; RUN.fx.push({ x: RUN.x, y: heroY - 80, t: 1, txt: 'мимо!', c: '#ff6b8b' }); Snd.play('bad'); vibe(60); if (RUN.lives <= 0) { endRun(false); return; } }
    }
  });
  RUN.rows = RUN.rows.filter(r => r.y < RUN.H + 160);
  const last = RUN.rows[RUN.rows.length - 1];
  if (!last || last.y > Math.max(260, RUN.H * .5)) spawnRow(false);
  RUN.fx.forEach(f => { f.t -= dt; f.y -= 40 * dt; }); RUN.fx = RUN.fx.filter(f => f.t > 0); RUN.shake = Math.max(0, RUN.shake - dt);
  if (RUN.time <= 0) endRun(false);
}
function rdraw() {
  const c = RUN.c, W = RUN.W, H = RUN.H, th = CHAPTERS[Math.min(maxChapter(), 6)].theme; c.setTransform(RUN.dpr, 0, 0, RUN.dpr, 0, 0);
  if (RUN.shake > 0) c.translate((Math.random() - .5) * 8, (Math.random() - .5) * 8);
  // пол и дорожки
  const off = (RUN.t * RUN.speed) % 80;
  for (let y = -80; y < H + 80; y += 80) for (let l = 0; l < 3; l++) { c.fillStyle = (l + Math.floor((y + off) / 80)) % 2 ? th.floor : th.floor2; c.fillRect(l * W / 3, y + off, W / 3, 80); }
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; c.setLineDash([16, 14]); c.lineDashOffset = -off; [1, 2].forEach(l => { c.beginPath(); c.moveTo(l * W / 3, 0); c.lineTo(l * W / 3, H); c.stroke(); }); c.setLineDash([]);
  // боковые шкафчики
  c.fillStyle = th.wall2; c.fillRect(0, 0, 8, H); c.fillRect(W - 8, 0, 8, H);
  // ворота
  const heroY = H * .8, curRow = RUN.rows.find(r => !r.done);
  RUN.rows.forEach(r => {
    c.globalAlpha = r === curRow || r.done ? 1 : .5;
    for (let l = 0; l < 3; l++) {
      const x = l * W / 3 + 8, w = W / 3 - 16, y = r.y - 50, h = 56;
      let col = ['#ffe97d', '#9fe9bf', '#ffb3cc'][l];
      if (r.done) col = r.ans === l ? '#5ef0a8' : 'rgba(150,140,180,.6)';
      c.fillStyle = 'rgba(0,0,0,.3)'; rrect(c, x + 3, y + 5, w, h, 12); c.fill(); c.fillStyle = col; rrect(c, x, y, w, h, 12); c.fill(); c.strokeStyle = '#1d2a5b'; c.lineWidth = 3; rrect(c, x, y, w, h, 12); c.stroke();
      if (r === curRow) { c.strokeStyle = '#ffd54a'; c.lineWidth = 5; rrect(c, x - 3, y - 3, w + 6, h + 6, 14); c.stroke(); }
      c.fillStyle = '#1d2a5b'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = Math.min(30, w / 3); c.font = 'bold ' + fs + 'px "Comfortaa","Nunito",sans-serif';
      const label = r.opts[l].replace(/<[^>]+>/g, ''); while (c.measureText(label).width > w - 14 && fs > 11) { fs--; c.font = 'bold ' + fs + 'px "Comfortaa","Nunito",sans-serif'; } c.fillText(label, x + w / 2, y + h / 2 + 1);
    }
    c.globalAlpha = 1;
  });
  // герой
  drawPersonOn(c, RUN.x || W / 2, heroY, { look: S.look, dir: 'u', moving: true, phase: RUN.phase });
  // всплывающие
  RUN.fx.forEach(f => { c.globalAlpha = Math.max(0, f.t); c.fillStyle = f.c || '#ffd54a'; c.font = 'bold 26px "Comfortaa",sans-serif'; c.textAlign = 'center'; c.fillText(f.txt, f.x, f.y); }); c.globalAlpha = 1;
  // вопрос (ближайший не пройденный ряд)
  const cur = RUN.rows.find(r => !r.done) || RUN.rows[RUN.rows.length - 1];
  c.setTransform(RUN.dpr, 0, 0, RUN.dpr, 0, 0);
  c.fillStyle = 'rgba(20,16,50,.9)'; c.fillRect(0, 0, W, 78 + 0); c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 78); c.lineTo(W, 78); c.stroke();
  c.fillStyle = '#fff7e6'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 22px "Comfortaa","Nunito",sans-serif';
  if (cur) { const q = cur.q.replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<sub>(.*?)<\/sub>/g, '$1').replace(/<span class="fr"><i>(.*?)<\/i><b>(.*?)<\/b><\/span>/g, '($1/$2)').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); let fs = 22; c.font = 'bold ' + fs + 'px "Comfortaa","Nunito",sans-serif'; while (c.measureText(q).width > W - 130 && fs > 12) { fs--; c.font = 'bold ' + fs + 'px "Comfortaa","Nunito",sans-serif'; } c.fillText(q.length > 120 ? q.slice(0, 118) + '…' : q, W / 2, 40); }
  c.textAlign = 'left'; c.font = 'bold 14px "Nunito",sans-serif'; c.fillStyle = '#ffd54a'; c.fillText('Очки: ' + RUN.score + (RUN.combo >= 2 ? '  🔥×' + RUN.combo : ''), 12, 14);
  c.textAlign = 'center'; c.fillStyle = RUN.time < 10 ? '#ff6b8b' : '#6ff0c8'; c.fillText('⏱ ' + Math.max(0, Math.ceil(RUN.time)) + ' с', W / 2, 14);
  c.textAlign = 'right'; c.fillStyle = '#fff'; c.fillText('❤️'.repeat(Math.max(0, RUN.lives)) + '🖤'.repeat(Math.max(0, 3 - RUN.lives)) + '   ✕', W - 12, 14);
  c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '12px "Nunito",sans-serif'; c.textAlign = 'center'; c.fillText('Тапни по дорожке или нажми ← →', W / 2, H - 14);
}
function drawPersonOn(c, x, y, o) { const old = WORLD.c; WORLD.c = c; drawPerson(c, x, y, Object.assign({ scale: 1.3 }, o)); WORLD.c = old; }
function endRun(quit) {
  if (!RUN.active) return; RUN.active = false; cancelAnimationFrame(RUN.raf);
  window.removeEventListener('resize', rsize); window.removeEventListener('keydown', rKey, true);
  const sc = RUN.score; const coins = Math.min(90, Math.round(sc / 6 * (1 + petPerk().coin))), xp = Math.round(sc * .6);
  const wrap = $('runner'); if (wrap) wrap.remove();
  if (quit && sc === 0) { UI_OPEN = false; return; }
  S.stats.runBest = Math.max(S.stats.runBest, sc); addCoins(coins, true); addXp(xp); questEvent('run', sc); checkAch(); save(true);
  const rec = sc >= S.stats.runBest && sc > 0;
  openScreen(pan('Забег окончен', `<div class="center"><div class="stars"><span>🏃</span></div><h3>Очки: ${sc}${rec ? ' — рекорд! 🏅' : ''}</h3><div class="rw" style="display:flex;gap:10px;justify-content:center"><span class="price" style="font-size:16px">🪙 +${coins}</span><span class="price" style="font-size:16px;color:var(--mint)">✨ +${xp}</span></div><p class="muted">Верных ворот: ${RUN.correct}. Рекорд: ${S.stats.runBest}.</p></div>`,
    `<button class="btn gold" data-a="runagain">Ещё раз</button><button class="btn ghost" data-a="close">В коридор</button>`, { noX: true, w: 460 }));
}
A.runagain = () => { closeScreen(); startRunner(); };
