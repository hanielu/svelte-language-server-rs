# svelte-language-server-rs architecture

svelte-language-server-rs is a faster, lighter Svelte language server for editors (Zed first), written in Rust.

It is built on [rsvelte](https://github.com/baseballyama/rsvelte) (MIT), a Rust port of the
Svelte 5 compiler and its tools by a Svelte core team member, vendored as a git submodule at
`vendor/rsvelte` with our patches on the `svelte-language-server-rs` branch. rsvelte's native language server
(`crates/rsvelte_language_server`) already does what a Svelte language server needs:
compiler-grade parsing, svelte2tsx in Rust (`rsvelte_projection`), HTML/CSS/Svelte features,
formatting, linting, and TypeScript features through a **TypeScript 7 LSP child**
(`tsgo --lsp --stdio`) that sees each component as a `.svelte.tsx` shadow.

Our binary, `crates/svelte_language_server_rs` (`svelte-language-server-rs`), is a thin wrapper that points that child at
[tsrs](https://github.com/oxc-project/tsrs) (the Rust port of the TypeScript 7 compiler and
language server; same protocol as tsgo) unless `TSGO_BIN` is set, then runs rsvelte's server.
Everything else svelte-language-server-rs adds is patches to rsvelte (106 at `vendor/rsvelte` `39cbf17`) that make it
faster and lighter on real monorepos and keep it correct while a component is half typed or
TypeScript is slow, each measured and tested (see `docs/patches.md`).

```
Zed ──LSP──▶ svelte-language-server-rs                          ──LSP──▶ tsrs --lsp --stdio (Rust)
             (rsvelte_language_server, Rust)                             shadows: <workspace>/
             parse + svelte2tsx in Rust                                  .svelte-language-server-rs/.../Foo.svelte.tsx
             HTML/CSS/Svelte features, format, lint                      on disk (editor-open ones also as buffers),
             projects loaded on demand, then in the background           beside overlay tsconfigs and the Svelte shims
```

## Measurements (zeno monorepo: Svelte 5.57, 476 components in 12 TypeScript projects)

Final build: `vendor/rsvelte` `7179942` (patches 1–54) with tsrs 0.18.0 (TypeScript
7.1.0-dev.20260930.4), against the official svelte-language-server 0.18.5 (Zed's install,
TypeScript 5.9.3). `bench/bench.mjs` opens components, injects a type error into each instance
script, and times open → diagnostics, edit → diagnostics (median of 5), and the memory of the whole
process tree (ps RSS). Every session through `bench/with-lock.sh`, three runs each, at a load average
of 3.8–5.3 (zeno root, `VARIANT=final bench/final.sh 3`) and 2.2–3.9 (zeno/admin, zeno/admin/src): the
`final` lines with build `7179942` in `docs/measurements/bench/final.jsonl` and the official lines between them.
The unpatched rows are the first measurement, before any patch. The shipped build, `8c8c100`
(patches 1–66: 55–66 keep renames and other locations out of the `<script` tag and map the props
annotation and a `generics` value that svelte2tsx copies, and restart tsgo only for a request tsrs
loops on), measured the same within noise at a load average of 13–34 (`VARIANT=ship bench/final.sh 3`,
the `ship` lines; `docs/patches.md`, Results, ship), and so did the current build, `c921b00` (patches
1–80: 67–72 restart tsrs when a loop the model misses holds it and fix shorthand and store renames,
73–80 keep the template's author text in place so renames, references and diagnostics reach it), at a load
average of 6–9 (`VARIANT=rename bench/final.sh 3`, the `rename` lines; Results, rename), so the table
keeps the quieter final set.

| setup | first open | edit | memory |
|---|---|---|---|
| official svelte-language-server 0.18.5, workspace = zeno root, 3 files / 2 projects | 1.9–2.3 s / 279–286 / 956–1,022 ms | 258–279 ms | 820–826 MB |
| **svelte-language-server-rs, workspace = zeno root, 3 files / 2 projects** | **210–220 / 13–17 / 15–33 ms** | **10–12 ms** | **341–344 MB** (tsrs 269–272), every project loaded |
| official, workspace = zeno/admin, 2 files | 1.99–2.14 s / 272–295 ms | 265–276 ms | 622–642 MB |
| **svelte-language-server-rs, workspace = zeno/admin, 2 files** | **176–223 / 12–15 ms** | **9–11 ms** | **164 MB** (tsrs 113–115) |
| **svelte-language-server-rs, workspace = zeno/admin/src, 2 files** | **161–164 / 12–15 ms** | **8–12 ms** | **163–166 MB** (tsrs 113–115) |
| rsvelte + tsrs (unpatched), workspace = zeno root, 1 file | 8.3–9.4 s | ~22 ms | 1,120 MB (tsrs 964) |
| rsvelte + tsrs (unpatched), workspace = zeno/admin, 2 files | 6.8 s | ~90 ms | 965 MB (tsrs 894) |
| rsvelte + tsrs (unpatched), workspace = zeno/admin/src, 2 files | 3.3 s | ~52 ms | 524 MB (tsrs 477) |
| bare tsrs session with the same 166 admin shadows opened | – | – | ~105 MB |

At the zeno root `bench/final.sh` always starts svelte-language-server-rs right after the official server; started
on its own (`final-direct` lines) svelte-language-server-rs opens the first file in 156–169 ms. With every project
loaded (`bench/allprojects.mjs`, background mode) svelte-language-server-rs holds **288–291 MB phys_footprint**
(svelte-language-server-rs 56, tsrs 232–235) and answers `workspace/symbol` across all 12 projects in 2–11 ms; the
official server in the same set holds one project in 567–598 MB and finds none of the symbols.

Typing at the zeno root (`bench/typing.mjs`: `runtime.config.exten` typed into admin-layout as 20
keystrokes 50 ms apart, each followed by a completion request and a diagnostic pull, as Zed sends
them):

| | final diagnostics, after the last keystroke | completion while typing, p50 / p95 | member completion, p50 / p95 | memory before typing → peak |
|---|---|---|---|---|
| official 0.18.5 | 233–272 ms | 127–227 / 332–360 ms | 17.5–18.2 / 21.1–22.7 ms | 608–609 → 686–696 MB |
| **svelte-language-server-rs** | **14–18 ms** | **6.7–7.1 / 16.4–19.3 ms** | **5.6–6.4 / 6.2–7.9 ms** | **314–317 → 363–367 MB** |

Both offer the expected member on every keystroke and end on the same single error. The official
server's completion p50 depends on the machine's load (64–67 ms at a load of 1–2 in the previous
final set). In a large component (`tests/regressions/bigtype.mjs`, 2,813 lines) completions while
typing take 27 / 45–47 ms (p50 / p95) and the final diagnostics 177–188 ms; a folding-range or
document-symbol request for a 2,106-line component is answered in 41–63 ms, and 37–112 ms (p50)
while typing in it (`tests/regressions/burst.mjs`).

Command-line checking of zeno/admin (before the patches): svelte-check 6.75 s / 799 MB / 0 errors;
rsvelte's `svelte_check` with tsrs 0.45 s / 170 MB / 0 errors (+5 compiler warnings svelte-check does
not report); svelte-check-native with tsrs 0.84 s / 167 MB / 1 false positive.

## Layout

* `crates/svelte_language_server_rs` – the `svelte-language-server-rs` binary (wrapper).
* `vendor/rsvelte` – rsvelte submodule; our changes live on its `svelte-language-server-rs` branch.
* `bench/` – `bench.mjs` (latency/memory benchmark; servers `svelte-ls`, `svelte-language-server-rs`,
  `rsvelte-tsrs`, `rsvelte-tsgo`), `typing.mjs` (typing and completion latency), `final.sh` (both
  against both servers, interleaved), `allprojects.mjs` (memory and `workspace/symbol` with every
  project loaded), `with-lock.sh` (serialise sessions against one project), `tsrs-tee.sh` (capture
  the traffic between the server and tsrs), `lspc.mjs` + `spike-opencount.mjs` (drive tsrs
  directly), `results/`.
* `tests/` – `e2e.mjs` (41 steps against zeno, as Zed drives the server), `regressions/` (the
  reviewers' reproductions; `runall.sh <binary> <label>`), `review3/` (the third review's tools),
  `results/`.
* `.github/workflows/release.yml` – builds the release binaries for a version tag (no tests:
  `docs/releasing.md`).
* `docs/patches.md` – every patch with its problem, change, measurements, risks and tests;
  `docs/testing.md` – test layers, tools and the reference workspace; `docs/measurements/` – every
  recorded benchmark and end-to-end run; `docs/reviews/` – review findings the patches answer;
  `docs/upstream/` – repros for issues outside this repository.
* The root `Cargo.toml` repeats rsvelte's `[patch.crates-io]` oxc pin (patches only apply from the
  root workspace). Build: `cargo build --release -p svelte_language_server_rs` -> `target/release/svelte-language-server-rs`.
