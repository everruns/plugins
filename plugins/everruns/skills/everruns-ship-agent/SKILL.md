---
name: everruns-ship-agent
description: Put an Everruns agent in front of people or systems, by adding and publishing a channel (Slack, AG-UI web chat, Public Chat, A2A, FCP, Voice) or a trigger (schedule, webhook, GitHub event, MCP event). Use when the user wants an agent reachable outside the Everruns app or running on its own.
---

# Ship an Everruns agent

Commands below are the `everruns` command language (see the `everruns` skill).
Creating and publishing are changes: use the CLI or MCP `execute`, pass
`--reason`, and confirm with the user before publishing anything public.

## Channel or trigger?

- **Channel**: someone outside sends a message and expects a reply.
- **Trigger**: something happens (a time, a webhook, a GitHub event) and the
  agent works without anyone waiting for a reply.

## Channels

| Type | `--channel-type` | For |
|---|---|---|
| Slack | `slack` | A Slack bot. The organization must have a Slack workspace connected |
| AG-UI | `ag_ui` | Your own web or app UI speaking the AG-UI protocol |
| Public Chat | `public_chat` | A hosted chat page for one agent |
| A2A | `a2a` | Other agents calling this one over the A2A protocol |
| FCP | `fcp` | Any HTTP client, text in and text out |

```bash
everruns agents channels create --help
everruns agents channels create --agent-id <agent_id> --channel-type public_chat \
  --reason "User wants a public chat page for the support agent"
everruns agents channels publish --help
```

A channel starts as a draft and serves traffic only when it is published, the
agent is active, and the agent's exposures are not suspended. Publishing needs
the owner-level agent permission. Slack has extra steps (publish, then
**Add to Slack**) best done in the UI: point the user to
`https://app.everruns.com/agents/<agent_id>` > **Integrations**.

Voice conversations and other channel kinds are set up the same way from the
agent's **Integrations** tab; `--help` lists the types the command accepts.

Guides: <https://docs.everruns.com/features/channels/>,
<https://docs.everruns.com/how-to/publish-to-slack/>.

## Triggers

```bash
everruns agents triggers create --help
everruns agents triggers create --agent-id <agent_id> --trigger-type schedule \
  --cron-expression '0 8 * * 1-5' --timezone Europe/Kyiv \
  --message "Write today's digest" --reason "Weekday morning digest"
everruns agents triggers trigger --help     # fire one now to test it
everruns agents triggers runs list --help   # see what each run did
```

Webhook, GitHub and MCP event triggers take their own flags (`--github-events`,
`--repositories`, `--mcp-server`, `--mcp-event`); read `--help` for the shape.
Guide: <https://docs.everruns.com/features/agent-triggers/>.

## After shipping

Test it the way a real caller would (send a Slack message, open the chat page,
fire the trigger once), read the resulting session, and give the user the
channel or trigger link plus how to turn it off
(`everruns agents channels unpublish`, `everruns agents triggers update --enabled false`,
or **Suspend exposures** on the agent).
