// S11: go-to-definition (and typeDefinition / implementation) into a component lands on the
// component's .svelte file, from a component tag, from its import binding and from the module
// specifier, whether the child is open in the editor or not (round-1 e2e 4c/4c2: tsgo answers with
// the generated default export or the whole-file range of the child's shadow, which the response
// mapper dropped).
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const parent = `<script lang="ts">\n\timport Child from './Child.svelte';\n</script>\n\n<Child label="x" />\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"s11","private":true,"type":"module"}',
  "app/tsconfig.json": cfg,
  "app/Parent.svelte": parent,
  "app/Child.svelte": `<script lang="ts">\n\tlet { label }: { label: string } = $props();\n</script>\n\n<p>{label}</p>\n`,
});
const s = await session(bin, root);
s.open("app/Parent.svelte", parent);
await s.settle("app/Parent.svelte");
const at = (line, character) => ({ textDocument: { uri: s.uri("app/Parent.svelte") }, position: { line, character } });
const where = (r) => (Array.isArray(r) ? r : r ? [r] : []).map((l) => `${(l.targetUri ?? l.uri).split("/").slice(-1)[0]}:${(l.targetSelectionRange ?? l.range).start.line}:${(l.targetSelectionRange ?? l.range).start.character}`);
const out = {};
for (const [state, prepare] of [["closed", () => {}], ["open", () => s.open("app/Child.svelte")]]) {
  prepare();
  await s.sleep(300);
  out[state] = {
    tag: where(await s.request("textDocument/definition", at(4, 2))),
    binding: where(await s.request("textDocument/definition", at(1, 9))),
    specifier: where(await s.request("textDocument/definition", at(1, 22))),
    typeDefinitionTag: where(await s.request("textDocument/typeDefinition", at(4, 2))),
    implementationTag: where(await s.request("textDocument/implementation", at(4, 2))),
  };
}
out.ok = ["closed", "open"].every((state) => ["tag", "binding", "specifier"].every((k) => out[state][k].length > 0 && out[state][k].every((l) => l.startsWith("Child.svelte:"))));
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
