// S5: cost of JavaScript-component activation. N components, either all `lang="ts"` or all plain
// JS/markup-only, that import each other in a chain (shape "chain": the opened file reaches every
// one) or not at all (shape "flat": it reaches none); time to first diagnostics of one file.
// usage: node s5.mjs <binary> <tpl> [ts|js] [N] [chain|flat]
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
import { execSync } from "node:child_process";
const [bin, tpl, kind = "ts", n = "400", shape = "chain"] = process.argv.slice(2);
const N = Number(n);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [], allowJs: true, checkJs: true } });
const files = { "package.json": '{"name":"s5","private":true,"type":"module"}', "app/tsconfig.json": cfg };
for (let i = 0; i < N; i++) {
  const linked = shape === "chain" && i + 1 < N;
  const next = linked ? `\timport Next from './C${i + 1}.svelte';\n` : "";
  const use = linked ? `<Next label="x" />` : "";
  files[`app/C${i}.svelte`] = kind === "ts"
    ? `<script lang="ts">\n${next}\tlet { label }: { label: string } = $props();\n</script>\n\n<p>{label}</p>${use}\n`
    : `<script>\n${next}\t/** @type {{ label: string }} */\n\tlet { label } = $props();\n</script>\n\n<p>{label}</p>${use}\n`;
}
const root = makeProject(tpl, files);
const s = await session(bin, root);
const t0 = performance.now();
s.open("app/C0.svelte");
let d;
for (;;) { d = await s.diags("app/C0.svelte"); if (d.length >= 0 && performance.now() - t0 > 0) break; }
const first = Math.round(performance.now() - t0);
await s.sleep(1500);
const rss = execSync(`ps -o rss=,comm= -p $(pgrep -d, -f "${root}" || echo 1) 2>/dev/null || true`).toString();
const tree = execSync(`ps -axo pid=,ppid=,rss=,comm=`).toString().split("\n").filter(Boolean).map((l) => l.trim().split(/\s+/));
const me = String(process.pid);
const kids = (pid) => tree.filter((r) => r[1] === pid);
let total = 0; const per = [];
const walk = (pid) => { for (const r of kids(pid)) { total += Number(r[2]); per.push(`${r[3].split("/").pop()}=${Math.round(Number(r[2]) / 1024)}MB`); walk(r[0]); } };
walk(me);
console.log(JSON.stringify({ kind, shape, N, firstDiagnosticsMs: first, diags: d.length, processes: per, totalMB: Math.round(total / 1024) }));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
