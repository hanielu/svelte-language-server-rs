// tfuzz-gen.cjs <root> <outdir> <max> <seed>: template mutations around the constructs the projection now keeps in place
const fs = require('fs'), path = require('path');
const [root, out, max, seed0] = [process.argv[2], process.argv[3], Number(process.argv[4] || 20000), Number(process.argv[5] || 1)];
let seed = seed0; const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === 'node_modules' || e.name.startsWith('.')) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.svelte')) files.push(p); } })(root);
files.sort();
const anchors = /\{#snippet|\{#each|<\/[A-Z][\w.]*\s*>|class:|style:|bind:this|\(\w[\w.]*\)\}|, \w+ \(/g;
let n = 0; const seen = new Set();
const emit = (t) => { if (n >= max || seen.has(t)) return; seen.add(t); fs.writeFileSync(path.join(out, `t${String(n++).padStart(6, '0')}.svelte`), t); };
const inserts = ['<', '>', '{', '}', '(', ')', ',', ' ', '"', "'", '`', '/', ':', '|', '=', '#', '@'];
for (let round = 0; round < 50 && n < max; round++) for (const f of files) {
  if (n >= max) break;
  const src = fs.readFileSync(f, 'utf8');
  const ms = [...src.matchAll(anchors)]; if (!ms.length) continue;
  const m = ms[rnd(ms.length)]; const at = m.index + rnd(Math.max(1, m[0].length + 12));
  switch (rnd(4)) {
    case 0: emit(src.slice(0, at) + src.slice(at + 1 + rnd(3))); break;
    case 1: emit(src.slice(0, at) + inserts[rnd(inserts.length)] + src.slice(at)); break;
    case 2: emit(src.slice(0, at) + src.slice(src.indexOf('\n', at) < 0 ? src.length : src.indexOf('\n', at))); break;
    case 3: emit(src.slice(0, at)); break;
  }
}
console.log('generated', n);
