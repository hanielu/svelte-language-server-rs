// S1b: after a tsconfig change (rebuild), an unsaved buffer synced before its importer's project reloads is stale there.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const child = (type) => `<script lang="ts">\n\tlet { count }: { count: ${type} } = $props();\n</script>\n\n<p>{count}</p>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"s1b","private":true,"type":"module"}',
  "a/tsconfig.json": cfg,
  "a/Parent.svelte": `<script lang="ts">\n\timport Child from '../b/Child.svelte';\n\tconst total: number = 1;\n</script>\n\n<Child count={total} />\n`,
  "b/tsconfig.json": cfg,
  "b/Child.svelte": child("number"),
});
const s = await session(bin, root);
const out = {};
s.open("a/Parent.svelte");
s.open("b/Child.svelte");
s.change("b/Child.svelte", child("string"));
out.before = await s.settle("a/Parent.svelte", 6000);
s.write("b/tsconfig.json", cfg + "\n");
s.watched([["b/tsconfig.json", 2]]);
const t0 = performance.now(); let d = [];
for (;;) { d = await s.diags("a/Parent.svelte"); if (d.length || performance.now() - t0 > 12000) break; await s.sleep(200); }
out.afterConfigChange = d; out.waitedMs = Math.round(performance.now() - t0);
s.change("b/Child.svelte", child("string") + "\n");
out.afterChildKeystroke = await s.settle("a/Parent.svelte", 6000);
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
