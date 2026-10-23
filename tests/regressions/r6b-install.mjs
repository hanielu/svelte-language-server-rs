// R6b: a package installed while the editor runs resolves only if tsgo hears about node_modules.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, sendEvent = "yes"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const app = `<script lang="ts">\n\timport { later } from 'not-installed-yet';\n\tconst s: string = later;\n</script>\n<p>{s}</p>\n`;
const root = makeProject(tpl, { "package.json": '{"name":"r6b","private":true,"type":"module"}', ".gitignore": "node_modules\n", "tsconfig.json": cfg, "src/App.svelte": app });
const s = await session(bin, root);
const out = {};
s.open("src/App.svelte", app);
out.before = await s.settle("src/App.svelte");
// `bun add not-installed-yet`
s.write("node_modules/not-installed-yet/package.json", '{"name":"not-installed-yet","types":"./index.d.ts"}');
s.write("node_modules/not-installed-yet/index.d.ts", "export declare const later: number;\n");
if (sendEvent === "yes") s.watched([["node_modules/not-installed-yet", 1], ["node_modules/not-installed-yet/package.json", 1], ["node_modules/not-installed-yet/index.d.ts", 1]]);
await s.sleep(1500);
// The user keeps typing in the file (content-only change).
s.change("src/App.svelte", app + "\n");
out.afterInstall = await s.settle("src/App.svelte", 5000);
console.log(JSON.stringify(out));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
