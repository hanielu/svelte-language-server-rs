// How tsrs (and tsgo) treat a diagnostic pull whose check takes seconds: other requests about the
// same file are answered meanwhile, pulls of other files wait for it, and a $/cancelRequest neither
// stops the check nor keeps its result: the cancelled pull is answered (RequestCancelled) only when
// the check is done, and the next pull checks again, where an uncancelled pull makes it instant.
//
//   node repro.mjs [server binary, default ~/.bun/bin/tsrs] [aliases, default 6]
//
// `comp.ts` assigns every export of `heavy.ts` (500 constants per alias, each typed through a
// recursive tuple type) to a Record, so checking it takes seconds (6 aliases: about 7 s on an M2 Max).
// Two sessions: the pull left alone, then the pull cancelled 1.5 s in. Prints one JSON record.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [bin = `${os.homedir()}/.bun/bin/tsrs`, aliasesArg = "6"] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function session(cancelAfterMs) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tsrs-cancelled-check-"));
  let heavy = "";
  for (let a = 0; a < Number(aliasesArg); a++) {
    heavy += `type B${a}<N extends number, T extends unknown[] = []> = T["length"] extends N ? T : B${a}<N, [...T, ${a}]>;\n`;
    for (let i = 0; i < 500; i++) heavy += `export const a${a}_${i}: B${a}<${999 - i}>["length"] = ${999 - i};\n`;
  }
  const comp = `import * as H from './heavy';\nconst all: Record<string, number> = H;\nconst bad: number = 'x';\nexport { all, bad };\n`;
  const other = `export const o: string = 1;\n`;
  fs.writeFileSync(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", skipLibCheck: true, types: [] } }));
  fs.writeFileSync(path.join(root, "heavy.ts"), heavy);
  fs.writeFileSync(path.join(root, "comp.ts"), comp);
  fs.writeFileSync(path.join(root, "other.ts"), other);
  const uri = (f) => pathToFileURL(path.join(root, f)).href;
  const proc = spawn(bin, ["--lsp", "--stdio"], { cwd: root, stdio: ["pipe", "pipe", "ignore"] });
  let buf = Buffer.alloc(0), nextId = 1;
  const pending = new Map();
  const t0 = Date.now();
  const send = (m) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); proc.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); proc.stdin.write(b); };
  const request = (method, params) => {
    const id = nextId++;
    const sent = Date.now() - t0;
    const answer = new Promise((res) => pending.set(id, res)).then((msg) => ({ method, id, sentMs: sent, answeredMs: Date.now() - t0, answer: msg.error ? `error ${msg.error.code}` : "result" }));
    send({ id, method, params });
    return [id, answer];
  };
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
  await request("initialize", { processId: process.pid, rootUri: pathToFileURL(root).href, capabilities: { textDocument: { diagnostic: {} } } })[1];
  send({ method: "initialized", params: {} });
  for (const [f, text] of [["comp.ts", comp], ["other.ts", other]]) send({ method: "textDocument/didOpen", params: { textDocument: { uri: uri(f), languageId: "typescript", version: 1, text } } });
  const td = { uri: uri("comp.ts") };
  const [pullId, pull] = request("textDocument/diagnostic", { textDocument: td });
  await sleep(300);
  const meanwhile = [
    request("textDocument/hover", { textDocument: td, position: { line: 2, character: 7 } })[1],
    request("textDocument/codeAction", { textDocument: td, range: { start: { line: 1, character: 6 }, end: { line: 1, character: 6 } }, context: { diagnostics: [] } })[1],
    request("textDocument/inlayHint", { textDocument: td, range: { start: { line: 0, character: 0 }, end: { line: 4, character: 0 } } })[1],
    request("textDocument/diagnostic", { textDocument: { uri: uri("other.ts") } })[1],
  ];
  let cancelledAtMs = null;
  if (cancelAfterMs !== null) { await sleep(cancelAfterMs - 300); send({ method: "$/cancelRequest", params: { id: pullId } }); cancelledAtMs = Date.now() - t0; }
  const first = await pull;
  const others = await Promise.all(meanwhile);
  const next = await request("textDocument/diagnostic", { textDocument: td })[1];
  proc.kill("SIGKILL");
  fs.rmSync(root, { recursive: true, force: true });
  return { cancelledAtMs, pull: first, meanwhile: others, nextPullTookMs: next.answeredMs - next.sentMs };
}

const left = await session(null);
const cancelled = await session(1500);
console.log(JSON.stringify({ server: bin, aliases: Number(aliasesArg), leftAlone: left, cancelledAt1500ms: cancelled }, null, 1));
