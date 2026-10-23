// R2c: a request the editor sends while an in-place component probe is in flight is held and
// replayed after an edit that arrived later: it is answered against the newer text (LSP requires
// the state at the time the request was received). Shown with textDocument/formatting.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, delay = "12"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const parent = `<script lang="ts">\n\timport Child from './Child.svelte';\n\tconst later: number   =   1;\n</script>\n\n<Child  />\n<p>{later}</p>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"r2c","private":true,"type":"module"}',
  "tsconfig.json": cfg,
  "Child.svelte": `<script lang="ts">\n\tlet { alphaProp, betaProp }: { alphaProp: string; betaProp: number } = $props();\n</script>\n\n<p>{alphaProp}{betaProp}</p>\n`,
  "Parent.svelte": parent,
});
const s = await session(bin, root);
s.open("Parent.svelte", parent);
await s.settle("Parent.svelte");
const td = { uri: s.uri("Parent.svelte") };
const fmt = () => s.request("textDocument/formatting", { textDocument: td, options: { tabSize: 2, insertSpaces: false } });
const show = (edits) => (edits ?? []).map((e) => `${e.range.start.line}:${e.range.start.character}-${e.range.end.line}:${e.range.end.character}=>${JSON.stringify(e.newText).slice(0, 60)}`);
const out = {};
out.formatQuiet = show(await fmt());
for (const d of [Number(delay), 8, 10, 15, 20, 30, 45]) {
  const current = "<!-- top -->\n".repeat(out.tries ?? 0) + parent;
  const completion = s.request("textDocument/completion", { textDocument: td, position: { line: 5 + (out.tries ?? 0), character: 7 } });
  const t0 = performance.now(); while (performance.now() - t0 < d) {}
  const during = fmt();
  s.change("Parent.svelte", "<!-- top -->\n" + current);
  const items = await completion;
  out.tries = (out.tries ?? 0) + 1;
  out.delay = d;
  out.probeEndedByEdit = (Array.isArray(items) ? items : items?.items ?? []).filter((i) => /Prop/.test(i.label)).length === 0;
  out.formatSentBeforeEdit = show(await during);
  out.expectedForRequestVersion = show(await (async () => { const t = await session(bin, root); t.open("Parent.svelte", current); await t.settle("Parent.svelte"); const r = await t.request("textDocument/formatting", { textDocument: { uri: t.uri("Parent.svelte") }, options: { tabSize: 2, insertSpaces: false } }); await t.end(); return r; })());
  if (out.probeEndedByEdit) break;
  await s.sleep(500);
}
out.ok = !out.probeEndedByEdit || JSON.stringify(out.formatSentBeforeEdit) === JSON.stringify(out.expectedForRequestVersion);
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
