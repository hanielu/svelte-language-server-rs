#!/bin/zsh
log=${TSRS_TEE_DIR:-/tmp}; tee "$log/tsrs-in.log" | $HOME/.bun/bin/tsrs "$@" | tee "$log/tsrs-out.log"
