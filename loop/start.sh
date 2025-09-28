#!/usr/bin/env sh

set -eu

# Variables for cleanup
VIEWER_PID=""

# Clean interrupt and cleanup function
cleanup() {
  printf "\n[Cleaning up...]\n" >&2
  if [ -n "$VIEWER_PID" ]; then
    kill "$VIEWER_PID" 2>/dev/null || true
    printf "[Viewer stopped]\n" >&2
  fi
}

# Trap for both interrupt and normal exit
trap 'cleanup; printf "\n[Interrupted]\n" >&2; exit 130' INT
trap 'cleanup' EXIT

PROMPT_FILE="${1:-loop/prompt.md}"

# Setup log file
LOG_FILE="loop/loop.log"
# Empty the log file if it exists
echo -n > "$LOG_FILE"

# Start the log viewer in the background
printf "🚀 Starting Claude Code Log Viewer...\n"
node loop/viewer.js > /dev/null 2>&1 &
VIEWER_PID=$!

# Give the viewer a moment to start
sleep 2

# Display viewer URL
printf "\n📊 Log Viewer is running at: \033[32mhttp://localhost:3001\033[0m\n"
printf "   You can view the real-time log stream in your browser\n\n"

run_once() {
  # Run claude and tee output to log file and pipe to jq
  cat "$PROMPT_FILE" "loop/base-prompt.md" \
  | claude -p \
    --verbose \
    --dangerously-skip-permissions \
    --include-partial-messages \
    --output-format=stream-json \
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

echo "{\"type\":\"loop_all_completed\", \"message\":\"==================== Loop complete ====================\"}" >> "$LOG_FILE"

# Done message
printf '\n\n'
printf '%0.s▄' $(seq 1 80)
printf '\n\n\n'
(printf '\033[32m'; figlet -f doh "Done" | sed -E '/^[[:space:]]*$/d' | sed 's/^/  /'; printf '\033[0m') || true
printf '\n\n'
