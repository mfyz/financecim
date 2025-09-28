
When you're done with your task:
1. Create a summary (markdown) of your changes you acomplished, and append it to `loop/changelog.md` with starting with 30 dash lines as a separator and newlines before/after that separator, as well as serialize this summary text as json object and append it to `loop/loop.log` (schema `{ type: "loop_end_summary", "date": "2025-09-27", "summary": "<Summary of changes in markdown format>"}`). Keep your summary short and to the point, but tell each change in separate lines like a brief bullet list.
2. Commit your changes and push to github on the current branch using git commands.
