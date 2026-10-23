// initprobe.mjs <root> <bin>...: spawn each binary as bench.mjs does, time spawn -> initialize answer (and initialize request alone), then exit. 5 interleaved rounds.
// Against a project another session also uses, run it through bench/with-lock.sh.
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
const [root, ...bins] = process.argv.slice(2);
const inlay = {};
const zedInit = { provideFormatter: true, dontFilterIncompleteCompletions: true, configuration: { typescript: { inlayHints: inlay }, javascript: { inlayHints: inlay } } };
async function once(bin) {
  const t0 = performance.now();
  const child = spawn(bin, ["--stdio"], { cwd: root, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env } });
  let buf = Buffer.alloc(0); const pending = new Map(); let id = 0;
  const send = (m) => { const s = JSON.stringify({ jsonrpc: "2.0", ...m }); child.stdin.write(`Content-Length: ${Buffer.byteLength(s)}\r\n\r\n${s}`); };
  child.stdout.on("data", (d) => { buf = Buffer.concat([buf, d]); for (;;) { const i = buf.indexOf("\r\n\r\n"); if (i < 0) break; const n = +/Content-Length: (\d+)/i.exec(buf.slice(0, i).toString())[1]; if (buf.length < i + 4 + n) break; const msg = JSON.parse(buf.slice(i + 4, i + 4 + n).toString()); buf = buf.slice(i + 4 + n); if (msg.id !== undefined && !msg.method && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); } else if (msg.id !== undefined && msg.method) send({ id: msg.id, result: null }); } });
  const request = (method, params) => new Promise((r) => { const i = ++id; pending.set(i, r); send({ id: i, method, params }); });
  const tReq = performance.now();
  await request("initialize", { processId: process.pid, rootUri: pathToFileURL(root).href, workspaceFolders: [{ uri: pathToFileURL(root).href, name: path.basename(root) }], initializationOptions: zedInit, capabilities: { window: { workDoneProgress: true }, workspace: { configuration: true, workspaceFolders: true, didChangeWatchedFiles: { dynamicRegistration: true } }, textDocument: { synchronization: { dynamicRegistration: true, didSave: true }, publishDiagnostics: { relatedInformation: true, versionSupport: true }, diagnostic: { dynamicRegistration: true } } } });
  const t1 = performance.now();
  const exited = new Promise((r) => child.on("exit", r));
  child.kill("SIGTERM");
  await exited;
  return [Math.round(t1 - t0), Math.round(t1 - tReq)];
}
const res = Object.fromEntries(bins.map((b) => [b, []]));
for (let round = 0; round < 5; round++) for (const b of bins) res[b].push((await once(b)).join("/"));
for (const b of bins) console.log(path.basename(b), res[b].join(" "));
