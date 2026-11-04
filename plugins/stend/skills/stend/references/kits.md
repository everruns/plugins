# Kits

A **kit** is a stylesheet stend hosts and links into every page of a stend that
asks for it. It gives a stend something that would otherwise need a
third-party CDN, a build step, or JavaScript, none of which a stend has.

A kit belongs to the stend, not to a file. It applies to every page in the
bundle, including files you add later and rendered Markdown.

```
publish_stend(files: [...], kits: ["annotations"])
update_stend(id: "…", kits: ["annotations"])   # turn one on later
update_stend(id: "…", kits: [])                # turn them all off
```

`get_stend` and `list_stends` report which kits a stend has.

## Why stend hosts them

**A stend URL is a secret.** Every subresource a page loads tells its host that
someone is reading that page, from that IP. A CDN link in a stend gives a third
party the audience of a document shared with a few people. So a kit (the CSS
and any font it needs) is served from stend's own origin, and nothing in it
reaches off-site.

A kit also does not count against the bundle's limits (50 files, 1 MiB each,
5 MiB total), is edge-cached across every stend that uses it, and cannot break
when an upstream CDN moves a file.

Do not link a CDN copy of a kit or of anything else. A published stend must
make no request off stend's origin. If what you need is not a kit, inline the
CSS into the bundle.

## Limits

A kit is CSS and cannot add behaviour. A stend runs no JavaScript because every
stend shares one browser origin, and a page that ran code could read another
visitor's password-protected stend. Anything interactive must be CSS
(`:hover`, `<details>`, `:target`) or precomputed before you publish.

A kit's artwork is drawn when stend is built, not when the page loads, so every
instance of a mark looks the same. There is no per-element randomness without
script.

## Available kits

- **annotations**: hand-drawn marks on the page: underline, box, circle, highlight, strike, bracket

Call `stend_guide` with a kit's name for its syntax.
