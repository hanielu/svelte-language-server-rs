// S7: a .svelte file under node_modules in a workspace whose root has a tsconfig gets no TypeScript service.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const comp = `<script lang="ts">\n\tconst n: number = "x";\n\texport const label = 'a';\n</script>\n\n<p>{n}</p>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"s7","private":true,"type":"module"}',
  "tsconfig.json": cfg,
  "src/App.svelte": `<script lang="ts">\n\tconst a: number = 1;\n</script>\n<p>{a}</p>\n`,
  "node_modules/fakepkg/dist/Comp.svelte": comp,
});
const s = await session(bin, root);
const out = {};
s.open("src/App.svelte");
out.app = await s.settle("src/App.svelte");
s.open("node_modules/fakepkg/dist/Comp.svelte");
out.libraryComponent = await s.settle("node_modules/fakepkg/dist/Comp.svelte", 5000);
const h = await s.hover("node_modules/fakepkg/dist/Comp.svelte", 1, 8);
out.hover = h ? JSON.stringify(h.contents).slice(0, 120) : null;
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
