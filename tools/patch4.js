const fs=require('fs');let s=fs.readFileSync('content4.js','utf8');
function rep(a,b){ if(!s.includes(a)){console.log('NOT FOUND:',a.slice(0,80));return;} s=s.replace(a,()=>b); }
s=s.replace(/(\S) \$\{sgn\(/g,'$1${sgn(');
rep("const a = R.ri(2, 5); return N(`Найди значение производной функции f(x) = x²·eˣ в точке x₀ = 0.`, 0, `f′ = 2x·eˣ + x²·eˣ; при x = 0 равна 0.`, { time: 60 }) && N(","const a = R.ri(2, 5); return N(");
rep("return N(`Найди площадь фигуры под графиком функции y = x² на отрезке [0; ${3 * b}]... `.replace('... ', ''),","return N(`Найди площадь фигуры под графиком функции y = x² на отрезке [0; ${3 * b}].`,");
// matrices d3
s=s.replace(/    g\(3, d => \{\n      const b = R\.ri\(2, 6\), c = R\.ri\(2, 6\), e = R\.ri\(1, 4\), x = [^\n]*\n      if \(\(b \* c\) % e\) return null;\n      return N\([^\n]*\n    \}, 3\),/, `    g(3, d => {
      const b = R.ri(2, 6), c = R.ri(2, 6), e = R.ri(1, 4);
      if ((b * c) % e) return null;
      return N(\`При каком x определитель матрицы \${mat([['x', b], [c, e]])} равен нулю?\`, b * c / e, \`x·\${e} − \${b}·\${c} = 0 ⇒ x = \${b * c}/\${e} = \${b * c / e}.\`, { time: 70 });
    }, 3),`);
// vectors d2
s=s.replace(/    g\(2, d => \{\n      const q = R\.ri\(1, 5\), r = R\.ri\(1, 5\)[\s\S]*?\}, 3\),\n    g\(3, d => \{\n      const t = R\.ri\(0, 2\);\n      if \(t === 0\) return C\('Найди угол/, `    g(2, d => {
      const qq = R.pick([1, 2, 4]), rr = R.pick([1, 3]), pp = R.nz(-4, 4), xx = -pp * rr / qq;
      if (xx !== Math.round(xx)) return null;
      return N(\`При каком значении k векторы a = (k; \${pp}) и b = (\${qq}; \${rr}) перпендикулярны?\`, xx, \`a·b = \${qq}k + \${pp}·\${rr} = 0 ⇒ k = \${xx}.\`, { time: 70 });
    }, 3),
    g(3, d => {
      const t = R.ri(0, 2);
      if (t === 0) return C('Найди угол`);
// limits d2
rep("return N(`Найди предел при x → ${a}: ${fr('x² − ' + a * a, 'x − ' + a)}`.replace('− -', '+ '), 2 * a,","return N(`Найди предел при x → ${a}: ${fr('x² − ' + a * a, 'x' + sgn(-a))}`, 2 * a,");
rep("const r = R.ri(1, 4), h = R.pick([3, 6, 9]), rr = R.ri(2, 6);","const h = R.pick([3, 6, 9]), rr = R.ri(2, 6);");
rep("const r = R.ri(1, 4) * 3 / 3, h = R.pick([3, 6, 9]), rr = R.ri(2, 6);","const h = R.pick([3, 6, 9]), rr = R.ri(2, 6);");
s=s.split(".replace(/\+ -/g, '− ')").join('');
fs.writeFileSync('content4.js',s);
