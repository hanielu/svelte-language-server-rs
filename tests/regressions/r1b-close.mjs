// R1b: after the dependency component is closed again, does app/src recover?
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const app = `<script lang="ts">\n\timport { depValue } from 'dep';\n\tconst s: string = depValue;\n</script>\n<p>{s}</p>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"r1","private":true,"type":"module"}',
  "tsconfig.json": cfg,
  "app/src/App.svelte": app,
  "app/src/Other.svelte": `<script lang="ts">\n\tlet { n }: { n: number } = $props();\n</script>\n<p>{n}</p>\n`,
  "app/node_modules/dep/package.json": '{"name":"dep","type":"module","types":"./index.d.ts"}',
  "app/node_modules/dep/index.d.ts": "export declare const depValue: number;\n",
  "app/node_modules/dep/Comp.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n<p>{label}</p>\n`,
});
const s = await session(bin, root);
const out = {};
s.open("app/src/App.svelte");
out.appBefore = await s.settle("app/src/App.svelte");
s.open("app/node_modules/dep/Comp.svelte");
out.dep = await s.settle("app/node_modules/dep/Comp.svelte");
out.appWhileDepOpen = await s.settle("app/src/App.svelte");
s.close("app/node_modules/dep/Comp.svelte");
await s.sleep(500);
// A component event makes the overlay relink node_modules.
s.write("app/src/Other.svelte", `<script lang="ts">\n\tlet { n }: { n: string } = $props();\n</script>\n<p>{n}</p>\n`);
s.watched([["app/src/Other.svelte", 2]]);
await s.sleep(500);
s.change("app/src/App.svelte", app.replace("<script lang=\"ts\">\n", "<script lang=\"ts\">\n\timport type { Snippet } from 'svelte';\n"));
out.appAfterDepClosed = await s.settle("app/src/App.svelte", 6000);
const p = root + "/.svelte-rs/tsgo/svelte/app/node_modules";
out.link = fs.existsSync(p) ? (fs.lstatSync(p).isSymbolicLink() ? "symlink" : "real dir: " + fs.readdirSync(p, { recursive: true }).join(",")) : "absent";
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
