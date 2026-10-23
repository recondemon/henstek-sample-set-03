import Foundation

@main struct Checks {
  static func main() throws {
    let seed = JournalArchive.example
    assert(tryValue { try JournalArchive.decode(seed.encoded()) } == seed)
    let json = try Data(contentsOf: URL(fileURLWithPath: "fixtures/stillwater-journal.json"))
    assert(tryValue { try JournalArchive.decode(json) } == seed)
    for change in ["2026-02-30", "1900-02-29", "2101-01-01", "2026-1-01"] {
      var next = seed
      next.entries[0].date = change
      reject { try next.validated() }
    }
    var duplicate = seed
    duplicate.entries.append(seed.entries[0])
    reject { try duplicate.validated() }
    var oversized = seed
    oversized.entries = (0..<100).map { i in
      var e = seed.entries[0]
      e.id = String(i)
      e.notes = String(repeating: "界", count: 4000)
      return e
    }
    reject { try oversized.encoded() }
    let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    defer { try? FileManager.default.removeItem(at: dir) }
    let disk = JournalDisk(directory: dir)
    assert(tryValue { try disk.load() } == seed)
    try disk.save(seed)
    var next = seed
    next.entries[0].title = "A new observation"
    try disk.save(next)
    assert(tryValue { try disk.load() } == next)
    assert(
      tryValue {
        try JournalArchive.decode(
          Data(contentsOf: dir.appendingPathComponent("journal.previous.json")))
      } == seed)
    try Data("broken".utf8).write(to: disk.file)
    reject { try disk.load() }
    reject { try disk.save(seed) }
    assert(tryValue { try String(contentsOf: disk.file, encoding: .utf8) } == "broken")
    print("Swift journal validation, shared fixture and recovery checks passed.")
  }
  static func tryValue<T>(_ action: () throws -> T) -> T {
    do { return try action() } catch { fatalError("Unexpected failure: \(error)") }
  }
  static func reject<T>(_ action: () throws -> T) {
    do {
      _ = try action()
      fatalError("Expected rejection")
    } catch {}
  }
}
