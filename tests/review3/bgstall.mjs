// After the editor's first project is served and the editor goes quiet, does the background load
// the remaining project? Runs one kind of editor request (or none) a few times first.
import { client } from "./client.mjs";
import { makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, kind = "none", count = "5"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const parent = `<script lang="ts">\n\timport Child from './Child.svelte';\n\tconst later: number = 1;\n\tfunction go(x: number) { return x * 2; }\n</script>\n\n<Child label="x" />\n<p>{later} {go(later)}</p>\n`;
const root = makeProject(tpl, { "package.json": '{"name":"bs","private":true,"type":"module"}', "tsconfig.json": JSON.stringify({ ...JSON.parse(cfg), include: ["src"] }),
  "src/Child.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n<p>{label}</p>\n`, "src/Parent.svelte": parent,
  "third/tsconfig.json": cfg, "third/X.svelte": `<script lang="ts">\n\tconst q: number = 1;\n</script>\n<p>{q}</p>\n` });
const c = await client(bin, root);
c.open("src/Parent.svelte", parent);
const td = { uri: c.uri("src/Parent.svelte") };
await c.request("textDocument/diagnostic", { textDocument: td });
const reqs = {
  none: null,
  hover: () => c.request("textDocument/hover", { textDocument: td, position: { line: 2, character: 8 } }),
  completion: () => c.request("textDocument/completion", { textDocument: td, position: { line: 7, character: 5 }, context: { triggerKind: 1 } }),
  componentCompletion: () => c.request("textDocument/completion", { textDocument: td, position: { line: 6, character: 7 }, context: { triggerKind: 1 } }),
  signature: () => c.request("textDocument/signatureHelp", { textDocument: td, position: { line: 7, character: 15 } }),
  diag: () => c.request("textDocument/diagnostic", { textDocument: td }),
  inlay: () => c.request("textDocument/inlayHint", { textDocument: td, range: { start: { line: 0, character: 0 }, end: { line: 8, character: 0 } } }),
  format: () => c.request("textDocument/formatting", { textDocument: td, options: { tabSize: 2, insertSpaces: false } }),
  codeAction: () => c.request("textDocument/codeAction", { textDocument: td, range: { start: { line: 2, character: 8 }, end: { line: 2, character: 8 } }, context: { diagnostics: [] } }),
  definition: () => c.request("textDocument/definition", { textDocument: td, position: { line: 7, character: 5 } }),
  highlight: () => c.request("textDocument/documentHighlight", { textDocument: td, position: { line: 2, character: 8 } }),
  semantic: () => c.request("textDocument/semanticTokens/full", { textDocument: td }),
  selection: () => c.request("textDocument/selectionRange", { textDocument: td, positions: [{ line: 2, character: 8 }] }),
  linked: () => c.request("textDocument/linkedEditingRange", { textDocument: td, position: { line: 7, character: 1 } }),
  folding: () => c.request("textDocument/foldingRange", { textDocument: td }),
  symbol: () => c.request("textDocument/documentSymbol", { textDocument: td }),
  codeLens: () => c.request("textDocument/codeLens", { textDocument: td }),
  hoverTemplate: () => c.request("textDocument/hover", { textDocument: td, position: { line: 7, character: 5 } }),
};
if (reqs[kind]) for (let i = 0; i < Number(count); i++) await reqs[kind]().catch(() => {});
await c.sleep(4000);
const loaded = /third\/tsconfig.json \(\d+ components\) in \d+ ms in the background/.test(c.log.join(""));
console.log(JSON.stringify({ kind, thirdLoadedInBackground: loaded }));
await c.end();
fs.rmSync(root, { recursive: true, force: true });
