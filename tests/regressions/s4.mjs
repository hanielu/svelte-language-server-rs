// S4: a copy removed by a DELETED event never comes back when the file is restored (CREATED),
// because the path is not recorded in `missing` and the project does not own it.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
import path from "node:path";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const child = `<script lang="ts">\n\tlet { count }: { count: string } = $props();\n</script>\n\n<p>{count}</p>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"s4","private":true,"type":"module"}',
  "a/tsconfig.json": cfg,
  "a/Parent.svelte": `<script lang="ts">\n\timport Child from '../b/Child.svelte';\n\tconst total: number = 1;\n</script>\n\n<Child count={total} />\n`,
  "b/tsconfig.json": cfg,
  "b/Child.svelte": child,
});
const s = await session(bin, root);
const out = {};
s.open("a/Parent.svelte");
out.initial = await s.settle("a/Parent.svelte", 6000);
fs.rmSync(path.join(root, "b/Child.svelte"));
s.watched([["b/Child.svelte", 3]]);
out.afterDelete = await s.settle("a/Parent.svelte", 6000);
s.write("b/Child.svelte", child); // restored (undo, git checkout, stash pop...)
s.watched([["b/Child.svelte", 1]]);
out.afterRestore = await s.settle("a/Parent.svelte", 6000);
s.change("a/Parent.svelte", fs.readFileSync(path.join(root, "a/Parent.svelte"), "utf8") + "\n");
out.afterParentKeystroke = await s.settle("a/Parent.svelte", 6000);
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
