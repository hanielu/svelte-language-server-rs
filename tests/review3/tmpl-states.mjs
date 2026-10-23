// Half-typed template block headers (with and without the editor's auto-closed brace): diagnostics.
import { client } from "./client.mjs";
import { makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [], noUnusedLocals: true } });
const head = `<script lang="ts">\n\timport Child from './Child.svelte';\n\tlet { title }: { title: string } = $props();\n\tconst later: number = 1;\n\tfunction go(x: number) { return x * 2; }\n</script>\n\n<Child label={title} />\n`;
const tail = `\n<p>{later} {go(later)}</p>\n`;
const states = (process.env.STATES ? JSON.parse(process.env.STATES) : ["{#each [1, 2] as x,", "{#each [1, 2] as x,}", "{#each [1, 2] as x, }", "{#each [1, 2] as x, i}", "{#each [1, 2] as x, i (x)}", "{#each [1, 2] as x, i (x)}{/each}", "{#snippet s(a: number)}", "{#snippet s(a: number)}{/snippet}", "{#snippet s(a: number)}<p>{a}</p>"]);
const root = makeProject(tpl, { "package.json": '{"name":"ts","private":true,"type":"module"}', "tsconfig.json": cfg,
  "Child.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n<p>{label}</p>\n`, "Doc.svelte": head + tail });
const c = await client(bin, root);
c.open("Doc.svelte", head + tail);
const pull = async () => (await c.request("textDocument/diagnostic", { textDocument: { uri: c.uri("Doc.svelte") } }))?.items ?? [];
for (let i = 0; i < 30; i++) { await pull(); await c.sleep(150); }
const out = {};
for (const st of states) {
  const text = head + st + tail;
  c.change("Doc.svelte", text);
  let d = []; for (let i = 0; i < 3; i++) { d = await pull(); await c.sleep(100); }
  const lines = text.split("\n");
  out[st] = d.filter((x) => typeof x.code === "number").map((x) => `${x.range.start.line}:${x.range.start.character}-${x.range.end.line}:${x.range.end.character} ${x.code} ${JSON.stringify(lines[x.range.start.line]?.slice(x.range.start.character, x.range.end.line === x.range.start.line ? x.range.end.character : undefined))}`).join(", ");
}
console.log(JSON.stringify(out, null, 1));
await c.end();
fs.rmSync(root, { recursive: true, force: true });
