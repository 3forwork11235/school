const fs=require('fs');
function patch(file, pairs){ let s=fs.readFileSync(file,'utf8'); pairs.forEach(([a,b])=>{ if(!s.includes(a)) console.log(file,'NOT FOUND:',a.slice(0,70)); else s=s.replace(a,()=>b); }); fs.writeFileSync(file,s); }
patch('lesson.js',[
 ["if (cfg.ch === 7) S.finished = true; }","if (cfg.ch === 7) { S.finished = true; S.own.hat[6] = true; extra.push('🎓 Шапочка выпускника ждёт в гардеробе!'); } }"],
 ["    if (score > prev) extra.push(`Новый личный рекорд (было ${prev})`);","    if (score > prev) extra.push(`Новый личный рекорд (было ${prev})`);\n    if (score >= 100 && !S.own.hat[7]) { S.own.hat[7] = true; extra.push('👑 Стобалльная корона добавлена в гардероб!'); }"],
]);
patch('ui.js',[
 ["  <h3>📈 Прогноз ЕГЭ (ориентировочно)</h3>","  <div class=\"grid g4\" style=\"margin-top:10px\">${statChip('📚', S.stats.lessons, 'уроков пройдено')}${statChip('🐉', S.stats.bosses, 'боссов побеждено')}${statChip('🔥', S.stats.maxCombo, 'лучшее комбо')}${statChip('⏳', Math.round(S.stats.playSec / 60) + ' мин', 'в игре')}</div>\n  <h3>📈 Прогноз ЕГЭ (ориентировочно)</h3>"],
]);
