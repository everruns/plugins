---
type: llm
---
The reply uses Slack Socket Mode, which needs no public address, and explains that the user generates an app-level token (`xapp-`, scope `connections:write`) in Slack and pastes it into the channel in Everruns, not into the chat. Links point at the user's own Everruns (http://localhost:9300), not app.everruns.com. Saying a public HTTPS address or a tunnel is required, or asking for the token in chat, fails.
