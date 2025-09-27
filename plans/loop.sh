# run 20 times
for i in {1..30}; do figlet -f doh $i; cat prompt.md | claude -p --dangerously-skip-permissions; done