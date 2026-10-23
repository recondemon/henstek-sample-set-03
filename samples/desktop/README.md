# Stillwater Desk

A local writing workspace with place filters, favorites, search, entry editing and compatible JSON import/export.

## Native macOS

```sh
npm ci
npm run build
npm --prefix samples/desktop ci
npm run desktop
```

Run from the repository root using Node 22.12 or newer. `npm --prefix samples/desktop run pack` packages an Apple silicon macOS build in `build/desktop/`. The source does not ship a signed or notarized installer.

## Browser preview

`npm run dev`, then open `http://127.0.0.1:4333/desktop/`. The same renderer runs against browser-local storage, separate from both the native app and the web atlas.

## Storage and recovery

The native app stores `journal.json` in Electron’s `userData` directory (`~/Library/Application Support/Stillwater Desk` on the checked Mac). Its prior save is `journal.previous.json`. Writes use a temporary file and rename, validate input, and refuse to overwrite damaged existing data. Preserve both files before recovery. With the app closed, validate a backup using the shared model, then restore that copy as `journal.json`; reopen and verify it before removing anything.

The browser keys are `stillwater.desktop.v1` and `stillwater.desktop.v1.previous`. Imports replace the active journal after confirmation. Export first to preserve the destination copy.

The renderer is sandboxed, Node integration is disabled, navigation and new windows are blocked, and IPC accepts only the app’s main frame at its exact internal page URL. No external content is loaded. Native checks cover Apple silicon macOS only.
