# The `annotations` kit

Hand-drawn marks on the page: underline a phrase, box a name, circle a step,
highlight a number. CSS only, so it works on a stend.

Use it to show a reader where to look, like a colleague marking a printout
with a pen.

## Turning it on

```
publish_stend(files: [...], kits: ["annotations"])
update_stend(id: "…", kits: ["annotations"])     # on a published stend
```

stend links the stylesheet into every page of that stend (HTML and rendered
Markdown) and serves it from its own origin. Do not add a `<link>`, and do not
link a CDN copy of anything: a stend URL is a secret, and a third-party request
leaks the visitor's IP.

## The marks

Put one class on the element:

```html
<span class="annotate-underline">ahead of plan</span>
```

| class | what it draws |
|---|---|
| `annotate-underline` | a double underline, gone over twice |
| `annotate-strike` | a line through the text |
| `annotate-crossed` | struck through and crossed out |
| `annotate-highlight` | a translucent marker pass behind the text |
| `annotate-box` | a box drawn around it |
| `annotate-circle` | a loop around it, overshooting where it started |
| `annotate-bracket` | a bracket at each end |

### Colour

Add `annotate-amber`, `annotate-blue`, `annotate-green`, `annotate-red` or `annotate-purple`. The
default is a warm pencil grey.

```html
<span class="annotate-box annotate-red">unsigned</span>
<span class="annotate-highlight annotate-amber">the Field numbers</span>
```

### Drawing the mark on

`annotate-draw` draws the mark once when the page opens. `annotate-on-scroll`
draws it as the reader scrolls to it, where the browser supports scroll-driven
animation; elsewhere the mark is already there. Both respect
`prefers-reduced-motion`. Use them sparingly.

## In Markdown

Markdown passes raw HTML through, so a `.md` stend uses the same markup:

```markdown
Revenue came in at <span class="annotate-underline annotate-green">£18,400</span>,
against a forecast we set <span class="annotate-strike">in March</span>.
```

## Notes

**`annotate-underline`, `annotate-strike`, `annotate-crossed` and
`annotate-highlight` follow wrapped text.** Mark a sentence and every line of
it is marked. Use these in running prose.

**`annotate-box`, `annotate-circle` and `annotate-bracket` do not wrap.** They
are drawn around the whole element and stay on one line. Use them on short
runs: a name, a number, a step.

**The marks vary a little.** The wobble is baked into the stylesheet because
nothing runs in a stend's browser. The repeating marks each start at a
different point along the stroke, so six underlines look different. The
enclosing marks (box, circle, bracket) are one drawing stretched to fit, so
they look the same every time.

## Use

Three or four marks on a page is plenty. Put them where the reader should
stop and leave the rest plain.

Pick the lightest mark that works: underline to draw the eye, highlight when
the value matters, box or circle for something to act on, strike or crossed
for something withdrawn.
