'use strict';
// ============================================================================
//  ГЕНЕРАТОРЫ ЗАДАЧ. Каждая задача создаётся заново со случайными числами,
//  поэтому одну и ту же картинку нельзя «загуглить» или заранее переслать
//  нейросети. Файл не зависит от браузера (проверяется в Node: tools/test_gen.js).
//  Задача = { kind:'num'|'frac'|'choice', q, ans|n,d, choices, sol, time, fig, note }
// ============================================================================
const R = {
  ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  pick(a) { return a[Math.floor(Math.random() * a.length)]; },
  sh(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  chance(p) { return Math.random() < p; },
  nz(a, b) { let x; do { x = R.ri(a, b); } while (x === 0); return x; },
};
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
function lcm(a, b) { return a / gcd(a, b) * b; }
// число для показа: запятая вместо точки, настоящий минус
function fm(x) {
  if (typeof x === 'string') return x;
  let s = (Math.round(x * 1e9) / 1e9).toString();
  if (s.indexOf('e') >= 0) s = x.toFixed(6);
  return s.replace('-', '−').replace('.', ',');
}
// падеж: pl(5,'час','часа','часов') -> «часов»
function pl(n, a, b, c) { n = Math.abs(n) % 100; const m = n % 10; return n > 10 && n < 20 ? c : m === 1 ? a : m >= 2 && m <= 4 ? b : c; }
// комплексное число a + bi
function cplx(a, b) { const bi = Math.abs(b) === 1 ? 'i' : Math.abs(b) + 'i'; if (a === 0) return (b < 0 ? '−' : '') + bi; return a + (b < 0 ? ' − ' : ' + ') + bi; }
// (x − m)
function xm(m) { return m === 0 ? 'x' : m < 0 ? '(x + ' + (-m) + ')' : '(x − ' + m + ')'; }
function pw(a, n) { return a + '<sup>' + n + '</sup>'; }
function fr(n, d) { return '<span class="fr"><i>' + n + '</i><b>' + d + '</b></span>'; }
function par(n) { return n < 0 ? '(−' + (-n) + ')' : '' + n; }
function coef(k, v) { return k === 1 ? v : k === -1 ? '−' + v : (k < 0 ? '−' + (-k) : k) + v; }
// kx + b
function lin(k, b, v) {
  v = v || 'x';
  if (k === 0) return fm(b);
  let s = coef(k, v);
  if (b > 0) s += ' + ' + b; else if (b < 0) s += ' − ' + (-b);
  return s;
}
// ax² + bx + c
function quad(a, b, c, v) {
  v = v || 'x';
  let s = coef(a, v + '²');
  if (b) s += (b < 0 ? ' − ' : ' + ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + v;
  if (c) s += (c < 0 ? ' − ' : ' + ') + Math.abs(c);
  return s;
}
function sgn(n) { return n < 0 ? ' − ' + (-n) : ' + ' + n; }

// настоящий минус вместо дефиса перед числом
function mfix(s) {
  // настоящий минус; десятичная запятая вместо точки (кроме внутри HTML-тегов)
  return String(s).replace(/(^|[\s(=,;:>·×÷+*\/])-(?=[\d√])/g, '$1−').replace(/(<[^>]*>)|(\d)\.(\d)/g, (m, tag, a, b) => tag ? tag : a + ',' + b);
}

// ---------- конструкторы задач ----------
function N(q, ans, sol, o) { return Object.assign({ kind: 'num', q: q, ans: ans, sol: sol || '', time: 30 }, o); }
function F(q, n, d, sol, o) {
  const g = gcd(n, d) || 1; if (d < 0) { n = -n; d = -d; }
  if (g > 1 && !(o && o.reduced) && !/сокра/i.test(sol || '')) sol = (sol || '') + ' Сокращаем: ' + (d / g === 1 ? n / g : (n / g) + '/' + (d / g)) + '.';
  return Object.assign({ kind: 'frac', q: q, n: n / g, d: d / g, sol: sol || '', time: 40, note: 'Ответ запиши дробью, например 3/4' }, o);
}
function key(x) { return typeof x === 'string' ? x : JSON.stringify(x); }
// правильный ответ + неправильные; варианты перемешиваются
function C(q, right, wrong, sol, o) {
  const seen = { [key(right)]: 1 }, opts = [right];
  wrong.forEach(w => { const k = key(w); if (!seen[k]) { seen[k] = 1; opts.push(w); } });
  const idx = R.sh(opts.map((_, i) => i));
  const choices = idx.map(i => opts[i]);
  return Object.assign({ kind: 'choice', q: q, choices: choices, ans: idx.indexOf(0), sol: sol || '', time: 25 }, o);
}
// правдоподобные неверные ответы к целому числу
function near(ans, n, lo) {
  const c = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, ans * 2, Math.round(ans / 2), ans + 5, ans - 5, ans + 100, ans - 100, -ans];
  const out = [];
  R.sh(c).forEach(v => { if (v !== ans && out.indexOf(v) < 0 && (lo === undefined || v >= lo) && Number.isFinite(v)) out.push(v); });
  return out.slice(0, n);
}
function nearD(ans, n) {
  const c = [ans + 0.1, ans - 0.1, ans * 10, ans / 10, ans + 1, ans - 1, ans * 2, ans / 2, ans + 0.5, ans - 0.5, -ans];
  const out = [];
  R.sh(c).forEach(v => { v = Math.round(v * 1e6) / 1e6; if (v !== ans && out.indexOf(v) < 0) out.push(v); });
  return out.slice(0, n);
}

// ---------- реестр тем ----------
const TOPICS = {};
const TOPIC_ORDER = [];
function g(min, f, w, max) { return { m: min, f: f, w: w || 1, x: max || 3 }; }
function def(id, o) { o.id = id; TOPICS[id] = o; TOPIC_ORDER.push(id); }

function makeTask(topicId, d) {
  const T = TOPICS[topicId];
  d = Math.max(1, Math.min(3, d | 0 || 1));
  let pool = T.gens.filter(x => x.m <= d && x.x >= d);
  if (!pool.length) pool = T.gens;
  let sum = 0; pool.forEach(x => sum += x.w);
  let r = Math.random() * sum, pick = pool[0];
  for (const x of pool) { r -= x.w; if (r <= 0) { pick = x; break; } }
  const t = pick.f(d);
  if (!t) return makeTask(topicId, d);
  t.topic = topicId; t.lv = d;
  t.q = mfix(t.q); t.sol = mfix(t.sol || '');
  if (t.choices) t.choices = t.choices.map(c => typeof c === 'string' ? mfix(c) : c);
  t.time = Math.round(t.time || 30);
  return t;
}

// ---------- проверка ответа ----------
function parseNum(raw) {
  let s = String(raw).trim().replace(/[−–—]/g, '-').replace(/,/g, '.').replace(/\s+/g, '');
  if (!s) return NaN;
  if (s.indexOf('/') > 0) {
    const p = s.split('/');
    if (p.length !== 2 || !/^-?\d+$/.test(p[0]) || !/^\d+$/.test(p[1])) return NaN;
    const d = +p[1]; return d ? (+p[0]) / d : NaN;
  }
  return /^-?\d+(\.\d+)?$/.test(s) ? +s : NaN;
}
function checkAnswer(t, raw) {
  if (t.kind === 'choice') return raw === t.ans;
  const v = parseNum(raw);
  if (!isFinite(v)) return false;
  if (t.kind === 'num') return Math.abs(v - t.ans) <= (t.tol === undefined ? 1e-6 : t.tol);
  if (t.kind === 'frac') {
    if (Math.abs(v - t.n / t.d) > 1e-9) return false;
    if (t.reduced && String(raw).indexOf('/') > 0) {
      const p = String(raw).replace(/[−–—]/g, '-').split('/'); return gcd(+p[0], +p[1]) === 1 && +p[1] === t.d;
    }
    if (t.reduced && t.d !== 1) return String(raw).indexOf('/') > 0;
    return true;
  }
  return false;
}
function answerText(t) {
  if (t.kind === 'num') return fm(t.ans) + (t.unit ? ' ' + t.unit : '');
  if (t.kind === 'frac') return t.d === 1 ? fm(t.n) : fr(t.n, t.d);
  if (t.kind === 'choice') { const c = t.choices[t.ans]; return typeof c === 'string' ? c : '(верный график)'; }
  return '';
}

const NAMES = ['Вася', 'Маша', 'Петя', 'Катя', 'Гоша', 'Лиза', 'Тёма', 'Ксюша', 'Даня', 'Соня', 'Игорь', 'Аня'];
const GIRLS = ['Маша', 'Катя', 'Лиза', 'Ксюша', 'Соня', 'Аня'];
function person() { const n = R.pick(NAMES), f = GIRLS.indexOf(n) >= 0; return { n: n, f: f, bought: f ? 'купила' : 'купил', he: f ? 'она' : 'он' }; }
const NAMES_G = { 'Вася': 'Васи', 'Маша': 'Маши', 'Петя': 'Пети', 'Катя': 'Кати', 'Гоша': 'Гоши', 'Лиза': 'Лизы', 'Тёма': 'Тёмы', 'Ксюша': 'Ксюши', 'Даня': 'Дани', 'Соня': 'Сони', 'Игорь': 'Игоря', 'Аня': 'Ани' };

// ============================================================================
//  ГЛАВА 0. Начальная школа: счёт и таблица умножения
// ============================================================================
const MNEMO = {
  56: 'Запомни: 5, 6, 7, 8 → 56 = 7 × 8.', 42: '6 × 7 = 42 — «шесть на семь — сорок два».',
  48: '6 × 8 = 48 — «шестью восемь — сорок восемь».', 54: '6 × 9 = 54: у ×9 цифры ответа дают 9 (5+4).',
  63: '7 × 9 = 63: у ×9 цифры ответа дают 9 (6+3).', 72: '8 × 9 = 72: у ×9 цифры ответа дают 9 (7+2).',
  81: '9 × 9 = 81: 8+1 = 9.', 64: '8 × 8 = 64 — «восемью восемь — шестьдесят четыре».',
  49: '7 × 7 = 49.', 36: '6 × 6 = 36.', 45: '5 × 9 = 45: 4+5 = 9.',
};

def('addsub', {
  name: 'Сложение и вычитание', ch: 0, icon: '➕',
  learn: 'Складывай и вычитай по разрядам: сначала единицы, потом десятки, потом сотни. Удобно «округлять»: 48 + 37 = 50 + 35 = 85 (одному дали +2, у другого забрали −2).',
  formulas: ['f_comm', 'f_round'],
  gens: [
    g(1, d => {
      const lo = [0, 11, 101, 1001][d], hi = [0, 89, 899, 8999][d], t = [0, 12, 22, 32][d];
      if (d === 3 && R.chance(.5)) {
        const a = R.ri(lo, hi), b = R.ri(lo, hi), c = R.ri(lo, hi >> 1);
        return N(`${a} + ${b} − ${c} = ?`, a + b - c, `${a} + ${b} = ${a + b}; ${a + b} − ${c} = ${a + b - c}.`, { time: 40 });
      }
      if (R.chance(.5)) { const a = R.ri(lo, hi), b = R.ri(lo, hi); return N(`${a} + ${b} = ?`, a + b, `Складываем по разрядам: ${a} + ${b} = ${a + b}.`, { time: t }); }
      let a = R.ri(lo, hi), b = R.ri(lo, hi); if (a < b) [a, b] = [b, a];
      return N(`${a} − ${b} = ?`, a - b, `Вычитаем по разрядам, занимая десяток при необходимости: ${a} − ${b} = ${a - b}.`, { time: t });
    }),
  ],
});

def('mul', {
  name: 'Таблица умножения', ch: 0, icon: '✖️',
  learn: 'Таблица умножения — фундамент всей математики. Секрет: a × b = b × a, поэтому учить надо вдвое меньше. Правило девятки: в ответе на ×9 цифры дают в сумме 9 (9 × 7 = 63, 6+3 = 9). Тренируйся быстро — ответ должен «выскакивать» сам!',
  formulas: ['f_comm', 'f_table9', 'f_distrib'],
  gens: [
    g(1, d => {
      let a, b;
      if (d === 1) { a = R.ri(2, 5); b = R.ri(2, 9); } else if (d === 2) { a = R.ri(6, 9); b = R.ri(6, 9); } else { a = R.ri(2, 9); b = R.ri(2, 9); }
      if (R.chance(.5)) [a, b] = [b, a];
      return N(`${a} × ${b} = ?`, a * b, `${a} × ${b} = ${a * b}. ${MNEMO[a * b] || ''}`, { time: [0, 7, 9, 8][d] });
    }, 4),
    g(1, d => {
      const a = d === 1 ? R.ri(2, 5) : R.ri(3, 9), b = d === 1 ? R.ri(2, 9) : R.ri(3, 9);
      return N(R.chance(.5) ? `? × ${a} = ${a * b}` : `${a} × ? = ${a * b}`, b, `${a * b} ÷ ${a} = ${b}, значит пропущено ${b}.`, { time: d === 1 ? 10 : 12 });
    }, 2),
    g(3, d => {
      const t = R.ri(0, 2);
      if (t === 0) { const a = R.ri(11, 19), b = R.ri(3, 9); return N(`${a} × ${b} = ?`, a * b, `${a} × ${b} = ${a - a % 10} × ${b} + ${a % 10} × ${b} = ${(a - a % 10) * b} + ${(a % 10) * b} = ${a * b}.`, { time: 18 }); }
      if (t === 1) { const a = R.ri(21, 49), b = R.ri(3, 9); return N(`${a} × ${b} = ?`, a * b, `Раздели число на разряды: ${a} × ${b} = ${(a - a % 10) * b} + ${(a % 10) * b} = ${a * b}.`, { time: 22 }); }
      const a = R.pick([12, 15, 25, 11]), b = R.ri(2, 12); return N(`${a} × ${b} = ?`, a * b, `${a} × ${b} = ${a * b}.`, { time: 16 });
    }, 3, 3),
  ],
});

def('div', {
  name: 'Деление', ch: 0, icon: '➗',
  learn: 'Деление — обратное умножению: если 7 × 8 = 56, то 56 ÷ 7 = 8. Если число не делится нацело, получается остаток: 17 ÷ 5 = 3 (остаток 2), потому что 17 = 5 × 3 + 2. Остаток всегда меньше делителя.',
  formulas: ['f_divcheck', 'f_comm'],
  gens: [
    g(1, d => {
      const a = d === 1 ? R.ri(2, 5) : R.ri(3, 9), b = R.ri(2, 9);
      return N(`${a * b} ÷ ${a} = ?`, b, `Вспоминаем таблицу: ${a} × ${b} = ${a * b}, значит ${a * b} ÷ ${a} = ${b}.`, { time: 9 });
    }, 3, 2),
    g(2, d => {
      const a = R.ri(3, 12), b = R.ri(6, d === 2 ? 15 : 40);
      return N(`${a * b} ÷ ${a} = ?`, b, `${a} × ${b} = ${a * b}, значит ${a * b} ÷ ${a} = ${b}.`, { time: 18 });
    }, 2),
    g(2, d => {
      const b = R.ri(3, 9), q = R.ri(2, 9), r = R.ri(1, b - 1), a = b * q + r;
      return N(`Найди остаток от деления ${a} на ${b}.`, r, `${a} = ${b} × ${q} + ${r}, остаток ${r}.`, { time: 16 });
    }, 2),
  ],
});

def('order', {
  name: 'Порядок действий', ch: 0, icon: '🧮',
  learn: 'Порядок действий: сначала скобки, потом умножение и деление (слева направо), в конце сложение и вычитание. 2 + 3 × 4 = 14, а не 20!',
  formulas: ['f_order'],
  gens: [
    g(1, d => {
      const a = R.ri(2, 20), b = R.ri(2, 9), c = R.ri(2, 9);
      if (R.chance(.5)) return N(`${a} + ${b} × ${c} = ?`, a + b * c, `Сначала умножение: ${b} × ${c} = ${b * c}; потом ${a} + ${b * c} = ${a + b * c}.`, { time: 16 });
      const x = b * c + R.ri(1, 20); return N(`${x} − ${b} × ${c} = ?`, x - b * c, `Сначала умножение: ${b} × ${c} = ${b * c}; потом ${x} − ${b * c} = ${x - b * c}.`, { time: 16 });
    }, 2, 1),
    g(2, d => {
      const a = R.ri(2, 15), b = R.ri(2, 12), c = R.ri(2, 9), e = R.ri(2, 9);
      const t = R.ri(0, 2);
      if (t === 0) return N(`(${a} + ${b}) × ${c} = ?`, (a + b) * c, `Сначала скобки: ${a} + ${b} = ${a + b}; потом × ${c} = ${(a + b) * c}.`, { time: 20 });
      if (t === 1) return N(`${a} × ${c} + ${b} × ${e} = ?`, a * c + b * e, `Оба произведения: ${a * c} и ${b * e}; их сумма ${a * c + b * e}.`, { time: 24 });
      return N(`${a * c} ÷ ${c} + ${b} × ${e} = ?`, a + b * e, `${a * c} ÷ ${c} = ${a}; ${b} × ${e} = ${b * e}; сумма ${a + b * e}.`, { time: 24 });
    }, 2),
    g(3, d => {
      const a = R.ri(2, 12), b = R.ri(2, 9), c = R.ri(2, 9), e = R.ri(2, 8), k = R.ri(2, 9);
      const t = R.ri(0, 1);
      if (t === 0) return N(`(${a} + ${b}) × ${c} − ${e * k} ÷ ${e} = ?`, (a + b) * c - k, `Скобки: ${a + b}; умножаем: ${(a + b) * c}; делим: ${e * k} ÷ ${e} = ${k}; вычитаем: ${(a + b) * c - k}.`, { time: 34 });
      const cc = b + R.ri(1, 6); return N(`${a} + ${c} × (${cc} − ${b}) = ?`, a + c * (cc - b), `Скобки: ${cc} − ${b} = ${cc - b}; потом × ${c} = ${c * (cc - b)}; плюс ${a} = ${a + c * (cc - b)}.`, { time: 30 });
    }, 2),
  ],
});

def('units', {
  name: 'Единицы измерения', ch: 0, icon: '📏',
  learn: '1 км = 1000 м, 1 м = 100 см, 1 кг = 1000 г, 1 т = 1000 кг, 1 ч = 60 мин, 1 мин = 60 с. Чтобы перейти к меньшим единицам — умножай, к большим — дели.',
  formulas: ['f_units'],
  gens: [
    g(1, d => {
      const t = R.ri(0, 4), n = R.ri(2, 9);
      const L = [['км', 'м', 1000], ['м', 'см', 100], ['кг', 'г', 1000], ['ч', 'мин', 60], ['мин', 'с', 60]][t];
      return N(`${n} ${L[0]} = ? ${L[1]}`, n * L[2], `1 ${L[0]} = ${L[2]} ${L[1]}, значит ${n} ${L[0]} = ${n * L[2]} ${L[1]}.`, { time: 14 });
    }, 2, 2),
    g(2, d => {
      const t = R.ri(0, 3), a = R.ri(1, 9), b = R.ri(1, 59);
      if (t === 0) return N(`${a} ч ${b} мин = ? мин`, a * 60 + b, `${a} ч = ${a * 60} мин, плюс ${b} мин = ${a * 60 + b} мин.`, { time: 22 });
      if (t === 1) { const c = R.ri(1, 99); return N(`${a} м ${c} см = ? см`, a * 100 + c, `${a} м = ${a * 100} см, плюс ${c} см = ${a * 100 + c} см.`, { time: 22 }); }
      if (t === 2) { const c = R.ri(1, 999); return N(`${a} кг ${c} г = ? г`, a * 1000 + c, `${a} кг = ${a * 1000} г, плюс ${c} г = ${a * 1000 + c} г.`, { time: 22 }); }
      return N(`${a * 60 + b} мин = ? ч ? мин. Сколько там минут (остаток)?`, b, `${a * 60 + b} = ${a} × 60 + ${b}, остаток ${b} мин.`, { time: 22 });
    }, 2),
    g(3, d => {
      const t = R.ri(0, 3);
      if (t === 0) { const x = R.pick([1.5, 2.5, 0.5, 3.5, 4.5]); return N(`${fm(x)} ч = ? мин`, x * 60, `${fm(x)} × 60 = ${x * 60} мин.`, { time: 22 }); }
      if (t === 1) { const x = R.pick([0.25, 0.75, 1.25, 2.75]); return N(`${fm(x)} ч = ? мин`, x * 60, `${fm(x)} × 60 = ${x * 60} мин.`, { time: 22 }); }
      if (t === 2) { const x = R.ri(11, 99) / 10; return N(`${fm(x)} км = ? м`, x * 1000, `${fm(x)} × 1000 = ${x * 1000} м.`, { time: 24 }); }
      const x = R.ri(2, 49) / 10; return N(`${fm(x)} кг = ? г`, Math.round(x * 1000), `${fm(x)} × 1000 = ${Math.round(x * 1000)} г.`, { time: 24 });
    }, 2, 3),
  ],
});

def('word1', {
  name: 'Задачи из школьной жизни', ch: 0, icon: '🎒',
  learn: 'В текстовой задаче сначала пойми, что спрашивают. Выпиши числа, придумай, какое действие связывает их: «всего» — чаще сложение или умножение, «поровну» — деление, «осталось» — вычитание.',
  formulas: ['f_order'],
  gens: [
    g(1, d => {
      const P0 = person(), n = P0.n, a = R.ri(3, 9), p = R.ri(5, 15) * (d > 1 ? 2 : 1);
      const k = R.ri(0, 7);
      switch (k) {
        case 0: return N(`На перемене ${n} ${P0.bought} ${a} ${pl(a, 'булочку', 'булочки', 'булочек')} по ${p} ₽. Сколько ${P0.he} заплатил${P0.f ? 'а' : ''}?`, a * p, `${a} × ${p} = ${a * p} ₽.`, { time: 24 });
        case 1: { const c = R.ri(5, 12), m = R.ri(20, 32); return N(`В школе ${c} ${pl(c, 'класс', 'класса', 'классов')} по ${m} ${pl(m, 'ученику', 'ученика', 'учеников')}. Сколько всего учеников?`, c * m, `${c} × ${m} = ${c * m}.`, { time: 30 }); }
        case 2: { const kids = R.ri(4, 9), per = R.ri(3, 8); return N(`Учитель раздал ${kids * per} тетрадей поровну ${kids} ученикам. Сколько тетрадей у каждого?`, per, `${kids * per} ÷ ${kids} = ${per}.`, { time: 22 }); }
        case 3: { const m = R.ri(40, 45), x = R.ri(10, 35); return N(`Урок длится ${m} минут. Прошло ${x} минут. Сколько осталось до звонка?`, m - x, `${m} − ${x} = ${m - x}.`, { time: 20 }); }
        case 4: { const r = R.ri(3, 5), c = R.ri(4, 6), e = R.ri(2, 7); return N(`В кабинете ${r} ${pl(r, 'ряд', 'ряда', 'рядов')} по ${c} ${pl(c, 'парте', 'парты', 'парт')}. ${e} ${pl(e, 'парта сломана', 'парты сломаны', 'парт сломаны')}. Сколько парт целых?`, r * c - e, `Всего ${r} × ${c} = ${r * c} парт, целых ${r * c} − ${e} = ${r * c - e}.`, { time: 30 }); }
        case 5: { const x = R.ri(8, 20), y = R.ri(3, 7); return N(`Гоша списал ${x} ${pl(x, 'задачу', 'задачи', 'задач')}, а сам решил на ${y} меньше, чем списал. Сколько задач он решил сам?`, x - y, `${x} − ${y} = ${x - y}. (Лучше бы решал сам!)`, { time: 22 }); }
        case 6: { const s = R.ri(2, 6), pr = R.ri(12, 30); return N(`Билет в школьный театр стоит ${pr} ₽. Сколько стоят ${s} ${pl(s, 'билет', 'билета', 'билетов')}?`, s * pr, `${s} × ${pr} = ${s * pr} ₽.`, { time: 24 }); }
        default: { const t = R.ri(3, 8); return N(`${n} пробегает по коридору ${t} ${pl(t, 'шаг', 'шага', 'шагов')} за секунду. Сколько шагов ${P0.he} сделает за 6 секунд?`, t * 6, `${t} × 6 = ${t * 6}.`, { time: 22 }); }
      }
    }, 2),
    g(2, d => {
      const P1 = person(), n = P1.n, p = R.ri(2, 9) * 10, a = R.ri(3, 6), b = R.ri(2, 5);
      const k = R.ri(0, 2);
      if (k === 0) return N(`${n} ${P1.bought} ${a} ${pl(a, 'ручку', 'ручки', 'ручек')} по ${p / 10 + 2} ₽ и ${b} ${pl(b, 'тетрадь', 'тетради', 'тетрадей')} по ${p / 10 + 8} ₽. Сколько ${P1.he} заплатил${P1.f ? 'а' : ''} всего?`, a * (p / 10 + 2) + b * (p / 10 + 8), `Ручки: ${a} × ${p / 10 + 2} = ${a * (p / 10 + 2)} ₽; тетради: ${b} × ${p / 10 + 8} = ${b * (p / 10 + 8)} ₽; всего ${a * (p / 10 + 2) + b * (p / 10 + 8)} ₽.`, { time: 40 });
      if (k === 1) { const t = R.ri(2, 4), s = R.ri(3, 9) * 10; return N(`Автобус едет ${t} часа со скоростью ${s} км/ч. Сколько километров он проедет?`, t * s, `Путь = скорость × время: ${s} × ${t} = ${t * s} км.`, { time: 34 }); }
      const s = R.ri(3, 5), seats = R.ri(8, 12), all = s * seats + R.ri(2, 7); return N(`На экскурсию едут ${all} ${pl(all, 'школьник', 'школьника', 'школьников')}. В ${s} автобусах по ${seats} мест, остальные идут пешком. Сколько школьников идут пешком?`, all - s * seats, `Уехали ${s} × ${seats} = ${s * seats}, пешком ${all} − ${s * seats} = ${all - s * seats}.`, { time: 40 });
    }, 2),
  ],
});

// ============================================================================
//  ГЛАВА 1. 5–6 классы: уравнения, дроби, проценты
// ============================================================================
def('eq0', {
  name: 'Простые уравнения', ch: 1, icon: '❓',
  learn: 'Уравнение — это равенство с неизвестным. Чтобы найти неизвестное, делай обратное действие: x + 5 = 12 → x = 12 − 5. Если x умножен на число — дели на него.',
  formulas: ['f_eq0'],
  gens: [
    g(1, d => {
      const hi = d === 1 ? 30 : 400, x = R.ri(2, hi), a = R.ri(2, hi), t = R.ri(0, 3);
      if (t === 0) return N(`x + ${a} = ${x + a}.  x = ?`, x, `x = ${x + a} − ${a} = ${x}.`, { time: 14 });
      if (t === 1) return N(`x − ${a} = ${x}.  x = ?`, x + a, `x = ${x} + ${a} = ${x + a}.`, { time: 14 });
      if (t === 2) return N(`${x + a} − x = ${a}.  x = ?`, x, `x = ${x + a} − ${a} = ${x}.`, { time: 16 });
      const m = R.ri(2, 9), y = R.ri(2, 12); return N(`${m} × x = ${m * y}.  x = ?`, y, `x = ${m * y} ÷ ${m} = ${y}.`, { time: 14 });
    }, 3, 2),
    g(2, d => {
      const m = R.ri(2, 9), y = R.ri(2, 15), a = R.ri(2, 20);
      const t = R.ri(0, 2);
      if (t === 0) return N(`x ÷ ${m} = ${y}.  x = ?`, m * y, `x = ${y} × ${m} = ${m * y}.`, { time: 16 });
      if (t === 1) return N(`${m * y} ÷ x = ${m}.  x = ?`, y, `x = ${m * y} ÷ ${m} = ${y}.`, { time: 18 });
      return N(`(x + ${a}) × ${m} = ${(y + a) * m}.  x = ?`, y, `x + ${a} = ${(y + a) * m} ÷ ${m} = ${y + a}, значит x = ${y}.`, { time: 26 });
    }, 2),
  ],
});

def('fracsimp', {
  name: 'Сокращение дробей', ch: 1, icon: '✂️',
  learn: 'Дробь можно сократить, разделив числитель и знаменатель на одно и то же число (их общий делитель). Дробь 12/18 = 2/3 (делим на 6). Сокращённая дробь — когда общих делителей больше нет.',
  formulas: ['f_fracred'],
  gens: [
    g(1, d => {
      const g0 = R.ri(2, d === 1 ? 5 : 9);
      let p, q; do { q = R.ri(2, 12); p = R.ri(1, q - 1); } while (gcd(p, q) !== 1);
      const n = p * g0, dd = q * g0;
      return F(`Сократи дробь ${fr(n, dd)}`, p, q, `Делим числитель и знаменатель на ${g0}: ${n}/${dd} = ${p}/${q}.`, { reduced: true, time: 24 });
    }, 3),
    g(2, d => {
      const a = R.ri(2, 9), b = R.ri(2, 9);
      let p, q; do { q = R.ri(3, 10); p = R.ri(q + 1, q * 2); } while (gcd(p, q) !== 1);
      const g0 = R.ri(2, 6);
      return F(`Сократи неправильную дробь ${fr(p * g0, q * g0)}`, p, q, `НОД = ${g0}. Делим: ${p * g0}/${q * g0} = ${p}/${q}.`, { reduced: true, time: 28 });
    }, 1),
  ],
});

def('fracops', {
  name: 'Действия с дробями', ch: 1, icon: '🍕',
  learn: 'Сложение: приведи к общему знаменателю. Умножение: числитель на числитель, знаменатель на знаменатель. Деление: умножь на перевёрнутую дробь. Не забывай сокращать!',
  formulas: ['f_fracadd', 'f_fracmul', 'f_fracdiv'],
  gens: [
    g(1, d => {
      const c = R.ri(3, 12), a = R.ri(1, c - 2), b = R.ri(1, c - a - 1 > 0 ? c - a - 1 : 1);
      if (R.chance(.6)) return F(`${fr(a, c)} + ${fr(b, c)} = ?`, a + b, c, `Знаменатель общий: (${a} + ${b})/${c} = ${a + b}/${c}.`, { time: 24 });
      const A = a + b; return F(`${fr(A, c)} − ${fr(b, c)} = ?`, a, c, `Знаменатель общий: (${A} − ${b})/${c} = ${a}/${c}.`, { time: 24 });
    }, 2, 1),
    g(2, d => {
      const m = R.pick([[2, 3], [2, 4], [3, 6], [2, 5], [4, 8], [3, 4], [5, 10], [2, 6]]);
      const q1 = m[0], q2 = m[1], a = R.ri(1, q1 - 1), b = R.ri(1, q2 - 1);
      const L = lcm(q1, q2), n1 = a * (L / q1), n2 = b * (L / q2);
      if (R.chance(.6)) return F(`${fr(a, q1)} + ${fr(b, q2)} = ?`, n1 + n2, L, `Общий знаменатель ${L}: ${n1}/${L} + ${n2}/${L} = ${n1 + n2}/${L}.`, { time: 40 });
      const mx = Math.max(n1, n2), mn = Math.min(n1, n2);
      return F(`${n1 >= n2 ? fr(a, q1) + ' − ' + fr(b, q2) : fr(b, q2) + ' − ' + fr(a, q1)} = ?`, mx - mn, L, `Общий знаменатель ${L}: ${mx}/${L} − ${mn}/${L} = ${mx - mn}/${L}.`, { time: 40 });
    }, 3),
    g(2, d => {
      const a = R.ri(1, 5), b = R.ri(a + 1, 8), c = R.ri(1, 5), e = R.ri(c + 1, 8);
      if (d === 2 || R.chance(.5)) return F(`${fr(a, b)} × ${fr(c, e)} = ?`, a * c, b * e, `Умножаем числители и знаменатели: ${a * c}/${b * e}.`, { time: 34 });
      return F(`${fr(a, b)} ÷ ${fr(c, e)} = ?`, a * e, b * c, `Делить — значит умножить на перевёрнутую: ${a}/${b} × ${e}/${c} = ${a * e}/${b * c}.`, { time: 40 });
    }, 2),
    g(3, d => {
      const w1 = R.ri(1, 3), w2 = R.ri(1, 3), q1 = R.pick([2, 3, 4]), q2 = R.pick([2, 3, 4]), a = R.ri(1, q1 - 1), b = R.ri(1, q2 - 1);
      const n1 = w1 * q1 + a, n2 = w2 * q2 + b, L = lcm(q1, q2);
      return F(`${w1} ${fr(a, q1)} + ${w2} ${fr(b, q2)} = ?  (ответ — неправильной дробью)`, n1 * (L / q1) + n2 * (L / q2), L,
        `Переведём в неправильные: ${n1}/${q1} + ${n2}/${q2} = ${n1 * (L / q1)}/${L} + ${n2 * (L / q2)}/${L} = ${n1 * (L / q1) + n2 * (L / q2)}/${L}.`, { time: 55 });
    }, 1),
  ],
});

def('decimals', {
  name: 'Десятичные дроби', ch: 1, icon: '🔟',
  learn: 'Складывая десятичные дроби, записывай запятую под запятой. При умножении считай как целые числа, а потом отсчитай столько знаков после запятой, сколько их было у обоих множителей вместе. Деление на 0,5 — это умножение на 2.',
  formulas: ['f_dec'],
  gens: [
    g(1, d => {
      const a = R.ri(11, 99) / 10, b = R.ri(11, 99) / 10;
      if (R.chance(.5)) return N(`${fm(a)} + ${fm(b)} = ?`, a + b, `Запятая под запятой: ${fm(a)} + ${fm(b)} = ${fm(a + b)}.`, { time: 24, tol: 1e-6 });
      const x = Math.max(a, b), y = Math.min(a, b); return N(`${fm(x)} − ${fm(y)} = ?`, x - y, `${fm(x)} − ${fm(y)} = ${fm(x - y)}.`, { time: 24, tol: 1e-6 });
    }, 2, 1),
    g(2, d => {
      const a = R.ri(2, 29) / 10, b = R.ri(2, 29) / 10;
      if (R.chance(.5)) { const m = R.ri(2, 9); return N(`${fm(a)} × ${m} = ?`, a * m, `${fm(a)} × ${m} = ${fm(a * m)}.`, { time: 24, tol: 1e-6 }); }
      return N(`${fm(a)} × ${fm(b)} = ?`, a * b, `${Math.round(a * 10)} × ${Math.round(b * 10)} = ${Math.round(a * 10) * Math.round(b * 10)}, два знака после запятой: ${fm(a * b)}.`, { time: 34, tol: 1e-6 });
    }, 2),
    g(3, d => {
      if (R.chance(.5)) { const a = R.ri(11, 99) / 10; return N(`${fm(a)} ÷ 0,5 = ?`, a * 2, `Делить на 0,5 — значит умножить на 2: ${fm(a)} × 2 = ${fm(a * 2)}.`, { time: 24, tol: 1e-6 }); }
      const q = R.ri(5, 99) / 10, m = R.pick([2, 4, 5, 8]); return N(`${fm(q * m)} ÷ ${m} = ?`, q, `${fm(q * m)} ÷ ${m} = ${fm(q)}.`, { time: 30, tol: 1e-6 });
    }, 2),
  ],
});

def('compare', {
  name: 'Сравнение чисел', ch: 1, icon: '⚖️',
  learn: 'Десятичные дроби сравнивай по разрядам слева направо (0,45 < 0,5, потому что 0,45 < 0,50). Обыкновенные дроби приводи к общему знаменателю или переводи в десятичные. Корни: √10 больше 3, потому что 3² = 9 < 10.',
  formulas: ['f_dec', 'f_fracadd'],
  gens: [
    g(1, d => {
      const biggest = R.chance(.5);
      const s = new Set(); while (s.size < 4) { s.add(R.ri(30, 99) / 100 + (R.chance(.3) ? .001 : 0)); }
      const arr = [...s].map(x => Math.round(x * 1000) / 1000), best = biggest ? Math.max(...arr) : Math.min(...arr);
      return C(`Какое число ${biggest ? 'наибольшее' : 'наименьшее'}?`, fm(best), arr.filter(x => x !== best).map(fm), `Сравниваем по разрядам: ${arr.sort((a, b) => a - b).map(fm).join(' < ')}.`, { time: 20 });
    }, 2, 2),
    g(2, d => {
      const set = new Map();
      while (set.size < 4) { const q = R.ri(2, 9), p = R.ri(1, q - 1), v = p / q; let dup = false; set.forEach((_, k) => { if (Math.abs(k - v) < 1e-9) dup = true; }); if (!dup) set.set(v, [p, q]); }
      const vals = [...set.keys()], biggest = R.chance(.5), best = biggest ? Math.max(...vals) : Math.min(...vals);
      const lab = v => fr(set.get(v)[0], set.get(v)[1]);
      return C(`Какая дробь ${biggest ? 'наибольшая' : 'наименьшая'}?`, lab(best), vals.filter(v => v !== best).map(lab), `Переведём в десятичные: ${vals.sort((a, b) => a - b).map(v => lab(v) + '≈' + fm(Math.round(v * 100) / 100)).join(' &lt; ')}.`, { time: 34 });
    }, 2),
    g(3, d => {
      const n = R.ri(11, 90); const s = Math.floor(Math.sqrt(n));
      if (s * s === n) return null;
      return C(`Между какими целыми числами лежит √${n}?`, `${s} и ${s + 1}`, [`${s - 1} и ${s}`, `${s + 1} и ${s + 2}`, `${s + 2} и ${s + 3}`],
        `${s}² = ${s * s} < ${n} < ${(s + 1) * (s + 1)} = ${s + 1}², значит √${n} между ${s} и ${s + 1}.`, { time: 24 });
    }, 2),
  ],
});

def('percent', {
  name: 'Проценты', ch: 1, icon: '％',
  learn: 'Процент — это одна сотая: 1% = 0,01. Чтобы найти p% от числа N, умножь N на p/100: 25% от 80 = 80 × 0,25 = 20. Рост на 20% — это умножение на 1,2; скидка 20% — умножение на 0,8.',
  formulas: ['f_percent', 'f_percent2', 'f_pchange'],
  gens: [
    g(1, d => {
      const p = R.pick([10, 20, 25, 50, 75, 5]), n = R.ri(1, 20) * 20;
      return N(`Найди ${p}% от ${n}.`, p * n / 100, `${p}% = ${p}/100. ${n} × ${p} ÷ 100 = ${p * n / 100}.`, { time: 24 });
    }, 3, 2),
    g(2, d => {
      const p = R.pick([5, 10, 20, 25, 30, 40, 50, 60, 75, 80]), b = R.ri(1, 10) * 20, a = p * b / 100;
      return N(`Сколько процентов составляет ${a} от ${b}?`, p, `${a}/${b} × 100% = ${p}%.`, { time: 30, unit: '%' });
    }, 2),
    g(2, d => {
      const p = R.pick([5, 10, 15, 20, 25, 30, 50]), n = R.ri(2, 20) * 20, up = R.chance(.5);
      const v = up ? n * (100 + p) / 100 : n * (100 - p) / 100;
      return N(`${up ? 'Цена' : 'Цена после скидки: цена'} ${n} ₽ ${up ? 'выросла на' : 'была снижена на'} ${p}%. Какой стала цена?`, v, `${n} × ${up ? (100 + p) / 100 : (100 - p) / 100} = ${fm(v)} ₽.`, { time: 34, unit: '₽' });
    }, 2),
    g(3, d => {
      const p = R.pick([10, 20, 25, 30, 40, 50]), o = R.ri(2, 20) * 20, after = o * (100 - p) / 100;
      return N(`После скидки ${p}% товар стал стоить ${fm(after)} ₽. Сколько он стоил до скидки?`, o, `После скидки осталось ${100 - p}% от цены. ${fm(after)} ÷ ${(100 - p) / 100} = ${o} ₽.`, { time: 45, unit: '₽' });
    }, 2),
    g(3, d => {
      const p = R.pick([10, 20, 25, 30, 50]), o = R.ri(1, 15) * 100, v = o * (100 + p) * (100 - p) / 10000;
      return N(`Цена ${o} ₽ выросла на ${p}%, а потом снизилась на ${p}%. Какой стала цена?`, v, `Сначала ×${(100 + p) / 100}, потом ×${(100 - p) / 100}: ${o} × ${(100 + p) / 100} × ${(100 - p) / 100} = ${fm(v)} ₽. Это меньше исходной!`, { time: 50, unit: '₽' });
    }, 1),
  ],
});

def('negative', {
  name: 'Отрицательные числа', ch: 1, icon: '➖',
  learn: 'Минус на минус даёт плюс: (−3) × (−4) = 12. Плюс на минус — минус. Вычитать отрицательное — всё равно что прибавлять: 5 − (−2) = 7. На числовой прямой отрицательные числа лежат левее нуля.',
  formulas: ['f_signs'],
  gens: [
    g(1, d => {
      const a = R.nz(-15, 15), b = R.nz(-15, 15), t = R.ri(0, 1);
      if (t === 0) return N(`${par(a)} + ${par(b)} = ?`, a + b, `Складываем числа со знаками: ${a} + ${par(b)} = ${a + b}.`, { time: 18 });
      return N(`${par(a)} − ${par(b)} = ?`, a - b, `Вычитание = прибавление противоположного: ${a} + ${-b} = ${a - b}.`, { time: 20 });
    }, 2, 1),
    g(2, d => {
      const a = R.nz(-9, 9), b = R.nz(-9, 9);
      if (R.chance(.5)) return N(`${par(a)} × ${par(b)} = ?`, a * b, `Одинаковые знаки → плюс, разные → минус. Ответ ${a * b}.`, { time: 18 });
      return N(`${par(a * b)} ÷ ${par(b)} = ?`, a, `${a * b} ÷ ${par(b)} = ${a}. Знаки: одинаковые → плюс, разные → минус.`, { time: 20 });
    }, 2),
    g(3, d => {
      const a = R.nz(-9, 9), b = R.nz(-9, 9), c = R.nz(-9, 9), e = R.nz(-6, 6);
      if (R.chance(.5)) return N(`${par(a)} × ${par(b)} + ${par(c)} = ?`, a * b + c, `Сначала умножение: ${a * b}; потом + (${c}) = ${a * b + c}.`, { time: 30 });
      return N(`${par(a)} × (${b} + ${par(c)}) − ${par(e)} = ?`, a * (b + c) - e, `Скобки: ${b + c}; умножаем: ${a * (b + c)}; вычитаем (${e}): ${a * (b + c) - e}.`, { time: 40 });
    }, 2),
  ],
});

def('powers', {
  name: 'Степени', ch: 1, icon: '⬆️',
  learn: 'aⁿ — это a, умноженное само на себя n раз: 2⁴ = 2·2·2·2 = 16. Любое число в степени 0 равно 1. Степени с одним основанием: aᵐ · aⁿ = aᵐ⁺ⁿ, aᵐ : aⁿ = aᵐ⁻ⁿ, (aᵐ)ⁿ = aᵐⁿ. Отрицательная степень: a⁻ⁿ = 1/aⁿ.',
  formulas: ['f_pow', 'f_powrules'],
  gens: [
    g(1, d => {
      if (R.chance(.7)) { const a = R.ri(2, 15); return N(`${a}² = ?`, a * a, `${a} × ${a} = ${a * a}.`, { time: 8 }); }
      const a = R.ri(2, 6); return N(`${a}³ = ?`, a * a * a, `${a} × ${a} × ${a} = ${a * a * a}.`, { time: 14 });
    }, 3, 1),
    g(2, d => {
      const t = R.ri(0, 3);
      if (t === 0) { const n = R.ri(2, 10); return N(`2<sup>${n}</sup> = ?`, Math.pow(2, n), `Удваиваем ${n} раз: ${Math.pow(2, n)}.`, { time: 14 }); }
      if (t === 1) { const n = R.ri(2, 6); return N(`10<sup>${n}</sup> = ?`, Math.pow(10, n), `1 и ${n} нулей.`, { time: 12 }); }
      if (t === 2) { const a = R.ri(2, 99); return N(`${a}<sup>0</sup> = ?`, 1, `Любое число (кроме 0) в степени 0 равно 1.`, { time: 10 }); }
      const a = R.ri(2, 4), n = R.ri(3, 4); return N(`${a}<sup>${n}</sup> = ?`, Math.pow(a, n), `${Array(n).fill(a).join(' × ')} = ${Math.pow(a, n)}.`, { time: 20 });
    }, 2),
    g(3, d => {
      const a = R.ri(2, 4), m = R.ri(2, 4), n = R.ri(1, 3), t = R.ri(0, 3);
      if (t === 0) return N(`${pw(a, m)} · ${pw(a, n)} = ?`, Math.pow(a, m + n), `При умножении степени складываем: ${a}<sup>${m + n}</sup> = ${Math.pow(a, m + n)}.`, { time: 30 });
      if (t === 1) return N(`${pw(a, m + n + 1)} : ${pw(a, m)} = ?`, Math.pow(a, n + 1), `При делении вычитаем: ${a}<sup>${n + 1}</sup> = ${Math.pow(a, n + 1)}.`, { time: 30 });
      if (t === 2) return N(`(${pw(a, 2)})<sup>${n + 1}</sup> = ?`, Math.pow(a, 2 * (n + 1)), `При возведении в степень перемножаем: ${a}<sup>${2 * (n + 1)}</sup> = ${Math.pow(a, 2 * (n + 1))}.`, { time: 30 });
      const k = R.ri(1, 4), b = R.pick([2, 3, 5]); return F(`${pw(b, -k)} = ?`, 1, Math.pow(b, k), `a<sup>−n</sup> = 1/a<sup>n</sup>: 1/${Math.pow(b, k)}.`, { time: 30 });
    }, 3),
  ],
});

def('gcdlcm', {
  name: 'НОД и НОК', ch: 1, icon: '🔗',
  learn: 'НОД — наибольшее число, на которое делятся оба числа: НОД(12, 18) = 6. НОК — наименьшее число, которое делится на оба: НОК(4, 6) = 12. Всегда верно: НОД · НОК = a · b.',
  formulas: ['f_gcd'],
  gens: [
    g(1, d => {
      const g0 = R.ri(2, 9); let p, q; do { p = R.ri(2, 8); q = R.ri(2, 8); } while (gcd(p, q) !== 1 || p === q);
      return N(`Найди НОД чисел ${g0 * p} и ${g0 * q}.`, g0, `${g0 * p} = ${g0}·${p}, ${g0 * q} = ${g0}·${q}; общий наибольший делитель — ${g0}.`, { time: 26 });
    }, 2),
    g(2, d => {
      const a = R.ri(2, 12), b = R.ri(2, 12); if (a === b) return null;
      return N(`Найди НОК чисел ${a} и ${b}.`, lcm(a, b), `НОК = ${a} · ${b} ÷ НОД(${a}, ${b}) = ${a * b} ÷ ${gcd(a, b)} = ${lcm(a, b)}.`, { time: 30 });
    }, 3),
    g(3, d => {
      const a = R.ri(12, 60), b = R.ri(12, 60); if (a === b) return null;
      if (R.chance(.5)) return N(`Найди НОД чисел ${a} и ${b}.`, gcd(a, b), `Алгоритм Евклида: НОД(${a}, ${b}) = ${gcd(a, b)}.`, { time: 40 });
      return N(`Два автобуса отходят от остановки каждые ${a % 12 + 4} и ${b % 12 + 6} минут. Через сколько минут они отправятся одновременно в следующий раз?`, lcm(a % 12 + 4, b % 12 + 6), `Нужно НОК(${a % 12 + 4}, ${b % 12 + 6}) = ${lcm(a % 12 + 4, b % 12 + 6)}.`, { time: 45 });
    }, 2),
  ],
});

def('proportion', {
  name: 'Пропорции', ch: 1, icon: '⚗️',
  learn: 'Пропорция a : b = c : d — равенство отношений. Главное свойство: a · d = b · c. «Крест-накрест»: произведения крайних и средних членов равны. Так решаются задачи на рецепты, карты и цены.',
  formulas: ['f_prop'],
  gens: [
    g(1, d => {
      const k = R.ri(2, 9), p = R.ri(5, 30), m = R.ri(2, 9);
      return N(`${k} ${pl(k, 'тетрадь стоит', 'тетради стоят', 'тетрадей стоят')} ${k * p} ₽. Сколько стоит набор из ${k + m} таких тетрадей?`, (k + m) * p, `Одна тетрадь: ${k * p} ÷ ${k} = ${p} ₽; ${k + m} шт.: ${(k + m) * p} ₽.`, { time: 30, unit: '₽' });
    }, 2, 2),
    g(2, d => {
      const a = R.ri(2, 9), c = R.ri(2, 9), k = R.ri(2, 9), b = c * k, x = a * k;
      return N(`Найди x: x : ${a} = ${b} : ${c}`, x, `x · ${c} = ${a} · ${b}, x = ${a * b} ÷ ${c} = ${x}.`, { time: 34 });
    }, 3),
    g(3, d => {
      const p = R.pick([4, 6, 8]), mult = R.ri(2, 6), flour = p * R.ri(20, 50);
      return N(`Для ${p} порций блинов нужно ${flour} г муки. Сколько муки нужно на ${p * mult} порций?`, flour * mult, `Порций в ${mult} раз больше, значит и муки: ${flour} × ${mult} = ${flour * mult} г.`, { time: 40, unit: 'г' });
    }, 2),
  ],
});

def('average', {
  name: 'Среднее арифметическое', ch: 1, icon: '📊',
  learn: 'Среднее арифметическое = (сумма всех чисел) ÷ (их количество). Так считают среднюю оценку или среднюю скорость движения (если время одинаковое). Если известно среднее, то сумма = среднее × количество.',
  formulas: ['f_avg'],
  gens: [
    g(1, d => {
      const n = R.ri(3, 5), m = R.ri(4, 15) * 1, nums = []; let s = 0;
      for (let i = 0; i < n - 1; i++) { const v = R.ri(m - 3, m + 3); nums.push(v); s += v; }
      const last = n * m - s; if (last < 1) return null; nums.push(last);
      return N(`Найди среднее арифметическое чисел: ${R.sh(nums).join(', ')}.`, m, `Сумма = ${n * m}, количество = ${n}; ${n * m} ÷ ${n} = ${m}.`, { time: 30 });
    }, 3),
    g(2, d => {
      const grades = [R.ri(3, 5), R.ri(3, 5), R.ri(3, 5), R.ri(3, 5)], s = grades.reduce((a, b) => a + b, 0);
      if (s < 15 || s > 18) return null;
      return N(`У ${NAMES_G[R.pick(NAMES)] || 'Маши'} четыре оценки: ${grades.join(', ')}. Какой должна быть пятая оценка, чтобы средняя за 5 оценок вышла ровно 4?`, 20 - s, `Для среднего 4 по 5 оценкам нужна сумма 20. Сейчас ${s}, значит пятая — ${20 - s}.`, { time: 40 });
    }, 1),
    g(3, d => {
      const n = R.ri(4, 6), m = R.ri(10, 30), known = []; let s = 0;
      for (let i = 0; i < n - 1; i++) { const v = R.ri(m - 5, m + 5); known.push(v); s += v; }
      const last = n * m - s; if (last < 1) return null;
      return N(`Среднее ${n} чисел равно ${m}. Четыре из них — ${known.slice(0, n - 1).join(', ')}. Найди последнее число.`, last, `Сумма всех = ${n} × ${m} = ${n * m}. Известные дают ${s}. Остаётся ${last}.`, { time: 45 });
    }, 2),
  ],
});
