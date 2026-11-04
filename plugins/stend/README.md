# Stend plugin

Lets a coding agent publish what it builds (a report, a dashboard, a one-pager)
as a web page at a secret link on [stend.sh](https://stend.sh). It adds the Stend
MCP server (`https://stend.sh/mcp`, OAuth sign-in with an Everruns account) and
the skill on publishing, revising and sharing pages.

| Skill | Your agent can… |
|---|---|
| `stend` | Publish a page at a secret link, revise it in place, share it for editing, put it behind a password, and take it offline |

Claude Code:

```text
/plugin install stend --marketplace everruns/plugins
```

Other hosts: <https://github.com/everruns/plugins#install>.
Docs: <https://stend.sh/llms.txt>.

## Maintaining the skill

`stend` is a copy of the skill Stend serves itself, at
<https://stend.sh/.well-known/agent-skills/stend/SKILL.md> (with its `references/`)
and over MCP as `skill://stend/SKILL.md`. When Stend's skill changes, copy the
directory here and bump `version` in `plugin.json`.
