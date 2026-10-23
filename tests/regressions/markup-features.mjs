// Hover, completion and import quick fixes in markup, for svelte-rs and the official server side by side.
//
// Usage: node tests/regressions/markup-features.mjs <svelte-rs binary | svelte-ls> [tests/regressions/tpl]
// Builds a throwaway project from tpl (a project with `svelte` installed) and asks, in Page.svelte:
//   hover on a component prop name, a `bind:` directive name, an element attribute name, a shorthand;
//   completion after `<MyCom` (imported component), `<OtherWid` (component not imported yet), `<`, and
//   `OtherWid` in the script, each resolved as the editor does (auto-import edits arrive there);
//   the quick fixes for `<OtherWidget size={1} />` and for `helper()` in the script, neither imported.
// Prints one JSON object: what each query answered (hover text, completion labels, and each
// additional edit as `line:character newText`). KEEP=1 keeps the project and prints its path.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [server, tplArg = path.join(HERE, "tpl")] = process.argv.slice(2);
const ZED = `${process.env.HOME}/Library/Application Support/Zed`;
const tpl = path.resolve(tplArg);
const root = fs.mkdtempSync(path.join(path.dirname(tpl), "run-"));
fs.cpSync(tpl, root, { recursive: true });
const files = {
	"package.json": '{"name":"markup","private":true,"type":"module"}',
	"tsconfig.json": JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } }),
	"MyComponent.svelte": `<script lang="ts">\n\tlet { value, label }: { value: boolean; label: string } = $props();\n</script>\n\n<p>{label} {value}</p>\n`,
	"OtherWidget.svelte": `<script lang="ts">\n\tlet { size }: { size: number } = $props();\n</script>\n\n<p>{size}</p>\n`,
	"helpers.ts": "export function helper() { return 1; }\n",
};
const page = [
	`<script lang="ts">`,
	`\timport MyComponent from "./MyComponent.svelte";`,
	`\tlet name = $state("x");`,
	`\tlet on = $state(true);`,
	`\tconst label = "hi";`,
	`</script>`,
	``,
	`<MyComponent value={on} {label} />`,
	`<input bind:value={name} placeholder="p" />`,
	`<MyComponent bind:value={on} label="x" />`,
	`<div class="box" hidden>text</div>`,
	``,
].join("\n");
// One half-typed tag per document, as when the user is typing it.
const typing = (tag) => page.replace("</script>\n", "</script>\n").trimEnd() + `\n${tag}`;
for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(root, name), text);
fs.writeFileSync(path.join(root, "Page.svelte"), page);

const spec = server === "svelte-ls"
	? { cmd: "node", args: [`${ZED}/extensions/work/svelte/node_modules/svelte-language-server/bin/server.js`, "--stdio"] }
	: { cmd: path.resolve(server), args: ["--stdio"] };
const child = spawn(spec.cmd, spec.args, { cwd: root, stdio: ["pipe", "pipe", "pipe"] });
child.stderr.on("data", (d) => process.env.LOG && process.stderr.write(d));
let buf = Buffer.alloc(0), id = 1;
const pending = new Map();
const send = (m) => { const b = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...m })); child.stdin.write(`Content-Length: ${b.length}\r\n\r\n`); child.stdin.write(b); };
const request = (method, params) => new Promise((resolve) => { const i = id++; pending.set(i, resolve); send({ id: i, method, params }); });
child.stdout.on("data", (chunk) => {
	buf = Buffer.concat([buf, chunk]);
	for (;;) {
		const sep = buf.indexOf("\r\n\r\n"); if (sep < 0) return;
		const len = Number(/Content-Length: (\d+)/i.exec(buf.subarray(0, sep).toString())[1]);
		if (buf.length < sep + 4 + len) return;
		const msg = JSON.parse(buf.subarray(sep + 4, sep + 4 + len).toString()); buf = buf.subarray(sep + 4 + len);
		if (msg.id !== undefined && msg.method === undefined) { pending.get(msg.id)?.(msg.result); pending.delete(msg.id); }
		else if (msg.id !== undefined) send({ id: msg.id, result: msg.method === "workspace/configuration" ? msg.params.items.map(() => null) : null });
	}
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await request("initialize", {
	processId: process.pid, rootUri: pathToFileURL(root).href, workspaceFolders: [{ uri: pathToFileURL(root).href, name: "markup" }],
	capabilities: { textDocument: { hover: { contentFormat: ["markdown", "plaintext"] }, completion: { completionItem: { snippetSupport: true } }, codeAction: { codeActionLiteralSupport: { codeActionKind: { valueSet: ["quickfix"] } } } }, workspace: { configuration: true, workspaceEdit: { documentChanges: true } } },
});
send({ method: "initialized", params: {} });
const uri = pathToFileURL(path.join(root, "Page.svelte")).href;
send({ method: "textDocument/didOpen", params: { textDocument: { uri, languageId: "svelte", version: 1, text: page } } });
await sleep(Number(process.env.SETTLE_MS ?? 4000));

const lines = page.split("\n");
const at = (line, needle, offset = 1) => ({ line, character: lines[line].indexOf(needle) + offset });
const hoverText = (h) => {
	const c = h?.contents; if (!c) return null;
	const v = typeof c === "string" ? c : Array.isArray(c) ? c.map((x) => x.value ?? x).join(" ") : c.value;
	return String(v).replace(/```\w*\n?|```/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
};
const labels = (r) => (Array.isArray(r) ? r : r?.items ?? []).map((i) => i.label);
const out = {};
for (const [name, position] of [
	["hover component prop `value`", at(7, "value={on}", 2)],
	["hover component shorthand `{label}`", at(7, "{label}", 2)],
	["hover component tag `MyComponent`", at(7, "MyComponent", 3)],
	["hover bind:value directive name", at(8, "bind:value", 7)],
	["hover bind:value expression `name`", at(8, "{name}", 2)],
	["hover element attribute `placeholder`", at(8, "placeholder", 3)],
	["hover component bind:value name", at(9, "bind:value", 7)],
	["hover element tag name `input`", at(8, "input", 2)],
	["hover element tag name `div`", at(10, "div", 1)],
	["hover static attribute `class`", at(10, "class", 2)],
	["hover boolean attribute `hidden`", at(10, "hidden", 2)],
]) out[name] = hoverText(await request("textDocument/hover", { textDocument: { uri }, position }));
let version = 1;
// In the script: the auto-import must land among the imports, not in `<script`.
const inScript = page.replace("</script>", "\tconst w = OtherWid\n</script>");
const scriptPosition = { line: inScript.split("\n").findIndex((l) => l.includes("OtherWid")), character: "\tconst w = OtherWid".length };
for (const [name, tag, want, scriptText] of [
	["complete `<MyCom` (imported)", "<MyCom", "MyComponent"],
	["complete `<OtherWid` (not imported)", "<OtherWid", "OtherWidget"],
	["complete `<` (any tag)", "<", "MyComponent"],
	["complete `OtherWid` in the script", "OtherWid", "OtherWidget", inScript],
]) {
	const text = scriptText ?? typing(tag);
	send({ method: "textDocument/didChange", params: { textDocument: { uri, version: ++version }, contentChanges: [{ text }] } });
	await sleep(500);
	const position = scriptText ? scriptPosition : { line: text.split("\n").length - 1, character: tag.length };
	const r = await request("textDocument/completion", { textDocument: { uri }, position, context: tag === "<" ? { triggerKind: 2, triggerCharacter: "<" } : { triggerKind: 1 } });
	const items = Array.isArray(r) ? r : r?.items ?? [];
	const found = items.find((i) => i.label === want);
	// Auto-import edits arrive on resolve, as the editor asks for them.
	const hit = found && (await request("completionItem/resolve", found)) || found;
	out[name] = { offered: !!hit, count: items.length, item: hit && { kind: hit.kind, detail: hit.detail, textEdit: hit.textEdit?.newText ?? hit.insertText, additionalEdits: (hit.additionalTextEdits ?? []).map((e) => `${e.range.start.line}:${e.range.start.character} ${JSON.stringify(e.newText)}`) }, sample: items.slice(0, 5).map((i) => i.label) };
}
// Quick fixes for a `Cannot find name`, as the editor asks with the diagnostic it was shown.
for (const [name, text, word] of [
	["quick fix `<OtherWidget />` (not imported)", page.trimEnd() + "\n<OtherWidget size={1} />\n", "OtherWidget"],
	["quick fix `helper()` in the script", page.replace("</script>", "\tconst n = helper();\n</script>"), "helper"],
]) {
	send({ method: "textDocument/didChange", params: { textDocument: { uri, version: ++version }, contentChanges: [{ text }] } });
	await sleep(500);
	const textLines = text.split("\n");
	const line = textLines.findIndex((l) => new RegExp(`[<\\s]${word}\\b`).test(l));
	const character = textLines[line].indexOf(word);
	const range = { start: { line, character }, end: { line, character: character + word.length } };
	const diagnostic = { range, severity: 1, code: 2304, source: "ts", message: `Cannot find name '${word}'.` };
	const actions = await request("textDocument/codeAction", { textDocument: { uri }, range, context: { diagnostics: [diagnostic], only: ["quickfix"] } });
	out[name] = (actions ?? []).map((a) => {
		const edits = [...Object.values(a.edit?.changes ?? {}).flat(), ...(a.edit?.documentChanges ?? []).flatMap((c) => c.edits ?? [])];
		return `${a.title} @ ${edits.map((e) => `${e.range.start.line}:${e.range.start.character} ${JSON.stringify(e.newText.trim())}`).join(" | ")}`;
	});
}
console.log(JSON.stringify(out, null, 1));
child.kill("SIGKILL");
if (!process.env.KEEP) fs.rmSync(root, { recursive: true, force: true }); else console.error(root);
process.exit(0);
