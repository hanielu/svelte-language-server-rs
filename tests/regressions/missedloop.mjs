// A completion tsrs loops on that the loop model misses (a regex holding a quote on the walk's line),
// in components svelte2tsx rejects (script-only shadows). Sends one completion per component, then
// hovers another component every second: is tsgo ever restarted, and do hovers keep being answered?
// usage: node missedloop.mjs <bin> <tpl> [components=4] [durMs=40000] [regex=/'/]
import { client } from "./client.mjs";
import { makeProject } from "./h.mjs";
import { execSync } from "node:child_process";
import fs from "node:fs";
const [bin, tpl, nArg = "4", durArg = "40000", rx = "/'/"] = process.argv.slice(2);
const N = Number(nArg);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const comp = (i) => `<script lang="ts">\n\tlet a${i} = 1 < 2;\n\tconst r = ${rx}; }c{\n</script>\n<p>{a${i}.</p>\n`;
const files = { "package.json": '{"name":"ml","private":true,"type":"module"}', "tsconfig.json": cfg, "Other.svelte": `<script lang="ts">\n\tconst q: number = 1;\n</script>\n<p>{q}</p>\n` };
for (let i = 0; i < N; i++) files[`L${i}.svelte`] = comp(i);
const root = makeProject(tpl, files);
const c = await client(bin, root);
c.open("Other.svelte", files["Other.svelte"]);
for (let i = 0; i < N; i++) c.open(`L${i}.svelte`, files[`L${i}.svelte`]);
for (let i = 0; i < N; i++) await c.request("textDocument/diagnostic", { textDocument: { uri: c.uri(`L${i}.svelte`) } });
const t0 = performance.now(); const ev = [];
const at = () => Math.round((performance.now() - t0) / 100) / 10;
const line2 = files["L0.svelte"].split("\n")[2];
for (let i = 0; i < N; i++) {
  const character = line2.indexOf("}c{") + 2;
  c.request("textDocument/completion", { textDocument: { uri: c.uri(process.env.SAME ? "L0.svelte" : `L${i}.svelte`) }, position: { line: 2, character }, context: { triggerKind: 1 } }).then((r) => ev.push(`${at()}s completion L${i} answered ${JSON.stringify(r)?.slice(0, 30)}`), (e) => ev.push(`${at()}s completion L${i} err ${e.message.slice(0, 60)}`));
  await c.sleep(300);
}
const tsrsCpu = () => { try { const pid = execSync(`pgrep -P ${c.proc.pid}`).toString().trim().split("\n")[0]; return execSync(`ps -o %cpu= -p ${pid}`).toString().trim(); } catch { return "?"; } };
const hovers = [];
while (performance.now() - t0 < Number(durArg)) {
  const t = performance.now();
  const r = await Promise.race([c.request("textDocument/hover", { textDocument: { uri: c.uri("Other.svelte") }, position: { line: 1, character: 8 } }).then((h) => (h ? "ok" : "null"), () => "err"), c.sleep(60000).then(() => "none")]);
  hovers.push(`${Math.round((t - t0) / 1000)}s:${Math.round(performance.now() - t)}ms:${r}:cpu${tsrsCpu()}`);
  await c.sleep(1000);
}
const log = c.log.join("");
console.log(JSON.stringify({ restarts: log.match(/restarting tsgo[^\n]*/g) ?? [], didNotAnswer: log.match(/tsgo did not answer[^\n]*/g) ?? [], ev, hovers }, null, 1));
await c.end(); fs.rmSync(root, { recursive: true, force: true }); process.exit(0);
