// End-to-end checks of shadow freshness against a real tsrs, on a throwaway copy of a tiny project.
// usage: node e2e.mjs <server-binary> <template-dir>
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import { pathToFileURL } from "node:url";
import path from "node:path";
const [bin, template] = process.argv.slice(2);
const root = fs.mkdtempSync(path.join(path.dirname(template), "e2e-run-"));
fs.cpSync(template, root, { recursive: true });
const child = spawn(bin, ["--stdio"], { cwd: root, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, TSGO_BIN: process.env.TSGO_BIN ?? `${os.homedir()}/.bun/bin/tsrs` } });
child.stderr.on("data", (d) => process.env.LOG && process.stderr.write(d));
let buf = Buffer.alloc(0), nextId = 1; const pending = new Map();
const send = (m) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); child.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); child.stdin.write(b); };
const request = (method, params) => new Promise((res, rej) => { const id = nextId++; pending.set(id, { res, rej }); send({ id, method, params }); });
child.stdout.on("data", (c) => { buf = Buffer.concat([buf, c]); for (;;) { const sep = buf.indexOf("\r\n\r\n"); if (sep < 0) return; const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]); if (buf.length < sep + 4 + len) return; const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString()); buf = buf.subarray(sep + 4 + len);
  if (msg.id !== undefined && msg.method === undefined) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p?.rej(new Error(JSON.stringify(msg.error))) : p?.res(msg.result); }
  else if (msg.id !== undefined) send({ id: msg.id, result: msg.method === "workspace/configuration" ? msg.params.items.map(() => null) : null }); } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uri = (rel) => pathToFileURL(path.join(root, rel)).href;
await request("initialize", { processId: process.pid, rootUri: pathToFileURL(root).href, workspaceFolders: [{ uri: pathToFileURL(root).href, name: "e2e" }],
  capabilities: { workspace: { configuration: true, workspaceFolders: true, didChangeWatchedFiles: { dynamicRegistration: true } }, textDocument: { synchronization: { dynamicRegistration: true }, diagnostic: { dynamicRegistration: true }, publishDiagnostics: { relatedInformation: true } } } });
send({ method: "initialized", params: {} });
const versions = {};
const open = (rel, text) => { versions[rel] = 1; send({ method: "textDocument/didOpen", params: { textDocument: { uri: uri(rel), languageId: "svelte", version: 1, text } } }); };
const change = (rel, text) => send({ method: "textDocument/didChange", params: { textDocument: { uri: uri(rel), version: ++versions[rel] }, contentChanges: [{ text }] } });
const close = (rel) => send({ method: "textDocument/didClose", params: { textDocument: { uri: uri(rel) } } });
const watched = (rel, type) => send({ method: "workspace/didChangeWatchedFiles", params: { changes: [{ uri: uri(rel), type }] } });
const norm = (items) => (items ?? []).filter((d) => d.severity === 1 || d.severity === undefined).map((d) => `${d.range.start.line}:${d.code ?? ""}:${String(d.message).split("\n")[0].slice(0, 90)}`);
const results = [];
async function expect(label, rel, pred, timeout = 20000) {
  const start = performance.now(); let items = [];
  for (;;) {
    const r = await request("textDocument/diagnostic", { textDocument: { uri: uri(rel) } });
    items = norm(r?.items);
    if (pred(items)) { results.push({ label, ok: true, ms: Math.round(performance.now() - start), items }); return; }
    if (performance.now() - start > timeout) { results.push({ label, ok: false, items }); return; }
    await sleep(100);
  }
}
const has = (re) => (items) => items.some((i) => re.test(i));
const hasNot = (re) => (items) => !items.some((i) => re.test(i));
const parent = (childLine, jsLine, extra = "") => `<script lang="ts">\n\timport Child from './Child.svelte';\n\timport JsChild from './JsChild.svelte';\n${extra}\tconst total: number = 1;\n</script>\n\n${childLine}\n${jsLine}\n`;
const childSrc = (type) => `<script lang="ts">\n\tlet { count }: { count: ${type} } = $props();\n</script>\n\n<p>{count}</p>\n`;

open("src/Parent.svelte", parent("<Child count={total} />", '<JsChild label="x" />'));
await expect("A clean parent has no errors", "src/Parent.svelte", (i) => i.length === 0);
change("src/Parent.svelte", parent('<Child count={"str"} />', '<JsChild label="x" />'));
await expect("B wrong prop type for a TS child is reported", "src/Parent.svelte", has(/^6:2322:.*not assignable to type 'number'/));
change("src/Parent.svelte", parent('<Child count={"str"} />', "<JsChild label={1} />"));
await expect("C wrong prop type for a JS (JSDoc) child is reported", "src/Parent.svelte", has(/^7:2322:.*not assignable to type 'string'/));
fs.writeFileSync(path.join(root, "src/Child.svelte"), childSrc("string"));
watched("src/Child.svelte", 2);
await expect("D a closed child edited on disk reaches the parent", "src/Parent.svelte", (i) => hasNot(/^6:2322/)(i) && has(/^7:2322/)(i));
open("src/Child.svelte", childSrc("string"));
change("src/Child.svelte", childSrc("boolean"));
await expect("E an unsaved child buffer reaches the parent", "src/Parent.svelte", has(/^6:2322:.*not assignable to type 'boolean'/));
close("src/Child.svelte");
await expect("F closing the unsaved child reverts the parent to the disk version", "src/Parent.svelte", hasNot(/^6:2322/));
fs.writeFileSync(path.join(root, "src/NewChild.svelte"), childSrc("number"));
watched("src/NewChild.svelte", 1);
change("src/Parent.svelte", parent('<NewChild count={"str"} />', '<JsChild label="x" />', "\timport NewChild from './NewChild.svelte';\n"));
await expect("G a component created on disk resolves", "src/Parent.svelte", has(/^7:2322:.*not assignable to type 'number'/));
fs.rmSync(path.join(root, "src/NewChild.svelte"));
watched("src/NewChild.svelte", 3);
await expect("H a component deleted on disk stops resolving", "src/Parent.svelte", has(/^3:2307:/));
change("src/Parent.svelte", "<script lang=\"ts\">\n\tconst list: number[] = [];\n\tconst first: number = list[0];\n</script>\n\n<p>{first}</p>\n");
await expect("I an indexed access is a number by default", "src/Parent.svelte", hasNot(/^2:2322/));
fs.writeFileSync(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true, noUncheckedIndexedAccess: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] }, include: ["src/**/*"] }));
watched("tsconfig.json", 2);
await expect("J a tsconfig change reaches the project", "src/Parent.svelte", has(/^2:2322/), 30000);
open("src/Child.svelte", childSrc("number"));
await expect("K a project still answers after the restart", "src/Child.svelte", (i) => i.length === 0);
const bodies = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else bodies.push(path.relative(root, p)); } };
for (const cache of [".svelte-rs", ".rsvelte-language-server"]) if (fs.existsSync(path.join(root, cache))) walk(path.join(root, cache));
console.log(JSON.stringify({ bin: path.basename(bin), results, cacheFiles: bodies.filter((b) => b.endsWith(".tsx") || b.endsWith(".tmp")) }, null, 1));
try { await Promise.race([request("shutdown", null), sleep(2000)]); send({ method: "exit" }); } catch {}
await sleep(200); child.kill("SIGKILL"); fs.rmSync(root, { recursive: true, force: true }); process.exit(results.every((r) => r.ok) ? 0 : 1);
