// tsrs never answers a completion or signature help request between `<` and `{` when the
// `<` follows an identifier right after a `}` (`}foo<|{`, `{}i<|{`), in a .ts or .tsx file, and
// the request keeps one core busy for good: $/cancelRequest does not stop it.
//
//   node repro.mjs [server binary, default ~/.bun/bin/tsrs] [extra server args...]
//
// Spawns `<server> --lsp --stdio` on a throwaway project holding one file, sends one request
// per case, and reports for each whether it was answered within 5 s and the server's CPU use
// after that (ps %cpu: 100 = one core). Exit code 1 if any case is not answered.
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [bin = `${os.homedir()}/.bun/bin/tsrs`, ...extra] = process.argv.slice(2);
const cases = [
  // [file name, text, method, line, character]
  ["a.tsx", "<}{", "textDocument/signatureHelp", 0, 2],
  ["b.tsx", "}i<{", "textDocument/completion", 0, 3],
  ["c.tsx", "}\nfoo<{", "textDocument/completion", 1, 4],
  ["d.ts", "{}i<{", "textDocument/completion", 0, 4],
  // controls: the same requests without the `}` right before the identifier are answered
  ["e.tsx", "<{", "textDocument/signatureHelp", 0, 1],
  ["f.tsx", "i<{", "textDocument/completion", 0, 2],
  ["g.ts", "f();i<{", "textDocument/completion", 0, 6],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run([name, text, method, line, character]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tsrs-lost-request-"));
  fs.writeFileSync(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true, jsx: "preserve", target: "ESNext", module: "ESNext", moduleResolution: "bundler", types: [] } }));
  const file = path.join(root, name);
  fs.writeFileSync(file, text);
  const uri = pathToFileURL(file).href;
  const proc = spawn(bin, [...extra, "--lsp", "--stdio"], { cwd: root, stdio: ["pipe", "pipe", "ignore"] });
  let buf = Buffer.alloc(0), nextId = 1;
  const pending = new Map();
  const send = (m) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); proc.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); proc.stdin.write(b); };
  const request = (m, params) => { const id = nextId++; const p = new Promise((res) => pending.set(id, res)); send({ id, method: m, params }); return [id, p]; };
  proc.stdout.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      const sep = buf.indexOf("\r\n\r\n"); if (sep < 0) return;
      const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]);
      if (buf.length < sep + 4 + len) return;
      const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString()); buf = buf.subarray(sep + 4 + len);
      if (msg.id !== undefined && msg.method === undefined) { pending.get(msg.id)?.(msg); pending.delete(msg.id); }
      else if (msg.id !== undefined) send({ id: msg.id, result: null });
    }
  });
  await request("initialize", { processId: process.pid, rootUri: pathToFileURL(root).href, capabilities: {} })[1];
  send({ method: "initialized", params: {} });
  send({ method: "textDocument/didOpen", params: { textDocument: { uri, languageId: name.endsWith(".tsx") ? "typescriptreact" : "typescript", version: 1, text } } });
  const started = Date.now();
  const [id, answer] = request(method, { textDocument: { uri }, position: { line, character }, ...(method === "textDocument/completion" ? { context: { triggerKind: 1 } } : {}) });
  const answeredAfter = await Promise.race([answer.then(() => Date.now() - started), sleep(5000).then(() => null)]);
  send({ method: "$/cancelRequest", params: { id } });
  await sleep(1000);
  const cpu = Number(execSync(`ps -o %cpu= -p ${proc.pid}`).toString().trim());
  const [, hover] = request("textDocument/hover", { textDocument: { uri }, position: { line: 0, character: 0 } });
  const otherRequests = await Promise.race([hover.then(() => "answered"), sleep(3000).then(() => "not answered")]);
  proc.kill("SIGKILL");
  fs.rmSync(root, { recursive: true, force: true });
  return { file: name, text, request: `${method} at ${line}:${character}`, answeredAfterMs: answeredAfter, cpuPercentAfterCancel: cpu, otherRequests };
}

const results = [];
for (const c of cases) results.push(await run(c));
console.log(JSON.stringify({ server: bin, version: execSync(`${bin} ${extra.join(" ")} --version 2>&1 || true`).toString().trim().split("\n")[0], results }, null, 1));
process.exit(results.some((r) => r.answeredAfterMs === null) ? 1 : 0);
