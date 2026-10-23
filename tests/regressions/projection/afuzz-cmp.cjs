// afuzz-cmp.cjs <before> <after>: compare projections; for changed ones, TypeScript-parse both
const ts = require(process.env.TYPESCRIPT ?? require.resolve('typescript', { paths: [process.cwd()] }));
const fs = require('fs');
const split = (t) => { const m = new Map(); for (const part of t.split(/^=== /m).slice(1)) { const nl = part.indexOf('\n'); m.set(part.slice(0, nl).split('/').pop(), part.slice(nl + 1).split(/^running 1 test|^test result|^\.$/m)[0]); } return m; };
const A = split(fs.readFileSync(process.argv[2], 'utf8')), B = split(fs.readFileSync(process.argv[3], 'utf8'));
const info = (code) => {
  const sf = ts.createSourceFile('x.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const render = sf.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === '$$render');
  let alias = null;
  (function visit(n) { if (ts.isTypeAliasDeclaration(n) && n.name.text === '$$ComponentProps') alias = n; ts.forEachChild(n, visit); })(sf);
  const inAlias = (pos) => alias && pos >= alias.getStart(sf) && pos <= alias.end + 1;
  const errs = sf.parseDiagnostics;
  return { render: !!render, renderEndsAtEnd: render ? sf.getLineAndCharacterOfPosition(render.end).line : -1, errs, outside: errs.filter(d => !inAlias(d.start)).length };
};
let changed = 0, renderLost = 0, moreOutside = 0, fewerOutside = 0, errored = 0; const ex = [];
for (const [k, a] of A) {
  const b = B.get(k); if (b === undefined) { console.log('missing', k); continue; }
  if (/^(PANIC|ERROR)/.test(b)) errored++;
  if (a === b) continue;
  changed++;
  const ia = info(a), ib = info(b);
  if (ia.render && !ib.render) { renderLost++; ex.push(['render lost', k]); }
  if (ib.renderEndsAtEnd !== ia.renderEndsAtEnd) ex.push(['render extent', k, ia.renderEndsAtEnd, ib.renderEndsAtEnd]);
  if (ib.outside > ia.outside) { moreOutside++; ex.push(['more errors outside the alias', k, ia.outside, ib.outside]); }
  if (ib.outside < ia.outside) fewerOutside++;
}
console.log({ cases: A.size, changed, renderLost, moreOutside, fewerOutside, errored });
for (const e of ex.slice(0, 30)) console.log(...e);
