#!/usr/bin/env bash
set -euo pipefail

for i in $(seq 1 30); do
  figlet -f doh "$i"
  claude -p \
    --dangerously-skip-permissions \
    --include-partial-messages \
    --output-format=stream-json \
    --verbose \
    < plans/prompt.md \
  | jq -rj --unbuffered '
      select(.type=="stream_event"
             and .event.type=="content_block_delta"
             and .event.delta.type=="text_delta")
      | (.event.delta.text | gsub("\\\\r?\\\\n"; "\n"))
    '
  printf '\n'
done
