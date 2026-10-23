const fs=require('fs');let s=fs.readFileSync('content.js','utf8');
function rep(a,b){ if(!s.includes(a)){console.log('NOT FOUND',a.slice(0,60));return;} s=s.replace(a,()=>b); }
rep("function mfix(s) { return String(s).replace(/(^|[\s(=,;:>·×÷+*\/])-(?=[\d√])/g, '$1−'); }",
"function mfix(s) {\n  return String(s).replace(/(^|[\s(=,;:>·×÷+*\/])-(?=[\d√])/g, '$1−').replace(/(<[^>]*>)|(\d)\.(\d)/g, (m, tag, a, b) => tag ? tag : a + ',' + b);\n}");
rep("function F(q, n, d, sol, o) {\n  const g = gcd(n, d) || 1; if (d < 0) { n = -n; d = -d; }","function F(q, n, d, sol, o) {\n  const g = gcd(n, d) || 1; if (d < 0) { n = -n; d = -d; }\n  if (g > 1 && !(o && o.reduced) && !/сокра/i.test(sol || '')) sol = (sol || '') + ' Сокращаем: ' + (d / g === 1 ? n / g : (n / g) + '/' + (d / g)) + '.';");
rep("На экскурсию едут ${all} школьников. В автобусах ${s} × ${seats} мест, остальные идут пешком. Сколько школьников идут пешком?","На экскурсию едут ${all} ${pl(all, 'школьник', 'школьника', 'школьников')}. В ${s} автобусах по ${seats} мест, остальные идут пешком. Сколько школьников идут пешком?");
fs.writeFileSync('content.js',s);
