#!/usr/bin/env sh

set -eu

# Clean interrupt
trap 'printf "\n[Interrupted]\n" >&2; exit 130' INT

PROMPT_FILE="${1:-loop/prompt.md}"

# Setup log file
LOG_FILE="loop/loop.log"
# Empty the log file if it exists
echo -n > "$LOG_FILE"

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
      # Simplest possible approach to filter and format the stream
      # Text blocks
      if (.type=="stream_event" and .event.type=="content_block_delta" and .event.delta.type=="text_delta") then
        # Handle actual text content
        (.event.delta.text | gsub("\\r?\\n"; "\n"))
      
      # New message block for spacing
      elif (.type=="stream_event" and .event.type=="message_start") then
        "\n\n💬 "
      
      # Tool start
      elif (.type=="stream_event" and .event.type=="content_block_start" and .event.content_block.type=="tool_use") then
        "\n\n\u001b[33m🛠  Tool: " + .event.content_block.name + " \u001b[0m"
      
      # Skip all other event types
      else
        empty
      end
    '
  printf '\n\n'
}

i=1
while [ "$i" -le 2 ]; do
  printf '\n\n'
  printf '%0.s▄' $(seq 1 80)
  printf '\n\n\n\n'
  (figlet -f doh "$i" | sed -E '/^[[:space:]]*$/d' | sed 's/^/    /') || true
  printf '\n'

  # Add JSON formatted log header with iteration number
  echo "{\"type\":\"loop_start_marker\", \"message\":\"==================== New Claude Run $i - $(date) ====================\"}" >> "$LOG_FILE"

  run_once

  # commit and push changes
  # git add .
  # git commit -m "Loop iteration $i: $(claude --model haiku -p 'summarize the git changes and create one line git commit message, just give me the commit message line, dont prepend or add explanation, just give me the message as your response')"
  # git push

  i=$((i+1))
done

# Done message
printf '\n\n'
printf '%0.s▄' $(seq 1 80)
printf '\n\n\n'
(printf '\033[32m'; figlet -f doh "Done" | sed -E '/^[[:space:]]*$/d' | sed 's/^/  /'; printf '\033[0m') || true
printf '\n\n'
