// A component whose TypeScript check legitimately takes long (a heavy module it reads every export of).
// Does the server get its TypeScript diagnostics to the editor, or restart tsgo on a request that is
// slow but alive? Pulls once at open, then the user edits every EDIT_EVERY ms.
import { client } from "./client.mjs";
import { makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, aliasesArg = "6", durationArg = "40000"] = process.argv.slice(2);
const A = Number(aliasesArg);
let heavy = "";
for (let a = 0; a < A; a++) { heavy += `type B${a}<N extends number, T extends unknown[] = []> = T["length"] extends N ? T : B${a}<N, [...T, ${a}]>;\n`; for (let i = 0; i < 500; i++) heavy += `export const a${a}_${i}: B${a}<${999 - i}>["length"] = ${999 - i};\n`; }
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const comp = (n) => `<script lang="ts">\n\timport * as H from './heavy';\n\tconst all: Record<string, number> = H;\n\tconst bad: number = 'x${n}';\n</script>\n<p>{all.a0_0}{bad}</p>\n`;
const root = makeProject(tpl, { "package.json": '{"name":"sl","private":true,"type":"module"}', "tsconfig.json": cfg, "heavy.ts": heavy, "Comp.svelte": comp(0) });
const c = await client(bin, root);
const td = { uri: c.uri("Comp.svelte") };
const t0 = performance.now();
const events = [];
c.open("Comp.svelte", comp(0));
let firstTs = null, n = 0;
const pull = (label) => { const t = performance.now(); return c.request("textDocument/diagnostic", { textDocument: td }).then((r) => { const ts = (r?.items ?? []).some((d) => d.code === 2322); events.push(`${label} at ${Math.round(t - t0)} -> ${Math.round(performance.now() - t0)} ms ts2322=${ts} n=${(r?.items ?? []).length}`); if (ts && firstTs === null) firstTs = Math.round(performance.now() - t0); }, (e) => events.push(`${label} error ${e.message.slice(0, 80)}`)); };
pull("open");
const every = Number(process.env.EDIT_EVERY ?? 0);
while (performance.now() - t0 < Number(durationArg)) {
  await c.sleep(every || 1000);
  if (every) { c.change("Comp.svelte", comp(++n)); pull(`edit${n}`); }
}
await c.sleep(1000);
const log = c.log.join("");
console.log(JSON.stringify({ aliases: A, firstTs2322Ms: firstTs, events, didNotAnswer: (log.match(/tsgo did not answer[^\n]*/g) ?? []), restarts: (log.match(/restarting tsgo/g) ?? []).length }, null, 1));
await c.end();
fs.rmSync(root, { recursive: true, force: true });
