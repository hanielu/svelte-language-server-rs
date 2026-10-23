// Open files one at a time (interleaved across projects), pull diagnostics until stable, record them.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
const [bin, root, listFile] = process.argv.slice(2);
const files = readFileSync(listFile, "utf8").trim().split("\n");
const child = spawn(bin, ["--stdio"], { cwd: root, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, TSGO_BIN: process.env.TSGO_BIN ?? "/Users/hyprsonic/.bun/bin/tsrs" } });
child.stderr.on("data", (d) => process.env.LOG && process.stderr.write(d));
let buf = Buffer.alloc(0), nextId = 1; const pending = new Map();
const send = (m) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); child.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); child.stdin.write(b); };
const request = (method, params) => new Promise((res, rej) => { const id = nextId++; pending.set(id, { res, rej }); send({ id, method, params }); });
child.stdout.on("data", (c) => { buf = Buffer.concat([buf, c]); for (;;) { const sep = buf.indexOf("\r\n\r\n"); if (sep < 0) return; const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]); if (buf.length < sep + 4 + len) return; const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString()); buf = buf.subarray(sep + 4 + len);
  if (msg.id !== undefined && msg.method === undefined) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p?.rej(new Error(JSON.stringify(msg.error))) : p?.res(msg.result); }
  else if (msg.id !== undefined) send({ id: msg.id, result: msg.method === "workspace/configuration" ? msg.params.items.map(() => null) : null }); } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await request("initialize", { processId: process.pid, rootUri: pathToFileURL(root).href, workspaceFolders: [{ uri: pathToFileURL(root).href, name: "z" }],
  capabilities: { workspace: { configuration: true, workspaceFolders: true, didChangeWatchedFiles: { dynamicRegistration: true } }, textDocument: { synchronization: { dynamicRegistration: true }, diagnostic: { dynamicRegistration: true }, publishDiagnostics: { relatedInformation: true } } } });
send({ method: "initialized", params: {} });
const out = {};
const norm = (items) => (items ?? []).map((d) => `${d.range.start.line}:${d.range.start.character}-${d.range.end.line}:${d.range.end.character} ${d.source ?? ""} ${d.code ?? ""} ${String(d.message).split("\n")[0]}`).sort();
const t0 = performance.now();
for (const rel of files) {
  const abs = path.join(root, rel), uri = pathToFileURL(abs).href;
  const languageId = rel.endsWith(".svelte") ? "svelte" : rel.endsWith(".js") ? "javascript" : "typescript";
  send({ method: "textDocument/didOpen", params: { textDocument: { uri, languageId, version: 1, text: readFileSync(abs, "utf8") } } });
  const s = performance.now(); const MIN = Number(process.env.MINMS ?? 1500);
  let prev = null, cur = null, n = 0;
  for (;;) { const r = await request("textDocument/diagnostic", { textDocument: { uri } }); cur = JSON.stringify(norm(r?.items)); n++; if (cur === prev && performance.now() - s > MIN) break; prev = cur; await sleep(400); }
  out[rel] = { ms: Math.round(performance.now() - s), diags: JSON.parse(cur) };
  send({ method: "textDocument/didClose", params: { textDocument: { uri } } });
  process.stderr.write(`${rel} ${out[rel].ms}ms ${out[rel].diags.length} diags\n`);
}
console.log(JSON.stringify({ totalMs: Math.round(performance.now() - t0), files: out }));
try { await Promise.race([request("shutdown", null), sleep(3000)]); send({ method: "exit" }); } catch {}
await sleep(300); child.kill("SIGKILL"); process.exit(0);
