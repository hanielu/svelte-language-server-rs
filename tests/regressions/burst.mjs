// Typing in a large component while the editor also asks for one kind of document-wide request per
// keystroke (KIND=symbol|folding|inlay|semantic|codeLens). Per-kind latency, completion latency, and
// whether the server gave up on tsgo.
import { client } from "./client.mjs";
import { makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, linesArg = "1500", kind = "symbol", keysArg = "20"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const N = Number(linesArg);
let script = `<script lang="ts">\n\timport Child from './Child.svelte';\n\tconst data = { items: [1, 2, 3], title: 'x' };\n`;
for (let i = 0; i < N / 5; i++) script += `\tlet v${i} = $state(${i});\n\tconst d${i} = $derived(v${i} * 2);\n\tfunction f${i}(x: number) { return x + v${i}; }\n`;
script += `\t\n</script>\n`;
let tmpl = "";
for (let i = 0; i < N / 5; i++) tmpl += `<div class="row r${i}" class:on={v${i} > 1}>\n\t<span title={String(d${i})}>{f${i}(${i})}</span>\n\t<Child label={String(v${i})} />\n</div>\n`;
const text0 = script + tmpl;
const root = makeProject(tpl, { "package.json": '{"name":"bu","private":true,"type":"module"}', "tsconfig.json": cfg,
  "Child.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n<p>{label}</p>\n`, "Big.svelte": text0 });
const c = await client(bin, root);
const rel = "Big.svelte"; const td = { uri: c.uri(rel) };
c.open(rel, text0);
await c.request("textDocument/diagnostic", { textDocument: td });
await c.sleep(2000);
const lines = text0.split("\n"); const line = lines.findIndex((l) => l === "\t");
const reqOf = { symbol: ["textDocument/documentSymbol", { textDocument: td }], folding: ["textDocument/foldingRange", { textDocument: td }], inlay: ["textDocument/inlayHint", { textDocument: td, range: { start: { line: 0, character: 0 }, end: { line: 200, character: 0 } } }], semantic: ["textDocument/semanticTokens/full", { textDocument: td }], codeLens: ["textDocument/codeLens", { textDocument: td }] };
const lat = { kind: [], comp: [] }; let errs = [];
const typed = "data.titl.ite".repeat(5).slice(0, Number(keysArg));
// one quiet request of the kind first
{ const t = performance.now(); await c.request(...reqOf[kind]).catch((e) => errs.push(e.message.slice(0, 80))); lat.quiet = Math.round(performance.now() - t); }
const all = [];
for (let k = 0; k < typed.length; k++) {
  c.changeRange(rel, { start: { line, character: 1 + k }, end: { line, character: 1 + k } }, typed[k]);
  const t = performance.now();
  all.push(c.request("textDocument/completion", { textDocument: td, position: { line, character: 2 + k }, context: { triggerKind: 1 } }).then(() => lat.comp.push(performance.now() - t), (e) => errs.push(e.message.slice(0, 80))));
  all.push(c.request(...reqOf[kind]).then(() => lat.kind.push(performance.now() - t), (e) => errs.push(e.message.slice(0, 80))));
  all.push(c.request("textDocument/diagnostic", { textDocument: td }).catch((e) => errs.push(e.message.slice(0, 80))));
  await c.sleep(50);
}
await Promise.race([Promise.all(all), c.sleep(90000)]);
const q = (a, p) => { a.sort((x, y) => x - y); return Math.round(a[Math.min(a.length - 1, Math.floor(p * a.length))] ?? -1); };
const log = c.log.join("");
console.log(JSON.stringify({ kind, lines: lines.length, quietMs: lat.quiet, kindP50: q(lat.kind, 0.5), kindMax: q(lat.kind, 1), compP50: q(lat.comp, 0.5), compMax: q(lat.comp, 1), answered: lat.kind.length + lat.comp.length, errors: [...new Set(errs)], restarts: (log.match(/restarting tsgo[^\n]*/g) ?? []) }));
await c.end();
fs.rmSync(root, { recursive: true, force: true });
