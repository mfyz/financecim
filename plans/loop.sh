#!/usr/bin/env sh
# claude-pretty-loop.sh
# Streams Claude Code output nicely, separates “thought blocks”, shows tool calls,
# and avoids crashing on EPIPE when a pipe closes — without bash-only features.

set -eu

# Clean interrupt
trap 'printf "\n[Interrupted]\n" >&2; exit 130' INT

PROMPT_FILE="${1:-plans/prompt.md}"

# Setup log file
LOG_FILE="plans/loop.log"
# Empty the log file if it exists
echo -n > "$LOG_FILE"
echo "Logging raw JSON output to $LOG_FILE"

run_once() {
  # Run claude and tee output to log file and pipe to jq
  claude -p \
    --verbose \
    --dangerously-skip-permissions \
    --include-partial-messages \
    --output-format=stream-json \
    < "$PROMPT_FILE" \
  | tee -a "$LOG_FILE" \
  | jq -rj --unbuffered '
      # Handle message blocks to separate thoughts
      if (.type=="stream_event" and .event.type=="message_start") then 
        "\n\n" 
      # Handle text deltas (actual content)
      elif (.type=="stream_event" and .event.type=="content_block_delta" and .event.delta.type=="text_delta") then
        (.event.delta.text | gsub("\\r?\\n"; "\n"))
      # Handle tool use (prints name of tool)
      elif (.type=="stream_event" and .event.type=="content_block_start" and .event.content_block.type=="tool_use") then
        "\n\nTool call: " + .event.content_block.name + " "
      else 
        empty 
      end
    '
  printf '\n'
}

i=1
while [ "$i" -le 2 ]; do
  printf '\n\n\n'
  printf '%0.s▄' $(seq 1 80)
  printf '\n\n\n'
  figlet -f doh "$i" || true

  # Add JSON formatted log header with iteration number
  echo "{\"type\":\"log_marker\", \"message\":\"==================== New Claude Run $i - $(date) ====================\"}" >> "$LOG_FILE"

  run_once

  i=$((i+1))
done
