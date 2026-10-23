#!/bin/sh
# usage: rnall.sh <binary> <tag> <outdir>
# rn.mjs on every rename case in cases/ and diagcmp.mjs on diag1-3; writes <outdir>/<case>.<tag>.json (+ .err).
# Run it with tests/regressions/official.sh as <binary> for the oracle, then compare with rnmatrix.cjs.
S=$(cd "$(dirname "$0")" && pwd)
BIN=$1 TAG=$2 OUT=$3
mkdir -p "$OUT"
for c in component defaults fromts generics2 generics3 iface intersect module multiline nondestr projection7 projection7b shorthand template typeoflocal unicode; do
  timeout 240 node "$S/rn.mjs" "$BIN" "$S/tpl" "$S/cases/$c.json" > "$OUT/$c.$TAG.json" 2> "$OUT/$c.$TAG.err"
  echo "$c $TAG exit $?"
done
for c in diag1 diag2 diag3; do
  timeout 240 node "$S/diagcmp.mjs" "$BIN" "$S/tpl" "$S/cases/$c.json" > "$OUT/$c.$TAG.json" 2> "$OUT/$c.$TAG.err"
  echo "$c $TAG exit $?"
done
