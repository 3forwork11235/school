const fs=require('fs');
function patch(file, fn){ let s=fs.readFileSync(file,'utf8'); const log=[]; const rep=(a,b)=>{ if(!s.includes(a)){log.push('NOT FOUND: '+a.slice(0,70));return;} s=s.split(a).join(b); }; fn(rep,(re,b)=>{ if(!re.test(s)){log.push('NOT FOUND RE: '+re);return;} s=s.replace(re,b); }); fs.writeFileSync(file,s); log.forEach(l=>console.log(file,l)); }
// helpers in content.js
patch('content.js',(rep)=>{
 rep("function pw(a, n)","// падеж: pl(5,'час','часа','часов') -> «часов»\nfunction pl(n, a, b, c) { n = Math.abs(n) % 100; const m = n % 10; return n > 10 && n < 20 ? c : m === 1 ? a : m >= 2 && m <= 4 ? b : c; }\n// комплексное число a + bi\nfunction cplx(a, b) { const bi = Math.abs(b) === 1 ? 'i' : Math.abs(b) + 'i'; if (a === 0) return (b < 0 ? '−' : '') + bi; return a + (b < 0 ? ' − ' : ' + ') + bi; }\n// (x − m)\nfunction xm(m) { return m === 0 ? 'x' : m < 0 ? '(x + ' + (-m) + ')' : '(x − ' + m + ')'; }\nfunction pw(a, n)");
 rep("formulas: ['f_comm', 'f_table9', 'f_dist'],","formulas: ['f_comm', 'f_table9', 'f_distrib'],");
});
patch('formulas.js',(rep)=>{ rep("{ id: 'f_dist', ch: 0, name: 'Распределительный закон'","{ id: 'f_distrib', ch: 0, name: 'Распределительный закон'"); });
patch('content4.js',(rep,rer)=>{
 rep("Автобус ехал ${h} часа(-ов) со скоростью","Автобус ехал ${h} ${pl(h, 'час', 'часа', 'часов')} со скоростью");
 rep("на ${days} дня(-ей)?","на ${days} ${pl(days, 'день', 'дня', 'дней')}?");
 rep("Все рёбра куба увеличили в ${k} раз(-а).","Все рёбра куба увеличили в ${k} ${pl(k, 'раз', 'раза', 'раз')}.");
 rep("y′ = 3x² ${sgn(2 * e.A)}x ${sgn(e.B)} = 3(x − ${par(e.m)})(x − ${par(e.n)}); при","y′ = 3x² ${sgn(2 * e.A)}x ${sgn(e.B)} = 3${xm(e.m)}${xm(e.n)}; при");
 rep("y′ = 3(x − ${par(e.m)})(x − ${par(e.n)}); знак","y′ = 3${xm(e.m)}${xm(e.n)}; знак");
 rep("y′ = 3(x − ${par(e.m)})(x − ${par(e.n)}) меняет","y′ = 3${xm(e.m)}${xm(e.n)} меняет");
 rep("F(x) = ${k}x²; F(${b})","F(x) = ${coef(k, 'x²')}; F(${b})");
 rep("a·b = ${qq}k + ${pp}·${rr} = 0","a·b = ${qq}k + ${par(pp)}·${rr} = 0");
 rep("Складываем отдельно: действительные","Складываем отдельно: действительные");
 // bridge
 rer(/const L = R\.ri\(2, 6\) \* 50, tt = R\.ri\(5, 15\), v = L \/ tt; if \(v !== Math\.round\(v\)\) return null; const Pl = R\.ri\(2, 5\) \* 100; return N\([^\n]*\n/, "const v = R.pick([10, 15, 20, 25]), tt = R.ri(5, 12), k = R.ri(5, 12), L = v * tt, Pl = v * k; return N(`Поезд длиной ${L} м проезжает мимо столба за ${tt} секунд. За сколько секунд он проедет мост длиной ${Pl} м?`, tt + k, `Скорость ${L}/${tt} = ${v} м/с. Путь по мосту ${L} + ${Pl} = ${L + Pl} м; время ${(L + Pl) / v} с.`, { time: 90, unit: 'с' });\n");
 // complex display
 rep("(${a} ${sgn(b)}i) + (${c} ${sgn(e)}i)","(${cplx(a, b)}) + (${cplx(c, e)})");
 rep("(${a} ${sgn(b)}i)(${c} ${sgn(e)}i)","(${cplx(a, b)})(${cplx(c, e)})");
 rep("(${a} + ${b}i)(${a} − ${b}i)","(${cplx(a, b)})(${cplx(a, -b)})");
});
patch('content2.js',(rep)=>{ rep("увеличили в ${k} раза(-а)","увеличили в ${k} раза"); rep("в ${k} раза(-а) больше лет","в ${k} ${pl(k, 'раз', 'раза', 'раз')} больше лет"); rep("Сейчас отцу в ${k} раза(-а) больше лет","Сейчас отцу в ${k} ${pl(k, 'раз', 'раза', 'раз')} больше лет"); });
let t=fs.readFileSync('tools/test_gen.js','utf8');
if(!t.includes('DUP FORMULA')) t=t.replace("if (X.FORMULAS) {","if (X.FORMULAS) {\n  const seenId = {}; X.FORMULAS.forEach(f => { if (seenId[f.id]) { bad++; console.log('DUP FORMULA', f.id); } seenId[f.id] = 1; });");
fs.writeFileSync('tools/test_gen.js',t);
