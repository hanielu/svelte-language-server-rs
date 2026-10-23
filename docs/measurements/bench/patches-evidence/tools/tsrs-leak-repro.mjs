// Rebuild-loop against a project: open one file, pull, then N x (open+close a new file under include) with sampling.
import { startServer, sleep, uri } from "/Users/hyprsonic/Developer/adroyt/svelte-rs/bench/lspc.mjs";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const [root, target, n = "200", every = "50"] = process.argv.slice(2);
const bin = process.env.TSRS ?? `${process.env.HOME}/.bun/install/global/node_modules/@tsrs/darwin-arm64/tsrs`;
const s = startServer(bin, ["--lsp", "--stdio"], root, { log: false });
if (process.env.STDERR) { const { createWriteStream } = await import("node:fs"); s.child.stderr.pipe(createWriteStream(process.env.STDERR)); }
await s.init(root, process.env.NOPUSH ? { disablePushDiagnostics: true } : {});
const fp = () => { const t = execFileSync("footprint", [String(s.child.pid)], { encoding: "utf8" }); const m = /Footprint: ([\d.]+) (KB|MB|GB)/.exec(t); return Math.round(Number(m[1]) * (m[2] === "GB" ? 1024 : m[2] === "KB" ? 1 / 1024 : 1)); };
s.open(target, readFileSync(target, "utf8"));
await s.pull(target); await sleep(1500);
const out = [{ i: 0, fp: fp() }];
for (let i = 1; i <= Number(n); i++) {
  if (process.env.MODE === "import") {
    const base = readFileSync(target, "utf8");
    s.notify("textDocument/didChange", { textDocument: { uri: uri(target), version: 1 + i }, contentChanges: [{ text: base + (i % 2 ? `\nimport "./__missing_${i}";\n` : "") }] });
    await s.pull(target);
  } else if (process.env.MODE === "content") {
    const base = readFileSync(target, "utf8");
    s.notify("textDocument/didChange", { textDocument: { uri: uri(target), version: 1 + i }, contentChanges: [{ text: base + `\nexport const __edit${i} = ${i};\n` }] });
    await s.pull(target);
  } else {
    const p = `${root}/${process.env.PROBE_DIR ?? "src"}/__probe_${i}.ts`;
    s.open(p, `export const probe${i} = ${i};\n`);
    s.notify("textDocument/didClose", { textDocument: { uri: uri(p) } });
  }
  if (i % Number(every) === 0) { await s.pull(target); await sleep(1500); out.push({ i, fp: fp() }); }
}
console.log(JSON.stringify({ bin: bin.split("/").at(-3), mode: process.env.MODE ?? "openclose", root: root.split("/").at(-1), out }));
s.kill(); process.exit(0);
