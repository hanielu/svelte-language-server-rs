// hashscope's two packages, with every project loaded: references and rename of a type exported by
// ui's #lib module, used by ui components that rt's project holds as copies (their #lib specifiers
// respelled, one longer than the original). Are edits and locations right, and not repeated?
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] }, include: ["src"] });
const imports = { "#lib": "./src/lib/index.js", "#lib/*": "./src/lib/*" };
const card = `<script lang="ts">\n\timport type { Size } from '#lib/util.js'; let s: Size = 'sm'; let t: Size = 'lg';\n\tlet { kind }: { kind: Size } = $props();\n</script>\n<p>{s}{t}{kind}</p>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"root","private":true,"workspaces":["packages/*"]}',
  "packages/ui/package.json": JSON.stringify({ name: "@x/ui", type: "module", imports }),
  "packages/ui/tsconfig.json": cfg,
  "packages/ui/src/lib/index.ts": "export type Kind = 'primary' | 'ghost';\n",
  "packages/ui/src/lib/util.ts": "export type Size = 'sm' | 'lg';\n",
  "packages/ui/src/lib/Button.svelte": `<script lang="ts">\n\timport type { Kind } from '#lib';\n\timport type { Size } from '#lib/util.js';\n\tlet { kind, size }: { kind: Kind; size: Size } = $props();\n</script>\n<button class={kind + size}>x</button>\n`,
  "packages/ui/src/routes/deep/Card.svelte": card,
  "packages/rt/package.json": JSON.stringify({ name: "@x/rt", type: "module", imports }),
  "packages/rt/tsconfig.json": cfg,
  "packages/rt/src/lib/index.ts": "export type Kind = number;\n",
  "packages/rt/src/lib/util.ts": "export type Size = boolean;\n",
  "packages/rt/src/lib/Editor.svelte": `<script lang="ts">\n\timport Button from '../../../ui/src/lib/Button.svelte';\n\timport Card from '../../../ui/src/routes/deep/Card.svelte';\n</script>\n<Button kind="primary" size="sm" />\n<Card kind="lg" />\n`,
});
const s = await session(bin, root);
s.open("packages/rt/src/lib/Editor.svelte");
const out = { editor: await s.settle("packages/rt/src/lib/Editor.svelte", 10000) };
for (let i = 0; i < 80 && !/every TypeScript project that owns a component is loaded/.test(s.log.join("")); i++) await s.sleep(250);
out.backgroundDone = /every TypeScript project that owns a component is loaded/.test(s.log.join(""));
s.open("packages/ui/src/lib/util.ts", fs.readFileSync(`${root}/packages/ui/src/lib/util.ts`, "utf8"), "typescript");
await s.sleep(1500);
const short = (u) => u.split("/packages/")[1];
const td = { uri: s.uri("packages/ui/src/lib/util.ts") };
const refs = await s.request("textDocument/references", { textDocument: td, position: { line: 0, character: 13 }, context: { includeDeclaration: true } });
out.references = (refs ?? []).map((l) => `${short(l.uri)} ${l.range.start.line}:${l.range.start.character}-${l.range.end.line}:${l.range.end.character}`).sort();
const rn = await s.request("textDocument/rename", { textDocument: td, position: { line: 0, character: 13 }, newName: "Dim" }).catch((e) => ({ error: e.message }));
const edits = [];
for (const [uri, list] of Object.entries(rn?.changes ?? {})) for (const e of list) edits.push(`${short(uri)} ${e.range.start.line}:${e.range.start.character}-${e.range.end.line}:${e.range.end.character} ${e.newText}`);
for (const dc of rn?.documentChanges ?? []) for (const e of dc.edits ?? []) edits.push(`${short(dc.textDocument.uri)} ${e.range.start.line}:${e.range.start.character}-${e.range.end.line}:${e.range.end.character} ${e.newText}`);
out.rename = edits.sort();
out.renameError = rn?.error;
out.duplicateEdits = edits.length - new Set(edits).size;
const cardEditsC = [];
s.open("packages/ui/src/routes/deep/Card.svelte", card);
await s.settle("packages/ui/src/routes/deep/Card.svelte", 6000);
const ctd = { uri: s.uri("packages/ui/src/routes/deep/Card.svelte") };
const sizeAt = card.split("\n")[1].indexOf("let s: Size") + 7;
out.cardDiags = await s.settle("packages/ui/src/routes/deep/Card.svelte", 6000);
const crefs = await s.request("textDocument/references", { textDocument: ctd, position: { line: 1, character: sizeAt }, context: { includeDeclaration: true } }).catch((e) => ({ error: e.message }));
out.cardReferences = Array.isArray(crefs) ? crefs.map((l) => `${short(l.uri)} ${l.range.start.line}:${l.range.start.character}-${l.range.end.line}:${l.range.end.character}`).sort() : crefs;
const crn = await s.request("textDocument/rename", { textDocument: ctd, position: { line: 1, character: sizeAt }, newName: "Dim" }).catch((e) => ({ error: e.message }));
const cedits = [];
for (const [uri, list] of Object.entries(crn?.changes ?? {})) for (const e of list) cedits.push(`${short(uri)} ${e.range.start.line}:${e.range.start.character}-${e.range.end.line}:${e.range.end.character} ${e.newText}`);
for (const dc of crn?.documentChanges ?? []) for (const e of dc.edits ?? []) cedits.push(`${short(dc.textDocument.uri)} ${e.range.start.line}:${e.range.start.character}-${e.range.end.line}:${e.range.end.character} ${e.newText}`);
out.cardRename = crn?.error ?? cedits.sort();
out.cardRenameDuplicates = cedits.length - new Set(cedits).size;
const cdef = await s.request("textDocument/definition", { textDocument: ctd, position: { line: 1, character: sizeAt } }).catch((e) => ({ error: e.message }));
out.cardDefinition = Array.isArray(cdef) ? cdef.map((l) => `${short(l.uri ?? l.targetUri)} ${JSON.stringify((l.range ?? l.targetSelectionRange).start)}`) : cdef;
const spec = card.split("\n")[1].indexOf("#lib/util.js") + 3;
const sdef = await s.request("textDocument/definition", { textDocument: ctd, position: { line: 1, character: spec } }).catch((e) => ({ error: e.message }));
out.specifierDefinition = Array.isArray(sdef) ? sdef.map((l) => `${short(l.uri ?? l.targetUri)} ${JSON.stringify((l.range ?? l.targetSelectionRange).start)}`) : sdef;
for (const [uri, list] of Object.entries(crn?.changes ?? {})) if (uri.endsWith("Card.svelte")) cardEditsC.push(...list);
for (const dc of crn?.documentChanges ?? []) if (dc.textDocument.uri.endsWith("Card.svelte")) cardEditsC.push(...dc.edits);
// apply the rename's edits to Card.svelte and show the line
const cardEdits = cardEditsC;

const lines = card.split("\n");
const toIdx = (p) => lines.slice(0, p.line).reduce((a, l) => a + l.length + 1, 0) + p.character;
let text = card;
for (const e of [...cardEdits].sort((a, b) => toIdx(b.range.start) - toIdx(a.range.start))) text = text.slice(0, toIdx(e.range.start)) + e.newText + text.slice(toIdx(e.range.end));
out.cardAfterRename = text.split("\n").slice(1, 3);
// file rename of util.ts (svelte's custom request), as VS Code's Svelte extension sends it
const fr = await s.request("$/getEditsForFileRename", { oldUri: s.uri("packages/ui/src/lib/util.ts"), newUri: s.uri("packages/ui/src/lib/sizes.ts") }).catch((e) => ({ error: e.message }));
const fedits = [];
for (const [uri, list] of Object.entries(fr?.changes ?? {})) for (const e of list) fedits.push(`${short(uri)} ${e.range.start.line}:${e.range.start.character}-${e.range.end.line}:${e.range.end.character} ${e.newText}`);
for (const dc of fr?.documentChanges ?? []) for (const e of dc.edits ?? []) fedits.push(`${short(dc.textDocument.uri)} ${e.range.start.line}:${e.range.start.character}-${e.range.end.line}:${e.range.end.character} ${e.newText}`);
out.fileRename = fr?.error ?? fedits.sort();
console.log(JSON.stringify(out, null, 1));
await s.end(); fs.rmSync(root, { recursive: true, force: true }); process.exit(0);
