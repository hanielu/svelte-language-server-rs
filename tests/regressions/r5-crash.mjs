// R5 (round-2 review): a document whose projection panics must not take the server down.
// Usage: node r5-crash.mjs <server-binary> <tpl> [input.svelte | directory]...
// With no input it uses the reviewer's case: a no-break space typed into `$props(` (Option+Space).
// Every input is sent as a didChange of one open document in one session, each followed by a
// hover that must be answered within 5 s.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
import path from "node:path";

const [bin, tpl, ...args] = process.argv.slice(2);
const inputs = [];
for (const arg of args) {
  if (fs.statSync(arg).isDirectory()) {
    for (const name of fs.readdirSync(arg).sort()) if (name.endsWith(".svelte")) inputs.push(path.join(arg, name));
  } else inputs.push(arg);
}
const texts = inputs.length
  ? inputs.map((file) => [file, fs.readFileSync(file, "utf8")])
  : [
      ["nbsp-in-props", '<script lang="ts">\n\tlet { b = $bindable() } = $props( </script>\n'],
      ["ideographic-space-in-props", '<script lang="ts">\n\tlet { b } = $props(　</script>\n'],
      ["e-acute-in-props", '<script lang="ts">\n\tlet { b = $bindable() } = $props(é</script>\n'],
    ];
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const clean = `<script lang="ts">\n\tconst n: number = 1;\n</script>\n<p>{n}</p>\n`;
const root = makeProject(tpl, { "package.json": '{"name":"r5","private":true,"type":"module"}', "tsconfig.json": cfg, "Doc.svelte": clean });
const s = await session(bin, root);
const out = { inputs: texts.length, answered: 0, unanswered: [] };
s.open("Doc.svelte", clean);
out.before = await s.settle("Doc.svelte");
for (const [name, text] of texts) {
  s.change("Doc.svelte", text);
  const alive = await Promise.race([
    s.request("textDocument/hover", { textDocument: { uri: s.uri("Doc.svelte") }, position: { line: 0, character: 1 } }).then(() => "answered", (e) => "error " + e.message.slice(0, 80)),
    s.sleep(5000).then(() => "no answer in 5 s"),
  ]);
  if (alive === "answered") out.answered++;
  else {
    out.unanswered.push(`${name}: ${alive}`);
    break; // the server is gone
  }
}
out.panicsCaught = s.log.join("").split("\n").filter((l) => /svelte2tsx panicked/.test(l)).length;
out.ok = out.answered === texts.length;
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
