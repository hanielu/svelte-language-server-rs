# Patches to rsvelte

svelte-language-server-rs runs rsvelte's language server unchanged except for the commits below, which live on
the `svelte-language-server-rs` branch of the `vendor/rsvelte` submodule (base: upstream `5ed8ea3`; head: `389817e`).
Patches 1–21, 26–31, 41–46, 50–54, 55–64 and 67–72 touch `crates/rsvelte_language_server` only; 22–25,
32–40, 47–49, 65–66 and 73–80 touch the projection (`crates/rsvelte_projection`) and the loose parser
(`crates/rsvelte_core`), except 35, which is in the language server. 22–25 were developed on the
branch `svelte-rs-projection` (on `b925b7c`) and merged with `8b7902f`; 26–31 sit on `8b7902f`;
32–40 were developed on `svelte-rs-projection` (on `8b7902f`) and merged with `7793da7`; 41–46 sit
on `7793da7`; 47–49 were developed on `svelte-rs-projection` (on `7793da7`) and merged with
`670722d`; 50–54 sit on `670722d`; 55–64 (the fifth review, language server) sit on `7179942`; 65–66
(the fifth review, projection) were developed on `svelte-rs-projection` (on `7179942`) and merged into
`245dbfb` with `8c8c100`; 67–72 (the sixth review, language server) sit on `8c8c100`; 73–80 (the
sixth review, projection) were developed on `svelte-rs-projection` (on `8c8c100`) and merged into
`3c82cbc` with `c921b00`. None of the five merges had a conflict. Round 5's final integration's `git
merge --no-ff svelte-rs-projection` found nothing to merge (the projection branch was still at
`670722d`, already in `svelte-language-server-rs`) and made no commit, so that final build is `7179942` itself.

| # | commit | patch |
|---|---|---|
| 1 | `560d231` | fix: keep editor buffers out of watched-file refreshes |
| 2 | `b5ce1d2` | perf: keep closed component shadows on disk |
| 3 | `b488a6b` | perf: answer "which Svelte config preprocesses this" once |
| 4 | `774d7fe` | perf: load each project on demand, with the components it owns |
| 5 | `9e6c03e` | perf: project a loading project's components in parallel |
| 6 | `3fb482b` | perf: apply watched-file events to the files they name |
| 7 | `b925b7c` | fix: resolve packages from a nested project's `node_modules` |
| 8 | `87964c9` | fix: copy an editor-open component from its buffer |
| 9 | `5665a91` | fix: follow the imports of documents the editor has open |
| 10 | `55c096c` | fix: bring a deleted copy back when its file returns |
| 11 | `3274b2b` | fix: own a component that joins outside discovery |
| 12 | `e256abf` | fix: notice a deleted directory whose name has a dot |
| 13 | `f4d8569` | fix: serve a dependency's component opened from `node_modules` |
| 14 | `1aacda5` | fix: give a project loaded later the editor's unsaved buffers |
| 15 | `376498b` | fix: ask the owning project about a component's attributes |
| 16 | `b159015` | perf: open only the JavaScript components open documents reach |
| 17 | `58cfeae` | feat: load the remaining projects in the background |
| 18 | `938ee21` | fix: go to a component's file from its tag, import or specifier |
| 19 | `6ff0395` | fix: resolve `package.json` imports (`#lib/*`) from shadows |
| 20 | `1880dd8` | perf: probe a component's attributes in the shadow's own buffer |
| 21 | `2c6a9f7` | perf: register a tsgo file watcher only when it adds an event |
| 22 | `f81f3c0` | fix(projection): recover a program from a script that does not parse yet |
| 23 | `c662f2b` | fix(projection): close blocks and components that loose parsing left open |
| 24 | `d057a1b` | fix(parser): backtrack to an opening tag read as an attribute in loose mode |
| 25 | `1ed0172` | fix(parser): pop a block that loose parsing closed before an element's end |
| 26 | `69d9a1d` | fix: let the editor watch `node_modules` for tsgo again |
| 27 | `02e6b31` | fix: end a probe before an edit, not after it |
| 28 | `c9a889a` | fix: send a request's tsgo half before a later edit |
| 29 | `8b896ba` | fix: shadow a dependency's file beside the mirrored tree |
| 30 | `6fbb3d5` | fix: watch the package directory a mirror link points at |
| 31 | `42d8d9e` | fix: do not count the editor's answers as activity |
| 32 | `0475b1f` | fix(parser): read `{:then }` as a branch without a binding in loose mode |
| 33 | `4421ca4` | fix(projection): project `{#each items as }` as an each block without a context |
| 34 | `c1933b5` | fix(projection): read `$bindable(…)` in an exported props destructure from the script |
| 35 | `77ef466` | fix: keep serving when a component's projection panics |
| 36 | `5d7aee0` | fix(projection): never write a recovery fill into a blanked multibyte character |
| 37 | `eeab3f3` | fix(projection): drop a whole character after a component's tag name |
| 38 | `870675d` | fix(projection): project `{#await }` without relocating an empty promise |
| 39 | `411ce82` | fix(projection): find a binding's assertion keyword without slicing inside a character |
| 40 | `c822c10` | fix(projection): end a script's content at a closing tag after its start |
| 41 | `fd0d609` | perf: never make an edit wait for a document's analysis |
| 42 | `3ff6b32` | fix: read a style block without its closing tag to the end |
| 43 | `5728ed0` | fix: drop syntax errors that map into a script's opening tag |
| 44 | `8a5c611` | fix: answer a request tsgo never answers, and do not let it hold the background |
| 45 | `edc03b7` | fix: restart tsgo when a request about a document never finishes |
| 46 | `1d4cb87` | fix: resolve a copied component's `#` imports in its own package |
| 47 | `8d6bf69` | fix(projection): end a stray script's opening tag where upstream's regex does |
| 48 | `cd867b9` | fix(projection): close a recovered declaration's brackets in its hoisted copy |
| 49 | `bf0dca5` | fix(projection): end a type body left open before the declaration it swallowed |
| 50 | `8bf20ab` | fix: wait for a slow check, and restart tsgo only for a request it loops on |
| 51 | `f586aff` | fix: have the editor pull diagnostics again after tsgo restarts |
| 52 | `1d777cd` | fix: read the answers tsgo already sent before counting a request as lost |
| 53 | `d726645` | perf: read a component once per folding answer, not once per range |
| 54 | `7179942` | perf: map a tsgo position without scanning the shadow up to it |
| 55 | `9d1475b` | fix: keep rename edits and locations out of a script's opening tag |
| 56 | `abc01ae` | fix: never return two different rename edits for one stretch of text |
| 57 | `7d96446` | fix: keep syntax errors in a script's generics value |
| 58 | `2aa020e` | test: write each line of the fake tsgo's log at once |
| 59 | `843a85d` | fix: restart tsgo only for a request tsrs is known to loop on |
| 60 | `f91e003` | fix: never count a request as a loop while a pull of its document runs |
| 61 | `254c785` | fix: reset the restart backoff after a quiet period |
| 62 | `1d849ed` | fix: send tsgo one request it loops on per document at a time |
| 63 | `841697a` | fix: drop a rename edit whose source text is not the name it renames |
| 64 | `245dbfb` | fix: read a template's substitutions as tsgo does when deciding it loops |
| 65 | `1ed10ba` | fix(projection): map the `$$ComponentProps` alias back to the annotation it repeats |
| 66 | `1862ff2` | fix(projection): keep a generics attribute's value in place in `$$render<…>` |
| 67 | `9fc08b1` | fix: read a regular expression as one token when deciding tsrs loops |
| 68 | `f167318` | fix: restart a tsgo that stops answering, whatever the loop model says |
| 69 | `656c449` | fix: expand a directive shorthand when renaming the variable it reads |
| 70 | `ea13b10` | fix: keep the `$` of a store's uses when renaming it from one |
| 71 | `46c3cd6` | fix: list a store's references and its `$store` value's together |
| 72 | `3c82cbc` | fix: put a diagnostic in the text before a copy on the copied text |
| 73 | `d727500` | fix(projection): keep a component's name in place in its closing tag |
| 74 | `6f76c76` | fix(projection): keep a snippet's name and parameters in place |
| 75 | `74639b9` | fix(projection): keep an each block's key in place |
| 76 | `6113352` | fix(projection): keep a `style:` shorthand's name in place |
| 77 | `6e85421` | fix(projection): map a directive the opener checks after a later attribute |
| 78 | `5cddf8a` | fix(projection): map the author's text in a repaired `$$ComponentProps` alias |
| 79 | `1517287` | fix(projection): keep a snippet's type parameters in place |
| 80 | `476f489` | fix(projection): keep an each block's index name in place |

Patches 1–7 are the first round; 8–21 answer its review (`docs/reviews/round1.json`): every
problem the reviewer reproduced (8–16), the end-to-end regression in workspace-wide requests (17),
and failures the baseline shares that hurt real use in Zed (18–21). 22–25 keep a half-typed document
(the state after most keystrokes) projecting with its imports, props and template, which fixes the
last failing end-to-end step (4g, also failing on the baseline).

26–30 answer the language-server problems of the second review: regressions from patch 21 (26, 30),
patch 20 (27) and patch 13 (29), and the race behind one of them, which the baseline shares (28);
31 keeps the background loading at its pace with the watcher registrations 26 and 30 bring back.
32–40 answer the second review's crash: a no-break space typed into `$props(` made patch 22's script
recovery write a closer inside the character, and the server died on the panic, as it did on every
other projection panic the review's fuzzing found (several on the baseline too). 35 makes the server
survive any projection panic; 32–34 and 36–40 remove the panics themselves, the review's and those
the projection engineer's further fuzzing found (38–40).

41–46 answer the language-server findings of the third review (`tests/review3/`): the typing
regression from patch 28 in large components (41), a panic that cost a document its native
diagnostics while a `<style>` was typed (42), syntax errors on `<script` from a half-typed hoisted
statement (43, the guard; closing the hoisted copy is 48), requests tsrs never
answers, which stalled the background loading (44) and, it turned out, keep a core busy for good
(45; repro for upstream in `docs/upstream/tsrs-lost-request/`), and `#lib` resolving into the wrong
package from a copied component (46). 47–49 answer its projection findings: a panic on a stray
`<script` whose first `>` is its own closing tag's (47), a hoisted declaration left open that
swallowed the render header, which cost the template its prop errors (48; patch 43 had only dropped
the syntax errors), and a type body left open above a function, which took the function out of the
program (49, found while fixing 48).

50–54 answer the fourth review, which found patch 45 restarting a tsgo that was slow but working: on
a diagnostic pull whose check takes longer than the timeout, which then never reached the editor
(50; 51 has the editor pull again after any restart), and on answers tsgo had already sent while the
server's main loop was busy (52). The busy loop came from mapping a large component's folding ranges
or document symbols, which cost 0.6–1.9 s per answer (53, 54; on the baseline too).

55–64 answer the language-server findings of the fifth review. Renaming a type the props annotation
uses edited the `<script` tag, because svelte2tsx's copy of the annotation in the render header maps
back to the tag (55, on the baseline too; 63 covers the copies that map elsewhere, 56 the conflicting
edits several projects' copies can give), and patch 43's filter hid a malformed `generics` value's
syntax errors (57). Patch 50 still restarted a tsgo that was slow but working; 59 restarts only for a
request tsrs is shown to loop on, modelled on 398 measured requests (which also show what tsrs loops
on: a walk the port's whole-text bracket search sends forward), 60 waits for a pull of the same
document, 61 resets the backoff, and 62 keeps several looping requests from taking every tsrs worker;
64 reads template literals in the model as tsgo does (a loop the fuzzer found it missing). 58 fixes a
race in the restart tests' log.

65–66 are the projection's half of the rename finding: the `$$ComponentProps` alias (65) and a
`generics` value (66) that svelte2tsx copies into the render header now map back to the author's text
exactly, so a rename edits the annotation and the type parameter, and references, definitions, hovers
and diagnostics land on them, with the projected code unchanged.

67–72 answer the language-server findings of the sixth review. Patch 59 had turned a tsrs loop the
model misses into a lasting outage: the request was forgotten once overdue, and each repeat took
another tsrs worker until tsrs answered nothing. 67 reads regular expressions in the model (the gap the
review found), and 68 restarts tsgo without the model when tsgo stops answering, when three requests
are overdue at once, or when an unflagged completion or signature help stays unanswered for four
timeouts. 69–71 fix renames and references that were wrong on the baseline too (an element's `bind:`
shorthand, a store renamed from a `$store` use, a store's references), and 72 puts back the TypeScript
errors patch 65 had moved into text it does not map. The review's closing-tag finding needed no
language-server fallback: the projection's fix maps the tag's name (73).

73–80 are the projection's half of the sixth review's rename findings: author text the port wrote
into the template, or into a repaired props alias, as unmapped text, so that a rename 55 and 63 trimmed
there was silently partial and references reported zero-width locations. Each piece now stays in place
with its own exact mapping, as upstream svelte2tsx leaves it: a component's name in its closing tag
(73), a snippet's name and parameters (74) and type parameters (79), an each block's key (75) and index
(80), a `style:` shorthand's name (76), a directive the opener checks after a later attribute (77,
`class:active` before `{onclick}`), and each run of the author's text in a props alias script recovery
repaired (78). The projected code is unchanged. With 69, a renamed variable a `class:` or `style:`
shorthand reads now expands the shorthand (`class:active={on}`), where official renames the class or
the style (`class:on`).

## Results

### Rename: patches 1–80 (`c921b00`) against the official server

`git merge --no-ff svelte-rs-projection` brought 73–80 (`476f489`) into `3c82cbc` as `c921b00`, without a
conflict (the branches share no file: the merged tree's language-server crate is `3c82cbc`'s, its
projection, parser and check crates are `476f489`'s). Nothing needed fixing after the merge. The release
`svelte-language-server-rs` rebuilt from it has sha1 `e180f229…`. Load average 4–15 during the sessions (6–9 during the
benchmarks; up to 117 while the test suites compiled, with other projects' work). Every zeno session
through `bench/with-lock.sh`. Records: `docs/measurements/tests/regressions-rename.txt` (runall, its
comparison with both branches' records, the rename and diagnostic matrices, the initialize probe,
lsfuzz2, the test-suite counts), `rn-rename/` (each case's answers from `8c8c100`, `3c82cbc`, the
projection branch's build of `476f489`, `c921b00` and official 0.18.5, the oracle, run in the same
session), `e2e-rename.json`, `e2e-compare-round7-ls-vs-rename.txt` and the `rename` lines of
`docs/measurements/bench/final.jsonl`.

**Renames, references, definitions and highlights** (`rn.mjs` on the review's 16 rename cases, 73
queries, `tests/regressions/rnall.sh` and `rnmatrix.cjs`): the queries whose rename result, references,
definition and highlights all equal official's are 45 at `8c8c100`, 47 at `3c82cbc` (67–72), 63 on the
projection branch (73–80) and **62 at `c921b00`**. `c921b00` answers as `476f489` wherever 73–80 changed
an answer and as `3c82cbc` wherever 67–72 did, except the three renames of a variable a `class:` or
`style:` shorthand reads, where both act (69 expands what 76–77 now map):

| case: query | `8c8c100` | **`c921b00`** | official |
|---|---|---|---|
| `component`: rename `Child` | `<Kid kind="a">text</Child>`; references `5:20-5:20` | **`</Kid>`; `5:22-5:27`** (73) | `</Kid>` |
| `component`: rename `UI` | `<Lib.Box>{n}</UI.Box>` | **`</Lib.Box>`** (73) | the same |
| `component`: rename `cell` from `{@render cell(n)}` / at `{#snippet cell(x` (and `pair` from `{@render}` in `projection7`) | the render sites only, reference `7:0-7:0` / no edit | **the declaration and the render sites** (74) | the same |
| `template`, `generics2`: rename `id` that an each key reads | the key left, reference `10:11-10:11` | **`(row.ident)`** (75) | the same |
| `template`, `multiline`, `projection7`: rename `Size` or `Row` that snippet parameters use | the parameters left, references zero-width at the blocks' start (`12:0`, `13:0`) | **renamed** (74) | the same |
| `projection7`: rename `Size` in `{#snippet pair<T extends Size>(…)}` | the constraint left, `13:0-13:0` | **`pair<T extends Dim>`** (79) | `pairDimT extends Size>` (corrupt) |
| `projection7b`: rename `idx` from `{idx}` | `{#each rows as row, idx (row.id)}<p>{n}` | **`row, n (row.id)`** (80) | the same |
| `projection7`, `projection7b`: rename `ref` in `bind:this={ref}` before `class=`, `group` in `bind:group={…}` before `value=` | left, reference at the tag's end | **renamed** (77) | the same |
| `shorthand`: rename `value` (`<input bind:value />`) | `bind:text` | **`bind:value={text}`** (69) | the same |
| `shorthand`: rename `active`, `color` (`<p class:active style:color use:tip {onclick}>`) | left, references `14:44-14:44` | **`class:active={on}`, `style:color={hue}`** (69 with 76–77) | `class:on`, `style:hue` |
| `projection7`: rename `active` (`class:active` on `<svelte:element>`) | left, `15:57-15:57` | **`class:active={on}`** | `class:on` |
| `shorthand`: rename from `{$count}` | `total` at the uses | **`$total`** (70) | the same |
| `shorthand`: references of `count = writable` | `3:7` | **`3:7`, `8:22`, `14:47`, `15:5`** (71) | the same |

The other 11 queries that differ from official: the three shorthand renames above (69 keeps the class and
the style a renamed variable feeds; official changes them); four where official is wrong or answers
nothing (the snippet's constraint above; renaming from `types.ts`, twice, which official does not serve;
`fromts` `kind: Size`, where ours renames the property and keeps the local, `{ variant: kind, … }`, and
official leaves the destructure reading a property that no longer exists); and four that differ
from official at `8c8c100` too: a component's references (`component.json`, `projection7.json`) list
its closing tags' names (zero-width at their `<` at `8c8c100`), which official omits, and not the
`UI.Box` uses through `ui.ts`'s re-export, which official lists, and its definition is `0:0` of the
component (official: `0:1`); go to definition from `{$count}` finds nothing (official: the store's
declaration); and renaming a `let:` directive's variable from a use (`projection7b.json`,
`<List let:item>{item}</List>`) gives `let:item>{entry}`, where official gives `let:item={entry}`
(follow-ups). Every case's diagnostics are the same for all four builds.

**Diagnostics** (`diagcmp.mjs`): in `diag1.json` and `diag2.json`, `c921b00` reports 72's 1131 on the
annotation (TypeOpen, TypeOpenGen at `2:12`, TypeOpenTypeof at `3:12`), and 78's answers for BadAnnot
(Svelte's parse error only; `8c8c100` added 2304 "Cannot find name '_'" at 0:1) and BadAnnot2 (2314 on
`Array`, `1:17-1:22`, instead of 0:1); every other text as at `8c8c100`. A new `cases/diag3.json` puts a
TypeScript error in each kind of text 73–80 map (`class:`/`style:` directives before a later attribute,
on an element and on `<svelte:element>`, `bind:this`, a transition's argument, a snippet's parameters
and type parameters, each keys, closing tags, a repaired alias): `c921b00` reports exactly what the
projection branch reports in all 12, and its TypeScript diagnostics are official's, at official's
ranges, in 10 (besides rsvelte's lint warnings); in the other two official puts a snippet constraint's
2304 at `3:14` (ours: on `Missing`, `3:25-3:32`) and reports a repaired annotation's 1110, which Svelte's
parse error replaces here (as for BadAnnot). `8c8c100` and `3c82cbc` report all of them zero-width at the
start or end of the block or tag (`3:0`, `4:11`, `3:52`, `6:44`, …). Patch 72's rule moves none of them:
77 and 78 put generated text before their copies too, but every one of these errors starts on the copy.

**Requests slower than the timeout and loops** (runall; unchanged by the merge): `slow.mjs` reports
TS2322 in every pull (6.3–6.8 s after each edit), no restart; `slowsig.mjs` answers the signature help
`null` and the definition `[]` at 5 s, TS2322 at 7–8 s, no restart; `slowmix.mjs`: six requests overdue
during the check, no restart, the pull at 7.6 s with TS2322, every later hover in 1 ms;
`loopstorm.mjs`: 3 restarts, every hover on the other component in 0–2 ms; `missedloop.mjs` with `/'/`
and with `0; if (r) /'/`: one restart at 4 s each, every later hover in 1–3 ms, tsrs idle. lsfuzz2 seeds
1–12 (four at a time, default timeout): no panic, no exit, every request answered exactly once, final
diagnostics equal to a fresh server's, 420–484 answered per seed; seed 12's completion that tsrs loops
on (flagged) is the only restart, as at `3c82cbc` and `8c8c100`.

**Benchmarks** (`VARIANT=rename bench/final.sh 3`, zeno root, load 6–9; the `final` columns are the final
set's, at a load of 4–7):

| `bench/bench.mjs`, 3 files across 2 projects | official 0.18.5 | **svelte-language-server-rs `c921b00`** | svelte-language-server-rs `7179942` (final) |
|---|---|---|---|
| first diagnostics | 2,629–2,880 / 275–283 / 1,069–1,433 ms | **205–254 / 13–14 / 15–18 ms** | 210–220 / 13–17 / 15–33 ms |
| edit → diagnostics (median of 5) | 265–278 / 261–281 / 254–256 ms | **10–11 / 10 / 10–11 ms** | 12 / 10–11 / 11–12 ms |
| memory, ps RSS, settled | 762–810 MB | **342 MB** (svelte-language-server-rs 73–74, tsrs 269), two runs | 341–344 MB (72–73, 269–272) |
| initialize | 443–466 ms | 24–26 ms | 15–16 ms |

| `bench/typing.mjs` | official 0.18.5 | **svelte-language-server-rs `c921b00`** | svelte-language-server-rs `7179942` (final) |
|---|---|---|---|
| final diagnostics, after the last keystroke | 263–308 ms | **14–16 ms** | 14–18 ms |
| completion while typing, p50 / p95 (max) | 175–309 / 348–444 ms (366–482) | **6.2–7.0 / 16.4–19.2 ms (21–23)** | 6.7–7.1 / 16.4–19.3 ms (21–22) |
| member completion after a keystroke, p50 / p95 (max) | 16.9–17.4 / 21.1–25.9 ms (22–26) | **5.5–5.9 / 6.3–7.3 ms (7.0–7.7)** | 5.6–6.4 / 6.2–7.9 ms (6.5–8.1) |
| unchanged document, p50 / p95 | 1.4–1.5 / 1.6–1.9 ms | 1.4–1.7 / 1.5–1.9 ms | 1.6–1.7 / 2.0–2.2 ms |
| memory before typing → peak (settled) | 599–601 → 670–678 MB (799–845) | **316 → 360–366 MB (362–370)** | 314–317 → 363–367 MB (366–369) |

Both servers offer the expected member on 20 of 20 keystrokes and in 20 of 20 member rounds in every
run, no request fails, and both end on the single TS2339. In the second bench run the whole svelte-language-server-rs
tree's ps RSS was 186 MB (svelte-language-server-rs 26, tsrs 160): macOS paged it out, as in the ship set's second typing
run (no restart; ps RSS, see follow-ups). The initialize time is the only number off the final set's,
and it is not the build: an initialize-only probe of `8c8c100`, `3c82cbc`, the projection branch and
`c921b00`, interleaved five times at the zeno root (`tests/regressions/initprobe.mjs`, through the lock),
answers in 18–24 ms on each one's first spawn and 4–11 ms after, alike for all four. So the merge moves
none of these numbers; `docs/architecture.md` keeps the final set's.

**Correctness.**

* **Tests** (`vendor/rsvelte`, `CARGO_TARGET_DIR=target-rsvelte-tests`): `rsvelte_language_server` 499
  unit (1 ignored), 31 protocol, 30 robustness and 2+2+3 others pass, `upstream_fixture_manifest` fails
  5 of 7 as before; `rsvelte_projection` 866 tests in 116 targets pass (1 ignored; 856 + 10 new);
  `rsvelte_core` 1,980 lib tests (1 ignored) and its loose-parser tests (5 + 4 + 6) pass;
  `rsvelte_check` 279 pass. `cargo fmt --all --check` is clean; `cargo clippy --all-targets` on the
  projection and the language server reports only the four warnings the branch has had since `7793da7`.
* **Every review's reproductions** (`runall.sh`, now with the four projection `rn.mjs` cases and
  `diagcmp.mjs cases/diag3.json`, run on its own after the rest): against
  `3c82cbc`'s round-7 record every script gives the same answers but `rn shorthand`, `rn component` and
  `diagcmp diag2` (73–80's changes above) and the fields that only time things (s1b's wait, bigtype,
  burst, slow, slowsig, slowmix, loopstorm, missedloop); against the projection branch's record, the same
  but `rn shorthand`, `rn projection7` and `diagcmp diag2` (67–72's changes above), `missedloop` (there no
  restart and every hover `null`, tsrs at three cores: the outage 67–68 end) and the timing fields.
  recover-pos, start-of-file, start-of-file2, style-open, hashscope and the crash inputs as before.
* **End to end** (`node tests/e2e.mjs run patched --out docs/measurements/tests/e2e-rename.json`, through the lock):
  41/41, identical step for step to round 7's language-server run and to the projection branch's run
  (`e2e-compare-round7-ls-vs-rename.txt`: 0 steps differ), 12 watcher registrations, no
  unregistrations, no exit, zeno's sources untouched (`git status` clean before and after).

### Round 7, language server: patches 67–72 (`3c82cbc`) against `8c8c100`

The machine was busy throughout (load average 20–95: other projects' builds), so latencies are noisy;
what they show does not depend on them. Every zeno session through `bench/with-lock.sh`. Records:
`docs/measurements/tests/regressions-round7-ls.txt` (runall, the other `missedloop.mjs` runs, `pullwhileloop.mjs`,
`slowsig.mjs` with 36 aliases, lsfuzz2, and the first build of 68), `e2e-round7-ls.json` and
`e2e-compare-ship-vs-round7-ls.txt`. The release `svelte-language-server-rs` built from `3c82cbc` has sha1 `3eac201f…`.

**A loop the model misses** (review 6's problem 1; patches 67–68). `missedloop.mjs`: components
svelte2tsx rejects (`<p>{aN.</p>`, so tsgo has the script body), a completion at `}c|{` in each (or
`SAME=1`: all at one position of one), a hover on another component every second for 30 s, a 4 s
timeout:

| script line, completions | `8c8c100` | **`3c82cbc`** |
|---|---|---|
| `const r = /'/; }c{` (67 reads it), 4 | no restart, every hover `null` after 4 s, tsrs at 200–300% CPU (review) | **1 restart at 4 s; every later hover in 1–5 ms, tsrs idle** |
| `const r = 0; if (r) /'/; }c{` (still read as a division), 4 | no restart, every hover `null` after 4 s, tsrs at 294–298% CPU | **1 restart at 4 s (tsgo answered nothing since the first completion); every later hover in 1–5 ms** |
| the same, 4 at one position | | **the same** |
| the same, 3 | | **the same** |
| the same, 2 | | **every hover answered in 1–2 ms, tsrs at 2 cores, 1 restart at 16 s (four timeouts)** |
| the same, 1 | tsrs at 100% CPU for good (review, with `/'/`) | **every hover in 1–2 ms, 1 restart at 16 s** |

The hover in flight when the restart comes is answered with the restart's error, as at `8c8c100`.

**Requests slower than the timeout** (still no restart; runall, 3 s timeout, 6 aliases, a 7 s check):
`slowsig.mjs` answers the signature help `null` and the definition `[]` at 5 s, no restart, TS2322 at
7 s; `slow.mjs`: TS2322 in every pull, no restart; `slowmix.mjs`: six requests overdue during the check
(signature help, definition, completion, a code action and two hovers: tsrs answered nothing about the
document while it checked), no restart, the pull at 7.3 s with TS2322, every later hover in 1–2 ms. With
36 aliases and the default timeout `slowsig.mjs` answers `null` at 32 s, does not restart, and TS2322
arrives at 45 s (`8c8c100`: 42–45 s). The first build of 68 bounded the wait for a pull at four timeouts:
at a load of 40 the same check took over 12 s, and `slowsig.mjs` (signature help) and `slowmix.mjs`
restarted tsgo at 12–14 s, their pulls answered without TS2322; the wait has no bound since.

**Loops the model finds** (unchanged): `loopstorm.mjs` (40 s, 5 s timeout): every hover on the other
component in 1–3 ms, 3 restarts, every repeated signature help answered at once; `pullwhileloop.mjs`
(`loop22.svelte`, a pull every 1.5 s, 5 s timeout): each pull answered at once with its 186 TypeScript
diagnostics, one restart at 5 s.

**lsfuzz2** (`lsfuzz2.mjs <binary> tests/regressions/tpl <seed> 300`, seeds 1–30, four at a time,
default timeout): no panic, no exit, every request answered exactly once, 399–493 answered per seed.
Seeds 12, 22 and 30 hit a completion tsrs loops on, which the model flags: one restart each, as at
`8c8c100` (the review: 12, 22, 30, 36 and 37 in seeds 1–40). No other restart: 68's rules never fired.
Seed 30's final diagnostics of `Child.svelte` differ from a fresh server's after the restart, exactly as
in the review's run of `8c8c100` (the restarted tsgo reopens the buffer, which by then has no
`lang="ts"`, as JavaScript; the comparison's artifact).

**Renames, references and diagnostics** (`rn.mjs` and `diagcmp.mjs` over the review's cases; official
0.18.5's answers from the review):

| case | `8c8c100` | **`3c82cbc`** | official |
|---|---|---|---|
| rename `value` used in `<input bind:value />` | `bind:text` | **`bind:value={text}`** | `bind:value={text}` |
| rename from `{$count}` | `total` at the three uses | **`$total` at the uses, `total` at the declaration** | the same |
| references of `count = writable` | `3:7` | **`3:7`, `8:22`, `14:47`, `15:5`** | the same |
| references from `{$count}` | `8:22`, `14:47`, `15:5` | **the four** | the same |
| TypeOpenGen / TypeOpenTypeof (`diag2.json`) | Svelte's parse error only | **+ 1131 at `2:12` / `3:12` (twice)** | 1131 at `2:11` |
| rename `Child`, `UI` (`component.json`) | closing tags left (`</Child>`) | unchanged; with the projection's `ac026f1` (patch 73 as `d727500`): `</Kid>`, `</Lib.Box>` | `</Kid>`, `</Lib.Box>` |

Every other query of `shorthand.json` and `component.json`, and every query of the other twelve cases
(`defaults`, `fromts`, `generics2`, `generics3`, `iface`, `intersect`, `module`, `multiline`, `nondestr`,
`template`, `typeoflocal`, `unicode`), gives `8c8c100`'s answers.

**Correctness.**

* **Tests**: `rsvelte_language_server` 499 unit (1 ignored), 31 protocol, 30 robustness and 2+2+3
  others pass; `upstream_fixture_manifest` fails 5 of 7 as before; each of 67–72 passes the unit,
  protocol and robustness tests on its own. `cargo fmt --all --check` is clean; `cargo clippy -p
  rsvelte_language_server --all-targets` reports only the warnings `8c8c100` has.
* **Earlier reproductions** (`runall.sh`): every script gives `8c8c100`'s answers
  (`docs/measurements/tests/regressions-ship.txt`) but the fields that only time things (s1b's wait, bigtype,
  burst: folding 60 of 60 answered, p50 37 ms; symbol 40 of 40, p50 101 ms; no error or restart) and
  the slow scripts above.
* **End to end** (`node tests/e2e.mjs run patched --out docs/measurements/tests/e2e-round7-ls.json`, through the
  lock): 41/41, identical step for step to the ship run.

### Ship: patches 1–66 (`8c8c100`) against the official server

`git merge --no-ff svelte-rs-projection` brought 65–66 (`1862ff2`) into `245dbfb` as `8c8c100`, without
a conflict (the branches share no file; the merged tree's language-server crate is `245dbfb`'s, its
projection, parser and check crates are `1862ff2`'s). Nothing needed fixing after the merge. The release
`svelte-language-server-rs` rebuilt from it has sha1 `0d7a6912…`. The machine was busy throughout (load average 13–57,
13–34 during the benchmarks; other projects' builds, simulators and an emulator, 7 GB of swap in use),
so latencies are noisier than in the final set below; what they show does not depend on them. Every zeno
session through `bench/with-lock.sh`. Records: `docs/measurements/tests/regressions-ship.txt`, `e2e-ship.json`,
`e2e-compare-round6-ls-vs-ship.txt` and the `ship` lines of `docs/measurements/bench/final.jsonl`.

**Renames and the props annotation** (review 5's Issue A; 55–57 and 63 in the language server, 65–66 in
the projection):

| script | `7179942` | `245dbfb` (55–64) | **`8c8c100` (55–66)** |
|---|---|---|---|
| `propsrename.mjs`, rename `Size` | `1:6`, `0:1-0:5`, `2:8`: line 0 becomes `<Dimpt lang="ts">` | `1:6`, `2:8`; the annotation keeps `Size` | **`1:6`, `3:23` (the annotation), `2:8`: line 0 intact, `{ kind: Dim }`** |
| `propsrename.mjs`, references | `1:6`, `0:1`, `2:8` | `1:6`, `2:8` | **`1:6`, `3:23`, `2:8`** |
| `hashrename.mjs`, Card | rename edits `0:1-0:5`; references at 0:1 in Card and Button | nothing in the tag; the annotation neither renamed nor listed | **rename and references add the annotation (`2:23`), references Button's (`3:41`); nothing at 0:1, no duplicate** |
| `genericsrename.mjs`, rename `T` | `0:1-0:2` (`<T2cript`), `1:24-1:25` (`'lg'T2`), `3:8`; definition 0:1 | `3:8`; references `1:24` (zero-width) and `3:8`; definition 0:0 | **`0:28` (the `generics` value), `2:32` (the annotation), `3:8`; references the same; definition `0:28`** |
| `genericsrename.mjs`, rename `Size` | `1:6`, `1:24-1:28` (two lines run together) | `1:6`; references `1:6`, `1:24` | **`1:6`, `2:47`; references the same** |
| `generics.mjs`, three malformed values | 2304 "Cannot find name 'T'" at 0:1 | the same | **1109 at `0:38`, 1139 at `0:45`, 1005 at `0:50` (in the value), and the 2304 at its use, `1:23`** |
| `generics.mjs`, `T extends Missing` | 2304 at 0:1 | the same | **2304 at `0:38-0:45`** |
| `propsfeatures.mjs` | hover on `kind` in the annotation: nothing; `Missing` reported on line 0; hovers on `T` and `Unknown`: `function $$render<…>` | the same | **`(property) kind: Size`; `Missing` on line 2; `(type parameter) T extends Unknown`, `type Unknown`** |

These are the answers the language-server engineer's throwaway integration of the same two branches gave
(Round 6 below), now from the release build.

**Requests slower than the timeout** (Issue B, 59–62, 64; unchanged by the merge): `slowsig.mjs` with 36
aliases and the default timeout answers the signature help `null` and the definition `[]` at 32 s,
cancels them and does not restart tsgo; TS2322 reaches the editor at 44–45 s (`7179942`: 76 s after a
restart; 55–63 in round 6: 42 s). In `runall.sh` (6 aliases, 3 s timeout) slowsig gets TS2322 at 7 s
with no restart, and slowmix answers the five requests tsrs holds back during the check without tsgo at
3 s, cancels them, does not restart, and the pull returns TS2322 at 7.2 s; every hover after the check
is answered in 1–7 ms. `loopstorm.mjs` (40 s, 5 s timeout): every hover on the other component answered
in 1–2 ms, 3 restarts, every repeated signature help answered at once.

**lsfuzz2** (`lsfuzz2.mjs <binary> tests/regressions/tpl <seed> 300`, seeds 1–20, four at a time,
default timeout; it also asks for references, definitions and highlights, the locations 55 and 65–66
change): every seed ends clean (every request answered exactly once, no panic, no exit, final
diagnostics equal to a fresh server's), 416–490 answered per seed; seed 12's completion that tsrs loops
on is again the only restart, as at `245dbfb`.

**Benchmarks** (`VARIANT=ship bench/final.sh 3`, zeno root, load 13–34; the `final` columns are the
final set's below, at a load of 4–7):

| `bench/bench.mjs`, 3 files across 2 projects | official 0.18.5 | **svelte-language-server-rs `8c8c100`** | svelte-language-server-rs `7179942` (final) |
|---|---|---|---|
| first diagnostics | 2,262–2,304 / 276–287 / 935–1,167 ms | **220–283 / 13–18 / 17–18 ms** | 210–220 / 13–17 / 15–33 ms |
| edit → diagnostics (median of 5) | 273–276 / 263–265 / 263–274 ms | **11–13 / 10–11 / 11–13 ms** | 12 / 10–11 / 11–12 ms |
| memory, ps RSS, settled | 747–782 MB | **340–342 MB** (svelte-language-server-rs 73–74, tsrs 268–269) | 341–344 MB (72–73, 269–272) |
| initialize | 414–460 ms | **13–15 ms** | 15–16 ms |

| `bench/typing.mjs` | official 0.18.5 | **svelte-language-server-rs `8c8c100`** | svelte-language-server-rs `7179942` (final) |
|---|---|---|---|
| final diagnostics, after the last keystroke | 265–321 ms | **15–17 ms** | 14–18 ms |
| completion while typing, p50 / p95 (max) | 65–291 / 298–435 ms (311–454) | **6.8–7.1 / 17.9–27.6 ms (20–40)** | 6.7–7.1 / 16.4–19.3 ms (21–22) |
| member completion after a keystroke, p50 / p95 (max) | 17.2–17.5 / 22.0–24.0 ms (23–30) | **5.8–6.6 / 6.5–10.3 ms (7–23)** | 5.6–6.4 / 6.2–7.9 ms (6.5–8.1) |
| unchanged document, p50 / p95 | 1.5–1.6 / 1.9–3.4 ms | 1.6–1.7 / 2.0–2.5 ms | 1.6–1.7 / 2.0–2.2 ms |
| memory before typing → peak (settled) | 590–602 → 657–675 MB (646–813) | **312–316 → 364–368 MB (367–370)**, two runs | 314–317 → 363–367 MB (366–369) |

Both servers offer the expected member on 20 of 20 keystrokes and in 20 of 20 member rounds in every
run, no request fails, and both end on the single TS2339. The 283 ms first open and the wider p95s come
from single runs at the busiest moments; the other runs are within a few milliseconds of the final
set's. In the second svelte-language-server-rs typing run the whole tree's ps RSS fell to 161 MB (svelte-language-server-rs 35, tsrs 126
MB; both at about 44% of the other runs) and stayed flat while typing: macOS paged the processes out
under the memory pressure (ps RSS, see follow-ups), not a tsgo restart, which needs a request 30 s
overdue (no completion took more than 40 ms). So the merge moves none of these numbers;
`docs/architecture.md` keeps the final set's.

**Correctness.**

* **Tests** (`vendor/rsvelte`, `CARGO_TARGET_DIR=target-rsvelte-tests`): `rsvelte_language_server` 494
  unit (1 ignored), 31 protocol, 25 robustness and 2+2+3 others pass, `upstream_fixture_manifest` fails
  5 of 7 as before; `rsvelte_projection` 856 tests in 115 targets pass (1 ignored; 847 + 9 new);
  `rsvelte_core` 1,980 lib tests (1 ignored) and its loose-parser tests (5 + 4 + 6) pass;
  `rsvelte_check` 279 pass. `cargo fmt --all --check` is clean; `cargo clippy --all-targets` on the
  projection and the language server reports only the four warnings the branch has had since `7793da7`.
* **Every review's reproductions** (`runall.sh`, now with `genericsrename` and `propsfeatures`): against
  `245dbfb`'s round-6 record, only propsrename, hashrename and generics change, as in the table above,
  plus fields that only time things (s1b's wait, r2c-format's tries, bigtype, slow, burst; burst symbol
  is back to p50 78 ms from round 6's 1.3 s at a load of 150); slowsig, slowmix and loopstorm give the
  results above. Against `7179942`'s record (`regressions-final.txt`) only s11 differs beyond timing
  (definitions of a component at 0:0, patch 55). recover-pos: 377 states, 486 problems, none at 0:1;
  start-of-file, start-of-file2, style-open, hashscope and the crash inputs as before.
* **End to end** (`node tests/e2e.mjs run patched --out docs/measurements/tests/e2e-ship.json`, through the lock):
  41/41, identical step for step to round 6 (`e2e-compare-round6-ls-vs-ship.txt`: 0 steps differ), 12
  watcher registrations, no unregistrations, no panic, no tsgo restart, zeno's sources untouched (`git
  status` clean before and after).

### Round 6, language server: patches 55–64 (`245dbfb`) against `7179942`

Load average 10–30 throughout (another engineer's builds and tests ran beside these), so latencies
below are noisy; what they show does not depend on them. Every zeno session through
`bench/with-lock.sh`. Records: `docs/measurements/tests/regressions-round6-ls.txt`, `e2e-round6-ls.json` and
`e2e-compare-round5-ls-vs-round6-ls.txt`.

**Renames** (patches 55–57, 63; the projection's mapping of the copies is not in this build):

| script | `7179942` | **`245dbfb`** |
|---|---|---|
| `propsrename.mjs`, rename `Size` | `1:6-1:10`, `0:1-0:5`, `2:8-2:12`: line 0 becomes `<Dimpt lang="ts">` | **`1:6-1:10`, `2:8-2:12`: line 0 intact** (the annotation keeps `Size`) |
| `propsrename.mjs`, references | `1:6`, `0:1`, `2:8` | **`1:6`, `2:8`** |
| `hashrename.mjs`, Card rename | `0:1-0:5` among the edits | **no edit in the tag**, no duplicate |
| `genericsrename.mjs`, rename `T` / `Size` | `0:1-0:2` (`<T2cript`), `1:24-1:25` (the `;` above the annotation), `3:8` / `1:6`, `1:24-1:28` (two lines run together) | **`3:8` / `1:6` only: texts intact** |
| `generics.mjs` | 2304 at 0:1 | unchanged (the projection maps the value's errors to the tag) |

With the projection's patches of this round (`svelte-rs-projection` at `1862ff2` merged into
`245dbfb` in a throwaway worktree, debug build; no commit was made): `propsrename.mjs` renames `1:6`,
`3:23` (the annotation) and `2:8`, and finds all three references; `hashrename.mjs`'s Card rename
adds the annotation's `2:23`, with no duplicate; `genericsrename.mjs` renames `T` at `0:28` (the
`generics` value, which 55 keeps), `2:32` and `3:8`, and `Size` at `1:6` and `2:47`, each definition
at its declaration; `generics.mjs` reports the syntax errors in the value (1109 at `0:38`, 1139 at
`0:45`, 1005 at `0:50`, which 57 keeps) and the unknown constraint at `0:38-0:45`.

**Requests slower than the timeout** (patches 59, 60):

| script | `7179942` (review 5) | `7793da7` (review 5, no timeout) | **55–63** |
|---|---|---|---|
| `slowsig.mjs` 36 aliases, signature help at 2 s | `null` at 32 s, tsgo restarted, TS2322 at 76 s | answered at 52 s, TS2322 at 50 s | **`null` at 32 s, cancelled, no restart, TS2322 at 42 s** |
| `slowsig.mjs` 36 aliases, definition at 2 s | `[]` at 32 s, tsgo restarted, TS2322 at 76 s | | **`[]` at 32 s, cancelled, no restart, TS2322 at 42 s** |
| `slowmix.mjs` 6 aliases (a 7 s check), 11 requests during the pull, 3 s timeout | signature help, definition, completion, hover and a code action answered without tsgo at 3 s and tsgo restarted; the pull answered at 3.2 s without its TypeScript half; a hover failed | | **the same five answered without tsgo at 3 s and cancelled, no restart; the pull answered at 8.2 s with TS2322; the two hovers sent during the check answered at the timeout, every later one in 1–3 ms** |
| `slowmix.mjs` 6 aliases, default timeout | | | every request answered by tsgo after 7.1 s, no restart |

**A state tsrs loops on, asked about every 2 s** (`loopstorm.mjs`, `loop-inputs/loop22.svelte`, a
hover on another component every second, 120 s, `RSVELTE_TSGO_REQUEST_TIMEOUT_MS=10000`):

| build | hovers on the other component | tsrs CPU | restarts |
|---|---|---|---|
| 59–61 (`254c785`) | none answered (`null` after 10 s, or an error at a restart) at 6–12, 16–32, 36–72 and 76–120 s | up to 2.5 cores | 3 |
| **59–62 (`1d849ed`)** | **every hover answered, in 0–5 ms** | **one core** | **3 (near 12, 32 and 72 s)** |

(Review 5 at `7179942` with the default timeout: outages of 20 s, then 94 s and more, 3 restarts in
320 s.)

**lsfuzz2** (`lsfuzz2.mjs <binary> tests/regressions/tpl <seed> 300`, seeds 1–20, four at a time,
default timeout): at `245dbfb` every seed ends clean (every request answered exactly once, no panic,
no exit, final diagnostics equal to a fresh server's), 418–487 answered per seed. Seed 12 hits a
completion tsrs loops on: answered without tsgo at 30 s and tsgo restarted once (the only restart in
the 20 seeds); no other request went unanswered for 30 s. At `841697a` (55–63) the same seed's
completion was answered and cancelled but not counted as a loop (patch 64).

**Correctness.**

* **Tests** (`vendor/rsvelte`, `CARGO_TARGET_DIR=target-rsvelte-tests`): `rsvelte_language_server`
  494 unit (1 ignored), 31 protocol, 25 robustness and 2+2+3 others pass; `upstream_fixture_manifest`
  fails 5 of 7 as before. Each of 55–64 builds and passes the unit, protocol and robustness tests on
  its own (the record says how those runs map onto the branch as rewritten after them: 58 was moved
  before 59, whose restart tests raced the log it fixes). `cargo fmt --all --check` is clean; `cargo clippy -p rsvelte_language_server
  --all-targets` reports only the four warnings `7179942` has.
* **Earlier reproductions** (`runall.sh`): every script gives `7179942`'s answers
  (`docs/measurements/tests/regressions-final.txt`) except s11, whose definitions of a component land at 0:0
  instead of 0:1 (patch 55), and fields that only time things (s1b's wait, r2c-format's tries; both
  pass). recover-pos: 377 states, 486 problems, none at 0:1; slow: TS2322 in every pull, no restart;
  burst folding: 60 of 60 answered, p50 37 ms; burst symbol: 40 of 40, no error or restart (p50
  1.3 s in the runall pass, taken while an Xcode build drove the load average to 150; 104 and 91 ms
  in two interleaved reruns, against `7179942`'s 108 and 94 ms). The fifth review's scripts give the
  results above; at that load slowmix's 7 s check outlasted its 20 s window, so its pull was still
  pending and every request was answered without tsgo at 3 s, with no restart, and loopstorm (40 s,
  5 s timeout) answered every hover in 1–36 ms, with 3 restarts.
* **End to end** (`node tests/e2e.mjs run patched --out docs/measurements/tests/e2e-round6-ls.json`, through the
  lock): 41/41, identical step for step to round 5 except 4c and 4c2, whose definition of a component
  now lands at its file's 0:0 instead of 0:1 (inside the `<script` tag; patch 55).

### Final: patches 1–54 (`7179942`) against the official server

The final integration merged nothing new (see above), so the build is `7179942`'s: the release
`svelte-language-server-rs` rebuilt from it is byte-identical to the one round 5 measured (sha1 `45c7ad02…`). zeno root
(476 components in 12 projects), every session through `bench/with-lock.sh`; official
svelte-language-server 0.18.5 (Zed's install, TypeScript 5.9.3), svelte-language-server-rs with tsrs 0.18.0
(TypeScript 7.1.0-dev.20260930.4). `VARIANT=final bench/final.sh 3` at a load average of 3.8–5.3
(the `final` lines of `docs/measurements/bench/final.jsonl` with build `7179942` and the official lines dated
after 11:43Z, interleaved with them; the earlier `final` lines are `670722d`'s and `1d4cb87`'s),
plus three direct svelte-language-server-rs sessions (`final-direct`), the smaller workspaces and the all-projects
memory at 2–4. The other records are in `docs/measurements/tests/regressions-final.txt`.

`bench/bench.mjs`, 3 files across 2 projects (admin-layout / field-renderer / confirmation-dialog):

| | first diagnostics | edit → diagnostics (median of 5) | memory, ps RSS, settled | initialize |
|---|---|---|---|---|
| official 0.18.5 | 1,917–2,288 / 279–286 / 956–1,022 ms | 272–279 / 264–267 / 258–262 ms | 820–826 MB | 364–416 ms |
| **svelte-language-server-rs `7179942`** | **210–220 / 13–17 / 15–33 ms** | **12 / 10–11 / 11–12 ms** | **341–344 MB** (svelte-language-server-rs 72–73, tsrs 269–272) | **15–16 ms** |
| svelte-language-server-rs `7179942`, not right after the official server | 156–169 / 15–18 / 15–16 ms | 12 / 11 / 11–12 ms | 335–339 MB (tsrs 264–267) | 2–4 ms |

The first file's 210–220 ms is `final.sh`'s order again (svelte-language-server-rs always starts right after the
official server); the 33 ms is one run's third file. Patches 50–54 change nothing here (round 5:
153–167 ms first, edits 10–14 ms, against `670722d`'s 138–173 ms and 10–13 ms).

**Memory with every project loaded** (`bench/allprojects.mjs <bin> <zeno> background 40000`, 3 runs;
one component opened, a hover every 2.5 s while the background loads the rest, then three
`workspace/symbol` queries): all 12 projects load, idle hovers answer in 1–5 ms (median 2),
`workspace/symbol` finds all three (5 files) in 2–11 ms; **288–291 MB phys_footprint** (svelte-language-server-rs 56,
tsrs 232–235; ps RSS 309–314 MB). The official server in the same set holds one project, finds none
of the three, and takes 567 MB before the queries and 598 MB after (RSS 583/611). Alternating
`670722d` and `7179942` in two pairs: 286–289 MB (svelte-language-server-rs 55) against 289–291 MB (56–57), so
patches 50–54 cost about 1–2 MB with everything loaded (round 4 measured `670722d` at 284–287, its
svelte-language-server-rs process at 52–53, in another session).

**Smaller workspaces** (admin-layout and field-renderer, 3 runs, load 2.2–3.9): workspace =
zeno/admin, official 1,988–2,141 / 272–295 ms, edits 265–276 ms, 622–642 MB; svelte-language-server-rs 176–223 /
12–15 ms, edits 9–11 ms, 164 MB (tsrs 113–115). Workspace = zeno/admin/src, svelte-language-server-rs 161–164 /
12–15 ms, edits 8–12 ms, 163–166 MB (tsrs 113–115).

Typing (`bench/typing.mjs`, admin-layout.svelte):

| | final diagnostics, after the last keystroke | completion while typing, p50 / p95 (max) | member completion after a keystroke, p50 / p95 (max) | unchanged document, p50 / p95 | memory before typing → peak (settled) |
|---|---|---|---|---|---|
| official 0.18.5 | 233–272 ms | 127–227 / 332–360 ms (359–364) | 17.5–18.2 / 21.1–22.7 ms (21–26) | 1.4–1.7 / 1.6–1.8 ms | 608–609 → 686–696 MB (863–866) |
| **svelte-language-server-rs `7179942`** | **14–18 ms** | **6.7–7.1 / 16.4–19.3 ms (21–22)** | **5.6–6.4 / 6.2–7.9 ms (6.5–8.1)** | 1.6–1.7 / 2.0–2.2 ms | **314–317 → 363–367 MB (366–369)** |

* Both end on the single TS2339 (`Property 'exten' does not exist on type 'ResolvedAdminConfig'`),
  964–968 ms after the first keystroke on svelte-language-server-rs and 1,184–1,221 ms on the official server (the
  typing takes 950 ms). The expected member was offered on 20 of 20 keystrokes and in 20 of 20 member
  rounds, in every run of both; no request failed.
* **Against the official server** (medians of the runs): first diagnostics about 10× faster in
  `final.sh`'s order (11–15× for the first file opened on its own, 16–22× for the second), edits
  about 24×, the final diagnostics while typing about 17×, completion while typing about 22× at p95
  and 18–34× at p50 (the official server's p50 depends on the load: 64–67 ms at load 1–2 in the
  previous final's `final-b` set, 8–9× there), a member completion about 3×, at 42% of the memory in the same benchmark
  (341–344 against 820–826 MB; 366–369 against 863–866 MB after typing), and about half the
  phys_footprint with all 12 projects loaded against the official server's one.

**Typing in a large component** (`tests/regressions/bigtype.mjs`, two interleaved runs per size,
load 3.6–9.8):

| lines | `02e6b31` (patch 27) p50 / p95, final | `670722d` | **`7179942`** |
|---|---|---|---|
| 1,413 (N=1000) | 59–76 / 68–92 ms, 178–206 ms | 13 / 28–30 ms, 138–159 ms | **12–13 / 29 ms, 110–138 ms** |
| 2,113 (N=1500) | 240–253 / 445–467 ms, 617–640 ms | 19 / 36–37 ms, 195–219 ms | **19–20 / 36–39 ms, 188–222 ms** |
| 2,813 (N=2000) | 447–461 / 837–866 ms, 1,071–1,103 ms | 24–30 / 45–46 ms, 181–198 ms | **27 / 45–47 ms, 177–188 ms** |

Document-wide requests while typing in a 2,106-line component (`burst.mjs`, `runall.sh`): foldingRange
with 30 keystrokes, 60 of 60 answered, quiet 41 ms, p50 / max 37 / 54 ms, completion 37 / 64 ms, no
error, no restart; documentSymbol with 20, quiet 63 ms, p50 / max 112 / 127 ms, completion 114 / 140
ms (`670722d`: folding 1,896 ms quiet and 19.8 s p50, documentSymbol 603 ms and 6.1 s). A check slower
than the timeout (`slow.mjs`, 6 aliases, 3 s timeout, an edit every 8 s): TS2322 at 6,954 ms and in
all 5 pulls, no "did not answer", no restart.

**Correctness at `7179942`.**

* **Tests** (`vendor/rsvelte`, `CARGO_TARGET_DIR=target-rsvelte-tests`): `rsvelte_language_server` 480
  unit (1 ignored), 31 protocol, 23 robustness and 2+2+3 others pass, `upstream_fixture_manifest`
  fails 5 of 7 as before (no language-tools checkout); `rsvelte_projection` 847 tests in 113 targets
  pass (1 ignored); `rsvelte_core` 1,980 lib tests (1 ignored) and its loose-parser tests (5 + 4 + 6)
  pass; `rsvelte_check` 279 pass. `cargo fmt --all --check` is clean; `cargo clippy --all-targets` on
  the projection and the language server reports only the four warnings `670722d` already has
  (rsvelte_core `utils.rs` ×2, `symbols.rs`, `tsgo_response.rs`).
* **Every review's reproductions** (`runall.sh`): identical to round 5's record, and so to `670722d`'s
  answers, except r2d-hover's `probeEndedByEdit`, which only says which try caught the probe: s1–s4,
  s7, s8, s10, s11, incomplete-edits (6/6), r1-depkill, r1b-close, r2c-format, r2d-hover,
  r2e-hover-edit-race (0 of 10 wrong), r5-crash, r6-watchers, hashscope (exactly the 2 errors on the
  invalid line), start-of-file (none at 0:1; `type T = {` and `interface I {` only TS6196),
  start-of-file2 (no diagnostic at 0:1, the template's TS2322 in all 7 states), style-open (native
  diagnostics while the style block is open, no panic), recover-pos (377 states, 486 problems, 0 at
  0:1, its records identical to `670722d`'s), and the crash inputs. The `tests/review3/` copies of
  hashscope (relative and alias), start-of-file, start-of-file2, style-open and recover-pos give the
  same answers.
* **Panics**: `r5-crash` with `{#each <script </script>`, its unminimized original and
  `<div title="<script </script>">`, the review's and the projection engineer's 54 candidates, and the
  second review's saved panicking inputs (10 sets, 405 inputs: allpanics 165, found-1–4 38,
  sfound-1–4 132, real 70):
  every input answered, no projection panic caught. `lsfuzz.mjs` seeds 22 and 38 (`THIRD=1 NO_WS=1
  INIT_SLEEP=600 LONG_SLEEP=700 CANCEL=1`, 300 iterations): no panic; with the default timeout 286 and
  210 answered, the fuzzer's own 15 s check reports the lost signature help (275) and completion
  (200), the later hover and folding requests are answered and every project loads; with
  `RSVELTE_TSGO_REQUEST_TIMEOUT_MS=10000` 287 and 309 answered, no error, and tsgo restarts once on
  each spinning request. As at `670722d`.
* **End to end** (`node tests/e2e.mjs run patched --out docs/measurements/tests/e2e-final.json`, through the
  lock): 41/41, identical step for step to round 5 (`e2e-compare-round5-ls-vs-final.txt`) and to
  `670722d`, 12 watcher registrations, no unregistrations, no panic, no tsgo restart, zeno's sources
  untouched (`git status` clean before and after every session). Its `initialize` took 849 ms, the
  first execution of the relinked binary; every later session initialized in 2–19 ms.

### Round 5, language server: patches 50–54 (`7179942`) against `670722d`

Every zeno session through `bench/with-lock.sh`, load average 2–10. The svelte-language-server-rs build measured is
`738b7fa`'s, byte-identical to `7179942`'s (the amend that made it changed only a test's string
building). Records: `docs/measurements/tests/regressions-round5-ls.txt`, `e2e-round5-ls.json`,
`e2e-compare-final-670722d-vs-round5-ls.txt`, and the `round5-ls` lines of `docs/measurements/bench/final.jsonl`.

**The review's findings.** `slow.mjs` (a check slower than the timeout): TS2322 reaches the editor in
every pull, with no restart (patch 50 above). `burst.mjs … 1500 folding 30`: 60 of 60 answered,
folding p50 36 ms, no error, no restart (`670722d`, same session: 56 answered, folding p50 28.2 s,
`-32603` to the editor and a restart while tsgo was "still busy with" five requests it had answered).
The mapping costs of 53–54 are in patch 54's table.

**zeno root**, `bench/final.sh 3` with `EXTRA_*_BIN=<670722d>` (`bench/bench.mjs`, 3 files across 2
projects; `bench/typing.mjs`, admin-layout), plus four direct alternating typing pairs:

| | first diagnostics | edit → diagnostics (median) | memory, settled | initialize |
|---|---|---|---|---|
| official 0.18.5 | 1,842–2,380 / 275–284 / 871–956 ms | 273–275 / 263–266 / 261–262 ms | 818–821 MB | 333–404 ms |
| **svelte-language-server-rs `7179942`** | **153–167 / 13–15 / 14–19 ms** | **12–14 / 10–11 / 11–12 ms** | **336–341 MB** | **3–4 ms** |
| svelte-language-server-rs `670722d` | 138–173 / 14–18 / 15–18 ms | 12–13 / 10–11 / 11–13 ms | 336–339 MB | 2–14 ms |

| | final diagnostics | completion while typing, p50 / p95 | member completion, p50 / p95 | memory before typing → peak (settled) |
|---|---|---|---|---|
| official 0.18.5 | 253–364 ms | 222–294 / 355–445 ms | 16.3–18.8 / 20.6–22.1 ms | 606–612 → 692–706 MB (743–872) |
| **svelte-language-server-rs `7179942`** | **13–15 ms** (88 in one run) | **6.2–7.2 / 15.3–17.5 ms** | **5.5–6.7 / 6.7–11.3 ms** | **314–315 → 359–364 MB (362–368)** |
| svelte-language-server-rs `670722d` | 13–18 ms | 6.8–7.8 / 16.5–21.9 ms | 5.9–6.6 / 6.4–8.6 ms | 314–315 → 363–365 MB (366–368) |

The one slow `7179942` typing run (final diagnostics 88 ms, completion p95 223 ms, keystrokes 12–20 at
81–245 ms) was not repeated in the four direct pairs that followed, where `7179942` gave 13–15 ms and
p50 6.2–7.2 ms and `670722d` 15–18 ms and 6.8–7.8 ms; every run offered the expected member on 20 of
20 keystrokes. So 50–54 change nothing on this path, as expected: Zed asks for neither folding ranges
nor, while typing, document symbols, and no check here comes near the timeout.

**Typing in a large component** (`bigtype.mjs`, two interleaved runs per size):

| lines | `02e6b31` p50 / p95, final | `670722d` | **`7179942`** |
|---|---|---|---|
| 1,413 (N=1000) | 42–46 / 60–63 ms, 153–167 ms | 13–15 / 28–31 ms, 133–153 ms | **13–14 / 27–28 ms, 113–150 ms** |
| 2,113 (N=1500) | 317–323 / 521–522 ms, 689–697 ms | 18–19 / 39–87 ms, 210–224 ms | **19–20 / 37–38 ms, 210–256 ms** |
| 2,813 (N=2000) | 459–465 / 908 ms, 1,146–1,156 ms | 27–28 / 48–49 ms, 240–246 ms | **26–29 / 42–67 ms, 219–280 ms** |

**Correctness at `7179942`.**

* **Tests** (`vendor/rsvelte`, `CARGO_TARGET_DIR=target-rsvelte-tests`): `rsvelte_language_server`
  480 unit (1 ignored), 31 protocol, 23 robustness and 2+2+3 others pass;
  `upstream_fixture_manifest` fails 5 of 7 as before (no language-tools checkout). `cargo fmt` is
  clean; `cargo clippy -p rsvelte_language_server --all-targets` reports only the four warnings
  `670722d` already has (rsvelte_core `utils.rs` ×2, `symbols.rs`, `tsgo_response.rs`).
* **Earlier reproductions** (`runall.sh`): every script gives `670722d`'s answers (s1–s4, s7, s8, s10,
  s11, incomplete-edits, r1-depkill, r1b-close, r2c-format, r2d-hover, r2e-hover-edit-race 0 of 10
  wrong, r5-crash, r6-watchers, hashscope, start-of-file, start-of-file2, style-open, recover-pos 377
  states with 486 problems and none at 0:1); r2c-format and r2d-hover pass and differ from that
  record only in timing (which try caught the probe, whether the probe still ran at the edit).
* **lsfuzz** seeds 22 and 38 (`THIRD=1 NO_WS=1 INIT_SLEEP=600 LONG_SLEEP=700 CANCEL=1`, 300
  iterations): as at `670722d`. Default timeout: 286 and 210 answered, the fuzzer's own 15 s check
  reports the lost signature help (275) and completion (200), the later hover and folding requests
  are answered and every project loads; with `RSVELTE_TSGO_REQUEST_TIMEOUT_MS=10000`: 287 and 309
  answered, no error, tsgo restarts on the spinning signature help. No panic.
* **End to end** (`node tests/e2e.mjs run patched --out docs/measurements/tests/e2e-round5-ls.json`, through the
  lock): 41/41, identical step for step to `670722d` (`e2e-compare-final-670722d-vs-round5-ls.txt`), no panic,
  no restart, zeno's sources untouched. tsgo replaced its watchers this session (15 registrations, 3
  unregistrations, against 12 and 0 at `670722d`; see the follow-up on watcher replacement).

### Round 4 final: patches 1–49 (`670722d`) against the official server

`670722d` merges the projection branch (47–49, `bf0dca5`) into the language-server patches 41–46
(`1d4cb87`); the merge had no conflict and needed no fix. zeno root (476 components in 12 projects),
every session through `bench/with-lock.sh`; official svelte-language-server 0.18.5 (Zed's install,
TypeScript 5.9.3), svelte-language-server-rs with tsrs 0.18.0 (TypeScript 7.1.0-dev.20260930.4). The tables are
`VARIANT=final-b bench/final.sh 3` at a load average of 1–2; an earlier `VARIANT=final` set with
`EXTRA_BENCH_BIN`/`EXTRA_TYPING_BIN` = `1d4cb87` (load 4–10) checks the merge. Lines tagged `final`
and `final-b` in `docs/measurements/bench/final.jsonl`; the other records in `docs/measurements/tests/regressions-final-670722d.txt`.

`bench/bench.mjs`, 3 files across 2 projects (admin-layout / field-renderer / confirmation-dialog):

| | first diagnostics | edit → diagnostics (median of 5) | memory, ps RSS, settled | initialize |
|---|---|---|---|---|
| official 0.18.5 | 1,907–2,058 / 271–291 / 929–974 ms | 275–279 / 263–272 / 264–265 ms | 805–809 MB | 369–387 ms |
| **svelte-language-server-rs `670722d`** | **199–201 / 15–16 / 17–19 ms** | **13–14 / 12–13 / 13–14 ms** | **339–340 MB** (svelte-language-server-rs 72, tsrs 267–268) | **14 ms** |

* The first file's 199–201 ms is the order of `final.sh`, which always starts svelte-language-server-rs right after the
  official server (round 4 saw the same). In four direct alternating pairs against `7793da7` at load
  1.3–2.1, `670722d` opens it in 136–183 ms against 139–179 ms and edits in 10–13 ms against 16–21 ms
  (`docs/measurements/tests/regressions-final-670722d.txt`).
* Merge check (`final` set, load 4–10): `670722d` 167–256 / 13–17 / 15–17 ms, edits 11–13 / 9–11 /
  10–11 ms; `1d4cb87` 147–210 / 12–15 / 15–29 ms, edits 10–12 / 9–12 / 11–13 ms; official
  2,096–2,188 / 271–278 / 945–998 ms. Memory settled at 336–341 MB on both builds (in one `670722d`
  run ps RSS fell to 209 MB while macOS compressed idle pages; its peak was 325 MB).
* **Memory with every project loaded** (`bench/allprojects.mjs <bin> <zeno> background 40000`: one
  component opened, a hover every 2.5 s while the background loads the rest, then three
  `workspace/symbol` queries): all 12 projects load, idle hovers answer in 1–5 ms, `workspace/symbol`
  finds all three (5 files) in 2–13 ms; **284–287 MB phys_footprint** (svelte-language-server-rs 52–53, tsrs 232–235;
  ps RSS 309–315 MB). The official server in the same session holds one project, finds none of the
  three symbols, and takes 540 MB before the queries and 574 MB after (phys_footprint; RSS 558/590).
* **Smaller workspaces** (`bench/bench.mjs` with admin-layout and field-renderer, 3 runs, load 5–11,
  `final-b` lines with `workspace` `admin` / `admin/src`): workspace = zeno/admin, official
  1,960–2,299 / 279–283 ms, edits 262–272 ms, 603–621 MB; svelte-language-server-rs 174–213 / 12–15 ms, edits 8–11 ms,
  162–163 MB. Workspace = zeno/admin/src, svelte-language-server-rs 149–154 / 14–17 ms, edits 8–12 ms, 162–164 MB
  (unpatched, in the first measurement: 6.8 s / ~90 ms / 965 MB and 3.3 s / ~52 ms / 524 MB).

Typing (`bench/typing.mjs`, admin-layout.svelte, as in round 3):

| | final diagnostics, after the last keystroke | completion while typing, p50 / p95 (max) | member completion after a keystroke, p50 / p95 (max) | unchanged document, p50 / p95 | memory before typing → peak (settled) |
|---|---|---|---|---|---|
| official 0.18.5 | 261–267 ms | 64–67 / 281–296 ms (311–313) | 18.8–19.0 / 22.7–24.3 ms (24–27) | 1.6–1.8 / 2.1–2.5 ms | 587–611 → 672–693 MB (839–843) |
| **svelte-language-server-rs `670722d`** | **15–16 ms** | **7.0–8.1 / 16.3–17.8 ms (22–24)** | **6.5–7.3 / 7.9–8.4 ms (8.0–8.6)** | 2.0–2.3 / 2.5–2.6 ms | **316 → 363–364 MB (366)** |

* Both end on the single TS2339 (`Property 'exten' does not exist on type 'ResolvedAdminConfig'`),
  966–967 ms after the first keystroke on svelte-language-server-rs and 1,212–1,219 ms on the official server (the
  typing takes 950 ms). The expected member was offered on 20 of 20 keystrokes and in 20 of 20 member
  rounds, in every run of both; no request failed.
* Merge check (`final` set): `670722d` final diagnostics 13–18 ms, completion while typing p50 6.8–10.0
  / p95 15.5–23.1 ms, member 5.7–11.8 / 6.6–21.9 ms; `1d4cb87` 13–19 ms, 6.4–13.5 / 17.8–45.6 ms,
  5.6–12.0 / 6.2–25.3 ms (the second run of each, at load 10, carries the high ends; the official
  server's p50 was 143–308 ms in that set).
* **Against the official server**: first diagnostics about 10× faster (10–15× in the direct pairs),
  edits about 20×, the final diagnostics while typing about 17×, completion while typing 8–9× at
  p50 and 17× at p95, a member completion about 2.7×, at 42–44% of the memory in the same benchmark
  (339–340 against 805–809 MB; 366 against 839–843 MB after typing), and about half the
  phys_footprint with all 12 projects loaded against the official server's one.

**Typing in a large component** (`bigtype.mjs`, interleaved, load 6–24; median of 11 runs at N=2000):

| lines | `02e6b31` p50 / p95, final | `7793da7` (round 3) | `1d4cb87` (round 4) | **`670722d`** |
|---|---|---|---|---|
| 1,413 (N=1000) | 60–66 / 70–91 ms, 180–202 ms | 259–315 / 464–512 ms, 270–329 ms | 12–13 / 28–31 ms, 134–153 ms | **13–14 / 27–29 ms, 142–160 ms** |
| 2,113 (N=1500) | 291–397 / 558–618 ms, 733–797 ms | 712–853 / 957–1,102 ms, 781–885 ms | 18–19 / 34–38 ms, 188–209 ms | **19 / 38–43 ms, 185–195 ms** |
| 2,813 (N=2000) | 557–669 / 947–1,114 ms, 1,177–1,346 ms | 1,116–1,131 / 1,363–1,376 ms, 1,238–1,257 ms | 25 / 44 ms, 208 ms | **26 / 44 ms, 205 ms** |

At N=2000 eleven runs of each, alternating which goes first: `1d4cb87` p50 24–51 ms, final 191–420 ms;
`670722d` 24–114 ms, 194–384 ms; each build's high end is one run at load 16–19. The merge changes
nothing here.

**Correctness at `670722d`.**

* **Tests** (`vendor/rsvelte`, `CARGO_TARGET_DIR=target-rsvelte-tests`): `rsvelte_language_server` 477
  unit (1 ignored), 31 protocol, 19 robustness and 2+2+3 others pass, `upstream_fixture_manifest`
  fails 5 of 7 as before (no language-tools checkout); `rsvelte_projection` 847 tests in 113 targets
  pass (1 ignored); `rsvelte_core` 1,980 lib tests (1 ignored) and its loose-parser tests (5 + 4 + 6)
  pass; `rsvelte_check` 279 pass. `cargo fmt --all --check` is clean; `cargo clippy --all-targets` on
  the projection and the language server reports only the four warnings `7793da7` already has
  (rsvelte_core `utils.rs` ×2, `symbols.rs`, `tsgo_response.rs`).
* **Review 3's findings**: `hashscope.mjs` exactly the 2 errors on the invalid line (46);
  `style-open.mjs` native diagnostics while the style block is open, no panic (42);
  `start-of-file2.mjs` no diagnostic at 0:1 and the template's TS2322 in all 7 states (43, 48; at
  `1d4cb87` the four `import {` states lost it, at `7793da7` five states had 2–4 diagnostics at 0:1);
  `start-of-file.mjs` none at 0:1 in its 13 states, and `type T = {` / `interface I {` report only
  TS6196 for the unused type (49; at `1d4cb87` `type T = {` had seven false errors on the function
  line and "Cannot find name 'go'" in the template, `interface I {` a TS1131); `recover-pos.mjs` 377
  states, 0 at 0:1, 486 problems (`1d4cb87` 487): 13 false diagnostics gone, 5 new where TypeScript
  puts them ("'from' expected" at the end of the import, TS6196), and the hover on `go(later)`
  describes the function again; `bf0dca5` alone gives the identical record.
  `r5-crash.mjs` with `{#each <script </script>`, its unminimized original and
  `<div title="<script </script>">` (`tests/regressions/crash-inputs/`): no projection panic caught
  (`1d4cb87`: 3 of 3); over the 54 review and projection-engineer candidates, 0 (`1d4cb87`: 7).
  `lsfuzz.mjs` seeds 22 and 38 (`THIRD=1 NO_WS=1 INIT_SLEEP=600 LONG_SLEEP=700 CANCEL=1`, 300
  iterations): no panic at all (`1d4cb87`: 16 and 38 caught `htmlxparser.rs:610` panics); with the
  default 30 s timeout the fuzzer's own 15 s check still reports the lost request, every project loads
  and the later hover and folding requests are answered (286 and 210 answered); with
  `RSVELTE_TSGO_REQUEST_TIMEOUT_MS=10000` every request is answered (287 and 309, no errors), tsgo
  restarts on the spinning signatureHelp (275) and completion (200), and the third project loads
  (44, 45).
* **Earlier reproductions** (`runall.sh`): s1–s4, s7, s8, s10, s11, incomplete-edits (6/6),
  r1-depkill, r1b-close, r2c-format, r2d-hover, r2e-hover-edit-race (0 of 10 wrong), r5-crash and
  r6-watchers give round 4's answers; the 240 saved panicking inputs of the second review are all
  answered with no projection panic caught.
* **End to end** (`node tests/e2e.mjs run patched --out docs/measurements/tests/e2e-final-670722d.json`, through the
  lock): 41/41, identical step for step to round 4 (`e2e-compare-round4-ls-vs-final-670722d.txt`), 12 watcher
  registrations, no unregistrations, no panic, zeno's sources untouched (`git status` clean before and
  after every session of this round). Its `initialize` took 646 ms: the first execution of the freshly
  linked binary (macOS checks a new executable once); every later session initialized in 2–17 ms.

### Round 4, language server: patches 41–46 (`1d4cb87`) against `7793da7` and the official server

Every zeno session through `bench/with-lock.sh`. The first set of runs (`round4-ls` in
`docs/measurements/bench/final.jsonl`) ran at a load average of 80–290 from other work on the machine and is
kept only as a record; the numbers below are the rerun at 4–11 (`round4-ls-b`, `bench/final.sh 3`
with `EXTRA_*_BIN=<7793da7>`), plus direct A/B sessions at 4–10.

**Typing in a large component** (`tests/regressions/bigtype.mjs <binary> tpl <N>`: 20 keystrokes 50 ms
apart in the instance script, each followed, without waiting, by a completion and a diagnostic pull
as Zed sends them; completion latency while typing, and the time from the last keystroke to the
final text's error), two interleaved runs per size at load 4–10:

| lines | `02e6b31` (patch 27, before the regression) p50 / p95, final | `7793da7` (round 3) | **`1d4cb87`** |
|---|---|---|---|
| 1,413 (N=1000) | 43–58 / 60–67 ms, 156–175 ms | 239–242 / 489–492 ms, 241–247 ms | **12–13 / 26–27 ms, 135–146 ms** |
| 2,113 (N=1500) | 235–243 / 443–452 ms, 613–619 ms | 609–694 / 855–940 ms, 662–761 ms | **18–20 / 35–36 ms, 186–223 ms** |
| 2,813 (N=2000) | 414–451 / 776–855 ms, 998–1,089 ms | 1,091–1,092 / 1,337–1,387 ms, 1,214–1,217 ms | **24–25 / 42–44 ms, 201–234 ms** |

So patch 41 removes patch 28's regression and the queueing `02e6b31` already had: at 2,113 lines
completions while typing are 13× faster than at `02e6b31` and 35× faster than at `7793da7`, and the
final diagnostics arrive 3× sooner. Under the heavy load of the first runs (40–320) the ordering is
the same (2,813 lines: `02e6b31` p50 468–541 ms, `1d4cb87` 29–35 ms in three of four runs); every
run is in `docs/measurements/tests/regressions-round4-ls.txt`. A quiet pull of the component (no typing) takes
the same 56–155 ms on every build.

**zeno root** (`bench/bench.mjs`, 3 files across 2 projects; `bench/typing.mjs`, admin-layout), 3 runs:

| | first diagnostics | edit → diagnostics (median) | memory, settled | initialize |
|---|---|---|---|---|
| official 0.18.5 | 2,033–2,287 / 271–278 / 957–1,961 ms | 265–270 / 259–276 / 253–255 ms | 711–824 MB | 383–422 ms |
| **svelte-language-server-rs `1d4cb87`** | **201–281 / 13 / 15–16 ms** | **11 / 9–10 / 10–11 ms** | **340–342 MB** | **15–17 ms** |
| svelte-language-server-rs `7793da7` | 143–167 / 18–20 / 19–23 ms | 16–17 / 15–19 / 14 ms | 342–344 MB | 13–20 ms |

| | final diagnostics | completion while typing, p50 / p95 | member completion, p50 / p95 | unchanged document, p50 / p95 | memory before typing → peak (settled) |
|---|---|---|---|---|---|
| official 0.18.5 | 239–267 ms | 66–180 / 282–319 ms | 15.8–16.7 / 19.1–23.0 ms | 1.3–1.4 / 1.5–1.8 ms | 609–619 → 669–724 MB (633–893) |
| **svelte-language-server-rs `1d4cb87`** | **13–19 ms** | **6.3–7.5 / 14.9–17.6 ms** | **5.4–6.8 / 5.7–8.4 ms** | 1.7–1.8 / 1.9–2.1 ms | **312–318 → 355–363 MB (358–366)** |
| svelte-language-server-rs `7793da7` | 14–18 ms | 6.4–7.4 / 15.3–20.1 ms | 5.5–6.6 / 5.8–8.1 ms | 1.6–1.9 / 1.8–3.0 ms | 314–317 → 355–359 MB (357–360) |

(typing: the three `final.sh` runs, the first of which caught a burst of other work, keystroke p50 27.5
ms with spikes to 100 ms, plus three direct A/B pairs.) Edits are 30–40% faster than at `7793da7`: a
pull's tsgo half no longer waits for its lint. The first file's first diagnostics were slower in
`final.sh`, where this build always runs right after the official server; alternating the order in
4 direct pairs gives 132–212 against 133–146 ms, and with the background off 132–144 against 136–221
ms: in every build the first pull is one request answered when tsgo has built the project. Typing in
admin-layout (338 lines) is unchanged, as are the expected members (20 of 20 everywhere).

**Correctness at `1d4cb87`.**

* **Tests** (`vendor/rsvelte`): `rsvelte_language_server` 477 unit (1 ignored), 31 protocol, 19
  robustness and 2+2+3 others pass; `upstream_fixture_manifest` fails 5 of 7 as before (no
  language-tools checkout). `cargo fmt` is clean; `cargo clippy --all-targets` reports only the two
  warnings `7793da7` already has (symbols.rs, tsgo_response.rs; new lints of the current toolchain).
* **Review 3's findings**: `hashscope.mjs` exactly the 2 errors on the invalid line (46);
  `style-open.mjs` native diagnostics while the style block is open, no panic (42);
  `start-of-file2.mjs` no diagnostic at 0:1 (43; the template's prop errors in `import {` states
  wait for the projection fix, patch 48); `lsfuzz.mjs` seeds 22 and 38: every project loads despite the lost
  request, and with a 10 s timeout every request is answered and tsgo restarts on the spinning one
  (44, 45).
* **Earlier reproductions** (`runall.sh`, `docs/measurements/tests/regressions-round4-ls.txt`): s1–s4, s7, s8,
  s10, s11, incomplete-edits (6/6), r1-depkill, r1b-close, r2c-format, r2d-hover, r2e-hover-edit-race
  (0 of 10 wrong) and r6-watchers give round 3's answers; r5-crash answers every one of the 240 saved
  panicking inputs with no projection panic caught.
* **End to end** (`tests/e2e.mjs run patched`, through the lock): 41/41
  (`docs/measurements/tests/e2e-round4-ls.json`), identical step for step to round 3
  (`e2e-compare-round3-vs-round4-ls.txt`), 12 watcher registrations, no unregistrations, no panic,
  zeno's sources untouched.

### Round 3: patches 1–40 (`7793da7`, the merge) against the official server

zeno root (476 components, 12 projects), every session through `bench/with-lock.sh`.
`VARIANT=round3-merged EXTRA_BENCH_BIN=…:42d8d9e EXTRA_TYPING_BIN=…:42d8d9e bench/final.sh 3`
interleaves three runs of each benchmark for the official svelte-language-server 0.18.5 (Zed's
install, TypeScript 5.9.3), svelte-language-server-rs at the merge `7793da7`, and the pre-merge `42d8d9e` (patches
1–31) as a check on the merge; tsrs 0.18.0 (TypeScript 7.1.0-dev.20260930.4); load average 2.4–5.
Lines tagged `round3-merged` in `docs/measurements/bench/final.jsonl`.

`bench/bench.mjs`, 3 files across 2 projects (admin-layout / field-renderer / confirmation-dialog):

| | first diagnostics | edit → diagnostics (median of 5) | memory, ps RSS, settled | initialize |
|---|---|---|---|---|
| official 0.18.5 | 1,827–2,484 / 276–292 / 834–1,026 ms | 271–276 / 257–262 / 256–265 ms | 781–826 MB | 303–448 ms |
| **svelte-language-server-rs `7793da7`** | **125–192 / 21–22 / 19–20 ms** | **19–21 / 17–19 / 17–18 ms** | **337–344 MB** (svelte-language-server-rs 71–72, tsrs 266–272) | **2–14 ms** |
| svelte-language-server-rs `42d8d9e` | 132–146 / 19–21 / 21–23 ms | 18–20 / 19–20 / 15–18 ms | 336–343 MB | 2–16 ms |

The first of the three runs was the slowest for every server (official 2,484 ms, `7793da7` 192 ms,
`42d8d9e` 146 ms; svelte-language-server-rs initialize 14–16 ms); in runs 2 and 3 the merge opens the first file in
125–128 ms against 132–134 ms, and initializes in 2 ms. After the first file: official 577–584 MB,
svelte-language-server-rs 304–315 MB.

Typing (`bench/typing.mjs`, admin-layout.svelte: `runtime.config.exten` typed before `</script>` as 20
single-character incremental edits 50 ms apart, each followed by a completion request and a diagnostic
pull as Zed sends them; then 20 awaited rounds of one keystroke at the end of the member expression
and a completion there; then 20 completions on the unchanged document):

| | final diagnostics, after the last keystroke | completion while typing, p50 / p95 (max) | member completion after a keystroke, p50 / p95 (max) | unchanged document, p50 / p95 | memory before typing → peak (settled) |
|---|---|---|---|---|---|
| official 0.18.5 | 226–254 ms | 53–64 / 249–263 ms (257–279) | 17.1–18.5 / 19.9–23.7 ms (20–25) | 1.3–1.6 / 1.5–1.9 ms | 612–621 → 689–697 MB (862–870) |
| **svelte-language-server-rs `7793da7`** | **15–17 ms** | **6.2–7.4 / 15.8–17.0 ms (20–22)** | **5.7–6.0 / 6.9–7.3 ms (7.0–7.7)** | 1.8–2.0 / 2.1–2.2 ms | **315 → 351–357 MB (353–360)** |
| svelte-language-server-rs `42d8d9e` | 16 ms | 6.4–7.1 / 16.0–17.8 ms (21–22) | 6.0–6.2 / 6.6–8.4 ms (7.8–20.9) | 1.8–1.9 / 2.1–2.3 ms | 314–315 → 349–356 MB (352–358) |

* All three end on the same single error, `Property 'exten' does not exist on type
  'ResolvedAdminConfig'` (TS2339); measured from the first keystroke it arrives after 965–967 ms on
  svelte-language-server-rs and 1,176–1,205 ms on the official server (the typing itself takes 950 ms).
* The expected member (`runtime`, `config`, `extensions`) was offered on 20 of 20 keystrokes and in 20
  of 20 member rounds by every server, in every run; no completion request failed.
* While typing, the official server answers its first five to seven keystrokes in 182–279 ms each
  (queued behind its own work) and the rest in 14–141 ms; svelte-language-server-rs answers in 13–22 ms while
  `runtime` is typed and 5–8 ms in the member names.
* So against the official server, at the zeno root: first diagnostics about 14× faster (runs 2–3:
  125–128 against 1,827–1,870 ms), edits about 14×, the final diagnostics while typing about 15×,
  completion while typing about 8× at p50 and 15× at p95, a member completion about 3×, with 41–44%
  of the memory (337–344 against 781–826 MB). The merge changes none of svelte-language-server-rs's numbers beyond
  run-to-run noise.

Correctness at `7793da7` (the same session):

* **Test suites** (from `vendor/rsvelte`): `rsvelte_language_server` 472 unit (1 ignored), 31 protocol,
  17 robustness and 2+2+3 others pass, `upstream_fixture_manifest` fails 5 of 7 as before (no
  language-tools checkout); `rsvelte_projection` 839 tests in 113 targets pass (1 ignored);
  `rsvelte_core` 1,980 lib tests (1 ignored) and its loose-parser tests (5 + 6 + 4) pass;
  `cargo fmt --all --check` is clean. No integration fix was needed.
* **Crash reproductions**: `r5-crash.mjs` passes (it failed on `42d8d9e`: the server died on the
  no-break space in `$props(`); fed the review's saved panicking inputs, every one is answered and no
  projection panic is even caught (all of them now project): `allpanics` 165/165, `found-1..4` 38/38,
  `sfound-1..4` 132/132, `real/` 70/70 (240 files, 239 distinct). The binary links `panic_unwind`
  (not `panic_abort`), so patch 35 is live.
* **The other reproductions** (`runall.sh`): s1–s4, s7, s8, s10, s11, incomplete-edits (6/6),
  r1-depkill, r1b-close, r2c-format, r2d-hover, r2e-hover-edit-race (0 of 10 wrong) and r6-watchers
  give the same answers as at `42d8d9e` (r2c needed 4 tries to land its request inside a probe, r2d's
  range for the previous version is the known follow-up below); s6 and s9 (both orders),
  r6b-install and r6e-nested-install (none/real/link) unchanged. s5 at N=400, interleaved,
  3 runs each, `42d8d9e` against `7793da7`: TS chain 175–191 / 157–186 ms, TS flat 156–160 /
  153–173 ms, JS chain 611–626 / 602–627 ms, JS flat 158–165 / 156–164 ms: no difference. Every
  output is in `docs/measurements/tests/regressions-round3.txt`.
* **End to end** (`tests/e2e.mjs` through the lock, the baseline then the merge): 41/41
  (`docs/measurements/tests/e2e-round3-merged.json`), identical step for step to the pre-merge record
  (`e2e-round2-ls.json`, `e2e-compare-round2-ls-vs-round3.txt`); the baseline (rsvelte `5ed8ea3` +
  tsrs) 24/41 (`e2e-baseline-round3.json`), identical step for step to its previous run
  (`e2e-baseline-final.json`); `e2e-compare-round3.txt` has the 19 steps that differ: the
  baseline's 17 failures, and 5c and 9b, which pass on both but where the baseline also reports
  false "Cannot find module" errors (`bits-ui`, `#lib/…`, `@riducms/protocol`). 12 watcher
  registrations and no unregistrations (baseline 11), no panic in the server's stderr, and zeno's
  `git status` clean before and after every session.

### Second review, language server: patches 26–31 (`42d8d9e`) against `8b7902f`

zeno root, every session through `bench/with-lock.sh`, `8b7902f` and `42d8d9e` interleaved, 3 runs of
each benchmark (`round2-ls-ab` in `docs/measurements/bench/final.jsonl`). Other work kept the load average at
50–100 throughout, so absolute numbers are a little above the quiet ones further down; the two builds
moved alike.

| | first diagnostics (3 files) | edit → diagnostics | memory, settled | typing: final diagnostics | completion while typing, p50 / p95 | member completion, p50 / p95 | memory before typing → peak |
|---|---|---|---|---|---|---|---|
| `8b7902f` | 129–199 / 18–19 / 17–20 ms | 16 / 15–16 / 14 ms | 339–343 MB | 14–15 ms | 6.0–7.1 / 15.1–16.9 ms | 5.4–5.6 / 5.8–6.7 ms | 315–316 → 353–360 MB |
| **`42d8d9e`** | **135–143 / 17–20 / 16–20 ms** | **16 / 15–16 / 14–15 ms** | **336–341 MB** | **14 ms** | **6.0–6.5 / 15.6–16.3 ms** | **5.2–5.5 / 5.5–6.2 ms** | **313–315 → 352–358 MB** |

Completions offered the expected member on 20 of 20 keystrokes on both. (Before patch 31, `6fbb3d5`
held 283–284 MB before typing: fewer background projects had loaded by then.)

Correctness at `42d8d9e`:

* **End to end** (`tests/e2e.mjs`, through the lock): 41/41 steps pass
  (`docs/measurements/tests/e2e-round2-ls.json`), with 15 watcher registrations and 3 unregistrations (at
  `6fbb3d5`: 12 and 0; the difference is whether tsgo replaced its auto-import watchers during the
  session, which it does by unregistering and registering the same patterns).
* **The review's reproductions** (`tests/regressions/`, `runall.sh`): r1-depkill (both orders),
  r1b-close, r2c-format, r2d-hover (5–30 ms), r2e-hover-edit-race (0 of 10 and 0 of 20 wrong) and
  r6-watchers pass; s1–s11 and incomplete-edits give the same output as at `8b7902f` (s1b's wait
  time aside); s6 and s9 (both orders) unchanged; s5 at N=400, `8b7902f` → `42d8d9e`: TS chain
  171 → 145 ms, TS flat 128 → 138 ms, JS chain 593 → 591 ms, JS flat 183 → 138 ms (one run each).
  r6e-nested-install: resolves when the editor reports the real paths, not without events.
  r5-crash still fails on this branch alone, as the crash is fixed on the projection branch: a
  trial merge with `svelte-rs-projection` (`eeab3f3`) answered all 165 of the review's panicking
  fuzz inputs with no panic and passed every other reproduction as `6fbb3d5`'s parent `8b896ba` did.
* **Tests**: `rsvelte_language_server` 471 unit (1 ignored), 31 protocol, 16 robustness and 2+2+3
  others pass; `upstream_fixture_manifest` fails 5 of 7 as before (no language-tools checkout).
  `cargo fmt --check` is clean.

### Round 2, merged: patches 1–25 (`8b7902f`) against the official server

zeno root (Zed's case: 476 components, 12 projects), every session through `bench/with-lock.sh`,
official svelte-language-server 0.18.5 (Zed's install, TypeScript 5.9.3) against svelte-language-server-rs at
`vendor/rsvelte` `8b7902f` with tsrs. `bench/final.sh 3` interleaves three runs of each benchmark
and server and appends a tagged line per session to `docs/measurements/bench/final.jsonl`; load average
1.5–4 throughout.

`bench/bench.mjs`, 3 files across 2 projects (admin-layout / field-renderer / confirmation-dialog),
3 runs each:

| | first diagnostics | edit → diagnostics (median of 5) | memory, ps RSS, settled | initialize |
|---|---|---|---|---|
| official 0.18.5 | 1,834–1,966 / 284–290 / 860–882 ms | 289–296 / 266–269 / 260–265 ms | 820–824 MB | 328–372 ms |
| **svelte-language-server-rs `8b7902f`** | **130–137 / 22 / 21–23 ms** | **20–21 / 19–20 / 17–18 ms** | **337–339 MB** (svelte-language-server-rs 71–72, tsrs 265–268) | **2 ms** |

svelte-language-server-rs's memory has all 12 projects loaded (patch 17, during the benchmark's pauses); after the
first file it is 304–305 MB against the official server's 583–586 MB.

Typing (`bench/typing.mjs`, admin-layout.svelte, 3 runs each). The script types
`runtime.config.exten` on a new line before `</script>` as 20 single-character incremental edits
50 ms apart; after each one it sends what Zed sends while typing, a completion request at the cursor
(trigger character `.` after a dot) and a diagnostic pull, without waiting for the answers. Then 20
rounds of one keystroke at the end of the member expression (`exten` ↔ `exte`) followed by a
completion there, each awaited, and 20 more completions without an edit:

| | final diagnostics, after the last keystroke | completion while typing, p50 / p95 (max) | completion at the end of the member expression after a keystroke, p50 / p95 (max) | same, unchanged document, p50 / p95 | memory before typing → peak |
|---|---|---|---|---|---|
| official 0.18.5 | 225–307 ms | 64–150 / 262–285 ms (274–330) | 18.5–19.9 / 22.6–24.3 ms (24–25) | 1.5–1.8 / 1.9–2.0 ms | 607–608 → 690–701 MB |
| **svelte-language-server-rs `8b7902f`** | **15–16 ms** | **7.0–7.9 / 17.0–18.4 ms (21–24)** | **6.6–6.7 / 7.5–7.8 ms (7.5–8.0)** | 2.2–2.3 / 2.6–2.7 ms | **314–317 → 356–359 MB** |
| svelte-language-server-rs `8b7902f`, background projects off | 13–15 ms | 4.8–5.9 / 13.9–16.4 ms (19–23) | 5.0–5.5 / 6.0–6.2 ms (6.1–6.8) | 1.6 / 1.8–1.9 ms | 160–161 → 196–199 MB |
| svelte-language-server-rs `2c6a9f7` (patches 1–21, before the merge) | 17–18 ms | 14.7–15.9 / 26.2–27.3 ms (30–32) | 6.4–6.8 / 8.0–8.5 ms (8.5–8.6) | 2.2–2.3 / 2.5–2.6 ms | 313–317 → 387–394 MB |

* Every server ends on the same single error, `Property 'exten' does not exist on type
  'ResolvedAdminConfig'` (TS2339), which no earlier keystroke can produce. Measured from the first
  keystroke it arrives after 965–968 ms on svelte-language-server-rs and 1,177–1,257 ms on the official server
  (the typing itself takes 950 ms).
* The official server's completions queue behind its own work while the user types: its first six
  keystrokes take 211–285 ms each, and the rest 16–330 ms as the queue drains. svelte-language-server-rs answers
  every keystroke in 6–24 ms (14–24 ms while `runtime` is typed, 6–9 ms in the member names).
* Completions offered the expected member (`runtime`, `config`, `extensions`) on 20 of 20 keystrokes
  on the official server and on `8b7902f`, and on 18 of 20 on `2c6a9f7`: not at `runtime.` and
  `runtime.config.` (`11111110111111011111`), where the script ends in a dot and did not parse
  before patch 22. `2c6a9f7` also answers the keystroke at each dot and the one after it in
  24–32 ms against 6–8 ms: the broken script moved every import into `$$render()` and the next
  keystroke moved them back, two import-set changes that each cost tsrs a full program build. That
  is most likely also its 30 MB higher tsrs peak (307–314 against 274–280 MB), the memory tsrs keeps
  from every full build (below).
* After the completions the official server settles at 860–870 MB, svelte-language-server-rs at 357–361 MB.

Measurement notes. Both benchmark scripts now sample memory with an asynchronous `ps`. The
synchronous one used until this round blocked the client's event loop for ~30 ms every 100 ms,
which added ~30 ms to about a quarter of the typing latencies on both servers (a minimal Python
client showed no such outliers); those first typing lines stay in `final.jsonl`, marked
`superseded`. It did not move the `bench.mjs` medians: one check run each with the asynchronous
sampler gave 21 / 21 / 19 ms (svelte-language-server-rs) and 273 / 268 / 263 ms (official), so the three runs
above, which used the synchronous sampler for comparability with earlier rounds, stand. svelte-language-server-rs's
first open varied between 128 and 191 ms over this session (427 ms in the first session after the
rebuild); an alternating A/B of `2c6a9f7` and
`8b7902f` (6 sessions each) gave 126–135 and 128–133 ms, so the merge does not change it.

Correctness at `8b7902f`, same session:

* **End to end** (`tests/e2e.mjs`, through the lock): 41/41 steps pass
  (`docs/measurements/tests/e2e-merged.json`); the baseline (rsvelte `5ed8ea3` + tsrs) passes 24/41
  (`e2e-baseline-final.json`), identical step for step to its round-1 run. Against the pre-merge
  round-2 run (`e2e-fixed.json`, 40/41) the only change is 4g, FAIL → PASS: 50 completions after
  `runtime.` (i18n, manifest, session, bootstrap and config among them), and while it is typed only
  the parse error and TS1003 at the cursor, no TS2307 (`e2e-compare-merged.txt`,
  `e2e-compare-fixed-vs-merged.txt`). 4 watcher registrations (baseline 11). zeno's `git status` was
  clean before and after every session.
* **Reviewer scenarios** (`tests/regressions/`): `runall.sh` gives the same output as before the
  merge for s1, s1b, s2, s3, s4, s7, s8, s10 and s11; s6 keeps its diagnostics across version 0 and
  1; s9 offers `[alphaProp, betaProp]` in both orders; `incomplete-edits.mjs` passes 6 of 6 steps
  (`2c6a9f7`: 0 of 6). s5, `2c6a9f7` → `8b7902f`, one run each: TS chain 161 → 181 ms, JS chain
  632 → 633 ms, TS flat 164 → 165 ms, JS flat 163 → 156 ms.
* **Test suites** (from `vendor/rsvelte`): `rsvelte_language_server` 468 unit tests (1 ignored),
  31 protocol, 13 robustness and 2+2+3 others pass, `upstream_fixture_manifest` fails 5 of 7 as
  before (no language-tools checkout); `rsvelte_projection` passes all its test targets (823 tests,
  1 ignored); `rsvelte_core` passes its 1,980 lib tests (1 ignored) and the new loose-parser tests
  (6 + 4); `rsvelte_check` passes 279. `cargo fmt --check` is clean. No integration fix was
  needed.

### Patches 1–7

zeno monorepo (476 components, 12 projects), `bench/bench.mjs`, 3 files across 2 projects
(admin-layout, field-renderer, confirmation-dialog), same machine and session. Memory is the
whole process tree.

| workspace = zeno root (Zed's case) | first diagnostics | edit → diagnostics | memory, ps RSS | memory, phys_footprint | initialize |
|---|---|---|---|---|---|
| official svelte-language-server 0.18.5 | 2,223 / 298 / 999 ms | 260–272 ms (590 ms under load earlier) | 831 MB | 804 MB | 427 ms |
| svelte-language-server-rs before (rsvelte + tsrs) | 8,615 / 24 / 18 ms | 19–24 ms | 1,110 MB | 1,050 MB | 600–1,350 ms |
| **svelte-language-server-rs with patches 1–7** | **188–212 / 13–29 / 76–81 ms** | **14–19 ms** | **166–211 MB** | **190 MB** | **3–17 ms** |

| | first diagnostics | edit | memory (RSS) |
|---|---|---|---|
| workspace = zeno/admin, before → after | 6,730 → 145 ms | 91 → 15 ms | 970 → 166 MB |
| workspace = zeno/admin/src, before → after | 3,295 → 184 ms | 49 → 17 ms | 525 → 167 MB |

Correctness, measured on the same checkout:

* The injected type error is reported on the right line in every bench run.
* 54 files sampled across all 12 projects: identical diagnostics up to patch 6; patch 7 removes
  36 false diagnostics and adds one deprecation hint for a package it can now read.
* All 193 admin components and rune modules at the zeno root: 258 TypeScript errors before
  (the same 258 after patches 1–6), 1 after patch 7. That one (`form-controller.svelte.ts`
  TS2345) is also reported with the editor at zeno/admin, with and without the patches.
* Cross-component types: a parent gets a TS and a JSDoc child's prop types, an unsaved child
  buffer, a child edited on disk, a component created or deleted on disk, and a tsconfig change
  (`docs/measurements/bench/patches-evidence/e2e-*.json`: 11/11 after, 8/11 before; the 3 failures
  before are the bug patch 1 fixes). `admin/tests/browser/router.browser.ts` now types
  `@admin/app/admin-route-error.svelte` (before: a false "Cannot find module", no hover).

Raw data: `docs/measurements/bench/svelte-rs-patches.jsonl` (one line per run, tagged with the patch;
the `load` field is the 1/5/15-minute load average, which other agents' builds kept at 5–47)
and `docs/measurements/bench/patches-evidence/`.

### After patches 8–21

Same benchmark and files, through the lock, the previous build (patches 1–7) and this one in
the same session (load average 8–14):

| workspace = zeno root | first diagnostics | edit → diagnostics | memory, ps RSS |
|---|---|---|---|
| patches 1–7 | 131–209 / 13–14 / 47–68 ms | 12–15 ms | 212–213 MB |
| patches 1–21 (default: background projects on) | 134–166 / 17–18 / 18–22 ms | 13–17 ms | 337–338 MB, every project loaded |
| patches 1–21, `rsvelte.backgroundProjects.enable: false` | 147–152 / 17 / 53–61 ms | 12–15 ms | 213–214 MB |

The memory difference is patch 17 loading the other ten projects during the benchmark's
three-second pauses (the third file's project was then already loaded, hence 18–22 ms). With
every project loaded (`bench/allprojects.mjs`): 288 MB phys_footprint / 312 MB RSS (svelte-language-server-rs 56,
tsrs 232), against 1,110 MB before any patch; it stays under the ~400 MB at which background
loading would have defaulted to off.

The round-1 end-to-end test (`tests/e2e.mjs`): 35/41 steps before, 40/41 after (`docs/measurements/tests/e2e-fixed.json`,
`e2e-compare-fixed.txt`); the remaining failure, 4g (`runtime.` right before `</script>` is a parse
error), is in the projection and fails on the baseline too. The reviewer's scenarios
(`tests/regressions/`, `runall.sh` plus s5, s6, s9): s1, s1b (6/6 runs), s2, s3, s4, s8 and s9 in
both orders now give the baseline's answer, s7 too (with the baseline's extra `svelteHTML` error,
below); s5 flat 600 → 127–164 ms; s10 (subpath imports) and s11 (definition into a component) pass.

## 1. Keep editor buffers out of watched-file refreshes (`560d231`)

**Problem.** Every `workspace/didChangeWatchedFiles` event that is not a config change runs
`refresh` on every overlay, which re-projects each discovered source whose disk text differs from
the overlay's — including documents open in the editor with unsaved edits. tsgo's copy of the
buffer became the file on disk until the next keystroke in that document. tsrs registers a
`**/*` watcher, so the editor reports every save: saving one file made every other unsaved
buffer, and every component importing one, report diagnostics for stale text.

**Change.** `TsgoOverlay::refresh_except` skips the sources the editor has open; the server
passes its open documents. Closing a document still re-projects it from disk.

**Measured.** Synthetic e2e (`tools/e2e.mjs`): "a closed child edited on disk reaches the
parent", "closing the unsaved child reverts the parent", "a deleted component stops resolving"
fail before (the parent's buffer was replaced with its disk text) and pass after. No
performance change.

**Risks.** An editor that changes a file on disk without sending `didChange` for its open
buffer keeps the buffer's text in tsgo, which is the LSP contract.

## 2. Keep closed component shadows on disk (`b5ce1d2`)

**Problem.** Every component's svelte2tsx shadow was an in-memory tsgo buffer, opened with
`didOpen` at startup. A `didOpen` of a file that is not on disk but matches the overlay config's
`svelte/**/*` include is a file *creation* for tsgo/tsrs: it reloads the config's file names and
builds the whole program again (10–25 ms each), one after another, before the editor's first
request is answered. At the zeno root that is 476 opens, 479 full builds, 8.3–9.4 s. tsrs also
keeps part of every superseded build (about 360 B per file plus 70 B per import, 1.3–2.2 MB per
build on admin/src), so tsrs ended near 950 MB. Investigation: replaying the captured traffic
into a bare tsrs with the bodies written to disk gave the same diagnostics at 88 MB instead of
446 MB.

**Change.**

* Each served component's body is written into the overlay's shadow tree, where the include
  already finds it: atomically (a dot-named `.tmp` sibling the include ignores, then a rename)
  and only when the text changed (`TsgoOverlay::persist_body`). tsgo then builds a project once,
  lazily, when a request needs it.
* Only editor documents are tsgo buffers, and a buffer still wins over the body. On close the
  disk projection is persisted *before* `didClose`. A body rewritten behind a closed document
  (refresh, preprocessing) is announced with one batched `workspace/didChangeWatchedFiles`
  (`TsgoClient::notify_watched_files`): tsgo rereads a file only on such an event.
* Deleting a source deletes its body; at build time `sweep_bodies` removes bodies whose source
  is gone (renamed or deleted while no server ran) and torn writes, so the include never keeps a
  ghost component.
* JavaScript components keep their body on disk too (a stable root set), but are also opened as
  `javascriptreact` buffers, per project, before that project's first editor document: tsgo takes
  the script kind from the language id, and a `.svelte.tsx` body read from disk loses JSDoc
  types (14 of 16 zeno JS components differed when read from disk). Their opens are content
  changes, about 3 ms each.
* The cache moves from `.rsvelte-language-server/` to `.svelte-language-server-rs/` (still self-gitignored):
  upstream rsvelte refuses to run when a shadow body exists on disk, so the two must never share
  a cache. Watched-file events inside the cache are this server's own output and no longer
  trigger a refresh or a rebuild (a write of an overlay `tsconfig.json` used to restart tsgo,
  about 9 s).
* `ShadowResolutionInfo::is_resolvable` now requires the body on disk.

**Measured** (zeno root, first diagnostics / memory): 8,615 ms / 1,110 MB → 298 ms / 308 MB
(tsrs 945 → 145 MB); edits unchanged (13–19 ms); the 54-file sample identical. The remaining
298 ms was mostly patch 3's scan.

**Risks.**

* Disk writes: one body per served component (2.5–5 KB each, about 2 MB at the zeno root),
  rewritten only when the projection changes. Two servers on one workspace write identical
  content atomically (per-pid temporary names).
* Freshness depends on every body write being followed by a watched-file event; there is one
  code path (`deliver_disk_shadow` → `notify_watched_files`), covered by the e2e steps D, F, G, H.
* An editor that watches the cache sends echo events; they are forwarded to tsgo (harmless) and
  ignored by the server.

## 3. Answer "which Svelte config preprocesses this" once (`b488a6b`)

**Problem.** Before the preprocess sidecar exists, every `didOpen` and `didChange` asked
`ensure_preprocess_runtime` whether any shadow or open document has a Svelte config, and
`find_preprocess_config` answered by canonicalizing five config names in every ancestor
directory, for every shadow: 231 ms on the main loop before the first diagnostic at the zeno
root, and in a workspace with no Svelte config at all (zeno/admin) the sidecar never starts, so
the 65–70 ms scan ran on every keystroke.

**Change.** `PreprocessConfigCache` memoizes the answer per directory (reusing ancestors) and
the server remembers when nothing needs preprocessing (`preprocess_known_empty`). Both are
cleared whenever the answer can change: a project/Svelte config event, a settings or
workspace-folder change, a refresh that found sources, a newly loaded project, or an editor
document whose own directory has a config.

**Measured.** zeno/admin: edits 87–90 → 17 ms, first diagnostics 538 → 147 ms. zeno root:
first diagnostics 298 → 164 ms.

**Risks.** A Svelte config created without a watched-file event for it (an editor that does not
report `svelte.config.*`) is noticed when a document in its directory is opened, not before.
Tests: `the_cache_answers_exactly_as_the_walk_does`, and a protocol test that a document under a
late config still starts the sidecar (it fails if the reset is removed).

## 4. Load each project on demand, with the components it owns (`774d7fe`)

**Problem.** `initialize` discovered and projected every component of every workspace folder,
then again for each nested config that owns one (476 + 476 projections at the zeno root,
600–700 ms before the editor may send `didOpen`), and kept them all in memory (svelte-language-server-rs 112 MB).
A project was "every `.svelte` file under its directory": at zeno/admin the Node-only
`admin/tsconfig.json` project also held all 166 components `admin/src/tsconfig.json` owns
(332 replays, a second program). The preprocess sidecar (Node, 52 MB) started at the root only
because `playground/shadcn-rhea` was eagerly loaded. Copies needed for cross-project imports
followed relative imports only, so `admin/tests` (a project that owns no component and imports
the app through `@admin/*`) reported "Cannot find module".

**Change.**

* Workspace folders start as *deferred* overlays (config and shims only). A project loads when
  the first document it owns reaches tsgo: the owner is the document's nearest
  `tsconfig.json`/`jsconfig.json` within its workspace folder, as upstream resolves a service per
  document (`locate_project`, `TsgoRuntime::ensure_project_for`).
* A project holds the components it owns (its directory minus subdirectories with a config of
  their own) plus a copy of every component they — or the script modules it owns, rune modules
  included — reach through a relative or `paths`/`baseUrl`-aliased `.svelte` import,
  transitively. tsgo resolves an import only inside a project's own shadow tree, so the copies
  keep cross-project imports typed. A member that cannot be read or projected is skipped and
  logged instead of failing its whole project.
* Requests are answered by the owning project: response mapping, routing and the custom
  component requests prefer the overlay that owns a component over a copy at the same depth (a
  reproduced bug: the TS error and hover vanished when admin/tests' copy answered). An editor
  buffer is mirrored into every loaded copy, as upstream's snapshots are shared by every
  service, and every copy returns to the disk version on close. A request about a component no
  editor has open loads its project first. A project loaded after the sidecar started has its
  members queued for preprocessing.
* `nested_project_configs`/`add_nested_overlays`/`replayed_shadows` are gone; the comment that
  justified eager nested builds (a lazy build would change another project's answer) no longer
  holds, because each project's config and shadow tree live in its own cache directory, which no
  other project's include reaches, and cache events are ignored (patch 2).

**Measured** (zeno root): initialize 600–700 → 2–4 ms, memory 309 → 193 MB (svelte-language-server-rs 112 →
48 MB, no preprocess sidecar), edits 9–17 ms, first diagnostics 164 → 185–248 ms (admin/src is
now projected on first open; patch 5 recovers it). 54-file sample identical;
`router.browser.ts`: 0 diagnostics and a `Component<…>` hover instead of a false TS2307.

**Risks.**

* Workspace symbols, references, rename and call hierarchy saw only the loaded projects (those of
  documents opened this session); patch 17 loads the rest in the background and before such a
  request. Even the eager design never loaded projects that own no component (such as admin/tests).
* Opening the first document of a project pays that project's load (admin/src 57 ms after
  patch 5, packages/ui 17 ms) plus tsgo's program build.
* A `.svelte` file reached only through a package import (a `node_modules` symlink with an
  `exports` entry) is not copied, as before.
* Projects are never unloaded (as before).

## 5. Project a loading project's components in parallel (`9e6c03e`)

**Problem.** A project's first document waits for all of its members to be projected, one after
another, on the main loop (admin/src: 127 ms).

**Change.** `TsgoOverlay::load` reads and projects members on up to 8 scoped threads with 64 MiB
stacks (svelte2tsx recurses over the markup; address space, not resident memory), then installs
the results in path order, so the overlay does not depend on scheduling. A panic is that
member's error (`catch_unwind`), as for the analysis worker. `open_or_update_preprocessed` is
split into a pure `project_state` and `insert_state`. Each load is logged with its size and
time (`loaded TypeScript project … (166 components) in 57 ms`).

**Measured.** admin/src load 127 → 57–59 ms, packages/ui 30–33 → 17–19 ms; zeno root first
diagnostics 181 → 143–171 ms. Test `a_parallel_load_projects_exactly_what_one_thread_does`
compares every projection (text, source map, parser error) with a sequential one.

**Risks.** Up to 8 short-lived threads per project load.

## 6. Apply watched-file events to the files they name (`3fb482b`)

**Problem.** Any watched-file event that is not a config change re-ran discovery for every
loaded project: walk its directory, read every owned component and module for imports, compare
every member with disk. Every save in the workspace blocked the main loop for 22–55 ms with only
admin/src loaded, more per loaded project.

**Change.** `TsgoOverlay::apply_file_changes`: a component the project holds is re-projected or
removed, a new component it owns joins, and a changed component or owned module has its
`.svelte` imports followed for missing copies — including a component an import named before it
existed. A batch containing an event it cannot place (a directory, an extension-less path
outside hidden and `node_modules` paths) falls back to the full refresh, decided before anything
changes.

**Measured.** zeno root with admin/src loaded: a hover right after a `README.md` or `.svelte`
event 1–5 ms instead of 22–47 ms (`watchtest.mjs`).

**Risks.** A copy that no import needs any more stays until the next full refresh or rebuild:
one extra root file, never a wrong answer.

## 7. Resolve packages from a nested project's `node_modules` (`b925b7c`)

**Problem.** Predates these patches (the baseline has it too). A nested project's cache, overlay
config and shadow tree sit under the *workspace folder's* cache, so tsgo's lookups climb the
wrong directories: a bare import from a shadow climbs from the cache and never visits the
`node_modules` of the package that owns the source, and a config's `types` and default
`typeRoots` climb from the cache too. With the editor at the zeno root every admin component
that imports a package only `admin/node_modules` installs (bits-ui, @riducms/protocol,
@internationalized/date, …) reported "Cannot find module" plus the implicit-`any` errors that
follow: 258 TypeScript errors across 193 admin files, which have none with the editor at
zeno/admin (svelte-check: 0 errors).

**Change.** `TsgoOverlay::link_node_modules` mirrors each `node_modules` directory above a member
(within the mirror root) as a symlink at the same position in the shadow tree, and each one above
the project's directory at the same position above the overlay config, so both lookups walk the
source's chain. TypeScript's `**` never matches `node_modules`, so no package becomes a root
file; the body sweep and the skeleton pruning leave the links alone; a member reached through
`node_modules` keeps a real directory instead.

**Measured.** zeno root: admin's 193 files 258 → 1 TypeScript error (the one zeno/admin also
reports); 54-file sample −36 false diagnostics, +1 deprecation hint for a package it can now
read. The programs are bigger, as they always were at zeno/admin: first diagnostics
137–155 → 188–329 ms (admin-layout), memory unchanged (205–212 MB), edits unchanged.

**Risks.** On Windows creating a directory symlink can need privileges; a failure is logged and
leaves resolution as before. (Patch 13 stops linking the mirror root's own `node_modules`, which
every lookup from the cache reaches anyway, and lets a deeper link give way to a dependency's
component; patch 19 mirrors `package.json` the same way.)

## 8. Copy an editor-open component from its buffer (`87964c9`)

**Problem** (review s8). A new import of a component that was open in the editor was never copied
into the importing project: `follow_imports` skipped every target the editor had open, and a full
refresh skipped discovered paths that were open even when the project did not hold them. Closing
the target did not help (only overlays that already hold a file are updated on close), so the
import stayed "Cannot find module".

**Change.** The overlay takes the editor's buffers (`EditorBuffers`, by canonical path) instead of
an is-open predicate. A copy of an open component is projected from its buffer and returned in
`OverlayUpdate::buffers`, which the server opens as tsgo buffers instead of persisting; on close
the copy follows the file like any other. A refresh also follows the imports of the open
documents it holds, since discovery reads files. The `paths` aliases are read once per overlay.

**Test.** `a_new_import_of_an_editor_open_component_copies_its_buffer`; s8.

## 9. Follow the imports of documents the editor has open (`5665a91`)

**Problem** (review s2, a regression from patch 6). `apply_file_changes` skipped every event for an
open document before following its imports, so a new cross-project import added in an open file
stayed unresolved after saving and reopening, until something forced a full refresh. Renames have
the same effect: tsgo's edits land in open importer buffers.

**Change.** An event for an open document skips only the re-projection and the removal; its
ownership is updated and its imports are followed, from the buffer. Like upstream (whose module
resolution reads open documents), a new import also resolves before the file is saved:
`sync_tsgo_document` asks each project holding the document whether its buffer imports a
component the project does not hold (`has_new_imports`, one lookup per `.svelte` specifier, so it
runs per keystroke) and follows those imports when it does.

**Test.** `an_editor_documents_new_import_is_followed_before_and_after_a_save`; s2 (now also
resolved while unsaved).

## 10. Bring a deleted copy back when its file returns (`55c096c`)

**Problem** (review s4, from patch 6). A copy removed by a deletion event was not recorded as wanted,
so the creation event of its restoration (undo, `git stash pop`, a branch switch) dropped it, and
importers in other projects kept "Cannot find module" for a file that exists.

**Change.** A removed copy goes into `missing`, on a deletion event and when closing the editor
document reveals the file is gone.

**Test.** `a_deleted_copy_comes_back_with_its_file`; s4.

## 11. Own a component that joins outside discovery (`3274b2b`)

**Problem** (review s3, from patch 6). `owned` was only maintained by discovery and file events, so
a component the editor opened before its file existed never counted as its project's own. The
owner-over-copy choice then tied with a copy at the same depth (admin/src and admin/tests), and
the project loaded last answered with its compiler options.

**Change.** A component that becomes an entry through `open_or_update` is recorded as owned when it
lives where the project owns files. Only new entries are checked; a load still takes the
discovered set.

**Test.** `a_component_opened_before_it_exists_is_owned_by_its_project`; s3.

## 12. Notice a deleted directory whose name has a dot (`e256abf`)

**Problem** (review, from patch 6). A deleted path counted as a directory only without an extension.
A client that reports a folder deletion as one event (VS Code) and a folder named `ui.v1` left its
components as members, bodies on disk, resolving.

**Change.** A path with members beneath it is a directory whatever its name and falls back to the
full refresh. Members are keyed by path, so the check is one ordered-map lookup.

**Test.** `deleting_a_directory_with_a_dot_in_its_name_removes_its_members`.

## 13. Serve a dependency's component opened from `node_modules` (`f4d8569`)

**Problem** (review s7, from patch 4). With a config at the workspace root, a `.svelte` file under
`node_modules` (a library component opened from a definition) got no TypeScript diagnostics, hover
or definition: the config search stops at `node_modules`, and `locate_project` then accepted only
a configless folder project. Its shadow also could not be written: patch 7's mirror link sits on
its path, and the shadow parent check refuses to write through a symlink.

**Change.** `locate_project` falls back to the folder's own project whatever its config. The mirror
root's own `node_modules` is no longer linked (the cache lives in the mirror root, so every lookup
from it ends there anyway); a deeper mirror link gave way to a real directory when a dependency's
file needed one — which broke package resolution for every member under that link, and patch 29
replaces it: dependency files are now shadowed beside the mirrored tree.

**Test.** `a_dependencys_component_belongs_to_the_folders_project`,
`a_dependencys_component_gets_a_real_shadow_directory` (now
`a_dependencys_component_is_shadowed_beside_the_mirrored_tree`); s7 now answers as the baseline does,
including the baseline's `Cannot find name 'svelteHTML'`: the shadow is not matched by the
overlay config's include (`**` never enters `node_modules`), so tsgo serves it from an inferred
project without the shims.

## 14. Give a project loaded later the editor's unsaved buffers (`1aacda5`)

**Problem** (review s1/s1b; patch 4 left it incomplete, the baseline never mirrored buffers into
copies). A project reads its copy of every component from disk when it loads, and
`sync_tsgo_document` mirrored a buffer only into copies loaded when that buffer last changed. A
project loaded afterwards saw the file instead of the unsaved document until its next keystroke:
opening an importer after editing a child, and every rebuild after a tsconfig event (2 of 6 runs,
`DocumentStore` order). The loads from component references, `willRenameFiles` and request
forwarding also skipped the JavaScript activation and preprocessing.

**Change.** Every caller goes through `Server::ensure_tsgo_project`: a project that loads has the
open components it holds re-projected from their buffers at once, and the first time a project
serves the editor its JavaScript components open (patch 16) and its members are queued for
preprocessing.

**Test.** `a_project_loaded_later_gets_the_unsaved_buffers_it_copies` (protocol, with a fake tsgo
that records its traffic); s1, s1b (6/6).

## 15. Ask the owning project about a component's attributes (`376498b`)

**Problem** (review s9, pre-existing). Component-attribute completion built its query from the first
overlay holding the document; when a project holding a copy loaded first, the answer came from the
copy's program (its aliases and options): `[]` instead of the props.

**Change.** The query uses `overlay_for_source` (owner first).

**Test.** `component_attribute_completion_asks_the_owning_project`; s9 in both orders.

## 16. Open only the JavaScript components open documents reach (`b159015`)

**Problem** (review s5, from patch 2). Activation opened every JavaScript component of a project
(markup-only components count) as a tsgo buffer, one snapshot update (~1.2 ms) each: 400 JS
components took 600–670 ms to first diagnostics instead of 150–200 ms.

**Change.** A JavaScript component needs a buffer only so tsgo parses it as JSX, and only an
editor document's view of it depends on that. `reachable_javascript` answers which JavaScript
components a set of documents reaches through `.svelte` imports among the components a project
holds, counting everything an owned plain module imports (a barrel can re-export any of them).
They are opened when a project first serves the editor, when a document opens or its `.svelte`
imports change (a fingerprint per document), and when a file event brings one in; once opened
they stay buffers for the session.

**Measured.** s5 with 400 JS components the opened file does not reach ("flat"): 601 → 127–164 ms
(the TS control: 163 ms). A chain that reaches all 400 is unchanged (every one is needed). zeno
has two JS components.

**Test.** `javascript_components_an_open_document_reaches_are_the_ones_found`; the lazy-loading
protocol test checks an unreached JS component stays on disk.

## 17. Load the remaining projects in the background (`58cfeae`)

**Problem** (round-1 e2e 4l, the documented trade-off of patch 4). `workspace/symbol` — and
references, rename, implementation and call hierarchy across projects — saw only the projects of
documents opened this session: at the zeno root a symbol search found nothing in projects no
document had touched. tsgo also unloads a project as soon as none of its files is open, so even a
loaded project dropped out once its documents closed.

**Change.**

* Startup stays lazy. Once the editor's first project has been served, no request waits on tsgo and
  the editor has been quiet for a second (`background::IDLE`), a background thread finds the
  projects that own a component (one walk, skipping `node_modules` and hidden directories, as
  discovery does: `component_projects`) and loads them one at a time on two projection threads,
  writing their bodies there. The main loop only installs the finished overlay, replays the file
  events it missed, mirrors the editor buffers it holds, and keeps it in tsgo with one buffer (a
  component it owns), followed by one `documentSymbol` request so tsgo builds the program while the
  editor is quiet. Every loaded project, the editor's included, is kept that way from then on.
* An editor document of a project being loaded waits for that load instead of racing it into the
  same cache; a rebuild or a folder change waits for the job in flight too.
* A workspace-wide request loads whatever is still missing first, so it never loses a project, also
  with the background off: `rsvelte.backgroundProjects.enable` (default `true`; Zed:
  `"lsp": { "svelte-language-server": { "settings": { "rsvelte": { "backgroundProjects": { "enable": false } } } } }`).
* Background projects are not preprocessed until a document of theirs opens, so they never start
  the Node sidecar (52 MB at the zeno root, for playground/shadcn-rhea), and pushed diagnostics for
  a keep-alive buffer are dropped. Results the owner and its copies both report
  (`workspace/symbol`, references, implementation, definitions) are deduped.

**Measured** (zeno root, `bench/allprojects.mjs`, through the lock). All 12 projects load within
about 25 s of an editor that hovers every 2.5 s, hover latency during the loads 1–3 ms;
`workspace/symbol` then answers in 2–13 ms with the baseline's results. Memory with every project
loaded: 288 MB phys_footprint / 312 MB RSS (svelte-language-server-rs 56, tsrs 232) — against 1,110 MB unpatched,
and under the ~400 MB at which the default would have been off. With the background off, the
first `workspace/symbol` loads the other 11 projects and answers in 321 ms, with the same memory
afterwards. In `bench/bench.mjs` the background finishes within the three-second pause after the
first file.

**Risks.** Every project's program stays in tsrs (the memory above, growing with the number of
projects that own components); set the option off for a repository where that is too much. A
project that owns no component still loads only when a document of it opens. tsgo builds a
background project's program in its own loop, so an editor request that arrives during that build
(after a second of quiet) waits for it, as it would for any other project's first build.

**Tests.** `the_other_projects_load_in_the_background_once_the_editor_is_quiet`,
`a_workspace_wide_request_loads_every_project_first` (protocol, fake tsgo),
`the_projects_that_own_components_are_found_in_one_walk`.

## 18. Go to a component's file from its tag, import or specifier (`938ee21`)

**Problem** (round-1 e2e 4c/4c2, pre-existing). Go-to-definition on a component tag, its import
binding or its module specifier answered `[]`: tsgo resolves the first two to the generated
default export of the child's shadow (`const X__SvelteComponent_ = …`) and the specifier to the
empty range at the top of the shadow, and the mapper drops a range no source maps to.

**Change.** As upstream (`convertToLocationForReferenceOrDefinition`, `mapUnmappedToTheStartOfFile`:
line 0, character 1), a definition, typeDefinition or implementation location whose start in a
component's shadow maps to nothing lands at the start of the component's file; one that starts in
generated code (`isInGeneratedCode`, an `Ωignore` region) is still dropped. It works for an open
and a closed child alike. tsgo answers typeDefinition on a component with svelte's `Component`
type and implementation with nothing; both are mapped as before.

**Test.** `a_definition_of_the_component_itself_lands_at_the_start_of_its_file`; s11 (real tsrs,
child closed and open); e2e 4c/4c2 pass.

## 19. Resolve `package.json` imports (`#lib/*`) from shadows (`6ff0395`)

**Problem** (round-1 e2e 1.dialog/5a, pre-existing). A `#` specifier resolves against the
importing file's package scope, and a shadow's nearest `package.json` is the workspace root's,
which has no `"imports"`. Every component importing `#lib/…` reported "Cannot find module" plus the
implicit-any errors that follow: packages/ui `confirmation-dialog.svelte` had a false TS2307 where
svelte-check reports 0 errors, and the 40 zeno components that use subpath imports (packages/ui
and the plugins) had 209 such diagnostics.

**Change.** Mirroring `package.json` into the shadow tree (as `node_modules` is) gives a shadow the
source's package scope, its `"type"` too, but a target then resolves inside the shadow tree, where
only components have shadows: `#lib/button.svelte` resolves, `#lib/utils.js` (a module beside them)
does not. So each package scope is mirrored as a symlink, and its `"imports"` also become `paths`
in the overlay config, which TypeScript tries before the package scope: the source target first and
its shadow-tree twin second, as for the project's own `paths`, with conditions resolved as
TypeScript resolves them (`types`, `import`, `default`, `customConditions`); package targets and
multi-wildcard patterns are left alone. The scopes are those of the components the project holds
and of the project itself; a pattern two of them map differently keeps the project's own mapping,
or none. A `package.json` change rewrites the configs and tells tsgo when one changed.

**Measured.** The 40 zeno components with subpath imports: 209 TypeScript diagnostics (123 TS2307)
→ 1 (a deprecation hint for lexical's `$getNodeByKey`, which is real). `confirmation-dialog.svelte`
has none.

**Risks.** `paths` apply to every file of the program, while `"imports"` are scoped per package: a
file of another package in the program whose own `#x` maps elsewhere would resolve to this
project's target if that target exists (it falls back to its own scope otherwise). The third review
showed it for copied components (`hashscope.mjs`); patch 46 respells their specifiers, plain modules
of other packages keep the risk.

**Tests.** `package_imports_resolve_from_shadows_as_from_their_sources`,
`a_package_import_two_scopes_map_differently_keeps_the_projects_own`; s10.

## 20. Probe a component's attributes in the shadow's own buffer (`1880dd8`)

**Problem** (round-1 follow-up). Component-attribute completion (`<Child |`) asked tsgo through a probe
document beside the shadow (`<shadow>.rsvelte-component-info.tsx`). It matches the include, so tsgo
took it for a new root file: a full program build to open it and another, paid by the editor's next
request, to close it — and tsrs keeps memory from every full build. A dot-named probe the include
does not match would land in an inferred project, without the project's options.

**Change.** The probe is the shadow's own text with the component expression replaced, so it has the
shadow's imports: swapping it into the shadow's buffer (`ComponentInfoQuery::in_place`) and back is
a content change, for which tsgo reuses the program. The query ends with the shadow's own text and
version put back, also on a cancellation or a crash. While the probe is in, nothing else may read
the shadow: editor requests, tsgo forwards and diagnostic pulls are held (`Deferred`) and replayed
once it is out, and an edit or close of the document ends the query at once, answered without the
component's members. A JavaScript shadow keeps the separate TypeScript probe document.

**Measured** (zeno, `bench/probe.mjs`, 20 completions at `<AdminNavigation |`, background off):
completion 33–41 → 13–15 ms, the next request 23–32 → 1–2 ms, process-tree memory growth over the
20 completions 160 → 24 MB.

**Risks.** Requests held during a probe (tens of milliseconds) are answered that much later. As
first written, an edit that ended the probe was applied before the held requests were replayed,
and the shadow's own text was not put back first; patch 27 fixes both.

**Tests.** `an_in_place_query_swaps_the_probe_into_the_shadow_and_back`,
`component_attribute_completion_probes_in_the_shadow_and_holds_other_requests`.

## 21. Register a tsgo file watcher only when it adds an event (`2c6a9f7`)

**Problem** (round-1 e2e). tsgo registers file watchers per program as each project builds: the
workspace (`<root>/**/*`) and, for auto-imports, every `node_modules` a project resolves from, the
cache's mirror links among them; it replaces its auto-import watchers by unregistering and
registering the same patterns. With lazy loading each load registered more: 20 registrations
against the baseline's 11, plus 4 unregistrations.

**Change.** `TsgoWatchers` keeps tsgo's watcher registrations. One whose every watcher lies under a
watcher the editor already has for every kind of change (`<dir>/**/*`), or repeats one exactly, is
answered here and kept; the editor gets it only if what covered it goes away (the widest first).
Other registrations pass through, and a restarted tsgo's old watchers are unregistered first.

**Measured** (zeno root, four documents in two projects): 13 registrations and 3 unregistrations →
4 and 0 (ours, tsgo's configuration, `<root>/**/*`, tsrs's own install), the same 4 with all 12
projects loaded. The round-1 e2e session: 4 registrations, against 11 on the baseline and 20 (and
4 unregistrations) after patches 1–7.

**Regression** (second review). Holding the `node_modules` watchers kept Zed from ever reporting a
package install or update: patches 26 and 30 forward them again, on the real directories.

**Tests.** `a_watcher_below_a_recursive_one_stays_with_the_server`,
`only_a_watcher_of_every_kind_and_everything_beneath_covers`.

## 22. Recover a program from a script that does not parse yet (`f81f3c0`)

**Problem** (round-1 e2e 4g, also on the baseline). oxc discards the AST on a fatal error, so a
half-typed instance script lost every script transform: its imports stayed inside `$$render()`,
where TypeScript resolves none of them, and props, exports and store subscriptions disappeared.
Typing `runtime.` before `</script>` gave no completions and a TS2307 on every import; the official
svelte2tsx, on TypeScript's error-tolerant parser, keeps all of them.

**Change** (`rsvelte_projection`, `svelte2tsx/script/recovery.rs`). Recovery edits a copy of the
script, always in place, until oxc accepts it, so spans still address the original text and
MagicString still emits the author's bytes:

* a missing statement terminator becomes a line break, except after `name.` followed by a line
  that starts a statement, which TypeScript reads as a missing name;
* a missing member name or operand (`a.`, `a?.`, `x =`, `{ k: }`) and a bracket left open at the end
  (`foo(`, `$props(`) are written into the adjacent whitespace, where TypeScript puts its missing
  node; a fill is kept only if the parser gets further;
* an import still being typed (`import { a }`, `import x from './pa`) is respelled `import"…"`, so
  it is hoisted like the official one;
* a bracket that swallowed complete code after it, an unterminated string, and otherwise the token
  before the failure (or a stray token after complete code) are blanked;
* repairs that do not converge cut the script at the first failing line, then at its outermost open
  bracket, closing what is still open.

**Measured** (by the projection engineer). All 4,744 zeno `.svelte` files project byte-identically
(code, source map, exact mappings, facts). Of 46 hand-made incomplete states, 10 matched official
svelte2tsx 0.7.61 before and 41 after; the other 5 differ in whitespace or are better than official.
708,719 mutations of zeno instance scripts: no panic, 0.41 ms per projection on average. zeno e2e
4g: 0 → 50 completions; while typing, 13 TS2307 + 2 TS7006 → the parse error and TS1003 at the
cursor. A 125 KB pathological script adds 2–7 ms to its 100 ms projection. Typing benchmark above:
completions at the two dot keystrokes, and 6–8 ms instead of 24–32 ms there.

**Risks.** 99 of the 708,719 mutations (a multi-line generic `<…>` left open) still lose their
imports, as before: `<…>` is not tracked as a bracket because it is ambiguous with comparisons.
The third review found that a hoisted declaration recovery repaired (`import {`, `type T = {`) stays
open in its hoisted copy and swallows the render header: syntax errors on `<script` (dropped by
patch 43) and lost prop errors (fixed by patch 48).

**Tests.** `crates/rsvelte_projection/tests/svelte2tsx_incomplete_script.rs` (11, expected output
from official svelte2tsx 0.7.61; 10 fail without the fix), 15 unit tests in `recovery.rs`;
`tests/regressions/incomplete-edits.mjs` (steps member, call, initializer, import).

## 23. Close blocks and components that loose parsing left open (`c662f2b`)

**Problem.** The language server projects in loose mode, which ends a block or component whose
closing tag is not typed yet where the template, or an enclosing element, ends. The projection opened
a scope for it and never closed it (every handler only turned an existing `{/if}`, `{/key}`,
`{/snippet}`, `{/await}` or `</Name>` into its closer). The open `{` swallowed the rest of
`$$render()`, so while `{#if a}` or `<Child>` was being typed the component lost its default export
and every importer its type (at `b925b7c` a parent reported TS2306 "not a module").

**Change.** `close_block` turns a block's closing tag into its closer, or appends the closer at the
block's end when there is none, as upstream's `isImplicitlyClosedBlock` branches do; it serves
`{#if}`/`{:else}`, `{#key}`, `{#snippet}` and every `{#await}` form. A component without `</Name>` no
longer takes its last child's closing tag as its own, and for components and elements a closing tag
that starts before the last child ends belongs to that child.

**Measured.** zeno: 4,744 files byte-identical. Removing one closing block or component tag at a
time across zeno (6,718 cases): 4,986 projections had unbalanced braces before, 4 after (one file,
where the brace counter is unreliable), no panics. On 7 hand-made cases official svelte2tsx throws or
leaves a brace open; these are balanced.

**Tests.** `crates/rsvelte_projection/tests/svelte2tsx_implicitly_closed_blocks.rs` (12; the
`{#if}` and `{#each}` cases match official 0.7.61 byte for byte; 10 of the original 11 fail without
the fix); incomplete-edits step childBlockOpen.

## 24. Backtrack to an opening tag read as an attribute in loose mode (`d057a1b`)

**Problem.** An opening tag being typed above existing markup (`<div class="x"` before
`<p>{a}</p>`, `<Child foo={a}` before an element) read the next opening tag as one of its
attributes, so the next closing tag closed nothing that was open: the loose parse failed with
`element_invalid_closing_tag` and the server fell back to a script-only snapshot, with no template
diagnostics, hover or completions.

**Change** (`rsvelte_core` parser). Port of upstream's loose backtrack (element.js): drop the `<name`
attribute, end the unfinished element where it starts, and read the tag again as its sibling. The
children read past it, and their warnings, are discarded (upstream keeps them, so they belong to two
elements). Strict parsing is unchanged.

**Measured.** 7 unfinished-opening-tag states now all project (before: 6 errors; official
svelte2tsx projects 4). On 12 loose inputs the AST shapes match Svelte 5.56.8's apart from the
deliberately dropped duplicate children, one input both reject, and one pre-existing off-by-one end.

**Tests.** `crates/rsvelte_core/tests/loose_opening_tag_read_as_attribute.rs` (6, shapes from
Svelte 5.56.8 `parse(…, { loose: true })`; 4 fail without the fix),
`crates/rsvelte_projection/tests/svelte2tsx_unfinished_opening_tag.rs` (3); incomplete-edits step
openingTag.

## 25. Pop a block that loose parsing closed before an element's end (`1ed0172`)

**Problem.** A block implicitly closed by an enclosing element's closing tag
(`{#if a}<div>{#if b}x</div>{:else}…{/if}`) kept its parser-stack entry, so the element popped the
wrong entry and the outer `{:else}` failed with `block_invalid_continuation_placement`: deleting one
`{/if}` or `{/each}` above such a continuation failed the whole loose parse.

**Change** (`rsvelte_core` parser). `pop_block_entry` pops the entry when the block found its close
or, in loose mode, ended before the end of the input; only a block the input ends inside stays on
the stack. Used by `{#if}`, both `{#each}` forms, `{#await}`, `{#key}` and `{#snippet}`.

**Measured.** Every third closing tag removed from zeno's 166 admin/src components (814 documents),
loose AST shapes against Svelte 5.56.8: rsvelte-only rejections 20 → 0 (18 now match exactly, 2
differ by the pre-existing off-by-one end). All of zeno (6,718 removals): loose-parse failures 455 →
146; in the admin sample every remaining failure is also an upstream failure.

**Tests.** `crates/rsvelte_core/tests/loose_block_closed_by_an_element.rs` (4, shapes from Svelte
5.56.8; 3 fail without the fix), `a_block_closed_by_its_element_before_an_outer_else` in
`svelte2tsx_implicitly_closed_blocks.rs`.

## 26. Let the editor watch `node_modules` for tsgo again (`69d9a1d`)

**Problem** (second review, from patch 21). Patch 21 held back every tsgo watcher below a recursive
one the editor already has, `<root>/node_modules/**/*` (tsgo's auto-import watcher) under
`<root>/**/*` among them. Zed scans a gitignored directory such as `node_modules` only when a
registered watcher's literal prefix points into it (`lsp_store.rs` `add_path_prefix_to_scan`,
`worktree.rs` `should_scan_directory`), and drops the events of a directory it has not scanned
("ignoring event … within unloaded directory"). So Zed never reported a `node_modules` change: a
package installed after its import failed stayed "Cannot find module", and a dependency whose
declarations changed kept its old types, until the server restarted (`r6b-install.mjs`,
`r6d-update.mjs` in the review). The baseline forwards the watcher.

**Change.** A recursive watcher no longer covers one whose literal base, relative to it, enters a
`node_modules` or a dot directory: those registrations reach the editor. An exact repeat of a
pattern the editor already has, and an ordinary directory below `<root>/**/*`, are still held.
(Patch 30 then puts the cache's mirror-link watchers on the directories they point at.)

**Measured.** `r6-watchers.mjs`: the editor watches `<root>/node_modules/**/*` again (before: only
tsrs's own install). zeno root: see patch 30.

**Tests.** `a_watcher_into_node_modules_or_a_dot_directory_reaches_the_editor` (the root's
`node_modules` watcher was held before); `a_watcher_below_a_recursive_one_stays_with_the_server`
now holds ordinary directories; `tests/regressions/r6-watchers.mjs`.

## 27. End a probe before an edit, not after it (`02e6b31`)

**Problem** (second review, from patch 20). Patch 20 holds every request that arrives while a
component-attribute probe sits in a shadow's buffer — 13–40 ms, exactly while the user keeps typing
after `<Child `. A later `didChange` or `didClose` ended the probe only from `sync_tsgo_document`,
after the new text was already in the server's documents, so the held requests were replayed
against a newer version than the editor asked about: a formatting request sent at version v
answered with an edit for v+1 (`0:0-8:0` with the inserted `<!-- top -->`), which Zed — it applies
an answer's edits to the version it requested — would apply on top of the inserted line. The replay
also never put the shadow's own text back, so a replayed tsgo request was answered while the
buffer still held the probe (`r2c-format.mjs`).

**Change.** A `didChange` or `didClose` of any document now ends every in-place probe before it
touches any state: the shadow's own text and version go back to tsgo (`ComponentInfoQuery::restore`),
the probe's outstanding tsgo requests are cancelled, the completion is answered with what tsgo
offered without the component's members, and the held requests are replayed; then the change
applies. A replayed completion that starts a probe of its own is ended as well, until none is left.
`end_probe_in` (documents re-synced after a rebuild) restores the shadow too.

**Measured.** `r2c-format.mjs`: the formatting reply sent during the probe is the edit for its own
version (`0:0-7:0`, as a fresh session formats it).

**Risks.** A completion whose probe an edit ends has no component attributes, as before; the
editor asks again after the edit.

**Tests.** `an_edit_during_a_probe_answers_the_held_requests_against_the_text_before_it` (fake
tsgo: a probe, then a held formatting request, a references request and a hover, then an edit; it
fails without the fix with the edit for v+1, and checks that tsgo hears the restored text before
the held request and the edit after it); `tests/regressions/r2c-format.mjs`.

## 28. Send a request's tsgo half before a later edit (`c9a889a`)

**Problem** (second review, `r2d-hover.mjs`; the race is on the baseline too). Most requests take
the native worker's answer first and go to tsgo only when it has none: a hover in the script, a
completion, code actions, code lenses, document symbols, folding ranges, a diagnostic pull. The main
loop takes the next editor message and the worker's answer in either order, so an edit that arrived
right after such a request was often applied before the request reached tsgo, and tsgo answered it
for the next version at the old position: a hover on `{later}` described the symbol on the line
below. A request a probe held hit this every time, since its replay ran just before the edit (patch
27 alone left r2d failing); without a probe, a hover followed at once by an edit that inserts a line
was wrong in 15 of 20 rounds (`r2e-hover-edit-race.mjs`; the baseline, 11 of 20).

**Change.** Before a `didChange` or `didClose` applies, the server takes the worker's pending answers
for requests that ask tsgo next and sends their tsgo halves, waiting at most 250 ms (the worker
answers in about a millisecond). Requests the worker answers on its own carry their own snapshot of
the text and are not waited for.

**Measured.** `r2d-hover.mjs` at 5, 12, 20 and 30 ms: `later` and `other`, as without the edit
(before: `Child` and `later`); `r2e-hover-edit-race.mjs`: 0 of 20 wrong. Typing benchmark below:
unchanged.

**Risks.** An edit can wait for the worker to finish a slower job queued before the pending request
(a large document's native diagnostics), at most 250 ms; the request would have waited as long. A
tsgo answer is still mapped back with the projection current when it arrives, so a hover's range for
the previous version can be off by the edit while its contents are right (follow-ups).

**Tests.** `a_request_sent_before_an_edit_reaches_tsgo_before_it` (four hovers, then an edit, five
rounds; fails without the wait), the held hover in patch 27's test; `r2d-hover.mjs`,
`r2e-hover-edit-race.mjs`.

**Regression** (third review). In a large component the wait covered a diagnostic pull's full lint,
so every keystroke waited for the previous one's analysis; patch 41 sends a pull's tsgo half at once
and keeps the wait only for completion and hover, on a lane no analysis blocks.

## 29. Shadow a dependency's file beside the mirrored tree (`8b896ba`)

**Problem** (second review, from patch 13). Patch 13 shadowed a component opened from a nested
`node_modules` (`app/node_modules/dep/Comp.svelte`, reached from a definition) at its own position in
the shadow tree, inside the `app/node_modules` mirror link: `ensure_shadow_parent` deleted the link
to create a real directory, and `link_node_modules` then refused to put it back while any shadow sat
under it. Every member under `app` lost package resolution ("Cannot find module 'dep'") for the rest
of the session, also after the file was closed (`r1-depkill.mjs`, `r1b-close.mjs`). zeno is not
affected (no root tsconfig, so its folder project holds no members); a monorepo with one root
tsconfig and per-package `node_modules` is. Opening a plain `.d.ts` or `.js` from such a
`node_modules` did the same.

**Change.** A file under any `node_modules`, a component or a plain buffer, is shadowed in
`<cache>/dependencies/<relative path>`: no include matches it (tsgo serves it from an inferred
project, as before) and no mirror link covers it. `ensure_shadow_parent` no longer removes links;
`link_node_modules` ignores dependency entries and replaces a real directory an earlier server left
where a link belongs (only after checking that no link leads to it, so a user's own `node_modules`
is never touched). Dependency bodies are swept like the others and are not reported as unresolvable
routes.

**Measured.** `r1-depkill.mjs`, both orders: App keeps `2:2322` (dep resolves) with the dependency's
component open and after an import-set edit, and `tsgo/svelte/app/node_modules` stays a link
(before: `1:2307 Cannot find module 'dep'`, and a real directory). `r1b-close.mjs`: the same after
closing it. s7 (a component from the root's own `node_modules`) answers as before.

**Tests.** `a_dependencys_component_is_shadowed_beside_the_mirrored_tree` (replaces
`a_dependencys_component_gets_a_real_shadow_directory`: the link survives opening a root and a
nested dependency's component and a plain module from it; bodies are removed and swept),
`a_real_directory_an_earlier_server_left_where_a_link_belongs_is_replaced`; `r1-depkill.mjs`,
`r1b-close.mjs`.

## 30. Watch the package directory a mirror link points at (`6fbb3d5`)

**Problem** (follows patch 26). With patch 26 the watchers tsgo registers for the cache's mirror
links reach the editor too (`.svelte-language-server-rs/projects/admin/node_modules/**/*`, and the same directory
again under that project's shadow tree): 22 registrations at the zeno root, two per project. Zed
scans a symlinked directory inside the worktree as a second copy, and reports a change under its
real path (`admin/node_modules/…`), which matches no registered glob and is dropped as long as the
real directory is unscanned: those watchers cost a second scan of every nested `node_modules` and
still delivered no event for a `bun add` in a nested package.

**Change.** A watcher whose literal base is a mirror link in the cache is registered on the
directory the link points at. The editor scans each package directory once and reports its changes
under their real paths, which tsgo also takes for the link's (`r6e-nested-install.mjs`: a package
installed into `app/node_modules` after its import failed resolves on the next keystroke when the
editor reports the real paths, and not without events); another project's link to the same directory
is an exact repeat, held here. A cache directory that is not a link is forwarded as it is.

**Measured** (zeno root, two documents in two projects, then 30 s for the background): 12
registrations — ours, tsgo's configuration, `<root>/**/*`, tsrs's install, and `node_modules` of
the root, admin, packages/ui, packages/plugin, plugin-graphql, plugin-richtext, plugin-seo and
tests/contracts/editor_app — and no unregistrations (patch 26 alone: 22 and 3; patch 21: 4;
baseline: 11). When tsgo replaces its auto-import watchers (it unregisters them, then registers the
same patterns) the editor sees that too: 15 and 3 in one e2e session.

**Tests.** `a_watcher_into_a_mirror_link_watches_the_directory_it_points_at`;
`tests/regressions/r6e-nested-install.mjs`.

## 31. Do not count the editor's answers as activity (`42d8d9e`)

**Problem** (follows patches 26 and 30). The background loads the remaining projects once the editor
has been quiet for a second (patch 17), and every message from the editor reset that clock,
including its answers to the server's own requests. With tsgo's `node_modules` watcher
registrations reaching the editor again — one per package directory, made as each background
project builds — each load drew an answer that postponed the next: at the zeno root fewer projects
had loaded when the typing benchmark started typing (283 MB before typing, against 315 MB at
`8b7902f`).

**Change.** Only the editor's requests and notifications count as activity.

**Measured.** Typing benchmark: 314–315 MB before typing again, as at `8b7902f`; completions
unchanged (below).

**Tests.** `the_editors_answers_do_not_hold_the_background_back` (a client that answers every 200 ms;
the other projects never load without the fix).

## 32–40. Projection panics (second review)

The server projects a component on its main loop, on every keystroke, and before patch 35 only the
parallel project load (patch 5) caught a projection panic: any other one ended the whole server, and
Zed showed no Svelte features until it restarted it. The review found the crash with a no-break space
(Option+Space on a Mac) typed into `$props(`, and its fuzzing saved 240 panicking inputs (239
distinct; the `found-*`, `sfound-*` and `real/` sets, of which `allpanics` is a 165-file subset), many
panicking on the baseline too. Patch 35 makes
any projection panic survivable; the others remove the panics. Except where stated, the output equals
official svelte2tsx 0.7.61's, and all 4,744 `.svelte` files under zeno project byte-identically
(code, source map, exact mappings, facts) against `8b7902f` after every commit.

### 32. Read `{:then }` as a branch without a binding in loose mode (`0475b1f`)

**Problem.** Typing `{:then value}` with Zed's auto-closed `{` passes through `{:then }`; loose
parsing trimmed the empty pattern to end before it started, and `read_block_pattern` panicked
("byte range starts at X but ends at X-1", `tag.rs`). `{:catch }` too.

**Change** (`rsvelte_core`). An empty pattern is no binding, as `{:then}` is; strict parsing still
rejects it. Official's loose parser rejects the state (script-only snapshot); rsvelte keeps the
template, projecting exactly what official gives for `{:then}` / `{:catch}`.

**Tests.** `crates/rsvelte_core/tests/loose_await_branch_without_a_binding.rs`;
`svelte2tsx_half_typed_block_headers.rs` (every keystroke of `{:then value}`, `{:catch error}`,
`{#await p then value}` with an auto-closed brace).

### 33. Project `{#each items as }` as an each block without a context (`4421ca4`)

**Problem.** `{#each items as }` has an empty, zero-width context, and relocating it in front of the
collection made `MagicString::move_range` panic ("start must be < end"). With an index typed first
(`{#each items as , i}`) the header would have read `for(let  of …)`.

**Change.** An empty context is projected as no context (official's `{#each items}`:
`for(let $$each_item of __sveltets_2_ensureArray(items)){$$each_item;`), and the relocation requires
a non-empty range. Official rejects this state outright.

**Tests.** `svelte2tsx_half_typed_block_headers.rs` (`an_each_block_with_nothing_typed_after_as`,
`an_each_block_with_an_index_but_no_context`, every keystroke of an each block; 3 fail without it).

### 34. Read `$bindable(…)` in an exported props destructure from the script (`c1933b5`)

**Problem.** `export let { a = $bindable(1) } = $props()` (a state passed through while converting a
component) went through the export path, which handed the props extraction an empty script text;
reading the `$bindable` argument panicked (`props_rune.rs:620`).

**Change.** The export path passes the script text, and the argument is read with a checked slice.

**Tests.** `svelte2tsx_exported_props_bindable.rs` (also every keystroke of `$bindable(value)` in
TypeScript and JavaScript components; 2 fail without it).

### 35. Keep serving when a component's projection panics (`77ef466`)

**Problem.** See above; the baseline has the same exposure.

**Change** (`rsvelte_language_server`). `TsgoOverlay::project_state` runs svelte2tsx inside
`catch_unwind`. A panic is a rejected document: the shadow of this version is its script, mapped
back by a constant shift, as upstream's `DocumentSnapshot` keeps for a parser error, so imports and
script completions keep working and the next keystroke projects normally; the panic message is logged
(`svelte2tsx panicked: …`) and `parser_error` is set. `open_or_update_preprocessed` also catches a
panic in the source-map composition around it and returns `TsgoOverlayError::Projection`, which keeps
the previous shadow. It needs an unwinding binary: the svelte-language-server-rs workspace's `release` profile sets
`panic = "unwind"` (rsvelte's own `release` aborts; its `dist-lsp` unwinds).

**Tests.** `tsgo_overlay::tests::a_projection_panic_falls_back_to_the_script_of_the_same_version`
(a test-only marker makes svelte2tsx panic); `robustness.rs`
`keystroke_states_that_panicked_the_projection_keep_the_server_answering` (each former panic state
through `didChange`, then hover, against a fake tsgo; on baseline sources the server dies at
`magic_string.rs:1275`, with this commit alone it answers); `tests/regressions/r5-crash.mjs`.

### 36. Never write a recovery fill into a blanked multibyte character (`5d7aee0`)

**Problem** (the review's crash). Script recovery (patch 22) blanks a token it cannot use to spaces,
byte for byte, and writes a missing name, operand or closer into whitespace. A no-break space or
U+3000 after `$props(` or `=` was blanked to two or three spaces and the closer written into the
second, so a program span ended inside the author's character (`magic_string.rs:890`, 30 of the
review's script-fuzz panics).

**Change.** A fill, and a closer written by the tail cut, goes only where the original byte is ASCII;
a construct with no such room is blanked, as when nothing follows it. `let { b } = $props(\u{a0}\n`
now recovers to `$props(\u{a0})`.

**Tests.** `recovery::tests::nothing_is_written_into_a_blanked_multibyte_character`;
`svelte2tsx_incomplete_script.rs` `multibyte_whitespace_in_an_unfinished_construct`.

### 37. Drop a whole character after a component's tag name (`eeab3f3`)

**Problem.** Upstream extends the deletion after a component's tag name, and every kept range of
the opening tag, by one UTF-16 unit; the port added one byte. After a no-break space or U+2028 the
deletion ended inside the character ("end byte index … is not a char boundary"): `<Child\n\u{a0}foo`,
`<Child \u{2028}}`. These were the review's remaining template panics (12, all on the baseline too).

**Change.** The deletion, `opener_spacing::count_gaps` and `closing_tag_spacing` step over whole
characters; output and source-map columns match official for 8 of 9 multibyte-in-tag probes.

**Not covered.** `<Child\u{a0}a={1} />`: upstream takes any `/\s/` character directly after the tag
name as the whitespace to delete, rsvelte only ASCII whitespace. Only the generated whitespace differs
(`{   {` against `{ {`); no panic, mappings intact.

**Tests.** `svelte2tsx_tag_name_whitespace_map_4650.rs` (`a_multibyte_character_is_swallowed_whole`,
official's columns; `an_unfinished_tag_followed_by_a_multibyte_space`, official's output).

### 38. Project `{#await }` without relocating an empty promise (`870675d`)

**Problem** (found by the projection engineer's fuzzing, the only panic in 750k mutants of its first
campaign). `{#await }` above a pending block: relocating the empty promise to the `{:then}` boundary
panicked in `move_range`.

**Change.** An empty promise takes the existing baked path (`await ()`), which TypeScript reads as a
missing expression.

**Tests.** `svelte2tsx_half_typed_block_headers.rs` (`an_await_block_with_nothing_typed_after_await`,
every keystroke of an await block with an auto-closed brace).

### 39. Find a binding's assertion keyword without slicing inside a character (`411ce82`)

**Problem** (fuzzing; a valid component). `bind:value={e as né}`: the scan for the last top-level
` as ` / ` satisfies ` sliced `&source[j..j+2]` inside the character (`expr.rs:195`), and took a type
named `asé` for the keyword.

**Change.** The keyword is compared as bytes, and a non-ASCII byte belongs to an identifier.

**Tests.** `svelte2tsx_binding_ts_assertion.rs` `an_assertion_to_a_type_with_a_non_ascii_name`.

### 40. End a script's content at a closing tag after its start (`c822c10`)

**Problem** (fuzzing). In an unclosed `<script a="</script>"/`, the content's end was searched from
the tag's start and found inside the attribute, before the content began (`script/mod.rs:523`).

**Change.** `nodes::scripts::script_content_end` searches only after the content starts; the script
transform and `find_instance_imports` share it.

**Tests.** `svelte2tsx_unfinished_opening_tag.rs` `a_script_tag_with_its_closing_tag_in_an_attribute`.

**Measured, 32–40** (projection engineer, on `c822c10`). All 240 saved panic inputs project without
a panic. Fresh fuzzing, about 3.4M mutants of zeno's 625 seed components in template and script mode
(with keystroke inserts such as `{#if }`, `{#each xs as }`, `{:then }`, `{@render s(`, NBSP and
`Café`), found the 3 panics fixed in 38–40; the final campaign of 1,125,000 mutants found none (max
72 ms per projection). Integration results on the merge are under Results.

## 41–46. Third review, language server

The third review (`tests/review3/`) found a typing regression from patch 28, a lost-request stall in
the background loading, a panic that cost a document its native diagnostics while a `<style>` was
being typed, syntax errors shown on `<script`, and wrong `#lib` types in copies. 41–46 answer them in
`crates/rsvelte_language_server`; the projection items of the same review (closing a recovered
declaration in its hoisted copy, `find_orphan_scripts`) are 47–49.

### 41. Never make an edit wait for a document's analysis (`fd0d609`)

**Problem** (review 3, major; from patch 28). Patch 28 made every `didChange` wait, up to 250 ms, for
the native half of each request that asks tsgo next, a diagnostic pull among them. A pull's native
half is a full lint of the component (60–110 ms at 1,400–2,100 lines) and the worker ran its jobs in
order, so while typing in a large component each keystroke waited for the previous keystroke's
analysis, and completions queued behind it (`bigtype.mjs`, 2,113 lines: completion p50 644–818 ms,
against 230–246 ms at `02e6b31`, patch 27).

**Change.**

* Requests whose tsgo half is sent whatever the worker finds (diagnostic pulls, code actions, code
  lenses, folding ranges, document symbols) send it when they arrive, while the worker computes the
  native half; whichever half comes back first waits for the other (`Join`, in `respond`), and the
  answer merges them as before (the worker's items first, the worker's answer alone when tsgo
  failed). An edit never waits for them, and tsgo still hears each before the edit after it. Only
  completion and hover, whose native jobs take about a millisecond and whose tsgo half depends on
  them, keep patch 28's wait.
* The worker runs two lanes, each a thread with its own caches: whole-document lints (pushed and
  pulled diagnostics, code actions) and the workspace walk for file references on one, everything
  the editor waits on while typing on the other, so a completion never queues behind an analysis.
* An analysis that a newer one of the same document already waits behind is not run: a stale pull
  is answered with the newer pull's result (Zed applies a pull's answer to its current buffer), a
  stale pushed lint is dropped.

**Measured.** See Results (round 4): `bigtype.mjs` at 1,000/1,500/2,000 against `02e6b31`, and the
zeno typing benchmark.

**Risks.** tsgo now computes a pull's diagnostics while the native lint runs, so a burst of pulls
reaches tsgo at once rather than spaced by the lints; tsgo answers them in order. A stale pull's
native diagnostics are the newer text's.

**Tests.** `an_edit_after_a_diagnostic_pull_waits_for_neither_of_its_halves` (robustness: a hover
sent after the edit is answered before the pull's analysis of a large component is done, the
answer merges the worker's diagnostics, and tsgo hears the pull before the edit; fails without the
fix), `worker::tests::a_completion_does_not_wait_for_the_analysis_of_a_large_component`,
`worker::tests::a_pull_a_later_pull_of_its_document_follows_gets_that_ones_result` (both fail on the
single-lane worker); `r2d-hover`, `r2e-hover-edit-race` and `tests/regressions/bigtype.mjs`.

### 42. Read a style block without its closing tag to the end (`3ff6b32`)

**Problem** (review 3). `css::diagnostics` stepped eight bytes past each `<style>` block's end to look
for the next one; a block whose `</style>` is not typed yet ends at the end of the document, so the
next search sliced past the text and panicked. The worker's guard caught it and the document lost
every native diagnostic (compiler, lint, CSS) while a style block was being typed
(`style-open.mjs`).

**Change.** The scan stops at a block that runs to the end, and otherwise resumes right after
`</style`.

**Measured.** `style-open.mjs`: with the block open, the compiler's "Expected token </style" and the
unknown property are reported, no panic (before: tsgo's error only, 8 panics in the log).

**Tests.** `css::tests::a_style_block_without_its_closing_tag_is_read_to_the_end` (panics without
the fix); `tests/regressions/style-open.mjs`.

### 43. Drop syntax errors that map into a script's opening tag (`5728ed0`)

**Problem** (review 3, from patch 22). The shadow overwrites the `<script …>` tag with the render
function's header (`;type $$ComponentProps = …;function $$render() {`), whose one mapping segment
points at the tag (0:1, on `script`). When a half-typed statement hoisted above the header leaves a
bracket open (`import {`, `import { x`, `import type {`, `type T = {`), TypeScript reads the header
as part of it and reports syntax errors there: 18 diagnostics at 0:1 over `recover-pos.mjs`'s 377
states; the baseline and the official server have none.

**Change.** A TypeScript syntax error (1xxx) whose range starts in a script's opening tag is dropped:
no script text is there, and the author's own error is reported where it was typed. The review
suggested the guard in `map_generated_position` (no position for a generated line without a source
segment before it), but the header's segment is the same in a well-formed shadow, where a semantic
error in the props type the header copies (`{ title: Foo }`: TS2304, which the projection does not
map to the annotation) lands at 0:1 too and is the author's: a position guard would hide it, so
semantic errors there are kept. Closing the hoisted copy, which brings back the template's prop
errors in those states, is patch 48.

**Measured.** `start-of-file2.mjs`: `import {` reports only `3:8 1003` (before: four more at 0:1),
`type T = {` loses its two 1131 at 0:1 (with 48–49 merged no state has a diagnostic there).

**Tests.** `server::diagnostic_message_tests::syntax_errors_in_a_script_opening_tag_are_dropped`;
`tests/regressions/start-of-file2.mjs`.

### 44. Answer a request tsgo never answers, and do not let it hold the background (`8a5c611`)

**Problem** (review 3). tsrs sometimes never answers a forwarded request (`lsfuzz.mjs` seeds 22 and
38 with `THIRD=1 NO_WS=1 INIT_SLEEP=600 LONG_SLEEP=700 CANCEL=1`: a signatureHelp and a completion;
the tsrs traffic shows each received and never handled). The editor's request was never answered,
and since the background loads projects only when no editor request waits on tsgo (patch 17), no
other project loaded for the rest of the session.

**Change.** The tsgo runtime notes when each request goes out (`TsgoRuntime::forward`) and forgets
it when tsgo answers. The background treats an editor request tsgo has not answered in 2 s as lost.
A request still unanswered after 30 s (`RSVELTE_TSGO_REQUEST_TIMEOUT_MS`) is answered as if tsgo had
answered `null`: an editor request gets its native fallback or the empty answer, pushed diagnostics
their native half, a component query goes on without that member, the background's warm-up is
cleared; tsgo is asked to cancel it.

**Tests.** `a_request_tsgo_never_answers_is_answered_without_it_and_holds_nothing_back` (a fake tsgo
that ignores signatureHelp; fails without the fix: the background never loads the other projects).

### 45. Restart tsgo when a request about a document never finishes (`edc03b7`)

**Problem** (found while minimizing 44). tsrs does not lose those requests: it loops on them for
good, one core at 100% for the rest of the session, and `$/cancelRequest` neither stops the loop nor
draws a response. Minimized: a completion or signature help request between `<` and `{` when the
`<` follows an identifier right after a `}` (`}i<{`, `{}i<{`; `<}{` for signature help), in `.ts` and
`.tsx` alike; typescript-go 7.1.0-dev.20260930.4 does the same. Standalone repro, both servers'
results and notes for upstream: `docs/upstream/tsrs-lost-request/` (not filed).

**Change.** When a request about one document expires (a cancelled one too: tsgo answers cancelled
requests, so the tracking keeps them), the server answers the editor as in 44 and then restarts tsgo,
which replays the buffers it holds; every other outstanding request is answered with its fallback,
as on a crash. A workspace-wide request (references, rename, symbols, call hierarchy) and the
background's warm-up of a project can legitimately take long: those are only cancelled.

**Measured.** `lsfuzz` seeds 22 and 38 with `RSVELTE_TSGO_REQUEST_TIMEOUT_MS=10000`: the lost
signatureHelp (275) and completion (200) are answered after 10 s, tsgo restarts, every later request
is answered (287 and 309, no errors) and every project loads. With the default 30 s, the fuzzer's own
15 s check still reports the request, but the background no longer stalls (see Results).

**Risks.** A restart rebuilds every loaded project's program in tsgo (seconds at the zeno root); it
happens only after a document request has gone unanswered for 30 s.

**Tests.** The test of 44 also checks that tsgo restarts and replays its buffers (fails without the
restart).

Patch 50 narrows this: a diagnostic pull never expires, and an overdue request restarts tsgo only
when it is a completion or signature help or tsgo has answered a later request about its document.
Patch 59 narrows it again: only a request tsrs is shown to loop on restarts tsgo (`tsgo_loop`).

### 46. Resolve a copied component's `#` imports in its own package (`1d4cb87`)

**Problem** (review 3, from patch 19). Patch 19 turns `package.json` `"imports"` into overlay
`paths`, which apply to every file of the program. When one package's project holds a copy of
another package's component and both map `#lib/*` (each to its own `./src/lib/*`), the project's own
mapping wins and the copy's `#lib` imports resolved into the holding package's `src/lib`
(`hashscope.mjs`: 4 errors, 2 of them false on the valid line; official: exactly 2 on the invalid
line).

**Change.** The shadow of a component whose package is not the project's own spells each `#`
specifier its package maps (exact pattern first, else the longest wildcard prefix; conditions as in
patch 19) as the path from the component to the target, which `rootDirs` resolves from the shadow as
from the source; a `.svelte` target is suffixed `.tsx` as before. The respelling keeps every offset:
it overwrites the specifier in place, padding a shorter path with `/` after its first `/`
(`#lib/util.js` → `.////util.js`, which TypeScript normalizes), and inserts what a longer one has left
at its end as generated text, which the existing insertion mapping covers. Discovery follows `#`
specifiers through the importer's own package too, so what a copy reaches that way is copied as well
(before, no `#` import of a `.svelte` file was followed). The project's own components and the global
`paths` are unchanged (the review's minimal version).

**Measured.** `hashscope.mjs`: exactly the 2 errors on the invalid line; s10 unchanged.

**Risks.** A plain module of another package in the program still resolves its own `#` imports
through the project's `paths` (patch 19's documented risk); dropping package imports from the global
`paths` would need every component shadow respelled, the project's own included.

**Tests.** `tsgo_overlay::tests::a_copy_resolves_its_package_imports_in_its_own_package` (the copy's
specifiers, the component it reaches through `#lib` copied, the project's own component untouched,
positions after the specifiers mapping both ways); `tests/regressions/hashscope.mjs`.

## 47–49. Third review, projection

Developed by the projection engineer on `svelte-rs-projection` and merged with `670722d`. After every
commit all 4,744 `.svelte` files under zeno project byte-identically to `7793da7` (code, source map,
exact mappings, facts); 47–49 change only inputs that did not project, or projected wrongly, before.

### 47. End a stray script's opening tag where upstream's regex does (`8d6bf69`)

**Problem** (review 3; `find_orphan_scripts`, `htmlxparser.rs:610`). Upstream finds the `<script>`
tags the template does not own (inside an attribute value, say) with `scriptRegex`, whose opening tag
holds only attributes it can read and must be followed by a `</script>`. The port searched the first
`</script>` from the tag's start and took the first `>` before that one's end as the opening tag's. In
`<script </script>` that `>` is the closing tag's own, so the content started after it ended and the
slice panicked: the keystroke state the review minimized (`{#each <script </script>`) and a valid
component (`<div title="<script </script>">`) alike. Since patch 35 the server survives it, but the
document falls back to a script-only snapshot; `lsfuzz.mjs` seeds 22 and 38 logged 16 and 38 such
caught panics at `1d4cb87`.

**Change.** `script_opening_tag_end` reads the opening tag with upstream's attribute grammar
(`(?:\s+NAME=VALUE|\s+NAME)*\s*>`, a quoted value tried before an unquoted one, as the regex
backtracks; positions memoised, so the search stays linear) and accepts a `>` only when a `</script>`
follows it; the content ends at the first `</script>` after that `>`. A tag the regex does not read is
no stray script: `<script a/> b </script>` and `<script a </script> b </script>` inside an attribute
value stay in the attribute, as in official svelte2tsx 0.7.61 (before, the first gave the wrong
output and the second panicked).

**Measured.** `r5-crash.mjs` over 54 inputs (the review's candidates and the projection engineer's
own): 7 projection panics caught at `7793da7` and `1d4cb87`, 0 at `670722d`; `lsfuzz.mjs` seeds 22 and
38: none (Results, final).

**Tests.** `htmlxparser.rs` `an_opening_tag_ends_where_upstreams_script_regex_ends_it` (expected values
from upstream's `scriptRegex` run in node), `a_script_tag_inside_an_attribute_value_is_not_cut_at_its_closing_tag`;
`svelte2tsx_unfinished_opening_tag.rs` `a_script_opening_tag_ended_by_its_own_closing_tag_in_an_attribute`
(byte-identical to official 0.7.61) and `an_each_block_whose_collection_holds_an_unfinished_script_tag`
(both fail without the fix); `tests/regressions/crash-inputs/` (`runall.sh`: `r5-crash crash-inputs`).

### 48. Close a recovered declaration's brackets in its hoisted copy (`cd867b9`)

**Problem** (review 3, from patch 22). svelte2tsx hoists an instance script's imports, and its type
aliases and interfaces when the props type allows it, above `$$render()`, copying the author's bytes.
When patch 22's recovery had to repair one of them (`import {`, `import { x`, `import type {`,
`type T = { a: string;` being typed), the copy reached TypeScript still open and ran into the
generated `;type $$ComponentProps = …;function $$render() {` after it. `import {` read on into
`type $$ComponentProps` (`type` is a valid import specifier), so the props lost their type and the
template's prop errors disappeared; the syntax errors sat on generated text, which maps to 0:1 (the
`script` of `<script`). Patch 43 dropped those syntax errors; the lost prop errors needed this fix.

**Change.** `process_instance_script_tag` receives the instance script's recovery result. A hoisted
import, hoisted type or `$$Generic`-referenced type whose recovered text differs from the author's
gets, as generated text right after the author's bytes, the closers of the brackets that text leaves
open (computed with recovery's tokenizer, so strings, templates and comments are skipped); a repaired
import also gets its `;`, so TypeScript reports "'from' expected" at the end of the import rather
than on the next line. Declarations recovery did not touch are emitted as before.

**Measured** (projection engineer, server built from the branch). `start-of-file2.mjs`: no diagnostic
at 0:1 and the template's TS2322 in all 7 states (`7793da7`: 5 states at 0:1, 4 of them without the
TS2322); `start-of-file.mjs`: none at 0:1 in its 13 states; `recover-pos.mjs`, 377 states: 18
diagnostics at 0:1 → 0, no hover changes. Against official svelte2tsx 0.7.61 on the 46 hand-made
incomplete states the only differences are the 5 `import {` cases, where official leaves the import
open and this closes it (`import {};`). Integration: Results (final).

**Tests.** `svelte2tsx_incomplete_script.rs` `a_hoisted_declaration_left_open_is_closed_after_the_authors_text`
(fails without the fix); `recovery.rs` `a_repaired_declaration_gets_the_closers_of_its_open_brackets`;
`tests/regressions/start-of-file.mjs`, `start-of-file2.mjs` and `recover-pos.mjs` (which now also
prints `atStart`, the number of diagnostics at 0:1).

### 49. End a type body left open before the declaration it swallowed (`bf0dca5`)

**Problem** (found while fixing 48; `start-of-file.mjs`'s `type T = {` and `interface I {` states).
A type alias or interface typed above existing code leaves its body open over the next lines.
TypeScript ends such a body at the next line that starts a declaration; oxc reads that line as
members, and recovery then blanked the brace and kept repairing what followed. The function below was
lost from the program and hoisted, broken, with the type: false TS1005, TS2304, TS2693 and TS7008 on
its line, "Cannot find name 'go'" for every call to it in the template, and `any` on hover.

**Change.** When the bracket recovery would drop is the body of an interface or type alias (the
first bracket on a line that declares one; `export`, `declare` and type parameters allowed), recovery
closes it in the line break before the swallowed declaration line, where TypeScript ends it. A type
alias also needs a line break after the closer, which the line's indentation provides; without
indentation its body becomes a `_` placeholder. If the parser gets no further, the brace is blanked
as before (for an interface, its whole declaration).

**Measured** (projection engineer). Every `type`/`interface` state of `start-of-file.mjs` and
`start-of-file2.mjs` reports only the template's own TS2322 plus TS6196 for the unused type, and the
native parser's "Unexpected token" (official reports 3 × TS1131 plus the TS2322). `recover-pos.mjs`:
the `type T = {` states lose 9 false diagnostics and the hover on `go(later)` describes the function
again (problems 487 → 486). Script mutation fuzz on admin/src (88,913 mutants) runs no slower:
38.1/38.5 s against 39.2/42.0 s, interleaved.

**Tests.** `svelte2tsx_incomplete_script.rs` `a_type_body_left_open_above_a_function_ends_before_it`
(fails without the fix); `recovery.rs` `a_type_body_ends_before_the_declaration_it_swallowed`.

**Measured, 47–49** (projection engineer, on `bf0dca5`). `cargo test -p rsvelte_projection`: 847
passed (1 ignored). Script mutation fuzz, 708,719 mutants: 99 lost-import cases before and after
(the open generic `<…>` of patch 22), no panic; closing-tag-removal template fuzz, 6,718 cases:
unchanged (0 unbalanced, 146 errors); random fuzz: 1,875,000 mutants, no panic; the 425 saved panic
inputs and 46 review candidates: no panic.

## 50–54. Fourth review, language server

The fourth review found two ways patch 45's restart misfired: on a check that is slow but alive, and
on answers tsgo had already sent while the server's main loop was busy. 50–52 change when the
server gives up on tsgo; 53–54 remove the mapping cost behind the busy loop the review found (a
foldingRange or documentSymbol answer for a large component held the loop for 0.6–1.9 s). The
review's scripts are `tests/regressions/slow.mjs` and `burst.mjs`.

### 50. Wait for a slow check, and restart tsgo only for a request it loops on (`8bf20ab`)

**Problem** (review 4, major; from patch 45). A diagnostic pull whose check takes longer than
`RSVELTE_TSGO_REQUEST_TIMEOUT_MS` (30 s) was answered without tsgo and tsgo was restarted; nothing
pulled again, and every edit sent the same slow pull and cost another restart that rebuilt every
loaded project, so the file's TypeScript diagnostics never reached the editor (`slow.mjs`: a
component reading every export of a module whose check takes 41 s; with a 3 s timeout and a 6.6 s
check, 5 pulls gave 5 restarts in 40 s and TS2322 never appeared, where `7793da7` showed it at 6.8 s).

What tsrs 0.18.0 does with such a check (`docs/upstream/tsrs-cancelled-check/repro.mjs`): hovers,
code actions, inlay hints and semantic tokens on the same file are answered at once while it runs;
pulls are answered one after the other (a pull of another file waits for it); and a cancelled pull
is answered (RequestCancelled) only when its check is done and throws the result away, so the next
pull checks again, where after an uncancelled pull the next one is instant.

**Change.**

* A diagnostic pull (the editor's or a push pull) never expires: the editor gets tsgo's answer when
  the check is done, and tsgo is neither cancelled nor restarted for it. It still stops holding the
  background back after 2 s (patch 44).
* Any other overdue request is answered without tsgo as before, now also cancelled, and stays
  tracked. It restarts tsgo only when something says tsgo loops on it rather than taking long: it is
  a completion or signature help (the requests tsrs is known to loop on, patch 45), or tsgo has
  answered a later request about the same document. A slow one is answered whenever tsgo is done,
  cancelled or not, and forgotten.
* Each restart for the same method and document doubles the next one's wait, up to 8 times the
  timeout; the editor is still answered at the timeout.

**Measured.** `slow.mjs` with 6 aliases, a 3 s timeout and an edit every 8 s: TS2322 at 6,694 ms and
in every one of the 5 pulls (6.5–6.9 s each), no restart (`670722d`: every pull answered without it
after 3 s, 5 restarts). With 36 aliases and the default timeout: TS2322 at 41.5 s, no restart
(`670722d`: answered without it at 30.0 s, 1 restart; with its timeout lifted, as at `7793da7`,
40.7 s).

**Risks.** A diagnostic pull tsgo really never answers is never answered (none is known; the editor
keeps the previous diagnostics, and the background does not wait for it). A request tsrs loops on
that is not a completion or signature help restarts tsgo only once a later request about its
document is answered, which in an editor is almost at once.

**Tests.** `a_slow_diagnostic_pull_waits_for_tsgo_and_does_not_restart_it` (a fake tsgo whose check
takes 4 s, a 1 s timeout, two pulls across an edit, a hover answered meanwhile; fails without the
fix), `an_overdue_request_restarts_tsgo_once_a_later_one_about_its_document_is_answered` (a
definition tsgo never answers: answered and cancelled at the timeout, no restart, then a restart
once a hover is answered; fails without the fix), and patch 44's test still restarts tsgo on a lost
signature help. The fake tsgo no longer answers a `$/cancelRequest` as if it were the request it
names.

Review 5 found both rules restarting a tsgo that was slow but working (tsrs answers a signature help
or definition on a document being checked only once the check is done). Patch 59 replaces them with a
model of the requests tsrs loops on, 60 waits for a pull of the same document, 61 resets the backoff
after a quiet period, and 62 sends tsgo one looping request per document at a time.

### 51. Have the editor pull diagnostics again after tsgo restarts (`f586aff`)

**Problem** (review 4). After a restart, every pull the old tsgo had not answered had been answered
with its native half alone, and nothing asked again: the TypeScript diagnostics stayed missing until
the next edit.

**Change.** When a restarted tsgo is ready (any generation after the first, after a crash too), the
server sends `workspace/diagnostic/refresh` to an editor that pulls and supports it, or lints and
pushes every open document again for one that does not.

**Tests.** `a_restarted_tsgo_has_the_editor_pull_its_diagnostics_again` (a lost signature help
restarts tsgo; fails without the fix).

### 52. Read the answers tsgo already sent before counting a request as lost (`1d777cd`)

**Problem** (review 4, major; from patch 44). `TsgoRuntime::sent` is stamped when a request goes to
tsgo and cleared when the main loop handles the answer, and the expiry runs from the timer branch
of the same loop. When the loop was busy for longer than the timeout, the answers tsgo had sent in
the meantime were still in the channel, and `select!` picks a ready branch at random: the timer
usually won, so a responsive tsgo was counted as hung, the editor's requests failed with
`TypeScript service restarted: a request never finished`, and tsgo restarted (`burst.mjs … 1500
folding 30`: the tee of tsrs's traffic shows every one of those requests answered in 1–30 ms).

**Change.** Before expiring anything, the timer branch handles every tsgo event already received.

**Tests.** `answers_tsgo_sent_while_the_server_was_busy_are_not_counted_as_lost` (ten hovers tsgo
answers after 200 ms while opening a large component keeps the loop busy past the 1 s timeout;
fails without the fix: the hovers are answered `null` and tsgo restarts).

### 53. Read a component once per folding answer, not once per range (`d726645`)

**Problem** (review 4; on the baseline too). Mapping a foldingRange answer back checks every range
against both texts (upstream's `mapToOriginalRange`), and did so by building a line index of the
source and of the shadow and parsing the whole component again (`EmbeddedRegions::new`) for every
range: about 1.9 s for one answer at 2,100 lines, on the main loop (Zed does not ask for folding
ranges; VS Code and Neovim do). Each overlay lookup also canonicalized the source path on disk, once
per position.

**Change.** The response mapper keeps, for the one message it maps, the overlay that serves each
document and, for folding, both texts, their line indexes and the component's scripts.

**Tests.** `tsgo_response::tests::a_folding_answer_reads_its_component_once_and_maps_each_range_as_alone`
(about 600 ranges over an 1,800-line component: the same answer as each range mapped on its own, in
less than a fifth of the time; without the fix the two take the same time).

### 54. Map a tsgo position without scanning the shadow up to it (`7179942`)

**Problem** (review 4; on the baseline too). Every position in a tsgo answer became a shadow offset
by counting the shadow's newlines from its start, and every URI was looked up in each overlay again
(a `canonicalize`, and a read from disk for a plain script). An answer with a position per line was
quadratic in the component's size: a documentSymbol answer at 2,100 lines took 0.6–0.9 s, about 70%
of it in those scans and 20% in the URI lookups (`sample`).

**Change.** A shadow entry keeps the line starts of its text, built the first time one of its
positions is mapped (so only documents tsgo answers about pay for them, about 4 bytes a line), and a
position's offset is read from them; lines are still counted at `\n` alone, as the scan did. The
response mapper looks each URI up once per message.

**Measured** (53 and 54; `burst.mjs <bin> tpl 1500 <kind> 20`, 2,106 lines: a request of the kind
with each of 20 keystrokes 50 ms apart, plus a completion and a pull):

| | quiet request | p50 / max while typing | completion p50 / max |
|---|---|---|---|
| foldingRange, `670722d` | 1,896 ms | 19,755 / 35,107 ms | 18,077 / 35,108 ms |
| foldingRange, `d726645` (53) | 270 ms | 2,832 / 4,804 ms | 2,833 / 4,805 ms |
| **foldingRange, `7179942`** | **32 ms** | **36 / 46 ms** | **36 / 56 ms** |
| documentSymbol, `670722d` | 603 ms | 6,143 / 10,808 ms | 5,630 / 10,808 ms |
| **documentSymbol, `7179942`** | **41 ms** | **96 / 113 ms** | **88 / 130 ms** |

The review's case (`burst.mjs … 1500 folding 30`): 60 of 60 answered, folding p50 41 ms, no error, no
restart (`670722d`: tsgo restarted, `-32603` to the editor).

**Tests.** `tsgo_overlay::tests::a_shadow_offset_from_its_line_starts_is_the_scanned_one` (every
position of texts with CRLF, a lone CR, multibyte characters, and positions past a line or the last
line, against the scan), `a_position_late_in_a_large_shadow_maps_as_fast_as_an_early_one` (2,000
positions on the last line of a 4,000-line component; with the scan, 896 ms against 3 ms on the first
line).

## 55–64. Fifth review, language server

The fifth review found renames that corrupt a component (a type the props annotation uses, renamed
from the script, edited the `<script` tag: 55–56, 63; a malformed `generics` value lost its syntax
errors to patch 43's filter: 57) and patch 50 still restarting a tsgo that was slow but working
(59–62 and 64; 58 fixes a race in their tests). The review's scripts are in `tests/regressions/`:
`propsrename.mjs`, `hashrename.mjs`, `generics.mjs`, `slowsig.mjs`, `slowmix.mjs`, `loopstorm.mjs`
(with `loop-inputs/loop22.svelte`) and `lsfuzz2.mjs`; the projection engineer's `genericsrename.mjs`
and `propsfeatures.mjs` sit beside them. Mapping the copies svelte2tsx makes (the hoisted
`$$ComponentProps` alias, the `generics` value) back to the author's text is the projection's part of
the same finding; 55, 57 and 63 keep a component intact where a copy is still unmapped.

### 55. Keep rename edits and locations out of a script's opening tag (`9d1475b`)

**Problem** (review 5, major; on the baseline too). svelte2tsx writes the render header over the
`<script …>` tag and copies the props annotation into it (`type $$ComponentProps = { kind: Size }`);
the copy has no exact mapping back and lands on the tag (0:1, on `script`). Renaming `Size` from a use
in the script (`propsrename.mjs`) returned `1:6-1:10`, `0:1-0:5` and `2:8-2:12`: applied, line 0
became `<Dimpt lang="ts">` and the annotation kept `Size`; references reported 0:1 too. The same
happened through the copies another project keeps (`hashrename.mjs`, `Card.svelte`).

**Change.** No author's text is in an opening tag but a `generics="…"` value, which the header copies
as the render function's type parameters. A rename edit, and a references or document highlight
location, that maps into a `<script …>` opening tag after its `<` and outside a `generics` value is
dropped. A definition, type definition or implementation there is right about its file (the
component's own declaration is the header: go to definition on a component's tag landed at 0:1, e2e
4c), so it moves to the start of the file, where upstream puts a definition in generated code.
`context::ScriptOpeningTags` finds the tags by reading their
attributes, so a `>` in a quoted `generics` value does not end one (the parser's `body_of` ends it at
the first `>`), and only when an offset falls in one asks the parser whether a script starts there
(`<script` in a string or a comment is no tag). Locations are read against the editor's buffer, else
a project's copy of the component, else the file.

**Measured.** `propsrename.mjs`: edits `1:6-1:10` and `2:8-2:12`, line 0 intact (`{ kind: Size }`
keeps its name until the projection maps the copy, patch 65), references `1:6` and `2:8`. `hashrename.mjs`:
`Card.svelte`'s rename and references no longer include 0:1. e2e 4c and 4c2 land at 0:0 (were 0:1).

**Tests.** `context::tests::a_script_opening_tag_is_covered_after_its_lt_and_outside_its_generics`,
`script_text_that_is_no_opening_tag_is_not_covered`,
`tsgo_rename::tests::an_edit_that_maps_into_a_script_opening_tag_is_dropped_unless_in_its_generics`
(fails without the fix), `server::script_tag_location_tests::references_and_highlights_in_a_script_opening_tag_are_dropped`,
`definitions_in_a_script_opening_tag_move_to_the_start_of_the_file`.

### 56. Never return two different rename edits for one stretch of text (`abc01ae`)

**Problem** (review 5). A rename gathers edits from tsgo's answer, its follow-up queries and, for a
component several projects hold, from several shadows mapping to the same source. Identical edits
were kept once, but two that replace the same text differently (`Size as Dim` and `Dim` on one import
specifier), or overlapping ranges, both reached the editor, which applies a document's edits together:
it rejects the rename or applies one over the other.

**Change.** An edit that touches text another edit of the same document already replaces (the same
range, two insertions at one point included, or an overlap) is dropped; the first is kept, which is
the primary answer's (`merge_workspace_edits` takes it first). An insertion where a replaced range
starts or ends is no conflict.

**Tests.** `tsgo_rename::tests::edits_of_the_same_text_are_kept_once_and_a_conflicting_one_is_dropped`
(fails without the fix).

### 57. Keep syntax errors in a script's `generics` value (`7d96446`)

**Problem** (review 5, from patch 43). Patch 43 drops TypeScript syntax errors that map into a
`<script …>` opening tag, but the header also copies the `generics` value, where a syntax error is
the author's: `generics="T extends "` showed only the "Cannot find name 'T'" it caused
(`generics.mjs`).

**Change.** The filter uses `ScriptOpeningTags` (55): a syntax error in a `generics` value (its end
included, where a missing type is reported) stays, one elsewhere in the tag still goes, and semantic
errors stay as before. A tag whose `generics` value holds a `>` is now read to its real end.

**Measured.** `generics.mjs` is unchanged at this build: the projection maps the value's errors to the
tag (0:1), where they are still dropped; once it maps them into the value they stay (the unit test
below; with patch 66 merged, Results, ship).

**Tests.** `server::diagnostic_message_tests::syntax_errors_in_a_generics_value_are_kept` (fails
without the fix).

### 58. Write each line of the fake tsgo's log at once (`2aa020e`, tests only)

A restarted fake tsgo appends to the same log while the old one ends, and `writeln!` on an unbuffered
`File` writes each piece of a line on its own: the old process's `$/cancelRequest` line could split
the new one's first `didOpen`, which the restart tests count (with 59's tests about one run in two
failed under load). Each line is now one `write_all`.

### 59. Restart tsgo only for a request tsrs is known to loop on (`843a85d`)

**Problem** (review 5, major; from patch 50). Patch 50 restarted tsgo for any overdue completion or
signature help, and for any other overdue request once tsgo answered a later request about its
document. tsrs does both for a request that is merely slow: while a document's check runs it answers
hovers at once and a signature help or definition on that document only once the check is done.
`slowsig.mjs` (36 aliases): `7179942` answered the signature help `null` at the 30 s timeout and
restarted tsgo, throwing the check away (TS2322 reached the editor at 76 s); `7793da7`, without a
timeout, answered it for real after 52 s (TS2322 at 50 s). `slowmix.mjs` likewise.

**What tsrs loops on** (`docs/upstream/tsrs-lost-request/README.md`; 398 requests measured with
`loopprobe.mjs`, `crates/rsvelte_language_server/tests/data/tsrs-lost-requests.json`). Both requests
walk back from the position over the tokens a type argument list holds to the `<` that may open one
(`getPossibleTypeArgumentsInfo`), and completion walks again from the identifier before it. The walk
jumps from a `}`, `)` or `]` to its opener, which the port finds by searching the whole text: when the
last `{` of the text comes after its last `}` (likewise `(`/`)`, `[`/`]`), every closer jumps forward
to that opener, and a walk that comes back to a closer never ends. It starts only if the text has a
`<` anywhere. This also explains the two requests the fuzzer lost, whose positions have no `}i<{`;
both were in documents svelte2tsx rejected, answered from the script body. A projected shadow ends
with generated code that closes every brace and parenthesis after the author's text, so there only
brackets can loop (`let q = [1]a[` at the end of a script).

**Change.**

* `tsgo_loop` models that walk on tsgo's text: `request_loops` finds every measured loop and counts
  no answered request as one except 5 signature helps next to a call's parentheses (tsrs answers
  those for the call without walking; 64 adds 42 requests around template literals to the data).
  `text_can_loop` (a `<`, and an opener after the last closer of its kind) gates it.
* An overdue request is answered without tsgo and cancelled as before. If tsrs loops on it, it stays
  tracked and restarts tsgo after the backoff; any other is forgotten, and tsgo's late answer has
  nobody waiting. Patch 50's "a later request about the same document was answered" rule is gone.

**Measured.** See Results (`slowsig.mjs`, `slowmix.mjs`, `lsfuzz2.mjs`).

**Risks.** A loop the model does not find is answered at the timeout and cancelled but keeps a tsrs
worker busy until the session ends (none is known; the model reads tokens, not tsgo's syntax tree:
regular expressions, template literals and `>>` are approximated).

**Tests.** `tsgo_loop`'s four (every measured request; only completion and signature help; a projected
shadow only through its brackets; nothing in a comment or a string);
`robustness::a_slow_signature_help_or_definition_does_not_restart_tsgo` (a fake tsgo answers both after
twice the 1 s timeout and hovers at once: no restart, both cancelled, and the pull, slower still, keeps
its TS2322; fails without the fix). Patches 44's and 51's tests now lose a signature help in a
TypeScript buffer tsrs loops on; patch 50's
`an_overdue_request_restarts_tsgo_once_a_later_one_about_its_document_is_answered` goes with its rule.
The fake tsgo can answer methods late (`RSVELTE_TEST_SLOW_METHODS`, `RSVELTE_TEST_SLOW_MS`) and report
an error on a word of a pulled document (`RSVELTE_TEST_DIAGNOSTIC_WORD`).

### 60. Never count a request as a loop while a pull of its document runs (`f91e003`)

**Problem** (review 5). tsrs answers a request about a document whose check is running only once the
check is done, so a request at a position tsrs loops on may as well be waiting for a check; restarting
then throws the check away and answers the pull with its native half.

**Change.** An overdue request tsrs loops on restarts tsgo only when no diagnostic pull of its document
is with tsgo; the pull is answered first, with its TypeScript half, and the restart follows.

**Tests.** `robustness::a_looping_request_restarts_tsgo_only_after_a_pull_of_its_document` (a 3 s pull
and a lost signature help in the same buffer, a 1 s timeout: no restart at 2 s, the pull keeps its
TS2322, then tsgo restarts; fails without the fix).

### 61. Reset the restart backoff after a quiet period (`254c785`)

**Problem** (review 5). Each restart for the same method and document doubled the next one's wait
(patch 50, up to eight timeouts), and the count never went down: a loop long after the last ones still
waited four minutes at the default timeout.

**Change.** `RestartBackoff` keeps the time of the last restart for each method and document; a
restart counts as one in a row only if the request behind it was sent within eight timeouts (the
longest wait) of the previous one. A request sent after that waits the plain timeout and starts the
count again; a state the editor keeps asking about still backs off.

**Tests.** `server::restart_backoff_tests::the_restart_backoff_doubles_and_resets_after_a_quiet_period`.

### 62. Send tsgo one request it loops on per document at a time (`1d849ed`)

**Problem** (review 5, `loopstorm.mjs`: a signature help every 2 s at a state tsrs loops on, a hover on
another component every second). Each looping request holds one of tsrs's few workers for good; with
three of them tsrs answered nothing else, hovers included, until tsgo restarted. With 59–61 alone and
a 10 s timeout: hovers answered `null` after 10 s from 16 s on, outages of 33 s, then 44 s and more
as the backoff grew (minutes at the default 30 s), tsrs at 2.5 cores.

**Change.** The runtime now decides whether tsrs loops on a request when it is sent (the walk runs only
for a text `text_can_loop` passes), not once it is overdue. While a request about a document that tsrs
loops on is with tsgo (overdue included, until the restart), another the editor sends there that tsrs
would loop on is answered at once with its native half or the empty answer, as the first will be, and
not sent. Every other request goes to tsgo; after the restart the next one is sent again.

**Measured.** `loopstorm.mjs` (120 s, 10 s timeout): every hover answered in 0–5 ms, tsrs at one core,
3 restarts (near 12, 32 and 72 s: the backoff), every repeated signature help answered at once.

**Risks.** While one is pending, a request at another position of the same document that tsrs would
loop on is answered without tsgo; such a position is answered `null` by tsrs anyway.

**Tests.** `robustness::a_second_request_tsgo_would_loop_on_is_answered_without_it` (three more
signature helps while the first is with tsgo are answered at once and not sent, a hover is, and after
the restart the next one is sent; fails without the fix).

### 63. Drop a rename edit whose source text is not the name it renames (`841697a`)

**Problem** (review 5, `genericsrename.mjs`, found after 55). For a generic component the props
annotation's copy is mapped through the nearest source-map token, to the end of the statement above
it: renaming the type parameter `T` returned `1:24-1:25` (the `;` of `type Size = 'sm' | 'lg';`), and
renaming `Size` returned `1:24-1:28`, which ran two lines together. 55 does not catch those: they land
in the script.

**Change.** A rename edit whose source text differs from the text tsgo replaced in the shadow is
dropped. Exact and boundary mappings copy that text by construction, so only approximate ones are
affected; where the projection does not map a copy back the rename stays incomplete, but no other text
is overwritten.

**Measured.** `genericsrename.mjs`: `T` renames only `3:8` and `Size` only `1:6`, both texts intact
(the annotation keeps its names until the projection maps it); `propsrename.mjs` and `hashrename.mjs`
unchanged.

**Tests.** `tsgo_rename::tests::an_edit_whose_source_text_is_not_the_renamed_name_is_dropped` (fails
without the fix).

### 64. Read a template's substitutions as tsgo does when deciding it loops (`245dbfb`)

**Problem** (found by `lsfuzz2.mjs` seed 12 against 63). A completion tsgo never answered was not
counted as a loop: answered without tsgo at the timeout and cancelled, it kept a tsrs worker busy for
the rest of the session (the tee of tsrs's traffic shows it unanswered). The script body tsgo had for
the rejected document began ``fr`${om 'sve…';``: the model read everything after the backtick as one
template literal, a token the walk stops at, while TypeScript's parser gives up on the substitution
at the `;` and reads the rest as script. Minimized against tsrs (`minimize.mjs` beside the probe):
`}|<}{`.

**Change.** The model's tokenizer follows the scanner and the parser: a template's text is a token up
to each `${`; the `}` that closes no `{` opened in a substitution continues the template; a `;` in a
substitution ends the template, after which a `}` is a plain one.

**Measured.** 42 more requests against tsrs 0.18.0 (seed 12's text, its minimized form, templates
before, inside and around the walk): the data holds 398, 145 of them loops; every loop is found, and
the answered requests counted as loops are still the same 5 signature helps. `lsfuzz2.mjs` seed 12
now restarts tsgo for the lost completion and ends clean.

**Tests.** `tsgo_loop::tests::a_template_is_read_as_typescript_reads_it` (fails without the fix), and
the measured requests.

## 65–66. Fifth review, projection

Developed by the projection engineer on `svelte-rs-projection` (on `7179942`) and merged with
`8c8c100`, without a conflict (the branches share no file). They are the projection's half of review
5's rename finding (55): svelte2tsx copies two pieces of the author's text into the render header, the
props annotation (as the `$$ComponentProps` alias) and a `generics` value, and the port mapped both
copies to the `<script` tag. Now each copy maps back to the author's text character by character, as
in official svelte2tsx 0.7.62, so rename, references, definition, hover and diagnostics land there.

After each commit all 4,744 `.svelte` files under zeno project to byte-identical code (the probe of
round 4 with the language server's options); the source map and exact mappings change only where a
copy is now mapped: the 937 files with such an alias (65) and the 129 with a `generics` attribute (66),
each gaining one exact segment. Every exact segment (179,814 in all) copies source bytes verbatim and
no source byte is mapped twice. `8c8c100`'s projection, parser and check crates are byte-identical to
`1862ff2`'s, so this holds for the merged build.

### 65. Map the `$$ComponentProps` alias back to the annotation it repeats (`1ed10ba`)

**Problem** (review 5, major; on the baseline too). A typed `$props()` destructure whose annotation is
not a plain type reference (`let { kind }: { kind: Size } = $props()`) gets
`;type $$ComponentProps =  { kind: Size };` in the render header, and the annotation's own place becomes
a `$$ComponentProps` reference. Upstream moves the annotation into the alias, so the alias maps back to
it. The port wrote the alias as text into the overwrite of the `<script` tag, so it mapped to 0:1:
renaming `Size` from a use returned `0:1-0:5` (`<script` became `<Dimpt`) and no edit for the
annotation, references listed 0:1 instead of it (`propsrename.mjs`; through a copied component in
another project, `hashrename.mjs`), a hover inside the annotation answered nothing and an unknown type
there was reported on line 0 (`propsfeatures.mjs`). An alias kept inside `$$render` (a generic
component, or a `typeof` of a local) mapped to the end of the previous line (`'lg'T2`; the edit patch 63
drops).

**Change.** `MagicString::insert_copy` links a chunk for an original range before the chunk at a given
index, outside the original layout: the copied text is mapped byte for byte and listed in the exact
(forward) segments, a prefix maps to the copy's start, a suffix is an outro. `process_instance_script_tag`
emits the alias as such a copy of the annotation wherever it goes (before `$$render`, in part A, after
the last hoisted import when module-hoisted snippets follow, and before the declaration inside
`$$render`); the annotation's place keeps its `/*Ωignore*/$$ComponentProps` reference. When script
recovery repaired the annotation the alias holds, the alias stays plain text as before:
`props_alias_copy` copies only when the source bytes equal the alias text, which is what keeps the code
byte-identical.

**Measured** (Results, ship). `propsrename.mjs`: edits `1:6-1:10`, `3:23-3:27` (the annotation) and
`2:8-2:12`, line 0 intact and line 3 `{ kind: Dim }`; references the same three. `hashrename.mjs`:
Card's rename adds the annotation's `2:23`, its references Button's `3:41` and Card's `2:23`, nothing at
0:1, no duplicate. `propsfeatures.mjs`: a hover on `kind` in the annotation answers
`(property) kind: Size`, and `Cannot find name 'Missing'` moves from line 0 to line 2.

**Risks.** The copy sits exactly where the alias text used to go, except if something is later appended
at the same index (`append_left` at a `let_pos` equal to `content_start`, or `prepend_right` at another
`let_pos`): that would now come before the copy instead of after it. No such case occurs in zeno or the
fixture suites (the code is byte-identical everywhere), but it is not ruled out structurally.

**Tests.** `svelte2tsx_props_alias_map.rs`: `a_hoisted_alias_maps_back_to_the_annotation`,
`a_hoisted_alias_after_imports_and_hoisted_types_maps_back_to_the_annotation`,
`an_alias_before_module_hoisted_snippets_maps_back_to_the_annotation`,
`an_alias_kept_inside_render_maps_back_to_the_annotation`,
`an_alias_of_a_non_object_annotation_maps_back_to_it` (the exact mappings both ways, the source map
character by character, the alias name on the annotation and not on 0:1; all fail without the fix);
`magic_string.rs` `a_copy_maps_its_text_byte_for_byte_and_its_prefix_to_its_start` and
`a_copy_keeps_its_text_when_the_original_is_edited_and_moves_with_its_range`.

### 66. Keep a `generics` attribute's value in place in `$$render<…>` (`1862ff2`)

**Problem** (review 5; on the baseline too). A TypeScript component's `generics="T extends string"`
becomes `function $$render<T extends string>() {`. Upstream overwrites the tag around the value and
leaves the value in place; the port wrote the whole header as one string over the tag, so the type
parameters mapped to 0:1: renaming `T` from a use edited `0:1-0:2` (`<T2cript`, which 55 drops), its
definition and references pointed there, an unknown constraint (`generics="T extends Missing"`) was
reported at 0:1, and so were the value's syntax errors, which patch 43 drops there (57 keeps them only
inside the value).

**Change.** The header is overwritten up to the value and from its end, as upstream does: the value keeps
its own exact mapping, `function $$render<` still maps to the tag and `>() {` to the value's end (its
closing quote). Components with `$$Generic` declarations, JavaScript components and an empty value are
emitted as before. `nodes/generics.rs` gains `generics_value_range`, which
`extract_generics_from_script_tag` now uses too (same behaviour).

**Measured** (Results, ship). `genericsrename.mjs`: renaming `T` edits `0:28` (in the value, which 55
keeps), `2:32` (the annotation, 65) and `3:8`, its definition is `0:28`; renaming `Size` in the generic
component edits `1:6` and `2:47`; nothing at 0:1. `generics.mjs`: the syntax errors land in the value
(1109 at `0:38`, 1139 at `0:45`, 1005 at `0:50`; 57 keeps them), `Cannot find name 'Missing'` at
`0:38-0:45`, and the "Cannot find name 'T'" the malformed states cause at its use, `1:23`, instead of
0:1. `propsfeatures.mjs`: hovers on `T` and on its constraint describe the type parameter and the type
instead of `function $$render`.

**Tests.** `svelte2tsx_generics_attribute_map.rs`:
`render_type_parameters_map_back_to_the_generics_attribute` (double-quoted, single-quoted and unquoted
values) and `render_type_parameters_map_back_after_a_hoisted_props_alias` (the exact mappings both ways,
the source map per character, `$$render` still on 0:1; both fail without the fix).

## 67–72. Sixth review, language server

The sixth review (`docs/reviews/ship-review.json`) found a regression from patch 59: a tsrs loop the
loop model misses was never recovered, and each repeat of the request took another tsrs worker until
tsrs answered nothing (67, the model's gap; 68, a restart that needs no model). It also found renames
and references that were wrong before these patches: an element's `bind:` shorthand (69), a store
renamed from a `$store` use (70) and a store's references (71), and TypeScript errors that patch 65
moved into text it does not map (72). The reviewer's scripts used here are in `tests/regressions/`:
`missedloop.mjs`, `pullwhileloop.mjs`, `rn.mjs` (rename, references, definition and highlights of the
`cases/*.json` texts; run against the official server, it gives the oracle's answers) and
`diagcmp.mjs`.

The language-server fallback for a component's closing tag (the review's problem 2) was not needed:
with the projection's `ac026f1` ("keep a component's name in place in its closing tag", on
`svelte-rs-projection`) applied on top of 67–72 in a throwaway worktree (no commit; the tree differed
from `3c82cbc` only in two later changes to 68's restart rules), `rn.mjs
cases/component.json` renames `Child` to `<Kid kind="a">text</Kid>` and `UI` to `<Lib.Box>{n}</Lib.Box>`,
as official does, and the closing tags' references are their names (`5:22-5:27` and `9:35-9:40`;
`UI`'s `6:13-6:15`) instead of zero-width locations at their `<`. `ac026f1` became patch 73, `d727500`
(the same change, reformatted), and the merged build `c921b00` gives these answers (Results, rename).

### 67. Read a regular expression as one token when deciding tsrs loops (`9fc08b1`)

**Problem** (review 6, major, from patch 59). `tsgo_loop`'s tokenizer read every `/` as a division, so
the quote in `/'/` opened a string to the end of the line and the `/*` in `/\/*/` a comment to the
next `*/`, hiding the brackets the walk loops through. tsrs loops on completion and signature help
there (`loopprobe.mjs`, `WAIT=8000`) and the model said no: `let a = x < y;⏎const r = /'/; }c|{`, the
same with `/"/`, `s.replace(/['"]/g, '')`, `/\/*/` (on the walk's line or above it) and
`/https?:\/\//`.

**Change.** A `/` where an expression starts is a regular expression, one token the walk stops at: at
the start, after an operator, an opener, a `,`, a `}` (a block's end, where a statement starts) or a
keyword that is no value; after a word, a literal, `)`, `]`, a whole template, `++`, `--` or a `<` (a
type assertion's type, or a closing tag: `lsfuzz2.mjs` seed 12's text has `</scripi<…`) it still
divides. It runs to the `/` outside a class, honouring `\` escapes, then its flags. One that a line
ends first ends as TypeScript's scanner recovers it (`reScanSlashToken`): at the first `)`, `]` or `}`
it does not open, outside a class and a `{…}` quantifier, before the spaces and `;`s ahead of it, so a
half-typed `/'; }c{` leaves the `}` to the script (tsrs loops there).

**Measured.** 72 more requests against tsrs 0.18.0 (`loopprobe.mjs`, `WAIT=8000`; `regex` texts in
`docs/upstream/tsrs-lost-request/cases.json`): the review's `regex.json` and `more.json`, regular
expressions after `return`, `(`, `,`, `=>`, `!`, `?`, `:`, `[`, `{ k:`, `}` and with flags, classes and
escapes, divisions after words, numbers, `)`, `]`, templates, `/=` and `this`, and unterminated ones.
The data holds 470 requests, 211 of them loops; every loop is found, and the answered requests
counted as loops are the 5 signature helps next to a call's parentheses and, for both requests,
`let a = <any>b; }c|{` in a `.tsx` file, where the type assertion is an element. Not modelled: a
regular expression right after a statement's `)` (`if (r) /'/; }c|{`, which tsrs loops on and the model
reads as a division); patch 68 recovers from it.

**Tests.** `tsgo_loop::tests::a_regular_expression_is_read_as_typescript_reads_it` and the measured
requests (both fail without the fix).

### 68. Restart a tsgo that stops answering, whatever the loop model says (`f167318`)

**Problem** (review 6, major, from patch 59). Since 59 an overdue request the model does not flag was
answered without tsgo, cancelled and forgotten, so a loop the model misses was never recovered: the
looping worker spun for the rest of the session, each repeat of the request (the editor asking again
at the same position) took another, and once three looped tsrs answered nothing.
`missedloop.mjs` (rejected components whose script line is `const r = /'/; }c{`, four completions, a
hover on another component every second, a 4 s timeout) on `8c8c100`: no restart, every hover answered
`null` after 4 s, tsrs at 200–300% CPU for the whole run; one completion left tsrs at 100% CPU for
good. `7179942` restarted once.

**What tsrs runs at once.** A request holds one of its project's checkers while it runs: tsrs's
checker pool (`tsrs_project` `checkerpool.rs`) has four per project, one kept for diagnostics, so with
three requests looping in a project tsrs answers nothing else about it (review 5's `loopstorm.mjs`:
three), while it still answers pulls, which check with the fourth. Measured with `missedloop.mjs` and a
loop the model misses (below): with one or two looping, hovers on another component of the project are
answered in 1–2 ms throughout; with four, none is.

**Change.** An overdue request now stays tracked until tsgo answers it late (tsrs answers a slow one
once it is done, even cancelled; the log says `response to unknown tsgo request … (answered late: it
was overdue)`) or restarts, and tsgo restarts, with the backoff of patch 61, for:

* a request tsrs loops on, at the timeout, as before (59);
* a completion or signature help the model does not flag (the requests tsrs loops on), once it is
  still unanswered after four timeouts; while one is overdue, the editor's next completions and
  signature helps in its document are answered without tsgo and not sent, as 62 does for flagged ones;
* a request tsgo has answered nothing since, for a timeout: a slow tsrs still answers the editor's
  other requests meanwhile (`slowsig.mjs`'s hovers during its check), one whose workers all loop
  answers none. Only answers to requests other than pulls count (they check with a checker of their
  own);
* three requests overdue at once.

The last two need no model. They leave out the background's warm-up requests (a large project may take
that long to build while the editor is quiet) and diagnostic pulls, and wait for a check a request may
be waiting for (tsrs answers a request about a document whose check runs once the check is done,
patch 60): while a pull of its document is with tsgo, and for one timeout after a pull that ran past
the request's own timeout is answered, the time tsrs takes to answer what the check held back
(`slowmix.mjs` has five such requests, answered just after the pull). The wait for the pull has no
bound: a first version stopped waiting after four timeouts, and `runall.sh`'s `slowmix.mjs` and
`slowsig.mjs` (3 s timeout) restarted tsgo at 12–14 s because their 7 s check took longer at a load
of 40. Their restarts back off together.

**Measured.** See Results, round 7: `missedloop.mjs` with a loop the model now finds and with one it
misses, `slowsig.mjs`, `slowmix.mjs`, `loopstorm.mjs`, `pullwhileloop.mjs` and `lsfuzz2.mjs`.

**Risks.** A request that tsgo takes longer than the timeout to answer while the editor asks nothing
else and no pull of its document runs now restarts tsgo (none is known: tsrs answers everything the
benchmarks and e2e send in milliseconds; `slowsig.mjs`'s 40 s signature help comes with its check's
pull and hovers). Three such requests at once do too. A completion or signature help slower than four
timeouts restarts tsgo.

**Tests.** `robustness::a_tsgo_that_answers_nothing_is_restarted_whatever_the_model_says` (a fake tsgo
answers nothing after a completion the model clears: restarted after the timeout, hovers answered
again), `a_completion_tsgo_never_answers_restarts_it_after_four_timeouts` (a lost completion, hovers
answered: a second completion is answered at once and not sent, no restart within 3.5 s, then one; the
next completion is sent again), `as_many_overdue_requests_as_tsrs_runs_restart_tsgo` (three lost
completions, hovers answered: restarted within 3.5 s), all three failing without the fix, and
`requests_a_check_holds_back_do_not_restart_tsgo` (a 2.5 s pull and three requests answered at
5.2 s, a 1 s timeout, nothing else asked: no restart; it fails without the timeout after the pull,
and with the wait for the pull bounded at four timeouts).
The fake tsgo can stop answering after a request (`RSVELTE_TEST_TSGO_WEDGE`), and ignores a
completion too (`RSVELTE_TEST_TSGO_IGNORE` is now read before its completion branch).

### 69. Expand a directive shorthand when renaming the variable it reads (`656c449`)

**Problem** (review 6, major; on the baseline too). Renaming `let value = $state("")` used in
`<input bind:value />` to `text` gave `<input bind:text />` (edit `13:12-13:17 text`), which binds a
property inputs do not have; official gives `<input bind:value={text} />`. svelte2tsx keeps an
element binding's property as a string key (`"bind:value":value`) and maps the directive's name to the
variable alone, so tsgo answers with the plain new name, and `correct_shorthand` only expanded tsgo's
`public: value` pairs (a component's shorthand, `{ value, }`).

**Change.** A plain identifier replacing the name of a `bind:`, `let:`, `class:` or `style:` shorthand
(whitespace before the directive; whitespace, `/`, `>` or the end after the name and any modifiers)
becomes `name={new}` after the modifiers (`style:color|important={hue}`), so the variable is renamed and
the property, class or style keeps its name. `class:` and `style:` shorthands reach it once the
projection maps their name to the variable as it maps `bind:`'s (review 6, problem 3; today their
edits are dropped by 63). Official renames those to `class:on` and `style:hue`, changing the class and
the style; this keeps them. Patches 76–77 map them, and in the merged build (`c921b00`) renaming
`active` and `color` in `<p class:active style:color use:tip {onclick}>` gives `class:active={on}` and
`style:color={hue}` (Results, rename).

**Measured.** `rn.mjs cases/shorthand.json`: `13:12-13:17 value={text}`, `<input bind:value={text} />`, as
official.

**Tests.** `tsgo_rename::tests::a_plain_rename_of_a_directive_shorthand_expands_it` (fails without the
fix).

### 70. Keep the `$` of a store's uses when renaming it from one (`ea13b10`)

**Problem** (review 6, minor; on the baseline too). Renaming a store from a `$count` use to `total` gave
`const total = writable(0)` and `total++`, `{total}`, `{#if total > 1}`: the uses read and wrote the
store object instead of its value. The prepare answer offers `count` (without the `$`), and tsgo renames
the generated `$count` local to the name typed at every use. From the declaration the uses already
became `$total` (the StoreValue follow-up asks for `$` + the new name).

**Change.** A rename edit that replaces a `$name` in a component's source with a plain identifier
writes `$` + that identifier. Svelte reserves the prefix, so a `$` name in a component is always a
store's value.

**Measured.** `rn.mjs cases/shorthand.json` from `{$count}`: `8:22`, `14:47` and `15:5` become `$total`,
`3:7` `total`, as official.

**Tests.** `tsgo_rename::tests::a_store_value_renamed_from_its_use_keeps_its_dollar` (fails without the
fix).

### 71. List a store's references and its `$store` value's together (`46c3cd6`)

**Problem** (review 6, minor; on the baseline too). The references of `const count = writable(0)` were
the declaration alone, those of a `$count` use the three uses without the declaration; official lists
all four from either. tsgo sees two symbols, the store and its value, declared in generated code as
`let $count = __sveltets_2_store_get(count);`, whose two halves the server dropped.

**Change.** When tsgo answers the editor's references request, each location that is one half of such
a declaration (`tsgo_rename::store_counterpart`) has the server ask tsgo for the references of the
other half, with the editor's `includeDeclaration`, until every half among the answers is covered (a
store imported into another component brings its `$store` uses there too), as upstream's
`FindReferencesProvider.getStoreReferences` does; the gathered locations are then mapped as tsgo's
answer, without duplicates. A follow-up expires like any request; a restart answers the editor with the
usual error.

**Measured.** `rn.mjs cases/shorthand.json`: references from `count = writable` and from `{$count}` are
`3:7`, `8:22`, `14:47` and `15:5`, as official. (Go to definition from `{$count}` still finds nothing,
as on the baseline: tsgo's answer is the generated `$count` declaration; official goes to `3:7`.)

**Tests.** `tsgo_rename::tests::a_store_and_its_value_are_each_others_counterparts`;
`robustness::the_references_of_a_store_and_of_its_value_are_listed_together` (fails without the fix;
the fake tsgo answers references with the occurrences of the word at the position when
`RSVELTE_TEST_TEXT_REFERENCES` is set).

### 72. Put a diagnostic in the text before a copy on the copied text (`3c82cbc`)

**Problem** (review 6, minor, from patch 65). In a component whose `$$ComponentProps` alias stays inside
`$$render` (a generic component, or an annotation using `typeof` of a local), a half-typed type literal
above the props declaration lost its TypeScript errors: `diagcmp.mjs cases/diag2.json`, TypeOpenGen
(`type Q = {` above `let { a }: { a: T } = $props();` in a `generics="T"` component) and TypeOpenTypeof,
gave only Svelte's parse error (`245dbfb`: 1131 'Property or signature expected' at 1:10, twice;
official: at 2:11). TypeScript reports them on the `;type $$ComponentProps =  ` svelte2tsx writes before
the annotation's copy. Since 65 the source map sends that text to the copy's start, the copy's first
character too, and `map_generated_position` reads text between two tokens with one source as an
unmapped gap.

**Change.** A diagnostic (a pull's or a push's: the mapper for `textDocument/diagnostic` and
`textDocument/publishDiagnostics`) that starts in such text, right before an exact segment, lands at the
copy's source, and ends where its end maps, else where it starts. Other answers and diagnostics in other
generated text map as before. In the 476 zeno components and the 2,792 of rsvelte's pattern corpus,
such text is only ever the alias's prefix (192 and 39 of them).

**Measured.** `diagcmp.mjs cases/diag2.json`: TypeOpenGen reports 1131 at `2:12`, TypeOpenTypeof at
`3:12` (twice each, as `245dbfb` did), on the annotation's `{`; the other four texts are unchanged.

**Tests.** `tsgo_overlay::tests::a_diagnostic_in_the_text_before_a_copy_lands_on_the_copied_text` (the
`;` maps to the annotation, a range running into the copy ends there, an `Ωignore` region and the header
still map as before).

## 73–80. Sixth review, projection

Developed by the projection engineer on `svelte-rs-projection` (on `8c8c100`) and merged into `3c82cbc`
with `c921b00`, without a conflict (the branches share no file). They are the projection's half of the
sixth review's rename findings (its problems 2, 3 and 7): author text the port wrote into the template,
or into a repaired props alias, as unmapped text. A rename that patches 55 and 63 trimmed there was
silently partial (a component's closing tag left behind, so the component no longer parsed; a
snippet's declaration or an each block's key left with the old name), and references reported
zero-width locations at the start of the block or attribute. Now each piece stays in place with its
own exact mapping, as upstream svelte2tsx leaves it, so rename, references, definition, hover and
diagnostics reach it; the projected code is unchanged.

After each commit all 4,744 `.svelte` files under zeno project to byte-identical code and facts (the
probe with the language server's options, `tests/regressions/projection/`: `zz_probe.rs`, `corpus.sh`,
`cmpcode.py`, `checkexact.py`, `exactdiff.py`); the source map and exact mappings change only where a
name is now mapped: 83,542 source bytes are newly mapped exactly, none that was mapped before maps
elsewhere, every one of the 186,906 exact segments copies source bytes verbatim, and no byte maps
twice. 11,286 template mutations around the touched constructs (`tfuzz-gen.cjs`) project to the same
code as at `8c8c100`, without a panic, every exact segment verbatim. `c921b00`'s projection, parser and check
crates are byte-identical to `476f489`'s, so this holds for the merged build.

### 73. Keep a component's name in place in its closing tag (`d727500`)

**Problem** (review 6, major; on the baseline too). svelte2tsx turns `</Child>` into a `Child}`
reference; upstream's `transform()` overwrites the tag around the name, which keeps its mapping. The
port wrote `Child}` as one overwrite of the whole tag, so the name mapped to the `<`, two characters
early. Renaming an imported component, or a namespace (`UI` in `<UI.Box>`), left every closing tag
behind (`<Kid kind="a">text</Child>`, which no longer parses: 63 drops the off-by-two edit, which
before it garbled the text, `textKidld>`), and references reported the closing tags as zero-width
locations at their `<`.

**Change.** The closing tag is overwritten up to the name and after it, and the name keeps an exact
mapping. A named-slot child (`<Inner slot="a">`) closes its own block before the name and the
named-slot block after it, as before, without its caller appending the name as text.

**Measured.** `rn.mjs cases/component.json`: renaming `Child` gives `<Kid kind="a">text</Kid>` and
`<Kid kind="b">…</Kid>`, renaming `UI` gives `<Lib.Box>{n}</Lib.Box>`, as official; the closing tags'
references are their names (`5:22-5:27`, `9:35-9:40`). Corpus: 1,344 files gain 4,197 exact segments.

**Tests.** `svelte2tsx_template_names_map.rs`: `a_components_closing_tag_keeps_its_name_in_place`,
`a_named_slot_components_closing_tag_keeps_its_name_in_place` (both fail without the fix).

### 74. Keep a snippet's name and parameters in place (`6f76c76`)

**Problem** (review 6, major; on the baseline too). `{#snippet cell(x: Size, r: Row)}` becomes
`const cell/*Ωignore_positionΩ*/ = (x: Size, r: Row)…: ReturnType<…> => {` (or `cell:(…) => {` as a
component's implicit prop). The port formatted the name and the parameters into one overwrite of the
opening, so both mapped to its `{`: renaming a snippet from `{@render cell(n)}` left the declaration
behind (references `7:0-7:0`), renaming at the declaration returned no edit, and renaming a type a
parameter uses (`x: Size`, and inside `<Child>` `inner(y: Size)`, `named(q: Size)`) missed every
snippet. Before 63 dropped them, such edits corrupted the text (`rowippet`).

**Change.** The opening is overwritten up to the name, between the name and the parameters, and from
their end, and both keep exact mappings, in the standalone (TypeScript and JSDoc) and implicit-prop
forms. A header whose pieces are not in order inside the opening (a half-typed block) is written as
one string as before.

**Measured.** `rn.mjs` on `cases/component.json`, `template.json` and `multiline.json`: renaming `cell`
from `{@render}` or from its declaration, and renaming `Size` or `Row` that parameters use, edit what
official edits. Corpus: 584 files; 956 snippet names and their parameter lists gain exact segments.

**Tests.** `svelte2tsx_template_names_map.rs`: `a_snippets_name_and_parameters_keep_their_place`,
`a_javascript_snippets_name_and_parameters_keep_their_place` (both fail without the fix).

### 75. Keep an each block's key in place (`74639b9`)

**Problem** (review 6, major; on the baseline too). `{#each rows as row (row.id)}` ends its loop header
with `row.id;`. The port wrote the key as text into the overwrite after the collection, so it mapped to
the start of that text: renaming `id` in `type Row = { id: string }`, or a destructured name used as the
key, missed the key (references `10:11-10:11`).

**Change.** The header is overwritten up to the key and after it, in both forms (the context binding
relocated before the collection, or written out with a `$$_each` temporary), and the key keeps an exact
mapping. A key that is not inside the opening after the binding is written out as before.

**Measured.** `rn.mjs` on `cases/template.json` and `projection7.json`: renaming `id` edits the key
(`(row.ident)`), as official. Corpus: 353 files; 616 keys gain exact segments.

**Tests.** `svelte2tsx_template_names_map.rs`: `an_each_blocks_key_keeps_its_place` (with an index, a
destructured binding, a temporary, an else branch, spaced and empty bodies and a comma collection;
fails without the fix).

### 76. Keep a `style:` shorthand's name in place (`6113352`)

**Problem** (review 6; on the baseline too). A shorthand `style:color` checks its variable with
`__sveltets_2_ensureType(String, Number, color);`. Upstream keeps the directive's identifier range
there; the port wrote the name as text, mapped to the text before it, so renaming `color` left
`style:color` naming a variable that no longer exists.

**Change.** The name is a preserved source range, like a `class:` shorthand's expression already was.

**Measured.** No zeno component uses a `style:` shorthand: code, source maps and exact mappings are
identical. In `cases/shorthand.json` the shorthand comes before a later attribute, which 77 maps (with
69's expansion, see Results, rename).

**Tests.** `svelte2tsx_template_names_map.rs`: `a_class_or_style_shorthand_keeps_its_name_in_place`
(with a modifier and on `<svelte:element>`; fails without the fix).

### 77. Map a directive the opener checks after a later attribute (`6e85421`)

**Problem** (review 6; on the baseline too). An element's `class:` and `style:` directives (and its
`bind:` and transition suffixes) are checked after `createElement(…)`, while the source can spell them
before an attribute the call holds: `<p class:active style:color use:tip {onclick}>`. Upstream's
`transform()` moves such ranges after the others. The port kept preserved ranges only in source order
and baked every later one into the generated text, so `active` and `color` mapped to the start of that
text: renaming either left the directive behind, and references reported a zero-width location at the
end of the opening tag (`14:44-14:44`).

**Change.** An opener applies its segments in place up to the first range out of order, over the tag up
to its last character, and follows them with mapped copies of the remaining ranges
(`MagicString::insert_copy`, patch 65), each with the literals before it as its prefix, before the last
character, whose chunk carries the final literal so that whatever is appended at the tag's end still
comes after. A range that overlaps one kept in place, an action range relocated to the front, or an
earlier copy is still baked, so no source byte maps twice; an opener without room for this is baked as
before. This covers regular elements, `<svelte:element>` and the other openers `emit_opener_segments`
applies.

**Measured.** `rn.mjs` on `cases/shorthand.json` and `projection7.json`: `active` and `color` before
`use:tip {onclick}`, `class:active` on `<svelte:element>` and `bind:this={ref}` before `class=` are
renamed and referenced at their places (the shorthands with 69's expansion in the merged build, see
Results, rename). Corpus: 344 files; 491 ranges (336 of them `bind:this={…}` before `class={…}`) gain
exact segments.

**Tests.** `svelte2tsx_template_names_map.rs`:
`a_class_or_style_directive_before_a_later_attribute_keeps_its_mapping` (shorthand and expression forms,
with an action, on `<svelte:element>` and on a void element; fails without the fix).

### 78. Map the author's text in a repaired `$$ComponentProps` alias (`5cddf8a`)

**Problem** (review 6's problem 7, minor; on the baseline too). Patch 65 makes the alias a copy of the
annotation only when the alias holds the annotation's own text. When script recovery had repaired a
half-typed annotation (`{ a: string; b: }` becomes `{ a: string; b:_}`), the alias stayed plain text
mapped to the `<script` tag: TypeScript's errors about the repair landed there (`diagcmp.mjs
cases/diag2.json`, BadAnnot: 2304 "Cannot find name '_'" at 0:1; BadAnnot2, `Array<string` blanked to
`Array        `: 2314 at 0:1), which patch 43 does not drop (they are not syntax errors), and a rename
or hover inside the half-typed annotation did not reach it.

**Change.** Recovery rewrites bytes in place only, so the alias is the author's text with some bytes
replaced. It is now built from mapped copies of each run the author wrote, with recovery's runs between
them as generated text, wrapped as generated code (`Ωignore`) unless they are blank, so that
TypeScript's complaints about a placeholder are not reported (Svelte's parse error reports the
half-typed annotation). TypeScript reads exactly the text it read before. The review's other option,
copying the author's broken text closed with the brackets it leaves open, was implemented and rejected:
on 6,000 half-typed annotations cut from zeno's components (`afuzz-gen.cjs`, `afuzz-cmp.cjs`),
TypeScript's own recovery ran on into the generated code after the alias in 5 of them (`view(: …`,
`=<>`), losing `$$render`.

**Measured.** `diagcmp.mjs cases/diag2.json`: BadAnnot reports Svelte's parse error only (official:
1110 at `1:28`); BadAnnot2 reports 2314 on `Array`, `1:17-1:22` (official: 1005 at `1:30`). Every zeno
file has identical code, source maps and exact mappings; of the 6,000 half-typed states 137 change,
`$$render` stays intact in all of them (TypeScript 5.9's parser, `tsparse.cjs`), every exact segment is
verbatim and no byte maps twice.

**Tests.** `svelte2tsx_props_alias_map.rs`: `an_alias_of_a_repaired_annotation_maps_what_the_author_wrote`
(a filled placeholder, blanked runs, and an alias kept inside `$$render`; fails without the fix).

### 79. Keep a snippet's type parameters in place (`1517287`)

**Problem** (found while fixing 74; on the baseline too). `{#snippet pair<T extends Size>(a: T, b: Row)}`
becomes `const pair/*Ωignore_positionΩ*/ = <T extends Size>(a: T, b: Row)…`. After 74 the type
parameters were still text between the name and the parameters, mapped to the end of the name:
renaming `Size` missed the constraint (a zero-width reference after `pair`). Official writes them out
too, and its edit there corrupts the opening (`pairDimT extends Size>`).

**Change.** The type parameters are kept in place between `<` and `>(`, when they read as the parser
read them (trimmed, with quoted `<` and `>` skipped); `params_open_paren` and the new range share the
scan for the closing `>`.

**Measured.** `rn.mjs cases/projection7.json`: renaming `Size` gives `pair<T extends Dim>` and lists
`13:25-13:29` among the references (official corrupts the opening and does not list it). No zeno
snippet has type parameters: code, source maps and exact mappings are identical.

**Tests.** `svelte2tsx_template_names_map.rs`: `a_snippets_type_parameters_keep_their_place` (padded
lists with defaults and nested `<…>`, and quoted brackets; fails without the fix).

### 80. Keep an each block's index name in place (`476f489`)

**Problem** (found while fixing 75; on the baseline too). `{#each rows as row, idx (row.id)}` declares
the index with `let idx = 1;` in its loop header. Upstream writes `'let ', [index], ' = 1;'`, leaving the
name in place; the port wrote the declaration as text, mapped to the start of the text before it.
Renaming the index from a use (`{idx}`) left the declaration behind, so the block no longer declared
what its body used (`{#each rows as row, idx (row.id)}<p>{n}`), and references reported a zero-width
location at the block's start. Official renames it.

**Change.** The header is written around the index name as well as the key (75), in both forms: after
the relocated context, and in the text that spells the context with a `$$_each` temporary. Both stay
text unless every one the block has is found in order (`, name` after the context, then the key) before
the end of the opening.

**Measured.** `rn.mjs cases/projection7b.json`: renaming `idx` from `{idx}` edits the declaration, as
official. Corpus: 112 files; 127 index names gain exact segments.

**Tests.** `svelte2tsx_template_names_map.rs`: `an_each_blocks_index_keeps_its_place` (with and without
a key, odd spacing, a temporary and a `$`-prefixed name; fails without the fix).

## 81–82. Real projects: what the official server reports

Found by using svelte-language-server-rs in Zed on four projects (query24-v2, motion-svelte,
SvelteValorantCopilot, zeno), comparing every diagnostic with the official server
(`tests/diagproj.mjs <svelte-language-server-rs|svelte-ls> <root> <files...>`).

### 81. Report what svelte-language-server reports, with the project's compiler options (`30ad93c`)

**Problem.** Two differences from the official server:
- Compiler diagnostics, code actions and code lenses compiled with `CompileOptions::default()`.
  A project with `compilerOptions.experimental.async` in `svelte.config.js` (or inline in
  `vite.config`) got `experimental_async` on every component using top-level `await`
  (rsvelte#4774); a forced `runes` was ignored. query24-v2's sources page: 1 error, official 0.
- Without an `rsvelte-lint.json` the whole recommended eslint-plugin-svelte preset ran.
  motion-svelte: 36 `svelte/no-unused-svelte-ignore` errors from comments such as
  `// svelte-ignore state_referenced_locally - the drag motion values are created once` (the rule,
  like upstream eslint-plugin-svelte, reads the prose as codes; the compiler does not), plus
  `prefer-svelte-reactivity` and `no-navigation-without-resolve`; query24-v2 chat page:
  `require-each-key`, `no-navigation-without-resolve`. The official server reports none of these.

**Change.** `LintConfigCache::compile_options` resolves the nearest Svelte/Vite config's
statically readable `compilerOptions` (`rsvelte_check::config::load_compiler_options`) per
directory, cached and cleared with the other project-config caches (svelte/vite config edits
already clear them). Without a lint config the server runs `compiler_only()`: the recommended
preset with every named rule off, so the compiler's own warnings and errors keep their codes and
severities. A project opts into the rules with an `rsvelte-lint.json` (`{}` = recommended).

**Effect.** query24-v2 sources: 1 → 0 (official 0); chat: 3 → 0 (0); motion-svelte reorder/item,
group, docs search: 41 → 2 (the unused-`T` hint official also gives). Tests: protocol
`without_a_lint_config_only_compiler_diagnostics_are_reported`,
`the_svelte_config_compiler_options_reach_the_compiler`; unit
`without_a_config_only_compiler_diagnostics_remain`,
`compiler_options_come_from_the_nearest_svelte_or_vite_config`. Four protocol tests that test
lint rules now opt in with an `rsvelte-lint.json`.

### 82. Keep SvelteKit's `rootDirs` and a nested project's `baseUrl` (`dd8d4b7`)

**Problem.** The overlay tsconfig's `rootDirs` replaced the project's (it is not merged through
`extends`), dropping SvelteKit's `.svelte-kit/types` root: `./$types` never resolved from a
route's shadow, so `let { data } = $props()` in `+page.svelte` was `any` (query24-v2 setup page:
`TS7006 Parameter '_' implicitly has an 'any' type` ×2, hover `let data: any`). And for a project
whose `baseUrl` is below the mirror root (SvelteValorantCopilot's `apps/client-svelte`,
`"baseUrl": "./src"`), the `*` mapping's shadow twin pointed at the shadow tree's root and
`paths` targets resolved against the config's directory instead of `baseUrl`: every
`baseUrl`-rooted `.svelte` import was `Cannot find module` (5 in current-page.svelte).

**Change.** `overlay_root_dirs` keeps the inherited `rootDirs` with their shadow twins after the
mirror root and the shadow tree; `shadow_twin` maps a path to its place in the shadow tree;
`paths` targets are rebased on `baseUrl` when the project sets one.

**Effect.** query24-v2 setup: hover `data` shows the page's load data, TS7006 gone;
SvelteValorantCopilot current-page: 5 → 0. Unit tests
`a_base_url_below_the_mirror_root_maps_to_its_own_shadow_directory`,
`the_projects_root_dirs_are_kept_beside_the_shadow_tree`. Suites: lib 503, protocol 33,
robustness 30 pass; e2e 41/41 (`docs/measurements/tests/e2e-defaults.json`).

**Remaining difference.** query24-v2 (Svelte 5.40) gets two `state_referenced_locally` warnings
the official server, which runs the project's own 5.40 compiler, does not: rsvelte implements
Svelte 5.57's analysis.

### 83. Run the preprocessors a Vite config names (`8e240d3`)

**Problem.** SvelteKit 2.62+ and vite-plugin-svelte take `preprocess` inline in the Vite config
(`sveltekit({ preprocess: [...] })`), which svelte-language-server reads through
`@sveltejs/load-config`. The sidecar only looked for `svelte.config.*`, so such components were
compiled raw. zeno's `packages/plugin-richtext` uses lexical-svelte's preprocessor for lexical's
`$`-prefixed imports (`$getRoot`, `$insertNodeToNearestRoot`): every editor component reported
`dollar_prefix_invalid`.

**Change.** Per directory, walking up from the component, the sidecar resolves a `vite.config.*`
with the project's own Vite (`resolveConfig`, then the `vite-plugin-sveltekit-setup` or
`vite-plugin-svelte:config` plugin's `api.options`, as load-config does), else imports the
`svelte.config.*`. TypeScript configs and preprocessors work because Vite loads the config. A Vite
config counts only when its text names `preprocess` (Rust discovery and the sidecar apply the same
test): resolving one costs ~150 MB in the sidecar, and without the word it can only add the implicit
`vitePreprocess` for `<style lang>` blocks.

**Effect.** zeno copy: rich-text-editor 1 → 0 diagnostics (official 0); admin components, including
the three with `<style lang="scss">`, 0 (official 0); hover on `$insertNodeToNearestRoot` shows lexical's
signature through the preprocessor's source map. Memory: admin only 303 MB (no sidecar); with
plugin-richtext and ui open the sidecar holds ~200 MB (the official server loads the same in-process).
Edits 12–26 ms. Test: `a_vite_config_that_names_preprocessors_is_a_preprocess_config`; suites lib 504,
protocol 33, robustness 30.

## 84–87. Markup completion and hover, against the official server

Reported from Zed: typing a component's name in the markup (`<MyCom`) offered no completion, and
hovering the `value` of `bind:value` showed no type where the official server shows one.
`tests/regressions/markup-features.mjs <svelte-language-server-rs binary | svelte-ls>` builds a throwaway project
from `tests/regressions/tpl` and asks both servers the same hovers and completions (including
`completionItem/resolve`, where auto-import edits arrive); after these patches every answer matches.

### 84. Complete a component's name as it is typed (`804e8cc`)

**Problem.** The start-tag classification counted a component's own name as the whitespace after it,
so `<MyCom` replaced TypeScript's list (the imported component and every component it can
auto-import) with the component's props and directives, which the editor filtered to nothing.

**Change.** `start_tag_completion_site` (a function of text and offset, split out of
`Server::completion_site`) narrows only where upstream's `mightBeAtStartTagWhitespace` holds
(`CompletionProvider.ts:252-283`, `:316-320`), and counts a dotted tag (`<ui.Button`) as a
component, as the Svelte parser does.

**Effect.** `<MyCom` offers `MyComponent` and `<OtherWid` offers `OtherWidget` with its import
(placed by 86) (1,061 items; official 1,001 / 1,002, the same two offered); `<` still answers the 131 HTML tags,
as official does. Test: `start_tag_completion_site_tests::a_component_name_being_typed_is_not_narrowed`.

### 85. Leave an HTML attribute without a description to TypeScript (`67c53cd`)

**Problem.** Hovering `placeholder` on an `<input>` showed only a browser-support badge; official
shows `(property) placeholder?: string | null | undefined`. The web data has no description for
it, and `getAttrHover` (`htmlHover.js:49-69`) answers only for an entry with one, so the official
HTML plugin answers null and TypeScript answers.

**Change.** The native attribute hover requires a description (the last entry that has one, as
upstream's loop keeps the last).

**Effect.** `placeholder` hovers with its type; `class` and `hidden` keep their HTML descriptions.
Test: `hover::tests::an_attribute_without_a_description_has_no_html_hover`.

### 86. Place a completion's new import after the last import (`4164fa6`)

**Problem.** Found while checking 84: accepting any completion that adds an import (an auto-import in
the script, or a component typed in the markup) inserted it at 0:1, inside `<script`, splitting the
tag. tsgo inserts at the start of the generated line after the shadow's last import, which
svelte2tsx's own code fills (`function $$render() {`), so the position maps to nothing useful.

**Change.** `take_new_import_edits` takes a resolved item's new-import edits out before the response
is mapped and places them as `CompletionProvider.codeActionChangeToTextEdit` (`:1087-1183`) does: on
the line after the source of the generated line before the import; at the start of the script body
(the one the completion was asked in) on a line of its own when that maps nowhere in a body or to the
document's very start; in a new `<script>` for a component without one.

**Effect.** Completing `OtherWid` in the script and `<OtherWid` in the markup both insert the import
at 2:0, after the existing import, as official does (official indents it with four spaces from its
formatting defaults). Tests: `tsgo_completion::tests::a_new_import_goes_after_the_last_import`,
`a_first_import_opens_the_script_body`, `a_component_without_a_script_gets_one`.

### 87. Map a `bind:` directive's name to the property it becomes (`19161a7`)

**Problem.** svelte2tsx turns `bind:value={x}` into `"bind:value":x` on an element and `value:x` on a
component; the key was written as a literal, so the directive name had no mapping of its own. Hover
on an element's `bind:value` answered nothing (official: `(property) 'bind:value'?: any`); on a
component's it answered for the nearest mapped chunk, the component (`(alias) const MyComponent…`;
official: `(property) value: boolean`).

**Change.** `push_bind_name` keeps the name as an unedited source chunk, as upstream `Binding.ts`
pushes `[attr.start, …]` (element, with the `bind:` prefix) or `[attr.start + 'bind:'.length, …]`
(component); a name the source does not spell that way stays a literal, and so does a shorthand
element binding's key (`bind:files`), whose text is the expression's and keeps its mapping (upstream
writes that key as a literal too). The component props builder had its own copy of the binding
logic; it now calls `format_component_bind_directive_segments`. Generated code is unchanged: only
the source map gains the names.

**Effect.** Both hovers match official, and so do TypeScript errors on a binding: for
`<MyComponent bind:nope={on} />` and `bind:value={n}` (wrong type) svelte-language-server-rs now reports at 7:19 and
8:19, the prop name, as official does (before: 7:15 and 8:15, the directive). An unknown element
binding (`<input bind:valu={on} />`, TS 2353) is reported at the directive, 9:8 (before 9:1); official
reports 9:17, the `=`, where its quote insertion anchors. Twelve zeno admin components that use
`bind:` report the same diagnostics as official (none) through `tests/diagproj.mjs`. zeno corpus
(`tests/regressions/projection/corpus.sh`, every component, before and after): 4,744 files (`node_modules` included) project to byte-identical code; 335 maps differ, and
`exactdiff.py` counts 2,630 source bytes newly mapped (506 runs right after `bind:`) and none lost.
Tests: `svelte2tsx_bind_name_map.rs` (element key, component prop, a shorthand element binding
keeps its expression's mapping, unchanged output); `cargo test -p rsvelte_projection`: 870 tests in 117 targets (1 ignored), the 866 before and these 4.

Suites after 84–87 (`vendor/rsvelte` `19161a7`): lib 510 (1 ignored), protocol 33, robustness 30;
`tests/regressions/runall.sh` on the installed build, `docs/measurements/tests/regressions-markup.txt`
(against the last recorded run, 42 of 46 scripts identical; the rest lose only lint warnings patch 81
made opt-in, or differ in timing order);
`cargo fmt --all --check` clean, and clippy adds no warning. `463cb3b` gives the two protocol tests
that shared a directory one each (one deleted the other's `rsvelte-lint.json` once under load).

## 88–89. Import quick fixes, against the official server

Found checking 86: for `<OtherWidget size={1} />` with no import, official offers
`Add import from "./OtherWidget.svelte"` on the `Cannot find name` diagnostic, svelte-language-server-rs offered no
code action at all; and a script's `Add import` quick fix put the import after the first import's
indentation. `tests/regressions/markup-features.mjs` asks both servers for both quick fixes.

### 88. Place a quick fix's new import like a completion's (`14e76f7`)

**Problem.** For `helper()` in a script with no import, tsgo inserts the import at the start of the
generated line of the script's first import; mapped like any other position, it landed after that
line's indentation (1:1), leaving the existing import unindented. Official inserts at 1:0.

**Change.** Official places an import fix's edits with the function it uses for a completion's
(`CodeActionsProvider.convertAndFixCodeFixAction` calls `codeActionChangeToTextEdit`).
`take_new_imports` takes each code action's new-import edits out before the response is mapped,
places them with 86's placement, and `restore_new_imports` puts them back under the source
document. A new import tsgo puts before an existing import (whose generated line before it is
svelte2tsx's `;`) takes the start of that import's own source line. A component without a `<script>`
is still wrapped by `wrap_import_edits_in_script`.

**Effect.** The fix inserts at 1:0, as official does. Test:
`tsgo_code_actions::tests::a_code_actions_new_import_is_placed_like_a_completions`.

### 89. Offer a component tag's missing import as a quick fix (`a47574e`)

**Problem.** TypeScript's import fix needs the missing name to be the export's own, and a
component's default export carries svelte2tsx's suffix (`OtherWidget__SvelteComponent_`), so tsgo
answers no fix for a component tag (tsrs returned `[]`; plain TypeScript files get theirs).

**Change.** As official (`CodeActionsProvider.getComponentImportQuickFix`, `:1016-1112`), the fix is
made from the auto-import completion at the tag. `component_import_sites` finds the request's
`Cannot find name` diagnostics on tag names (the argument of `__sveltets_2_ensureComponent`, outside
any script; a candidate that is not a tag name means none, as upstream gives up there). tsgo's answer
is held while a completion follow-up per tag and a resolve per matching item (its name, bare or
suffixed) are asked, the store-references pattern; each resolved item makes an `Add import from "…"`
fix, nearest module first. These replace tsgo's own quick fixes (both kept for a "did you mean"
diagnostic, 2552), other kinds stay, and the answer is mapped like tsgo's, so 88 places the import.
Follow-ups time out and are cleared on a tsgo restart like the store-references ones.

**Effect.** `<OtherWidget size={1} />`: `Add import from "./OtherWidget.svelte"` at 2:0, as official.
`Select` with its import removed in a copy of SvelteValorantCopilot's `hotkeys.svelte` (a "did you
mean" diagnostic): the same component fixes at the same line as official (`bits-ui`, the alias,
`./select.svelte`), then tsgo's own; the alias specifier differs (below), and the edits keep the
file's CRLF line ending where official writes `\n`. Tests: robustness
`a_component_tag_without_an_import_is_offered_one` (a fake tsgo that answers no fix, completes the
suffixed component and resolves its import; fails without 89), unit
`a_component_tags_missing_name_is_an_import_site`, `only_tag_names_are_import_sites`,
`a_resolved_component_completion_makes_an_import_fix`. Suites: lib 514 (1 ignored), protocol 33,
robustness 31; 88 alone passes lib 511, protocol 33, robustness 30. `runall.sh` on the installed build:
`docs/measurements/tests/regressions-quickfix.txt` (against 84–87's run, every script the same but
the extended `markup-features` and `slowmix`'s arrival order).

## 90–92. Typing a tag after a component and in an open element

Reported from Zed: at the end of a component (taasc's `agents-section.svelte`, whose last tag is
`<ConfirmDialog … onconfirm={() => (removing ? … : false)} />`), typing `<` offered `/ConfirmDialog`
first, and typing on never offered a component. `tests/regressions/markup-features.mjs` now asks both
servers for `<` after such a tag; on a copy of taasc both answer the same 131 HTML tags, incomplete,
and both offer the components at `<C`.

### 90. End a start tag at its own bracket (`7d5d105`)

**Problem.** The scanner behind the close-tag suggestions ended a start tag at its first `>`, here the
arrow's, so it never saw the `/>` and took the component for an open ancestor.

**Change.** `scan_open_tags` reads tags as upstream's `parseHtml` (`lib/documents/parseHtml.ts`) does:
`start_tag_end` reads a `{…}` value, spread or attachment, a quoted value (and the `{…}` in it) and a
`//` or `/* */` comment whole; a `{…}` in text is an expression, where `<` opens no tag; a `<script>` or
`<style>` body is raw text, so `$state.raw<User | null>(null)` in the script is no open `<User>` (it
would have become the suggestion once the component was read correctly).

**Effect.** No close tag after the self-closed component, as official. Test:
`completions::tests::a_tag_ends_at_its_own_bracket` (before: `/Confirm`).

### 91. Answer a bare `<` with an incomplete list (`f106a8f`)

**Problem.** The list for `<` (the HTML tags) said it was complete, so Zed filtered it as the name was
typed instead of asking again, and the HTML tags hold no components. Official's list for `<` is
incomplete: a bare `<` is a Svelte parse error, its TypeScript plugin answers a document it cannot
parse with an incomplete list (`CompletionProvider.ts:303`, `:451`), and `PluginHost.ts` ORs the flag.
rsvelte's projection accepts the bare `<`, so no parse error reached the server.

**Change.** The native list after a bare `<` is incomplete; the merge with tsgo's answer keeps the
flag (`merge_tsgo_result` ORs it).

**Effect.** `<` answers 131 HTML tags, incomplete, as official; the next keystroke asks again and
`<C` offers the components. Test: `completions::tests::a_bare_open_bracket_answers_an_incomplete_list`.
Suites after 90–92: lib 516 (1 ignored), protocol 33, robustness 31; 90 alone passes lib 515.
`runall.sh` on the installed build: `docs/measurements/tests/regressions-tags.txt` (against 88–89's run,
every script the same but the extended `markup-features` and `slowmix`'s arrival order).

### 92. Show a close tag on a line of its own in Zed (`7bb0083`)

**Problem.** Reported from Zed: inside an open `<div>`, `<` (or `</`) on a line of its own offered
no `/div`. Both servers send it, as `collectCloseTagSuggestions` makes it: an edit of the line's
indent and `<` (giving the close tag its ancestor's indent), filtered by `{indent}</div`. Zed filters
an item by the buffer text from its edit's start to the cursor (`\t<`) against its label (`/div`),
using `filterText` only where the label contains it (`code_context_menus.rs` `do_async_filtering`,
`language.rs` `CodeLabel`), so the item never showed; on the open tag's own line it did.

**Change.** A deliberate difference from upstream's item shape: the edit starts after `<` on every
line, filtered by `/div`, and the ancestor's indent is an `additionalTextEdits` edit of the indent
alone. Accepting it writes the same text.

**Effect.** With Zed's filter applied to each server's items (`<` and `</` on a line of their own,
nested, after text, on the open tag's line), every svelte-language-server-rs close tag is shown; official's are
hidden on a line of their own. Test: `completions::tests::a_differing_indent_is_fixed_in_its_own_edit`.

## tsrs issues (outside our control)

* **Memory kept after every full program build.** tsrs frees its program owners
  (`TSRS_REGION_LOG`: created/freed pairs) but keeps about 360 B per program file plus about
  70 B per import per full `CreateProgram` (arena reservation and mimalloc heap, never returned;
  `MIMALLOC_PURGE_DELAY=0`/`MIMALLOC_PURGE_DECOMMITS=1` and `disablePushDiagnostics` change
  nothing). tsgo's GC reclaims the same builds (flat at about 265 MB in the same loop). Repro:
  `docs/measurements/bench/patches-evidence/tools/tsrs-leak-repro.mjs <root> <file.ts> 200 50` with
  `MODE=import` (import-set edits) or the default open/close of a new file under the include,
  against `TSRS=<tsrs>` and a tsgo binary; a synthetic 1,001-file project grows 42 → 316 MB per
  200 open/close iterations on tsrs and stays near 100 MB on tsgo; content-only edits do not
  grow. Workaround in rsvelte: patch 2 — full builds now happen once per project load and on
  edits that change a file's import set, file creations/deletions and config changes, not once
  per component. Should be reported to oxc-project/tsrs.
* **A completion or signature help request that never finishes.** tsrs 0.18.0 never answers one
  whose walk back over type-argument tokens (`getPossibleTypeArgumentsInfo`) reaches a `}`, `)` or
  `]` while the text's last opener of that kind comes after its last closer: the port's
  `findPrecedingMatchingToken` searches the whole text for the opener, so the walk jumps forward and
  comes back for good, one core busy, `$/cancelRequest` ignored (the walk starts only if the text has
  a `<` anywhere). Minimized: `}i<{`, `<}{`; measured on 470 requests. typescript-go
  7.1.0-dev.20260930.4 does the same, so the bug is probably in its port. Standalone repro, the
  probe, its cases and results: `docs/upstream/tsrs-lost-request/` (`node repro.mjs [server]`,
  `node loopprobe.mjs cases.json`); not filed. Workaround: patches 44–45, narrowed by 50 and 59–62,
  with 68's restart when tsgo stops answering behind the model (67).
* **A cancelled check is done anyway and thrown away.** A `$/cancelRequest` for a diagnostic pull
  whose check takes seconds does not stop it: tsrs answers the pull (RequestCancelled) when the check
  is done and keeps nothing of it, so the next pull checks again (6.8 s twice for the 6-alias module
  of `slow.mjs`, where after an uncancelled pull the next one is instant). Pulls run one after the
  other, a pull of another file waiting for the slow one, while hovers, code actions, inlay hints and
  semantic tokens are answered at once. `docs/upstream/tsrs-cancelled-check/repro.mjs`; not filed.
  Patch 50 therefore never cancels a pull for taking long; an editor that cancels its own stale pulls
  still costs tsgo the check.
* **One snapshot update per `didOpen`.** tsrs (like tsgo) handles queued `didOpen`s one at a
  time, each with a full snapshot clone; merging consecutive opens would make diskless buffers
  cheap. No longer on our path except for JavaScript components (about 3 ms each, on disk) and
  brand-new unsaved files.

## Not done / follow-ups

* **Report upstream** (none filed yet; see "tsrs issues" above): tsrs's memory kept after every full
  program build (oxc-project/tsrs; repro `docs/measurements/bench/patches-evidence/tools/tsrs-leak-repro.mjs`);
  the completion / signature help request that never finishes (oxc-project/tsrs and, since
  typescript-go 7.1.0-dev.20260930.4 behaves the same, microsoft/typescript-go; standalone repro,
  the probe and its 470 measured requests, the mechanism (`findPrecedingMatchingToken` searching the
  whole text) and draft notes in `docs/upstream/tsrs-lost-request/`); and the cancelled diagnostic pull
  that is checked to the end and thrown away, with pulls of other files queued behind it
  (oxc-project/tsrs; `docs/upstream/tsrs-cancelled-check/`, repro, result for tsrs 0.18.0 and notes).
  Once tsrs answers a cancelled pull at once, or keeps its result, patch 50's rule (never cancel a
  pull for taking long) can be revisited; once the lost request is fixed, patches 44–45's restart can
  go.
* **Import specifiers and two quick fixes come from tsrs** (found checking 89): for a component under a
  `paths` alias (`"$ui/*": ["components/ui/*"]` with `baseUrl: ./src`) official writes
  `"$ui/select"`, svelte-language-server-rs `"components/ui/select/index"`; plain tsrs on the project's own tsconfig
  writes `"./components/ui/select"`, so the overlay config (82) changes tsrs's choice but neither is
  official's. Completions' auto-imports have the same specifiers. tsrs also offers no `Add missing
  function declaration` or `Change spelling` fix where TypeScript 5 does.
* **The order of TypeScript's items at `<Con` right after a tag on the same line** (found checking 91):
  after `/><Con` official ranks the file's imports first (its TypeScript position falls in a different
  context there), on a new line it ranks them like svelte-language-server-rs (auto-imported components first). Both
  offer every component.
* **Two binding diagnostics differ from official** (found checking 87; both before and after it): a
  Svelte analysis error without a position, `bind_invalid_name` for `<input bind:valu={on} />`, is
  reported at 1:1 with an `Analysis error: bind_invalid_name:` prefix (official: at the directive,
  the bare message); and binding a component prop that is not `$bindable` reports TypeScript's raw
  `Type '"nope"' is not assignable to type '"value"'` on the generated `$$bindings` line (official
  rewrites it to `Cannot use 'bind:' with this property…` at the directive).
* **A cursor right before a start tag's `>` or `/>` is not in the tag.** `start_tag_context` answers
  `None` for `<Comp |>` and `<Comp |/>`, so completion there is treated as template text; upstream
  narrows to the component's props. `<Comp | />` (a space after the cursor) works.
* A diagnostic pull tsgo never answers is never answered (patch 50; none is known): the editor keeps
  the previous diagnostics and the background does not wait for it, but nothing restarts tsgo. Patch
  68 leaves pulls out of its liveness rules (a check may take that long) and holds back those rules
  for requests about a document while its pull is with tsgo, so a tsgo that hangs inside a check is
  restarted only once the editor asks it about another document; a bound far above any real check
  would cover the rest.
* Completion and hover still send their tsgo half after the native one (patch 28's wait, now
  about a millisecond on the quick lane, patch 41). Sending it at once as well would need the
  native answer's effect on the tsgo half (a hover the worker answers; a completion at a block
  marker, whose tsgo items are dropped) applied when the two are joined.
* Patch 46 respells only copies' `#` specifiers; a plain module of another package in the program
  resolves its own through the project's `paths`. Respelling every component shadow and dropping
  package imports from the overlay `paths` would scope all of them. A `package.json` change does not
  re-project the copies whose specifiers it respells.
* Patch 48 closes only the instance script's hoisted copies. A `<script module>` is emitted verbatim
  at the top, as official svelte2tsx does, so a bracket left open at its end can still run into the
  instance script's header.
* The first request per document that tsrs loops on is still sent (patch 62 holds back only the
  others while it is pending), so the editor waits the timeout for it and tsgo restarts, which
  rebuilds every loaded project. `tsgo_loop` finds every measured loop with 5 false signature helps
  next to a call's parentheses and one `.tsx` type assertion in 470 requests, so not sending any request it flags
  (answering at once without tsgo) would cost almost nothing and spare the wait, the busy core and the
  restart; the restart would then only back up the model.
* `tsgo_loop` reads TypeScript's tokens from the text, not tsgo's syntax tree: where a `/` starts a
  regular expression (taken from the token before it, patch 67: one right after a statement's `)`,
  `if (r) /'/`, is read as a division, and tsrs loops there), where a template substitution's
  expression really ends (taken as the `}` that closes it, or a `;`; patch 64), JSX in a `.tsx` file,
  `>>`/`>=` (one `>` for the scanner, rescanned by the parser) and the call contexts where signature
  help does not walk are approximated, and whether `called` names a generic function (which ends
  completion's second walk) is taken as never. A loop it misses is answered at the timeout and
  cancelled; patch 68 restarts tsgo once it holds tsrs back (no answer for a timeout, or three
  requests overdue) or, a completion or signature help, after four timeouts, so until then it keeps
  a tsrs worker busy (the fuzzers found one before 67, two reviews found more).
* The sixth review's problems 3 and 7 (author text the port wrote into the template, or into a
  repaired props alias, as unmapped text) are fixed by 73–80 for every construct the review and the
  projection engineer found, but one: a `let:` directive's name (`<List items={rows} let:item>{item}</List>`)
  is still written as text in the `$$slot_def` destructure, so renaming `item` from `{item}` gives
  `let:item>{entry}` (the body then reads a name nothing declares; official: `let:item={entry}`), and its
  references and definition are zero-width at the start of the component's attributes (`14:17-14:17`;
  `cases/projection7b.json`; on the baseline too). Mapping the name alone is not enough: tsgo's edit
  there would be `item: entry`, which the language server would have to turn into `let:item={entry}`
  (patch 69 expands a `let:` shorthand only when tsgo answers with the plain new name), so it needs the
  projection and the language server changed together. Until every copy is mapped, a rename that 55 or
  63 trims is silently partial (the review suggested a `window/showMessage` warning naming the
  occurrences that could not be placed), and references and highlights can report zero-width
  locations (dropping locations whose source text differs from the shadow's, as 63 does for edits, was
  suggested too); neither is done.
* A component's references list the names in its closing tags (patch 73; zero-width at their `<`
  before), which official omits, and do not follow a re-export: `<UI.Box>` where `ui.ts` has `export {
  default as Box } from "./Child.svelte"` is not among `Child`'s references, which official lists, and
  its definition is the component's `0:0` (official: `0:1`; `cases/component.json`, on the baseline too).
* Go to definition from a `$store` use finds nothing (tsgo's answer is the generated `$store`
  declaration, which is dropped); official goes to the store's declaration. A follow-up like patch 71's
  would fix it (on the baseline too).
* Patches 65, 66 and 78 map the props alias (also one script recovery repaired) and a `generics` value
  back exactly. One copy in the render header still is not: a JavaScript component's `/** @template T
  extends … */` (it maps to 0:1; the port's text already differs from official svelte2tsx, which emits
  the names only and does not map them either; no zeno component has one). There patches 55 and 63 keep
  a rename from corrupting the component, but the copy's own edit is missing, and references and
  highlights report the approximate location or none.
* Patch 65's `insert_copy` places the copy before a later `append_left`/`prepend_right` at the same
  index instead of after it (see its Risks); no input is known to do that. Patch 77 inserts its copies
  before an opener's last character, whose chunk carries the final literal, so that what is appended at
  the tag's end still comes after them.
* Patch 72 maps a diagnostic that starts in the text before a copy to the copy's source. 77 and 78 put
  such text before many more copies (the literals before an opener's moved directives, recovery's runs
  inside a repaired alias). In `cases/diag3.json`, which puts an error at each of them, the merged build
  reports exactly what the projection branch reports (every error starts on the copy), and e2e is
  identical to both branches; an error TypeScript reports on such a literal itself (the generated
  `__sveltets_2_ensureType(…` around a `style:` value, say) would land on the directive's start instead
  of being dropped, which no test covers.
* `RSVELTE_TSGO_REQUEST_TIMEOUT_MS` defaults to 30 s (patch 44), longer than `lsfuzz.mjs`'s own 15 s
  check, which therefore still reports the lost request while the server is waiting it out; with
  10 s both seeds run clean. A shorter default would also cut short legitimately slow first builds.
  Diagnostic pulls never expire (patch 50).
* tsgo's UTF-8 positions are turned into shadow offsets with lines counted at `\n` alone, as before
  patch 54 (which kept that), but tsrs also breaks a line at a lone `\r` (checked: an error after
  `let a = 1;\r` is reported on line 1), as LSP and TypeScript do; a component with old Mac line
  endings would have tsgo's positions after its first lone `\r` mapped wrong (on the baseline too).
* A diagnostic pull of another file waits behind a slow one in tsrs (see "tsrs issues"); the server
  forwards both as they come.
* A component opened from `node_modules` is served from an inferred project without the Svelte
  shims (patch 13): `Cannot find name 'svelteHTML'`, as on the baseline.
* zeno's plugin-richtext components get a compiler `dollar_prefix_invalid` analysis error for
  lexical's `$`-prefixed imports (compiler crate, not these patches).
* Half-typed documents patches 22–25 do not recover: a multi-line generic `<…>` left open in the
  script (99 of 708,719 zeno mutations; the imports are lost, as before); a mustache left open
  before a closing tag (`<p>{a.</p>`, rejected by official svelte2tsx too, so script-only as
  upstream; with editor auto-closing, `{a.}`, template completions work: e2e 4i); an opening tag
  typed right above a self-closing tag (`<div class="x"` before `<Child />`, read as attributes of
  a self-closed `<div>`, as upstream's loose parser does). 146 loose-parse failures remain in the
  zeno closing-tag-removal set (every one in the admin sample is also an upstream failure), and an
  element implicitly closed at the end of the input ends one character off (AST parity only).
* The upstream compatibility gates (svelte2tsx-verify, the parse-AST loose axis, check-verify,
  parser fixtures, validator, audit_skipped) need the language-tools and svelte submodules, which
  are not checked out; patches 22–25 were checked against official svelte2tsx 0.7.61 and Svelte
  5.56.8 directly instead.
* A JavaScript component reachable from an open document still costs one `didOpen` (patch 16): a
  JavaScript-heavy project whose page reaches hundreds of them pays that at first open.
* `bench/bench.mjs` and `bench/typing.mjs` report ps RSS, which macOS compression makes
  unreliable; the footprint numbers come from `patches-evidence/tools/bench-fp.mjs` and
  `bench/allprojects.mjs`.
* A tsgo answer is mapped back with the projection current when it arrives (also on the baseline).
  When an edit lands while a request is with tsgo, the ranges of the answer for the previous version
  (a hover's range, a completion's text edits, a pull's diagnostics) can be off by the edit, though
  its contents are right; patch 28 only makes sure the request reaches tsgo before the edit. Keeping
  each in-flight request's projection map would fix it.
* Patch 30 relies on tsgo taking a change reported under a package directory's real path for its
  mirror link's path, which tsrs does (`r6e-nested-install.mjs`); translating such events onto the
  link's path as well would not depend on it.
* tsgo replaces its auto-import watchers by unregistering and registering the same patterns, so the
  editor can see up to 3 unregister/register pairs in a session (e2e: 15 registrations and 3
  unregistrations in one session, 12 and 0 in others). Holding unregistrations back would avoid it.
* A no-break space directly after a component's tag name (`<Child\u{a0}a={1} />`) is not taken as
  the whitespace to delete, as upstream's `/\s/` does (patch 37): the generated whitespace differs,
  nothing else.
* The language-server engineer's first version of patch 36 also kept recovery from writing the line
  break for a missing semicolon, and an unfinished import's quotes, into a multibyte character. No
  input is known to need it (the fuzz campaigns found none after patch 36), so it was dropped in
  favour of the projection branch's version; it was kept as an unapplied patch in that session's
  scratchpad (`r2/0001-fix-projection-never-write-a-repair-into-a-character.patch`).
* The svelte-language-server-rs build relies on the root workspace's `panic = "unwind"` for patch 35 (and for the
  analysis worker's own `catch_unwind`). rsvelte's `release` profile aborts on a panic, so a
  language server built from `vendor/rsvelte` directly must use its `dist-lsp` profile.

## Tests

`cd vendor/rsvelte && CARGO_TARGET_DIR=…/target-rsvelte-tests cargo test -p
rsvelte_language_server --no-fail-fast`: 499 unit tests (1 ignored), 31 protocol, 30 robustness,
2+2+3 others pass at `3c82cbc` and `c921b00`, and each of 67–72 passes the unit, protocol and robustness tests on its
own (`git rebase -x`); 494 and 25 at `8c8c100` and `245dbfb` (480 and 23 at `7179942`, 477 and 19 at `670722d` and `1d4cb87`, 472
and 17 at `7793da7`, 471 and 16 at `42d8d9e`, 468 and 13 at `8b7902f`).
`tests/upstream_fixture_manifest.rs` fails 5 of 7 before and after these patches: it needs the
`submodules/language-tools` checkout, which is not present. For the projection and parser patches,
`cargo test -p rsvelte_projection --no-fail-fast` (866 tests in 116 targets, 1 ignored, at `c921b00`, and
each of 73–80's tests fails without its fix; 856 in 115 at `8c8c100`;
847 in 113 at `670722d` and `7179942`; 839 at `7793da7`, 823 at `8b7902f`) and `cargo test -p rsvelte_core --lib --test
loose_await_branch_without_a_binding --test loose_opening_tag_read_as_attribute --test
loose_block_closed_by_an_element` (1,980 + 5 + 6 + 4) pass, as does `cargo test -p rsvelte_check`
(279); rsvelte_core's `parser_fixtures`, `validator` and `audit_skipped` need the absent svelte
submodule. `cargo fmt --all --check` is clean at `8c8c100`, `3c82cbc` and `c921b00`; `cargo clippy --all-targets` on the
projection and the language server reports only the four warnings the branch has had since `7793da7`.

New tests cover body persistence, rewrite and deletion, the orphan sweep, editor buffers in
refreshes, ownership (nearest config, configless roots, jsconfig), deferred loading, alias and
transitive copies, owner-over-copy routing (both overlay orders), path-scoped file events, the
`node_modules` mirroring, parallel versus sequential projection, the late-preprocess-config
protocol path, and a fake-tsgo robustness test that a document opens only its own project and
everything else is read from disk (`a_document_loads_only_its_own_project_and_the_rest_is_read_from_disk`).
Patches 8–21 add a test each (named in their sections); the protocol-level ones run the server
against a fake tsgo that records its traffic (`traffic_recorder` in `tests/robustness.rs`).

Evidence tools (`docs/measurements/bench/patches-evidence/tools/`): `runbench.sh` (bench through the lock,
appends a tagged line), `diagcmp.mjs`/`diagall.mjs` (open each listed file, pull until stable),
`e2e.mjs` (11 freshness steps against a real tsrs on a throwaway copy of `../e2e-project`, which
needs a `node_modules/svelte` copied in), `bench-fp.mjs`, `tsrs-leak-repro.mjs`. Round 2 adds
`bench/allprojects.mjs` (memory and `workspace/symbol` coverage with every project loaded:
`open-all`, `background`, `lazy`), `bench/probe.mjs` (component-attribute completion cost),
`BACKGROUND=0` for `bench/bench.mjs`, and the reviewer's reproductions in `tests/regressions/`
(`sh tests/regressions/runall.sh <binary> <label>` runs s1 s1b s2 s3 s4 s7 s8 s10 s11 and
incomplete-edits; s5 [ts|js] [N] [chain|flat], s6 and s9 [copy-first|owner-first] run on their own).
Round 2's merge adds `bench/typing.mjs` (typing and completion latency, above), `bench/final.sh`
(both benchmarks for both servers, interleaved, appending to `docs/measurements/bench/final.jsonl`;
`SCENARIOS=typing`, `EXTRA_TYPING_BIN=<binary>:<label>`), and `SYNC_SAMPLER=1` for `bench/bench.mjs`
(the old synchronous memory sampler). The round-3 e2e records are `docs/measurements/tests/e2e-merged.json`,
`e2e-baseline-final.json` and the two `e2e-compare-*merged.txt` files; `node tests/e2e.mjs both`
would overwrite the round-1 `e2e-baseline.json`/`e2e-patched.json`, so they were run with `--out`.
The second review's reproductions are in `tests/regressions/` too, and `runall.sh` now also runs
them: `r1-depkill`, `r1b-close` (patch 29), `r2c-format` (27), `r2d-hover` (27, 28),
`r2e-hover-edit-race` (28), `r5-crash` (patches 32–40; any number of inputs or directories after
`<tpl>`), `r6-watchers` (26); `r6b-install` and `r6e-nested-install [real|link|none]` (30) run on
their own. Patches 26–30's e2e record is `docs/measurements/tests/e2e-round2-ls.json`. The merge `7793da7` has
`docs/measurements/tests/e2e-round3-merged.json`, the baseline's run of the same session
`e2e-baseline-round3.json`, and the comparisons `e2e-compare-round3.txt` (baseline against merged) and
`e2e-compare-round2-ls-vs-round3.txt`. `bench/final.sh` now takes `VARIANT` (tags every line it
appends) and `EXTRA_BENCH_BIN=<binary>:<label>`, which adds another svelte-language-server-rs build to the `bench.mjs`
runs as `EXTRA_TYPING_BIN` does to the typing runs. The third review's tools are in `tests/review3/`
(`node tests/review3/<script>.mjs <binary> tests/review3/tpl [args]`); `runall.sh` now also runs four
of them from `tests/regressions/`: `hashscope` (46), `start-of-file2` (43), `style-open` (42) and
`bigtype` (41; `<N>` as a third argument, default 1500, prints completion p50/p95 and the final
diagnostics while typing in an N-line component). `tests/review3/lsfuzz.mjs <binary> <tpl> <seed>
<iterations>` (with `THIRD=1 NO_WS=1 INIT_SLEEP=600 LONG_SLEEP=700 CANCEL=1`) reproduces 44–45.
Round 4's records: `docs/measurements/tests/regressions-round4-ls.txt`, `e2e-round4-ls.json` and
`e2e-compare-round3-vs-round4-ls.txt`. For 47–49, `runall.sh` also runs `start-of-file` (48, 49),
`r5-crash` over `tests/regressions/crash-inputs/` (47: `{#each <script </script>`, its unminimized
original, and `<div title="<script </script>">`) and `recover-pos` (48, 49; 377 states, prints the
number of position problems and `atStart`, the diagnostics at 0:1; 300 s timeout). The final
records: `docs/measurements/tests/regressions-final-670722d.txt` (runall, crash inputs, start-of-file and recover-pos
at the earlier builds, bigtype, lsfuzz, first-open pairs), `e2e-final-670722d.json`,
`e2e-compare-round4-ls-vs-final-670722d.txt`, and the `final`, `final-b` and `allprojects` lines of
`docs/measurements/bench/final.jsonl`.

Round 5 (patches 50–54) adds the fourth review's scripts to `tests/regressions/` and `runall.sh`:
`slow.mjs <binary> <tpl> [aliases] [ms]` (a component reading every export of a module whose check
takes seconds; `EDIT_EVERY=<ms>` edits and pulls again; prints when TS2322 first arrived, the
"did not answer" lines and the restarts; `runall.sh` runs 6 aliases with a 3 s timeout) and
`burst.mjs <binary> <tpl> [lines] [symbol|folding|inlay|semantic|codeLens] [keys]` (a document-wide
request with each keystroke in a large component; latency, errors, restarts; `runall.sh` runs
folding with 30 keys and symbol with 20). `docs/upstream/tsrs-cancelled-check/repro.mjs` shows how
tsrs treats a slow pull and its cancellation. Round 5's records: `docs/measurements/tests/regressions-round5-ls.txt`,
`e2e-round5-ls.json`, `e2e-compare-final-670722d-vs-round5-ls.txt` and the `round5-ls` lines of
`docs/measurements/bench/final.jsonl`.

Round 6, language server (patches 55–64) adds the fifth review's scripts to `tests/regressions/`:
`propsrename.mjs`, `hashrename.mjs` and `generics.mjs` (renames, references and diagnostics around the
props annotation and a `generics` value), `slowsig.mjs <binary> <tpl> [aliases] [signature|definition]
[ms]` and `slowmix.mjs <binary> <tpl> [aliases] [kinds] [ms]` (requests on a component whose check is
slower than the timeout: when TS2322 arrives, restarts), `loopstorm.mjs <binary> <tpl> <file> [ms]
[every]` (a signature help every `every` ms at a state tsrs loops on, `loop-inputs/loop22.svelte`, and
a hover on another component every second: hover latency, tsrs CPU, restarts) and `lsfuzz2.mjs
<binary> <tpl> <seed> [iterations]` (lsfuzz with random cancellations, exactly-one-answer accounting
and a final comparison against a fresh server; `STDERR_OUT=<file>`). `runall.sh` runs the first
three, slowsig and slowmix with 6 aliases and a 3 s timeout, and loopstorm for 40 s with a 5 s
timeout. `docs/upstream/tsrs-lost-request/loopprobe.mjs` with its `cases.json` measures which
requests tsrs loops on (the data behind `tsgo_loop`'s test), and `minimize.mjs` reduces a text it
loops on. Round 6's records:
`docs/measurements/tests/regressions-round6-ls.txt` and `e2e-round6-ls.json`.

The ship integration (patches 65–66 merged, `8c8c100`) adds the projection engineer's
`genericsrename.mjs` (rename, references and definition of a `generics` type parameter and of a generic
component's props type) and `propsfeatures.mjs` (hovers and diagnostics around the annotation and a
type parameter) to `runall.sh`. The ship records: `docs/measurements/tests/regressions-ship.txt` (runall
against `245dbfb`'s and `7179942`'s records, slowsig with 36 aliases at the default timeout, the
test-suite counts), `e2e-ship.json` and `e2e-compare-round6-ls-vs-ship.txt`, and the `ship` lines of
`docs/measurements/bench/final.jsonl` (build `8c8c100` and the official lines between them).

Round 7, language server (patches 67–72) adds the sixth review's scripts to `tests/regressions/`:
`missedloop.mjs <binary> <tpl> [components] [ms] [regex]` (rejected components whose script line is
`const r = <regex>; }c{`, one completion at `}c|{` in each, or all at one position with `SAME=1`, and a
hover on another component every second: restarts, hover answers, tsrs CPU),
`pullwhileloop.mjs <binary> <tpl> <file> [every] [ms] [edit]` (pulls of a document while tsrs loops on a
request there), `rn.mjs <binary> <tpl> <case.json>` (rename, the text after it, references, definition
and highlights for each query of a case; `cases/*.json` are the review's, whose official answers are in
its records) and `diagcmp.mjs <binary> <tpl> <cases.json>` (each text's diagnostics). `runall.sh` runs
`missedloop.mjs` with a loop the model reads (`/'/`) and one it misses (`0; if (r) /'/`), `rn.mjs` on
`shorthand.json` and `component.json`, and `diagcmp.mjs` on `diag2.json`. `docs/upstream/tsrs-lost-request/cases.json`
gains the 36 texts behind patch 67. Round 7's records: `docs/measurements/tests/regressions-round7-ls.txt`,
`e2e-round7-ls.json` and `e2e-compare-ship-vs-round7-ls.txt`.

The projection half of round 7 (patches 73–80) adds the projection engineer's corpus tools in
`tests/regressions/projection/`: `zz_probe.rs` with `corpus.sh` and `probe.sh` (project every zeno
component, or one, with a worktree build and dump its code, source map, exact mappings and facts),
`cmpcode.py`, `exactdiff.py`, `checkexact.py` and `showexact.py` (compare two dump trees, the exact
coverage gained or lost per source byte, that every exact segment is verbatim), `afuzz-gen.cjs`,
`afuzz-cmp.cjs`, `afuzz-show.cjs`, `tfuzz-gen.cjs` and `tsparse.cjs` (half-typed props annotations and
template mutations cut from zeno, compared and parsed with TypeScript), and `rncmp.cjs` (one case's
answers against official's); `cases/projection7.json` and `projection7b.json`; and four `rn.mjs` lines in
`runall.sh` (`template`, `multiline`, `projection7`, `projection7b`). Its records:
`docs/measurements/tests/regressions-round7-projection.txt` (label `projection-d3ca4ed`, the same tree as
`476f489`), `e2e-round7-projection.json` and `rn-round7-projection/`. The rename integration
(`c921b00`) adds `official.sh` (the official server as a binary for these scripts, the oracle),
`rnall.sh <binary> <tag> <outdir>` (`rn.mjs` on every rename case and `diagcmp.mjs` on `diag1`–`diag3`),
`rnmatrix.cjs <dir> <case…>` (per query, which builds' answers equal official's), `runallcmp.py <a> <b>`
(which `runall.sh` sections two records share), `initprobe.mjs <root> <binary…>` (initialize latency,
builds interleaved; through the lock) and `cases/diag3.json` (a TypeScript error in each kind of text
73–80 map; `runall.sh` runs it last). Its records: `docs/measurements/tests/regressions-rename.txt`, `rn-rename/`, `e2e-rename.json`,
`e2e-compare-round7-ls-vs-rename.txt` and the `rename` lines of `docs/measurements/bench/final.jsonl`.

The final records (`7179942`): `docs/measurements/tests/regressions-final.txt` (runall, the `tests/review3/`
copies of the review scripts, every saved crash input, lsfuzz with the server's stderr, bigtype
against `02e6b31` and `670722d`, the all-projects memory A/B against `670722d`, the test-suite
counts), `e2e-final.json` and `e2e-compare-round5-ls-vs-final.txt`, and the `final` (build `7179942`
and the official lines after 11:43Z) and `final-direct` lines of `docs/measurements/bench/final.jsonl`, whose
smaller-workspace lines carry `workspace` `admin` and `admin/src`. `lsfuzz.mjs` writes the server's
stderr to `STDERR_OUT=<file>` when set (the restart lines quoted above come from it); the review3
`recover-pos.mjs` writes its per-state records to `OUT=<file>`, which `tests/review3/rp-compare.mjs
<a> <b>` compares. The previous final's records (patches 1–49) were renamed to carry their build:
`regressions-final-670722d.txt`, `e2e-final-670722d.json` and the two comparisons that name it.
