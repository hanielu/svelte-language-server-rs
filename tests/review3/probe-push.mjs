// A client that takes pushed diagnostics: do diagnostics pushed while an in-place component probe
// is in the shadow's buffer describe the probe instead of the document?
import { client, fmtDiag } from "./client.mjs";
import { makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const parent = `<script lang="ts">\n\timport Child from './Child.svelte';\n\tconst later: string = 1;\n</script>\n\n<Child  />\n<p>{later}</p>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"pp","private":true,"type":"module"}', "tsconfig.json": cfg,
  "Child.svelte": `<script lang="ts">\n\tlet { alphaProp, betaProp }: { alphaProp: string; betaProp: number } = $props();\n</script>\n\n<p>{alphaProp}{betaProp}</p>\n`,
  "Parent.svelte": parent,
});
const c = await client(bin, root, { pull: false });
c.open("Parent.svelte", parent);
await c.sleep(4000);
const stable = c.pushed("Parent.svelte").at(-1);
const settled = (stable?.params.diagnostics ?? []).map(fmtDiag);
const mark = c.notes.length;
let offered = 0;
for (let i = 0; i < 15; i++) {
  const r = await c.request("textDocument/completion", { textDocument: { uri: c.uri("Parent.svelte") }, position: { line: 5, character: 7 } });
  offered += (Array.isArray(r) ? r : r?.items ?? []).filter((x) => /Prop/.test(x.label)).length > 0 ? 1 : 0;
  await c.sleep(150);
}
await c.sleep(2000);
const during = c.notes.slice(mark).filter((n) => n.method === "textDocument/publishDiagnostics" && n.params.uri === c.uri("Parent.svelte")).map((n) => (n.params.diagnostics ?? []).map(fmtDiag));
const distinct = [...new Set(during.map((d) => JSON.stringify(d)))];
console.log(JSON.stringify({ settled, completionsWithProps: offered, pushesDuringProbes: during.length, distinctPushed: distinct, wrong: distinct.filter((d) => d !== JSON.stringify(settled)) }, null, 1));
await c.end();
fs.rmSync(root, { recursive: true, force: true });
