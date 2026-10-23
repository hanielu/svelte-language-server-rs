// Half-typed documents (the state of most keystrokes) must keep the language features of everything
// around the edit. Each step edits an unsaved buffer and checks what the editor would see:
//   script: `runtime.` before </script> completes runtime's members, and no import reports 2307
//           while `runtime.` / `foo(` / `let x =` / `import { a }` is being typed;
//   template: a child with an `{#if}` left open still exports its props to the parent, and an
//           opening tag being typed above an element (`<div class="x"` before `<p>…</p>`) keeps
//           the template's diagnostics.
// usage: node incomplete-edits.mjs <server-binary> <tpl-dir>
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] }, include: ["src"] });
const child = `<script lang="ts">\n\tlet { count }: { count: number } = $props();\n</script>\n\n<p>{count}</p>\n`;
const parent = `<script lang="ts">\n\timport Child from "./Child.svelte";\n\timport { runtime } from "./runtime";\n\tlet { label }: { label: string } = $props();\n</script>\n\n<Child count={label} />\n<p>{runtime.title}</p>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"incomplete-edits","private":true,"type":"module"}',
  "tsconfig.json": cfg,
  "src/runtime.ts": "export const runtime = { title: 'x', i18n: 1, manifest: 2 };\n",
  "src/Child.svelte": child,
  "src/Parent.svelte": parent,
});
const s = await session(bin, root);
const out = { steps: {} };
const P = "src/Parent.svelte";
const C = "src/Child.svelte";
// The prop error every step must keep seeing: `label` (string) given to `count` (number).
const childLine = (text) => text.split("\n").findIndex((l) => l.includes("<Child count"));
const propError = (ds, text) => ds.some((d) => d.startsWith(`${childLine(text)}:2322:`));
const unresolved = (ds) => ds.filter((d) => d.split(":")[1] === "2307");
s.open(C);
s.open(P);
out.initial = await s.settle(P, 8000);

const scriptEnd = parent.indexOf("</script>");
const typed = (text) => parent.slice(0, scriptEnd) + text + parent.slice(scriptEnd);
async function scriptStep(name, text, completionAt) {
  s.change(P, typed(text));
  const ds = await s.settle(P, 6000);
  const step = { unresolved: unresolved(ds), propErrorKept: propError(ds, typed(text)) };
  if (completionAt) {
    const res = await s.request("textDocument/completion", { textDocument: { uri: s.uri(P) }, position: completionAt, context: { triggerKind: 2, triggerCharacter: "." } });
    const labels = (Array.isArray(res) ? res : res?.items ?? []).map((i) => (typeof i.label === "string" ? i.label : i.label?.label));
    step.completions = ["title", "i18n", "manifest"].filter((l) => labels.includes(l));
  }
  step.ok = step.unresolved.length === 0 && step.propErrorKept && (!completionAt || step.completions.length === 3);
  out.steps[name] = step;
}
await scriptStep("member", "\truntime.\n", { line: 4, character: "\truntime.".length });
await scriptStep("call", "\tfoo(\n");
await scriptStep("initializer", "\tlet x =\n");
await scriptStep("import", "\timport { a }\n");

// Template: the child's `{#if}` left open must not cost it its default export.
s.change(P, parent);
s.change(C, child + "{#if count}\n<p>more</p>\n");
const withOpenChild = await s.settle(P, 6000);
out.steps.childBlockOpen = { parent: withOpenChild, ok: propError(withOpenChild, parent) };
s.change(C, child);

// Template: an opening tag being typed above an element keeps the template's diagnostics.
const openTag = parent.replace("<p>{runtime", '<div class="x"\n<p>{runtime');
s.change(P, openTag);
const withOpenTag = await s.settle(P, 6000);
out.steps.openingTag = { parent: withOpenTag, ok: propError(withOpenTag, openTag) };

out.ok = Object.values(out.steps).every((step) => step.ok);
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
