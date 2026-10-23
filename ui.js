'use strict';
// ============================================================================
//  ИНТЕРФЕЙС: диалоги, меню, магазин, гардероб, библиотека, рейтинг, настройки
// ============================================================================
let UI_OPEN = true;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nm = () => S.name || 'друг';
const fill = t => String(t).replace(/\{name\}/g, nm());
function fmtN(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

// ---------------------------------------------------------------- тосты и HUD
function toast(html, kind) {
  const el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.innerHTML = html;
  const box = $('toasts'); box.appendChild(el); while (box.children.length > 4) box.removeChild(box.firstChild);
  setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3100);
}
function updHud() {
  if (!S || !$('hudLvl')) return;
  const ri = rankIdx(S.xp);
  $('hudLvl').textContent = ri + 1; $('hudRn').textContent = RANKS[ri][1];
  $('hudXp').style.width = Math.round(rankProgress(S.xp) * 100) + '%';
  $('hudCoins').innerHTML = '🪙 <b>' + fmtN(S.coins) + '</b>'; $('hudStars').innerHTML = '⭐ <b>' + totalStars() + '</b>';
  ensureQuests(); const ready = S.quests.list.filter(q => !q.claimed && q.prog >= q.goal).length;
  $('qDot').textContent = ready; $('qDot').classList.toggle('on', ready > 0);
  const M = WORLD.loc; if (M) $('locName').textContent = M.id === 'hub' ? '🏫 Холл школы' : CHAPTERS[+M.id.slice(1)].floor + ' · ' + CHAPTERS[+M.id.slice(1)].name;
}

// ---------------------------------------------------------------- диалоги
const DLG = { lines: [], i: 0, cb: null, typing: null, full: '', pos: 0, on: false, opts: null };
function say(lines, cb) {
  DLG.lines = lines.map(l => Array.isArray(l) ? { w: l[0], t: l[1] } : l); DLG.i = 0; DLG.cb = cb || null; DLG.on = true; UI_OPEN = true;
  $('dlg').style.display = 'block'; showLine();
}
function showLine() {
  const L = DLG.lines[DLG.i], P = L.w === 'hero' ? { name: nm(), e: S.look ? heroEmoji() : '🧒', c: '#7cd4ff' } : (NPC[L.w] || NPC.narr);
  DLG.full = fill(L.t); DLG.pos = 0; DLG.opts = L.opts || null;
  $('dlg').innerHTML = `<div class="box" id="dbox"><div class="pt" style="background:${P.c}33;border-color:${P.c}">${P.e}</div><div class="tx"><div class="nm" style="color:${P.c}">${esc(P.name)}</div><div class="tt" id="dtt"></div><div class="opts" id="dopts"></div></div><div class="more" id="dmore">нажми ▾</div></div>`;
  $('dmore').style.display = 'none';
  clearInterval(DLG.typing);
  DLG.typing = setInterval(() => {
    DLG.pos += 2; $('dtt').textContent = DLG.full.slice(0, DLG.pos);
    if (DLG.pos >= DLG.full.length) finishLine();
  }, 22);
  Snd.play('click');
}
function finishLine() {
  clearInterval(DLG.typing); DLG.typing = null; DLG.pos = DLG.full.length; const t = $('dtt'); if (!t) return; t.textContent = DLG.full;
  if (DLG.opts) {
    const box = $('dopts'); box.innerHTML = '';
    DLG.opts.forEach(o => { const b = document.createElement('button'); b.className = 'btn sm ' + (o.cls || ''); b.textContent = o.l; b.onclick = e => { e.stopPropagation(); endDialog(); o.fn && o.fn(); }; box.appendChild(b); });
  } else $('dmore').style.display = 'block';
}
function advanceDialog() {
  if (!DLG.on) return;
  if (DLG.typing) { finishLine(); return; }
  if (DLG.opts) return;
  DLG.i++;
  if (DLG.i >= DLG.lines.length) { const cb = DLG.cb; endDialog(); cb && cb(); } else showLine();
}
function endDialog() { clearInterval(DLG.typing); DLG.typing = null; DLG.on = false; DLG.cb = null; $('dlg').style.display = 'none'; if (!SCR.open) UI_OPEN = false; }
function heroEmoji() { return S.gender === 'g' ? '👧' : '🧒'; }

// ---------------------------------------------------------------- экраны
const SCR = { open: false, stack: [] };
const A = {}; // обработчики data-a
function openScreen(html, bind) {
  const el = $('screen'); el.innerHTML = html; el.classList.add('on'); SCR.open = true; UI_OPEN = true; hideJoy && hideJoy();
  bind && bind(el);
}
function closeScreen() {
  const el = $('screen'); el.classList.remove('on'); el.innerHTML = ''; SCR.open = false; SCR.stack = [];
  if (!DLG.on && !LS.active && !RUN.active) UI_OPEN = false; updHud(); save();
}
function pan(title, body, foot, opts) {
  opts = opts || {};
  return `<div class="panel" style="${opts.w ? 'width:min(' + opts.w + 'px,calc(100vw - 16px))' : ''}"><div class="hd"><h2>${title}</h2>${opts.noX ? '' : '<button class="x" data-a="close">✕</button>'}</div>${opts.tabs || ''}<div class="bd" id="bd">${body}</div>${foot ? '<div class="ft">' + foot + '</div>' : ''}</div>`;
}
$('screen').addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  Snd.init(); Snd.play('click');
  const fn = A[b.dataset.a]; if (fn) fn(b.dataset, b);
});
A.close = () => closeScreen();
$('dlg').addEventListener('click', advanceDialog);
$('dlg').addEventListener('touchstart', e => { e.stopPropagation(); }, { passive: true });
$('btnMenu').addEventListener('click', () => { Snd.init(); if (!UI_OPEN) openMenu(); });
$('btnQuest').addEventListener('click', () => { Snd.init(); if (!UI_OPEN) openBoard('quests'); });
$('hudRank').addEventListener('click', () => { if (!UI_OPEN) openProfile(); });

function statChip(e, v, l) { return `<div class="card center"><div class="big-e">${e}</div><h4>${v}</h4><p>${l}</p></div>`; }

// ---------------------------------------------------------------- главное меню
function openMenu() {
  const cards = [['profile', '👤', 'Профиль', 'Ранг, статистика, прогноз ЕГЭ'], ['report', '📒', 'Зачётка', 'Оценки по этажам и темам'], ['cards', '🃏', 'Шпаргалки', 'Коллекция формул'], ['ach', '🏆', 'Достижения', `${Object.keys(S.ach).length} из ${ACH.length}`], ['quests', '📋', 'Задания дня', 'Награды за активность'], ['rating', '🥇', 'Рейтинг класса', `Ты на ${myRank()}-м месте`], ['settings', '⚙️', 'Настройки', 'Звук, время, прогресс'], ['help', '❓', 'Как играть', 'Правила, награды, советы']];
  openScreen(pan('Меню', `<div class="grid g2">${cards.map(c => `<button class="card" data-a="menu" data-k="${c[0]}" style="text-align:left"><div class="row"><span class="big-e">${c[1]}</span><div><h4>${c[2]}</h4><p>${c[3]}</p></div></div></button>`).join('')}</div>`, ''));
}
A.menu = d => ({ profile: openProfile, report: openReport, cards: openCards, ach: openAch, quests: () => openBoard('quests'), rating: () => openBoard('rating'), settings: openSettings, help: openHelp })[d.k]();

// ---------------------------------------------------------------- профиль
function heroCanvas(w, h, look, dir, head) {
  const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2; cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const c = cv.getContext('2d'); const old = WORLD.c; WORLD.c = c; c.setTransform(2, 0, 0, 2, 0, 0);
  c.fillStyle = 'rgba(255,255,255,.08)'; rrect(c, 0, 0, w, h, 18); c.fill();
  if (head) drawPerson(c, w / 2, h / 2 + 62 * 1.9, { look: look || S.look, dir: dir || 'd', moving: false, scale: 1.9, seed: 2 });
  else drawPerson(c, w / 2, h - 16, { look: look || S.look, dir: dir || 'd', moving: false, scale: Math.min(w / 60, h / 100) * 1.0, seed: 2 });
  const pet = PETS[(look || S.look).pet]; if (pet && pet.e && !head) { c.font = '26px "Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.fillText(pet.e, w * .8, h - 14); }
  WORLD.c = old; return cv;
}
function openProfile() {
  const f = forecast(), ri = rankIdx(S.xp), acc = S.stats.answered ? Math.round(100 * S.stats.correct / S.stats.answered) : 0;
  const next = RANKS[ri + 1];
  const body = `
  <div class="row" style="align-items:center;margin-bottom:12px"><div id="pf-hero"></div><div class="sp"><h3 style="margin:0">${esc(nm())}</h3><div class="gold">${RANKS[ri][1]}</div><div class="bar g" style="margin:6px 0 3px"><i style="width:${Math.round(rankProgress(S.xp) * 100)}%"></i></div><div class="muted" style="font-size:12px">Опыт: ${fmtN(S.xp)}${next ? ' · до «' + next[1] + '»: ' + fmtN(next[0] - S.xp) : ' · максимальный ранг'}</div></div></div>
  <div class="grid g4">${statChip('🪙', fmtN(S.coins), 'монет')}${statChip('⭐', totalStars(), 'звёзд')}${statChip('✏️', fmtN(S.stats.correct), 'решено задач')}${statChip('🎯', acc + '%', 'точность')}</div>
  <div class="grid g4" style="margin-top:10px">${statChip('📚', S.stats.lessons, 'уроков пройдено')}${statChip('🐉', S.stats.bosses, 'боссов побеждено')}${statChip('🔥', S.stats.maxCombo, 'лучшее комбо')}${statChip('⏳', Math.round(S.stats.playSec / 60) + ' мин', 'в игре')}</div>
  <h3>📈 Прогноз ЕГЭ (ориентировочно)</h3>
  <div class="card"><div class="row"><div class="big-e">${f.grade === 5 ? '🌟' : f.grade === 4 ? '👍' : f.grade === 3 ? '🙂' : '📚'}</div><div class="sp"><h4>Базовый ЕГЭ: оценка ${f.grade} · около ${f.score} баллов из 100</h4><p>Считается по тому, насколько хорошо ты освоил каждую тему (быстрые правильные ответы повышают освоение, ошибки и забывание — снижают).</p></div></div>
  ${f.per.map(p => `<div class="progline"><span class="n">${CHAPTERS[p.ch].floor}: ${CHAPTERS[p.ch].name}</span><div class="bar ${p.cov > .8 ? 'g' : ''}"><i style="width:${Math.round(p.cov * 100)}%"></i></div><span style="width:36px;text-align:right;font-size:12px">${Math.round(p.cov * 100)}%</span></div>`).join('')}</div>
  ${f.weak.length ? `<h3>🎯 Подтяни слабые темы</h3><div class="grid g2">${f.weak.map(t => `<div class="card"><div class="row"><span class="big-e">${TOPICS[t].icon}</span><div class="sp"><h4>${TOPICS[t].name}</h4><div class="bar"><i style="width:${Math.round(mast(t).p)}%"></i></div></div><button class="btn sm gold" data-a="practice" data-t="${t}">Тренировать</button></div></div>`).join('')}</div>` : ''}`;
  openScreen(pan('Профиль', body, ''), el => { $('pf-hero').appendChild(heroCanvas(96, 130)); });
}
A.practice = d => { closeScreen(); startPractice(d.t, 2); };

// ---------------------------------------------------------------- зачётка
function gradeOf(ch) {
  const P = chProg(ch), tot = P.lessons.length * 3 + 3, got = P.lessons.reduce((a, b) => a + b, 0) + (P.boss || 0); const r = got / tot;
  if (!P.boss) return got ? (r > .5 ? 4 : 3) : 0; return r >= .85 ? 5 : r >= .6 ? 4 : 3;
}
function openReport(chSel) {
  const ch = chSel === undefined ? Math.min(maxChapter(), 7) : chSel, C = CHAPTERS[ch], P = chProg(ch);
  const tabs = '<div class="tabs">' + CHAPTERS.map((c, i) => `<button class="tab ${i === ch ? 'on' : ''}" data-a="repch" data-c="${i}">${chUnlocked(i) ? '' : '🔒 '}${c.floor.replace(' этаж', '')}</button>`).join('') + '</div>';
  const g = gradeOf(ch);
  let body = `<div class="card" style="margin-bottom:10px"><div class="row"><span class="big-e">${NPC[C.teacher].e}</span><div class="sp"><h4>${C.name} · ${C.grade}</h4><p>Учитель: ${NPC[C.teacher].name}</p></div><div class="center"><div style="font-size:34px;font-family:var(--display);color:var(--gold)">${g || '–'}</div><div class="muted" style="font-size:11px">оценка</div></div></div></div>`;
  body += C.lessons.map((l, j) => {
    const s = P.lessons[j]; return `<div class="card" style="margin-bottom:8px"><div class="row"><div class="sp"><h4>${l.room} · ${l.n}</h4>${l.topics.map(t => `<div class="progline"><span class="n">${TOPICS[t].icon} ${TOPICS[t].name}</span><div class="bar"><i style="width:${Math.round(mast(t).p)}%"></i></div></div>`).join('')}</div><div style="font-size:20px;letter-spacing:2px">${'⭐'.repeat(s)}${'☆'.repeat(3 - s)}</div></div></div>`;
  }).join('');
  body += `<div class="card"><div class="row"><span class="big-e">${NPC[C.boss].e}</span><div class="sp"><h4>${NPC[C.boss].name}</h4><p>${P.boss ? 'Побеждён' : 'Ещё не побеждён'}</p></div><div style="font-size:20px;letter-spacing:2px">${'⭐'.repeat(P.boss || 0)}${'☆'.repeat(3 - (P.boss || 0))}</div></div></div>`;
  openScreen(pan('Зачётка', body, '', { tabs: tabs }));
}
A.repch = d => openReport(+d.c);

// ---------------------------------------------------------------- шпаргалки
function cardHtml(f, owned) {
  return owned ? `<div class="fcard"><h4>${esc(f.name)}</h4><div class="f">${f.f}</div><p>${esc(f.tip)}</p></div>` : `<div class="fcard locked"><h4>${esc(f.name)}</h4><div class="f">🔒</div><p>Найди в шкафчиках на этаже «${CHAPTERS[f.ch].name}» или получи за уроки.</p></div>`;
}
function openCards(chSel) {
  const ch = chSel === undefined ? Math.min(maxChapter(), 7) : chSel, list = FORMULAS.filter(f => f.ch === ch), own = list.filter(f => S.cards[f.id]).length, total = Object.keys(S.cards).length;
  const tabs = '<div class="tabs">' + CHAPTERS.map((c, i) => `<button class="tab ${i === ch ? 'on' : ''}" data-a="cardch" data-c="${i}">${i}</button>`).join('') + '</div>';
  const body = `<div class="row" style="margin-bottom:10px"><div class="sp"><h4 style="margin:0">${CHAPTERS[ch].floor}: ${CHAPTERS[ch].name}</h4><div class="muted" style="font-size:12px">Собрано ${own} из ${list.length} · всего ${total} из ${FORMULAS.length}</div></div><button class="btn sm gold" data-a="cardtrain">🃏 Тренировать</button></div><div class="grid g2">${list.map(f => cardHtml(f, S.cards[f.id])).join('')}</div>`;
  openScreen(pan('Шпаргалки', body, '', { tabs: tabs }));
}
A.cardch = d => openCards(+d.c);
A.cardtrain = () => { closeScreen(); startCardTrainer(); };
function showCardPopup(id) {
  const f = FORMULA_BY_ID[id];
  openScreen(pan('🃏 Новая шпаргалка', cardHtml(f, true), '<button class="btn gold" data-a="close">Класс!</button>', { w: 460, noX: true }));
}

// ---------------------------------------------------------------- достижения
function openAch() {
  const body = `<div class="muted" style="margin-bottom:8px">Получено: ${Object.keys(S.ach).length} из ${ACH.length}</div><div class="grid g2">${ACH.map(a => { const ok = !!S.ach[a.id]; return `<div class="card ${ok ? '' : 'lock'}"><div class="row"><span class="big-e">${ok ? a.e : '🔒'}</span><div class="sp"><h4>${a.n}</h4><p>${a.d}</p></div><span class="price">+${a.r} 🪙</span></div></div>`; }).join('')}</div>`;
  openScreen(pan('Достижения', body, ''));
}

// ---------------------------------------------------------------- доска объявлений: задания и рейтинг
function openBoard(tab) {
  tab = tab || 'quests';
  const tabs = `<div class="tabs"><button class="tab ${tab === 'quests' ? 'on' : ''}" data-a="boardtab" data-t="quests">📋 Задания дня</button><button class="tab ${tab === 'rating' ? 'on' : ''}" data-a="boardtab" data-t="rating">🥇 Рейтинг класса</button></div>`;
  let body = '';
  if (tab === 'quests') {
    ensureQuests();
    const allDone = S.quests.list.every(q => q.claimed);
    body += S.quests.list.map((q, i) => {
      const t = QUEST_T.find(x => x.id === q.id), done = q.prog >= q.goal;
      return `<div class="card" style="margin-bottom:8px"><div class="row"><div class="sp"><h4>${t.t(q.goal)}</h4><div class="bar ${done ? 'g' : ''}" style="margin-top:6px"><i style="width:${Math.min(100, Math.round(100 * q.prog / q.goal))}%"></i></div><p style="margin-top:4px">${Math.min(q.prog, q.goal)} / ${q.goal}</p></div><div class="center"><div class="price">+${q.r} 🪙</div><br>${q.claimed ? '<span class="pill">Получено</span>' : `<button class="btn sm ${done ? 'gold' : 'ghost'}" ${done ? '' : 'disabled'} data-a="claimq" data-i="${i}">Забрать</button>`}</div></div></div>`;
    }).join('');
    body += `<div class="card" style="margin-bottom:12px"><div class="row"><span class="big-e">🎁</span><div class="sp"><h4>Бонус за все задания дня</h4><p>Выполни все три — получишь сундук с припасами.</p></div>${S.quests.bonus ? '<span class="pill">Получено</span>' : `<button class="btn sm ${allDone ? 'gold' : 'ghost'}" ${allDone ? '' : 'disabled'} data-a="claimbonus">Открыть</button>`}</div></div>`;
    body += `<h3>🗓️ Подарки за вход (серия: ${S.streak.count} дн.)</h3><div class="grid g4">${LOGIN_REWARDS.map((r, i) => { const cur = (S.streak.count - 1) % 7, st = i < cur ? 'done' : i === cur ? 'today' : 'next'; return `<div class="card center ${st === 'today' ? 'sel' : ''}" style="opacity:${st === 'done' ? .55 : 1}"><div class="muted" style="font-size:11px">День ${i + 1}</div><div class="big-e">${st === 'done' ? '✅' : i === 6 ? '🎁' : '🪙'}</div><p>${r.t}</p>${st === 'today' ? (S.streak.claimed ? '<span class="pill">Получено</span>' : '<button class="btn sm gold" data-a="claimlogin">Забрать</button>') : ''}</div>`; }).join('')}</div>`;
  } else {
    const rows = ratingTable();
    body = `<div class="muted" style="margin-bottom:8px">Рейтинг считается по опыту. Одноклассники растут каждый день — занимайся регулярно, чтобы не отстать!</div>` + rows.map(r => `<div class="lbrow ${r.me ? 'me' : ''}"><span class="pos">${r.pos}</span><span class="big-e" style="font-size:26px">${r.e}</span><span class="sp" style="flex:1">${esc(r.n)}${r.me ? ' (ты)' : ''}</span><b class="gold">${fmtN(r.v)}</b></div>`).join('');
  }
  openScreen(pan(tab === 'quests' ? 'Доска объявлений' : 'Рейтинг класса', body, '', { tabs: tabs }));
}
A.boardtab = d => openBoard(d.t);
A.claimq = d => { if (claimQuest(+d.i)) { Snd.play('coin'); } openBoard('quests'); };
A.claimbonus = () => { if (S.quests.bonus) return; S.quests.bonus = true; const it = R.pick(['hint', 'fifty', 'time', 'swap', 'heart']); S.items[it]++; addCoins(60); const c = CONS.find(x => x.id === it); toast(`🎁 Сундук: 60 🪙 и ${c.e} ${c.n}`, 'big'); save(true); openBoard('quests'); };
A.claimlogin = () => { const r = claimLogin((S.streak.count - 1) % 7); toast('🎁 Подарок: ' + r.t, 'big'); checkAch(); openBoard('quests'); };

// ---------------------------------------------------------------- настройки
function openSettings() {
  const st = S.settings;
  const tog = (k, l) => `<div class="row card" style="margin-bottom:8px"><span class="sp">${l}</span><button class="btn sm ${st[k] ? 'green' : 'ghost'}" data-a="tog" data-k="${k}">${st[k] ? 'Вкл' : 'Выкл'}</button></div>`;
  const body = `${tog('sound', '🔊 Звуки')}${tog('music', '🎵 Музыка')}${tog('vibe', '📳 Вибрация')}${tog('rival', '🏁 Соревнование с соперником в уроках')}
  <div class="card" style="margin-bottom:8px"><h4>⏱ Время на задачи</h4><p>Влияет на таймер и на награду.</p><div class="opt" style="margin-top:8px">${[[.8, 'Экзамен ×0,8 (+25% монет)'], [1, 'Обычно ×1'], [1.5, 'Спокойно ×1,5 (−25% монет)']].map(o => `<button class="o ${st.timeMode === o[0] ? 'on' : ''}" data-a="tmode" data-v="${o[0]}">${o[1]}</button>`).join('')}</div></div>
  <div class="card" style="margin-bottom:8px"><h4>💾 Перенос прогресса</h4><p>Скопируй код и вставь его на другом устройстве (кнопка «Загрузить код»).</p><div class="row" style="margin-top:8px;flex-wrap:wrap"><button class="btn sm" data-a="exp">Показать код</button><button class="btn sm ghost" data-a="imp">Загрузить код</button></div><textarea id="codebox" class="input" style="display:none;margin-top:8px;height:90px;font-size:12px"></textarea><button class="btn sm gold" id="codeok" data-a="impok" style="display:none;margin-top:8px">Применить код</button></div>
  <div class="card" style="margin-bottom:8px"><h4>✏️ Имя героя</h4><div class="row" style="margin-top:8px"><input id="newname" class="input" maxlength="14" value="${esc(S.name)}"><button class="btn sm" data-a="rename">OK</button></div></div>
  <div class="card"><h4>🗑 Начать заново</h4><p>Удалит весь прогресс на этом устройстве.</p><button class="btn sm red" data-a="reset" style="margin-top:8px">Сбросить прогресс</button></div>
  <p class="muted center" style="font-size:12px;margin-top:12px">${GAME_TITLE} · версия ${VERSION}<br>Задачи создаются случайно при каждом запуске — у каждого свои числа.</p>`;
  openScreen(pan('Настройки', body, ''));
}
A.tog = d => { const k = d.k; S.settings[k] = !S.settings[k]; if (k === 'sound') Snd.setOn(S.settings.sound); if (k === 'music') Snd.setMusic(S.settings.music); save(true); openSettings(); };
A.tmode = d => { S.settings.timeMode = +d.v; save(true); openSettings(); };
A.exp = () => { const b = $('codebox'); b.style.display = 'block'; b.value = exportSave(); b.select(); try { document.execCommand('copy'); toast('Код скопирован 📋', 'ok'); } catch (e) { } };
A.imp = () => { const b = $('codebox'); b.style.display = 'block'; b.value = ''; b.placeholder = 'Вставь код сюда'; $('codeok').style.display = 'inline-block'; b.focus(); };
A.impok = () => { if (importSave($('codebox').value)) { toast('Прогресс загружен! Перезапускаю…', 'big'); setTimeout(() => location.reload(), 900); } else toast('Код не подходит 😕', 'bad'); };
A.rename = () => { const v = $('newname').value.trim(); if (v) { S.name = v.slice(0, 14); save(true); toast('Имя изменено', 'ok'); } };
A.reset = () => { if (confirm('Точно удалить весь прогресс?')) { resetSave(); location.reload(); } };

// ---------------------------------------------------------------- столовая (магазин припасов)
function openShop() {
  const free = S.seen.freeDay !== dayNum();
  const body = `<div class="card" style="margin-bottom:10px"><div class="row"><span class="big-e">👩‍🍳</span><div class="sp"><h4>Тётя Валя</h4><p>«Покушай, деточка! Для мозга полезно. А припасы для уроков — вон на витрине.»</p></div>${free ? '<button class="btn sm gold" data-a="freeje">Бесплатный компот</button>' : '<span class="pill">Компот выпит</span>'}</div></div>
  <div class="grid g2">${CONS.map(c => `<div class="card"><div class="row"><span class="big-e">${c.e}</span><div class="sp"><h4>${c.n} <span class="pill">×${S.items[c.id] || 0}</span></h4><p>${c.d}</p></div></div><div class="row" style="margin-top:8px"><span class="price">${c.p} 🪙</span><span class="sp"></span><button class="btn sm gold" data-a="buy" data-i="${c.id}" ${S.coins < c.p ? 'disabled' : ''}>Купить</button></div></div>`).join('')}</div>
  <p class="muted" style="font-size:12px;margin-top:10px">Монеты зарабатываются в уроках: чем быстрее и точнее ответы, тем больше награда.</p>`;
  openScreen(pan('Столовая · ' + fmtN(S.coins) + ' 🪙', body, ''));
}
A.freeje = () => { if (S.seen.freeDay === dayNum()) return; S.seen.freeDay = dayNum(); S.items.hint++; addCoins(10); toast('☕ Компот выпит: +10 🪙 и 💡 подсказка', 'ok'); openShop(); };
A.buy = d => { const c = CONS.find(x => x.id === d.i); if (!buy(c.p)) { toast('Не хватает монет', 'bad'); return; } S.items[c.id] = (S.items[c.id] || 0) + 1; Snd.play('coin'); checkAch(); save(true); openShop(); };

// ---------------------------------------------------------------- гардероб
let WCAT = 'hair';
const WTABS = [['hair', 'Причёска'], ['hairC', 'Цвет волос'], ['skin', 'Кожа'], ['shirt', 'Одежда'], ['bag', 'Рюкзак'], ['hat', 'Шапки'], ['glasses', 'Очки'], ['trail', 'Шлейф'], ['pet', 'Питомцы']];
function openWardrobe(cat) {
  if (cat) WCAT = cat;
  const defs = itemDefs(WCAT), tabs = '<div class="tabs">' + WTABS.map(t => `<button class="tab ${t[0] === WCAT ? 'on' : ''}" data-a="wtab" data-c="${t[0]}">${t[1]}</button>`).join('') + '</div>';
  const items = defs.map((d, i) => {
    const own = S.own[WCAT][i], on = S.look[WCAT] === i, p = PRICES[WCAT][i];
    let vis = (WCAT === 'hair' || WCAT === 'glasses') ? `<span class="th" data-th="${i}"></span>` : d.e ? `<span class="ie">${d.e || '∅'}</span>` : d.c ? `<span class="sw" style="background:${d.c === 'rainbow' ? 'linear-gradient(90deg,#f55,#fb4,#6e8,#5be,#b8f)' : d.c};display:inline-block"></span>` : `<span class="ie">${i === 0 ? '∅' : '✦'}</span>`;
    if (WCAT === 'pet' && i === 0) vis = '<span class="ie">∅</span>';
    return `<button class="it ${on ? 'on' : ''} ${own ? '' : 'lock'}" data-a="witem" data-i="${i}">${vis}<span>${esc(d.n)}</span>${d.perk ? `<span class="muted" style="font-size:10px">${d.perk}</span>` : ''}${own ? (on ? '<span class="ip">Надето</span>' : '') : `<span class="ip">${PETS[i] && WCAT === 'pet' && PETS[i].boss !== undefined && !own ? 'За босса' : p + ' 🪙'}</span>`}</button>`;
  }).join('');
  openScreen(pan('Гардероб · ' + fmtN(S.coins) + ' 🪙', `<div class="row" style="align-items:flex-start;gap:14px"><div id="wr-prev" style="flex:none"></div><div class="sp" style="min-width:0"><div class="itemgrid">${items}</div></div></div>`, '', { tabs: tabs, w: 820 }),
    () => { $('wr-prev').appendChild(heroCanvas(130, 190)); document.querySelectorAll('[data-th]').forEach(el => { const lk = Object.assign({}, S.look); lk[WCAT] = +el.dataset.th; el.appendChild(heroCanvas(66, 66, lk, 'd', true)); }); });
}
A.wtab = d => openWardrobe(d.c);
A.witem = d => {
  const i = +d.i; const own = S.own[WCAT][i], p = PRICES[WCAT][i];
  if (!own) {
    if (WCAT === 'pet' && PETS[i].boss !== undefined) { toast('Этого питомца дарят за победу над боссом', 'bad'); return; }
    if (!buy(p)) { toast('Не хватает монет', 'bad'); return; } S.own[WCAT][i] = true; Snd.play('coin'); checkAch();
  }
  S.look[WCAT] = i; Snd.play('ok'); save(true); openWardrobe();
};

// ---------------------------------------------------------------- лифт
function openElevator() {
  const body = `<div class="grid g2">${CHAPTERS.map((c, i) => {
    const un = chUnlocked(i), P = S.prog[i], done = P && P.boss > 0, stars = P ? P.lessons.reduce((a, b) => a + b, 0) : 0;
    return `<button class="card ${un ? '' : 'lock'}" data-a="floor" data-c="${i}" style="text-align:left"><div class="row"><span class="big-e">${un ? NPC[c.boss].e : '🔒'}</span><div class="sp"><h4>${c.floor}</h4><p>${c.name} · ${c.grade}</p><p style="margin-top:4px">${un ? `⭐ ${stars}/18 ${done ? '· ✅ босс' : ''}` : (i === 7 ? 'Нужно сдать ЕГЭ на ' + EGE.uni + '+ баллов' : 'Победи босса этажом ниже')}</p></div></div></button>`;
  }).join('')}</div>`;
  openScreen(pan('🛗 Лифт', body, ''));
}
A.floor = d => { const c = +d.c; if (!chUnlocked(c)) { toast(c === 7 ? 'Сначала сдай ЕГЭ у директора' : 'Этаж закрыт. Победи босса ниже!', 'bad'); return; } closeScreen(); goLoc('f' + c, 'left'); };

// ---------------------------------------------------------------- библиотека
function openLibrary() {
  const f = forecast(), owned = Object.keys(S.cards).length;
  const body = `<div class="card" style="margin-bottom:10px"><div class="row"><span class="big-e">👵</span><div class="sp"><h4>Фолиантовна</h4><p>«Тише! Знания любят повторение. Что будем тренировать?»</p></div></div></div>
  <div class="grid g2">
  <button class="card" data-a="lib" data-k="topic" style="text-align:left"><div class="row"><span class="big-e">🎯</span><div><h4>Тренировка по теме</h4><p>Выбери любую открытую тему и практикуйся</p></div></div></button>
  <button class="card" data-a="lib" data-k="mistakes" style="text-align:left"><div class="row"><span class="big-e">🩹</span><div><h4>Работа над ошибками</h4><p>${S.wrong.length ? S.wrong.length + ' тем требуют повторения' : 'Пока ошибок нет — молодец!'}</p></div></div></button>
  <button class="card" data-a="lib" data-k="review" style="text-align:left"><div class="row"><span class="big-e">🔁</span><div><h4>Повторение</h4><p>10 задач на самые подзабытые темы</p></div></div></button>
  <button class="card" data-a="lib" data-k="cards" style="text-align:left"><div class="row"><span class="big-e">🃏</span><div><h4>Карточки формул</h4><p>Вспомни формулу или её название (${owned} открыто)</p></div></div></button>
  <button class="card" data-a="lib" data-k="album" style="text-align:left"><div class="row"><span class="big-e">📖</span><div><h4>Альбом шпаргалок</h4><p>Все собранные формулы с примерами</p></div></div></button>
  <button class="card" data-a="lib" data-k="learn" style="text-align:left"><div class="row"><span class="big-e">💡</span><div><h4>Объяснения тем</h4><p>Короткая теория по любой теме</p></div></div></button>
  </div>`;
  openScreen(pan('Библиотека', body, ''));
}
A.lib = d => {
  const k = d.k;
  if (k === 'topic') openTopicPicker('practice'); else if (k === 'learn') openTopicPicker('learn');
  else if (k === 'cards') { closeScreen(); startCardTrainer(); }
  else if (k === 'album') openCards();
  else if (k === 'mistakes') { const ts = S.wrong.length ? S.wrong.slice() : forecast().weak; if (!ts.length) { toast('Пока нечего повторять 🎉', 'ok'); return; } closeScreen(); startMixed(ts, 10, 'Работа над ошибками', 'review'); }
  else if (k === 'review') { const ts = Object.keys(S.mastery).filter(t => TOPICS[t] && TOPICS[t].ch >= 0).sort((a, b) => mast(a).p - mast(b).p).slice(0, 5); if (!ts.length) { toast('Сначала пройди пару уроков', 'ok'); return; } closeScreen(); startMixed(ts, 10, 'Повторение', 'review'); }
};
function openTopicPicker(mode, ch) {
  const mx = maxChapter(); ch = ch === undefined ? Math.min(mx, 7) : ch;
  const tabs = '<div class="tabs">' + CHAPTERS.map((c, i) => `<button class="tab ${i === ch ? 'on' : ''}" data-a="tpch" data-c="${i}" data-m="${mode}">${chUnlocked(i) ? '' : '🔒'}${i + 1}</button>`).join('') + '</div>';
  let body = '';
  if (!chUnlocked(ch)) body = '<div class="center muted" style="padding:30px">Этот этаж пока закрыт. Победи босса этажом ниже!</div>';
  else body = `<div class="grid g2">${topicsOfChapter(ch).map(t => `<div class="card"><div class="row"><span class="big-e">${TOPICS[t].icon}</span><div class="sp"><h4>${TOPICS[t].name}</h4><div class="bar" style="margin-top:4px"><i style="width:${Math.round(mast(t).p)}%"></i></div></div></div><div class="row" style="margin-top:8px;gap:6px">${mode === 'learn' ? `<button class="btn sm gold" data-a="learnt" data-t="${t}">Читать</button>` : [1, 2, 3].map(d => `<button class="btn sm ${d === 1 ? 'green' : d === 2 ? 'gold' : 'red'}" data-a="prac" data-t="${t}" data-d="${d}">${['Легко', 'Средне', 'Сложно'][d - 1]}</button>`).join('')}</div></div>`).join('')}</div>`;
  openScreen(pan(mode === 'learn' ? 'Объяснения тем' : 'Тренировка', body, '', { tabs: tabs }));
}
A.tpch = d => openTopicPicker(d.m, +d.c);
A.prac = d => { closeScreen(); startPractice(d.t, +d.d); };
A.learnt = d => showLearn(d.t);
function learnHtml(t) {
  const T = TOPICS[t];
  return `<div class="card" style="margin-bottom:10px"><div class="row"><span class="big-e">${T.icon}</span><div class="sp"><h4>${T.name}</h4><p style="color:var(--text);margin-top:6px;font-size:15px;line-height:1.5">${esc(T.learn)}</p></div></div></div>` +
    (T.formulas && T.formulas.length ? '<h3>Формулы</h3><div class="grid g2">' + T.formulas.map(id => FORMULA_BY_ID[id]).filter(Boolean).map(f => cardHtml(f, true)).join('') + '</div>' : '');
}
function showLearn(t) { openScreen(pan(TOPICS[t].name, learnHtml(t), '<button class="btn gold" data-a="close">Понятно</button>')); }

// ---------------------------------------------------------------- спортзал
function openGym() {
  const body = `<div class="card" style="margin-bottom:10px"><div class="row"><span class="big-e">🏋️</span><div class="sp"><h4>Физрук Мышцыч</h4><p>«Не только мышцы, но и мозг надо качать! На разминку — беги по коридору и выбирай верные ответы.»</p></div></div></div>
  <div class="grid g2">
  <button class="card" data-a="gym" data-k="run" style="text-align:left"><div class="row"><span class="big-e">🏃</span><div><h4>Коридорный забег</h4><p>Беги по дорожкам и ныряй в ворота с верным ответом. Рекорд: ${S.stats.runBest}</p></div></div></button>
  <button class="card" data-a="gym" data-k="olymp" style="text-align:left"><div class="row"><span class="big-e">🥇</span><div><h4>Олимпиада</h4><p>Бесконечные задачи всё сложнее, 3 жизни. Рекорд: ${S.stats.olympBest}</p></div></div></button>
  </div>`;
  openScreen(pan('Спортзал', body, ''));
}
A.gym = d => { closeScreen(); if (d.k === 'run') startRunner(); else startOlympiad(); };

// ---------------------------------------------------------------- кабинет директора
function openDirector() {
  const f = forecast(), canExam = chProg(6).boss > 0, done = S.finished;
  const body = `<div class="card" style="margin-bottom:10px"><div class="row"><span class="big-e">👩‍💼</span><div class="sp"><h4>Гипотенуза Павловна</h4><p>${done ? '«Ты выпускник УВУ! Школа тобой гордится.»' : '«Присаживайся. Давай посмотрим на твои успехи.»'}</p></div></div></div>
  <div class="card" style="margin-bottom:10px"><h4>📈 Прогноз ЕГЭ: оценка ${f.grade}, около ${f.score} баллов</h4><p>Это ориентировочная оценка по освоению тем. Настоящий результат зависит от практики на разных заданиях.</p></div>
  <div class="card" style="margin-bottom:10px"><div class="row"><span class="big-e">📝</span><div class="sp"><h4>Единый государственный экзамен</h4><p>${canExam ? `${EGE.n} задач на время, без подсказок. Лучший результат: <b class="gold">${S.egeBest}</b> из 100. Для поступления в УВУ нужно ${EGE.uni}+.` : 'Откроется после победы над Ужасом ЕГЭ на седьмом этаже.'}</p></div><button class="btn gold" data-a="ege" ${canExam ? '' : 'disabled'}>${S.egeBest ? 'Пересдать' : 'Сдать ЕГЭ'}</button></div></div>
  <div class="card"><div class="row"><span class="big-e">🎓</span><div class="sp"><h4>Университет Великих Умов</h4><p>${S.egeBest >= EGE.uni ? 'Поступление подтверждено! Лифт ведёт на этаж университета.' : 'Нужно набрать ' + EGE.uni + '+ баллов на ЕГЭ.'}</p></div>${S.finished ? '<button class="btn sm ghost" data-a="credits">Титры</button>' : ''}</div></div>`;
  openScreen(pan('Кабинет директора', body, ''));
}
A.ege = () => { closeScreen(); say([['dir', 'Экзамен — это ' + EGE.n + ' задач на время. Подсказки, замены и паузы запрещены. Удачи, ' + nm() + '!']], () => startExam()); };
A.credits = () => { closeScreen(); say(EPILOGUE); };

// ---------------------------------------------------------------- двор (сохранение/настройки)
function openYard() { openSettings(); }

// ---------------------------------------------------------------- разговоры с персонажами
function nextGoalText() {
  const mx = maxChapter(), P = chProg(mx);
  for (let j = 0; j < 6; j++) if (!P.lessons[j]) return `Иди на «${CHAPTERS[mx].floor}», кабинет ${CHAPTERS[mx].lessons[j].room} — «${CHAPTERS[mx].lessons[j].n}».`;
  if (!P.boss) return `Все уроки на этаже «${CHAPTERS[mx].name}» пройдены — пора побеждать босса: ${NPC[CHAPTERS[mx].boss].name}!`;
  if (mx === 6) return S.egeBest >= EGE.uni ? 'Поднимайся в Университет Великих Умов!' : 'Сходи в кабинет директора и сдай ЕГЭ.';
  return 'Поднимайся на следующий этаж!';
}
function talkKolya() {
  const canClaim = !S.streak.claimed;
  const opts = [];
  if (canClaim) opts.push({ l: '🎁 Забрать подарок за вход', cls: 'gold', fn: () => { const r = claimLogin((S.streak.count - 1) % 7); toast('🎁 Подарок: ' + r.t, 'big'); checkAch(); say([['kolya', 'Держи, ' + nm() + '! Только никому, а то все прибегут.']]); } });
  opts.push({ l: '💡 Дай совет', fn: () => say([['kolya', R.pick(TIPS)]]) });
  opts.push({ l: 'Пока!' });
  say([{ w: 'kolya', t: S.seen.kolya ? 'Сменку надел? Ладно, проходи, ' + nm() + '. Серия входов: ' + S.streak.count + ' дн.' : 'Стой! Сменная обувь есть? …Ладно, проходи. Я дядя Коля, вахтёр. Знаю всё и про всех.', opts }]);
  S.seen.kolya = 1;
}
function talkFriend(id) {
  const lines = id === 'lisa'
    ? [['lisa', 'Привет, ' + nm() + '! Я Лиза. ' + nextGoalText()], ['lisa', R.pick(TIPS)]]
    : [['tema', 'О, ' + nm() + '! Я Тёма. Слушай лайфхак: ' + R.pick(TIPS)], ['tema', nextGoalText()]];
  say(lines);
}
function talkGosha() {
  const rows = ratingTable(), me = rows.find(r => r.me), g = rows.find(r => r.n.indexOf('Гоша') === 0), ch = Math.min(maxChapter(), 7);
  const canDuel = S.seen.duelDay !== dayNum();
  const opts = [];
  if (canDuel) opts.push({ l: '⚔️ Дуэль на 6 задач', cls: 'gold', fn: () => startDuel() });
  opts.push({ l: 'Не сейчас' });
  const place = me.v > g.v ? `Я обошёл тебя? Нет! Это ты впереди — ${me.pos}-е место против моего ${g.pos}-го. Но я тебя догоню!` : `Я на ${g.pos}-м месте, а ты на ${me.pos}-м. Пока что я круче!`;
  say([['gosha', CHAPTERS[ch].gosha], { w: 'gosha', t: place + (canDuel ? ' Сыграем на дуэль? Победишь — получишь 40 монет.' : ' Дуэль на сегодня уже была.'), opts: opts }]);
}
function talkTeacher(ch) {
  const C = CHAPTERS[ch], key = 't' + ch;
  if (!S.seen[key]) { S.seen[key] = 1; say(C.intro, () => save(true)); return; }
  const opts = [{ l: '🧭 Что дальше?', fn: () => say([[C.teacher, nextGoalText()]]) }, { l: '💡 Объясни тему', fn: () => openTopicPicker('learn', ch) }, { l: 'Спасибо' }];
  say([{ w: C.teacher, t: R.pick(['Чем могу помочь, ' + nm() + '?', 'Готов к новым задачам?', 'Помни: время на задачи ограничено — тренируйся решать быстро!', 'Шпаргалки лежат в шкафчиках вдоль коридора. Поищи светящиеся!']), opts }]);
}
function openLocker(ch, i) {
  const key = 'f' + ch + '_' + i;
  if (S.lockers[key]) { toast('Шкафчик уже пуст', 'ok'); return; }
  S.lockers[key] = 1; const id = pickCard(ch);
  if (id) { giveCard(id); showCardPopup(id); } else { addCoins(25); toast('Шкафчик: нашёл 25 🪙', 'ok'); }
  checkAch(); save(true);
}
function stairsUp(ch) {
  if (ch >= 7) { goLoc('hub', 'elev'); return; }
  if (ch === 6 && chProg(6).boss > 0 && S.egeBest < EGE.uni) { say([['dir', 'Чтобы поступить в университет, нужно сдать ЕГЭ минимум на ' + EGE.uni + ' баллов. Приходи ко мне в кабинет!']]); return; }
  if (!chUnlocked(ch + 1)) { say([[CHAPTERS[ch].teacher, 'Наверх пока рано! Сначала победи босса: ' + NPC[CHAPTERS[ch].boss].name + '.']]); return; }
  goLoc('f' + (ch + 1), 'left');
}

// ---------------------------------------------------------------- справка
function openHelp() {
  const body = `<div class="card" style="margin-bottom:8px"><h4>🏃 Управление</h4><p>Двигайся джойстиком (тяни палец по экрану) или клавишами WASD / стрелками. Подойди к двери или человеку — справа загорится кнопка действия (на компьютере — Пробел или E).</p></div>
  <div class="card" style="margin-bottom:8px"><h4>🏫 Как устроена школа</h4><p>В холле — столовая (припасы), гардероб, библиотека (тренировки), спортзал (мини-игры), кабинет директора и лифт. На каждом этаже шесть кабинетов-уроков и босс. Победил босса — открылся следующий этаж. На седьмом этаже сдаёшь ЕГЭ, а за ним ждёт университет.</p></div>
  <div class="card" style="margin-bottom:8px"><h4>⏱ Задачи на время</h4><p>У каждой задачи — свои числа и таймер. Ответил за половину времени — бонус «молния» ×1,5. Вышло время (или ты свернул игру) — учитель меняет вариант, а за новый ответ нет ни монет, ни освоения темы. Подсказки тоже снижают награду.</p></div>
  <div class="card" style="margin-bottom:8px"><h4>⭐ Награды</h4><p>🪙 монеты — за верные ответы (больше за скорость и комбо), на них покупаются припасы, одежда и питомцы. ✨ опыт повышает ранг. ⭐ звёзды — за качество урока. 🃏 шпаргалки с формулами — за первое прохождение и в шкафчиках на этажах. 📋 задания дня и 📆 подарки за вход — каждый день.</p></div>
  <div class="card" style="margin-bottom:8px"><h4>🧠 Как учиться эффективно</h4><p>Читай теорию перед уроком, разбирай ошибки (они сохраняются в «Работе над ошибками»), повторяй темы в Библиотеке — знания забываются, если их не повторять. Прогноз ЕГЭ в профиле показывает, какие темы подтянуть.</p></div>
  <div class="card"><h4>🏁 Соперники</h4><p>В уроках можно обгонять соперника, а Гоша Зубрилкин зовёт на дуэль раз в день. В рейтинге класса одноклассники растут каждый день — занимайся регулярно!</p></div>`;
  openScreen(pan('Как играть', body, '<button class="btn gold" data-a="close">Понятно</button>'));
}

// ---------------------------------------------------------------- случайные школьные события
function schoolEvent() {
  const mx = Math.min(maxChapter(), 6), topics = [];
  for (let c = 0; c <= mx; c++) topicsOfChapter(c).forEach(t => topics.push(t));
  const evs = [
    () => say([['zavuch', 'Внимание! Внезапная контрольная! Достаём листочки — три задачи на время.'], ['hero', 'Опять?!'], ['zavuch', 'Кто успеет — получит двойную награду.']], () => startLesson({ kind: 'mixed', topics: R.sh(topics).slice(0, 3), d: 1, n: 3, hearts: 0, title: 'Внезапная контрольная', coinMul: 2, xpMul: 1.5, rival: null })),
    () => { const c = R.ri(15, 40); addCoins(c); say([['narr', `Под скамейкой лежит кошелёк с запиской: «Нашедшему — на булочку». Ты находишь в нём ${c} монет и честно сдаёшь записку вахтёру. Дядя Коля кивает и возвращает монеты: «Награда нашедшему».`]]); },
    () => { S.items.hint++; say([['valya', 'Деточка, держи пирожок «Бермудский треугольник»! И подсказку-шпаргалку в придачу — в пирожке нашла.']], () => toast('💡 +1 подсказка', 'ok')); },
    () => { S.items.time++; say([['kolya', 'Ты дежурил по коридору? Нет? Ну ладно, держи песочные часы — мне они не нужны.']], () => toast('⏱️ +1 песочные часы', 'ok')); },
    () => say([['gosha', 'Эй, ' + nm() + '! Слышал, ты быстро решаешь. Давай посоревнуемся — загляни ко мне, я дуэль объявляю!']]),
  ];
  R.pick(evs)();
}
