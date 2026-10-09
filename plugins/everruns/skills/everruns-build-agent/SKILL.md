---
name: everruns-build-agent
description: Create a new Everruns agent or change an existing one from a plain-language description, then prove it works with a test message. Use when the user asks to make, set up, improve, retarget or fix the behavior of an Everruns agent. Builds on the everruns skill.
---

# Build or change an Everruns agent

Commands below use the `everruns` command language from the `everruns` skill:
run them with the CLI, or as the `commands` of MCP `query` (reads) and
`execute` (changes). Check flags with `--help` before using one.

## 1. Pin down the job

Get, or propose and confirm, four things before creating anything:

- **Purpose**: one sentence on what the agent does and for whom.
- **Tools it needs**: web access, files, code execution, a third-party system.
- **Model**: only if the user cares. Otherwise the organization default applies.
- **Where it will run**: chat only, or a channel or schedule later (see
  `everruns-ship-agent`).

If an agent with that purpose may already exist, look first:
`everruns agents list --search <word>`.

## 2. Choose capabilities

```bash
everruns capabilities list --search web | jq -r '.data[] | [.id, .name] | @tsv'
everruns mcp-servers list
```

Capabilities are referenced by id (`web_fetch`, `session_file_system`,
`mcp:<uuid>`, `skill:<id>`, `plugin:<id>`). Prefer a capability the harness
already provides over adding it again on the agent. For a third-party API
without a capability, register its MCP server (`everruns mcp-servers create`);
the result's `capability_ref` goes into `--capabilities`.

### Give it what it needs to know

Instructions are for behavior. Knowledge belongs elsewhere, where it can be
updated without touching the agent:

- **Reference material** (product docs, policies, runbooks):
  `everruns knowledge-bases --help`; an OKF bundle imports with
  `everruns knowledge-bases okf-import --help`.
- **What it should remember** across sessions: `everruns memories --help`.
- **Repeatable procedures**: a skill (`everruns skills create --help`, from
  `SKILL.md` content), attached as `skill:<id>`.
- **Scripts it runs often**: saved scripts (`everruns agents scripts --help`).
- **Guardrails** on input or output: start from
  `everruns capabilities guardrails examples list` and test a config with
  `everruns capabilities guardrails dry-run --help` before attaching it.

## 3. Preview before saving

Write the instructions as a short brief: role, what good output looks like,
what to avoid, when to ask the user. Then check what the agent would actually
get, without saving anything:

```bash
everruns agents preview --system-prompt "$PROMPT" \
  --capabilities '[{"ref":"web_fetch"}]' | jq '{tools: [.tools[].name]}'
everruns agents analyze --system-prompt "$PROMPT" --capabilities '[{"ref":"web_fetch"}]'
```

`analyze` runs advisory checks on the configuration. Fix what it flags that
matters for the user's goal.

## 4. Create or update

```bash
everruns agents check-name --help   # confirm the name is free
everruns agents create --name hn-digest --display-name "HN digest" \
  --system-prompt "$PROMPT" --capabilities '[{"ref":"web_fetch"}]' \
  --reason "User asked for a daily Hacker News digest agent"
```

For an existing agent: read `everruns context get <agent_id>`, then
`everruns agents update <agent_id> … --reason "…" --context-revision <n>`.
Change only the fields the request is about. `--capabilities` replaces the
whole list, so start from the agent's current list (`everruns agents get <id>`).

## 5. Test it

Send a realistic first message and read the reply, as in `everruns-run-agent`:
`agent_run` and `session_get_status` over MCP, or `everruns sessions create
--agent agent_… --title "Smoke test"` then `everruns chat "…" --session
session_…` in the CLI.

Check the reply against the purpose from step 1. If the agent used the wrong
tool or none, adjust instructions or capabilities and test again. Two or three
rounds is normal. When the agent matters, turn those test messages into an
eval so later changes are checked too (`everruns-evaluate-agent`).

## 6. Report

Give the user the agent link (`https://app.everruns.com/agents/<id>`), the
test session link, what the agent can do now, and anything you chose for them
(model, capabilities). If the agent should live in a repository, continue with
`everruns-agents-as-files`.
