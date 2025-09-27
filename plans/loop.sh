# run 30 times
for i in {1..30}; do figlet -f doh $i; cat plans/prompt.md | claude -p --dangerously-skip-permissions; done