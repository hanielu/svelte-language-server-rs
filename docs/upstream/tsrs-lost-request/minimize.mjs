// Delta-minimize a text tsrs loops on, keeping the request's position.
//
//   node minimize.mjs <cases.json> <index> [completion|signatureHelp] [ts|tsx]
//   TSRS=<server> WAIT=<ms, default 1500> PAR=<parallel servers, default 8>
//
// cases.json is loopprobe.mjs's input ([[ext, text with "|" at the position], ...]); prints the
// smallest text found that still loops, with "|" at the position.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
const bin = process.env.TSRS ?? `${os.homedir()}/.bun/bin/tsrs`;
const WAIT = Number(process.env.WAIT ?? 1500);
const [casesFile, idx, method = "completion", ext = "tsx"] = process.argv.slice(2);
const marked = JSON.parse(fs.readFileSync(casesFile, "utf8"))[Number(idx)][1];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function loops(marked) {
  const at = marked.indexOf("|"); const text = marked.slice(0, at) + marked.slice(at + 1);
  const before = Buffer.from(text.slice(0, at)); let line = 0, ls = 0; for (let i = 0; i < before.length; i++) if (before[i] === 10) { line++; ls = i + 1; }
  const character = before.length - ls;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "loopmin-"));
  fs.writeFileSync(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true, jsx: "preserve", target: "ESNext", module: "ESNext", moduleResolution: "bundler", types: [] } }));
  const file = path.join(root, "x." + ext); fs.writeFileSync(file, text);
  const uri = pathToFileURL(file).href;
  const proc = spawn(bin, ["--lsp", "--stdio"], { cwd: root, stdio: ["pipe", "pipe", "ignore"] });
  let buf = Buffer.alloc(0), nextId = 1; const pending = new Map();
  const send = (m) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); proc.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); proc.stdin.write(b); };
  const request = (m, params) => { const id = nextId++; const p = new Promise((res) => pending.set(id, res)); send({ id, method: m, params }); return p; };
  proc.stdout.on("data", (chunk) => { buf = Buffer.concat([buf, chunk]); for (;;) { const sep = buf.indexOf("\r\n\r\n"); if (sep < 0) return; const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]); if (buf.length < sep + 4 + len) return; const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString()); buf = buf.subarray(sep + 4 + len); if (msg.id !== undefined && msg.method === undefined) { pending.get(msg.id)?.(msg); pending.delete(msg.id); } else if (msg.id !== undefined) send({ id: msg.id, result: null }); } });
  await request("initialize", { processId: process.pid, rootUri: pathToFileURL(root).href, capabilities: { general: { positionEncodings: ["utf-8"] } } });
  send({ method: "initialized", params: {} });
  send({ method: "textDocument/didOpen", params: { textDocument: { uri, languageId: ext === "tsx" ? "typescriptreact" : "typescript", version: 1, text } } });
  await request("textDocument/hover", { textDocument: { uri }, position: { line: 0, character: 0 } });
  const r = await Promise.race([request(`textDocument/${method}`, { textDocument: { uri }, position: { line, character }, ...(method === "completion" ? { context: { triggerKind: 1 } } : {}) }).then(() => false), sleep(WAIT).then(() => true)]);
  proc.kill("SIGKILL"); fs.rmSync(root, { recursive: true, force: true });
  return r;
}
if (!(await loops(marked))) { console.log("does not loop"); process.exit(1); }
let cur = marked; let n = 2;
const PAR = Number(process.env.PAR ?? 8);
while (true) {
  const at = cur.indexOf("|");
  const len = cur.length; const chunk = Math.ceil(len / n);
  const cands = [];
  for (let s = 0; s < len; s += chunk) { const e = Math.min(len, s + chunk); if (at >= s && at < e) { // remove around the marker, keeping it
      const a = cur.slice(0, s) + cur.slice(at, at + 1) + cur.slice(e); if (a !== cur) cands.push(a);
      const b1 = cur.slice(0, s) + cur.slice(s, at + 1) + cur.slice(e); if (b1 !== cur && b1 !== a) cands.push(b1);
      const b2 = cur.slice(0, s) + cur.slice(at, e) + cur.slice(e); if (b2 !== cur && b2 !== a) cands.push(b2);
    } else cands.push(cur.slice(0, s) + cur.slice(e)); }
  let found = null;
  for (let i = 0; i < cands.length && !found; i += PAR) { const batch = cands.slice(i, i + PAR); const rs = await Promise.all(batch.map(loops)); const k = rs.indexOf(true); if (k >= 0) found = batch.reduce((best, c, j) => rs[j] && c.length < best.length ? c : best, batch[k]); }
  if (found) { cur = found; n = Math.max(2, n - 1); process.stderr.write(`${cur.length} `); continue; }
  if (chunk <= 1) break;
  n = Math.min(cur.length, n * 2);
}
console.log(JSON.stringify(cur));
