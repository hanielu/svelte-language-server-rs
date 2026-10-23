// Minimal LSP session against svelte-rs for review experiments (scratch projects only).
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function session(bin, root, { folders } = {}) {
  const child = spawn(bin, ["--stdio"], { cwd: root, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, TSGO_BIN: process.env.TSGO_BIN ?? `${os.homedir()}/.bun/bin/tsrs` } });
  const log = [];
  child.stderr.on("data", (d) => { log.push(d.toString()); if (process.env.LOG) process.stderr.write(d); });
  let buf = Buffer.alloc(0), nextId = 1; const pending = new Map();
  const send = (m) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); child.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); child.stdin.write(b); };
  const request = (method, params) => new Promise((res, rej) => { const id = nextId++; pending.set(id, { res, rej }); send({ id, method, params }); });
  child.stdout.on("data", (c) => { buf = Buffer.concat([buf, c]); for (;;) { const sep = buf.indexOf("\r\n\r\n"); if (sep < 0) return; const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]); if (buf.length < sep + 4 + len) return; const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString()); buf = buf.subarray(sep + 4 + len);
    if (msg.id !== undefined && msg.method === undefined) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p?.rej(new Error(JSON.stringify(msg.error))) : p?.res(msg.result); }
    else if (msg.id !== undefined) send({ id: msg.id, result: msg.method === "workspace/configuration" ? msg.params.items.map(() => null) : null }); } });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const uri = (rel) => pathToFileURL(path.join(root, rel)).href;
  const ws = (folders ?? ["."]).map((f) => ({ uri: pathToFileURL(path.join(root, f)).href, name: f }));
  await request("initialize", { processId: process.pid, rootUri: pathToFileURL(root).href, workspaceFolders: ws,
    capabilities: { workspace: { configuration: true, workspaceFolders: true, didChangeWatchedFiles: { dynamicRegistration: true } }, textDocument: { synchronization: { dynamicRegistration: true }, diagnostic: { dynamicRegistration: true }, hover: { contentFormat: ["markdown"] }, publishDiagnostics: { relatedInformation: true } } } });
  send({ method: "initialized", params: {} });
  const versions = {};
  const s = {
    root, uri, sleep, request, send, log,
    open(rel, text, languageId = "svelte") { versions[rel] = 1; send({ method: "textDocument/didOpen", params: { textDocument: { uri: uri(rel), languageId, version: 1, text: text ?? fs.readFileSync(path.join(root, rel), "utf8") } } }); },
    change(rel, text) { send({ method: "textDocument/didChange", params: { textDocument: { uri: uri(rel), version: ++versions[rel] }, contentChanges: [{ text }] } }); },
    close(rel) { send({ method: "textDocument/didClose", params: { textDocument: { uri: uri(rel) } } }); },
    watched(changes) { send({ method: "workspace/didChangeWatchedFiles", params: { changes: changes.map(([rel, type]) => ({ uri: uri(rel), type })) } }); },
    write(rel, text) { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); },
    async diags(rel) { const r = await request("textDocument/diagnostic", { textDocument: { uri: uri(rel) } }); return (r?.items ?? []).map((d) => `${d.range.start.line}:${d.code ?? ""}:${String(d.message).split("\n")[0].slice(0, 100)}`); },
    async settle(rel, ms = 4000) { let last = null, same = 0; const start = performance.now(); for (;;) { const d = JSON.stringify(await s.diags(rel)); if (d === last) { if (++same >= 3) return JSON.parse(d); } else { same = 0; last = d; } if (performance.now() - start > ms) return JSON.parse(d); await sleep(150); } },
    async hover(rel, line, character) { return request("textDocument/hover", { textDocument: { uri: uri(rel) }, position: { line, character } }); },
    async end() { try { await Promise.race([request("shutdown", null), sleep(2000)]); send({ method: "exit" }); } catch {} await sleep(200); child.kill("SIGKILL"); },
  };
  return s;
}

export function makeProject(tpl, files) {
  const root = fs.mkdtempSync(path.join(path.dirname(tpl), "run-"));
  fs.cpSync(tpl, root, { recursive: true });
  for (const [rel, text] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); }
  return fs.realpathSync(root);
}
