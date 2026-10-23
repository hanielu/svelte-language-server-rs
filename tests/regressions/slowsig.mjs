// slow.mjs's heavy module, read by a call: `take(H)` checks H against Record<string, number>, which is
// what makes the component's check slow. One signature help (or go-to-definition) on that call while
// the pull's check runs, then a cheap hover in the same document every 5 s. The client supports
// diagnostic refresh and pulls again when asked. When does the TypeScript error reach the editor?
import { client } from "./client.mjs";
import { makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, aliasesArg = "36", mode = "signature", durArg = "120000"] = process.argv.slice(2);
const A = Number(aliasesArg);
let heavy = "";
for (let a = 0; a < A; a++) { heavy += `type B${a}<N extends number, T extends unknown[] = []> = T["length"] extends N ? T : B${a}<N, [...T, ${a}]>;\n`; for (let i = 0; i < 500; i++) heavy += `export const a${a}_${i}: B${a}<${999 - i}>["length"] = ${999 - i};\n`; }
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const comp = `<script lang="ts">\n\timport * as H from './heavy';\n\tfunction take(r: Record<string, number>) { return r; }\n\tconst bad: number = 'x';\n\ttake(H);\n</script>\n<p>{bad}</p>\n`;
const root = makeProject(tpl, { "package.json": '{"name":"sl","private":true,"type":"module"}', "tsconfig.json": cfg, "heavy.ts": heavy, "Comp.svelte": comp });
const c = await client(bin, root, { extraCaps: { workspace: { diagnostics: { refreshSupport: true } } } });
const td = { uri: c.uri("Comp.svelte") };
const t0 = performance.now(); const now = () => Math.round((performance.now() - t0) / 1000);
const ev = []; let firstTs = null;
c.open("Comp.svelte", comp);
const pull = (label) => { const t = now(); c.request("textDocument/diagnostic", { textDocument: td }).then((r) => { const ts = (r?.items ?? []).some((d) => d.code === 2322); ev.push(`${label}@${t}s -> ${now()}s ts2322=${ts}`); if (ts && firstTs === null) firstTs = now(); }, (e) => ev.push(`${label} error ${e.message.slice(0, 60)}`)); };
pull("open");
await c.sleep(2000);
{ const t = now(); const [m, p] = mode === "signature" ? ["textDocument/signatureHelp", { textDocument: td, position: { line: 4, character: 7 } }] : ["textDocument/definition", { textDocument: td, position: { line: 4, character: 2 } }];
  c.request(m, p).then((r) => ev.push(`${mode}@${t}s -> ${now()}s ${JSON.stringify(r)?.slice(0, 50)}`), (e) => ev.push(`${mode}@${t}s error ${e.message.slice(0, 60)}`)); }
let seenRefresh = 0, nextHover = 5000;
while (performance.now() - t0 < Number(durArg)) {
  await c.sleep(250);
  const refreshes = c.serverRequests.filter((r) => r.method === "workspace/diagnostic/refresh").length;
  if (refreshes > seenRefresh) { seenRefresh = refreshes; pull(`refresh${refreshes}`); }
  if (performance.now() - t0 >= nextHover) { nextHover += 5000; const t = now(); c.request("textDocument/hover", { textDocument: td, position: { line: 3, character: 8 } }).then((r) => { if (now() - t > 1) ev.push(`hover@${t}s -> ${now()}s ${r ? "ok" : "null"}`); }, (e) => ev.push(`hover@${t}s error ${e.message.slice(0, 60)}`)); }
}
const log = c.log.join("");
console.log(JSON.stringify({ aliases: A, mode, firstTs2322s: firstTs, ev, didNotAnswer: (log.match(/tsgo did not answer[^\n]*/g) ?? []), restarts: (log.match(/restarting tsgo[^\n]*/g) ?? []), refreshes: seenRefresh }, null, 1));
await c.end(); fs.rmSync(root, { recursive: true, force: true }); process.exit(0);
