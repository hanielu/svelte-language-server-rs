// A JavaScript component (JSDoc-typed props) that an open document starts importing after it opened:
// unsaved, then saved; and one reached only through an owned plain module (barrel), added later.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, allowJs: true, checkJs: true, types: [] } });
const js = (name) => `<script>\n\t/** @type {{ ${name}: string }} */\n\tlet { ${name} } = $props();\n</script>\n<p>{${name}}</p>\n`;
const parent0 = `<script lang="ts">\n\tconst n: number = 1;\n</script>\n<p>{n}</p>\n`;
const parent1 = `<script lang="ts">\n\timport JsChild from './JsChild.svelte';\n\tconst n: number = 1;\n</script>\n<JsChild label={n} />\n`;
const parent2 = `<script lang="ts">\n\timport { Barrel } from './barrel';\n\tconst n: number = 1;\n</script>\n<Barrel other={n} />\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"jr","private":true,"type":"module"}', "tsconfig.json": cfg,
  "JsChild.svelte": js("label"), "Barrel.svelte": js("other"), "barrel.ts": "export { default as Barrel } from './Barrel.svelte';\n",
  "Parent.svelte": parent0, "Parent2.svelte": parent0,
});
const s = await session(bin, root);
s.open("Parent.svelte"); s.open("Parent2.svelte");
const out = { initial: await s.settle("Parent.svelte", 8000) };
s.change("Parent.svelte", parent1);
out.unsavedImport = await s.settle("Parent.svelte", 8000);
s.change("Parent2.svelte", parent2);
out.barrelUnsaved = await s.settle("Parent2.svelte", 8000);
console.log(JSON.stringify(out, null, 1));
await s.end();
// control: imported at open
const s2 = await session(bin, root);
s2.open("Parent.svelte", parent1); s2.open("Parent2.svelte", parent2);
console.log(JSON.stringify({ importedAtOpen: await s2.settle("Parent.svelte", 8000), barrelAtOpen: await s2.settle("Parent2.svelte", 8000) }, null, 1));
await s2.end();
fs.rmSync(root, { recursive: true, force: true });
