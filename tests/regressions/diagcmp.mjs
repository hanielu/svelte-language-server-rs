// Diagnostics of several component texts. usage: node diagcmp.mjs <bin> <tpl> <cases.json>  (cases: {name: text})
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, casesFile] = process.argv.slice(2);
const cases = JSON.parse(fs.readFileSync(casesFile, "utf8"));
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const files = { "package.json": '{"name":"dc","private":true,"type":"module"}', "tsconfig.json": cfg };
for (const [n, t] of Object.entries(cases)) files[`${n}.svelte`] = t;
const root = makeProject(tpl, files);
const s = await session(bin, root);
const out = {};
for (const [n, t] of Object.entries(cases)) { s.open(`${n}.svelte`, t); }
for (const [n, t] of Object.entries(cases)) {
  await s.settle(`${n}.svelte`, 8000);
  const r = await s.request("textDocument/diagnostic", { textDocument: { uri: s.uri(`${n}.svelte`) } });
  out[n] = (r?.items ?? []).map((d) => `${d.range.start.line}:${d.range.start.character}-${d.range.end.line}:${d.range.end.character} ${d.source ?? ""} ${d.code ?? ""} ${String(d.message).split("\n")[0].slice(0, 70)}`);
}
console.log(JSON.stringify(out, null, 1));
await s.end(); if (process.env.KEEP) { fs.cpSync(root + "/.svelte-rs", process.env.KEEP, { recursive: true }); } fs.rmSync(root, { recursive: true, force: true }); process.exit(0);
