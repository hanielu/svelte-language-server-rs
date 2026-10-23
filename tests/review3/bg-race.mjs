// Editor activity while the background loads another project: an unsaved buffer that project copies,
// a new component plus an import of it saved on disk, and a deleted component, all during the load.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, delayArg = "1000", fillerArg = "400"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const files = {
  "package.json": '{"name":"bg","private":true,"type":"module"}',
  "a/tsconfig.json": cfg,
  "a/Child.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n<p>{label}</p>\n`,
  "b/tsconfig.json": cfg,
  "b/Gone.svelte": `<script lang="ts">\n\tlet { g }: { g: number } = $props();\n</script>\n<p>{g}</p>\n`,
  "b/Parent.svelte": `<script lang="ts">\n\timport Child from '../a/Child.svelte';\n\timport Gone from './Gone.svelte';\n</script>\n<Child label="x" />\n<Gone g={1} />\n`,
};
for (let i = 0; i < Number(fillerArg); i++) files[`b/filler/F${i}.svelte`] = `<script lang="ts">\n\tlet { v }: { v: number } = $props();\n\tconst w: number = v * ${i};\n</script>\n<p>{w}</p>\n`;
const root = makeProject(tpl, files);
const s = await session(bin, root);
const log = () => s.log.join("");
s.open("a/Child.svelte");
await s.settle("a/Child.svelte");
const t0 = performance.now();
await s.sleep(Number(delayArg));
// during the load
s.change("a/Child.svelte", `<script lang="ts">\n\tlet { label }: { label: number } = $props();\n</script>\n<p>{label}</p>\n`);
s.write("b/New.svelte", `<script lang="ts">\n\tlet { k }: { k: boolean } = $props();\n</script>\n<p>{k}</p>\n`);
s.watched([["b/New.svelte", 1]]);
s.write("b/Parent.svelte", `<script lang="ts">\n\timport Child from '../a/Child.svelte';\n\timport Gone from './Gone.svelte';\n\timport New from './New.svelte';\n</script>\n<Child label="x" />\n<Gone g={1} />\n<New k={1} />\n`);
s.watched([["b/Parent.svelte", 2]]);
fs.rmSync(`${root}/b/Gone.svelte`);
s.watched([["b/Gone.svelte", 3]]);
const sentAt = performance.now() - t0;
let loadedAt = null;
for (let i = 0; i < 100 && !/b\/tsconfig.json \(\d+ components\) in \d+ ms in the background/.test(log()); i++) await s.sleep(100);
const m = /loaded TypeScript project \S*b\/tsconfig.json \((\d+) components\) in (\d+) ms in the background/.exec(log());
s.open("b/Parent.svelte");
const parent = await s.settle("b/Parent.svelte", 10000);
const expected = ["1:2322", "2:2307", "7:2322"];
const out = { delay: Number(delayArg), sentAtMs: Math.round(sentAt), backgroundLoad: m ? `${m[1]} components, ${m[2]} ms` : "not in background", parent,
  ok: expected.every((e) => parent.some((d) => d.startsWith(e.split(":")[0] === "1" ? "5:2322" : e))) };
// Expected: Child's unsaved `label: number` makes line 5 an error, Gone is gone (2307 on line 2), New resolves (line 7 2322).
out.ok = parent.some((d) => d.startsWith("5:2322")) && parent.some((d) => d.startsWith("2:2307")) && parent.some((d) => d.startsWith("7:2322"));
console.log(JSON.stringify(out));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
