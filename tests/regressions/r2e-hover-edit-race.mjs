// R2e: hovers sent at version v and immediately followed by a didChange that inserts a line at the
// top, without any probe. The hover takes the native worker first and tsgo second; if the edit
// reached tsgo first, tsgo described the symbol one line below. Usage: node r2e-hover-edit-race.mjs <bin> <tpl> [rounds]
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, rounds = "10"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const parent = `<script lang="ts">\n\tconst later: number = 1;\n\tconst other: string = 'x';\n</script>\n\n<p>{later}</p>\n<p>{other}</p>\n`;
const root = makeProject(tpl, { "package.json": '{"name":"np","private":true,"type":"module"}', "tsconfig.json": cfg, "P.svelte": parent });
const s = await session(bin, root);
s.open("P.svelte", parent);
await s.settle("P.svelte");
const td = { uri: s.uri("P.svelte") };
const hover = (l, c) => s.request("textDocument/hover", { textDocument: td, position: { line: l, character: c } }).then((h) => h ? JSON.stringify(h.contents).replace(/\\n|```|typescript|"/g, "") : null);
let wrong = 0; let text = parent; let off = 0;
for (let i = 0; i < Number(rounds); i++) {
  const during = [hover(5 + off, 5), hover(6 + off, 5)];
  text = "<p>{other}</p>\n" + text; off++;
  s.change("P.svelte", text);
  const r = await Promise.all(during);
  if (!(r[0]?.includes("later") && r[1]?.includes("other"))) { wrong++; console.log(i, r); }
  await s.sleep(300);
}
console.log(JSON.stringify({ rounds: Number(rounds), wrong }));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
