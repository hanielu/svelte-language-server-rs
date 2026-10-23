// tsparse.cjs <probe PROBE_DIR output>: for each projected component, parse the code with TypeScript and report
// whether `$$render` is a top-level function and the syntax errors with their line text
const ts = require(process.env.TYPESCRIPT ?? require.resolve('typescript', { paths: [process.cwd()] }));
const text = require('fs').readFileSync(process.argv[2], 'utf8');
for (const part of text.split(/^=== /m).slice(1)) {
  const nl = part.indexOf('\n'); const name = part.slice(0, nl).split('/').pop(); let code = part.slice(nl + 1);
  code = code.split(/^\.\n|^running 1 test|^test result/m)[0];
  if (!/ComponentProps =/.test(code)) continue;
  const sf = ts.createSourceFile('x.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const render = sf.statements.some(s => ts.isFunctionDeclaration(s) && s.name?.text === '$$render');
  const errs = sf.parseDiagnostics.map(d => { const p = sf.getLineAndCharacterOfPosition(d.start); return `${d.code}@${p.line}:${p.character} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')} [${code.split('\n')[p.line].slice(Math.max(0,p.character-12), p.character+8)}]`; });
  console.log(name, 'render', render, errs.join(' | '));
}
