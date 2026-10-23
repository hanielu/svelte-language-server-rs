#!/bin/sh
# corpus.sh <project root> <outdir>: project every .svelte file under <project root> with a release
# build of rsvelte_projection and write the code, source map and exact segments to <outdir>, so two
# builds can be diffed (generated code must stay byte-identical unless a patch means to change it).
# Needs zz_probe.rs (beside this script) copied to crates/rsvelte_projection/tests/zz_probe.rs in the
# rsvelte checkout (RSVELTE_DIR, default vendor/rsvelte); keep it out of commits.
here=$(cd "$(dirname "$0")" && pwd)
repo=$(cd "$here/../../.." && pwd)
cd "${RSVELTE_DIR:-$repo/vendor/rsvelte}" && PROBE_ROOT="$1" PROBE_OUT="$2" \
  CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$repo/target-projection}" \
  cargo test -q --release -p rsvelte_projection --test zz_probe -- --ignored --nocapture 2>&1 | grep projected
