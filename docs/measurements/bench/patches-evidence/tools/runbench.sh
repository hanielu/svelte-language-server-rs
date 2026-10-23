#!/bin/zsh
# Usage: runbench.sh <tag> <binary> [workspace-rel]   (workspace-rel defaults to the zeno root)
tag=$1; bin=$2; ws=${3:-}
Z=/Users/hyprsonic/Developer/hyprsonic.uk/.experiments/zeno
R=/Users/hyprsonic/Developer/adroyt/svelte-rs
root=$Z; files=(admin/src/app/admin-layout.svelte admin/src/fields/field-renderer.svelte packages/ui/src/lib/confirmation-dialog/confirmation-dialog.svelte)
if [[ -n $ws ]]; then
  root=$Z/$ws
  files=()
  for f in admin/src/app/admin-layout.svelte admin/src/fields/field-renderer.svelte; do files+=(${f#$ws/}); done
fi
out=$(SVELTE_RS_BIN=$bin $R/bench/with-lock.sh node $R/bench/bench.mjs svelte-rs $root $files)
line=$(node -e 'const r=JSON.parse(process.argv[1]); r.fix=process.argv[2]; r.workspace=process.argv[3]||"."; r.date=new Date().toISOString(); r.load=require("os").loadavg().map(x=>+x.toFixed(1)); console.log(JSON.stringify(r))' "$out" "$tag" "$ws")
echo $line >> $R/bench/results/svelte-rs-patches.jsonl
echo $line
