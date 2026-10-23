// S1: a project loaded after an editor buffer was changed reads its copy of that component from disk.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const child = (type) => `<script lang="ts">\n\tlet { count }: { count: ${type} } = $props();\n</script>\n\n<p>{count}</p>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"s1","private":true,"type":"module"}',
  "a/tsconfig.json": cfg,
  "a/Parent.svelte": `<script lang="ts">\n\timport Child from '../b/Child.svelte';\n\tconst total: number = 1;\n</script>\n\n<Child count={total} />\n`,
  "b/tsconfig.json": cfg,
  "b/Child.svelte": child("number"),
});
const s = await session(bin, root);
const out = {};
s.open("b/Child.svelte");
out.child0 = await s.settle("b/Child.svelte");
s.change("b/Child.svelte", child("string")); // unsaved: count is now a string
out.child1 = await s.settle("b/Child.svelte");
s.open("a/Parent.svelte"); // loads project a, which copies b/Child.svelte
out.parentAfterOpen = await s.settle("a/Parent.svelte", 6000);
s.change("b/Child.svelte", child("string") + "\n"); // one more keystroke in the child
out.parentAfterChildKeystroke = await s.settle("a/Parent.svelte", 6000);
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
