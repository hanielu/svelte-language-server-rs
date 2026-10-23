// lsfuzz variant: random cancellations, exactly-one-response accounting, a final wait for every
// request, and a final-state diagnostic comparison against a fresh server on the same texts.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { makeProject } from "./h.mjs";

const [bin, tpl, seedArg = "1", itersArg = "300"] = process.argv.slice(2);
let seed = Number(seedArg) >>> 0 || 1;
const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const child = `<script lang="ts">\n\timport type { Snippet } from 'svelte';\n\tlet { label, count = $bindable(0), children }: { label: string; count?: number; children?: Snippet } = $props();\n</script>\n\n<button onclick={() => count++}>{label} {count}</button>\n{@render children?.()}\n`;
const parent = `<script lang="ts">\n\timport Child from './Child.svelte';\n\timport { fromUtil } from '#lib/util.js';\n\timport { writable } from 'svelte/store';\n\tconst store = writable(1);\n\tlet items = $state([1, 2, 3]);\n\tlet value = $state('');\n\tconst p = Promise.resolve(fromUtil);\n\tfunction go(x: number) { return x * 2; }\n</script>\n\n<Child label="hi" bind:count={items[0]}>\n\t<p>{$store} café</p>\n</Child>\n{#each items as item, i (item)}\n\t<span class:x={i > 1}>{go(item)}</span>\n{/each}\n{#await p then v}\n\t<input bind:value />{v}\n{:catch e}\n\t{e}\n{/await}\n{#snippet row(a: number)}<td>{a}</td>{/snippet}\n{@render row(1)}\n<style>\n\tp { color: red; }\n</style>\n`;
const files = {
  "package.json": JSON.stringify({ name: "fz", private: true, type: "module", imports: { "#lib/*": "./src/lib/*" } }),
  "tsconfig.json": JSON.stringify({ ...JSON.parse(cfg), include: ["src"] }),
  "src/lib/util.ts": "export const fromUtil: number = 2;\n",
  "src/Child.svelte": child,
  "src/Parent.svelte": parent,
  "other/tsconfig.json": cfg,
  "other/Uses.svelte": `<script lang="ts">\n\timport Parent from '../src/Parent.svelte';\n\timport Child from '../src/Child.svelte';\n</script>\n<Parent /><Child label="x" />\n`,
};
const root = makeProject(tpl, files);
const env = { ...process.env, TSGO_BIN: process.env.TSGO_BIN ?? `${os.homedir()}/.bun/bin/tsrs` };

function startServer(root) {
  const proc = spawn(bin, ["--stdio"], { cwd: root, stdio: ["pipe", "pipe", "pipe"], env });
  const S = { proc, stderr: "", exited: null, nextId: 1, pending: new Map(), answeredIds: new Set(), dup: [], unknown: [], cancelledIds: new Set(), errorsByKind: {} };
  proc.stderr.on("data", (d) => { S.stderr += d.toString(); });
  proc.on("exit", (code, sig) => { S.exited = { code, sig }; });
  let buf = Buffer.alloc(0);
  S.send = (m) => { if (S.exited) return; const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); proc.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); proc.stdin.write(b); };
  S.request = (method, params, kind = method) => { const id = S.nextId++; const p = new Promise((res, rej) => S.pending.set(id, { res, rej, method, kind, params, at: Date.now() })); S.send({ id, method, params }); p.id = id; return p; };
  proc.stdout.on("data", (c) => { buf = Buffer.concat([buf, c]); for (;;) { const sep = buf.indexOf("\r\n\r\n"); if (sep < 0) return; const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]); if (buf.length < sep + 4 + len) return; const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString()); buf = buf.subarray(sep + 4 + len);
    if (msg.id !== undefined && msg.method === undefined) {
      if (S.answeredIds.has(msg.id)) { S.dup.push({ id: msg.id, msg: JSON.stringify(msg).slice(0, 300) }); continue; }
      const p = S.pending.get(msg.id);
      if (!p) { S.unknown.push(JSON.stringify(msg).slice(0, 200)); continue; }
      S.pending.delete(msg.id); S.answeredIds.add(msg.id);
      if (msg.error) { const k = `${p.kind}:${msg.error.code}${S.cancelledIds.has(msg.id) ? ":cancelled" : ""}:${String(msg.error.message).slice(0, 60)}`; S.errorsByKind[k] = (S.errorsByKind[k] ?? 0) + 1; p.rej(msg.error); } else p.res(msg.result);
    }
    else if (msg.id !== undefined) S.send({ id: msg.id, result: msg.method === "workspace/configuration" ? msg.params.items.map(() => null) : null }); } });
  return S;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uriOf = (root, rel) => pathToFileURL(path.join(root, rel)).href;
async function init(S, root) {
  await S.request("initialize", { processId: process.pid, rootUri: pathToFileURL(root).href, workspaceFolders: [{ uri: pathToFileURL(root).href, name: "fz" }],
    capabilities: { workspace: { configuration: true, workspaceFolders: true, didChangeWatchedFiles: { dynamicRegistration: true }, diagnostics: { refreshSupport: true } }, textDocument: { synchronization: { dynamicRegistration: true }, completion: { completionItem: { snippetSupport: true, resolveSupport: { properties: ["documentation", "detail", "additionalTextEdits"] } } }, diagnostic: { dynamicRegistration: true }, hover: { contentFormat: ["markdown"] }, publishDiagnostics: { relatedInformation: true } } } });
  S.send({ method: "initialized", params: {} });
}
const fmt = (d) => `${d.range.start.line}:${d.range.start.character}-${d.range.end.line}:${d.range.end.character}:${d.source ?? ""}:${d.code ?? ""}:${String(d.message).split("\n")[0].slice(0, 80)}`;
async function settle(S, root, rel, ms = 20000) { let last = null, same = 0; const t0 = Date.now(); for (;;) { let r; try { r = await S.request("textDocument/diagnostic", { textDocument: { uri: uriOf(root, rel) } }, "settle"); } catch (e) { r = { items: [{ range: { start: { line: -1, character: 0 }, end: { line: -1, character: 0 } }, message: "ERR " + JSON.stringify(e) }] }; } const d = JSON.stringify((r?.items ?? []).map(fmt).sort()); if (d === last) { if (++same >= 3) return JSON.parse(d); } else { same = 0; last = d; } if (Date.now() - t0 > ms) return JSON.parse(d); await sleep(300); } }

const S = startServer(root);
await init(S, root);
const uri = (rel) => uriOf(root, rel);
const docs = { "src/Parent.svelte": { text: parent, v: 1 }, "src/Child.svelte": { text: child, v: 1 } };
for (const [rel, d] of Object.entries(docs)) S.send({ method: "textDocument/didOpen", params: { textDocument: { uri: uri(rel), languageId: "svelte", version: 1, text: d.text } } });
const pos = (text, idx) => { const before = text.slice(0, idx); const line = before.split("\n").length - 1; const ch = idx - (before.lastIndexOf("\n") + 1); return { line, character: ch }; };
const snippets = ["{#if }", "{#if a}", "{:else}", "{/if}", "{#each xs as }", "{#each items as , i}", "{:then }", "{:catch }", "{#await }", "{#await p then }", "{@render s(", "{@const x = }", "{#snippet a(}", "{#key }", "<Child ", "<Child a={1} />", "$props(", "$bindable(", "runtime.", "items.", "store.", "import X from './", "import { a } from '#lib/", "import Child2 from './Child.svelte';", " ", "　", "é", "😀", "{", "}", "<", ">", "</", "\"", "'", "`", "${", "/*", "*/", "<!--", "-->", "<script>", "</script>", "<script lang=\"ts\">", "<style>", "</style>", "bind:value={", "onclick={() => ", "class:", "{@html ", "<svelte:head>", "export let ", "=", ".", "?.", "(", ")", "[", "]", ";", ",", ":", " as ", "\n", "\t", "<p>{a.</p>", "<div class=\"x\"", "generic=\"T\"", "<T extends ", "const n: number = 'x';", "go('s')", "}i<{", "x.go(1)", "let q = $state(0);"];
const reqKinds = ["completion", "completion", "hover", "hover", "diag", "diag", "diag", "symbol", "folding", "format", "codeAction", "codeAction", "codeLens", "definition", "signature", "selection", "inlay", "linked", "highlight", "references", "semantic"];
const recent = [];
const allEdits = [];
const inflight = [];
let answered = 0, errors = 0, cancels = 0;
function track(p, kind) { const w = p.then(() => { answered++; }, () => { errors++; }); inflight.push({ w, kind, p }); if (rnd() < Number(process.env.CANCEL_P ?? 0.25)) { const id = p.id; setTimeout(() => { if (S.pending.has(id)) { S.cancelledIds.add(id); cancels++; S.send({ method: "$/cancelRequest", params: { id } }); } }, Math.floor(rnd() * 60)); } }
function edit(rel) {
  const d = docs[rel]; const t = d.text; const r = rnd();
  let start = Math.floor(rnd() * (t.length + 1)), end = start, ins = "";
  if (r < 0.6) ins = pick(snippets);
  else if (r < 0.85) { end = Math.min(t.length, start + 1 + Math.floor(rnd() * 12)); }
  else { end = Math.min(t.length, start + 1 + Math.floor(rnd() * 6)); ins = pick(snippets); }
  const isLow = (i) => i > 0 && i < t.length && /[\udc00-\udfff]/.test(t[i]);
  if (isLow(start)) start--; if (isLow(end)) end++;
  if (end > t.length) end = t.length;
  const range = { start: pos(t, start), end: pos(t, end) };
  d.text = t.slice(0, start) + ins + t.slice(end); d.v++;
  recent.push({ rel, v: d.v, range, ins }); if (recent.length > 8) recent.shift();
  allEdits.push({ rel, range, ins, t: Date.now() });
  S.send({ method: "textDocument/didChange", params: { textDocument: { uri: uri(rel), version: d.v }, contentChanges: [{ range, text: ins }] } });
}
function ask(rel) {
  const d = docs[rel]; const t = d.text; let i = Math.floor(rnd() * (t.length + 1)); if (i > 0 && i < t.length && /[\udc00-\udfff]/.test(t[i])) i--;
  const td = { uri: uri(rel) }; const position = pos(t, i); const k = pick(reqKinds);
  const m = { completion: ["textDocument/completion", { textDocument: td, position, context: { triggerKind: 1 } }], hover: ["textDocument/hover", { textDocument: td, position }], diag: ["textDocument/diagnostic", { textDocument: td }], symbol: ["textDocument/documentSymbol", { textDocument: td }], folding: ["textDocument/foldingRange", { textDocument: td }], format: ["textDocument/formatting", { textDocument: td, options: { tabSize: 2, insertSpaces: false } }], codeAction: ["textDocument/codeAction", { textDocument: td, range: { start: position, end: position }, context: { diagnostics: [] } }], codeLens: ["textDocument/codeLens", { textDocument: td }], definition: ["textDocument/definition", { textDocument: td, position }], signature: ["textDocument/signatureHelp", { textDocument: td, position }], selection: ["textDocument/selectionRange", { textDocument: td, positions: [position] }], inlay: ["textDocument/inlayHint", { textDocument: td, range: { start: { line: 0, character: 0 }, end: pos(t, t.length) } }], linked: ["textDocument/linkedEditingRange", { textDocument: td, position }], highlight: ["textDocument/documentHighlight", { textDocument: td, position }], references: ["textDocument/references", { textDocument: td, position, context: { includeDeclaration: true } }], semantic: ["textDocument/semanticTokens/full", { textDocument: td }] };
  const [method, params] = m[k]; track(S.request(method, params, k), k);
}
await sleep(1000);
const iters = Number(itersArg);
for (let n = 0; n < iters && !S.exited; n++) {
  const rel = rnd() < 0.8 ? "src/Parent.svelte" : "src/Child.svelte";
  edit(rel);
  const k = Math.floor(rnd() * 4);
  for (let j = 0; j < k; j++) ask(rnd() < 0.8 ? rel : "src/Parent.svelte");
  if (rnd() < 0.03) S.send({ method: "workspace/didChangeWatchedFiles", params: { changes: [{ uri: uri("src/lib/util.ts"), type: 2 }] } });
  await sleep(rnd() < 0.08 ? 700 : 3 + Math.floor(rnd() * 40));
}
// every request must be answered, eventually
const waitAll = await Promise.race([Promise.all(inflight.map((x) => x.w)).then(() => "ok"), sleep(Number(process.env.FINAL_WAIT ?? 45000)).then(() => "timeout")]);
const unanswered = [...S.pending.entries()].filter(([, p]) => p.kind !== "settle").map(([id, p]) => `${p.kind} id ${id} pending ${Date.now() - p.at} ms${S.cancelledIds.has(id) ? " (cancelled)" : ""}`);
// final state against a fresh server
const final = {};
for (const rel of Object.keys(docs)) final[rel] = await settle(S, root, rel);
const root2 = makeProject(tpl, files);
const S2 = startServer(root2);
await init(S2, root2);
// open the initial texts and change them to the final ones in one edit: tsgo keeps a buffer's first
// language id (a pre-existing behaviour), so a fresh open of the final text alone is not comparable.
const initial = { "src/Parent.svelte": parent, "src/Child.svelte": child };
for (const [rel, d] of Object.entries(docs)) S2.send({ method: "textDocument/didOpen", params: { textDocument: { uri: uriOf(root2, rel), languageId: "svelte", version: 1, text: initial[rel] } } });
await sleep(1500);
for (const [rel, d] of Object.entries(docs)) S2.send({ method: "textDocument/didChange", params: { textDocument: { uri: uriOf(root2, rel), version: 2 }, contentChanges: [{ text: d.text }] } });
await sleep(500);
const fresh = {};
for (const rel of Object.keys(docs)) fresh[rel] = await settle(S2, root2, rel);
const mismatch = {};
for (const rel of Object.keys(docs)) { const a = final[rel], b = fresh[rel]; const onlyFuzz = a.filter((x) => !b.includes(x)), onlyFresh = b.filter((x) => !a.includes(x)); if (onlyFuzz.length || onlyFresh.length) mismatch[rel] = { onlyFuzz, onlyFresh }; }
await sleep(300);
if (process.env.STDERR_OUT) fs.writeFileSync(process.env.STDERR_OUT, S.stderr);
const panics = S.stderr.split("\n").filter((l) => /panicked at/.test(l));
const restarts = (S.stderr.match(/restarting tsgo[^\n]*/g) ?? []);
const didNotAnswer = (S.stderr.match(/tsgo did not answer[^\n]*/g) ?? []);
const out = { seed: Number(seedArg), iters, exited: S.exited, answered, errors, cancels, waitAll, unanswered: unanswered.slice(0, 8), dup: S.dup.slice(0, 5), unknown: S.unknown.slice(0, 5), errorsByKind: S.errorsByKind, panics: panics.slice(0, 5), restarts, didNotAnswer: didNotAnswer.slice(0, 5), mismatch };
if (S.exited || unanswered.length || S.dup.length || panics.length || Object.keys(mismatch).length || restarts.length) { out.recent = recent; out.parent = docs["src/Parent.svelte"].text; out.child = docs["src/Child.svelte"].text; out.stderrTail = S.stderr.slice(-2500); }
if (Object.keys(mismatch).length && process.env.SEQ_DIR) { fs.mkdirSync(process.env.SEQ_DIR, { recursive: true }); fs.writeFileSync(path.join(process.env.SEQ_DIR, `seq-${seedArg}.json`), JSON.stringify({ parent, child, edits: allEdits, final: Object.fromEntries(Object.entries(docs).map(([k, d]) => [k, d.text])), mismatch })); }
console.log(JSON.stringify(out));
for (const X of [S, S2]) { try { const p = X.request("shutdown", null); await Promise.race([p, sleep(2000)]); X.send({ method: "exit" }); } catch {} }
await sleep(200); S.proc.kill("SIGKILL"); S2.proc.kill("SIGKILL");
if (!process.env.KEEP) { fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(root2, { recursive: true, force: true }); } else console.error("kept", root, root2);
process.exit(0);
