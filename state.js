'use strict';
// ============================================================================
//  СОСТОЯНИЕ ИГРЫ: сохранение, опыт, монеты, освоение тем, задания, достижения
// ============================================================================
const SAVE_KEY = 'shkola_save_v1';
const VERSION='1.0';

function dayNum() { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function newState() {
  const own = {};
  Object.keys(PRICES).forEach(k => own[k] = PRICES[k].map(p => p === 0));
  const s = {
    v: 1, name: '', gender: 'b', created: Date.now(), startDay: dayNum(),
    look: { hair: 0, hairC: 1, skin: 1, shirt: 0, bag: 0, hat: 0, glasses: 0, trail: 0, pet: 0 },
    own: own, coins: 60, xp: 0, rank: 0,
    prog: {}, mastery: {}, wrong: [], items: { hint: 2, fifty: 1, time: 1, swap: 1, heart: 0, cocoa: 0 },
    cards: {}, ach: {}, quests: null, streak: { last: 0, count: 0, claimed: 0 }, lockers: {},
    stats: { answered: 0, correct: 0, fast: 0, late: 0, lessons: 0, perfect: 0, threeStars: 0, rivalWins: 0, maxCombo: 0, bosses: 0, bought: 0, quests: 0, olympBest: 0, runBest: 0, topRank: 0, cardsOk: 0, playSec: 0, review: 0 },
    settings: { sound: true, music: true, timeMode: 1, rival: true, vibe: true },
    egeBest: 0, egeTries: 0, finished: false, seen: {}, boost: { cocoa: false, heart: false },
    world: { loc: 'hub', x: 0, y: 0 },
  };
  return s;
}
let S = null;
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) { const o = JSON.parse(raw); S = Object.assign(newState(), o); S.stats = Object.assign(newState().stats, o.stats || {}); S.settings = Object.assign(newState().settings, o.settings || {}); S.look = Object.assign(newState().look, o.look || {}); const nw = newState(); Object.keys(nw.own).forEach(k => { if (!S.own[k]) S.own[k] = nw.own[k]; else nw.own[k].forEach((v, i) => { if (S.own[k][i] === undefined) S.own[k][i] = v; }); }); S.items = Object.assign(nw.items, o.items || {}); return true; }
  } catch (e) { }
  S = newState(); return false;
}
let _saveT = 0;
function save(force) {
  const t = Date.now(); if (!force && t - _saveT < 800) return; _saveT = t;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { }
}
function exportSave() { return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
function importSave(code) {
  try { const o = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); if (!o || o.v !== 1 || !o.look) return false; localStorage.setItem(SAVE_KEY, JSON.stringify(o)); return true; } catch (e) { return false; }
}
function resetSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }

// ---------------------------------------------------------------- ранг и опыт
function rankIdx(xp) { let r = 0; RANKS.forEach((x, i) => { if (xp >= x[0]) r = i; }); return r; }
function rankName(xp) { return RANKS[rankIdx(xp)][1]; }
function rankProgress(xp) { const i = rankIdx(xp), a = RANKS[i][0], b = RANKS[i + 1] ? RANKS[i + 1][0] : a + 1; return RANKS[i + 1] ? (xp - a) / (b - a) : 1; }
function petPerk() { const p = PETS[S.look.pet] || PETS[0]; return { coin: p.coin || 0, xp: p.xp || 0, time: p.time || 0 }; }
function addCoins(n, silent) { n = Math.round(n); S.coins = Math.max(0, S.coins + n); if (!silent && n > 0) Snd.play('coin'); updHud(); return n; }
function addXp(n) {
  n = Math.round(n * (1 + petPerk().xp)); const before = rankIdx(S.xp); S.xp += n;
  const after = rankIdx(S.xp);
  if (after > before) {
    const bonus = 30 * after; S.coins += bonus; Snd.play('level'); vibe([60, 40, 60]);
    toast(`🎖️ Новый ранг: <b>${RANKS[after][1]}</b>!<br>Награда: ${bonus} 🪙`, 'big');
    if (after >= 3) S.items.hint++;
  }
  updHud(); return n;
}
function buy(cost) { if (S.coins < cost) return false; S.coins -= cost; S.stats.bought++; updHud(); return true; }

// ---------------------------------------------------------------- освоение тем
function mast(t) { return S.mastery[t] || { p: 0, n: 0, c: 0, f: 0, last: 0, peak: 0 }; }
function recMastery(t, res) {
  const m = S.mastery[t] || (S.mastery[t] = { p: 0, n: 0, c: 0, f: 0, last: 0, peak: 0 });
  m.n++;
  if (res === 'fast') { m.c++; m.f++; m.p += (100 - m.p) * .17; } else if (res === 'ok') { m.c++; m.p += (100 - m.p) * .11; } else if (res === 'bad') { m.p -= m.p * .16; }
  m.p = Math.max(0, Math.min(100, m.p)); m.peak = Math.max(m.peak || 0, m.p); m.last = dayNum();
  if (res === 'bad') { if (S.wrong.indexOf(t) < 0) S.wrong.push(t); if (S.wrong.length > 12) S.wrong.shift(); }
  else if (res === 'fast' || res === 'ok') { const i = S.wrong.indexOf(t); if (i >= 0 && Math.random() < .5) S.wrong.splice(i, 1); }
}
// «Кривая забывания»: знания, которые не повторяли, понемногу тают (до 30% от достигнутого)
function decayMastery() {
  const d = dayNum();
  Object.keys(S.mastery).forEach(t => {
    const m = S.mastery[t]; if (!m.last || m.last >= d) return;
    const days = d - m.last, floor = (m.peak || m.p) * .7;
    m.p = Math.max(Math.min(m.p, floor), m.p * Math.pow(.99, days)); m.last = d;
  });
}
function topicsOfChapter(ch) { return TOPIC_ORDER.filter(id => TOPICS[id].ch === ch); }
function forecast() {
  const per = [], all = [];
  for (let ch = 0; ch <= 6; ch++) {
    const ts = topicsOfChapter(ch), v = ts.map(t => mast(t).p / 100); all.push(...v);
    per.push({ ch: ch, cov: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0 });
  }
  const cov = all.reduce((a, b) => a + b, 0) / all.length;
  const score = Math.round(100 * Math.pow(cov, 1.05));
  const grade = cov >= .85 ? 5 : cov >= .65 ? 4 : cov >= .45 ? 3 : 2;
  const weak = TOPIC_ORDER.filter(t => TOPICS[t].ch >= 0 && TOPICS[t].ch <= 6 && mast(t).n > 0).sort((a, b) => mast(a).p - mast(b).p).slice(0, 5);
  return { cov: cov, score: score, grade: grade, per: per, weak: weak };
}

// ---------------------------------------------------------------- прогресс по главам
function chProg(ch) { return S.prog[ch] || (S.prog[ch] = { lessons: [0, 0, 0, 0, 0, 0], boss: 0, done: false }); }
function chUnlocked(i) { if (i === 0) return true; if (i === 7) return S.egeBest >= EGE.uni; return !!(S.prog[i - 1] && S.prog[i - 1].boss > 0); }
function lessonUnlocked(ch, j) { return j === 0 || chProg(ch).lessons[j - 1] > 0; }
function bossUnlocked(ch) { return chProg(ch).lessons.every(s => s > 0); }
function totalStars() { let n = 0; Object.keys(S.prog).forEach(k => { n += S.prog[k].lessons.reduce((a, b) => a + b, 0) + (S.prog[k].boss || 0); }); return n; }
function maxChapter() { let m = 0; for (let i = 0; i < 8; i++) if (chUnlocked(i)) m = i; return m; }

// ---------------------------------------------------------------- шпаргалки
function giveCard(id) {
  if (S.cards[id]) return false;
  S.cards[id] = Date.now(); Snd.play('card'); const f = FORMULA_BY_ID[id];
  toast(`🃏 Новая шпаргалка:<br><b>${f.name}</b>`, 'card'); return true;
}
function pickCard(ch, topicIds) {
  const pref = [];
  (topicIds || []).forEach(t => (TOPICS[t].formulas || []).forEach(f => { if (!S.cards[f] && pref.indexOf(f) < 0) pref.push(f); }));
  if (pref.length) return pref[0];
  const rest = FORMULAS.filter(f => f.ch === ch && !S.cards[f.id]);
  return rest.length ? rest[0].id : null;
}

// ---------------------------------------------------------------- задания дня
function ensureQuests() {
  const d = dayNum();
  if (S.quests && S.quests.day === d) return;
  const rnd = mulberry(d * 7919 + 13), pool = QUEST_T.slice(), list = [];
  while (list.length < 3 && pool.length) {
    const t = pool.splice(Math.floor(rnd() * pool.length), 1)[0], gi = Math.floor(rnd() * t.g.length);
    list.push({ id: t.id, goal: t.g[gi], prog: 0, r: t.r + gi * 10, claimed: false });
  }
  S.quests = { day: d, list: list, bonus: false };
}
function questEvent(ev, n, val) {
  ensureQuests();
  S.quests.list.forEach(q => {
    const t = QUEST_T.find(x => x.id === q.id); if (!t || t.ev !== ev || q.claimed) return;
    const was = q.prog;
    if (ev === 'combo') q.prog = Math.max(q.prog, val || 0); else q.prog += n || 1;
    if (was < q.goal && q.prog >= q.goal) toast(`📋 Задание выполнено!<br><b>${t.t(q.goal)}</b>`, 'ok');
  });
}
function claimQuest(i) {
  const q = S.quests.list[i]; if (!q || q.claimed || q.prog < q.goal) return false;
  q.claimed = true; S.stats.quests++; addCoins(q.r); addXp(20); checkAch(); return true;
}
function loginStreak() {
  const d = dayNum(); let fresh = false;
  if (S.streak.last === d) return null;
  S.streak.count = S.streak.last === d - 1 ? S.streak.count + 1 : 1; S.streak.last = d; fresh = true;
  S.streak.claimed = 0;
  return fresh ? { day: ((S.streak.count - 1) % 7), count: S.streak.count } : null;
}
function claimLogin(day) {
  const r = LOGIN_REWARDS[day]; addCoins(r.c); if (r.i) S.items[r.i] = (S.items[r.i] || 0) + 1; S.streak.claimed = 1; save(true); return r;
}

// ---------------------------------------------------------------- достижения
function checkAch() {
  ACH.forEach(a => {
    if (S.ach[a.id]) return;
    let ok = false; try { ok = a.ck(S); } catch (e) { }
    if (ok) { S.ach[a.id] = Date.now(); addCoins(a.r, true); Snd.play('level'); toast(`${a.e} Достижение: <b>${a.n}</b><br>+${a.r} 🪙`, 'ach'); }
  });
}

// ---------------------------------------------------------------- рейтинг класса
function ratingTable() {
  const days = Math.max(0, dayNum() - S.startDay);
  const rows = BOTS.map(b => ({ n: b.n, e: b.e, v: Math.round(b.b + b.g * Math.min(days, 200) * .8), bot: true }));
  rows.push({ n: S.name || 'Ты', e: '⭐', v: Math.round(S.xp), me: true });
  rows.sort((a, b) => b.v - a.v);
  rows.forEach((r, i) => r.pos = i + 1);
  return rows;
}
function myRank() { return ratingTable().find(r => r.me).pos; }

// ---------------------------------------------------------------- внешность и косметика
function itemDefs(cat) {
  switch (cat) {
    case 'hair': return HAIRS.map(n => ({ n: n }));
    case 'hairC': return HAIR_COLORS.map(x => ({ n: x[1], c: x[0] }));
    case 'skin': return SKINS.map((c, i) => ({ n: 'Оттенок ' + (i + 1), c: c }));
    case 'shirt': return SHIRTS.map(x => ({ n: x[1], c: x[0] }));
    case 'bag': return BAGS.map(x => ({ n: x[1], c: x[0] }));
    case 'hat': return HATS.map(x => ({ n: x[1], e: x[0] }));
    case 'glasses': return GLASSES.map(x => ({ n: x[1], k: x[0] }));
    case 'trail': return TRAILS.map(x => ({ n: x[1], k: x[0], e: x[2] }));
    case 'pet': return PETS.map(x => ({ n: x.n, e: x.e, perk: x.perk }));
  }
  return [];
}
