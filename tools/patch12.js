const fs=require('fs');
function patch(file, pairs){ let s=fs.readFileSync(file,'utf8'); pairs.forEach(([a,b])=>{ if(!s.includes(a)) console.log(file,'NOT FOUND:',a.slice(0,70)); else s=s.split(a).join(b); }); fs.writeFileSync(file,s); }
patch('content.js',[
 ["const NAMES_G = {","const GIRLS = ['Маша', 'Катя', 'Лиза', 'Ксюша', 'Соня', 'Аня'];\nfunction person() { const n = R.pick(NAMES), f = GIRLS.indexOf(n) >= 0; return { n: n, f: f, bought: f ? 'купила' : 'купил', he: f ? 'она' : 'он' }; }\nconst NAMES_G = {"],
 ["const n = R.pick(NAMES), a = R.ri(3, 9), p = R.ri(5, 15) * (d > 1 ? 2 : 1);","const P0 = person(), n = P0.n, a = R.ri(3, 9), p = R.ri(5, 15) * (d > 1 ? 2 : 1);"],
 ["`На перемене ${n} купил ${a} ${pl(a, 'булочку', 'булочки', 'булочек')} по ${p} ₽. Сколько он заплатил?`","`На перемене ${n} ${P0.bought} ${a} ${pl(a, 'булочку', 'булочки', 'булочек')} по ${p} ₽. Сколько ${P0.he} заплатил${P0.f ? 'а' : ''}?`"],
 ["`${n} пробегает по коридору ${t} ${pl(t, 'шаг', 'шага', 'шагов')} за секунду. Сколько шагов он сделает за 6 секунд?`","`${n} пробегает по коридору ${t} ${pl(t, 'шаг', 'шага', 'шагов')} за секунду. Сколько шагов ${P0.he} сделает за 6 секунд?`"],
 ["const n = R.pick(NAMES), p = R.ri(2, 9) * 10, a = R.ri(3, 6), b = R.ri(2, 5);","const P1 = person(), n = P1.n, p = R.ri(2, 9) * 10, a = R.ri(3, 6), b = R.ri(2, 5);"],
 ["`${n} купил ${a} ${pl(a, 'ручку', 'ручки', 'ручек')} по ${p / 10 + 2} ₽ и ${b} ${pl(b, 'тетрадь', 'тетради', 'тетрадей')} по ${p / 10 + 8} ₽. Сколько он заплатил всего?`","`${n} ${P1.bought} ${a} ${pl(a, 'ручку', 'ручки', 'ручек')} по ${p / 10 + 2} ₽ и ${b} ${pl(b, 'тетрадь', 'тетради', 'тетрадей')} по ${p / 10 + 8} ₽. Сколько ${P1.he} заплатил${P1.f ? 'а' : ''} всего?`"],
]);
