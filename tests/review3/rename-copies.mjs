// Rename and references for a symbol of a component that another project holds as a copy:
// with every project loaded, does the answer repeat an edit or a location?
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, mode = "background"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const root = makeProject(tpl, {
  "package.json": '{"name":"rn","private":true,"type":"module"}',
  "a/tsconfig.json": cfg,
  "a/util.ts": "export function helper(x: number) { return x + 1; }\n",
  "a/Child.svelte": `<script lang="ts">\n\timport { helper } from './util';\n\tlet { label }: { label: string } = $props();\n\tconst counter = helper(1);\n</script>\n<p>{label} {counter} {helper(2)}</p>\n`,
  "b/tsconfig.json": cfg,
  "b/Uses.svelte": `<script lang="ts">\n\timport Child from '../a/Child.svelte';\n</script>\n<Child label="x" />\n`,
});
const s = await session(bin, root);
s.open("a/Child.svelte");
await s.settle("a/Child.svelte");
if (mode === "background") { for (let i = 0; i < 60 && !/every TypeScript project that owns a component is loaded/.test(s.log.join("")); i++) await s.sleep(250); }
const td = { uri: s.uri("a/Child.svelte") };
const out = { backgroundDone: /every TypeScript project that owns a component is loaded/.test(s.log.join("")) };
const rn = await s.request("textDocument/rename", { textDocument: td, position: { line: 3, character: 8 }, newName: "tally" }).catch((e) => ({ error: e.message }));
const edits = [];
for (const [uri, list] of Object.entries(rn?.changes ?? {})) for (const e of list) edits.push(`${uri.split("/").slice(-2).join("/")} ${e.range.start.line}:${e.range.start.character}-${e.range.end.line}:${e.range.end.character} ${e.newText}`);
for (const dc of rn?.documentChanges ?? []) for (const e of dc.edits ?? []) edits.push(`${dc.textDocument.uri.split("/").slice(-2).join("/")} ${e.range.start.line}:${e.range.start.character}-${e.range.end.line}:${e.range.end.character} ${e.newText}`);
out.renameLocal = edits.sort();
const rn2 = await s.request("textDocument/rename", { textDocument: td, position: { line: 1, character: 11 }, newName: "assist" }).catch((e) => ({ error: e.message }));
const edits2 = [];
for (const [uri, list] of Object.entries(rn2?.changes ?? {})) for (const e of list) edits2.push(`${uri.split("/").slice(-2).join("/")} ${e.range.start.line}:${e.range.start.character}-${e.range.end.line}:${e.range.end.character} ${e.newText}`);
for (const dc of rn2?.documentChanges ?? []) for (const e of dc.edits ?? []) edits2.push(`${dc.textDocument.uri.split("/").slice(-2).join("/")} ${e.range.start.line}:${e.range.start.character}-${e.range.end.line}:${e.range.end.character} ${e.newText}`);
out.renameImported = edits2.sort();
const refs = await s.request("textDocument/references", { textDocument: td, position: { line: 3, character: 8 }, context: { includeDeclaration: true } });
out.references = (refs ?? []).map((l) => `${l.uri.split("/").slice(-2).join("/")} ${l.range.start.line}:${l.range.start.character}`).sort();
out.duplicateEdits = [out.renameLocal, out.renameImported].map((l) => l.length - new Set(l).size);
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
