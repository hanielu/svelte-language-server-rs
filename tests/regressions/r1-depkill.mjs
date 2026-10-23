// R1: opening a library component from a NESTED node_modules (app/node_modules/dep/Comp.svelte)
// in a workspace whose root tsconfig owns app/src: does it break package resolution for app/src?
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, order = "app-first"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const app = `<script lang="ts">\n\timport { depValue } from 'dep';\n\tconst s: string = depValue;\n</script>\n<p>{s}</p>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"r1","private":true,"type":"module"}',
  "tsconfig.json": cfg,
  "app/package.json": '{"name":"app","private":true,"type":"module"}',
  "app/src/App.svelte": app,
  "app/node_modules/dep/package.json": '{"name":"dep","type":"module","types":"./index.d.ts","svelte":"./Comp.svelte"}',
  "app/node_modules/dep/index.d.ts": "export declare const depValue: number;\n",
  "app/node_modules/dep/Comp.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n<p>{label}</p>\n`,
});
const s = await session(bin, root);
const out = {};
if (order === "app-first") {
  s.open("app/src/App.svelte");
  out.appBefore = await s.settle("app/src/App.svelte");
  s.open("app/node_modules/dep/Comp.svelte");
  out.dep = await s.settle("app/node_modules/dep/Comp.svelte");
  out.appAfterDepOpen = await s.settle("app/src/App.svelte");
  // An import-set change makes tsgo rebuild the program and resolve 'dep' again.
  s.change("app/src/App.svelte", app.replace("<script lang=\"ts\">\n", "<script lang=\"ts\">\n\timport type { Snippet } from 'svelte';\n"));
  out.appAfterImportEdit = await s.settle("app/src/App.svelte", 6000);
} else {
  s.open("app/node_modules/dep/Comp.svelte");
  out.dep = await s.settle("app/node_modules/dep/Comp.svelte");
  s.open("app/src/App.svelte");
  out.appAfterDepOpen = await s.settle("app/src/App.svelte", 6000);
}
const cacheDir = fs.existsSync(root + "/.svelte-rs") ? "/.svelte-rs" : "/.rsvelte-language-server";
const link = fs.readdirSync(root + cacheDir, { recursive: true }).filter((p) => String(p).endsWith("app/node_modules"));
out.shadowLinks = link.map((p) => { const full = root + cacheDir + "/" + p; return p + (fs.lstatSync(full).isSymbolicLink() ? " -> symlink" : " (real dir)"); });
out.ok = JSON.stringify(out.appAfterDepOpen) === JSON.stringify(["2:2322:Type 'number' is not assignable to type 'string'."]);
console.log(JSON.stringify(out, null, 1));
await s.end();
if (!process.env.KEEP) fs.rmSync(root, { recursive: true, force: true }); else console.log(root);
