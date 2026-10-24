# Verification — Sample Set 03

Checked October 23, 2026.

## Automated checks

- Eight Node tests: schema validation, invalid dates and duplicate IDs, combined file-size limits, composable search/filter behavior, native previous-revision saves, damaged-file preservation, IPC origin boundaries and generated-page assets.
- Swift model checks: shared JSON fixture compatibility, date validation, duplicate IDs, size limits, persistence and damaged-file preservation.
- Xcode iPhone Simulator build and Apple silicon Electron packaging succeeded.
- HensTek build/link checks and seven inquiry tests include SW-03 references with cross-set styling.

## Interface walkthroughs

- Web at 1440×1000 and 390×844: illustrated place selection, preselected place in the editor, new observation, reload persistence, journal search, favorite filtering and JSON download.
- Native desktop: imported the web export through the file picker, confirmed replacement, and verified the added observation appeared with its favorite flag. Its renderer was checked separately in the browser.
- Native iPhone Simulator: Outside, observation creation/save, Journal, favorites, export to On My iPhone and import of the exported file with replacement confirmation. The saved entry remained after returning through the home screen.

## Captures and limits

`screenshots/website.png` and `screenshots/desktop.png` are actual browser-renderer captures. `screenshots/iphone-native.png` is a raw Simulator screen capture. Gallery copies use these same files.

Native testing covers the iPhone Simulator and Apple silicon macOS. Physical devices, Android, Windows, signed installers and app-store distribution have not been verified. JSON compatibility is tested against the same fixture in Swift and JavaScript; a live web-to-native-desktop transfer was also completed. There is no automatic synchronization.

The map and all initial observations are fictional. No sensors, external map service, payments or production accounts are connected.

## Interactive showcase — October 23, 2026

Verified locally in Chrome: gallery image opens each web/mobile/desktop demo in the expanded viewer; Close and Escape return to the gallery, with focus restored to the initiating link. Mobile framing was checked at a 390 × 844 browser viewport. Web and desktop use the existing browser implementations. The mobile companion is a browser adaptation, not an iOS runtime.

Mobile checks: Field Notes checklist changes and completion filters; Side A demo booking, ticket display and saved-record updates; Stillwater observation creation, favorite state and search. Desktop checks: job filtering, guest check-in totals and journal favorites. Existing model and published-asset checks pass. Native applications were not changed by this release.
