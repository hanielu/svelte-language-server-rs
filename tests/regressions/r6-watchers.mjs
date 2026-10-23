// R6: which file watchers reach the editor. Zed scans a gitignored directory (node_modules) only
// when a registered watcher's literal prefix points into it; events in unscanned dirs are dropped.
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import { pathToFileURL } from "node:url";
import { makeProject } from "./h.mjs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const root = makeProject(tpl, {
  "package.json": '{"name":"r6","private":true,"type":"module"}', ".gitignore": "node_modules\n", "tsconfig.json": cfg,
  "node_modules/dep/package.json": '{"name":"dep","types":"./index.d.ts"}', "node_modules/dep/index.d.ts": "export declare const depValue: number;\n",
  "src/App.svelte": `<script lang="ts">\n\timport { depValue } from 'dep';\n\timport { later } from 'not-installed-yet';\n\tconst n: number = depValue + later;\n</script>\n<p>{n}</p>\n`,
});
const child = spawn(bin, ["--stdio"], { cwd: root, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, TSGO_BIN: `${os.homedir()}/.bun/bin/tsrs` } });
child.stderr.on("data", () => {});
let buf = Buffer.alloc(0), id = 1; const pending = new Map(); const regs = [];
const send = (m) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); child.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); child.stdin.write(b); };
const request = (method, params) => new Promise((res) => { const i = id++; pending.set(i, res); send({ id: i, method, params }); });
child.stdout.on("data", (c) => { buf = Buffer.concat([buf, c]); for (;;) { const sep = buf.indexOf("\r\n\r\n"); if (sep < 0) return; const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]); if (buf.length < sep + 4 + len) return; const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString()); buf = buf.subarray(sep + 4 + len);
  if (msg.id !== undefined && msg.method === undefined) { pending.get(msg.id)?.(msg.result); pending.delete(msg.id); }
  else if (msg.id !== undefined) { if (msg.method === "client/registerCapability" || msg.method === "client/unregisterCapability") regs.push([msg.method, msg.params]); send({ id: msg.id, result: msg.method === "workspace/configuration" ? msg.params.items.map(() => null) : null }); } } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await request("initialize", { processId: process.pid, rootUri: pathToFileURL(root).href, workspaceFolders: [{ uri: pathToFileURL(root).href, name: "r6" }], capabilities: { workspace: { configuration: true, didChangeWatchedFiles: { dynamicRegistration: true, relativePatternSupport: true } }, textDocument: { diagnostic: { dynamicRegistration: true } } } });
send({ method: "initialized", params: {} });
const uri = pathToFileURL(path.join(root, "src/App.svelte")).href;
send({ method: "textDocument/didOpen", params: { textDocument: { uri, languageId: "svelte", version: 1, text: fs.readFileSync(path.join(root, "src/App.svelte"), "utf8") } } });
for (let i = 0; i < 20; i++) { await request("textDocument/diagnostic", { textDocument: { uri } }); await sleep(250); }
const rel = (g) => typeof g === "string" ? g.replace(root, "<root>") : `${g.baseUri?.uri ?? g.baseUri}`.replace(pathToFileURL(root).href, "<root>") + " :: " + g.pattern;
const nodeModules = new Set();
for (const [m, p] of regs) for (const r of (p.registrations ?? [])) if (m.endsWith("registerCapability") && !m.includes("unregister")) for (const w of r.registerOptions?.watchers ?? []) { const g = rel(w.globPattern); if (/node_modules\//.test(g.split("*")[0]) && !g.includes(".bun/install")) nodeModules.add(g); }
console.log(JSON.stringify({ editorWatchesNodeModules: [...nodeModules], ok: nodeModules.size > 0 }));
if (process.env.VERBOSE) for (const [m, p] of regs) for (const r of (p.registrations ?? p.unregisterations ?? [])) console.log(m.replace("client/", ""), r.id, r.method, JSON.stringify((r.registerOptions?.watchers ?? []).map((w) => rel(w.globPattern) + (w.kind ? ` kind=${w.kind}` : ""))));
await Promise.race([request("shutdown", null), sleep(1500)]); send({ method: "exit" }); await sleep(200); child.kill("SIGKILL");
fs.rmSync(root, { recursive: true, force: true });
