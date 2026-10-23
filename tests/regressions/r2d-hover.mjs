// R2d: a hover sent during an in-place probe, before an edit that inserts a line at the top.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, delay = "12"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const parent = `<script lang="ts">\n\timport Child from './Child.svelte';\n\tconst later: number = 1;\n\tconst other: string = 'x';\n</script>\n\n<Child  />\n<p>{later}</p>\n<p>{other}</p>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"r2d","private":true,"type":"module"}',
  "tsconfig.json": cfg,
  "Child.svelte": `<script lang="ts">\n\tlet { alphaProp, betaProp }: { alphaProp: string; betaProp: number } = $props();\n</script>\n\n<p>{alphaProp}{betaProp}</p>\n`,
  "Parent.svelte": parent,
});
const s = await session(bin, root);
s.open("Parent.svelte", parent);
await s.settle("Parent.svelte");
const td = { uri: s.uri("Parent.svelte") };
const hover = (l, c) => s.request("textDocument/hover", { textDocument: td, position: { line: l, character: c } }).then((h) => h ? JSON.stringify(h.contents).replace(/\\n|```|typescript|"/g, "") + (h.range ? ` @${h.range.start.line}:${h.range.start.character}` : "") : null);
const out = { quiet: [await hover(7, 5), await hover(8, 5)] };
const completion = s.request("textDocument/completion", { textDocument: td, position: { line: 6, character: 7 } });
const t0 = performance.now(); while (performance.now() - t0 < Number(delay)) {}
const during = [hover(7, 5), hover(8, 5)];
s.change("Parent.svelte", "<p>{other}</p>\n" + parent);
const items = await completion;
out.probeEndedByEdit = (Array.isArray(items) ? items : items?.items ?? []).filter((i) => /Prop/.test(i.label)).length === 0;
out.sentBeforeEdit = await Promise.all(during);
out.ok = !out.probeEndedByEdit || JSON.stringify(out.sentBeforeEdit.map((h) => h?.split(" @")[0])) === JSON.stringify(out.quiet.map((h) => h?.split(" @")[0]));
console.log(JSON.stringify(out));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
