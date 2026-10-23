// How many didChange notifications reach tsgo per editor keystroke?
import { client } from "./client.mjs";
import { makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const parent = `<script lang="ts">\n\timport Child from './Child.svelte';\n\tconst later: number = 1;\n</script>\n\n<Child label="x" />\n<p>{later}</p>\n`;
const root = makeProject(tpl, { "package.json": '{"name":"dc","private":true,"type":"module"}', "tsconfig.json": cfg,
  "Child.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n<p>{label}</p>\n`, "Parent.svelte": parent });
const c = await client(bin, root);
c.open("Parent.svelte", parent);
await c.request("textDocument/diagnostic", { textDocument: { uri: c.uri("Parent.svelte") } });
await c.sleep(2500);
for (let k = 0; k < 5; k++) { c.changeRange("Parent.svelte", { start: { line: 6, character: 3 + k }, end: { line: 6, character: 3 + k } }, "x"); await c.sleep(300); }
await c.sleep(500);
await c.end();
fs.rmSync(root, { recursive: true, force: true });
