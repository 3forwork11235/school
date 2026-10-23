// Проверка генераторов задач: node tools/test_gen.js [topic]
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const files = ['content.js', 'content2.js', 'content3.js', 'content4.js', 'formulas.js'].filter(f => fs.existsSync(path.join(root, f)));
const ctx = vm.createContext({ console, Math });
let code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');
code += '\n;globalThis.__X={TOPICS,TOPIC_ORDER,makeTask,checkAnswer,fm,parseNum,answerText,' + (files.includes('formulas.js') ? 'FORMULAS' : 'FORMULAS:null') + '};';
vm.runInContext(code, ctx, { filename: 'bundle.js' });
const X = ctx.__X;
const only = process.argv[2];
let bad = 0, total = 0;
const per = {};
function fail(id, d, msg, t) { bad++; if (bad < 40) console.log('FAIL', id, 'd' + d, msg, t ? JSON.stringify({ q: t.q, ans: t.ans, n: t.n, dd: t.d, ch: t.choices }).slice(0, 300) : ''); }
for (const id of X.TOPIC_ORDER) {
  if (only && id !== only) continue;
  for (let d = 1; d <= 3; d++) {
    const seen = new Set();
    for (let i = 0; i < 300; i++) {
      total++;
      let t;
      try { t = X.makeTask(id, d); } catch (e) { fail(id, d, 'EXC ' + e.message); break; }
      if (!t || typeof t.q !== 'string' || !t.q) { fail(id, d, 'no q', t); continue; }
      seen.add(t.q + JSON.stringify(t.fig||"") + JSON.stringify(t.choices||""));
      const txt = t.q + ' ' + t.sol + ' ' + JSON.stringify(t.choices || '');
      if (/NaN|undefined|\[object|Infinity|null/.test(txt)) { fail(id, d, 'bad text', t); continue; }
      if (!(t.time > 0 && t.time < 300)) fail(id, d, 'time ' + t.time, t);
      if (t.kind === 'num') {
        if (!Number.isFinite(t.ans)) { fail(id, d, 'ans not finite', t); continue; }
        if (!X.checkAnswer(t, X.fm(t.ans))) fail(id, d, 'self-check failed ' + X.fm(t.ans), t);
        if (X.checkAnswer(t, X.fm(t.ans + 1))) fail(id, d, 'accepts wrong', t);
        if (Math.abs(t.ans) > 1e7) fail(id, d, 'huge', t);
      } else if (t.kind === 'frac') {
        if (!Number.isInteger(t.n) || !Number.isInteger(t.d) || t.d <= 0) { fail(id, d, 'frac ints', t); continue; }
        const s = t.d === 1 ? String(t.n) : t.n + '/' + t.d;
        if (!X.checkAnswer(t, s)) fail(id, d, 'frac self-check ' + s, t);
      } else if (t.kind === 'choice') {
        if (!Array.isArray(t.choices) || t.choices.length < 3 || t.choices.length > 6) fail(id, d, 'choices count ' + (t.choices || []).length, t);
        else {
          if (!(t.ans >= 0 && t.ans < t.choices.length)) fail(id, d, 'ans idx', t);
          const k = new Set(t.choices.map(c => JSON.stringify(c)));
          if (k.size !== t.choices.length) fail(id, d, 'dup choices', t);
        }
      } else fail(id, d, 'kind ' + t.kind, t);
      if (X.TOPICS[id].formulas && X.FORMULAS) { /* checked below */ }
    }
    per[id + ' d' + d] = seen.size;
  }
}
if (X.FORMULAS) {
  const seenId = {}; X.FORMULAS.forEach(f => { if (seenId[f.id]) { bad++; console.log('DUP FORMULA', f.id); } seenId[f.id] = 1; });
  const ids = new Set(X.FORMULAS.map(f => f.id));
  for (const id of X.TOPIC_ORDER) for (const f of (X.TOPICS[id].formulas || [])) if (!ids.has(f)) { bad++; console.log('MISSING FORMULA', f, 'in', id); }
}
const low = Object.entries(per).filter(([k, v]) => v < 12);
if (low.length) console.log('LOW VARIETY (<12 unique):', low.map(([k, v]) => k + '=' + v).join(', '));
console.log('topics:', X.TOPIC_ORDER.length, 'tasks checked:', total, 'failures:', bad);
process.exit(bad ? 1 : 0);
