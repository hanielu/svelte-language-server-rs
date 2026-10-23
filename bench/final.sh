#!/bin/zsh
# Interleaved comparison on one project: the official svelte-language-server vs svelte-language-server-rs, RUNS runs
# each of bench/bench.mjs (BENCH_FILES) and bench/typing.mjs (the first of them), every session through
# bench/with-lock.sh. Appends one tagged JSON line per session to bench/results/final.jsonl (local and
# git-ignored; the recorded runs are in docs/measurements).
#
# Usage: BENCH_PROJECT=<project root> BENCH_FILES="<a.svelte> <b.svelte> ..." bench/final.sh [runs]
#        (more env: TYPING_FILE, SVELTE_LANGUAGE_SERVER_RS_BIN, SCENARIOS, VARIANT,
#         EXTRA_BENCH_BIN=<binary>:<label>, EXTRA_TYPING_BIN=<binary>:<label>)
#   SCENARIOS: "bench typing" (default), or one of them.
#   VARIANT tags every line it appends (`"variant": "<VARIANT>"`).
#   EXTRA_BENCH_BIN / EXTRA_TYPING_BIN add a third server (another svelte-language-server-rs build, e.g. a pre-merge
#   one) to the bench / typing runs, right after svelte-language-server-rs.
R=${0:A:h:h}
Z=${BENCH_PROJECT:?set BENCH_PROJECT to the project root to benchmark}
runs=${1:-3}
scenarios=(${=SCENARIOS:-bench typing})
mkdir -p $R/bench/results
out=$R/bench/results/final.jsonl
files=(${=BENCH_FILES:?set BENCH_FILES to the components to open, relative to BENCH_PROJECT})
typing_file=${TYPING_FILE:-$files[1]}
rs_build=$(git -C $R/vendor/rsvelte rev-parse --short HEAD)
ls_build=$(node -p "require('$HOME/Library/Application Support/Zed/extensions/work/svelte/node_modules/svelte-language-server/package.json').version")

tag() { # <json> <scenario> <build> <run>
	node -e 'const r=JSON.parse(process.argv[1]); r.scenario=process.argv[2]; r.build=process.argv[3]; r.run=+process.argv[4]; r.workspace="."; if (process.env.VARIANT) r.variant=process.env.VARIANT; r.date=new Date().toISOString(); r.load=require("os").loadavg().map(x=>+x.toFixed(1)); console.log(JSON.stringify(r))' "$@"
}
session() { # <scenario> <server> <build> <run> <command...>
	local scenario=$1 server=$2 build=$3 run=$4; shift 4
	local json
	json=$($R/bench/with-lock.sh "$@" | tail -1)
	if [[ $json != \{* ]]; then echo "session failed: $scenario $server run $run" >&2; return 1; fi
	local line=$(tag "$json" $scenario $build $run)
	echo $line >> $out
	echo $line
}
for run in $(seq 1 $runs); do
	if (( ${scenarios[(Ie)bench]} )); then
		session bench svelte-ls $ls_build $run node $R/bench/bench.mjs svelte-ls $Z $files
		session bench svelte-language-server-rs $rs_build $run node $R/bench/bench.mjs svelte-language-server-rs $Z $files
		if [[ -n $EXTRA_BENCH_BIN ]]; then
			session bench svelte-language-server-rs ${EXTRA_BENCH_BIN#*:} $run env SVELTE_LANGUAGE_SERVER_RS_BIN=${EXTRA_BENCH_BIN%%:*} node $R/bench/bench.mjs svelte-language-server-rs $Z $files
		fi
	fi
	(( ${scenarios[(Ie)typing]} )) || continue
	session typing svelte-ls $ls_build $run node $R/bench/typing.mjs svelte-ls $Z $typing_file
	session typing svelte-language-server-rs $rs_build $run node $R/bench/typing.mjs svelte-language-server-rs $Z $typing_file
	if [[ -n $EXTRA_TYPING_BIN ]]; then
		session typing svelte-language-server-rs ${EXTRA_TYPING_BIN#*:} $run env SVELTE_LANGUAGE_SERVER_RS_BIN=${EXTRA_TYPING_BIN%%:*} node $R/bench/typing.mjs svelte-language-server-rs $Z $typing_file
	fi
done
