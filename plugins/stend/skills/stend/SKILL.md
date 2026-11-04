---
name: stend
description: Publish a web page at a secret URL that the user can share. Use when someone asks to publish, share, or hand out something you built (a report, dashboard, comparison, or one-pager) instead of pasting it into chat. Also use to update or take down a page you published earlier.
---

# stend

Publish a page for a human to open, at a secret URL they share by hand.

A **stend** is a bundle of static files (`index.html` or `index.md`, plus any CSS or
images) served at an unguessable URL. Public by default, or behind a password.
Publishing returns the URL; revising never changes it.

## When to use this

Use stend when the result is for a person who is not in the conversation:

- "send this report to my team"
- "publish this dashboard"
- "make me a link for this"
- "share this comparison with a customer"

Do not use it as file storage, and do not publish something the user did not
ask to share.

## Connect

    https://stend.sh/mcp

OAuth 2.1, open dynamic registration, PKCE required. See `https://stend.sh/auth.md`.

## Publishing

Call `publish_stend` with `files`, including `index.html` or `index.md`:

    files: [
      { path: "index.html", content: "<!doctype html>…" },
      { path: "style.css",  content: "body{…}" },
      { path: "logo.png",   content: "<base64>", encoding: "base64" }
    ]

Write a complete page: a real `<title>` (it becomes the link preview), a
`<meta name="description">`, and styling inline or in a sibling file. stend
adds nothing except social-card tags on public stends.

### Markdown

For a document (notes, a summary, a writeup), publish Markdown and skip the
HTML:

    files: [ { path: "index.md", content: "# Findings\n\n…" } ]

stend renders it server-side as a styled page (GitHub-flavoured: tables, task
lists, footnotes, fenced code) with a small floating bar that links the
original `.md`. The first heading becomes the title and the link preview. Any
`.md` file in a bundle renders this way, so documents can link to each other.
Use HTML when layout matters (a dashboard, a designed one-pager) and Markdown
for text.

### A stend does not run JavaScript

Script files (`.js`, `.mjs`, `.cjs`, `.ts`) are refused. Script in HTML or SVG
(`<script>` blocks, `onclick`-style attributes, `javascript:` links) is removed
before the file is stored. Every stend shares one browser origin, so a page
that ran code could read another visitor's password-protected stend. The tools
report what they removed.

Make the page complete on load:

- render charts and diagrams as inline SVG, or send an image;
- precompute totals, sorting and filtering, and write the result into the HTML;
- use CSS for layout, hover, and open/close behaviour: `<details>`/`<summary>`
  covers most of it, and `:target` covers tabs;
- fetch data while you build the page, not while the visitor reads it.

If the user asks for something interactive, say that a stend is a static
document and offer a static version.

### Kits

A **kit** is a stylesheet stend hosts and links into every page of a stend that
asks for it. It belongs to the stend, not to a file, so it covers HTML,
rendered Markdown, and files you add later:

    publish_stend(files: [...], kits: ["annotations"])
    update_stend(id: "…", kits: ["annotations"])   # on a published stend
    update_stend(id: "…", kits: [])                # turn it off

- **annotations**: hand-drawn marks on the page.
  `<span class="annotate-underline">ahead of plan</span>`. Marks are
  `annotate-underline`, `annotate-strike`, `annotate-crossed`, `annotate-highlight`, `annotate-box`,
  `annotate-circle`, `annotate-bracket`; colours `annotate-amber`/`annotate-blue`/`annotate-green`/
  `annotate-red`/`annotate-purple`. CSS only. The first four follow wrapping
  text; the last three stay on one line.

Never link a CDN copy of a kit or of anything else. A stend URL is a secret,
and every third-party request gives that host the visitor's IP. That is why
stend hosts the files. Call `stend_guide` with a kit's name for its syntax.

### Who can open it

- **Public (default).** Anyone with the link can read it, and it shows a link
  preview (title, description, card image). The link is unguessable, so only
  people the user gives it to can find it.
- **Password.** Pass `password`. Only people with the password get in, and it
  is never indexed or previewed. Tell the user to send the password separately
  from the link.

`discoverable: false` keeps a public stend out of search results. Use it only
if the user asks: it **also removes the link preview** on X, Slack and
elsewhere, because those crawlers follow the same directive. Leave it alone for
anything the user will post publicly.

Limits: 50 files, 1 MiB per file, 5 MiB total.

## Revising

Do not republish a whole bundle to change a detail. Work as you would on code:

    search_stend      find where the text is
    read_stend_file   read it with line numbers (offset/limit for a slice)
    edit_stend_file   replace an exact string in place
    write_stend_file  add or replace one file

`edit_stend_file` needs `old_string` to match exactly and be unique unless you
pass `replace_all`. Read before you edit.

### Shared editing and revision checks

`share_stend(id, email, role)` grants `viewer`, `editor` (default), or `owner`
access at once. It sends no email; give the user the existing URL to share.
`list_stends` includes pages shared with the signed-in account. `get_stend`
returns the current revision and members.

Prefer `edit_stend_file` for a focused change. For `write_stend_file`,
`delete_stend_file`, or replacing `files` through `update_stend`, pass `if_rev`
from your latest read. A shared stend requires it for these writes. On a
conflict, read the returned diff, reread the content, and apply your edit to
the new revision. Do not retry a stale overwrite.

`stend_history(id, since_rev)` shows changes. When a tool returns `catch_up`,
tell the user its headline so they know someone else edited the page. Owners
can change settings and members, unshare a member, or delete the stend; editors
can change content. Use `unshare_stend` only when asked to revoke access.

## Managing

    list_stends        what the user has published
    get_stend          URL, settings, files
    delete_stend_file  remove one file (keep the active entry point)
    delete_stend       unpublish; the URL returns 404 at once

## The guide

Read [references/kits.md](references/kits.md) when choosing hosted styling,
and [references/annotations.md](references/annotations.md) for mark syntax.
[references/index.md](references/index.md) lists the guide topics. The same
MCP server serves these files through `resources/read`, and the HTTP skill
serves them at the same relative paths.

`stend_guide` is stend's documentation, fetched on demand instead of repeated
in every tool description. Call it with no topic for the list, or with one
(`kits`, `annotations`) for that page.

The same topics are MCP resources under `stend://guide/`: `resources/list`
lists them, `resources/templates/list` gives the shape `stend://guide/{topic}`,
and `stend://guide/index` is the list.

## Notes

- **A public stend's URL is its only protection.** Anyone with the link can
  read it. Nothing lists stends, but use a password for anything sensitive.
- **`discoverable: false` is not retroactive.** Turning it off stops future
  indexing, but a search engine may already have the page.
- **Protected stends show nothing in previews**, not the title or the label.
- **Keep the active entry point.** `index.html`, or `index.md` when there is no
  `index.html`, cannot be deleted; replace it instead.
- **Deletion is immediate for readers.** Use `delete_stend` when the user asks
  to take the page offline. A deleted stend keeps its file bodies and still
  counts toward account storage.
