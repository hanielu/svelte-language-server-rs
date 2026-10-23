#!/bin/zsh
# Run a command while holding the machine-wide benchmark lock, so language-server sessions against
# the same project never overlap (they share rsvelte's on-disk overlay cache and skew timings).
# Usage: bench/with-lock.sh <command> [args...]
lock=/tmp/svelte-language-server-rs-bench.lock
until mkdir "$lock" 2>/dev/null; do sleep 1; done
trap 'rmdir "$lock" 2>/dev/null' EXIT INT TERM
"$@"
