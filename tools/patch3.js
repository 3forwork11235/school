const fs=require('fs');let s=fs.readFileSync('content3.js','utf8');
function rep(a,b){ if(!s.includes(a)){console.log('NOT FOUND:',a.slice(0,70));return;} s=s.replace(a,()=>b); }
// 1 parabola
rep("return N(`На рисунке изображён график функции y = ${quad(a1, 'x', 0).replace(/.*/, '')}ax² + bx + c. Найди абсциссу вершины.`","return N(`На рисунке изображена парабола. Найди абсциссу её вершины.`");
// 2 logs
rep("return N(`Вычисли log<sub>${a ** n}</sub> ${a ** (2 * n)}... нет: log<sub>${a ** n}</sub> ${a ** (2 * n)}`.replace('... нет: ', ' = '), 2,","return N(`Вычисли log<sub>${a ** n}</sub> ${a ** (2 * n)}.`, 2,");
// 3 degrees
rep("return N(`Вычисли ${a}<sup>${p}/2</sup>·${a}<sup>${2 * q - p}/2</sup>... `.replace('... ', ''), a ** q,","return N(`Вычисли ${a}<sup>${p}/2</sup>·${a}<sup>${2 * q - p}/2</sup>.`, a ** q,");
// 5 trigval
rep(", ['cos 150°', null]].slice(0, 8), a = R.pick(T);","], a = R.pick(T);");
// 7 eq2 d2 expression
rep("const ex = `|x ${a < 0 ? '+ ' + (-a) : a > 0 ? '− ' + a : ''}|`.replace('| ', '|').replace('x |', 'x|');","const ex = a < 0 ? `|x + ${-a}|` : a > 0 ? `|x − ${a}|` : '|x|';");
rep("x ${a < 0 ? '+ ' + (-a) : '− ' + a} = ±${b}; x = ${a + b} или x = ${a - b}. Больший ${a + b}.","x − ${par(a)} = ±${b}; x = ${a + b} или x = ${a - b}. Больший ${a + b}.");
// eq2 d3
s=s.replace(/    g\(3, d => \{\n      const c = R\.ri\(2, 8\);\n[\s\S]*?\}, 3\),\n  \],\n\}\);\n\ndef\('trigeq'/, `    g(3, d => {
      const a = R.ri(2, 6), b = R.ri(a + 1, 9), cc = R.ri(1, 6); if ((a * cc) % (b - a)) return null;
      return N(\`Реши уравнение \${fr(a, 'x')} = \${fr(b, 'x + ' + cc)}.\`, a * cc / (b - a), \`Крест-накрест: \${a}(x + \${cc}) = \${b}x ⇒ \${a * cc} = \${b - a}x ⇒ x = \${a * cc / (b - a)}.\`, { time: 65 });
    }, 3),
  ],
});

def('trigeq'`);
// 6 stats unique mode
rep("const m = arr[0]; arr.push(m, m); return N(`Найди моду набора чисел: ${R.sh(arr).join(', ')}.`, m, `Число ${m} встречается чаще остальных (не меньше трёх раз). Мода — ${m}.`, { time: 28 }); // могут быть иные частые, но m встречается ≥3 раз",
"const m = arr[0]; arr.push(m, m); const cnt = {}; arr.forEach(v => cnt[v] = (cnt[v] || 0) + 1); const mx = Math.max(...Object.values(cnt)); if (Object.values(cnt).filter(v => v === mx).length > 1) return null;\n      return N(`Найди моду набора чисел: ${R.sh(arr).join(', ')}.`, +Object.keys(cnt).find(k => cnt[k] === mx), `Число ${m} встречается чаще остальных (${mx} раза). Мода — ${m}.`, { time: 28 });");
rep("`Точка графика (${k > 0 ? '1; ' + k : '1; ' + k}) даёт k = x·y = ${k}.`","`Точка графика с x = 1 имеет y = ${k}, поэтому k = x·y = ${k}.`");
fs.writeFileSync('content3.js',s);
