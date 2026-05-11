# QPC V2 Mushaf Modular Version

This package breaks the previous large HTML into separate files:

```text
index.html
styles.css
app.js
data/qpc-v2.min.json
data/mushaf-layout.min.json
fonts/.gitkeep
```

## Important

Do not open `index.html` directly from local files if the browser blocks JSON fetch. Use one of these:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Or upload the complete folder to GitHub Pages.

## Fonts

The app loads page fonts dynamically. It first tries:

```text
fonts/QCF_P001.woff2
```

If local fonts are not available, it tries jsDelivr CDN:

```text
https://cdn.jsdelivr.net/gh/nuqayah/qpc-fonts@master/mushaf-v2-woff2/QCF_P001.woff2
```

For fully offline use, put all QCF fonts in the `fonts` folder:

```text
fonts/QCF_P001.woff2
...
fonts/QCF_P604.woff2
fonts/QCF_BSML.woff2
```
