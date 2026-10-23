'use strict';
// ============================================================================
//  МИР: школьные коридоры и холл, герой, прохожие школьники, рендер, управление
// ============================================================================
const T = 48;
const WORLD = {
  cv: null, c: null, w: 0, h: 0, dpr: 1, scale: 1, cam: { x: 0, y: 0 },
  loc: null, hero: { x: 0, y: 0, dir: 'd', phase: 0, moving: false, run: 0 }, pet: { x: 0, y: 0, ph: 0 },
  objs: [], kids: [], parts: [], bubbles: [], near: null, time: 0, paused: false, input: { x: 0, y: 0 }, keys: {}, joy: null, fade: 0, last: 0, stepT: 0, zav: null, tapGuide: 0,
};

// ---------------------------------------------------------------- внешний вид людей
function randLook(seed) {
  const r = mulberry(seed * 977 + 5);
  return { hair: Math.floor(r() * 8), hairC: Math.floor(r() * 6), skin: Math.floor(r() * 5), shirt: Math.floor(r() * 9), bag: Math.floor(r() * 6), hat: r() < .12 ? 1 + Math.floor(r() * 3) : 0, glasses: r() < .2 ? 1 : 0, trail: 0, pet: 0, pants: ['#2b3a67', '#3a3a4a', '#4a3a2a', '#2f5a4a'][Math.floor(r() * 4)] };
}
function shirtColor(look, t) {
  const c = SHIRTS[look.shirt] ? SHIRTS[look.shirt][0] : '#3b6fd8';
  if (c === 'rainbow') { const g = WORLD.c.createLinearGradient(0, 0, 26, 0); ['#ff5a5a', '#ffb066', '#ffe066', '#6ff0a8', '#7cd4ff', '#b892ff'].forEach((q, i) => g.addColorStop(i / 5, q)); return g; }
  return c;
}
function shade(hex, k) {
  if (typeof hex !== 'string' || hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1), 16), r = Math.max(0, Math.min(255, (n >> 16) * k)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) * k)), b = Math.max(0, Math.min(255, (n & 255) * k));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

function drawPerson(c, x, y, o) {
  const L = o.look, dir = o.dir || 'd', mv = o.moving, ph = o.phase || 0, sc = o.scale || 1;
  c.save(); c.translate(x, y); c.scale(sc, sc);
  // тень
  c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0, 2, 17, 6, 0, 0, 7); c.fill();
  const sw = mv ? Math.sin(ph) * 6 : 0, bob = mv ? Math.abs(Math.sin(ph)) * 2 : Math.sin(WORLD.time * 2 + (o.seed || 0)) * .6;
  const skin = SKINS[L.skin] || SKINS[1], shirt = shirtColor(L), hairC = HAIR_COLORS[L.hairC] ? HAIR_COLORS[L.hairC][0] : '#6b3f1d', pants = L.pants || '#2b3a67';
  const side = dir === 'l' || dir === 'r', fx = dir === 'l' ? -1 : 1;
  c.translate(0, -bob);
  // рюкзак сзади (если смотрим вниз — виден сбоку; вверх — на спине)
  const bagC = BAGS[L.bag] ? BAGS[L.bag][0] : '#d94b4b';
  if (dir === 'u') { c.fillStyle = bagC; rrect(c, -12, -44, 24, 26, 6); c.fill(); c.fillStyle = shade(bagC, .75); rrect(c, -8, -30, 16, 9, 3); c.fill(); }
  if (side) { c.fillStyle = bagC; rrect(c, -fx * 13 - 6, -42, 12, 22, 5); c.fill(); }
  // ноги
  c.fillStyle = pants; rrect(c, -9 + (side ? 0 : -sw * .2), -20 + (side ? Math.max(0, sw) * 0 : 0), 8, 18 - (sw > 0 && !side ? 0 : 0), 3); c.fill();
  if (side) { c.fillStyle = shade(pants, .8); rrect(c, 1 + sw * (fx), -20, 8, 18, 3); c.fill(); rrect(c, -9 - sw * fx, -20, 8, 18, 3); c.fill(); }
  else { rrect(c, 1 + sw * .2, -20, 8, 18, 3); c.fill(); }
  c.fillStyle = '#222'; if (side) { rrect(c, -9 - sw * fx + (fx > 0 ? 0 : -2), -4, 11, 5, 2); c.fill(); rrect(c, 1 + sw * fx + (fx > 0 ? 0 : -2), -4, 11, 5, 2); c.fill(); }
  else { rrect(c, -10 - sw * .2, -4, 10, 5, 2); c.fill(); rrect(c, 1 + sw * .2, -4, 10, 5, 2); c.fill(); }
  // туловище
  c.save(); c.translate(-13, -46); c.fillStyle = typeof shirt === 'string' ? shirt : shirt; rrect(c, 0, 0, 26, 28, 8); c.fill(); c.restore();
  c.fillStyle = 'rgba(255,255,255,.18)'; rrect(c, -9, -44, 8, 14, 4); c.fill();
  // руки
  c.fillStyle = skin; if (!side) { rrect(c, -18, -42 + sw * .3, 6, 18, 3); c.fill(); rrect(c, 12, -42 - sw * .3, 6, 18, 3); c.fill(); }
  else { rrect(c, -3 + sw * .6 * fx, -42, 7, 18, 3); c.fill(); }
  // лямки рюкзака спереди
  if (dir === 'd') { c.fillStyle = bagC; c.fillRect(-9, -46, 4, 20); c.fillRect(5, -46, 4, 20); }
  // голова
  const hy = -58;
  // задние волосы
  c.fillStyle = hairC;
  const hs = L.hair;
  if (hs === 4) { rrect(c, -15, hy - 8, 30, 36, 12); c.fill(); }
  if (hs === 3) { rrect(c, -14, hy - 8, 28, 24, 10); c.fill(); }
  if (hs === 7 && dir !== 'u') { c.beginPath(); c.arc(-16, hy + 4, 6, 0, 7); c.arc(16, hy + 4, 6, 0, 7); c.fill(); }
  if (hs === 2) { if (side) { c.beginPath(); c.ellipse(-fx * 14, hy + 4, 5, 11, fx * .3, 0, 7); c.fill(); } else { c.beginPath(); c.ellipse(15, hy + 4, 5, 11, -.2, 0, 7); c.fill(); } }
  c.fillStyle = skin; c.beginPath(); c.arc(0, hy, 13, 0, 7); c.fill();
  c.fillStyle = hairC;
  const top = () => { c.beginPath(); c.arc(0, hy - 1, 14, Math.PI * 1.02, Math.PI * 1.98); c.closePath(); c.fill(); };
  if (hs === 5) { for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 6 - 4, hy - 8); c.lineTo(i * 6, hy - 21 - (i % 2 ? 0 : 3)); c.lineTo(i * 6 + 4, hy - 8); c.fill(); } top(); }
  else if (hs === 6) { for (let i = 0; i < 7; i++) { const a = Math.PI + i * Math.PI / 6; c.beginPath(); c.arc(Math.cos(a) * 12, hy - 2 + Math.sin(a) * 11, 6, 0, 7); c.fill(); } }
  else { top(); }
  if (hs === 1 || dir === 'd' && hs === 0) { c.beginPath(); c.moveTo(-13, hy - 6); c.lineTo(13, hy - 6); c.lineTo(9, hy + 1); c.lineTo(-9, hy - 3); c.closePath(); c.fill(); }
  if ((hs === 3 || hs === 4) && dir !== 'u') { c.fillRect(-14, hy - 4, 5, 18); c.fillRect(9, hy - 4, 5, 18); }
  if (dir === 'u') { c.beginPath(); c.arc(0, hy, 13.5, 0, 7); c.fill(); }
  // лицо
  if (dir !== 'u') {
    const ex = dir === 'l' ? -3 : dir === 'r' ? 3 : 0;
    c.fillStyle = '#1b1b2b';
    if (side) { c.beginPath(); c.arc(fx * 6, hy + 1, 2, 0, 7); c.fill(); } else { c.beginPath(); c.arc(-5 + ex, hy + 1, 2, 0, 7); c.arc(5 + ex, hy + 1, 2, 0, 7); c.fill(); }
    c.strokeStyle = 'rgba(120,40,40,.7)'; c.lineWidth = 1.5; c.beginPath(); c.arc(side ? fx * 5 : ex, hy + 6, 3, .15 * Math.PI, .85 * Math.PI); c.stroke();
    if (!side) { c.fillStyle = 'rgba(255,120,140,.25)'; c.beginPath(); c.arc(-9 + ex, hy + 5, 3, 0, 7); c.arc(9 + ex, hy + 5, 3, 0, 7); c.fill(); }
    // очки
    const gk = GLASSES[L.glasses] ? GLASSES[L.glasses][0] : null;
    if (gk) {
      c.lineWidth = 1.8; c.strokeStyle = '#222'; const gx = side ? [fx * 6] : [-5 + ex, 5 + ex];
      gx.forEach(px => {
        if (gk === 'round') { c.beginPath(); c.arc(px, hy + 1, 4.5, 0, 7); c.stroke(); }
        else if (gk === 'sun') { c.fillStyle = 'rgba(10,10,20,.85)'; rrect(c, px - 5, hy - 3, 10, 7, 3); c.fill(); }
        else { c.font = '10px sans-serif'; c.textAlign = 'center'; c.fillStyle = gk === 'heart' ? '#ff4f8a' : '#ffcf33'; c.fillText(gk === 'heart' ? '♥' : '★', px, hy + 5); }
      });
      if (!side && gk === 'round') { c.beginPath(); c.moveTo(-0.5 + ex, hy + 1); c.lineTo(0.5 + ex, hy + 1); c.stroke(); }
    }
  }
  // шапка
  const hat = HATS[L.hat] ? HATS[L.hat][0] : null;
  if (hat) { c.font = '26px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(hat, 0, hy - 15); }
  c.restore();
}

// ---------------------------------------------------------------- карты
function GMap(id, w, h, th) {
  this.id = id; this.w = w; this.h = h; this.th = th; this.solid = new Uint8Array(w * h); this.objs = []; this.decor = []; this.bg = null;
}
GMap.prototype.isSolid = function (tx, ty) { return tx < 0 || ty < 0 || tx >= this.w || ty >= this.h || this.solid[ty * this.w + tx] === 1; };
GMap.prototype.fill = function (x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < this.w && j < this.h) this.solid[j * this.w + i] = 1; };

function floorLayout(ch) {
  const th = CHAPTERS[ch].theme, M = new GMap('f' + ch, 62, 10, th);
  M.fill(0, 0, 62, 3); M.fill(0, 8, 62, 2);
  M.doorsX = [9, 16, 23, 30, 37, 44]; M.bossX = 53; M.upX = 59; M.downX = 0;
  M.lockerX = [12, 33, 49];
  // растения и скамейки на полу
  M.plants = [6, 20, 27, 41, 50, 57].map(x => ({ x: x, y: 7 })); M.plants.forEach(p => M.fill(p.x, p.y, 1, 1));
  M.benches = [[13, 7], [26, 7], [45, 7]]; M.benches.forEach(b => M.fill(b[0], b[1], 2, 1));
  M.spawnL = { x: 3.2, y: 5.4 }; M.spawnR = { x: 57, y: 5.4 };
  return M;
}
function hubLayout() {
  const th = { wall: '#ffd9a8', wall2: '#f0b878', floor: '#efe3cf', floor2: '#e3d3b8', trim: '#9a5a2a', glow: '#ffd54a' }, M = new GMap('hub', 34, 18, th);
  M.fill(0, 0, 34, 3); M.fill(0, 15, 34, 3);
  M.plants = [[1, 3], [32, 3], [1, 14], [32, 14], [11, 3], [22, 3]].map(p => ({ x: p[0], y: p[1] })); M.plants.forEach(p => M.fill(p.x, p.y, 1, 1));
  M.benches = [[3, 11], [29, 11], [3, 6], [29, 6]]; M.benches.forEach(b => M.fill(b[0], b[1], 2, 1));
  M.fountain = { x: 15, y: 7, w: 4, h: 3 }; M.fill(15, 7, 4, 3);
  M.spawnL = { x: 17, y: 12.5 }; M.spawnR = M.spawnL;
  return M;
}

// предметы мира (двери, люди, шкафчики) — динамические, зависят от прогресса
function buildObjs(M) {
  const o = [];
  if (M.id === 'hub') {
    const D = (x, y, w, label, icon, fn, o2) => o.push(Object.assign({ k: 'door', x: (x + w / 2) * T, y: (y + 1.1) * T, tx: x, ty: y - 1, tw: w, label: label, icon: icon, use: fn, r: 1.5 * T }, o2 || {}));
    D(3, 2, 2, 'Столовая', '🍽️', () => openShop(), { sub: 'Припасы и подсказки', col: '#ff9f6b' });
    D(9, 2, 2, 'Гардероб', '👕', () => openWardrobe(), { sub: 'Одежда и питомцы', col: '#ff7ac8' });
    D(15, 2, 4, 'Лифт', '🛗', () => openElevator(), { sub: 'На этажи', col: '#7cd4ff', big: true });
    D(23, 2, 2, 'Библиотека', '📚', () => openLibrary(), { sub: 'Тренировки и шпаргалки', col: '#b892ff' });
    D(29, 2, 2, 'Кабинет директора', '🎓', () => openDirector(), { sub: 'Прогноз ЕГЭ и экзамен', col: '#ffd54a' });
    D(5, 14, 2, 'Спортзал', '🏀', () => openGym(), { sub: 'Забег и Олимпиада', col: '#6ff0c8', south: true });
    D(15, 14, 4, 'Доска объявлений', '📌', () => openBoard(), { sub: 'Задания дня и рейтинг', col: '#ffd54a', big: true, south: true });
    D(27, 14, 2, 'Школьный двор', '🌳', () => openYard(), { sub: 'Сохранение и настройки', col: '#8be28b', south: true });
    o.push({ k: 'npc', id: 'kolya', x: 25 * T, y: 12 * T, name: 'Дядя Коля', look: Object.assign(randLook(41), { hair: 5, hairC: 5, skin: 1, shirt: 7, hat: 0, glasses: 1 }), r: 1.6 * T, use: () => talkKolya(), tag: 'вахтёр' });
    o.push({ k: 'npc', id: 'lisa', x: 10.5 * T, y: 9 * T, name: 'Лиза', look: Object.assign(randLook(7), { hair: 2, hairC: 3, skin: 0, shirt: 6 }), r: 1.6 * T, use: () => talkFriend('lisa'), tag: 'подруга' });
    o.push({ k: 'npc', id: 'tema', x: 22.5 * T, y: 10 * T, name: 'Тёма', look: Object.assign(randLook(19), { hair: 1, hairC: 0, skin: 2, shirt: 2 }), r: 1.6 * T, use: () => talkFriend('tema'), tag: 'друг' });
    o.push({ k: 'npc', id: 'gosha', x: 20 * T, y: 12.5 * T, name: 'Гоша', look: Object.assign(randLook(3), { hair: 0, hairC: 2, skin: 0, shirt: 0, glasses: 1 }), r: 1.6 * T, use: () => talkGosha(), tag: 'соперник' });
  } else {
    const ch = +M.id.slice(1), C = CHAPTERS[ch], P = chProg(ch);
    M.doorsX.forEach((x, j) => o.push({
      k: 'door', lesson: j, x: (x + 1) * T, y: 3.1 * T, tx: x, ty: 2, tw: 2, label: 'Кабинет ' + C.lessons[j].room, sub: C.lessons[j].n, icon: '🚪', r: 1.5 * T,
      use: () => openLesson(ch, j),
    }));
    o.push({ k: 'door', boss: true, x: (M.bossX + 1.5) * T, y: 3.1 * T, tx: M.bossX, ty: 2, tw: 3, label: C.sub === 'Первый курс' ? 'Защита диплома' : 'Босс: ' + NPC[C.boss].name, sub: 'Экзамен этажа', icon: NPC[C.boss].e, r: 1.7 * T, use: () => openBoss(ch), big: true });
    o.push({ k: 'stairs', dir: 'down', x: 1.2 * T, y: 5.2 * T, label: 'Вниз, в холл', icon: '⬇️', r: 1.7 * T, use: () => goLoc('hub', 'elev') });
    o.push({ k: 'stairs', dir: 'up', x: (M.upX + 1) * T, y: 5.2 * T, label: ch < 7 ? 'Наверх' : 'Выход', icon: '⬆️', r: 1.7 * T, use: () => stairsUp(ch) });
    o.push({ k: 'npc', id: C.teacher, x: 6.2 * T, y: 4.8 * T, name: NPC[C.teacher].name.split(' ')[0], look: teacherLook(ch), r: 1.6 * T, use: () => talkTeacher(ch), tag: 'учитель', big: true });
    o.push({ k: 'npc', id: 'gosha', x: (M.bossX - 3) * T, y: 5.5 * T, name: 'Гоша', look: Object.assign(randLook(3), { hair: 0, hairC: 2, skin: 0, shirt: 0, glasses: 1 }), r: 1.6 * T, use: () => talkGosha(), tag: 'соперник' });
    M.lockerX.forEach((x, i) => o.push({ k: 'locker', idx: i, x: (x + .5) * T, y: 8 * T - 8, label: 'Шкафчик со шпаргалкой', icon: '✨', r: 1.4 * T, use: () => openLocker(ch, i) }));
    o.push({ k: 'npc', id: 'zav', x: 30 * T, y: 4.4 * T, name: 'Завуч', look: Object.assign(randLook(77), { hair: 3, hairC: 5, skin: 0, shirt: 7, glasses: 1 }), r: 0, solidNpc: false, zav: true, tag: '' });
  }
  return o;
}
function teacherLook(ch) {
  const L = [{ hair: 3, hairC: 4, skin: 0, shirt: 3, glasses: 1 }, { hair: 0, hairC: 5, skin: 1, shirt: 4, glasses: 1 }, { hair: 4, hairC: 6, skin: 0, shirt: 4, glasses: 0, hat: 9 }, { hair: 0, hairC: 5, skin: 1, shirt: 8, glasses: 1 }, { hair: 3, hairC: 7, skin: 0, shirt: 5, glasses: 1 }, { hair: 5, hairC: 0, skin: 2, shirt: 2, glasses: 1 }, { hair: 3, hairC: 1, skin: 0, shirt: 1, glasses: 1 }, { hair: 0, hairC: 5, skin: 1, shirt: 7, glasses: 1, hat: 6 }][ch];
  return Object.assign(randLook(ch * 13 + 1), L);
}

// ---------------------------------------------------------------- рисование статического фона карты
function bakeMap(M) {
  const cv = document.createElement('canvas'); cv.width = M.w * T; cv.height = M.h * T; const c = cv.getContext('2d'), th = M.th;
  const hub = M.id === 'hub', topRows = 3;
  // пол
  for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++) {
    c.fillStyle = (x + y) % 2 ? th.floor : th.floor2; c.fillRect(x * T, y * T, T, T);
  }
  c.strokeStyle = 'rgba(0,0,0,.05)'; c.lineWidth = 1; for (let x = 0; x <= M.w; x++) { c.beginPath(); c.moveTo(x * T, 0); c.lineTo(x * T, M.h * T); c.stroke(); } for (let y = 0; y <= M.h; y++) { c.beginPath(); c.moveTo(0, y * T); c.lineTo(M.w * T, y * T); c.stroke(); }
  // ковровая дорожка
  const rg = hub ? null : c.createLinearGradient(0, 3 * T, 0, 8 * T);
  if (!hub) { c.fillStyle = th.trim; c.globalAlpha = .12; c.fillRect(0, 4.2 * T, M.w * T, 2.6 * T); c.globalAlpha = 1; c.fillStyle = th.trim; c.globalAlpha = .25; c.fillRect(0, 4.2 * T, M.w * T, 3); c.fillRect(0, 6.8 * T - 3, M.w * T, 3); c.globalAlpha = 1; }
  else { c.fillStyle = th.trim; c.globalAlpha = .13; rrect(c, 7 * T, 5.5 * T, 20 * T, 8 * T, 24); c.fill(); c.globalAlpha = .3; c.lineWidth = 4; c.strokeStyle = th.trim; rrect(c, 7 * T, 5.5 * T, 20 * T, 8 * T, 24); c.stroke(); c.globalAlpha = 1; }
  // верхняя стена
  const g = c.createLinearGradient(0, 0, 0, topRows * T); g.addColorStop(0, shade(th.wall, .78)); g.addColorStop(1, th.wall); c.fillStyle = g; c.fillRect(0, 0, M.w * T, topRows * T);
  c.fillStyle = 'rgba(255,255,255,.12)'; for (let x = 0; x < M.w * 2; x++) if (x % 2) c.fillRect(x * T / 2, 0, T / 2, 2 * T);
  c.fillStyle = th.trim; c.fillRect(0, 2 * T - 4, M.w * T, 6); c.fillStyle = shade(th.wall2, .9); c.fillRect(0, 2 * T + 2, M.w * T, T - 2);
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, topRows * T - 8, M.w * T, 8); c.fillStyle = th.trim; c.fillRect(0, topRows * T - 12, M.w * T, 5);
  // окна и плакаты на верхней стене между дверями
  const rnd = mulberry(M.id.length * 31 + (M.id.charCodeAt(1) || 0));
  const ch = hub ? -1 : +M.id.slice(1), fl = hub ? FORMULAS : FORMULAS.filter(f => f.ch === ch);
  for (let x = 0; x < M.w; x += 1) {
    const free = hub ? !([3, 4, 9, 10, 15, 16, 17, 18, 23, 24, 29, 30].includes(x)) : !(M.doorsX.some(d => x >= d - 1 && x <= d + 2) || (x >= M.bossX - 1 && x <= M.bossX + 3));
    if (!free) continue;
    if (x % 3 === 0 && x > 0 && x < M.w - 2) {
      if (rnd() < .55) { // окно
        c.fillStyle = '#bfe9ff'; rrect(c, x * T + 6, 12, T * 1.4, T * 1.2, 6); c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.stroke();
        c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x * T + 6, 12, 8, T * 1.2); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x * T + 6 + T * .7, 12); c.lineTo(x * T + 6 + T * .7, 12 + T * 1.2); c.moveTo(x * T + 6, 12 + T * .6); c.lineTo(x * T + 6 + T * 1.4, 12 + T * .6); c.stroke();
      } else if (fl.length) { // плакат с формулой
        const f = fl[Math.floor(rnd() * fl.length)], txt = f.f.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, '');
        c.fillStyle = '#fffdf2'; rrect(c, x * T + 2, 10, T * 2.1, T * 1.3, 4); c.fill(); c.strokeStyle = th.trim; c.lineWidth = 2; c.stroke();
        c.fillStyle = th.trim; c.font = 'bold 9px "Segoe UI",sans-serif'; c.textAlign = 'center'; c.fillText(f.name.length > 22 ? f.name.slice(0, 21) + '…' : f.name, x * T + 2 + T * 1.05, 24);
        c.fillStyle = '#243060'; let fs = 14; c.font = 'bold ' + fs + 'px "Segoe UI",sans-serif'; while (c.measureText(txt).width > T * 1.9 && fs > 7) { fs--; c.font = 'bold ' + fs + 'px "Segoe UI",sans-serif'; }
        c.fillText(txt.length > 40 ? txt.slice(0, 38) + '…' : txt, x * T + 2 + T * 1.05, 44);
      }
    }
  }
  // нижняя стена с шкафчиками
  if (!hub) {
    const by = 8 * T; const gg = c.createLinearGradient(0, by, 0, M.h * T); gg.addColorStop(0, shade(th.wall2, .8)); gg.addColorStop(1, shade(th.wall2, .55)); c.fillStyle = gg; c.fillRect(0, by, M.w * T, 2 * T);
    for (let x = 0; x < M.w; x++) {
      const col = ['#5b7fc9', '#4c9a7a', '#c9794c', '#8a6bc9'][Math.floor(x / 2 + ch) % 4];
      c.fillStyle = col; rrect(c, x * T + 2, by + 2, T - 4, T * 1.6, 5); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x * T + 6, by + 2, 6, T * 1.6);
      c.fillStyle = 'rgba(0,0,0,.28)'; for (let i = 0; i < 3; i++) c.fillRect(x * T + 10, by + 10 + i * 5, T - 22, 2);
      c.fillStyle = '#e8e8e8'; c.fillRect(x * T + T - 12, by + 24, 4, 12);
    }
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(0, by, M.w * T, 5);
  } else {
    const by = 15 * T; const gg = c.createLinearGradient(0, by, 0, M.h * T); gg.addColorStop(0, th.wall); gg.addColorStop(1, shade(th.wall2, .7)); c.fillStyle = gg; c.fillRect(0, by, M.w * T, 3 * T);
    c.fillStyle = th.trim; c.fillRect(0, by, M.w * T, 6);
  }
  // лестницы на этажах
  if (!hub) {
    [[0, 'down'], [M.upX - 0.2, 'up']].forEach(([sx, dir]) => {
      for (let i = 0; i < 5; i++) { c.fillStyle = shade('#b0a89a', .8 + i * .08); c.fillRect((sx + (dir === 'up' ? 0 : 0)) * T + i * 6, (3 + i) * T + 4, T * 2.8 - i * 12, T - 4); c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect((sx) * T + i * 6, (4 + i) * T - 6, T * 2.8 - i * 12, 6); }
      c.fillStyle = th.trim; c.fillRect(sx * T, 3 * T, 6, 5 * T); c.fillRect((sx + 2.8) * T - 6, 3 * T, 6, 5 * T);
    });
  }
  // декор: растения, скамейки
  (M.plants || []).forEach(p => { const px = p.x * T, py = p.y * T; c.fillStyle = '#9a5a2a'; rrect(c, px + 12, py + 28, 24, 18, 4); c.fill(); c.fillStyle = '#3aa86a'; [[0, 0, 12], [-9, 6, 9], [9, 6, 9], [0, -9, 8]].forEach(q => { c.beginPath(); c.arc(px + 24 + q[0], py + 22 + q[1] - 6, q[2], 0, 7); c.fill(); }); c.fillStyle = '#2c8a52'; c.beginPath(); c.arc(px + 20, py + 12, 6, 0, 7); c.fill(); });
  (M.benches || []).forEach(b => { const px = b[0] * T, py = b[1] * T; c.fillStyle = '#7a4b22'; rrect(c, px + 2, py + 18, T * 2 - 4, 14, 4); c.fill(); c.fillStyle = '#a56a36'; rrect(c, px + 2, py + 12, T * 2 - 4, 10, 4); c.fill(); c.fillStyle = '#4a2c12'; c.fillRect(px + 8, py + 32, 5, 12); c.fillRect(px + T * 2 - 14, py + 32, 5, 12); });
  if (hub && M.fountain) {
    const f = M.fountain, cx = (f.x + f.w / 2) * T, cy = (f.y + f.h / 2) * T;
    c.fillStyle = '#9fb4c9'; c.beginPath(); c.ellipse(cx, cy + 6, 2.1 * T, 1.3 * T, 0, 0, 7); c.fill(); c.fillStyle = '#7cd4ff'; c.beginPath(); c.ellipse(cx, cy + 2, 1.9 * T, 1.1 * T, 0, 0, 7); c.fill();
    c.strokeStyle = '#fff'; c.globalAlpha = .6; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy + 2, 1.4 * T, .8 * T, 0, 0, 7); c.stroke(); c.globalAlpha = 1;
    c.fillStyle = '#c9d6e3'; c.fillRect(cx - 8, cy - 26, 16, 34); c.fillStyle = '#7cd4ff'; c.beginPath(); c.ellipse(cx, cy - 28, 24, 8, 0, 0, 7); c.fill();
  }
  // тёплые пятна света от ламп
  c.globalCompositeOperation = 'lighter'; for (let x = 4; x < M.w; x += 8) { const lx = x * T, ly = (hub ? 7 : 5) * T, gl = c.createRadialGradient(lx, ly, 10, lx, ly, 200); gl.addColorStop(0, 'rgba(255,240,200,.14)'); gl.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = gl; c.fillRect(lx - 200, ly - 200, 400, 400); } c.globalCompositeOperation = 'source-over';
  M.bg = cv;
}

// ---------------------------------------------------------------- вход в локацию
function enterLoc(id, spawn) {
  const M = id === 'hub' ? hubLayout() : floorLayout(+id.slice(1));
  M.objs = buildObjs(M); bakeMap(M);
  WORLD.loc = M; WORLD.objs = M.objs; WORLD.near = null; WORLD.parts.length = 0; WORLD.bubbles.length = 0;
  let sp = spawn === 'right' ? M.spawnR : M.spawnL; if (spawn === 'elev' && id === 'hub') sp = { x: 16.5, y: 4.6 };
  if (id === 'hub' && spawn === 'yard') sp = { x: 28, y: 13.5 };
  if (typeof spawn === 'object') sp = spawn;
  WORLD.hero.x = sp.x * T; WORLD.hero.y = sp.y * T; WORLD.pet.x = WORLD.hero.x - 30; WORLD.pet.y = WORLD.hero.y;
  // прохожие школьники
  WORLD.kids = [];
  const n = id === 'hub' ? 7 : 6;
  for (let i = 0; i < n; i++) {
    const k = { x: (3 + Math.random() * (M.w - 6)) * T, y: ((id === 'hub' ? 4 : 4.2) + Math.random() * (id === 'hub' ? 9 : 3)) * T, look: randLook(Math.floor(Math.random() * 9999)), dir: 'd', phase: Math.random() * 6, tx: 0, ty: 0, wait: Math.random() * 2, spd: 55 + Math.random() * 60, seed: Math.random() * 9, say: null };
    pickKidTarget(k); WORLD.kids.push(k);
  }
  S.world = { loc: id, x: WORLD.hero.x, y: WORLD.hero.y };
  if (id !== 'hub') { S.seen.floorVisited = 1; const ch0 = +id.slice(1); if (!S.seen['t' + ch0] && S.name) setTimeout(() => { if (WORLD.loc && WORLD.loc.id === id && !UI_OPEN) talkTeacher(ch0); }, 900); }
  WORLD.zav = (M.objs.find(o => o.zav) || null); if (WORLD.zav) { WORLD.zav.dir = 1; WORLD.zav.ph = 0; WORLD.zav.speak = 0; }
  updHud();
}
function pickKidTarget(k) {
  const M = WORLD.loc, hub = M.id === 'hub';
  for (let i = 0; i < 12; i++) {
    const tx = (2 + Math.random() * (M.w - 4)) * T, ty = ((hub ? 4 : 3.6) + Math.random() * (hub ? 10 : 3.7)) * T;
    if (!M.isSolid(Math.floor(tx / T), Math.floor(ty / T))) { k.tx = tx; k.ty = ty; return; }
  }
  k.tx = k.x; k.ty = k.y;
}
function goLoc(id, spawn) {
  fadeTo(() => { enterLoc(id, spawn); Snd.play('door'); save(true); });
}
function fadeTo(mid) {
  const f = document.getElementById('fade'); f.style.opacity = 1; WORLD.paused = true;
  setTimeout(() => { mid(); setTimeout(() => { f.style.opacity = 0; WORLD.paused = false; }, 120); }, 260);
}

// ---------------------------------------------------------------- обновление
function moveHero(dx, dy, dt) {
  const H = WORLD.hero, M = WORLD.loc, spd = 215;
  H.moving = dx !== 0 || dy !== 0;
  if (!H.moving) return;
  const L = Math.hypot(dx, dy); dx /= L; dy /= L;
  if (Math.abs(dx) > Math.abs(dy)) H.dir = dx > 0 ? 'r' : 'l'; else H.dir = dy > 0 ? 'd' : 'u';
  const try1 = (nx, ny) => {
    const hw = 11; const pts = [[nx - hw, ny], [nx + hw, ny], [nx - hw, ny - 8], [nx + hw, ny - 8]];
    return pts.every(p => !M.isSolid(Math.floor(p[0] / T), Math.floor(p[1] / T)));
  };
  const nx = H.x + dx * spd * dt, ny = H.y + dy * spd * dt;
  if (try1(nx, H.y)) H.x = nx; if (try1(H.x, ny)) H.y = ny;
  H.phase += dt * 14;
  WORLD.stepT -= dt; if (WORLD.stepT <= 0) { WORLD.stepT = .28; Snd.play('step'); }
  // шлейф
  const tr = TRAILS[S.look.trail] ? TRAILS[S.look.trail][0] : null;
  if (tr && Math.random() < .5) {
    const sym = { sparkle: ['✨', '✦', '·'], math: ['+', '−', '×', '÷', 'π', '=', '√'], star: ['⭐', '★'], note: ['🎵', '♪', '♫'], fire: ['🔥'], heart: ['💖', '♥'] }[tr];
    WORLD.parts.push({ x: H.x + (Math.random() - .5) * 14, y: H.y - 6 + (Math.random() - .5) * 6, vx: (Math.random() - .5) * 30 - dx * 20, vy: -20 - Math.random() * 30, life: .9, max: .9, ch: sym[Math.floor(Math.random() * sym.length)], sz: 14 + Math.random() * 8 });
  }
}
function calcScale() {
  const W2 = WORLD, M = W2.loc, land = W2.w >= W2.h * .95, th = M && M.h <= 10 ? 10.4 : 9;
  W2.scale = Math.max(.5, Math.min(2.2, land ? Math.min(W2.w / (13.5 * T), W2.h / (th * T)) : Math.min(W2.w / (8.6 * T), W2.h / (th * T) * 1.6)));
}
function updateWorld(dt) {
  const W2 = WORLD, H = W2.hero, M = W2.loc; if (!M) return;
  calcScale();
  W2.time += dt;
  if (!W2.paused && !UI_OPEN) {
    let ix = W2.input.x, iy = W2.input.y; const k = W2.keys;
    if (k.ArrowLeft || k.KeyA) ix -= 1; if (k.ArrowRight || k.KeyD) ix += 1; if (k.ArrowUp || k.KeyW) iy -= 1; if (k.ArrowDown || k.KeyS) iy += 1;
    const L = Math.hypot(ix, iy); if (L > 1) { ix /= L; iy /= L; }
    moveHero(Math.abs(ix) < .12 ? 0 : ix, Math.abs(iy) < .12 ? 0 : iy, dt);
  } else H.moving = false;
  // питомец
  const P = W2.pet, tx = H.x + (H.dir === 'l' ? 34 : H.dir === 'r' ? -34 : -22), ty = H.y + (H.dir === 'u' ? 22 : 0);
  P.x += (tx - P.x) * Math.min(1, dt * 5); P.y += (ty - P.y) * Math.min(1, dt * 5); P.ph += dt * (H.moving ? 14 : 3);
  // ближайший предмет
  let best = null, bd = 1e9;
  W2.objs.forEach(o => {
    if (!o.r) return; const d = Math.hypot(H.x - o.x, (H.y - o.y) * 1.1);
    if (d < o.r && d < bd) { bd = d; best = o; }
  });
  if (best !== W2.near) { W2.near = best; updateActBtn(); }
  // прохожие
  W2.kids.forEach(k => {
    if (k.say) { k.say.t -= dt; if (k.say.t <= 0) k.say = null; }
    if (k.wait > 0) { k.wait -= dt; k.moving = false; return; }
    const dx = k.tx - k.x, dy = k.ty - k.y, d = Math.hypot(dx, dy);
    if (d < 6) { k.wait = 1 + Math.random() * 3; pickKidTarget(k); k.moving = false; return; }
    k.moving = true; const nx = k.x + dx / d * k.spd * dt, ny = k.y + dy / d * k.spd * dt;
    if (!M.isSolid(Math.floor(nx / T), Math.floor(ny / T))) { k.x = nx; k.y = ny; } else { pickKidTarget(k); }
    k.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u'); k.phase += dt * k.spd * .12;
  });
  // завуч
  const Z = W2.zav;
  if (Z) {
    Z.ph += dt * 6; Z.x += Z.dir * 52 * dt; if (Z.x > (M.w - 10) * T) Z.dir = -1; if (Z.x < 10 * T) Z.dir = 1;
    Z.speak -= dt; const d = Math.hypot(H.x - Z.x, H.y - Z.y);
    if (d < 1.6 * T && H.moving && Z.speak <= 0) { Z.speak = 9; W2.bubbles.push({ x: Z.x, y: Z.y - 80, t: 2.4, txt: R.pick(['Не бегать по коридору!', 'Дневник на стол!', 'Сменка где?', 'Не толкаться!']) }); if (Math.random() < .3) toast('🧐 Завуч Строгина: «Бегать нельзя! …но тебе можно.»', 'ok'); }
  }
  // частицы и пузыри
  W2.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }); W2.parts = W2.parts.filter(p => p.life > 0);
  W2.bubbles.forEach(b => b.t -= dt); W2.bubbles = W2.bubbles.filter(b => b.t > 0);
  // случайные школьные события раз в несколько минут
  if (!UI_OPEN && S.name && W2.paused === false) { W2.evT = (W2.evT || 0) + dt; if (W2.evT > (W2.evNext || (W2.evNext = 240 + Math.random() * 240))) { W2.evT = 0; W2.evNext = 300 + Math.random() * 300; if (S.xp > 60) schoolEvent(); } }
  // камера
  const vw = W2.w / W2.scale, vh = W2.h / W2.scale, mw = M.w * T, mh = M.h * T;
  let cx = H.x - vw / 2, cy = H.y - vh * .56;
  const pad = 66 / W2.scale; // запас сверху под панель HUD
  cx = mw <= vw ? (mw - vw) / 2 : Math.max(0, Math.min(mw - vw, cx)); cy = mh + pad * 0.8 <= vh ? (mh - vh) / 2 + pad * .35 : Math.max(-pad, Math.min(mh - vh + pad * .2, cy));
  W2.cam.x += (cx - W2.cam.x) * Math.min(1, dt * 8); W2.cam.y += (cy - W2.cam.y) * Math.min(1, dt * 8);
  if (!W2._sv || W2.time - W2._sv > 5) { W2._sv = W2.time; S.world = { loc: M.id, x: H.x, y: H.y }; save(); }
}

// ---------------------------------------------------------------- рисование
function guideTarget() {
  // куда идти дальше: подсказка-стрелка над дверью
  const M = WORLD.loc; if (!M || M.id === 'hub') return null;
  const ch = +M.id.slice(1), P = chProg(ch);
  for (let j = 0; j < 6; j++) if (P.lessons[j] === 0) return { lesson: j };
  if (P.boss === 0) return { boss: true };
  return { stairs: true };
}
function drawDoor(c, o, M) {
  const x = o.tx * T, w = o.tw * T, y = o.ty * T;
  let locked = false, stars = 0, st = '';
  if (M.id !== 'hub') {
    const ch = +M.id.slice(1), P = chProg(ch);
    if (o.boss) { locked = !bossUnlocked(ch); stars = P.boss; } else { locked = !lessonUnlocked(ch, o.lesson); stars = P.lessons[o.lesson]; }
  }
  const th = M.th, col = o.col || (o.boss ? '#c2335f' : th.trim);
  // рама
  c.fillStyle = shade(col, .7); rrect(c, x - 4, y - 4, w + 8, T + 8 + (o.south ? 0 : 6), 8); c.fill();
  // полотно
  const grad = c.createLinearGradient(0, y, 0, y + T * 1.1); grad.addColorStop(0, locked ? '#6b6470' : o.boss ? '#e8567a' : (o.col ? shade(o.col, 1.05) : '#c98a52')); grad.addColorStop(1, locked ? '#4a4452' : o.boss ? '#a8264c' : (o.col ? shade(o.col, .78) : '#8a5a2f'));
  c.fillStyle = grad; rrect(c, x, y, w, T + (o.south ? 0 : 6), 6); c.fill();
  if (!o.big || w <= 2 * T) { c.fillStyle = 'rgba(255,255,255,.2)'; rrect(c, x + 8, y + 6, w - 16, 18, 4); c.fill(); }
  else { c.fillStyle = 'rgba(255,255,255,.14)'; for (let i = 1; i < o.tw; i++) c.fillRect(x + i * T - 2, y + 2, 4, T); }
  // ручка
  c.fillStyle = '#ffd54a'; c.beginPath(); c.arc(x + w - 10, y + T * .62, 3.5, 0, 7); c.fill();
  // табличка
  const pw = Math.max(w - 4, 70), px = x + w / 2 - pw / 2, py = o.south ? y - 28 : y - T * 0.98;
  c.fillStyle = 'rgba(20,16,50,.88)'; rrect(c, px, py, pw, 24, 7); c.fill();
  c.strokeStyle = locked ? '#8a8399' : (o.col || th.glow); c.lineWidth = 2; rrect(c, px, py, pw, 24, 7); c.stroke();
  c.fillStyle = locked ? '#b5aec6' : '#fff'; c.font = 'bold 12px "Segoe UI",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  let lab = o.label; while (c.measureText(lab).width > pw - 12 && lab.length > 6) lab = lab.slice(0, -2); c.fillText(lab === o.label ? lab : lab + '…', x + w / 2, py + 12);
  if (o.sub) { c.font = '11px "Segoe UI",sans-serif'; c.fillStyle = locked ? '#8a8399' : th.trim === '#b3562a' ? '#7a3a14' : '#46346e'; let sb = o.sub; const sw2 = Math.max(w + 40, 120); c.fillStyle = 'rgba(255,253,240,.9)'; c.save(); c.font = 'bold 11px "Segoe UI",sans-serif'; const tw2 = Math.min(c.measureText(sb).width + 14, 200); c.fillStyle = 'rgba(255,253,240,.92)'; rrect(c, x + w / 2 - tw2 / 2, py + 26, tw2, 16, 5); c.fill(); c.fillStyle = locked ? '#7a7388' : '#33265a'; c.fillText(sb.length > 30 ? sb.slice(0, 29) + '…' : sb, x + w / 2, py + 34); c.restore(); }
  // иконка в центре двери
  c.font = (o.big ? 34 : 26) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.globalAlpha = locked ? .45 : 1; c.fillText(o.icon, x + w / 2, y + T * .58); c.globalAlpha = 1;
  if (locked) { c.font = '22px "Segoe UI Emoji",sans-serif'; c.fillText('🔒', x + w / 2, y + T * .58); }
  // звёзды
  if (M.id !== 'hub' && !locked) {
    for (let i = 0; i < 3; i++) { c.font = '13px "Segoe UI Emoji",sans-serif'; c.globalAlpha = i < stars ? 1 : .3; c.fillText(i < stars ? '⭐' : '☆', x + w / 2 + (i - 1) * 16, py - 9); } c.globalAlpha = 1;
  }
  // подсветка пути
  const gd = guideTarget();
  if (gd && ((gd.lesson !== undefined && o.lesson === gd.lesson && !o.boss) || (gd.boss && o.boss))) {
    const bob = Math.sin(WORLD.time * 4) * 5; c.fillStyle = M.th.glow; c.strokeStyle = '#fff'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + w / 2, py - 24 + bob); c.lineTo(x + w / 2 - 12, py - 40 + bob); c.lineTo(x + w / 2 + 12, py - 40 + bob); c.closePath(); c.fill(); c.stroke();
  }
}
function drawLocker(c, o) {
  const open = !!S.lockers[WORLD.loc.id + '_' + o.idx], x = o.x - T / 2, y = 8 * T;
  if (open) { c.fillStyle = 'rgba(0,0,0,.35)'; rrect(c, x + 2, y + 2, T - 4, T * 1.6, 5); c.fill(); return; }
  const pulse = (Math.sin(WORLD.time * 4) + 1) / 2;
  c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(o.x, y + 20, 4, o.x, y + 20, 56 + pulse * 10); g.addColorStop(0, 'rgba(255,230,120,.65)'); g.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = g; c.fillRect(o.x - 70, y - 40, 140, 140); c.restore();
  c.font = '20px "Segoe UI Emoji",sans-serif'; c.textAlign = 'center'; c.fillText('✨', o.x + Math.sin(WORLD.time * 3) * 4, y - 6 - pulse * 6);
}
function drawNpc(c, o) {
  if (o.zav) { drawPerson(c, o.x, o.y, { look: o.look, dir: o.dir > 0 ? 'r' : 'l', moving: true, phase: o.ph, seed: 3 }); c.fillStyle = 'rgba(255,255,255,.9)'; c.font = 'bold 10px "Segoe UI",sans-serif'; c.textAlign = 'center'; c.fillText('Завуч', o.x, o.y - 82); return; }
  drawPerson(c, o.x, o.y, { look: o.look, dir: (WORLD.hero.x < o.x - 20) ? 'l' : (WORLD.hero.x > o.x + 20) ? 'r' : 'd', moving: false, seed: o.x, scale: o.big ? 1.12 : 1 });
  // имя
  c.font = 'bold 11px "Segoe UI",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; const nm = o.name + (o.tag ? '' : ''), tw = c.measureText(nm).width + 14, ny = o.y - (o.big ? 92 : 84);
  c.fillStyle = 'rgba(20,16,50,.78)'; rrect(c, o.x - tw / 2, ny - 9, tw, 18, 8); c.fill(); c.fillStyle = '#fff'; c.fillText(nm, o.x, ny + .5);
  if (o.id !== 'zav') { const bob = Math.sin(WORLD.time * 3 + o.x) * 3; c.font = '16px "Segoe UI Emoji",sans-serif'; c.fillText('💬', o.x + 20, ny - 14 + bob); }
}
function drawWorld() {
  const W2 = WORLD, c = W2.c, M = W2.loc; if (!M) return;
  c.setTransform(W2.dpr, 0, 0, W2.dpr, 0, 0);
  c.fillStyle = '#120d24'; c.fillRect(0, 0, W2.w, W2.h);
  c.save(); c.scale(W2.scale, W2.scale); c.translate(-Math.round(W2.cam.x), -Math.round(W2.cam.y));
  c.drawImage(M.bg, 0, 0);
  // двери и шкафчики
  W2.objs.forEach(o => { if (o.k === 'door') drawDoor(c, o, M); else if (o.k === 'locker') drawLocker(c, o); });
  if (M.id === 'hub' && !S.seen.floorVisited) { const e = W2.objs.find(o => o.label === 'Лифт'); if (e) { const bob = Math.sin(W2.time * 4) * 6; c.fillStyle = '#ffd54a'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(e.x, e.ty * T + T + 36 + bob); c.lineTo(e.x - 14, e.ty * T + T + 12 + bob); c.lineTo(e.x + 14, e.ty * T + T + 12 + bob); c.closePath(); c.fill(); c.stroke(); } }
  if (M.id !== 'hub') { const gd = guideTarget(); if (gd && gd.stairs) { const st = W2.objs.find(o => o.k === 'stairs' && o.dir === 'up'); if (st) { const pulse = (Math.sin(W2.time * 5) + 1) / 2; c.strokeStyle = 'rgba(255,213,74,' + (.4 + pulse * .5) + ')'; c.lineWidth = 5; c.beginPath(); c.arc(st.x, st.y + 6, 44 + pulse * 6, 0, 7); c.stroke(); } } }
  // стрелки лестниц
  if (M.id !== 'hub') W2.objs.filter(o => o.k === 'stairs').forEach(o => { c.font = '30px "Segoe UI Emoji",sans-serif'; c.textAlign = 'center'; c.fillText(o.icon, o.x, o.y + Math.sin(W2.time * 3) * 4); c.font = 'bold 12px "Segoe UI",sans-serif'; c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3; c.strokeText(o.label, o.x, o.y + 28); c.fillText(o.label, o.x, o.y + 28); });
  // сущности по Y
  const ents = [];
  W2.objs.forEach(o => { if (o.k === 'npc') ents.push({ y: o.y, f: () => drawNpc(c, o) }); });
  W2.kids.forEach(k => ents.push({ y: k.y, f: () => { drawPerson(c, k.x, k.y, { look: k.look, dir: k.dir, moving: k.moving, phase: k.phase, seed: k.seed }); if (k.say) bubble(c, k.x, k.y - 88, k.say.txt); } }));
  const H = W2.hero; ents.push({ y: H.y, f: () => drawPerson(c, H.x, H.y, { look: S.look, dir: H.dir, moving: H.moving, phase: H.phase, seed: 1 }) });
  const pet = PETS[S.look.pet];
  if (pet && pet.e) ents.push({ y: W2.pet.y, f: () => { const b = Math.abs(Math.sin(W2.pet.ph)) * 5; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(W2.pet.x, W2.pet.y + 2, 12, 4, 0, 0, 7); c.fill(); c.font = '28px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(pet.e, W2.pet.x, W2.pet.y - b); } });
  ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  // имя героя
  if (S.name) { c.font = 'bold 11px "Segoe UI",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; const tw = c.measureText(S.name).width + 14; c.fillStyle = 'rgba(255,213,74,.92)'; rrect(c, H.x - tw / 2, H.y - 92, tw, 17, 8); c.fill(); c.fillStyle = '#2b1b00'; c.fillText(S.name, H.x, H.y - 83); }
  W2.bubbles.forEach(b => bubble(c, b.x, b.y, b.txt));
  // частицы
  W2.parts.forEach(p => { c.globalAlpha = Math.max(0, p.life / p.max); c.font = p.sz + 'px "Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.fillStyle = '#ffe9a8'; c.textAlign = 'center'; c.fillText(p.ch, p.x, p.y); }); c.globalAlpha = 1;
  // подсветка ближайшего
  if (W2.near && W2.near.use) { const n = W2.near, b = Math.sin(W2.time * 6) * 3; c.fillStyle = 'rgba(255,255,255,.9)'; c.font = 'bold 12px "Segoe UI",sans-serif'; c.textAlign = 'center'; if (n.k === 'npc' || n.k === 'locker') { c.font = '22px "Segoe UI Emoji",sans-serif'; c.fillText('👆', n.x, n.y - (n.k === 'npc' ? 112 : 70) + b); } }
  c.restore();
  // мягкая виньетка
  const vg = c.createRadialGradient(W2.w / 2, W2.h / 2, Math.min(W2.w, W2.h) * .45, W2.w / 2, W2.h / 2, Math.max(W2.w, W2.h) * .75); vg.addColorStop(0, 'rgba(10,6,30,0)'); vg.addColorStop(1, 'rgba(10,6,30,.5)'); c.fillStyle = vg; c.fillRect(0, 0, W2.w, W2.h);
}
function bubble(c, x, y, txt) {
  c.save(); c.font = 'bold 12px "Segoe UI",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const words = txt.split(' '), lines = []; let cur = '';
  words.forEach(w => { if (c.measureText(cur + ' ' + w).width > 170 && cur) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }); lines.push(cur);
  const bw = Math.min(190, Math.max(...lines.map(l => c.measureText(l).width)) + 18), bh = lines.length * 15 + 10, bx = x - bw / 2, by = y - bh;
  c.fillStyle = 'rgba(255,255,255,.96)'; rrect(c, bx, by, bw, bh, 9); c.fill(); c.beginPath(); c.moveTo(x - 5, by + bh); c.lineTo(x, by + bh + 8); c.lineTo(x + 5, by + bh); c.fill();
  c.fillStyle = '#2a2250'; lines.forEach((l, i) => c.fillText(l, x, by + 12 + i * 15)); c.restore();
}

// ---------------------------------------------------------------- размеры и управление
function resizeWorld() {
  const W2 = WORLD, cv = W2.cv; W2.dpr = Math.min(2, window.devicePixelRatio || 1);
  W2.w = window.innerWidth; W2.h = window.innerHeight;
  cv.width = Math.round(W2.w * W2.dpr); cv.height = Math.round(W2.h * W2.dpr); cv.style.width = W2.w + 'px'; cv.style.height = W2.h + 'px';
  document.documentElement.style.setProperty('--vh', W2.h + 'px');
}
function updateActBtn() {
  const b = document.getElementById('act'), n = WORLD.near;
  if (!b) return;
  if (n && n.use) { b.classList.add('on'); b.innerHTML = `<span class="ai">${n.k === 'npc' ? '💬' : n.k === 'stairs' ? n.icon : n.k === 'locker' ? '🗝️' : n.icon || '🚪'}</span><span class="al">${n.k === 'npc' ? 'Говорить' : n.k === 'locker' ? 'Открыть' : n.k === 'stairs' ? 'Пойти' : 'Войти'}</span>`; }
  else { b.classList.remove('on'); b.innerHTML = '<span class="ai">🏃</span><span class="al">Беги!</span>'; }
}
function doAction() {
  Snd.init(); if (UI_OPEN || WORLD.paused) return;
  const n = WORLD.near; if (n && n.use) { Snd.play('click'); n.use(); }
}
function initWorldInput() {
  const cv = WORLD.cv, root = document.getElementById('game');
  window.addEventListener('resize', resizeWorld); window.addEventListener('orientationchange', () => setTimeout(resizeWorld, 200));
  window.addEventListener('keydown', e => {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    WORLD.keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0 && !UI_OPEN) e.preventDefault();
    if ((e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') && !UI_OPEN) doAction();
    if (e.code === 'Escape' && !UI_OPEN) openMenu();
  });
  window.addEventListener('keyup', e => { WORLD.keys[e.code] = false; });
  window.addEventListener('blur', () => { WORLD.keys = {}; WORLD.input = { x: 0, y: 0 }; WORLD.joy = null; hideJoy(); });
  // плавающий джойстик
  const joy = document.getElementById('joy'), knob = document.getElementById('knob');
  function jstart(x, y, id) { WORLD.joy = { id: id, ox: x, oy: y }; joy.style.display = 'block'; joy.style.left = (x - 55) + 'px'; joy.style.top = (y - 55) + 'px'; knob.style.transform = 'translate(0,0)'; }
  function jmove(x, y) {
    const J = WORLD.joy; if (!J) return; let dx = x - J.ox, dy = y - J.oy; const L = Math.hypot(dx, dy), R0 = 48;
    if (L > R0) { dx = dx / L * R0; dy = dy / L * R0; }
    knob.style.transform = `translate(${dx}px,${dy}px)`; WORLD.input = { x: dx / R0, y: dy / R0 };
  }
  window.hideJoy = function () { joy.style.display = 'none'; WORLD.input = { x: 0, y: 0 }; };
  const hit = e => e.target === cv || e.target.id === 'game';
  cv.addEventListener('touchstart', e => {
    Snd.init(); e.preventDefault(); if (UI_OPEN) return;
    for (const t of e.changedTouches) { if (!WORLD.joy) { // тап по предмету, иначе джойстик
      jstart(t.clientX, t.clientY, t.identifier); WORLD.tapStart = { x: t.clientX, y: t.clientY, t: Date.now() };
    } }
  }, { passive: false });
  cv.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (WORLD.joy && t.identifier === WORLD.joy.id) jmove(t.clientX, t.clientY); }, { passive: false });
  const tend = e => {
    e.preventDefault();
    for (const t of e.changedTouches) if (WORLD.joy && t.identifier === WORLD.joy.id) {
      const ts = WORLD.tapStart; WORLD.joy = null; hideJoy();
      if (ts && Date.now() - ts.t < 260 && Math.hypot(t.clientX - ts.x, t.clientY - ts.y) < 14) tapWorld(t.clientX, t.clientY);
    }
  };
  cv.addEventListener('touchend', tend, { passive: false }); cv.addEventListener('touchcancel', tend, { passive: false });
  // мышь: перетаскивание = джойстик, клик = взаимодействие
  let md = false;
  cv.addEventListener('mousedown', e => { Snd.init(); if (UI_OPEN) return; md = true; WORLD.tapStart = { x: e.clientX, y: e.clientY, t: Date.now() }; jstart(e.clientX, e.clientY, 'm'); });
  window.addEventListener('mousemove', e => { if (md) jmove(e.clientX, e.clientY); });
  window.addEventListener('mouseup', e => { if (!md) return; md = false; const ts = WORLD.tapStart; WORLD.joy = null; hideJoy(); if (ts && Date.now() - ts.t < 260 && Math.hypot(e.clientX - ts.x, e.clientY - ts.y) < 8) tapWorld(e.clientX, e.clientY); });
  const act = document.getElementById('act');
  const press = e => { e.preventDefault(); e.stopPropagation(); doAction(); };
  act.addEventListener('touchstart', press, { passive: false }); act.addEventListener('mousedown', press);
  cv.addEventListener('contextmenu', e => e.preventDefault());
}
// тап по миру: если нажали на близкий предмет — взаимодействуем; по прохожему — он болтает
function tapWorld(sx, sy) {
  if (UI_OPEN || WORLD.paused) return;
  const wx = sx / WORLD.scale + Math.round(WORLD.cam.x), wy = sy / WORLD.scale + Math.round(WORLD.cam.y);
  let best = null, bd = 60;
  WORLD.objs.forEach(o => { if (!o.use) return; const cy = o.k === 'door' ? o.ty * T + T / 2 : o.k === 'npc' ? o.y - 40 : o.y - 20, d = Math.hypot(wx - o.x, wy - cy); if (d < Math.max(bd, o.k === 'door' ? o.tw * T / 2 + 20 : 0)) { bd = d; best = o; } });
  if (best) { if (WORLD.near === best) { doAction(); } else { toast('Подойди ближе 🚶', 'ok'); } return; }
  WORLD.kids.forEach(k => { if (Math.hypot(wx - k.x, wy - (k.y - 36)) < 34) { talkKid(k); } });
}
function talkKid(k) {
  if (k.say) return; const txt = R.chance(.4) ? '💡 ' + R.pick(TIPS) : R.pick(CHATTER); k.say = { txt: txt, t: 4.5 }; k.wait = 4.5; Snd.play('click');
  if (!S.seen.firstKid) { S.seen.firstKid = 1; }
}
