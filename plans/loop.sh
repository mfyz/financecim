#!/usr/bin/env sh
# claude-pretty-loop.sh
# Streams Claude Code output nicely, separates “thought blocks”, shows tool calls,
# and avoids crashing on EPIPE when a pipe closes — without bash-only features.

set -eu

# Clean interrupt
trap 'printf "\n[Interrupted]\n" >&2; exit 130' INT

PROMPT_FILE="${1:-plans/prompt.md}"

run_once() {
  claude -p \
    --verbose \
    --dangerously-skip-permissions \
    --include-partial-messages \
    --output-format=stream-json \
    < "$PROMPT_FILE" \
  | jq -rj --unbuffered '
      select(.type=="stream_event"
        and .event.type=="content_block_delta"
        and .event.delta.type=="text_delta")
      | (.event.delta.text | gsub("\\\\r?\\\\n"; "\n"))
    '
  printf '\n'
}

i=1
while [ "$i" -le 2 ]; do
  printf '\n\n\n'
  printf '%0.s▄' $(seq 1 80)
  printf '\n\n\n'
  figlet -f doh "$i" || true

  run_once

  i=$((i+1))
done
