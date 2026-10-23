const fs=require('fs');
function patch(file, pairs){ let s=fs.readFileSync(file,'utf8'); pairs.forEach(([a,b])=>{ if(!s.includes(a)) console.log(file,'NOT FOUND:',a.slice(0,70)); else s=s.replace(a,()=>b); }); fs.writeFileSync(file,s); }
patch('lesson.js',[
 ["showResults({ title: title, stars: stars, coins: coins, xp: xp, extra: extra, win: win, completed: completed, newCards: newCards });","showResults({ title: title, stars: stars, coins: coins, xp: xp, extra: extra, win: win, completed: completed, newCards: newCards, firstClear: firstClear });"],
 ["  ${r.extra.map(x => `<div style=\"font-size:14px;margin:4px 0\">${x}</div>`).join('')}","  ${r.stars && cfg.kind === 'lesson' ? `<div class=\"muted\" style=\"font-style:italic;margin:6px 0\">«${R.pick(TEACHER_PRAISE[r.stars])}» — ${NPC[CHAPTERS[cfg.ch].teacher].name}</div>` : ''}\n  ${r.extra.map(x => `<div style=\"font-size:14px;margin:4px 0\">${x}</div>`).join('')}"],
 ["function afterLesson(cfg, r) {\n","function afterLesson(cfg, r) {\n  if (cfg.kind === 'lesson' && r.firstClear && BEATS[cfg.ch] && BEATS[cfg.ch][cfg.j]) { say(BEATS[cfg.ch][cfg.j], () => save(true)); return; }\n"],
]);
