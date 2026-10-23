// S10: package.json "imports" (`#lib/*` subpath imports) must resolve from a component's shadow as
// they do from the source: a `.svelte` target, a TypeScript module named with `.js`, and a rune
// module, in a nested package (its own tsconfig and package.json) under a workspace root that has
// a package.json without "imports".
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] }, include: ["src"] });
const root = makeProject(tpl, {
  "package.json": '{"name":"s10","private":true,"type":"module"}',
  "pkg/package.json": JSON.stringify({ name: "pkg", type: "module", imports: { "#lib": "./src/lib/index.js", "#lib/*": "./src/lib/*" } }),
  "pkg/tsconfig.json": cfg,
  "pkg/src/lib/index.ts": "export const fromIndex: number = 1;\n",
  "pkg/src/lib/util.ts": "export const fromUtil: number = 2;\n",
  "pkg/src/lib/state.svelte.ts": "export const fromRunes: number = 3;\n",
  "pkg/src/lib/Button.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n\n<button>{label}</button>\n`,
  "pkg/src/lib/Dialog.svelte": `<script lang="ts">\n\timport Button from '#lib/Button.svelte';\n\timport { fromUtil } from '#lib/util.js';\n\timport { fromRunes } from '#lib/state.svelte.js';\n\timport { fromIndex } from '#lib';\n\tconst sum: number = fromUtil + fromRunes + fromIndex;\n</script>\n\n<Button label={sum} />\n`,
});
const s = await session(bin, root);
const out = {};
s.open("pkg/src/lib/Dialog.svelte");
// Expected: only the deliberate prop error (number given where string is wanted) on line 8.
out.dialog = await s.settle("pkg/src/lib/Dialog.svelte", 8000);
const h = await s.hover("pkg/src/lib/Dialog.svelte", 2, 12);
out.hoverUtil = h ? JSON.stringify(h.contents).slice(0, 80) : null;
out.ok = JSON.stringify(out.dialog) === JSON.stringify(["8:2322:Type 'number' is not assignable to type 'string'."]);
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
