// afuzz-show.cjs <before> <after> <case>: show the alias lines and parse errors of one case in both outputs
const ts = require(process.env.TYPESCRIPT ?? require.resolve('typescript', { paths: [process.cwd()] }));
const fs = require('fs');
const get = (f, k) => { const t = fs.readFileSync(f, 'utf8'); const i = t.indexOf('=== ' + process.argv[4].replace(/^.*\//, '')) ; const j = t.indexOf('\n=== ', i + 5); return t.slice(t.indexOf('\n', i) + 1, j < 0 ? undefined : j); };
for (const f of [process.argv[2], process.argv[3]]) {
  const t = fs.readFileSync(f, 'utf8'); const key = '/' + process.argv[4] + '\n'; const i = t.indexOf(key); const j = t.indexOf('\n=== ', i); const code = t.slice(i + key.length, j < 0 ? undefined : j);
  const sf = ts.createSourceFile('x.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const lines = code.split('\n'); const a = lines.findIndex(l => l.includes('$$ComponentProps =')); 
  console.log('---', f.split('/').pop()); console.log(lines.slice(Math.max(0, a - 1), a + 4).join('\n'));
  for (const d of sf.parseDiagnostics) { const p = sf.getLineAndCharacterOfPosition(d.start); console.log(`  ${d.code}@${p.line}:${p.character} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')} | ${lines[p.line].slice(Math.max(0, p.character - 25), p.character + 15)}`); }
}
