// rncmp.cjs <ours.json> <official.json> [<ship.json>]: per query, whether rename result text, references, definition and highlights match official
const fs = require('fs');
const [a, b, c] = process.argv.slice(2).map((f) => f && JSON.parse(fs.readFileSync(f, 'utf8')));
const J = (x) => JSON.stringify(x);
for (const k of Object.keys(b)) {
  if (k === 'diags') continue;
  const o = a[k], off = b[k], sh = c?.[k];
  if (typeof off === 'string' || !o) { console.log(k, 'missing'); continue; }
  const same = (f) => J(o[f]) === J(off[f]);
  const flags = ['after', 'references', 'definition', 'highlights'].map((f) => `${f}:${same(f) ? 'same' : 'DIFF'}`).join(' ');
  const shipAfter = sh ? (J(sh.after) === J(off.after) ? 'ship-same' : 'ship-diff') : '';
  console.log(k, '|', flags, '|', shipAfter);
  for (const f of ['after', 'references']) if (!same(f)) { console.log('   ours', f, J(o[f])); console.log('   off ', f, J(off[f])); }
}
