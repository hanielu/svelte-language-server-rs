// Minimise an input that makes the projection panic (through the server), keeping the panic location.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, file, where] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const clean = `<script lang="ts">\n\tconst n: number = 1;\n</script>\n<p>{n}</p>\n`;
const root = makeProject(tpl, { "package.json": '{"name":"mn","private":true,"type":"module"}', "tsconfig.json": cfg, "Doc.svelte": clean });
const s = await session(bin, root);
s.open("Doc.svelte", clean);
await s.settle("Doc.svelte");
const count = () => s.log.join("").split("\n").filter((l) => l.includes(where)).length;
async function panics(text) {
  const before = count();
  s.change("Doc.svelte", text);
  await s.request("textDocument/hover", { textDocument: { uri: s.uri("Doc.svelte") }, position: { line: 0, character: 1 } }).catch(() => {});
  return count() > before;
}
let cur = fs.readFileSync(file, "utf8");
if (!(await panics(cur))) { console.log("does not reproduce"); process.exit(1); }
// ddmin over chunks (chars, keeping surrogate pairs)
let chunk = Math.max(1, Math.floor(cur.length / 2));
while (chunk >= 1) {
  let progressed = false;
  for (let i = 0; i < cur.length; ) {
    const cand = cur.slice(0, i) + cur.slice(i + chunk);
    if (cand.length < cur.length && await panics(cand)) { cur = cand; progressed = true; } else i += chunk;
  }
  if (!progressed) chunk = Math.floor(chunk / 2);
}
console.log(JSON.stringify(cur));
fs.writeFileSync(file.replace(/\.svelte$/, ".min.svelte"), cur);
await s.end();
fs.rmSync(root, { recursive: true, force: true });
