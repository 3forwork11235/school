const fs=require('fs');let s=fs.readFileSync('content3.js','utf8');
function rep(a,b){ if(!s.includes(a)){console.log('NOT FOUND:',a.slice(0,80));return;} s=s.replace(a,()=>b); }
s=s.replace(/(\S) \$\{sgn\(/g,'$1${sgn(');
rep("N(`Вычисли log<sub>${a ** n}</sub> ${a ** (n * 2)}... нет: log<sub>${a ** n}</sub> ${a ** (2 * n)}`.replace('... нет: ', ' = '), 2,","N(`Вычисли log<sub>${a ** n}</sub> ${a ** (2 * n)}.`, 2,");
rep("${k}·${fm(a[1])} ${plus ? '+' : '−'} ${par(b[1])} = ${fm(val)}.","${k}·${fm(a[1])} ${plus ? '+' : '−'} ${b[1] < 0 ? '(' + fm(b[1]) + ')' : fm(b[1])} = ${fm(val)}.");
// times helper
rep("function fact(n)","const TIMES = ['', '', 'два раза', 'три раза', 'четыре раза'];\nfunction fact(n)");
s=s.split("Монету бросают ${n} раза(-а).").join("Монету бросают ${TIMES[n]}.");
s=s.split("Монету бросают 3 раза.").join("Монету бросают три раза.");
s=s.replace("Монету бросают 3 раза(-а). Найди вероятность того, что выпадут одни","Монету бросают ${TIMES[n]}. Найди вероятность того, что выпадут одни");
// trigid rewrite
s=s.replace(/def\('trigid', \{[\s\S]*?\n\}\);\n\nconst LOGP/, `const TRIP = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [12, 35, 37], [9, 40, 41]];
def('trigid', {
  name: 'Тригонометрические тождества', ch: 5, icon: '🔺',
  learn: 'Основное тождество: sin²α + cos²α = 1. Отсюда cos α = ±√(1 − sin²α); знак — по четверти. tg α = sin α / cos α. Двойной угол: sin 2α = 2 sin α cos α, cos 2α = cos²α − sin²α. Пифагоровы тройки (3-4-5, 5-12-13, 8-15-17, 7-24-25) дают красивые значения.',
  formulas: ['f_trigid', 'f_double', 'f_quarters'],
  gens: [
    g(1, d => {
      const T = R.pick(TRIP.slice(0, 4)), sw = R.chance(.5), a = sw ? T[1] : T[0], b = sw ? T[0] : T[1], askCos = R.chance(.5);
      return F(\`Известно, что \${askCos ? 'sin' : 'cos'} α = \${fr(a, T[2])}, угол α острый. Найди \${askCos ? 'cos' : 'sin'} α.\`, b, T[2], \`Из sin²α + cos²α = 1: \${askCos ? 'cos' : 'sin'}²α = 1 − (\${a}/\${T[2]})² = \${b * b}/\${T[2] * T[2]}; ответ \${b}/\${T[2]}.\`, { time: 50 });
    }, 2, 1),
    g(2, d => {
      const T = R.pick(TRIP), sw = R.chance(.5), s0 = sw ? T[1] : T[0], c0 = sw ? T[0] : T[1], t = R.ri(0, 2);
      if (t === 0) return F(\`Известно, что sin α = \${fr(s0, T[2])}, cos α = \${fr(c0, T[2])}. Найди tg α.\`, s0, c0, \`tg α = sin α / cos α = \${s0}/\${c0}.\`, { time: 40 });
      if (t === 1) return F(\`Известно, что sin α = \${fr(s0, T[2])}, cos α = \${fr(c0, T[2])}. Найди ctg α (котангенс: cos α / sin α).\`, c0, s0, \`ctg α = cos α / sin α = \${c0}/\${s0}.\`, { time: 40 });
      return F(\`Известно, что tg α = \${fr(s0, c0)}, угол α острый. Найди sin α.\`, s0, T[2], \`В прямоугольном треугольнике катеты \${s0} и \${c0}, гипотенуза \${T[2]}. sin α = \${s0}/\${T[2]}.\`, { time: 55 });
    }, 3),
    g(3, d => {
      const T = R.pick(TRIP), sw = R.chance(.5), s0 = sw ? T[1] : T[0], c0 = sw ? T[0] : T[1], t = R.ri(0, 3);
      if (t === 0) return F(\`Известно, что sin α = \${fr(s0, T[2])}, угол α тупой (II четверть). Найди cos α.\`, -c0, T[2], \`cos²α = \${c0 * c0}/\${T[2] * T[2]}; во II четверти cos < 0: cos α = −\${c0}/\${T[2]}.\`, { time: 55 });
      if (t === 1) return F(\`Известно, что cos α = \${fr(c0, T[2])}, угол α лежит в IV четверти. Найди sin α.\`, -s0, T[2], \`sin²α = \${s0 * s0}/\${T[2] * T[2]}; в IV четверти sin < 0: sin α = −\${s0}/\${T[2]}.\`, { time: 55 });
      if (t === 2) return F(\`Известно, что sin α = \${fr(s0, T[2])}, cos α = \${fr(c0, T[2])}. Найди sin 2α.\`, 2 * s0 * c0, T[2] * T[2], \`sin 2α = 2 sin α cos α = 2·\${s0}·\${c0}/\${T[2] * T[2]}.\`, { time: 60 });
      return F(\`Известно, что sin α = \${fr(s0, T[2])}, cos α = \${fr(c0, T[2])}. Найди cos 2α.\`, c0 * c0 - s0 * s0, T[2] * T[2], \`cos 2α = cos²α − sin²α = (\${c0 * c0} − \${s0 * s0})/\${T[2] * T[2]}.\`, { time: 60 });
    }, 3),
  ],
});

const LOGP`);
rep("const a = R.pick([2, 3, 5]), x = R.ri(2, a === 2 ? 6 : a === 3 ? 4 : 3);\n      return N(`Реши уравнение ${a}<sup>x</sup> = ${a ** x}.`","const a = R.pick([2, 3, 4, 5, 6, 7, 10]), x = R.ri(2, a === 2 ? 7 : a <= 4 ? 4 : 3);\n      return N(`Реши уравнение ${a}<sup>x</sup> = ${a ** x}.`");
rep("[64, 2, 3, 16]]);","[64, 2, 3, 16], [81, 3, 4, 27], [64, 5, 6, 32], [1000, 2, 3, 100], [36, 3, 2, 216], [49, 3, 2, 343], [100, 3, 2, 1000], [243, 3, 5, 27], [16, 5, 4, 32], [25, 3, 2, 125]]);");
rep("['sin x = ' + fr('√2', 2), 45]]","['sin x = ' + fr('√2', 2), 45], ['sin x = 0', 180], ['cos x = −1', 180], ['tg x = √3', 60], ['tg x = ' + fr('√3', 3), 30], ['cos x = ' + fr('√2', 2), 45], ['sin x = −1', 270], ['cos x = −' + fr(1, 2), 120], ['sin x = −' + fr(1, 2), 210]]");
rep("['cos x = 0', 2]], a = R.pick(T);","['cos x = 0', 2], ['sin x = ' + fr('√2', 2), 2], ['cos x = −' + fr(1, 2), 2], ['sin x = 0', 2], ['cos x = 1', 1], ['sin x = −1', 1], ['tg x = −1', 2], ['cos x = ' + fr('√3', 2), 2]], a = R.pick(T);");
fs.writeFileSync('content3.js',s);
