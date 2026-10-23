# Stillwater for iPhone

Open `Stillwater.xcodeproj` in Xcode, choose the Stillwater scheme and an iPhone Simulator, then Run. iOS 17 or later is required. A physical device requires your own signing configuration; this sample does not include an App Store release.

Outside is the pocket journal home. Journal provides search, favorites, editing and a backup menu. Places offers prompts and starts an entry with its place preselected.

```sh
xcodebuild -project samples/mobile/Stillwater.xcodeproj -scheme Stillwater -sdk iphonesimulator -configuration Debug -derivedDataPath build/mobile CODE_SIGNING_ALLOWED=NO build
npm run test:mobile
```

Run commands from the repository root. Entries are stored in the app’s Application Support/Stillwater/journal.json file, with journal.previous.json retaining the preceding save. Damaged existing data is preserved and writes are blocked. Use Xcode’s app-container tools to recover a known-good export after keeping a copy of both files.

JSON exports use the same Stillwater v1 schema as the web and desktop samples. Import replaces this device’s journal after confirmation. Files are readable, not encrypted. No account, cloud synchronization, sensor access or analytics is included.

Native visual verification uses the iPhone Simulator; no Android or iPad interface is claimed.
