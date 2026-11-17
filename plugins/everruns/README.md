# Everruns plugin

Lets a coding agent build with the [Everruns](https://everruns.com) Framework, install
Everruns on your own machines, and build, run, debug and ship agents on it. It adds
the `everruns` skill, whose guides load only when a task needs them, and an Everruns
MCP connection (the demo instance at `https://app.everruns.com/mcp` by default; point
it at your own install).

| Skill | Your agent can… |
|---|---|
| `everruns` | Everything Everruns: the Rust Framework; installing your own Everruns; the CLI, MCP, REST API and SDKs; building, running, debugging, evaluating and shipping agents; spend, health and change history. One guide per task under `references/`, read only when needed |

Claude Code:

```text
/plugin install everruns --marketplace everruns/plugins
```

Other hosts: <https://github.com/everruns/plugins#install>.
Docs: <https://everruns.com/docs/getting-started/use-in-ai-tools/>.

## Maintaining shared skills

`everruns` is a distributed copy
of the canonical [`skills/everruns`](https://github.com/everruns/everruns/tree/main/skills/everruns), references included.
Never edit it here: everruns' skills-sync workflow copies every change.
Edit skill descriptions in `catalog.json` and regenerate this README and the
root skills table with `node scripts/build.mjs`.
