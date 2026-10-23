#!/bin/sh
# probe.sh <file.svelte>: dump the projection (code, map, exact segments, facts) of one component.
# Needs zz_probe.rs copied into the rsvelte checkout as corpus.sh describes.
here=$(cd "$(dirname "$0")" && pwd)
repo=$(cd "$here/../../.." && pwd)
cd "${RSVELTE_DIR:-$repo/vendor/rsvelte}" && PROBE_FILE="$1" \
  CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$repo/target-projection}" \
  cargo test -q --release -p rsvelte_projection --test zz_probe -- --ignored --nocapture 2>/dev/null \
  | sed -e '/^running 1 test$/d' -e '/^test result/d'
