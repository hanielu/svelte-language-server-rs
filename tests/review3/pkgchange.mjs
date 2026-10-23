// A nested package's package.json changes after load ("type" added, then an "imports" target moved):
// does the component's shadow follow its package scope, as the source does?
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "NodeNext", moduleResolution: "NodeNext", verbatimModuleSyntax: true, skipLibCheck: true, types: [] }, include: ["src"] });
const root = makeProject(tpl, {
  "package.json": '{"name":"root","private":true}',
  "pkg/package.json": JSON.stringify({ name: "pkg", imports: { "#u": "./src/a.js" } }),
  "pkg/tsconfig.json": cfg,
  "pkg/src/a.ts": "export const n: number = 1;\n",
  "pkg/src/b.ts": "export const n: string = 'b';\n",
  "pkg/src/Doc.svelte": `<script lang="ts">\n\timport { n } from '#u';\n\tconst s: number = n;\n</script>\n<p>{s}</p>\n`,
});
const s = await session(bin, root);
s.open("pkg/src/Doc.svelte");
const out = { commonjs: await s.settle("pkg/src/Doc.svelte", 10000) };
s.write("pkg/package.json", JSON.stringify({ name: "pkg", type: "module", imports: { "#u": "./src/a.js" } }));
s.watched([["pkg/package.json", 2]]);
await s.sleep(1500);
out.afterTypeModule = await s.settle("pkg/src/Doc.svelte", 6000);
s.write("pkg/package.json", JSON.stringify({ name: "pkg", type: "module", imports: { "#u": "./src/b.js" } }));
s.watched([["pkg/package.json", 2]]);
await s.sleep(1500);
out.afterImportsRetarget = await s.settle("pkg/src/Doc.svelte", 6000);
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
