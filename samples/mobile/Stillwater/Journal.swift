import Foundation

struct Observation: Codable, Identifiable, Equatable {
 var id: String
 var title: String
 var place: String
 var category: String
 var date: String
 var starred: Bool
 var notes: String
 static let places = ["lake": "Stillwater Lake", "grove": "Alder Grove", "meadow": "North Meadow"]
 static let categories = ["bird": "Birds", "plant": "Plants", "moment": "Small moments"]
 var placeName: String { Self.places[place] ?? place }
 var symbol: String { category == "bird" ? "bird" : category == "plant" ? "leaf" : "sun.haze" }
}
struct JournalArchive: Codable, Equatable {
 var format = "stillwater-journal"
 var version = 1
 var entries: [Observation]
 static let example = JournalArchive(entries: [
 Observation(id:"heron",title:"The patient one",place:"lake",category:"bird",date:"2026-10-23",starred:true,notes:"A heron held its place at the water’s edge for almost ten minutes. The whole lake seemed to wait with it.\n\nA reminder to stay a little longer next time."),
 Observation(id:"alder",title:"A little gold in the canopy",place:"grove",category:"plant",date:"2026-10-22",starred:false,notes:"The alder leaves have started turning. A few were floating in yesterday’s rain, small boats following the same current."),
 Observation(id:"mist",title:"Before the world woke up",place:"meadow",category:"moment",date:"2026-10-20",starred:true,notes:"Low mist over the grass. Wet shoes. The kind of morning that asks for nothing except being there."),
 Observation(id:"wren",title:"A voice in the brambles",place:"grove",category:"bird",date:"2026-10-18",starred:false,notes:"Heard the wren before I saw it: a small shape with a much bigger song. I sat on the fallen log until it came back.")])
 func validated() throws -> JournalArchive {
 guard format == "stillwater-journal", version == 1, entries.count <= 100, Set(entries.map(\.id)).count == entries.count else { throw JournalError.invalid }
 let formatter = DateFormatter(); formatter.calendar = Calendar(identifier:.gregorian); formatter.locale = Locale(identifier:"en_US_POSIX"); formatter.timeZone = TimeZone(secondsFromGMT:0); formatter.dateFormat = "yyyy-MM-dd"; formatter.isLenient = false
 for e in entries {
 guard e.id.range(of:"^[A-Za-z0-9_-]{1,80}$",options:.regularExpression) != nil,
 !e.title.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty, e.title.utf16.count <= 80,
 Observation.places[e.place] != nil, Observation.categories[e.category] != nil,
 e.notes.utf16.count <= 4000, e.date.range(of:"^[0-9]{4}-[0-9]{2}-[0-9]{2}$",options:.regularExpression) != nil,
 e.date >= "1900-01-01", e.date <= "2100-12-31", let date = formatter.date(from:e.date), formatter.string(from:date) == e.date
 else { throw JournalError.invalid }
 }
 return self
 }
 static func decode(_ data: Data) throws -> JournalArchive {
 guard data.count <= 500_000 else { throw JournalError.invalid }
 return try JSONDecoder().decode(JournalArchive.self,from:data).validated()
 }
 func encoded() throws -> Data {
 let encoder = JSONEncoder(); encoder.outputFormatting = [.prettyPrinted,.sortedKeys]
 let data = try encoder.encode(validated()); guard data.count <= 500_000 else { throw JournalError.invalid }; return data
 }
}
enum JournalError: LocalizedError {
 case invalid
 var errorDescription: String? { "Choose a Stillwater version 1 journal under 500 KB, with up to 100 valid entries. Titles can be 80 characters and notes 4,000 characters. Dates must be between 1900 and 2100." }
}
struct JournalDisk {
 let directory: URL
 var file: URL { directory.appendingPathComponent("journal.json") }
 func load() throws -> JournalArchive {
 if !FileManager.default.fileExists(atPath:file.path) { return .example }
 return try JournalArchive.decode(Data(contentsOf:file))
 }
 func save(_ archive: JournalArchive) throws {
 let data = try archive.encoded()
 try FileManager.default.createDirectory(at:directory,withIntermediateDirectories:true)
 if FileManager.default.fileExists(atPath:file.path) {
 let previous = try Data(contentsOf:file); _ = try JournalArchive.decode(previous)
 try previous.write(to:directory.appendingPathComponent("journal.previous.json"),options:.atomic)
 }
 try data.write(to:file,options:.atomic)
 }
}
