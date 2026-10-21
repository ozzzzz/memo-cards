# Memo Cards

Static flashcards. No build step. Plain HTML + ES module.

## Add a dataset

1. Drop `data/<name>.json`:

   ```json
   {
     "title": "Shown in menu",
     "description": "optional",
     "cards": [{ "front": "...", "back": "..." or ["line 1", "line 2"], "note": "optional", "image": "img/x.webp (optional, replaces the text of the front)" }]
   }
   ```

2. Add `"<name>.json"` to `data/manifest.json`.

Deck URL: `#<name>`.

## Commands

Needs `uv` and `just`.

```
just check   # validate manifest + datasets
just serve   # http://localhost:8000
```

(`fetch` needs HTTP; `file://` will not work.)

## Deploy

GitHub Actions (`.github/workflows/pages.yml`): every push and PR runs `check.py` and `node --check app.js`. Push to `main` then deploys to GitHub Pages.

One-time setup: repo Settings → Pages → Source: **GitHub Actions**. For a custom subdomain, add a `CNAME` file (copied into the deploy) and a DNS CNAME record pointing to `<user>.github.io`.
