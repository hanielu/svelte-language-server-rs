// Rename / references / definition driver for one case file.
// usage: node rn.mjs <bin> <tpl> <case.json>
// case: { files: {rel: text}, open: [rel...], queries: [{ file, at: "needle", nth?: 0, offset?: 0, newName }] }
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, caseFile] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(caseFile, "utf8"));
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const files = { "package.json": '{"name":"rn","private":true,"type":"module"}', "tsconfig.json": cfg, ...C.files };
const root = makeProject(tpl, files);
const s = await session(bin, root);
const texts = { ...C.files };
for (const rel of C.open) s.open(rel, texts[rel], rel.endsWith(".ts") ? "typescript" : "svelte");
for (const rel of C.open) if (rel.endsWith(".svelte")) await s.settle(rel, Number(process.env.SETTLE ?? 6000));
await s.sleep(Number(process.env.EXTRA_WAIT ?? 500));
const posOf = (text, idx) => { const b = text.slice(0, idx); return { line: b.split("\n").length - 1, character: idx - (b.lastIndexOf("\n") + 1) }; };
const idxOf = (text, p) => text.split("\n").slice(0, p.line).reduce((a, l) => a + l.length + 1, 0) + p.character;
const rel = (u) => u.slice(u.indexOf(root) + root.length + 1);
const fmtR = (r) => `${r.start.line}:${r.start.character}-${r.end.line}:${r.end.character}`;
const out = { diags: {} };
for (const r of C.open) if (r.endsWith(".svelte")) out.diags[r] = await s.diags(r);
for (const q of C.queries) {
  const text = texts[q.file];
  let i = -1; for (let k = 0; k <= (q.nth ?? 0); k++) i = text.indexOf(q.at, i + 1);
  if (i < 0) { out[q.at] = "needle not found"; continue; }
  const position = posOf(text, i + (q.offset ?? 0));
  const td = { uri: s.uri(q.file) };
  const res = { at: `${q.file} ${position.line}:${position.character}` };
  const rn = await s.request("textDocument/rename", { textDocument: td, position, newName: q.newName }).catch((e) => ({ error: e.message.slice(0, 200) }));
  const edits = {};
  for (const [u, list] of Object.entries(rn?.changes ?? {})) (edits[rel(u)] ??= []).push(...list);
  for (const dc of rn?.documentChanges ?? []) if (dc.edits) (edits[rel(dc.textDocument.uri)] ??= []).push(...dc.edits);
  res.rename = rn?.error ?? Object.fromEntries(Object.entries(edits).map(([f, l]) => [f, l.map((e) => `${fmtR(e.range)} ${e.newText}`)]));
  res.after = {};
  for (const [f, list] of Object.entries(edits)) {
    let t = texts[f] ?? fs.readFileSync(`${root}/${f}`, "utf8");
    const orig = t;
    for (const e of [...list].sort((a, b) => idxOf(orig, b.range.start) - idxOf(orig, a.range.start))) t = t.slice(0, idxOf(orig, e.range.start)) + e.newText + t.slice(idxOf(orig, e.range.end));
    const ol = orig.split("\n"), nl = t.split("\n");
    res.after[f] = nl.map((l, k) => (l !== ol[k] ? `${k}: ${l}` : null)).filter(Boolean);
  }
  const refs = await s.request("textDocument/references", { textDocument: td, position, context: { includeDeclaration: true } }).catch((e) => ({ error: e.message }));
  res.references = Array.isArray(refs) ? refs.map((l) => `${rel(l.uri)} ${fmtR(l.range)}`).sort() : refs;
  const def = await s.request("textDocument/definition", { textDocument: td, position }).catch((e) => ({ error: e.message }));
  const defs = def == null ? [] : Array.isArray(def) ? def : [def];
  res.definition = defs.map((l) => `${rel(l.uri ?? l.targetUri)} ${fmtR(l.targetSelectionRange ?? l.range)}`);
  const hl = await s.request("textDocument/documentHighlight", { textDocument: td, position }).catch((e) => ({ error: e.message }));
  res.highlights = Array.isArray(hl) ? hl.map((h) => fmtR(h.range)).sort() : hl;
  out[`${q.file}@${q.at}${q.nth ? "#" + q.nth : ""}`] = res;
}
console.log(JSON.stringify(out, null, 1));
await s.end(); if (!process.env.KEEP) fs.rmSync(root, { recursive: true, force: true }); else console.error("kept", root);
process.exit(0);
