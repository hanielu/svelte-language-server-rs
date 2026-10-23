// Send each input as a didChange of one document; list the inputs after which a projection panic is logged.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
import path from "node:path";
const [bin, tpl, dir, filter = ""] = process.argv.slice(2);
const inputs = fs.readdirSync(dir).filter((n) => n.endsWith(".svelte") && n.includes(filter)).sort().map((n) => path.join(dir, n));
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const clean = `<script lang="ts">\n\tconst n: number = 1;\n</script>\n<p>{n}</p>\n`;
const root = makeProject(tpl, { "package.json": '{"name":"r5","private":true,"type":"module"}', "tsconfig.json": cfg, "Doc.svelte": clean });
const s = await session(bin, root);
s.open("Doc.svelte", clean);
await s.settle("Doc.svelte");
const count = () => s.log.join("").split("\n").filter((l) => /panicked at/.test(l) && !/css.rs/.test(l)).length;
const hits = [];
for (const file of inputs) {
  const before = count();
  s.change("Doc.svelte", fs.readFileSync(file, "utf8"));
  await s.request("textDocument/hover", { textDocument: { uri: s.uri("Doc.svelte") }, position: { line: 0, character: 1 } }).catch(() => {});
  if (count() > before) { const line = s.log.join("").split("\n").filter((l) => /panicked at/.test(l) && !/css.rs/.test(l)).pop(); hits.push(`${path.basename(file)} ${line.replace(/.*panicked at /, "")}`); }
}
console.log(JSON.stringify({ inputs: inputs.length, hits }, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
