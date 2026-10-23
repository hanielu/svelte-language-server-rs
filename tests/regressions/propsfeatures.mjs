// What the editor gets around a `$props()` annotation that becomes the `$$ComponentProps` alias and a
// `generics` attribute: hovers on the annotation's names and on the type parameter, and the
// diagnostics of an unknown type in the annotation and of an unknown constraint.
// Usage: node propsfeatures.mjs <binary> <tpl>
import { session, makeProject } from "../review3/h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const cfg = JSON.stringify({ compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const card = `<script lang="ts">\n\ttype Size = 'sm' | 'lg';\n\tlet { kind, n }: { kind: Size; n: Missing } = $props();\n</script>\n<p>{kind}{n}</p>\n`;
const list = `<script lang="ts" generics="T extends Unknown">\n\tlet { item }: { item: T } = $props();\n</script>\n<p>{String(item)}</p>\n`;
const root = makeProject(tpl, { "package.json": '{"name":"pf","private":true,"type":"module"}', "tsconfig.json": cfg, "Card.svelte": card, "List.svelte": list });
const s = await session(bin, root);
const out = {};
for (const [rel, text] of [["Card.svelte", card], ["List.svelte", list]]) {
  s.open(rel, text);
  const r = { diagnostics: await s.settle(rel) };
  r.hovers = {};
  const src = text.split("\n");
  for (const word of rel === "Card.svelte" ? ["kind", "Size", "Missing"] : ["T", "Unknown", "item"]) {
    for (const [ln, l] of src.entries()) {
      const at = l.indexOf(word, ln === 0 ? 1 : l.indexOf(":"));
      if (at < 0 || (ln === 0 && word === "item")) continue;
      const h = await s.hover(rel, ln, at).catch((e) => ({ error: e.message }));
      const c = h?.contents; const v = typeof c === "string" ? c : c?.value ?? (Array.isArray(c) ? c.map((x) => x.value ?? x).join("\n") : undefined);
      r.hovers[`${word}@${ln}:${at}`] = v?.split("\n").filter((x) => x && !x.startsWith("```")).join(" ").slice(0, 60) ?? h?.error ?? null;
      break;
    }
  }
  out[rel] = r;
}
console.log(JSON.stringify(out, null, 1));
await s.end(); fs.rmSync(root, { recursive: true, force: true }); process.exit(0);
