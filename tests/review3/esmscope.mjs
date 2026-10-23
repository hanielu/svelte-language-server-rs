// A nested package with "type": "module" and NodeNext resolution: relative .svelte and .js imports.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, layout = "nested"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "NodeNext", moduleResolution: "NodeNext", verbatimModuleSyntax: true, skipLibCheck: true, types: [] }, include: ["src"] });
const pre = layout === "nested" ? "pkg/" : "";
const files = {
  [`${pre}tsconfig.json`]: cfg,
  [`${pre}src/util.ts`]: "export const n: number = 1;\n",
  [`${pre}src/Child.svelte`]: `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n\n<p>{label}</p>\n`,
  [`${pre}src/Parent.svelte`]: `<script lang="ts">\n\timport Child from './Child.svelte';\n\timport { n } from './util.js';\n\tconst s: number = n;\n</script>\n\n<Child label={s} />\n`,
};
if (layout === "nested") { files["package.json"] = '{"name":"root","private":true}'; files["pkg/package.json"] = '{"name":"pkg","type":"module"}'; }
else files["package.json"] = '{"name":"root","private":true,"type":"module"}';
const root = makeProject(tpl, files);
const s = await session(bin, root);
s.open(`${pre}src/Parent.svelte`);
console.log(JSON.stringify({ layout, parent: await s.settle(`${pre}src/Parent.svelte`, 10000) }));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
