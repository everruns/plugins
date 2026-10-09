---
type: llm
---
The reply names the actual cause found in the session: the `github_add_labels` tool calls returned 403 ("Resource not accessible by integration") until the turn hit the tool error limit. It ties that to the GitHub connection change made shortly before (bob@acme.dev rotated the token to a read-only scope). It recommends restoring write access on the GitHub connection, done by the user rather than by pasting a token into the chat.
