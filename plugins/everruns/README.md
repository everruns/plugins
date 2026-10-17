# Everruns plugin

Lets a coding agent build, run, debug and ship [Everruns](https://everruns.com)
agents. It connects the Everruns MCP server (`https://app.everruns.com/mcp`,
OAuth sign-in) and adds 13 skills that load when needed.

| Skill | Your agent can… |
|---|---|
| `everruns` | Understand product concepts, find documentation and Cloud, and choose the right workflow skill |
| `everruns-cli` | Use the CLI and session shell, discover commands, script operations, and verify changes |
| `everruns-mcp` | Connect through MCP, load shared skills, run sessions, handle questions and connections, and read resources |
| `everruns-agent-authoring` | Design and revise agent behavior, harnesses, capabilities, identities, packages, and verification |
| `everruns-run-agent` | Hand a task to an existing agent, follow it, exchange files, and bring back the result |
| `everruns-build-agent` | Build or improve an agent from a plain-language brief, add knowledge and tools, and smoke-test it |
| `everruns-debug-session` | Diagnose failed, stalled, or poor-quality sessions and verify fixes |
| `everruns-evaluate-agent` | Build regression evals, compare models, and score live traffic |
| `everruns-ship-agent` | Expose agents through channels and triggers, with budgets and controls for stopping them |
| `everruns-operate` | Investigate organization spending, health, and change history |
| `everruns-agents-as-files` | Keep agent packages in a repository and validate, compare, import, or export them |
| `everruns-sdk` | Call hosted agents from Python, TypeScript, or Rust applications |
| `everruns-framework` | Develop Rust applications that run agents themselves and compose advanced execution hosts |

Claude Code:

```text
/plugin install everruns --marketplace everruns/plugins
```

Other hosts: <https://github.com/everruns/plugins#install>.
Docs: <https://everruns.com/docs/getting-started/use-in-ai-tools/>.

## Maintaining shared skills

`everruns`, `everruns-cli`, `everruns-mcp`, `everruns-agent-authoring`, `everruns-framework` are distributed copies
of the canonical [Everruns product skills](https://github.com/everruns/everruns/tree/main/skills).
Sync their complete directories, including references, when updating them.
The other task guides are maintained in this plugin repository.
Edit skill descriptions in `catalog.json` and regenerate this README and the
root skills table with `node scripts/build.mjs`.
