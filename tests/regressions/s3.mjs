// S3: a component first opened in the editor (didOpen before its CREATED event) never joins its
// owner's `owned` set, so a copy in a later-loaded project at the same depth answers for it.
import { session, makeProject } from "./h.mjs";
import fs from "node:fs";
const [bin, tpl] = process.argv.slice(2);
const opts = (strict) => JSON.stringify({ compilerOptions: { strict, target: "ESNext", module: "ESNext", moduleResolution: "bundler", verbatimModuleSyntax: true, skipLibCheck: true, types: [] } });
const implicitAny = `<script lang="ts">\n\tfunction f(x) {\n\t\treturn x;\n\t}\n\tf(1);\n</script>\n`;
const root = makeProject(tpl, {
  "package.json": '{"name":"s3","private":true,"type":"module"}',
  "b/tsconfig.json": opts(true), // the owner is strict
  "b/Other.svelte": `<p>other</p>\n`,
  "b/Existing.svelte": implicitAny,
  "a/tsconfig.json": opts(false), // the project holding copies is not
  "a/Uses.svelte": `<script lang="ts">\n\timport Fresh from '../b/Fresh.svelte';\n\timport Existing from '../b/Existing.svelte';\n</script>\n\n<Fresh />\n<Existing />\n`,
});
const s = await session(bin, root);
const out = {};
s.open("b/Other.svelte"); // loads b
await s.settle("b/Other.svelte");
s.open("b/Fresh.svelte", implicitAny); // a new file: the editor opens it first...
out.freshBeforeCopy = await s.settle("b/Fresh.svelte");
s.write("b/Fresh.svelte", implicitAny); // ...then it reaches disk
s.watched([["b/Fresh.svelte", 1]]);
await s.sleep(500);
s.open("a/Uses.svelte"); // loads a, which copies b/Fresh.svelte and b/Existing.svelte
await s.settle("a/Uses.svelte", 6000);
out.freshAfterCopy = await s.settle("b/Fresh.svelte", 6000);
s.open("b/Existing.svelte");
out.existingAfterCopy = await s.settle("b/Existing.svelte", 6000);
console.log(JSON.stringify(out, null, 1));
await s.end();
fs.rmSync(root, { recursive: true, force: true });
