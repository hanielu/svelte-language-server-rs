// Keystroke fuzzer through the real server: random incremental edits (UTF-16 ranges) with
// multibyte characters and half-typed Svelte constructs, interleaved with editor requests.
// Reports server death, unanswered requests and panic lines in stderr.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { makeProject } from "./h.mjs";

const [bin, tpl, seedArg = "1", itersArg = "400"] = process.argv.slice(2);
let seed = Number(seedArg) >>> 0 || 1;
const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const child = `<script lang="ts">\n\timport type { Snippet } from 'svelte';\n\tlet { label, count = $bindable(0), children }: { label: string; count?: number; children?: Snippet } = $props();\n</script>\n\n<button onclick={() => count++}>{label} {count}</button>\n{@render children?.()}\n`;
const parent = `<script lang="ts">\n\timport Child from './Child.svelte';\n\timport { fromUtil } from '#lib/util.js';\n\timport { writable } from 'svelte/store';\n\tconst store = writable(1);\n\tlet items = $state([1, 2, 3]);\n\tlet value = $state('');\n\tconst p = Promise.resolve(fromUtil);\n\tfunction go(x: number) { return x * 2; }\n</script>\n\n<Child label="hi" bind:count={items[0]}>\n\t<p>{$store} café</p>\n</Child>\n{#each items as item, i (item)}\n\t<span class:x={i > 1}>{go(item)}</span>\n{/each}\n{#await p then v}\n\t<input bind:value />{v}\n{:catch e}\n\t{e}\n{/await}\n{#snippet row(a: number)}<td>{a}</td>{/snippet}\n{@render row(1)}\n<style>\n\tp { color: red; }\n</style>\n`;
const root = makeProject(tpl, {
  "package.json": JSON.stringify({ name: "fz", private: true, type: "module", imports: { "#lib/*": "./src/lib/*" } }),
  "tsconfig.json": JSON.stringify({ ...JSON.parse(cfg), include: ["src"] }),
  "src/lib/util.ts": "export const fromUtil: number = 2;\n",
  "src/Child.svelte": child,
  "src/Parent.svelte": parent,
  "other/tsconfig.json": cfg,
  ...(process.env.THIRD ? { "third/tsconfig.json": cfg, "third/X.svelte": `<script lang="ts">\n\tconst q: number = 1;\n</script>\n<p>{q}</p>\n` } : {}),
  "other/Uses.svelte": `<script lang="ts">\n\timport Parent from '../src/Parent.svelte';\n\timport Child from '../src/Child.svelte';\n</script>\n<Parent /><Child label="x" />\n`,
});
const env = { ...process.env, TSGO_BIN: process.env.TSGO_BIN ?? `${os.homedir()}/.bun/bin/tsrs` };
const proc = spawn(bin, ["--stdio"], { cwd: root, stdio: ["pipe", "pipe", "pipe"], env });
let stderr = "", exited = null;
proc.stderr.on("data", (d) => { stderr += d.toString(); });
proc.on("exit", (code, sig) => { exited = { code, sig }; });
let buf = Buffer.alloc(0), nextId = 1; const pending = new Map();
const send = (m) => { if (exited) return; const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); proc.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); proc.stdin.write(b); };
const request = (method, params) => { const id = nextId++; const p = new Promise((res, rej) => pending.set(id, { res, rej, method, params, at: Date.now(), versions: Object.fromEntries(Object.entries(docs ?? {}).map(([k, d]) => [k, d.v])) })); send({ id, method, params }); return p; };
var docs;
proc.stdout.on("data", (c) => { buf = Buffer.concat([buf, c]); for (;;) { const sep = buf.indexOf("\r\n\r\n"); if (sep < 0) return; const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]); if (buf.length < sep + 4 + len) return; const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString()); buf = buf.subarray(sep + 4 + len);
  if (msg.id !== undefined && msg.method === undefined) { const p = pending.get(msg.id); pending.delete(msg.id); if (p) msg.error ? p.rej(msg.error) : p.res(msg.result); }
  else if (msg.id !== undefined) send({ id: msg.id, result: msg.method === "workspace/configuration" ? msg.params.items.map(() => null) : null }); } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uri = (rel) => pathToFileURL(path.join(root, rel)).href;
await request("initialize", { processId: process.pid, rootUri: pathToFileURL(root).href, workspaceFolders: [{ uri: pathToFileURL(root).href, name: "fz" }],
  capabilities: { workspace: { configuration: true, workspaceFolders: true, didChangeWatchedFiles: { dynamicRegistration: true } }, textDocument: { synchronization: { dynamicRegistration: true }, completion: { completionItem: { snippetSupport: true, resolveSupport: { properties: ["documentation", "detail", "additionalTextEdits"] } } }, diagnostic: { dynamicRegistration: true }, hover: { contentFormat: ["markdown"] }, publishDiagnostics: { relatedInformation: true } } } });
send({ method: "initialized", params: {} });
docs = { "src/Parent.svelte": { text: parent, v: 1 }, "src/Child.svelte": { text: child, v: 1 } };
for (const [rel, d] of Object.entries(docs)) send({ method: "textDocument/didOpen", params: { textDocument: { uri: uri(rel), languageId: "svelte", version: 1, text: d.text } } });
const pos = (text, idx) => { const before = text.slice(0, idx); const line = before.split("\n").length - 1; const ch = idx - (before.lastIndexOf("\n") + 1); return { line, character: ch }; };
const snippets = ["{#if }", "{#if a}", "{:else}", "{/if}", "{#each xs as }", "{#each items as , i}", "{:then }", "{:catch }", "{#await }", "{#await p then }", "{@render s(", "{@const x = }", "{#snippet a(}", "{#key }", "<Child ", "<Child ", "<Child a={1} />", "<Child ", "$props(", "$props( ", "$bindable(", "runtime.", "items.", "store.", "import X from './", "import { a } from '#lib/", "import Child2 from './Child.svelte';", " ", "　", "é", "né", "😀", " ", "{", "}", "<", ">", "</", "\"", "'", "`", "${", "/*", "*/", "<!--", "-->", "<script>", "</script>", "<script lang=\"ts\">", "<style>", "</style>", "bind:value={", "bind:value={e as né}", "on:click", "onclick={() => ", "class:", "use:", "{@html ", "{@debug ", "<svelte:", "<svelte:head>", "export let ", "let { a = $bindable(", "export let { a = $bindable(1) } = $props()", "=", ".", "?.", "(", ")", "[", "]", ";", ",", ":", " as ", " satisfies ", "\n", "\t", "  ", "<p>{a.</p>", "<div class=\"x\"", "<input bind:", "generic=\"T\"", "<T extends ", "{#each {length: 3} as _, i}", "<script a=\"</script>\"/"];
const reqKinds = ["completion", "completion", "hover", "hover", "diag", "diag", "symbol", "folding", "format", "codeAction", "definition", "signature", "selection", "inlay", "linked", "highlight", "componentCompletion"];
const recent = [];
let answered = 0, errors = 0, timeouts = [];
const inflight = [];
function track(p, kind) { const at = Date.now(); const w = p.then(() => { answered++; }, (e) => { errors++; if (process.env.SHOWERR) console.error(kind, JSON.stringify(e).slice(0, 200)); }); inflight.push({ w, kind, at, p }); }
function edit(rel) {
  const d = docs[rel]; const t = d.text; const r = rnd();
  let start = Math.floor(rnd() * (t.length + 1)), end = start, ins = "";
  if (r < 0.6) ins = pick(snippets);
  else if (r < 0.85) { end = Math.min(t.length, start + 1 + Math.floor(rnd() * 12)); }
  else { end = Math.min(t.length, start + 1 + Math.floor(rnd() * 6)); ins = pick(snippets); }
  // keep surrogate pairs whole
  const isLow = (i) => i > 0 && i < t.length && /[\udc00-\udfff]/.test(t[i]);
  if (isLow(start)) start--; if (isLow(end)) end++;
  if (end > t.length) end = t.length;
  const range = { start: pos(t, start), end: pos(t, end) };
  d.text = t.slice(0, start) + ins + t.slice(end); d.v++;
  recent.push({ rel, v: d.v, range, ins, del: t.slice(start, end) }); if (recent.length > 12) recent.shift();
  if (process.env.DUMP) { fs.mkdirSync(process.env.DUMP, { recursive: true }); fs.writeFileSync(path.join(process.env.DUMP, `${String(++globalThis.__n || (globalThis.__n = 1)).padStart(5, "0")}-${rel.replace(/\W/g, "_")}.svelte`), d.text); }
  send({ method: "textDocument/didChange", params: { textDocument: { uri: uri(rel), version: d.v }, contentChanges: [{ range, text: ins }] } });
}
function ask(rel) {
  const d = docs[rel]; const t = d.text; let i = Math.floor(rnd() * (t.length + 1)); if (i > 0 && i < t.length && /[\udc00-\udfff]/.test(t[i])) i--;
  const td = { uri: uri(rel) }; const position = pos(t, i); const k = pick(reqKinds);
  const m = { completion: ["textDocument/completion", { textDocument: td, position, context: { triggerKind: 1 } }], hover: ["textDocument/hover", { textDocument: td, position }], diag: ["textDocument/diagnostic", { textDocument: td }], symbol: ["textDocument/documentSymbol", { textDocument: td }], folding: ["textDocument/foldingRange", { textDocument: td }], format: ["textDocument/formatting", { textDocument: td, options: { tabSize: 2, insertSpaces: false } }], codeAction: ["textDocument/codeAction", { textDocument: td, range: { start: position, end: position }, context: { diagnostics: [] } }], definition: ["textDocument/definition", { textDocument: td, position }], signature: ["textDocument/signatureHelp", { textDocument: td, position }], selection: ["textDocument/selectionRange", { textDocument: td, positions: [position] }], inlay: ["textDocument/inlayHint", { textDocument: td, range: { start: { line: 0, character: 0 }, end: pos(t, t.length) } }], linked: ["textDocument/linkedEditingRange", { textDocument: td, position }], highlight: ["textDocument/documentHighlight", { textDocument: td, position }] };
  if (k === "componentCompletion") { const j = t.indexOf("<Child "); if (j >= 0) { track(request("textDocument/completion", { textDocument: td, position: pos(t, j + 7), context: { triggerKind: 1 } }), k); return; } }
  const [method, params] = m[k] ?? m.hover; track(request(method, params), k);
}
await sleep(Number(process.env.INIT_SLEEP ?? 1500));
const iters = Number(itersArg);
for (let n = 0; n < iters && !exited; n++) {
  const rel = rnd() < 0.8 ? "src/Parent.svelte" : "src/Child.svelte";
  edit(rel);
  const k = Math.floor(rnd() * 3);
  for (let j = 0; j < k; j++) ask(rnd() < 0.8 ? rel : "src/Parent.svelte");
  if (rnd() < 0.05 && !process.env.NO_WS) track(request("workspace/symbol", { query: "go" }), "wsymbol");
  if (rnd() < 0.03) send({ method: "workspace/didChangeWatchedFiles", params: { changes: [{ uri: uri("src/lib/util.ts"), type: 2 }] } });
  if (rnd() < 0.02) { send({ method: "textDocument/didOpen", params: { textDocument: { uri: uri("other/Uses.svelte"), languageId: "svelte", version: 1, text: fs.readFileSync(path.join(root, "other/Uses.svelte"), "utf8") } } }); track(request("textDocument/diagnostic", { textDocument: { uri: uri("other/Uses.svelte") } }), "diagOther"); send({ method: "textDocument/didClose", params: { textDocument: { uri: uri("other/Uses.svelte") } } }); }
  await sleep(rnd() < 0.1 ? Number(process.env.LONG_SLEEP ?? 1100) : 5 + Math.floor(rnd() * 40));
  if (n % 25 === 24) {
    // every request must be answered within 15 s
    const all = inflight.splice(0);
    const res = await Promise.race([Promise.all(all.map((x) => x.w)).then(() => "ok"), sleep(15000).then(() => "timeout")]);
    if (res === "timeout") { for (const [id, p] of pending) timeouts.push(`${p.method} id ${id} pending ${Date.now() - p.at} ms params ${JSON.stringify(p.params).slice(0, 300)} versions ${JSON.stringify(p.versions)}`); const probe = await Promise.race([request("textDocument/hover", { textDocument: { uri: uri("src/Parent.svelte") }, position: { line: 0, character: 1 } }).then(() => "answered", (e) => "error"), sleep(5000).then(() => "no answer")]); timeouts.push(`later hover: ${probe}`); const probe2 = await Promise.race([request("textDocument/foldingRange", { textDocument: { uri: uri("src/Parent.svelte") } }).then(() => "answered", (e) => "error"), sleep(5000).then(() => "no answer")]); timeouts.push(`later folding: ${probe2}`); const before = /other\/tsconfig.json \(\d+ components\) in \d+ ms in the background|every TypeScript project that owns a component is loaded/.test(stderr); const third = () => /third\/tsconfig.json \(\d+ components\) in \d+ ms in the background/.test(stderr); const thirdBefore = third(); await sleep(8000); timeouts.push(`background before stall: ${before}; third loaded before: ${thirdBefore}; after 8 s idle: ${third()}; all loaded: ${/every TypeScript project that owns a component is loaded/.test(stderr)}`); if (process.env.CANCEL) { for (const [id, p] of pending) send({ method: '$/cancelRequest', params: { id } }); await sleep(4000); timeouts.push(`after cancelling it: third loaded ${third()}`); } break; }
  }
}
if (process.env.THIRD && !timeouts.length) { const third = () => /third\/tsconfig.json \(\d+ components\) in \d+ ms in the background/.test(stderr); const b = third(); await sleep(8000); timeouts.push(`control (no lost request): third loaded before ${b}, after 8 s idle ${third()}`); }
await sleep(500);
if (process.env.STDERR_OUT) fs.writeFileSync(process.env.STDERR_OUT, stderr);
const panics = stderr.split("\n").filter((l) => /panicked at/.test(l) && !/css.rs:44/.test(l));
const out = { seed: Number(seedArg), iters, exited, answered, errors, timeouts: timeouts.slice(0, 5), panics: panics.slice(0, 5) };
if (exited || timeouts.length || panics.length) { out.recent = recent; out.parent = docs["src/Parent.svelte"].text; out.child = docs["src/Child.svelte"].text; out.stderrTail = stderr.slice(-3000); }
console.log(JSON.stringify(out));
try { const p = request("shutdown", null); await Promise.race([p, sleep(2000)]); send({ method: "exit" }); } catch {}
await sleep(200); proc.kill("SIGKILL");
if (!process.env.KEEP) fs.rmSync(root, { recursive: true, force: true }); else console.error("kept", root);
