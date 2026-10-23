// TypeScript syntax errors inside a `generics` attribute of the instance <script> opening tag.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const states = {
  missingType: `<script lang="ts" generics="T extends ">\n\tlet { item }: { item: T } = $props();\n</script>\n<p>{String(item)}</p>\n`,
  strayComma: `<script lang="ts" generics="T extends string,, U">\n\tlet { item }: { item: T } = $props();\n</script>\n<p>{item}</p>\n`,
  unclosedBrace: `<script lang="ts" generics="T extends { a: string ">\n\tlet { item }: { item: T } = $props();\n</script>\n<p>{item.a}</p>\n`,
  semanticOnly: `<script lang="ts" generics="T extends Missing">\n\tlet { item }: { item: T } = $props();\n</script>\n<p>{String(item)}</p>\n`,
};
const files = { "package.json": '{"name":"g","private":true,"type":"module"}', "tsconfig.json": cfg };
for (const [k, v] of Object.entries(states)) files[`${k}.svelte`] = v;
const root = makeProject(tpl, files);
const s = await session(bin, root);
const out = {};
for (const k of Object.keys(states)) { s.open(`${k}.svelte`, states[k]); }
for (const k of Object.keys(states)) {
  const r = await s.request("textDocument/diagnostic", { textDocument: { uri: s.uri(`${k}.svelte`) } });
  await s.sleep(300);
  const r2 = await s.request("textDocument/diagnostic", { textDocument: { uri: s.uri(`${k}.svelte`) } });
  out[k] = (r2?.items ?? []).map((d) => `${d.range.start.line}:${d.range.start.character}-${d.range.end.line}:${d.range.end.character} ${d.source ?? ""} ${d.code ?? ""} ${String(d.message).split("\n")[0].slice(0, 70)}`);
}
console.log(JSON.stringify(out, null, 1));
await s.end(); fs.rmSync(root, { recursive: true, force: true }); process.exit(0);
