'use strict';
// ============================================================================
//  ДВИЖОК УРОКОВ: задачи на время, жизни, комбо, соперник, боссы, экзамен, олимпиада
//  Защита от «сфоткать и вставить в нейросеть»: у каждой задачи свои числа и таймер.
//  Вышло время (или игру свернули) — вариант меняется, а за ответ нет ни бонуса, ни освоения.
// ============================================================================
const LS = { active: false };
let LSIV = null;

function timeMult() { return S.settings.timeMode || 1; }
function coinModeMul() { return S.settings.timeMode < 1 ? 1.25 : S.settings.timeMode > 1 ? .75 : 1; }

// ---------------------------------------------------------------- запуск разных режимов
function openLesson(ch, j) {
  const C = CHAPTERS[ch], L = C.lessons[j], P = chProg(ch);
  if (!lessonUnlocked(ch, j)) { say([[C.teacher, 'Сначала пройди предыдущий кабинет — уроки идут по порядку!']]); return; }
  const first = !S.seen['l' + ch + '_' + j];
  const examples = L.topics.map(t => ({ t: t, task: makeTask(t, L.d) }));
  const body = `<div class="card" style="margin-bottom:10px"><div class="row"><span class="big-e">${NPC[C.teacher].e}</span><div class="sp"><h4>${NPC[C.teacher].name}</h4><p style="color:var(--text);font-size:15px">«${L.blurb}»</p></div><div style="font-size:22px;letter-spacing:2px">${'⭐'.repeat(P.lessons[j])}${'☆'.repeat(3 - P.lessons[j])}</div></div></div>
  ${L.topics.map((t, k) => `<details class="card" style="margin-bottom:8px" ${first && k === 0 ? 'open' : ''}><summary style="cursor:pointer;font-weight:900">${TOPICS[t].icon} Теория: ${TOPICS[t].name}</summary><div style="margin-top:8px">${learnHtml(t)}<h3>Пример с разбором</h3><div class="fcard"><div class="f" style="font-size:17px;font-family:var(--body)">${examples[k].task.q}</div><p><b>Ответ:</b> ${answerText(examples[k].task)}<br>${examples[k].task.sol}</p></div></div></details>`).join('')}
  <div class="card"><h4>🎒 Взять с собой</h4><div class="row" style="margin-top:6px;flex-wrap:wrap">
    <button class="btn sm ${S.boost.heart ? 'green' : 'ghost'}" data-a="boost" data-k="heart" ${S.items.heart > 0 ? '' : 'disabled'}>❤️ Справка (${S.items.heart})</button>
    <button class="btn sm ${S.boost.cocoa ? 'green' : 'ghost'}" data-a="boost" data-k="cocoa" ${S.items.cocoa > 0 ? '' : 'disabled'}>☕ Двойной компот (${S.items.cocoa})</button></div>
    <p style="margin-top:8px">⏱ На каждую задачу — свой таймер. Успел за половину времени — бонус «молния» ×1,5. Не успел — вариант поменяется, бонуса не будет.</p></div>`;
  S.seen['l' + ch + '_' + j] = 1;
  openScreen(pan(`Кабинет ${L.room}: ${L.n}`, body, `<button class="btn gold xl" data-a="gostart" data-c="${ch}" data-j="${j}">В бой!</button>`));
}
A.boost = d => { S.boost[d.k] = !S.boost[d.k]; const ch = $('screen').querySelector('[data-a=gostart]'); const sc = $('bd').scrollTop; const c = +ch.dataset.c, j = +ch.dataset.j; openLesson(c, j); $('bd').scrollTop = sc; };
A.gostart = d => {
  closeScreen(); const ch = +d.c, j = +d.j, L = CHAPTERS[ch].lessons[j];
  startLesson({ kind: 'lesson', ch: ch, j: j, topics: L.topics, d: L.d, n: 8, hearts: 4, title: `Кабинет ${L.room}`, rival: CHAPTERS[ch].rival });
};
function openBoss(ch) {
  const C = CHAPTERS[ch];
  if (!bossUnlocked(ch)) { say([[C.teacher, 'К боссу рано! Пройди все шесть кабинетов хотя бы на одну звезду.']]); return; }
  const B = C.bossLesson;
  say(C.bossIntro, () => startLesson({ kind: 'boss', ch: ch, topics: B.topics, d: B.d, n: B.n, hearts: 5, title: NPC[C.boss].name, boss: C.boss, rival: null }));
}
function startPractice(topic, d) {
  startLesson({ kind: 'practice', topics: [topic], d: d, n: 10, hearts: 0, title: 'Тренировка: ' + TOPICS[topic].name, coinMul: .5, xpMul: .8, rival: null });
}
function startMixed(topics, n, title, quest) {
  startLesson({ kind: 'mixed', topics: topics, d: 2, n: n, hearts: 0, title: title, coinMul: .6, xpMul: .9, rival: null, quest: quest });
}
function startCardTrainer() {
  const own = FORMULAS.filter(f => S.cards[f.id]);
  CARD_FILTER = own.length >= 6 ? (f => !!S.cards[f.id]) : (f => f.ch <= Math.min(maxChapter(), 6));
  startLesson({ kind: 'cards', topics: ['cards'], d: 1, n: 10, hearts: 0, title: 'Карточки формул', coinMul: .3, xpMul: .5, rival: null });
}
function startOlympiad() { startLesson({ kind: 'olymp', topics: null, d: 1, n: 999, hearts: 3, title: 'Олимпиада', coinMul: 1, xpMul: 1, rival: null }); }
function startExam() { startLesson({ kind: 'exam', topics: null, d: 2, n: EGE.n, hearts: 0, title: 'ЕГЭ', rival: null, strict: true }); }
function startDuel() {
  S.seen.duelDay = dayNum(); const mx = Math.min(maxChapter(), 6);
  const topics = []; for (let c = 0; c <= mx; c++) topicsOfChapter(c).forEach(t => topics.push(t));
  startLesson({ kind: 'duel', topics: R.sh(topics).slice(0, 4), d: 1, n: 6, hearts: 3, title: 'Дуэль с Гошей', rival: { n: 'Гоша', e: '🤓', spt: 14 + mx * 5 }, coinMul: .4 });
}

// ---------------------------------------------------------------- состояние и сборка экрана
function startLesson(cfg) {
  endLessonTimers();
  cfg = Object.assign({ n: 8, hearts: 3, d: 1, coinMul: 1, xpMul: 1, kind: 'lesson' }, cfg);
  if (cfg.rival && !S.settings.rival) cfg.rival = null;
  let hearts = cfg.hearts, extra = false;
  if ((cfg.kind === 'lesson' || cfg.kind === 'boss') && S.boost.heart && S.items.heart > 0) { S.items.heart--; S.boost.heart = false; hearts++; extra = true; }
  let cocoa = false;
  if ((cfg.kind === 'lesson' || cfg.kind === 'boss') && S.boost.cocoa && S.items.cocoa > 0) { S.items.cocoa--; S.boost.cocoa = false; cocoa = true; }
  Object.assign(LS, {
    active: true, cfg: cfg, i: 0, n: cfg.n, hearts: hearts, maxHearts: hearts, res: [], coins: 0, xp: 0, combo: 0, maxCombo: 0, correct: 0, fast: 0, late: 0, bad: 0, points: 0,
    task: null, tStart: 0, limit: 30, late_: false, reshuf: 0, hint: false, hintHtml: '', fb: false, hiddenAt: 0, t0: Date.now(), cocoa: cocoa, extraHeart: extra, bossHp: cfg.n, rivalDone: false, rivalWon: null, input: '', ended: false, bag: [], reviewHits: 0, score: 0, d_: cfg.d, locked: false,
  });
  UI_OPEN = true; WORLD.input = { x: 0, y: 0 }; hideJoy && hideJoy();
  buildLessonUI(); loadTask();
  LSIV = setInterval(tickLesson, 100);
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('keydown', onLsKey, true);
  Snd.init();
}
function endLessonTimers() { if (LSIV) { clearInterval(LSIV); LSIV = null; } document.removeEventListener('visibilitychange', onVis); window.removeEventListener('keydown', onLsKey, true); }
function closeLesson() {
  endLessonTimers(); LS.active = false; const el = $('ls'); if (el) el.remove();
  if (!SCR.open && !DLG.on) UI_OPEN = false; updHud(); save(true);
}
function buildLessonUI() {
  const cfg = LS.cfg, old = $('ls'); if (old) old.remove();
  const el = document.createElement('div'); el.className = 'ls'; el.id = 'ls';
  const boss = cfg.boss ? NPC[cfg.boss] : null;
  el.innerHTML = `
  <div class="ls-top"><button class="x" data-l="exit">✕</button><div class="hearts" id="lsH"></div><div class="dots" id="lsD"></div><div class="combo" id="lsC"></div><div class="lscoin" id="lsCoin"></div></div>
  ${boss ? `<div class="ls-boss"><div class="be" id="lsBe">${boss.e}</div><div class="bb"><div class="bn">${boss.name}</div><div class="bar"><i id="lsBhp" style="width:100%"></i></div><div class="taunt" id="lsTaunt"></div></div></div>` : ''}
  ${cfg.rival ? `<div class="ls-rival"><span>${S.look ? heroEmoji() : '🧒'} ты</span><div class="bar"><i id="lsMe" style="width:0"></i></div><span>${cfg.rival.e} ${cfg.rival.n}</span><div class="bar" style="flex:1"><i id="lsRv" style="width:0"></i></div></div>` : ''}
  <div class="timer" id="lsT"><i id="lsTi"></i><b id="lsTb"></b></div>
  <div class="notice" id="lsN"></div>
  <div class="qwrap"><div class="qcard" id="lsQ"></div><div class="ans" id="lsA"></div></div>
  <div class="tools" id="lsTools"></div>`;
  $('game').appendChild(el);
  el.addEventListener('click', onLsClick);
  drawHearts(); drawDots(); drawCoin();
}

// ---------------------------------------------------------------- выбор задачи
function pickTopicFor(slot) {
  const cfg = LS.cfg;
  if (cfg.kind === 'exam') {
    const w = [1, 1, 1.3, 1.3, 1.4, 1.4, 1.6]; let tot = 0; w.forEach(x => tot += x); let r = Math.random() * tot, ch = 0;
    for (let k = 0; k < 7; k++) { r -= w[k]; if (r <= 0) { ch = k; break; } }
    const ts = topicsOfChapter(ch); return { t: R.pick(ts), d: ch <= 1 ? R.pick([1, 2]) : 2 };
  }
  if (cfg.kind === 'olymp') {
    const mx = Math.min(maxChapter(), 7), ch = R.ri(0, Math.max(0, mx)), ts = topicsOfChapter(ch); const lvl = 1 + Math.min(2, Math.floor(LS.correct / 6));
    return { t: R.pick(ts), d: lvl };
  }
  let t, review = false;
  if ((cfg.kind === 'lesson' || cfg.kind === 'boss') && S.wrong.length && Math.random() < .2) {
    const w = S.wrong.filter(x => TOPICS[x] && TOPICS[x].ch <= (cfg.ch === undefined ? 7 : cfg.ch)); if (w.length) { t = R.pick(w); review = true; }
  }
  if (!t) { if (!LS.bag.length) LS.bag = R.sh(cfg.topics); t = LS.bag.pop(); }
  let d = cfg.d; const half = Math.ceil(cfg.n * (cfg.kind === 'boss' ? .45 : .6));
  if (slot >= half && d < 3) d++;
  if (cfg.kind === 'boss' && slot >= cfg.n - 3 && d < 3) d = Math.min(3, cfg.d + 1);
  return { t: t, d: review ? Math.max(1, d - 1) : d, review: review };
}
function loadTask(sameTopic) {
  let pk;
  if (sameTopic && LS.task) pk = { t: LS.task.topic, d: LS.task.lv, review: LS.task.review };
  else pk = pickTopicFor(LS.i);
  const task = makeTask(pk.t, pk.d); task.review = pk.review; if (pk.review) LS.reviewHits++;
  LS.task = task; LS.input = ''; LS.hint = false; LS.hintHtml = ''; LS.locked = false;
  let lim = task.time * timeMult() + petPerk().time; if (LS.cfg.kind === 'exam') lim = task.time * EGE.time; if (LS.cfg.kind === 'olymp') lim = task.time * Math.max(.6, 1 - LS.correct * .015) * timeMult();
  if (LS.late_) lim = lim * 1.5;
  LS.limit = Math.max(6, lim); LS.tStart = Date.now(); LS.paused = false; LS.extraT = 0;
  renderTask(); drawDots(); drawRival();
}

// ---------------------------------------------------------------- отрисовка задачи
function renderTask() {
  const t = LS.task, cfg = LS.cfg, q = $('lsQ'), a = $('lsA');
  const topicName = TOPICS[t.topic].name;
  const slot = cfg.kind === 'olymp' ? `Задача ${LS.i + 1}` : `Задача ${LS.i + 1} из ${LS.n}`;
  q.innerHTML = `<div class="qn">${slot} · ${topicName}${t.review ? ' <span class="tag">🔁 повторение</span>' : ''}${LS.late_ ? ' <span class="tag" style="background:#b86a00">другой вариант</span>' : ''}</div>
  <div id="lsHint"></div><div class="q">${t.q}</div>${t.fig ? '<canvas id="lsFig"></canvas>' : ''}${t.note ? `<div class="note">${t.note}</div>` : ''}`;
  { const qq = q.querySelector('.q'), plain = t.q.replace(/<[^>]+>/g, '').length, k = plain > 150 ? .6 : plain > 100 ? .72 : plain > 64 ? .86 : 1; qq.style.fontSize = 'calc(clamp(18px,min(4.8vh,6.4vw),38px) * ' + (t.fig ? Math.min(k, .8) : k) + ')'; }
  if (t.fig) { const sz = figSize(t.fig, Math.min(q.clientWidth - 76, 380) || 300, Math.max(120, q.clientHeight * (t.fig.t === 'fn' || t.fig.t === 'bars' ? .5 : .46))); drawFigure($('lsFig'), t.fig, sz[0], sz[1]); }
  if (t.kind === 'choice') {
    a.innerHTML = `<div class="choices">${t.choices.map((c, i) => `<button class="choice" data-l="ch" data-i="${i}">${typeof c === 'string' ? c : '<canvas data-ci="' + i + '"></canvas>'}</button>`).join('')}</div>`;
    a.querySelectorAll('canvas[data-ci]').forEach(cv => { drawFigure(cv, t.choices[+cv.dataset.ci].fig, 148, 108); });
  } else {
    a.innerHTML = `<div class="numwrap"><div class="disp empty" id="lsDisp">введи ответ</div></div><div class="keys">${[7, 8, 9, '⌫', 4, 5, 6, '−', 1, 2, 3, ',', 0, '/'].map(k => `<button class="key ${isNaN(k) ? 'f' : ''}" data-l="key" data-k="${k}">${k}</button>`).join('')}<button class="key ok" data-l="ok" style="grid-column:span 2">Ответить ✔</button></div>`;
  }
  drawTools(); drawNotice(LS.late_ ? '⏰ Время вышло — учитель поменял вариант. За этот ответ бонуса не будет.' : '');
  tickLesson();
}
function drawNotice(t) { const n = $('lsN'); if (n) n.textContent = t; }
function drawHearts() { const el = $('lsH'); if (!el) return; if (!LS.maxHearts) { el.textContent = ''; return; } let s = ''; for (let i = 0; i < LS.maxHearts; i++) s += i < LS.hearts ? '❤️' : '🖤'; el.textContent = s; }
function drawDots() {
  const el = $('lsD'); if (!el) return; if (LS.cfg.kind === 'olymp') { el.innerHTML = `<span style="font-size:15px">Решено подряд: <b class="gold">${LS.correct}</b></span>`; return; }
  let s = ''; for (let i = 0; i < LS.n; i++) s += `<i class="${LS.res[i] || (i === LS.i ? 'cur' : '')}"></i>`; el.innerHTML = s;
}
function drawCoin() { const el = $('lsCoin'), c = $('lsC'); if (el) el.textContent = LS.cfg.kind === 'exam' ? '' : '🪙 ' + LS.coins; if (c) c.textContent = LS.combo >= 2 ? '🔥×' + LS.combo : ''; }
function drawTools() {
  const el = $('lsTools'); if (!el) return;
  if (LS.cfg.strict) { el.innerHTML = '<span class="muted" style="font-size:12px">Экзамен: подсказки отключены</span>'; return; }
  const ch = LS.task.kind === 'choice';
  el.innerHTML = [['hint', '💡'], ['fifty', '⚖️'], ['time', '⏱️'], ['swap', '🔄']].map(x => `<button class="tool" data-l="tool" data-t="${x[0]}" ${(x[0] === 'fifty' && !ch) || S.items[x[0]] <= 0 ? 'disabled' : ''}>${x[1]}<b>${S.items[x[0]] || 0}</b></button>`).join('');
}
function drawRival() {
  const R2 = LS.cfg.rival; if (!R2 || !$('lsRv')) return;
  const me = LS.n ? (LS.i / LS.n) : 0; $('lsMe').style.width = Math.round(me * 100) + '%';
  const el = (Date.now() - LS.t0) / 1000, rp = Math.min(1, el / (LS.n * R2.spt * 1.0));
  $('lsRv').style.width = Math.round(rp * 100) + '%';
  if (rp >= 1 && !LS.rivalDone) { LS.rivalDone = true; drawNotice(R2.e + ' ' + R2.n + ' уже закончил! Доделай урок — но бонуса за обгон не будет.'); }
}

// ---------------------------------------------------------------- таймер
function remaining() { return LS.limit + LS.extraT - (Date.now() - LS.tStart) / 1000; }
function tickLesson() {
  if (!LS.active || LS.fb || LS.locked || !LS.task) return;
  const rem = remaining(), f = Math.max(0, rem / (LS.limit + LS.extraT)), bar = $('lsT'), ti = $('lsTi'), tb = $('lsTb');
  if (!bar) return;
  ti.style.width = (f * 100).toFixed(1) + '%'; tb.textContent = Math.max(0, Math.ceil(rem)) + ' с';
  bar.className = 'timer' + (LS.late_ ? ' late' : f < .22 ? ' low' : f < .5 ? ' mid' : '');
  if (rem <= 5 && rem > 0 && Math.ceil(rem) !== LS._lastTick) { LS._lastTick = Math.ceil(rem); Snd.play('tick'); }
  if (LS.cfg.rival) drawRival();
  if (rem <= 0) onTimeout('time');
}
function onVis() {
  if (!LS.active) return;
  if (document.hidden) LS.hiddenAt = Date.now();
  else if (LS.hiddenAt && !LS.fb && !LS.locked && Date.now() - LS.hiddenAt > 2500 && LS.task) { LS.hiddenAt = 0; onTimeout('hidden'); } else LS.hiddenAt = 0;
}
function onTimeout(why) {
  if (!LS.active || LS.fb || LS.locked) return;
  const cfg = LS.cfg; Snd.play('late'); vibe(80);
  if (cfg.kind === 'exam') { finishSlot('bad', false, true); return; }
  if (cfg.kind === 'olymp') { LS.late_ = false; LS.combo = 0; S.stats.late++; showWrong(LS.task, null, true); return; }
  LS.late++; S.stats.late++;
  LS.reshuf++; LS.late_ = true; LS.combo = 0; drawCoin();
  if (LS.reshuf > 2) { // третий раз подряд — задача засчитана как нерешённая
    LS.late_ = false; LS.reshuf = 0; showWrong(LS.task, null, true); return;
  }
  loadTask(true);
  drawNotice(why === 'hidden' ? '👀 Ты сворачивал игру — учитель поменял вариант. Бонуса не будет.' : '⏰ Время вышло — учитель поменял вариант. За этот ответ бонуса не будет.');
}

// ---------------------------------------------------------------- ввод
function onLsClick(e) {
  const b = e.target.closest('[data-l]'); if (!b || LS.fb) { if (b && b.dataset.l === 'exit') askExit(); return; }
  Snd.init(); const k = b.dataset.l;
  if (k === 'exit') { askExit(); return; }
  if (LS.locked) return;
  if (k === 'ch') { Snd.play('click'); submit(+b.dataset.i); }
  else if (k === 'key') { Snd.play('click'); pressKey(b.dataset.k); }
  else if (k === 'ok') submit(LS.input);
  else if (k === 'tool') useTool(b.dataset.t);
}
function onLsKey(e) {
  if (!LS.active || LS.fb || LS.locked || !LS.task) return;
  if (LS.task.kind === 'choice') { if (e.key >= '1' && e.key <= '4') { submit(+e.key - 1); e.preventDefault(); e.stopPropagation(); } return; }
  const k = e.key;
  if (/^[0-9]$/.test(k)) pressKey(k); else if (k === '-' || k === '−') pressKey('−'); else if (k === ',' || k === '.') pressKey(','); else if (k === '/') pressKey('/');
  else if (k === 'Backspace') pressKey('⌫'); else if (k === 'Enter') submit(LS.input); else return;
  e.preventDefault(); e.stopPropagation();
}
function pressKey(k) {
  let s = LS.input;
  if (k === '⌫') s = s.slice(0, -1);
  else if (k === '−') { s = s[0] === '−' ? s.slice(1) : '−' + s; }
  else if (s.length < 12) s += k;
  LS.input = s; const d = $('lsDisp'); if (!d) return;
  d.className = 'disp' + (s ? '' : ' empty'); d.innerHTML = s ? esc(s) + (LS.task.unit ? `<span class="u">${LS.task.unit}</span>` : '') : 'введи ответ';
}
function useTool(tool) {
  if (!LS.task || S.items[tool] <= 0) return;
  const t = LS.task;
  if (tool === 'hint') {
    if (LS.hint) return; const T = TOPICS[t.topic], fs = (T.formulas || []).map(id => FORMULA_BY_ID[id]).filter(Boolean);
    LS.hint = true; S.items.hint--; const h = $('lsHint'); h.innerHTML = '<div class="hintbox">💡 ' + (fs.length ? fs.slice(0, 3).map(f => `<b>${f.name}:</b> ${f.f}`).join('<br>') : T.learn) + '</div>'; drawNotice('Подсказка использована: бонус за скорость не начисляется.');
  } else if (tool === 'fifty') {
    if (t.kind !== 'choice' || LS.fiftyUsed === t) return; LS.fiftyUsed = t; S.items.fifty--;
    const wrong = t.choices.map((_, i) => i).filter(i => i !== t.ans); R.sh(wrong).slice(0, 2).forEach(i => document.querySelector(`.choice[data-i="${i}"]`).classList.add('gone'));
  } else if (tool === 'time') { S.items.time--; LS.extraT += 15; drawNotice('+15 секунд ⏱️'); }
  else if (tool === 'swap') { S.items.swap--; LS.late_ = LS.late_; loadTask(true); drawNotice('Задача заменена 🔄'); }
  Snd.play('ok'); drawTools(); save();
}

// ---------------------------------------------------------------- проверка ответа и награды
function submit(ans) {
  if (!LS.active || LS.fb || LS.locked) return;
  const t = LS.task; if (t.kind !== 'choice' && (ans === '' || ans === undefined)) { toast('Сначала введи ответ', 'bad'); return; }
  const ok = checkAnswer(t, ans), elapsed = (Date.now() - LS.tStart) / 1000, frac = elapsed / (LS.limit + LS.extraT);
  if (t.kind === 'choice') { const els = document.querySelectorAll('.choice'); els.forEach((e, i) => { if (i === t.ans) e.classList.add('right'); else if (i === ans) e.classList.add('wrong'); }); }
  if (ok) {
    if (LS.late_) { finishSlot('late', true); return; }
    const fast = frac <= .5 && !LS.hint; finishSlot(fast ? 'fast' : 'ok', true);
  } else { LS.late_ = false; showWrong(t, ans, false); }
}
function floatText(txt, cls) {
  const el = document.createElement('div'); el.className = 'float'; el.textContent = txt; el.style.left = (30 + Math.random() * 40) + '%'; el.style.top = '38%'; $('ls').appendChild(el); setTimeout(() => el.remove(), 1000);
}
function flash(kind) { const f = document.createElement('div'); f.className = 'flash ' + kind; $('ls').appendChild(f); setTimeout(() => f.remove(), 520); }
function rewardFor(res, t) {
  const cfg = LS.cfg; if (cfg.kind === 'exam') return { c: 0, x: 0 };
  const d = t.lv || 1, base = 3 + 2 * d, fastM = res === 'fast' ? 1.5 : 1, comboM = LS.combo >= 8 ? 2 : LS.combo >= 5 ? 1.5 : LS.combo >= 3 ? 1.2 : 1;
  let c = base * fastM * comboM * coinModeMul() * (1 + petPerk().coin) * (cfg.coinMul || 1) * (LS.cocoa ? 2 : 1); if (LS.hint) c *= .5;
  const x = (6 + 4 * d) * (res === 'fast' ? 1.4 : 1) * (cfg.xpMul || 1) * (cfg.kind === 'cards' ? .6 : 1);
  return { c: Math.max(1, Math.round(c)), x: Math.round(x) };
}
function practiceCap(c) { // тренировки не должны быть «фермой монет»
  if (!['practice', 'mixed', 'cards'].includes(LS.cfg.kind)) return c;
  const s = S.seen.prac && S.seen.prac.day === dayNum() ? S.seen.prac : (S.seen.prac = { day: dayNum(), n: 0 });
  const left = Math.max(0, 150 - s.n); const g = Math.min(c, left); s.n += g; return g;
}
function finishSlot(res, correct, timeoutExam) {
  const t = LS.task, cfg = LS.cfg;
  LS.res[LS.i] = res; LS.late_ = false; LS.reshuf = 0;
  S.stats.answered++;
  if (res === 'fast' || res === 'ok') {
    LS.combo++; LS.maxCombo = Math.max(LS.maxCombo, LS.combo); LS.correct++; S.stats.correct++;
    if (res === 'fast') { LS.fast++; S.stats.fast++; }
    recMastery(t.topic, res);
    let rw = rewardFor(res, t); rw.c = practiceCap(rw.c); LS.coins += rw.c; LS.xp += rw.x;
    LS.points += res === 'fast' ? 1 : .75; if (cfg.kind === 'exam') LS.score++;
    questEvent('correct', 1); if (res === 'fast') questEvent('fast', 1); questEvent('combo', 0, LS.combo); if (t.review || cfg.quest === 'review') { questEvent('review', 1); S.stats.review++; } if (cfg.kind === 'cards') { questEvent('card', 1); S.stats.cardsOk++; }
    S.stats.maxCombo = Math.max(S.stats.maxCombo, LS.combo);
    Snd.play(res === 'fast' ? 'fast' : 'ok'); vibe(15); flash('good');
    if (cfg.kind !== 'exam') floatText((res === 'fast' ? '⚡ ' : '') + '+' + rw.c + ' 🪙');
    if (cfg.boss) bossHit(res === 'fast');
  } else if (res === 'late') {
    LS.correct++; LS.points += .4; LS.late++; LS.combo = 0; S.stats.correct++; Snd.play('late'); floatText('без бонуса'); flash('good');
    if (cfg.boss) bossHit(false);
  } else if (res === 'bad') {
    LS.bad++; LS.combo = 0; recMastery(t.topic, 'bad');
  }
  if (cfg.kind === 'olymp') { LS.score = LS.correct; }
  drawCoin(); drawDots(); drawHearts(); save();
  LS.locked = true; endSlotSoon(res === 'bad' ? 200 : 650);
}
function endSlotSoon(ms) {
  setTimeout(() => {
    if (!LS.active || LS.fb) return;
    LS.i++;
    const cfg = LS.cfg;
    if (cfg.kind === 'olymp') { loadTask(); return; }
    if (LS.i >= LS.n) { finishLesson(true); return; }
    LS.locked = false; loadTask();
  }, ms);
}
function loseHeart() { if (!LS.maxHearts) return; LS.hearts--; drawHearts(); }
function showWrong(t, given, timedOut) {
  const cfg = LS.cfg;
  LS.fb = true; LS.res[LS.i] = 'bad'; LS.bad++; LS.combo = 0; S.stats.answered++; recMastery(t.topic, 'bad'); drawCoin();
  Snd.play('bad'); vibe([60, 30, 60]); flash('bad');
  if (cfg.maxHeartsLose !== false) loseHeart();
  if (cfg.boss) bossAttack();
  drawDots(); drawHearts();
  if (cfg.kind === 'exam') { LS.fb = false; LS.locked = true; endSlotSoon(150); return; }
  const dead = LS.maxHearts && LS.hearts <= 0;
  let ansHtml = typeof t.choices !== 'undefined' && typeof t.choices[t.ans] !== 'string' ? '<canvas id="fbFig"></canvas>' : '<b>' + answerText(t) + '</b>';
  const box = document.createElement('div'); box.className = 'fb'; box.id = 'fb';
  box.innerHTML = `<div class="box"><h2>${timedOut ? '⏰ Не успел' : '😬 Не совсем так'}</h2><div class="muted" style="margin-bottom:6px">${timedOut ? 'Время вышло три раза подряд.' : 'Ничего страшного — разберём ошибку!'}</div>
  <div class="sol"><div style="margin-bottom:6px">${t.q}</div>${t.fig ? '<canvas id="fbFig0" style="max-width:100%"></canvas>' : ''}Правильный ответ: ${ansHtml}<hr style="border:0;border-top:2px dashed rgba(29,42,91,.25);margin:8px 0">${t.sol || ''}</div>
  <div class="muted" style="font-size:12px;margin-bottom:8px">Эта тема попадёт в «Работу над ошибками» — вернёмся к ней позже.</div>
  <button class="btn gold xl wide" id="fbOk">${dead ? 'Продолжить' : 'Понятно, дальше ➜'}</button></div>`;
  $('ls').appendChild(box);
  if (t.fig) { const sz = figSize(t.fig, 300); drawFigure($('fbFig0'), t.fig, sz[0], sz[1]); }
  const ff = $('fbFig'); if (ff) drawFigure(ff, t.choices[t.ans].fig, 150, 108);
  $('fbOk').onclick = () => { box.remove(); LS.fb = false; if (dead) { finishLesson(false); return; } LS.locked = true; endSlotSoon(50); };
}

// ---------------------------------------------------------------- босс
function bossHit(fast) {
  const be = $('lsBe'); if (!be) return; LS.bossHp = Math.max(0, LS.bossHp - 1);
  $('lsBhp').style.width = Math.round(100 * LS.bossHp / LS.n) + '%'; be.classList.remove('hit', 'atk'); void be.offsetWidth; be.classList.add('hit'); Snd.play('hit');
  const tn = $('lsTaunt'); if (tn) tn.textContent = fast ? R.pick(['Ай!', 'Быстрый какой…', 'Как ты так быстро?!']) : R.pick(['Ох…', 'Больно!', 'Хм, неплохо…']);
}
function bossAttack() {
  const be = $('lsBe'); if (!be) return; be.classList.remove('hit', 'atk'); void be.offsetWidth; be.classList.add('atk');
  const tn = $('lsTaunt'); if (tn) tn.textContent = R.pick(['Ха-ха! Ошибка!', 'Мимо!', 'Я же говорил!', 'Считай лучше!']);
}

// ---------------------------------------------------------------- выход
function askExit() {
  if (!LS.active || LS.fb && $('fb') && $('fb').dataset.exit) return;
  const box = document.createElement('div'); box.className = 'fb'; box.id = 'fb'; box.dataset.exit = 1; const was = LS.fb; LS.fb = true;
  box.innerHTML = `<div class="box"><h2>Выйти из урока?</h2><p class="muted">Прогресс этого урока не сохранится${LS.cfg.kind === 'exam' ? ', ЕГЭ будет считаться несданным' : ''}. Таймер не останавливается.</p><div class="row" style="justify-content:center"><button class="btn red" id="exY">Выйти</button><button class="btn green" id="exN">Остаться</button></div></div>`;
  $('ls').appendChild(box);
  $('exN').onclick = () => { box.remove(); LS.fb = was; };
  $('exY').onclick = () => { box.remove(); LS.ended = true; closeLesson(); };
}

// ---------------------------------------------------------------- завершение
function finishLesson(completed) {
  if (LS.ended) return; LS.ended = true; LS.fb = true; endLessonTimers(); const cfg = LS.cfg, n = Math.max(1, LS.i >= LS.n ? LS.n : LS.i);
  const el = (Date.now() - LS.t0) / 1000;
  const html = [];
  let title = '', stars = 0, coins = LS.coins, xp = LS.xp, extra = [], win = completed;
  const ratio = LS.points / LS.n;
  if (cfg.kind === 'olymp') {
    win = true; const sc = LS.correct; S.stats.olympBest = Math.max(S.stats.olympBest, sc);
    const bonus = sc * 2; coins += bonus; xp += sc * 3; title = `Олимпиада завершена: ${sc} ${pl(sc, 'задача', 'задачи', 'задач')}`; extra.push(`Бонус за серию: +${bonus} 🪙`);
    if (sc >= S.stats.olympBest && sc > 0) extra.push('🏅 Это твой лучший результат!');
  } else if (cfg.kind === 'exam') {
    const score = Math.round(100 * LS.score / LS.n); win = score >= EGE.pass; const prev = S.egeBest; S.egeBest = Math.max(S.egeBest, score); S.egeTries++;
    const grade = score >= 85 ? 5 : score >= 65 ? 4 : score >= 45 ? 3 : 2; coins = score * 2; xp = score * 3;
    title = `ЕГЭ: ${score} баллов из 100 (оценка ${grade})`;
    extra.push(score < EGE.pass ? `Минимальный порог — ${EGE.pass}. Не расстраивайся: потренируйся и пересдай!` : score >= EGE.uni ? '🎓 Этого хватает для поступления в УВУ!' : `Порог пройден, но для УВУ нужно ${EGE.uni}+ баллов.`);
    if (score > prev) extra.push(`Новый личный рекорд (было ${prev})`);
    if (score >= 100 && !S.own.hat[7]) { S.own.hat[7] = true; extra.push('👑 Стобалльная корона добавлена в гардероб!'); }
    stars = grade >= 5 ? 3 : grade >= 4 ? 2 : grade >= 3 ? 1 : 0;
  } else if (!completed) {
    title = cfg.kind === 'duel' ? 'Гоша победил!' : 'Нервы не выдержали 😵'; win = false; coins = Math.round(coins * .5); xp = Math.round(xp * .5);
    extra.push('Заработанное частично сохранено. Попробуй ещё раз — задачи будут новые!');
  } else {
    title = cfg.kind === 'boss' ? `Босс повержен: ${NPC[cfg.boss].name}!` : cfg.kind === 'duel' ? '' : 'Урок пройден!';
    stars = ratio >= .85 ? 3 : ratio >= .6 ? 2 : 1;
    if (cfg.kind === 'practice' || cfg.kind === 'mixed' || cfg.kind === 'cards') { stars = 0; title = cfg.title + ' завершена'; }
    if (cfg.kind === 'duel') { const rv = cfg.rival, rp = (Date.now() - LS.t0) / 1000 / (LS.n * rv.spt); win = LS.correct >= 5 && rp < 1; title = win ? '⚔️ Победа в дуэли!' : '⚔️ Гоша оказался быстрее'; if (win) { coins += 40; extra.push('Награда за победу: +40 🪙'); S.stats.rivalWins++; } stars = 0; }
    else if (cfg.rival) { const rv = cfg.rival, rp = el / (LS.n * rv.spt); if (rp < 1) { LS.rivalWon = true; const b = Math.round(coins * .2) + 5; coins += b; S.stats.rivalWins++; extra.push(`${rv.e} Ты опередил соперника: +${b} 🪙`); } else extra.push(`${rv.e} ${rv.n} был быстрее. В следующий раз!`); }
  }
  // сохранить в прогресс
  let firstClear = false, newCards = [];
  if (completed && (cfg.kind === 'lesson' || cfg.kind === 'boss')) {
    const P = chProg(cfg.ch), key = cfg.kind === 'boss' ? 'boss' : 'lessons';
    const old = cfg.kind === 'boss' ? P.boss : P.lessons[cfg.j];
    if (cfg.kind === 'boss') P.boss = Math.max(P.boss, stars); else P.lessons[cfg.j] = Math.max(old, stars);
    firstClear = old === 0;
    if (firstClear) { const bonus = cfg.kind === 'boss' ? 60 + 30 * cfg.ch : 20 + 10 * stars; coins += bonus; extra.push(`🎉 Первое прохождение: +${bonus} 🪙`); }
    else if (stars > old) { const b = 10 * (stars - old); coins += b; extra.push(`⭐ Больше звёзд: +${b} 🪙`); }
    if (firstClear) {
      const nCards = cfg.kind === 'boss' ? 2 : 1;
      for (let k = 0; k < nCards; k++) { const id = pickCard(cfg.ch, cfg.kind === 'boss' ? CHAPTERS[cfg.ch].bossLesson.topics : cfg.topics); if (id && giveCard(id)) newCards.push(id); }
      xp += cfg.kind === 'boss' ? 100 + 30 * cfg.ch : 20;
    }
    if (cfg.kind === 'boss') { S.stats.bosses++; if (cfg.ch === 0 && !S.own.pet[7]) { S.own.pet[7] = true; extra.push('🐲 Дракончик Таблица теперь твой питомец! (Гардероб → Питомцы)'); } if (cfg.ch === 7) { S.finished = true; S.own.hat[6] = true; extra.push('🎓 Шапочка выпускника ждёт в гардеробе!'); } }
    S.stats.lessons++; if (LS.bad === 0 && LS.late === 0) { S.stats.perfect++; extra.push('💎 Безупречно!'); } if (stars === 3) S.stats.threeStars++;
    questEvent('lesson', 1); questEvent('stars', stars);
  }
  if (cfg.kind === 'duel' && win) questEvent('lesson', 0);
  if (LS.cocoa) extra.push('☕ Двойной компот сработал: монеты ×2');
  if (LS.extraHeart) extra.push('❤️ Справка от врача пригодилась');
  coins = Math.round(coins); xp = Math.round(xp);
  const gotC = cfg.kind === 'exam' ? Math.round(coins) : Math.round(coins - LS.coins); // монеты за ответы уже были начислены? — нет, начисляем сейчас целиком
  addCoins(coins, true); addXp(xp);
  if (cfg.kind === 'exam' && S.egeBest >= 0) { /* ничего */ }
  checkAch(); save(true);
  const rankPos = myRank(); S.stats.topRank = Math.max(S.stats.topRank || 0, rankPos === 1 ? 1 : 0);
  showResults({ title: title, stars: stars, coins: coins, xp: xp, extra: extra, win: win, completed: completed, newCards: newCards, firstClear: firstClear });
}
function showResults(r) {
  const cfg = LS.cfg, kinds = LS.res.map(x => x), n = LS.res.length;
  const box = document.createElement('div'); box.className = 'fb'; box.id = 'fbRes';
  const canNext = r.completed && cfg.kind === 'lesson' && cfg.j < 5, canRepeat = cfg.kind !== 'exam';
  const acc = n ? Math.round(100 * (LS.correct) / n) : 0;
  box.innerHTML = `<div class="box"><h2>${r.title}</h2>${r.stars || cfg.kind === 'exam' ? `<div class="stars">${[1, 2, 3].map(i => `<span>${i <= r.stars ? '⭐' : '☆'}</span>`).join('')}</div>` : (r.win ? '<div class="stars"><span>🏆</span></div>' : '<div class="stars"><span>📚</span></div>')}
  <div class="rw"><span class="price" style="font-size:16px">🪙 +${fmtN(r.coins)}</span><span class="price" style="font-size:16px;color:var(--mint)">✨ +${fmtN(r.xp)} опыта</span></div>
  <div class="muted" style="font-size:13px;margin:6px 0">Верно: ${LS.correct}${cfg.kind !== 'olymp' ? ' из ' + LS.n : ''} · быстрых: ${LS.fast} · лучшее комбо: ×${LS.maxCombo}</div>
  ${r.stars && cfg.kind === 'lesson' ? `<div class="muted" style="font-style:italic;margin:6px 0">«${R.pick(TEACHER_PRAISE[r.stars])}» — ${NPC[CHAPTERS[cfg.ch].teacher].name}</div>` : ''}
  ${r.extra.map(x => `<div style="font-size:14px;margin:4px 0">${x}</div>`).join('')}
  ${r.newCards.length ? '<h3>🃏 Новые шпаргалки</h3>' + r.newCards.map(id => cardHtml(FORMULA_BY_ID[id], true)).join('') : ''}
  <div class="row" style="justify-content:center;margin-top:12px;flex-wrap:wrap">${canNext ? '<button class="btn gold" id="rsNext">Следующий кабинет ➜</button>' : ''}${canRepeat ? `<button class="btn ${r.win ? 'ghost' : 'green'}" id="rsAgain">${r.win ? 'Ещё раз' : 'Попробовать снова'}</button>` : ''}<button class="btn ${canNext ? 'ghost' : 'gold'}" id="rsExit">В коридор</button></div></div>`;
  $('ls').appendChild(box);
  if (r.win || r.stars) Snd.play('win'); else Snd.play('lose');
  $('rsExit').onclick = () => { const after = r; closeLesson(); afterLesson(cfg, r); };
  const ag = $('rsAgain'); if (ag) ag.onclick = () => { closeLesson(); restart(cfg); };
  const nx = $('rsNext'); if (nx) nx.onclick = () => { closeLesson(); const j = cfg.j + 1; if (lessonUnlocked(cfg.ch, j)) { const L = CHAPTERS[cfg.ch].lessons[j]; openLesson(cfg.ch, j); } };
}
function restart(cfg) {
  const c = Object.assign({}, cfg);
  if (cfg.kind === 'cards') { startCardTrainer(); return; }
  if (cfg.kind === 'duel') { toast('Дуэль — раз в день. Приходи завтра!', 'ok'); return; }
  startLesson(c);
}
// после закрытия результатов: сюжетные реплики
function afterLesson(cfg, r) {
  if (cfg.kind === 'lesson' && r.firstClear && BEATS[cfg.ch] && BEATS[cfg.ch][cfg.j]) { say(BEATS[cfg.ch][cfg.j], () => save(true)); return; }
  if (cfg.kind === 'boss' && r.completed) {
    const C = CHAPTERS[cfg.ch];
    say(C.bossWin, () => {
      if (cfg.ch === 6) say([['dir', 'Пробник пройден, ' + nm() + '! Заходи ко мне в кабинет — пора сдавать настоящий ЕГЭ.']]);
      else if (cfg.ch === 7) say(EPILOGUE, () => { checkAch(); toast('🎓 Игра пройдена! В спортзале тебя ждёт Олимпиада.', 'big'); });
      else toast('⬆️ Путь на следующий этаж открыт!', 'big');
    });
  } else if (cfg.kind === 'exam') {
    if (S.egeBest >= EGE.uni && !S.seen.uniOpen) { S.seen.uniOpen = 1; say([['dir', 'Поздравляю! С таким баллом тебя ждут в Университете Великих Умов. Лифт теперь ведёт и на этаж университета.'], ['gosha', 'Что?! Ты набрал больше меня?! Хм… я просто не выспался.']]); }
  }
  save(true);
}
