# Everruns plugins

Plugins that teach your coding agent to use [Everruns](https://everruns.com),
the platform for durable AI agents. Install one, sign in once, and ask your
agent to build, run, debug or ship Everruns agents for you.

```text
> Create an Everruns agent that summarizes Hacker News every weekday morning,
  run it once, and post it to our Slack.
```

Works in **Claude Code**, **Codex**, **Cursor** and **Gemini CLI**, and in any
host that reads the portable [Agent Plugins](https://agent-plugins.org) format.

## What you get

The `everruns` plugin connects your agent to the Everruns MCP server
(`https://app.everruns.com/mcp`, OAuth sign-in in the browser) and adds skills
that load only when a task needs them:

| Skill | Your agent can… |
|---|---|
| `everruns` | Use Everruns at all: concepts, the MCP tools and the `everruns <noun> <verb>` command language, safe changes, secrets, links, and which skill to load next |
| `everruns-run-agent` | Hand a task to one of your Everruns agents, follow it, pass files in and out, and bring the result back |
| `everruns-build-agent` | Create or change an agent from a plain-language description, give it knowledge and skills, and test it with a real message |
| `everruns-debug-session` | Explain why a session failed, stalled or gave a bad answer, fix it, and keep it fixed |
| `everruns-evaluate-agent` | Prove an agent works with evals built from real sessions, compare models, and score live traffic |
| `everruns-ship-agent` | Put an agent in front of people: Slack, web chat, A2A, webhooks, schedules and GitHub events, with a budget and a kill switch |
| `everruns-operate` | Answer what was spent, what is broken and who changed what across your organization |
| `everruns-agents-as-files` | Keep agents as `agent.toml` folders in your repository, and validate, diff, import and export them |
| `everruns-sdk` | Call Everruns from your app with the Python, TypeScript and Rust SDKs |
| `everruns-framework` | Run agents inside your own Rust program with the `everruns` crate or `everruns-serve` |

## Install

You need an Everruns account. Sign up at <https://app.everruns.com>; the first
tool call opens the sign-in page in your browser.

### Claude Code

```text
/plugin install everruns --marketplace everruns/plugins
```

On Claude Code older than 2.1.275, add the marketplace first:
`/plugin marketplace add everruns/plugins`, then `/plugin install everruns@everruns`.

### Codex

```bash
codex plugin marketplace add everruns/plugins
codex plugin add everruns@everruns
```

Or run `/plugins` in Codex and pick **Everruns**. Start a new session after
installing.

### Cursor

Open **Settings > Plugins**, paste `https://github.com/everruns/plugins`, and
install **Everruns**. From the Cursor CLI: `cursor-agent plugin marketplace add
everruns/plugins`, then `/plugin` and pick it from the Marketplace tab.

### Gemini CLI

```bash
gemini extensions install https://github.com/everruns/plugins
```

### Any other agent

- **Agent Plugins hosts** (GitHub Copilot, VS Code, Kiro and others): point the
  host at `plugins/everruns/`. Its `plugin.json`, `mcp.json` and `skills/`
  follow Agent Plugins 1.0.
- **MCP only**: add `https://app.everruns.com/mcp` as a remote (Streamable
  HTTP) server named `everruns`.
- **Skills only**: copy `plugins/everruns/skills/*` into your agent's skills
  folder (for example `.claude/skills/` or `.agents/skills/`).

## First run

1. Ask: "Who am I on Everruns?" Your host opens the browser to sign in.
2. Then ask for real work: "Ask my research agent to summarize this repo",
   "Why did https://app.everruns.com/sessions/… fail?", "How much did our
   agents spend this week?", "Export the triage agent into `agents/triage`".

## Works even better with the CLI

The plugin needs nothing but the MCP server: it works in chat apps without a
shell. Under the hood, everything Everruns can do is one command language,
`everruns <noun> <verb> --flags`, which the MCP server runs for your agent. If
the [`everruns` CLI](https://docs.everruns.com/features/cli/) is installed and
signed in, the skills use it directly instead, which is faster, needs no tool
schemas, and adds local file sync.

```bash
brew tap everruns/tap && brew install everruns
everruns login
```

## Self-hosted Everruns

The plugin points at Everruns Cloud. For your own deployment:

- **CLI**: `everruns --api-url https://<your-host>/api login`, or set
  `EVERRUNS_API_URL`.
- **MCP**: register your server under the same name, for example
  `claude mcp add --transport http everruns https://<your-host>/mcp`, and keep
  the skills.

## Security and privacy

- Sign-in uses OAuth 2.1 with your Everruns account. The plugin contains no
  keys and stores nothing.
- Your agent acts as you, with your permissions in each organization.
- Secrets never pass through the model: the skills use links where you type the
  value into Everruns directly.
- Every change your agent makes is recorded in Everruns history with the
  reason it gave.

Report a vulnerability to <security@everruns.com>, not in a public issue.

## Repository layout

```text
plugins/everruns/
  plugin.json, mcp.json         portable Agent Plugins manifest and MCP config (hand-written)
  skills/<name>/SKILL.md        the skills (hand-written)
  .claude-plugin/ .codex-plugin/ .cursor-plugin/ .mcp.json   host manifests (generated)
  assets/                       logo and icon
  evals/                        scenario evals against a mocked Everruns organization
catalog.json                    marketplace listing and per-host metadata (hand-written)
.claude-plugin/ .agents/plugins/ .cursor-plugin/   marketplaces (generated)
gemini-extension.json, skills   Gemini CLI entry point (generated)
scripts/build.mjs               generator and checks
scripts/check-*.mjs             skills match the live MCP tools and commands
scripts/eval.mjs                runs the scenario evals with and without the skills
```

## Contributing

Edit only the hand-written files, then run:

```bash
node scripts/build.mjs           # regenerate host files
node scripts/build.mjs --check   # what CI runs
node scripts/check-commands.mjs  # every `everruns …` command in a skill exists
```

### Scenario evals

`plugins/everruns/evals/` holds tasks a user would give a coding agent: hand
work to an agent, explain a failed session, report spend, set up regression
evals, handle a pasted API key, publish publicly, and write an SDK script. Each
runs against a mocked Everruns MCP server, so no account is touched. The script
runs every case three ways: with the plugin, with the MCP server but no skills,
and with no plugin, so the table shows what the skills themselves add.

```bash
ANTHROPIC_API_KEY=... node scripts/eval.mjs --runs 3 --model claude-sonnet-5-5
```

It needs [Claude Code](https://code.claude.com) (`claude plugin eval`) and
spends real model tokens, so it is run by hand before a release rather than
in CI. When you change a skill, run the cases it affects (`--case <name>`).

Skills follow the [Agent Skills](https://agentskills.io/specification) format:
a short `description` that says when to load the skill, a body under 500
lines, and no API detail the server already documents (`--help` and
`discover` are the source of truth for flags). Bump `version` in
`plugin.json` when a skill or manifest changes so hosts pick up the update.

Issues and pull requests are welcome. For Everruns itself, see
[everruns/everruns](https://github.com/everruns/everruns).

## License

[MIT](LICENSE)
