#!/bin/sh
# usage: runall.sh <binary> <label>
S=$(dirname "$0")
run() { # <name> <script> [extra args...]
  name=$1 t=$2
  shift 2
  printf '== %s @ %s\n' "$name" "$LABEL"
  timeout "${TIMEOUT:-120}" node "$S/$t.mjs" "$BIN" "$S/tpl" "$@" 2>&1 | tr -d '\n' | sed 's/  */ /g'
  echo
}
BIN=$1 LABEL=$2
for t in s1 s1b s2 s3 s4 s7 s8 s10 s11 incomplete-edits r1-depkill r1b-close r2c-format r2d-hover r2e-hover-edit-race r5-crash r6-watchers hashscope start-of-file start-of-file2 style-open bigtype; do
  run "$t" "$t"
done
# Third review, projection: stray `<script` tags (find_orphan_scripts) and half-typed hoisted statements.
run "r5-crash crash-inputs" r5-crash "$S/crash-inputs"
TIMEOUT=300 run recover-pos recover-pos
# Fourth review: a check slower than the request timeout (patches 50, 51; 6 aliases take about 7 s,
# with a 3 s timeout and an edit every 8 s), and document-wide requests while typing (52-54).
(export RSVELTE_TSGO_REQUEST_TIMEOUT_MS=3000 EDIT_EVERY=8000; run slow slow 6 40000)
run "burst folding" burst 1500 folding 30
run "burst symbol" burst 1500 symbol 20
# Fifth review, language server: renames around the props annotation and a malformed generics
# value (patches 55-57, 63); requests slower than the timeout that are not lost (6 aliases take about
# 7 s, with a 3 s timeout; 58, 60); a state tsrs loops on asked about every 2 s (61, 62).
run propsrename propsrename
run hashrename hashrename
run generics generics
# The fifth review's projection half (the $$ComponentProps alias and a generics value mapped back to
# the author's text): a generics type parameter and a generic component's props type renamed, and
# hovers and diagnostics around the annotation and the type parameter.
run genericsrename genericsrename
run propsfeatures propsfeatures
(export RSVELTE_TSGO_REQUEST_TIMEOUT_MS=3000; run "slowsig signature" slowsig 6 signature 20000)
(export RSVELTE_TSGO_REQUEST_TIMEOUT_MS=3000; run "slowsig definition" slowsig 6 definition 20000)
(export RSVELTE_TSGO_REQUEST_TIMEOUT_MS=3000; run slowmix slowmix 6 all 20000)
(export RSVELTE_TSGO_REQUEST_TIMEOUT_MS=5000; run loopstorm loopstorm "$S/loop-inputs/loop22.svelte" 40000 2000)
# Sixth review, language server (patches 67-72): loops the model reads and one it misses (`if (r) /'/`,
# a regular expression after a statement's parenthesis), four completions each, a hover on another
# component every second (restarts, hover answers, tsrs CPU); renames and references of shorthands,
# stores and components (rn.mjs, against official's answers in the review); TypeScript errors before
# the props alias's copy (diagcmp.mjs).
(export RSVELTE_TSGO_REQUEST_TIMEOUT_MS=4000; run "missedloop regex" missedloop 4 30000)
(export RSVELTE_TSGO_REQUEST_TIMEOUT_MS=4000; run "missedloop gap" missedloop 4 30000 "0; if (r) /'/")
run "rn shorthand" rn "$S/cases/shorthand.json"
run "rn component" rn "$S/cases/component.json"
run "diagcmp diag2" diagcmp "$S/cases/diag2.json"
# Sixth review, projection (round 7): author text kept in place in the template (closing-tag names,
# snippet names, type parameters and parameters, each keys and indexes, class:/style: shorthands and
# directives the opener checks after a later attribute) and the repaired props alias; rename,
# references, definition and highlights to compare with official's (rn.mjs; rncmp.cjs in projection/).
run "rn template" rn "$S/cases/template.json"
run "rn multiline" rn "$S/cases/multiline.json"
run "rn projection7" rn "$S/cases/projection7.json"
run "rn projection7b" rn "$S/cases/projection7b.json"
# Rename integration (c921b00): a TypeScript error in each kind of text 73-80 map (directives before a
# later attribute, bind:this, a transition's argument, snippet parameters and type parameters, each keys,
# closing tags, a repaired alias); compare with official via rnall.sh and rnmatrix.cjs.
run "diagcmp diag3" diagcmp "$S/cases/diag3.json"
