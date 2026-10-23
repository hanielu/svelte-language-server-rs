// Rename a type parameter declared in the instance script's `generics` attribute, from a use in the
// script, and list its references and definition: every location must be the attribute's value or a
// use, none at 0:1 (the `<script` tag the render header replaces). Also renames the props type alias
// used in the annotation of a generic component (its `$$ComponentProps` stays inside `$$render`).
// Usage: node genericsrename.mjs <binary> <tpl>
import { session, makeProject } from "../review3/h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const comp = `<script lang="ts" generics="T extends string, U = number">\n\ttype Size = 'sm' | 'lg';\n\tlet { item, n, size }: { item: T; n: U; size: Size } = $props();\n\tlet x: T = item;\n</script>\n<p>{item}{x}{n}{size}</p>\n`;
const root = makeProject(tpl, { "package.json": '{"name":"gr","private":true,"type":"module"}', "tsconfig.json": cfg, "List.svelte": comp });
const s = await session(bin, root);
s.open("List.svelte", comp);
const diagnostics = await s.settle("List.svelte");
const td = { uri: s.uri("List.svelte") };
const lines = comp.split("\n");
const toIdx = (p) => lines.slice(0, p.line).reduce((a, l) => a + l.length + 1, 0) + p.character;
const fmt = (r) => `${r.start.line}:${r.start.character}-${r.end.line}:${r.end.character}`;
const out = { diagnostics };
for (const [name, position] of [["T", { line: 3, character: 8 }], ["Size", { line: 1, character: 7 }]]) {
  const rn = await s.request("textDocument/rename", { textDocument: td, position, newName: `${name}2` }).catch((e) => ({ error: e.message }));
  const edits = [];
  for (const [, list] of Object.entries(rn?.changes ?? {})) edits.push(...list);
  for (const dc of rn?.documentChanges ?? []) edits.push(...(dc.edits ?? []));
  let text = comp;
  for (const e of [...edits].sort((a, b) => toIdx(b.range.start) - toIdx(a.range.start))) text = text.slice(0, toIdx(e.range.start)) + e.newText + text.slice(toIdx(e.range.end));
  const refs = await s.request("textDocument/references", { textDocument: td, position, context: { includeDeclaration: true } });
  const def = await s.request("textDocument/definition", { textDocument: td, position });
  out[name] = {
    edits: edits.map((e) => `${fmt(e.range)} ${e.newText}`),
    after: text.split("\n").slice(0, 4),
    references: (refs ?? []).map((l) => fmt(l.range)),
    definition: (Array.isArray(def) ? def : def ? [def] : []).map((l) => fmt(l.targetSelectionRange ?? l.range)),
  };
}
console.log(JSON.stringify(out, null, 1));
await s.end(); fs.rmSync(root, { recursive: true, force: true }); process.exit(0);
