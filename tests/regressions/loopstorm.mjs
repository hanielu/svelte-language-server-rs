// A document state tsrs loops on (signatureHelp), asked repeatedly as an editor would while the cursor
// stays there; hovers elsewhere in the same document measure whether tsgo still answers. Records
// restarts, tsrs CPU, and hover latency over time.
import { client } from "./client.mjs";
import { makeProject } from "./h.mjs";
import { execSync } from "node:child_process";
import fs from "node:fs";
const [bin, tpl, loopFile, durArg = "60000", everyArg = "2000"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const child = `<script lang="ts">\n\timport type { Snippet } from 'svelte';\n\tlet { label, count = $bindable(0), children }: { label: string; count?: number; children?: Snippet } = $props();\n</script>\n\n<button onclick={() => count++}>{label} {count}</button>\n{@render children?.()}\n`;
const loopText = fs.readFileSync(loopFile, "utf8");
const root = makeProject(tpl, { "package.json": JSON.stringify({ name: "fz", private: true, type: "module", imports: { "#lib/*": "./src/lib/*" } }), "tsconfig.json": JSON.stringify({ ...JSON.parse(cfg), include: ["src"] }), "src/lib/util.ts": "export const fromUtil: number = 2;\n", "src/Child.svelte": child, "src/Parent.svelte": loopText, "src/Other.svelte": `<script lang="ts">\n\tconst q: number = 1;\n</script>\n<p>{q}</p>\n` });
const c = await client(bin, root);
const td = { uri: c.uri("src/Parent.svelte") }, od = { uri: c.uri("src/Other.svelte") };
c.open("src/Parent.svelte", loopText); c.open("src/Other.svelte", fs.readFileSync(`${root}/src/Other.svelte`, "utf8"));
await c.request("textDocument/diagnostic", { textDocument: td });
const t0 = performance.now(); const ev = [];
const tsrsCpu = () => { try { const pid = execSync(`pgrep -P ${c.proc.pid}`).toString().trim().split("\n")[0]; return execSync(`ps -o %cpu= -p ${pid}`).toString().trim(); } catch { return "?"; } };
let sig = 0;
const timer = setInterval(() => { const t = performance.now(); sig++; c.request("textDocument/signatureHelp", { textDocument: td, position: { line: 5, character: 4 } }).then(() => ev.push(`sig${sig} answered after ${Math.round(performance.now() - t)} ms`), (e) => ev.push(`sig error ${e.message.slice(0, 60)}`)); }, Number(everyArg));
const hovers = [];
while (performance.now() - t0 < Number(durArg)) {
  const t = performance.now();
  const r = await Promise.race([c.request("textDocument/hover", { textDocument: od, position: { line: 1, character: 8 } }).then((h) => (h ? "ok" : "null"), (e) => "err"), c.sleep(90000).then(() => "none")]);
  hovers.push({ at: Math.round((t - t0) / 1000), ms: Math.round(performance.now() - t), r, cpu: tsrsCpu() });
  await c.sleep(1000);
}
clearInterval(timer);
const log = c.log.join("");
const restarts = (log.match(/restarting tsgo[^\n]*/g) ?? []).length;
console.log(JSON.stringify({ sigRequests: sig, restarts, hovers: hovers.map((h) => `${h.at}s:${h.ms}ms:${h.r}:cpu${h.cpu}`), ev: ev.slice(0, 40) }, null, 0));
await c.end(); fs.rmSync(root, { recursive: true, force: true }); process.exit(0);
