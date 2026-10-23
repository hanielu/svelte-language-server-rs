// slow.mjs's component (a module whose check takes seconds), with the requests an editor sends besides
// the pull: which ones does tsrs answer only after the check, and does the server restart tsgo for them?
import { client } from "./client.mjs";
import { makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, aliasesArg = "6", kindsArg = "all", durArg = "25000"] = process.argv.slice(2);
const A = Number(aliasesArg);
let heavy = "";
for (let a = 0; a < A; a++) { heavy += `type B${a}<N extends number, T extends unknown[] = []> = T["length"] extends N ? T : B${a}<N, [...T, ${a}]>;\n`; for (let i = 0; i < 500; i++) heavy += `export const a${a}_${i}: B${a}<${999 - i}>["length"] = ${999 - i};\n`; }
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const comp = `<script lang="ts">\n\timport * as H from './heavy';\n\tconst all: Record<string, number> = H;\n\tconst bad: number = 'x';\n\tfunction take(r: Record<string, number>) { return r; }\n\ttake(H);\n</script>\n<p>{all.a0_0}{bad}</p>\n`;
const root = makeProject(tpl, { "package.json": '{"name":"sl","private":true,"type":"module"}', "tsconfig.json": cfg, "heavy.ts": heavy, "Comp.svelte": comp });
const c = await client(bin, root);
const td = { uri: c.uri("Comp.svelte") };
c.open("Comp.svelte", comp);
const t0 = performance.now();
const ev = [];
const timed = (label, p) => { const t = performance.now(); return p.then((r) => ev.push(`${label}: ${Math.round(performance.now() - t)} ms ${JSON.stringify(r)?.slice(0, 60)}`), (e) => ev.push(`${label}: error after ${Math.round(performance.now() - t)} ms ${e.message.slice(0, 70)}`)); };
timed("pull", c.request("textDocument/diagnostic", { textDocument: td }));
await c.sleep(Number(process.env.DELAY ?? 200));
const bad = { range: { start: { line: 3, character: 7 }, end: { line: 3, character: 10 } }, severity: 1, code: 2322, source: "ts", message: "Type 'string' is not assignable to type 'number'." };
const kinds = {
  codeActionQuick: ["textDocument/codeAction", { textDocument: td, range: bad.range, context: { diagnostics: [bad] } }],
  codeActionPlain: ["textDocument/codeAction", { textDocument: td, range: { start: { line: 5, character: 2 }, end: { line: 5, character: 2 } }, context: { diagnostics: [] } }],
  codeActionFixAll: ["textDocument/codeAction", { textDocument: td, range: { start: { line: 0, character: 0 }, end: { line: 7, character: 0 } }, context: { diagnostics: [], only: ["source.fixAll"] } }],
  organizeImports: ["textDocument/codeAction", { textDocument: td, range: { start: { line: 0, character: 0 }, end: { line: 7, character: 0 } }, context: { diagnostics: [], only: ["source.organizeImports"] } }],
  inlay: ["textDocument/inlayHint", { textDocument: td, range: { start: { line: 0, character: 0 }, end: { line: 8, character: 0 } } }],
  semantic: ["textDocument/semanticTokens/full", { textDocument: td }],
  signature: ["textDocument/signatureHelp", { textDocument: td, position: { line: 5, character: 7 } }],
  completionMember: ["textDocument/completion", { textDocument: td, position: { line: 7, character: 9 }, context: { triggerKind: 2, triggerCharacter: "." } }],
  definition: ["textDocument/definition", { textDocument: td, position: { line: 5, character: 3 } }],
  hoverAll: ["textDocument/hover", { textDocument: td, position: { line: 2, character: 8 } }],
};
const pickKinds = kindsArg === "all" ? Object.keys(kinds) : kindsArg.split(",");
for (const k of pickKinds) timed(k, c.request(...kinds[k]));
const hov = [];
while (performance.now() - t0 < Number(durArg)) { await c.sleep(1000); const t = performance.now(); await c.request("textDocument/hover", { textDocument: td, position: { line: 3, character: 8 } }).then((h) => hov.push(`${Math.round((t - t0) / 1000)}s:${Math.round(performance.now() - t)}ms:${h ? "ok" : "null"}`), () => hov.push("err")); }
const log = c.log.join("");
console.log(JSON.stringify({ aliases: A, ev, hovers: hov.join(" "), didNotAnswer: log.match(/tsgo did not answer[^\n]*/g), restarts: log.match(/restarting tsgo[^\n]*/g), refresh: c.serverRequests.filter((r) => r.method === "workspace/diagnostic/refresh").length }, null, 1));
await c.end(); fs.rmSync(root, { recursive: true, force: true }); process.exit(0);
