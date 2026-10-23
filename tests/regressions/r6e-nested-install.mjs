// R6e: a package installed into a NESTED node_modules (app/node_modules) after its import failed.
// Shadows resolve through the cache's mirror link of app/node_modules, so tsgo's failed lookup is at
// the link's path, while an editor reports the real path. mode: real | link | none (which events
// the "editor" sends after the install). Usage: node r6e-nested-install.mjs <bin> <tpl> [mode]
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, mode = "real"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const app = `<script lang="ts">\n\timport { later } from 'nested-later';\n\tconst s: string = later;\n</script>\n<p>{s}</p>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"r6e","private":true,"type":"module"}', ".gitignore": "node_modules\n", "tsconfig.json": cfg,
  "app/package.json": '{"name":"app","private":true,"type":"module"}',
  "app/node_modules/existing/package.json": '{"name":"existing","types":"./index.d.ts"}',
  "app/node_modules/existing/index.d.ts": "export declare const e: number;\n",
  "app/src/App.svelte": app,
});
const s = await session(bin, root);
const out = { mode };
s.open("app/src/App.svelte", app);
out.before = await s.settle("app/src/App.svelte");
s.write("app/node_modules/nested-later/package.json", '{"name":"nested-later","types":"./index.d.ts"}');
s.write("app/node_modules/nested-later/index.d.ts", "export declare const later: number;\n");
const files = ["app/node_modules/nested-later", "app/node_modules/nested-later/package.json", "app/node_modules/nested-later/index.d.ts"];
if (mode === "real") s.watched(files.map((f) => [f, 1]));
if (mode === "link") s.watched(files.map((f) => [".svelte-language-server-rs/tsgo/svelte/" + f, 1]));
await s.sleep(1500);
s.change("app/src/App.svelte", app + "\n");
out.afterInstall = await s.settle("app/src/App.svelte", 5000);
out.resolved = out.afterInstall.some((d) => d.includes(":2322:"));
console.log(JSON.stringify(out));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
