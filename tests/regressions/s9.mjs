// S9: component-attribute completion is answered by the first overlay holding the document, which can be
// another project's copy (loaded earlier) instead of the owner.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, order = "copy-first"] = process.argv.slice(2);
const base = { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] };
const parent = `<script lang="ts">\n\timport Child from './Child.svelte';\n</script>\n\n<Child  />\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"s9","private":true,"type":"module"}',
  "b/tsconfig.json": JSON.stringify({ compilerOptions: { ...base, paths: { "$types/*": ["./types/*"] } } }),
  "b/types/props.ts": "export type Props = { alphaProp: string; betaProp: number };\n",
  "b/Child.svelte": `<script lang="ts">\n\timport type { Props } from '$types/props';\n\tlet { alphaProp, betaProp }: Props = $props();\n</script>\n\n<p>{alphaProp}{betaProp}</p>\n`,
  "b/Parent.svelte": parent,
  "a/tsconfig.json": JSON.stringify({ compilerOptions: base }),
  "a/Uses.svelte": `<script lang="ts">\n\timport Parent from '../b/Parent.svelte';\n</script>\n\n<Parent />\n`,
});
const s = await session(bin, root);
if (order === "copy-first") { s.open("a/Uses.svelte"); await s.settle("a/Uses.svelte"); }
s.open("b/Parent.svelte", parent);
await s.settle("b/Parent.svelte");
const r = await s.request("textDocument/completion", { textDocument: { uri: s.uri("b/Parent.svelte") }, position: { line: 4, character: 7 } });
const items = (Array.isArray(r) ? r : r?.items ?? []).map((i) => i.label);
console.log(JSON.stringify({ order, propsOffered: items.filter((l) => /Prop/.test(l)), total: items.length }));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
