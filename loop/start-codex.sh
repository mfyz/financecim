#!/usr/bin/env sh

set -eu

# Variables
ITERATION_COUNT=50
PROMPT_FILE="${1:-loop/prompt.md}"

# Trap for both interrupt and normal exit
trap 'printf "\n[Interrupted]\n" >&2; exit 130' INT

run_once() {
  # Run claude and tee output to log file and pipe to jq
  cat "$PROMPT_FILE" "loop/base-prompt.md" \
  | codex e \
    --skip-git-repo-check \
    --dangerously-bypass-approvals-and-sandbox
  printf '\n\n'
}

i=1
while [ "$i" -le $ITERATION_COUNT ]; do
  printf '\n\n'
  printf '%0.s▄' $(seq 1 80)
  printf '\n\n\n\n'
  (figlet -f doh "$i" | sed -E '/^[[:space:]]*$/d' | sed 's/^/    /') || true
  printf '\n'

  run_once

  i=$((i+1))
done

# Done message
printf '\n\n'
printf '%0.s▄' $(seq 1 80)
printf '\n\n\n'
(printf '\033[32m'; figlet -f doh "Done" | sed -E '/^[[:space:]]*$/d' | sed 's/^/  /'; printf '\033[0m') || true
printf '\n\n'
