# Stillwater web atlas

Run `npm ci` and `npm run dev` from the repository root, then open `http://127.0.0.1:4333/web/`.

Choose one of three fictional places, use its observation prompt, and save a note. My journal supports search, kind filters, favorites, editing and JSON import/export. Imports replace the journal only after confirmation. No location service, map API, analytics, server or account is used.

Storage key: `stillwater.web.v1`; the preceding save is retained at `stillwater.web.v1.previous`. If stored data is damaged, writes are blocked. Export regularly. Browser storage is not a durable backup.

Edit `index.html`, `styles.css`, `app.js` and `assets/`; shared schema/editor code lives in `shared/`. Run the root build to publish into `docs/web/`.
