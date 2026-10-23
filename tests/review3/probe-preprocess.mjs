// Component-attribute completion right after a keystroke, as an editor sends it, in a project with
// and without a svelte.config.js: does the preprocess result that follows every keystroke land in
// the in-place probe and take the component's props out of the answer?
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl, withConfig = "yes", rounds = "20"] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const files = {
  "package.json": '{"name":"pp","private":true,"type":"module"}', "tsconfig.json": cfg,
  "Child.svelte": `<script lang="ts">\n\tlet { alphaProp, betaProp }: { alphaProp: string; betaProp: number } = $props();\n</script>\n\n<p>{alphaProp}{betaProp}</p>\n`,
  "Parent.svelte": `<script lang="ts">\n\timport Child from './Child.svelte';\n\tconst later: number = 1;\n</script>\n\n<Child />\n<p>{later}</p>\n`,
};
if (withConfig === "yes") files["svelte.config.js"] = "export default {};\n";
const root = makeProject(tpl, files);
const s = await session(bin, root);
s.open("Parent.svelte");
await s.settle("Parent.svelte");
await s.sleep(1500);
const td = { uri: s.uri("Parent.svelte") };
let withProps = 0, n = Number(rounds);
const base = fs.readFileSync(`${root}/Parent.svelte`, "utf8");
for (let i = 0; i < n; i++) {
  // a keystroke inside the tag (a space after `<Child`), then the completion there
  const text = base.replace("<Child />", `<Child ${" ".repeat(i % 2)}/>`);
  s.change("Parent.svelte", text);
  const r = await s.request("textDocument/completion", { textDocument: td, position: { line: 5, character: 7 }, context: { triggerKind: 1 } });
  if ((Array.isArray(r) ? r : r?.items ?? []).some((x) => /alphaProp/.test(x.label))) withProps++;
  await s.sleep(300);
}
const preprocessed = /preprocess/i.test(s.log.join(""));
console.log(JSON.stringify({ svelteConfig: withConfig, rounds: n, completionsWithProps: withProps }));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
