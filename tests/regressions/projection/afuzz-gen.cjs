// afuzz-gen.cjs <project root> <outdir> <max>: half-typed `$props()` annotations from real components
const fs = require('fs'), path = require('path');
const [root, out, max] = [process.argv[2], process.argv[3], Number(process.argv[4] || 4000)];
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === 'node_modules' || e.name.startsWith('.')) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.svelte')) files.push(p); } })(root);
files.sort();
let n = 0; const seen = new Set();
const emit = (text) => { if (n >= max || seen.has(text)) return; seen.add(text); fs.writeFileSync(path.join(out, `m${String(n++).padStart(5, '0')}.svelte`), text); };
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  if (!/lang=["']ts/.test(src)) continue;
  const at = src.indexOf('= $props()'); if (at < 0) continue;
  const letAt = src.lastIndexOf('let {', at); if (letAt < 0) continue;
  let depth = 0, i = letAt + 4, close = -1;
  for (; i < at; i++) { if (src[i] === '{') depth++; else if (src[i] === '}') { depth--; if (depth === 0) { close = i; break; } } }
  if (close < 0) continue;
  const colon = src.indexOf(':', close); if (colon < 0 || colon > at) continue;
  const aStart = colon + 1, aEnd = src.lastIndexOf(' ', at - 1) >= aStart ? at : at; // annotation [aStart, at)
  const ann = src.slice(aStart, at);
  if (!/[{<(\[]/.test(ann)) continue;
  const step = Math.max(1, Math.floor(ann.length / 12));
  for (let k = 1; k < ann.length; k += step) {
    const p = aStart + k;
    emit(src.slice(0, p) + ' '.repeat(0) + src.slice(at));               // cut the rest of the annotation
    emit(src.slice(0, p) + src.slice(p + 1));                              // drop one character
    for (const ins of ["'", '`', '<', '{', '(', '[', ': ', '/*', '//']) emit(src.slice(0, p) + ins + src.slice(p));
  }
}
console.log('generated', n);
