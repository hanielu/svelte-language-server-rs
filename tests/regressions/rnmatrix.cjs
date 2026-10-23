// rnmatrix.cjs <dir> <case...>: per query (rnall.sh outputs, tags ship, ls9ba98d4, projfinal, rename and off), which builds' answers (after, references, definition, highlights) equal official's and each other's
const fs = require('fs'); const path = require('path');
const [dir, ...cases] = process.argv.slice(2);
const tags = ['ship', 'ls9ba98d4', 'projfinal', 'rename'];
const F = ['after', 'references', 'definition', 'highlights'];
const J = (x) => JSON.stringify(x);
let tot = { q: 0 }; for (const t of tags) tot[t] = 0;
for (const c of cases) {
  const R = {}; for (const t of [...tags, 'off']) { try { R[t] = JSON.parse(fs.readFileSync(path.join(dir, `${c}.${t}.json`), 'utf8')); } catch (e) { R[t] = null; } }
  for (const k of Object.keys(R.off)) {
    if (k === 'diags') continue;
    tot.q++;
    const row = tags.map((t) => { const o = R[t]?.[k]; if (!o) return `${t}:missing`; const same = F.filter((f) => J(o[f]) === J(R.off[k][f])).length; if (same === 4) tot[t]++; return `${t}:${same === 4 ? 'OFF' : F.filter((f) => J(o[f]) !== J(R.off[k][f])).map((f) => f[0]).join('')}`; });
    const eqLs = J(F.map((f) => R.rename?.[k]?.[f])) === J(F.map((f) => R.ls9ba98d4?.[k]?.[f]));
    const eqPj = J(F.map((f) => R.rename?.[k]?.[f])) === J(F.map((f) => R.projfinal?.[k]?.[f]));
    console.log(`${c} | ${k} | ${row.join(' ')} | rename==ls:${eqLs ? 'y' : 'n'} rename==proj:${eqPj ? 'y' : 'n'}`);
  }
  if (R.rename?.diags && R.off.diags) { const d = J(R.rename.diags) === J(R.off.diags); console.log(`${c} | diags | rename==off:${d}`); }
}
console.log('queries', tot.q, 'all four fields equal to official:', tags.map((t) => `${t} ${tot[t]}`).join(', '));
