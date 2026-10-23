const fs=require('fs');let s=fs.readFileSync('runner.js','utf8');
function rep(a,b){ if(!s.includes(a)){console.log('NOT FOUND',a.slice(0,60));return;} s=s.replace(a,()=>b); }
rep("if (!last || last.y > Math.max(210, RUN.H * .34)) spawnRow(false);","if (!last || last.y > Math.max(260, RUN.H * .5)) spawnRow(false);");
rep("  // ворота\n  const heroY = H * .8;\n  RUN.rows.forEach(r => {","  // ворота\n  const heroY = H * .8, curRow = RUN.rows.find(r => !r.done);\n  RUN.rows.forEach(r => {\n    c.globalAlpha = r === curRow || r.done ? 1 : .5;");
rep("      c.fillStyle = '#1d2a5b'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = Math.min(30, w / 3);","      if (r === curRow) { c.strokeStyle = '#ffd54a'; c.lineWidth = 5; rrect(c, x - 3, y - 3, w + 6, h + 6, 14); c.stroke(); }\n      c.fillStyle = '#1d2a5b'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = Math.min(30, w / 3);");
rep("c.fillText(label, x + w / 2, y + h / 2 + 1);\n    }\n  });","c.fillText(label, x + w / 2, y + h / 2 + 1);\n    }\n    c.globalAlpha = 1;\n  });");
rep("const coins = Math.round(sc / 4 * (1 + petPerk().coin)), xp = Math.round(sc * 1.2);","const coins = Math.min(90, Math.round(sc / 6 * (1 + petPerk().coin))), xp = Math.round(sc * .6);");
rep("function spawnRow(first) { RUN.rows.push(Object.assign(runTask(), { y: first ? 40 : -20, done: false, res: null })); }","function spawnRow(first) { RUN.rows.push(Object.assign(runTask(), { y: first ? 60 : -20, done: false, res: null })); }");
fs.writeFileSync('runner.js',s);
