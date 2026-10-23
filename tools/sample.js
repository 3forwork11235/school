// node tools/sample.js topic [d] [n]  — показать примеры задач
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'..');
const files=['content.js','content2.js','content3.js','content4.js','formulas.js'].filter(f=>fs.existsSync(path.join(root,f)));
const ctx=vm.createContext({console,Math});
vm.runInContext(files.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n;\n')+'\n;globalThis.__X={TOPICS,makeTask,answerText};',ctx);
const X=ctx.__X;const id=process.argv[2],d=+(process.argv[3]||0),n=+(process.argv[4]||4);
const strip=s=>String(s).replace(/<span class="fr"><i>(.*?)<\/i><b>(.*?)<\/b><\/span>/g,'($1/$2)').replace(/<sup>(.*?)<\/sup>/g,'^$1').replace(/<[^>]+>/g,' ');
for(const dd of d?[d]:[1,2,3])for(let i=0;i<n;i++){const t=X.makeTask(id,dd);console.log(`[d${dd} ${t.kind} ${t.time}s]`,strip(t.q),'=>',strip(X.answerText(t)),t.kind==='choice'?'| '+t.choices.map(strip).join(' ; '):'','\n     sol:',strip(t.sol));}
