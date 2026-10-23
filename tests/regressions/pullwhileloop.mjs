// A request tsrs loops on (signatureHelp in loop22.svelte at 5:4), then diagnostic pulls of the same
// document while it spins (as an editor pulls after every keystroke). Is the pull answered with its
// TS half, does tsgo restart, and how long is the document without TS answers?
// usage: node pullwhileloop.mjs <bin> <tpl> <loopFile> [pullEveryMs=1500] [durMs=40000] [edit=0|1]
import { client, fmtDiag } from "./client.mjs";
import { makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, loopFile, everyArg = "1500", durArg = "40000", editArg = "0"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const child = `<script lang="ts">\n\timport type { Snippet } from 'svelte';\n\tlet { label, count = $bindable(0), children }: { label: string; count?: number; children?: Snippet } = $props();\n</script>\n\n<button onclick={() => count++}>{label} {count}</button>\n{@render children?.()}\n`;
let loopText = fs.readFileSync(loopFile, "utf8");
const root = makeProject(tpl, { "package.json": JSON.stringify({ name: "fz", private: true, type: "module", imports: { "#lib/*": "./src/lib/*" } }), "tsconfig.json": JSON.stringify({ ...JSON.parse(cfg), include: ["src"] }), "src/lib/util.ts": "export const fromUtil: number = 2;\n", "src/Child.svelte": child, "src/Parent.svelte": loopText });
const c = await client(bin, root);
const td = { uri: c.uri("src/Parent.svelte") };
c.open("src/Parent.svelte", loopText);
const first = await c.request("textDocument/diagnostic", { textDocument: td });
const tsCount = (r) => (r?.items ?? []).filter((d) => d.source === "ts" || typeof d.code === "number").length;
const t0 = performance.now(); const ev = [];
const at = () => Math.round((performance.now() - t0) / 100) / 10;
ev.push(`first pull: ${tsCount(first)} ts of ${(first?.items ?? []).length}`);
const s1 = c.request("textDocument/signatureHelp", { textDocument: td, position: { line: 5, character: 4 } }).then((r) => ev.push(`${at()}s sig answered ${JSON.stringify(r)?.slice(0, 40)}`), (e) => ev.push(`${at()}s sig err ${e.message.slice(0, 80)}`));
let n = 0;
while (performance.now() - t0 < Number(durArg)) {
  await c.sleep(Number(everyArg));
  n++;
  if (editArg === "1") { loopText = loopText.replace(/\n$/, "\n "); c.change("src/Parent.svelte", loopText); }
  const k = n, sent = at();
  c.request("textDocument/diagnostic", { textDocument: td }).then((r) => ev.push(`pull${k} sent ${sent}s answered ${at()}s ts=${tsCount(r)} all=${(r?.items ?? []).length}`), (e) => ev.push(`pull${k} err ${at()}s ${e.message.slice(0, 80)}`));
}
await c.sleep(Number(process.env.TAIL ?? 15000));
const log = c.log.join("");
console.log(JSON.stringify({ restarts: (log.match(/restarting tsgo[^\n]*/g) ?? []), notSent: (log.match(/not sending[^\n]*/g) ?? []).length, didNotAnswer: (log.match(/tsgo did not answer[^\n]*/g) ?? []), ev }, null, 1));
await c.end(); fs.rmSync(root, { recursive: true, force: true }); process.exit(0);
