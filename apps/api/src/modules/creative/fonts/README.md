# Fonts

Embedded in the proposal PDF (`../proposal-pdf-builder.ts`) to match the
"boutique wedding deck" look Bia's own hand-made proposals already use
(script kicker word + tracked serif heading + soft rounded body text) —
pdfkit's 14 standard fonts don't include anything script-like or a warm
rounded sans, so these are the only binary assets in `apps/api`.

All three families are from [Google Fonts](https://fonts.google.com),
licensed under the SIL Open Font License 1.1 (see each family's own
OFL.txt at https://fonts.google.com/specimen/<name>/license) — free to
embed in this document.

- `GreatVibes-Regular.ttf` — the small script kicker above each section
  heading (e.g. "Minha" above "HISTÓRIA").
- `CormorantGaramond-*.ttf` — the large tracked-out serif headings and
  the cover's title.
- `Poppins-*.ttf` — body text and labels, replacing the previous
  Helvetica/Times for a warmer, rounder feel closer to the reference.
