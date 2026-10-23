// Half-typed statements whose syntax errors the final build reports at line 0, character 1.
import { client } from "./client.mjs";
import { makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const head = `<script lang="ts">\n\timport Child from './Child.svelte';\n\tlet { title }: { title: number } = $props();\n`;
const tail = `\n\tfunction go(x: number) { return x * 2; }\n</script>\n\n<Child label={title} />\n<p>{go(1)}</p>\n`;
const states = ["import {", "import { ", "import { x", "import {}", "import { x }", "import type {", "type T = {"];
const root = makeProject(tpl, { "package.json": '{"name":"sf","private":true,"type":"module"}', "tsconfig.json": cfg,
  "Child.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n<p>{label}</p>\n`, "Doc.svelte": head + tail });
const c = await client(bin, root);
c.open("Doc.svelte", head + tail);
const pull = async () => (await c.request("textDocument/diagnostic", { textDocument: { uri: c.uri("Doc.svelte") } }))?.items ?? [];
for (let i = 0; i < 40; i++) { if ((await pull()).length === 0) { await c.sleep(150); } else break; }
await c.sleep(1000);
const out = {};
for (const st of states) {
  c.change("Doc.svelte", head + "\t" + st + tail);
  let d = []; for (let i = 0; i < 3; i++) { d = await pull(); await c.sleep(100); }
  out[st] = d.filter((x) => typeof x.code === "number").map((x) => `${x.range.start.line}:${x.range.start.character}-${x.range.end.line}:${x.range.end.character} ${x.code}`).join(", ");
}
console.log(JSON.stringify(out, null, 1));
await c.end();
fs.rmSync(root, { recursive: true, force: true });
