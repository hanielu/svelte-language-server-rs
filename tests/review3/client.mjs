// Minimal LSP client with configurable capabilities that records server notifications.
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
export async function client(bin, root, { pull = true, extraCaps = {}, settings = null } = {}) {
  const env = { ...process.env, TSGO_BIN: process.env.TSGO_BIN ?? `${os.homedir()}/.bun/bin/tsrs` };
  const proc = spawn(bin, ["--stdio"], { cwd: root, stdio: ["pipe", "pipe", "pipe"], env });
  const log = [], notes = [], serverRequests = [];
  let exited = null;
  proc.on("exit", (code, sig) => { exited = { code, sig }; });
  proc.stderr.on("data", (d) => { log.push(d.toString()); if (process.env.LOG) process.stderr.write(d); });
  let buf = Buffer.alloc(0), nextId = 1; const pending = new Map();
  const send = (m) => { if (exited) return; const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); proc.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); proc.stdin.write(b); };
  const request = (method, params) => new Promise((res, rej) => { const id = nextId++; pending.set(id, { res, rej }); send({ id, method, params }); });
  proc.stdout.on("data", (c) => { buf = Buffer.concat([buf, c]); for (;;) { const sep = buf.indexOf("\r\n\r\n"); if (sep < 0) return; const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]); if (buf.length < sep + 4 + len) return; const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString()); buf = buf.subarray(sep + 4 + len);
    if (msg.id !== undefined && msg.method === undefined) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p?.rej(new Error(JSON.stringify(msg.error))) : p?.res(msg.result); }
    else if (msg.id !== undefined) { serverRequests.push({ at: performance.now(), method: msg.method, params: msg.params }); send({ id: msg.id, result: msg.method === "workspace/configuration" ? msg.params.items.map(() => settings) : null }); }
    else notes.push({ at: performance.now(), method: msg.method, params: msg.params }); } });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const uri = (rel) => pathToFileURL(path.join(root, rel)).href;
  const td = { synchronization: { dynamicRegistration: true }, hover: { contentFormat: ["markdown"] }, publishDiagnostics: { relatedInformation: true, versionSupport: true }, completion: { completionItem: { snippetSupport: true } } };
  if (pull) td.diagnostic = { dynamicRegistration: true };
  await request("initialize", { processId: process.pid, rootUri: pathToFileURL(root).href, workspaceFolders: [{ uri: pathToFileURL(root).href, name: "w" }],
    capabilities: { workspace: { configuration: true, workspaceFolders: true, didChangeWatchedFiles: { dynamicRegistration: true }, ...extraCaps.workspace }, textDocument: { ...td, ...extraCaps.textDocument } } });
  send({ method: "initialized", params: {} });
  const versions = {};
  return { proc, log, notes, serverRequests, send, request, sleep, uri, get exited() { return exited; },
    open(rel, text, languageId = "svelte") { versions[rel] = 1; send({ method: "textDocument/didOpen", params: { textDocument: { uri: uri(rel), languageId, version: 1, text } } }); },
    change(rel, text) { send({ method: "textDocument/didChange", params: { textDocument: { uri: uri(rel), version: ++versions[rel] }, contentChanges: [{ text }] } }); },
    changeRange(rel, range, text) { send({ method: "textDocument/didChange", params: { textDocument: { uri: uri(rel), version: ++versions[rel] }, contentChanges: [{ range, text }] } }); },
    close(rel) { send({ method: "textDocument/didClose", params: { textDocument: { uri: uri(rel) } } }); },
    watched(changes) { send({ method: "workspace/didChangeWatchedFiles", params: { changes: changes.map(([rel, type]) => ({ uri: uri(rel), type })) } }); },
    pushed(rel) { return notes.filter((n) => n.method === "textDocument/publishDiagnostics" && n.params.uri === uri(rel)); },
    async end() { try { await Promise.race([request("shutdown", null), sleep(2000)]); send({ method: "exit" }); } catch {} await sleep(200); proc.kill("SIGKILL"); },
  };
}
export const fmtDiag = (d) => `${d.range.start.line}:${d.range.start.character}:${d.code ?? ""}:${String(d.message).split("\n")[0].slice(0, 80)}`;
