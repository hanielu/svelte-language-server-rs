// Type half-finished statements into an instance script one character at a time. At every state,
// check that diagnostics naming an identifier sit on that identifier, and that hovers on template
// identifiers after the broken statement describe them with a range on them.
import { client, fmtDiag } from "./client.mjs";
import { makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, only] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [], noUnusedLocals: true } });
const head = `<script lang="ts">\n\timport Child from './Child.svelte';\n\tlet { title }: { title: string } = $props();\n\tconst later: number = 1;\n`;
const tail = `\n\tfunction go(x: number) { return x * 2; }\n\tconst missing: string = undefinedName;\n</script>\n\n<Child label={title} />\n<p>{later} {go(later)}</p>\n`;
const snippets = (only ? [only] : [
  "const x = later.", "go(", "if (later) {", "const s = 'abc", "const o = { a: 1, b: }", "let { a, b } = $props(", "import { x } from './Chi",
  "const f = (y: number) =>", "title?.", "for (const i of [1, 2]) {", "const t = `a${", "type T = {", "const arr = [1, 2", "go(later,", "const g = <T>(",
  "const n = later.", "const é = later +", "let z: Record<string,", "class K { m() {", "const w = later\n\t\t.toFixed(", "const q = await ", "export const y = ", "$effect(() => {",
]).map((s) => s.replace(/\\n/g, "\n"));
const root = makeProject(tpl, {
  "package.json": '{"name":"rp","private":true,"type":"module"}', "tsconfig.json": cfg,
  "Child.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n<p>{label}</p>\n`,
  "Doc.svelte": head + tail,
});
const c = await client(bin, root);
const rel = "Doc.svelte";
let text = head + tail;
c.open(rel, text);
const pull = async () => (await c.request("textDocument/diagnostic", { textDocument: { uri: c.uri(rel) } }))?.items ?? [];
for (let i = 0; i < 40; i++) { const d = await pull(); if (d.some((x) => x.code === 2304)) break; await c.sleep(150); }
const at = (t, line, ch) => { const lines = t.split("\n"); let o = 0; for (let i = 0; i < line; i++) o += lines[i].length + 1; return o + ch; };
const rangeText = (t, r) => t.slice(at(t, r.start.line, r.start.character), at(t, r.end.line, r.end.character));
const posOf = (t, needle, nth = 0) => { let i = -1; for (let k = 0; k <= nth; k++) i = t.indexOf(needle, i + 1); const b = t.slice(0, i); return { line: b.split("\n").length - 1, character: i - (b.lastIndexOf("\n") + 1) }; };
const problems = [];
const records = [];
let states = 0;
for (const snippet of snippets) {
  let typed = "";
  const insertAt = head.length + 1; // after "\n" ... start of an empty line we add
  for (const ch of [...snippet]) {
    typed += ch;
    text = head + "\t" + typed + tail;
    c.change(rel, text);
    states++;
    const diags = await pull();
    const rec = { snippet, typed, diags: diags.filter((d) => typeof d.code === "number").map((d) => `${d.code}@${d.range.start.line}:${d.range.start.character}-${d.range.end.line}:${d.range.end.character} ${JSON.stringify(rangeText(text, d.range)).slice(0, 30)} ${String(d.message).split("\n")[0].slice(0, 60)}`).sort(), hovers: {} };
    records.push(rec);
    for (const d of diags) {
      const m = /'([A-Za-z_$À-￿][\w$À-￿]*)'/.exec(String(d.message));
      if (!m || ![2304, 2339, 2551, 6133, 2552, 18004, 2448, 2454, 6196, 7006, 7031, 2300, 2451].includes(d.code)) continue;
      const got = rangeText(text, d.range);
      if (!got.includes(m[1])) problems.push({ snippet, typed, diag: fmtDiag(d), rangeText: got });
    }
    // hovers on identifiers after the broken statement
    for (const [needle, nth, want] of [["{later}", 0, "later"], ["go(later)", 0, "go"], ["undefinedName", 0, null]]) {
      const p = posOf(text, needle, nth);
      const pos = { line: p.line, character: p.character + (needle.startsWith("{") ? 1 : 0) };
      const h = await c.request("textDocument/hover", { textDocument: { uri: c.uri(rel) }, position: pos }).catch(() => null);
      rec.hovers[needle] = h ? `${JSON.stringify(h.contents).slice(0, 60)} @${h.range ? JSON.stringify(rangeText(text, h.range)) : "-"}` : null;
      if (!h) continue;
      const contents = JSON.stringify(h.contents);
      const w = want ?? needle;
      if (!contents.includes(w)) problems.push({ snippet, typed, hoverAt: needle, contents: contents.slice(0, 120) });
      else if (h.range && !rangeText(text, h.range).includes(w)) problems.push({ snippet, typed, hoverAt: needle, hoverRangeText: rangeText(text, h.range), range: h.range });
    }
  }
}
fs.writeFileSync(process.env.OUT ?? "/dev/null", JSON.stringify(records));
const atStart = records.reduce((n, r) => n + r.diags.filter((d) => /@0:1-/.test(d)).length, 0); // diagnostics on `<script` (review 3)
console.log(JSON.stringify({ states, problems: problems.length, atStart }));
await c.end();
fs.rmSync(root, { recursive: true, force: true });
