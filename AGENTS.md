# Contributing to svelte-rs (for people and coding agents)

svelte-rs is a Svelte language server: rsvelte's native server (Rust) with tsrs (Rust TypeScript 7)
as its type checker, plus patches that make it fast on large monorepos and match what the official
`svelte-language-server` reports. Read [README.md](README.md), then
[docs/architecture.md](docs/architecture.md) and [docs/testing.md](docs/testing.md) before changing
anything. [docs/patches.md](docs/patches.md) explains every existing patch: read the sections that
touch the code you are about to change.

## Repository layout

| path | what |
|---|---|
| `crates/svelte_rs` | the `svelte-rs` binary: finds tsrs, sets `TSGO_BIN`, runs `rsvelte_language_server::run_stdio()` |
| `vendor/rsvelte` | git submodule: rsvelte with this project's patches on its `svelte-rs` branch. Almost every change lands here. |
| `vendor/rsvelte/crates/rsvelte_language_server` | the server: `server.rs` (LSP loop, tsgo/tsrs routing), `tsgo_overlay.rs` (projects, shadows, overlay tsconfig), `worker.rs` (native analysis), `lint.rs`, `preprocess_sidecar.{rs,mjs}` |
| `vendor/rsvelte/crates/rsvelte_projection` | svelte2tsx in Rust (component → TypeScript + source map) |
| `vendor/rsvelte/crates/rsvelte_core` | the Svelte compiler port (parser, analysis) |
| `bench/` | latency/memory benchmarks against the official server |
| `tests/` | regression scripts, review tools, diagnostics comparison, end-to-end scenarios |
| `docs/` | architecture, patch log, testing guide, recorded measurements and review findings |

The root `Cargo.toml` repeats rsvelte's `[patch.crates-io]` oxc pin (Cargo applies patches only
from the root workspace); keep the two in sync when rsvelte bumps oxc. The release profile must
keep `panic = "unwind"`: the server isolates per-request panics with `catch_unwind`.

## Ground rules

1. **The official server is the oracle.** For diagnostics, hover, definition, references, rename and
   completion, the target is what `svelte-language-server` answers for the same project. A new
   false positive is a regression, even if the message looks right. Compare with
   `tests/diagproj.mjs` (it can run both servers) before and after your change.
2. **Measure, don't assume.** Performance changes need numbers from `bench/` before and after, from
   runs in the same session (other builds skew timings; each result line records the load).
   Memory: report the whole process tree (svelte-rs + tsrs + Node sidecar).
3. **Reproduce first.** Every fix starts with a failing reproduction: a unit or protocol test in
   rsvelte's suite where possible, otherwise a script in `tests/regressions/` that builds a
   throwaway project from `tests/regressions/tpl`. The reproduction must fail without the fix.
4. **One patch per problem.** Commit inside `vendor/rsvelte` on the `svelte-rs` branch, one focused
   commit per fix, message in rsvelte's style: `fix(language-server): <what is now true>` or
   `perf(...)`, with a body that states the problem, the change and the evidence. Then commit the
   submodule pointer in this repository together with a new numbered section in
   `docs/patches.md` (Problem / Change / Effect with measurements and test names).
5. **Don't touch users' projects.** The server may write only its cache, `<workspace>/.svelte-rs/`.
   When testing against a real project that an editor is using at the same time, use a copy
   (rsync without `node_modules`, then symlink each `node_modules` back), or serialise sessions with
   `bench/with-lock.sh`. Never commit a real project's files as fixtures without its owner's consent.
6. **Keep upstream mergeable.** Prefer changes rsvelte could accept: small, tested, in its code
   style, no reformatting of untouched code. Keep `cargo fmt` clean and add no new clippy warnings.
7. **No machine-specific paths** in code, scripts or the README: take paths from arguments or
   environment variables. Machine-specific records belong in `docs/measurements/` only.

## Build and test

```sh
git submodule update --init vendor/rsvelte
cargo build --release -p svelte_rs                       # target/release/svelte-rs

cd vendor/rsvelte                                        # rsvelte's suites, built outside the tree
CARGO_TARGET_DIR=../../target-tests cargo test -p rsvelte_language_server --lib --test protocol --test robustness
CARGO_TARGET_DIR=../../target-tests cargo test -p rsvelte_projection
cd ../..

sh tests/regressions/runall.sh "$PWD/target/release/svelte-rs" dev
node tests/diagproj.mjs svelte-rs <project> <file.svelte>...
node bench/bench.mjs svelte-rs <project> <file.svelte>...
```

Known: 5 tests in rsvelte's `tests/upstream_fixture_manifest.rs` need the language-tools submodule
and fail without it. `target-*` directories are git-ignored; delete them when done, they grow to
tens of GB.

## Things that bit us (read before touching these areas)

- **tsrs rebuilds and retains.** Opening a document that is not on disk makes tsrs rebuild the
  whole program, and tsrs keeps part of every full build. Shadows of closed components therefore
  live on disk and only editor buffers are opened in tsrs (patches 2, 4). Anything that adds
  `didOpen`s or changes import sets per keystroke multiplies memory.
- **tsrs can loop forever** on some completion/signature-help positions and never answer. The server
  times requests out and restarts tsrs only on evidence of a loop or when it answers nothing at all
  (patches 45, 50, 59–62, 67–68); a slow request must never cause a restart. Minimal repros: `docs/upstream/`.
- **The overlay tsconfig replaces, it does not merge.** `rootDirs`, `paths` and similar options
  in the overlay override the project's through `extends`; carry inherited values over (patch 82).
- **Positions.** Every location tsrs returns in a shadow must map back through the projection's
  source map; a location in generated code must be dropped or moved, never applied (rename once
  corrupted `<script` tags). Generated code must stay byte-identical for unchanged inputs; check
  with `tests/regressions/projection/corpus.sh` on a large project before and after.
- **Never block the main loop** on tsrs or the Node sidecar; the typing benchmark catches it.

## Before you open a pull request

- [ ] A reproduction that failed before and passes now (test name in the commit body).
- [ ] rsvelte's language-server suites pass; projection suites too if you touched the projection.
- [ ] `tests/regressions/runall.sh` passes; `tests/diagproj.mjs` shows no new diagnostics against
      the official server on at least one real project.
- [ ] Benchmarks before/after if the change can affect latency or memory.
- [ ] `docs/patches.md` has a section for the patch; README updated if behaviour or settings changed.

## For coding agents

- Work in `vendor/rsvelte` for server changes; never rewrite its history or the upstream commits
  below the `svelte-rs` branch.
- Do not push, publish, or open pull requests unless the person you work for asks you to.
- Long builds and test runs: run them in the background and wait for them, don't poll.
- If a finding is outside your task, record it in `docs/patches.md` under "Not done / follow-ups"
  instead of fixing it silently.
