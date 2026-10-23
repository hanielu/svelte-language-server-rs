// Typing in a large component: 20 keystrokes 50 ms apart, each followed (not awaited) by a completion
// and a diagnostic pull, as Zed sends them. Reports completion latency while typing and the time from
// the last keystroke to diagnostics showing the final text's error.
import { client } from "./client.mjs";
import { makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, linesArg = "1500"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const N = Number(linesArg);
let script = `<script lang="ts">\n\timport Child from './Child.svelte';\n\tconst data = { items: [1, 2, 3], title: 'x' };\n`;
for (let i = 0; i < N / 5; i++) script += `\tlet v${i} = $state(${i});\n\tconst d${i} = $derived(v${i} * 2);\n\tfunction f${i}(x: number) { return x + v${i}; }\n`;
script += `\t\n</script>\n`;
let tmpl = "";
for (let i = 0; i < N / 5; i++) tmpl += `<div class="row r${i}" class:on={v${i} > 1}>\n\t<span title={String(d${i})}>{f${i}(${i})}</span>\n\t<Child label={String(v${i})} />\n</div>\n`;
tmpl += `{#each data.items as item, i (item)}\n\t<p>{item} {i}</p>\n{/each}\n<style>\n\t.row { display: flex; }\n\t.on { color: red; }\n</style>\n`;
const text0 = script + tmpl;
const root = makeProject(tpl, { "package.json": '{"name":"bt","private":true,"type":"module"}', "tsconfig.json": cfg,
  "Child.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n<p>{label}</p>\n`, "Big.svelte": text0 });
const c = await client(bin, root);
const rel = "Big.svelte";
c.open(rel, text0);
const td = { uri: c.uri(rel) };
const pull = () => c.request("textDocument/diagnostic", { textDocument: td });
for (let i = 0; i < 60; i++) { const r = await pull(); if ((r?.items ?? []).length >= 0 && i > 3) break; await c.sleep(200); }
await c.sleep(3000);
const t1 = performance.now(); await pull(); const quietPull = performance.now() - t1;
const lines = text0.split("\n");
const line = lines.findIndex((l) => l === "\t") ; // the empty line before </script>
const typed = "data.titl.ite";
const comp = [];
let last = 0;
for (let k = 0; k < typed.length; k++) {
  c.changeRange(rel, { start: { line, character: 1 + k }, end: { line, character: 1 + k } }, typed[k]);
  const t = performance.now();
  c.request("textDocument/completion", { textDocument: td, position: { line, character: 2 + k }, context: typed[k] === "." ? { triggerKind: 2, triggerCharacter: "." } : { triggerKind: 1 } }).then(() => comp.push(performance.now() - t));
  if (!process.env.NO_PULL) pull();
  last = performance.now();
  await c.sleep(50);
}
let finalMs = null;
for (;;) { const r = await pull(); if ((r?.items ?? []).some((d) => /'titl' does not exist/.test(d.message))) { finalMs = performance.now() - last; break; } if (performance.now() - last > 20000) break; }
await c.sleep(500);
comp.sort((a, b) => a - b);
const q = (p) => Math.round(comp[Math.min(comp.length - 1, Math.floor(p * comp.length))]);
console.log(JSON.stringify({ lines: text0.split("\n").length, quietPullMs: Math.round(quietPull), finalDiagMs: Math.round(finalMs), completionP50: q(0.5), completionP95: q(0.95), completionMax: Math.round(comp.at(-1)) }));
await c.end();
fs.rmSync(root, { recursive: true, force: true });
