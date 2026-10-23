#!/bin/sh
# The official Svelte language server (Zed's install, 0.18.5), as a binary for the regression scripts:
# node tests/regressions/rn.mjs tests/regressions/official.sh tests/regressions/tpl <case.json> gives the
# oracle's answers (the sixth review's mine/official.sh).
exec node "$HOME/Library/Application Support/Zed/extensions/work/svelte/node_modules/svelte-language-server/bin/server.js" "$@"
