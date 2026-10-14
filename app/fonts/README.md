# Newsreader (heading font)

`newsreader-normal.woff2` and `newsreader-italic.woff2` are Google's Newsreader variable fonts
(SIL Open Font License 1.1, © The Newsreader Project Authors), trimmed to what the site uses:

- Latin letters, numbers and punctuation only (Basic Latin, Latin-1, curly quotes, dashes, bullet, arrows)
- weight axis 400–600 (the site uses 400, 500 and 600)
- optical-size axis 6–72, kept in full (the headings rely on it)

Same glyph shapes as the original, about 37% smaller. To rebuild from the Google files:

    pip install fonttools brotli
    pyftsubset ... then fontTools.varLib.instancer.instantiateVariableFont(font, {"wght": (400, 600), "opsz": (6, 72)})
