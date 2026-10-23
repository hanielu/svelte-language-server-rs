import fs from "node:fs";
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
const key = (d) => { const m = /^(\d+)@(\S+) (".*?") (.*)$/.exec(d); return m ? { code: m[1], range: m[2], text: m[3], msg: m[4] } : { code: "?", range: "", text: "", msg: d }; };
let moved = [], extra = [], missing = [], hov = [];
const bySnippet = {};
for (let i = 0; i < a.length; i++) {
  const x = a[i], y = b[i];
  if (x.typed !== y.typed) throw new Error("misaligned");
  const xs = x.diags.map(key), ys = y.diags.map(key);
  for (const d of xs) {
    if (ys.some((e) => e.code === d.code && e.msg === d.msg && e.range === d.range)) continue;
    const same = ys.find((e) => e.code === d.code && e.msg === d.msg);
    if (same) moved.push(`${JSON.stringify(x.typed)} ${d.code} ${d.range} ${d.text} vs ${same.range} ${same.text} :: ${d.msg}`);
    else extra.push(`${JSON.stringify(x.typed)} ${d.code} ${d.range} ${d.text} :: ${d.msg}`);
  }
  for (const d of ys) if (!xs.some((e) => e.code === d.code && e.msg === d.msg)) missing.push(`${JSON.stringify(x.typed)} ${d.code} ${d.range} ${d.text} :: ${d.msg}`);
  for (const k of Object.keys({ ...x.hovers, ...y.hovers })) if ((x.hovers[k] ?? null) !== (y.hovers[k] ?? null)) hov.push(`${JSON.stringify(x.typed)} ${k}: ${x.hovers[k]} | ${y.hovers[k]}`);
}
console.log(`moved ${moved.length}\n` + moved.join("\n") + `\n\nextra ${extra.length}\n` + extra.join("\n") + `\n\nmissing ${missing.length}\n` + missing.join("\n") + `\n\nhover ${hov.length}\n` + hov.join("\n"));
