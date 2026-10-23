// Which completion and signature help requests does tsrs (or tsgo) never answer? One server per
// request on a throwaway one-file project; a request not answered within WAIT ms (default 2500)
// counts as lost (LOOP), and the server is killed.
//
//   node loopprobe.mjs <cases.json>      cases: [[ext, text with "|" at the position], ...]
//   TSRS=<server> WAIT=<ms> PAR=<parallel servers> METHODS=completion,signatureHelp
//   JSON_OUT=<file>                       also writes [{ext, marked, method, loops}]
//
// The measurements behind crates/rsvelte_language_server/tests/data/tsrs-lost-requests.json in
// vendor/rsvelte (tsrs 0.18.0) were taken with this script; see README.md.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
const bin = process.env.TSRS ?? `${os.homedir()}/.bun/bin/tsrs`;
const WAIT = Number(process.env.WAIT ?? 2500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// case: [ext, text with | at the position]
const cases = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const methods = (process.env.METHODS ?? "completion,signatureHelp").split(",");
async function run(ext, marked, method) {
  const at = marked.indexOf("|"); const text = marked.slice(0, at) + marked.slice(at + 1);
  const before = text.slice(0, at); const line = before.split("\n").length - 1; const character = at - (before.lastIndexOf("\n") + 1);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "loopprobe-"));
  fs.writeFileSync(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true, jsx: "preserve", target: "ESNext", module: "ESNext", moduleResolution: "bundler", types: [] } }));
  const file = path.join(root, "x." + ext); fs.writeFileSync(file, text);
  const uri = pathToFileURL(file).href;
  const proc = spawn(bin, ["--lsp", "--stdio"], { cwd: root, stdio: ["pipe", "pipe", "ignore"] });
  let buf = Buffer.alloc(0), nextId = 1; const pending = new Map();
  const send = (m) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); proc.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); proc.stdin.write(b); };
  const request = (m, params) => { const id = nextId++; const p = new Promise((res) => pending.set(id, res)); send({ id, method: m, params }); return p; };
  proc.stdout.on("data", (chunk) => { buf = Buffer.concat([buf, chunk]); for (;;) { const sep = buf.indexOf("\r\n\r\n"); if (sep < 0) return; const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]); if (buf.length < sep + 4 + len) return; const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString()); buf = buf.subarray(sep + 4 + len); if (msg.id !== undefined && msg.method === undefined) { pending.get(msg.id)?.(msg); pending.delete(msg.id); } else if (msg.id !== undefined) send({ id: msg.id, result: null }); } });
  await request("initialize", { processId: process.pid, rootUri: pathToFileURL(root).href, capabilities: {} });
  send({ method: "initialized", params: {} });
  send({ method: "textDocument/didOpen", params: { textDocument: { uri, languageId: ext === "tsx" ? "typescriptreact" : "typescript", version: 1, text } } });
  await request("textDocument/hover", { textDocument: { uri }, position: { line: 0, character: 0 } });
  const t = Date.now();
  const r = await Promise.race([request(`textDocument/${method}`, { textDocument: { uri }, position: { line, character }, ...(method === "completion" ? { context: { triggerKind: 1 } } : {}) }).then(() => `${Date.now() - t}ms`), sleep(WAIT).then(() => "LOOP")]);
  proc.kill("SIGKILL"); fs.rmSync(root, { recursive: true, force: true });
  return r;
}
const jobs = [];
for (const [ext, marked] of cases) for (const m of methods) jobs.push([ext, marked, m]);
const out = new Array(jobs.length);
let next = 0;
await Promise.all(Array.from({ length: Number(process.env.PAR ?? 6) }, async () => { while (next < jobs.length) { const i = next++; out[i] = await run(...jobs[i]); } }));
const rows = {};
jobs.forEach(([ext, marked, m], i) => { const k = `${ext} ${JSON.stringify(marked)}`; (rows[k] ??= {})[m] = out[i]; });
if (process.env.JSON_OUT) fs.writeFileSync(process.env.JSON_OUT, JSON.stringify(jobs.map(([ext, marked, m], i) => ({ ext, marked, method: m, loops: out[i] === "LOOP" }))));
for (const [k, v] of Object.entries(rows)) console.log(k.slice(0, 60).padEnd(60), Object.entries(v).map(([m, r]) => `${m}=${r}`).join(" "));
