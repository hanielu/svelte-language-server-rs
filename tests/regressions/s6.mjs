// S6: a JavaScript component already open as an activation buffer (version 0), then opened by an
// editor that starts versions at 0 (Zed): does the editor text reach tsgo?
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, allowJs: true, checkJs: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const js = (extra) => `<script>\n\t/** @type {{ label: string }} */\n\tlet { label } = $props();\n${extra}</script>\n\n<p>{label}</p>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"s6","private":true,"type":"module"}',
  "app/tsconfig.json": cfg,
  "app/A.svelte": `<script lang="ts">\n\tconst a: number = 1;\n</script>\n<p>{a}</p>\n`,
  "app/J.svelte": js(""),
});
const s = await session(bin, root);
const out = {};
s.open("app/A.svelte"); // activates the project: J becomes a javascriptreact buffer at version 0
await s.settle("app/A.svelte");
// Zed opens documents at version 0.
s.send({ method: "textDocument/didOpen", params: { textDocument: { uri: s.uri("app/J.svelte"), languageId: "svelte", version: 0, text: js("\t/** @type {number} */\n\tconst n = 'not a number';\n") } } });
out.openedAtVersion0 = await s.settle("app/J.svelte", 5000);
s.send({ method: "textDocument/didChange", params: { textDocument: { uri: s.uri("app/J.svelte"), version: 1 }, contentChanges: [{ text: js("\t/** @type {number} */\n\tconst n = 'still not';\n") }] } });
out.afterChangeVersion1 = await s.settle("app/J.svelte", 5000);
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
