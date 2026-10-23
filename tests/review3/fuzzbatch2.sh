#!/bin/bash
# usage: fuzzbatch.sh <binary> <iters> <seed>...
R=$(cd "$(dirname "$0")/.." && pwd)  # tests/
BIN=$1; IT=$2; shift 2
cd $R/review3 && mkdir -p fuzzout2
run() { DUMP=$R/review3/fuzzout2/dump$1 timeout 900 node lsfuzz.mjs $BIN $R/regressions/tpl $1 $IT > fuzzout2/f$1.json 2>&1; }
set -- "$@"
while [ $# -gt 0 ]; do
  for i in 1 2 3 4; do [ $# -gt 0 ] && { run $1 & shift; }; done
  wait
done
for f in fuzzout2/f*.json; do node -e 'try{const o=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(o.seed,o.answered,o.errors,JSON.stringify(o.exited),JSON.stringify(o.timeouts),[...new Set(o.panics.map(p=>p.replace(/.*panicked at /,"")))].join(" | "))}catch(e){console.log(process.argv[1],"unparsable")}' $f; done
