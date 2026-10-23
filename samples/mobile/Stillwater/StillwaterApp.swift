import SwiftUI
import UniformTypeIdentifiers

private let ink = Color(red:0.16,green:0.30,blue:0.39)
private let mist = Color(red:0.93,green:0.96,blue:0.97)
private let sage = Color(red:0.84,green:0.90,blue:0.85)
private let lavender = Color(red:0.86,green:0.87,blue:0.94)
private let secondary = Color(red:0.38,green:0.47,blue:0.51)

@main struct StillwaterApp: App {
 var body: some Scene { WindowGroup { JournalHome().preferredColorScheme(.light) } }
}
@MainActor final class JournalStore: ObservableObject {
 @Published var archive = JournalArchive(entries:[])
 @Published var error: String?
 @Published var blocked = false
 let disk = JournalDisk(directory:FileManager.default.urls(for:.applicationSupportDirectory,in:.userDomainMask)[0].appendingPathComponent("Stillwater"))
 init(){ do { archive = try disk.load() } catch { blocked = true; self.error = "Your saved file needs recovery and has not been overwritten. " + error.localizedDescription } }
 @discardableResult func save(_ next:JournalArchive)->Bool {
 guard !blocked else { error = "Keep journal.json and journal.previous.json before recovering your data."; return false }
 do { try disk.save(next); archive = next; return true } catch { self.error = error.localizedDescription; return false }
 }
 func toggle(_ id:String){ var next = archive; if let i = next.entries.firstIndex(where:{$0.id == id}) { next.entries[i].starred.toggle(); save(next) } }
}
struct JournalDocument: FileDocument {
 static var readableContentTypes:[UTType] { [.json] }
 var data:Data
 init(_ archive:JournalArchive)throws { data = try archive.encoded() }
 init(configuration:ReadConfiguration)throws { guard let data=configuration.file.regularFileContents else {throw JournalError.invalid}; _ = try JournalArchive.decode(data); self.data=data }
 func fileWrapper(configuration:WriteConfiguration)throws->FileWrapper { FileWrapper(regularFileWithContents:data) }
}
struct JournalHome:View {
 @StateObject private var store = JournalStore()
 @State private var tab=0
 @State private var query=""
 @State private var favorites=false
 @State private var editing:Observation?
 @State private var showEditor=false
 @State private var exporting=false
 @State private var importing=false
 @State private var document:JournalDocument?
 @State private var pending:JournalArchive?
 @State private var confirmImport=false
 var body:some View {
 TabView(selection:$tab){
 NavigationStack { today }.tabItem{Label("Outside",systemImage:"sun.horizon")}.tag(0)
 NavigationStack { journal }.tabItem{Label("Journal",systemImage:"book.closed")}.tag(1)
 NavigationStack { places }.tabItem{Label("Places",systemImage:"map")}.tag(2)
 }.tint(ink)
 .sheet(isPresented:$showEditor){ObservationEditor(store:store,existing:editing)}
 .alert("A little attention needed",isPresented:Binding(get:{store.error != nil},set:{if !$0 {store.error=nil}})){Button("OK"){store.error=nil}}message:{Text(store.error ?? "")}
 .fileExporter(isPresented:$exporting,document:document,contentType:.json,defaultFilename:"stillwater-journal"){if case .failure(let e)=$0{store.error=e.localizedDescription}}
 .fileImporter(isPresented:$importing,allowedContentTypes:[.json]){result in
 do{let url=try result.get();let access=url.startAccessingSecurityScopedResource();defer{if access{url.stopAccessingSecurityScopedResource()}}
 guard (try url.resourceValues(forKeys:[.fileSizeKey]).fileSize ?? 0) <= 500_000 else{throw JournalError.invalid}
 pending=try JournalArchive.decode(Data(contentsOf:url));confirmImport=true
 }catch{store.error=error.localizedDescription}}
 .confirmationDialog("Replace this device’s journal?",isPresented:$confirmImport,titleVisibility:.visible){Button("Replace with imported journal",role:.destructive){if let value=pending{store.save(value)};pending=nil};Button("Keep current journal",role:.cancel){pending=nil}}message:{Text("Export your current copy first. The imported journal replaces all entries on this device.")}
 }
 private func add(){editing=nil;showEditor=true}
 private func edit(_ e:Observation){editing=e;showEditor=true}
 private func eyebrow(_ text:String)->some View {Text(text).font(.system(size:9,weight:.medium,design:.monospaced)).tracking(1.5).foregroundStyle(secondary)}
 private var today:some View {
 ScrollView{
 VStack(alignment:.leading,spacing:24){
 HStack{HStack(spacing:8){Image(systemName:"water.waves").font(.title2);Text("stillwater").font(.system(size:29,design:.serif))};Spacer();Text("03").font(.system(size:14,design:.serif)).padding(12).overlay(Circle().stroke(ink.opacity(0.3)))}
 VStack(alignment:.leading,spacing:9){eyebrow("A PERSONAL FIELD JOURNAL");Text("Go slowly.\nLook closely.").font(.system(size:44,weight:.regular,design:.serif)).tracking(-1.5);Text("There’s a whole world in the small things.").font(.system(size:12)).foregroundStyle(secondary)}
 ZStack(alignment:.bottomLeading){Landscape().frame(height:205);VStack(alignment:.leading,spacing:6){eyebrow("YOUR NEXT LITTLE ESCAPE");Text("Somewhere by the water.").font(.system(size:21,design:.serif))}.padding(20).background(.thinMaterial).clipShape(RoundedRectangle(cornerRadius:15)).padding(12)}.clipShape(RoundedRectangle(cornerRadius:24)).accessibilityElement(children:.combine).accessibilityLabel("Illustrated fictional Stillwater landscape. Somewhere by the water.")
 Button(action:add){HStack{Image(systemName:"plus").font(.title3);Text("Keep an observation").font(.system(size:14,weight:.medium));Spacer();Image(systemName:"arrow.up.right")}.padding(19).foregroundStyle(.white).background(ink,in:RoundedRectangle(cornerRadius:16))}
 HStack{eyebrow("RECENTLY NOTICED");Spacer();Button("All notes →"){tab=1}.font(.system(size:10))}
 if let first=store.archive.entries.sorted(by:{$0.date>$1.date}).first{noteRow(first)}else{Text("The first page is yours.").font(.system(size:20,design:.serif))}
 Text("FICTIONAL PLACES · SAVED ON THIS DEVICE").font(.system(size:8,design:.monospaced)).foregroundStyle(secondary)
 }.padding(24)
 }.background(mist).toolbar(.hidden,for:.navigationBar)
 }
 private func noteRow(_ e:Observation)->some View {
 Button{edit(e)}label:{HStack(alignment:.top,spacing:15){Image(systemName:e.symbol).font(.system(size:22,weight:.light)).frame(width:45,height:50).background(e.category=="bird" ? lavender:sage,in:RoundedRectangle(cornerRadius:13));VStack(alignment:.leading,spacing:7){Text(e.title).font(.system(size:21,design:.serif)).multilineTextAlignment(.leading);Text(e.placeName+" · "+e.date.suffix(5)).font(.system(size:10)).foregroundStyle(secondary);Text(e.notes).font(.system(size:12)).lineLimit(2).multilineTextAlignment(.leading).foregroundStyle(secondary)};Spacer(minLength:0);if e.starred{Image(systemName:"star.fill").font(.system(size:10)).foregroundStyle(secondary)}}.foregroundStyle(ink).padding(.vertical,8)}.buttonStyle(.plain)
 }
 private var journal:some View {
 let entries=store.archive.entries.filter{(!favorites || $0.starred)&&(query.isEmpty || ($0.title+" "+$0.notes+" "+$0.placeName).localizedCaseInsensitiveContains(query))}.sorted{$0.date>$1.date}
 return ScrollView{VStack(alignment:.leading,spacing:20){eyebrow("THE THINGS YOU KEPT");Text("Your little\ncollection.").font(.system(size:43,design:.serif)).tracking(-1.4);Toggle("Favorites only",isOn:$favorites).font(.system(size:12));ForEach(entries){e in VStack(alignment:.leading){noteRow(e);Button(e.starred ? "★ Remove favorite":"☆ Keep close"){store.toggle(e.id)}.font(.system(size:11)).padding(.leading,60);Divider()}};if entries.isEmpty{Text("Nothing here yet. Try another search or add a note.").font(.system(size:15,design:.serif))}}.padding(24)}.background(mist).navigationTitle("Journal").navigationBarTitleDisplayMode(.inline).searchable(text:$query,prompt:"A word, a place, a memory…").toolbar{ToolbarItem(placement:.topBarLeading){Menu{Button("Export journal"){do{document=try JournalDocument(store.archive);exporting=true}catch{store.error=error.localizedDescription}};Button("Import journal"){importing=true}}label:{Image(systemName:"tray.and.arrow.up")}.accessibilityLabel("Journal backup options")};ToolbarItem(placement:.topBarTrailing){Button(action:add){Image(systemName:"plus")}.accessibilityLabel("Add observation")}}
 }
 private var places:some View {
 ScrollView{VStack(alignment:.leading,spacing:24){eyebrow("AN IMAGINED LANDSCAPE");Text("A place to\ncome back to.").font(.system(size:42,design:.serif)).tracking(-1.4);Landscape().frame(height:240).clipShape(RoundedRectangle(cornerRadius:25));ForEach(["lake","grove","meadow"],id:\.self){key in VStack(alignment:.leading,spacing:12){HStack{Text(Observation.places[key]!).font(.system(size:25,design:.serif));Spacer();Text("\(store.archive.entries.filter{$0.place==key}.count) notes").font(.system(size:10)).foregroundStyle(secondary)};Text(key=="lake" ? "Watch one patch of water. What changes?":key=="grove" ? "Stand still and listen. Separate the sounds.":"Find three different shapes in the grass.").font(.system(size:13)).foregroundStyle(secondary);Button("Write here ↗"){editing=Observation(id:UUID().uuidString,title:"",place:key,category:"moment",date:Self.todayDate(),starred:false,notes:"");showEditor=true}.font(.system(size:12));Divider()}};Text("An illustrative setting, not a navigation map or species guide.").font(.system(size:10)).foregroundStyle(secondary)}.padding(24)}.background(mist).navigationTitle("Places").navigationBarTitleDisplayMode(.inline)
 }
 static func todayDate()->String{let f=DateFormatter();f.calendar=Calendar(identifier:.gregorian);f.locale=Locale(identifier:"en_US_POSIX");f.dateFormat="yyyy-MM-dd";return f.string(from:Date())}
}
struct ObservationEditor:View {
 @ObservedObject var store:JournalStore
 let existing:Observation?
 @Environment(\.dismiss) var dismiss
 @State private var title=""
 @State private var place="lake"
 @State private var category="moment"
 @State private var date=JournalHome.todayDate()
 @State private var notes=""
 var body:some View{
 NavigationStack{Form{Section("A small thing, remembered"){TextField("Title",text:$title);Picker("Place",selection:$place){ForEach(["lake","grove","meadow"],id:\.self){Text(Observation.places[$0]!).tag($0)}};Picker("Kind",selection:$category){ForEach(["bird","plant","moment"],id:\.self){Text(Observation.categories[$0]!).tag($0)}};TextField("Date (YYYY-MM-DD)",text:$date).keyboardType(.numbersAndPunctuation)};Section("Your observation"){TextEditor(text:$notes).frame(minHeight:210).accessibilityLabel("Your observation")};Section{Text("This journal stays on this device. Export it to keep another copy or move it to the web and desktop samples.").font(.footnote)}}.navigationTitle(existing?.title.isEmpty==false ? "Keep the memory":"A new observation").navigationBarTitleDisplayMode(.inline).toolbar{ToolbarItem(placement:.cancellationAction){Button("Cancel"){dismiss()}};ToolbarItem(placement:.confirmationAction){Button("Save"){var next=store.archive;let entry=Observation(id:existing?.id ?? UUID().uuidString,title:title.trimmingCharacters(in:.whitespacesAndNewlines),place:place,category:category,date:date,starred:existing?.starred ?? false,notes:notes.trimmingCharacters(in:.whitespacesAndNewlines));if let i=next.entries.firstIndex(where:{$0.id==entry.id}){next.entries[i]=entry}else{next.entries.insert(entry,at:0)};if store.save(next){dismiss()}}.disabled(title.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty)}}
 }.tint(ink).onAppear{if let e=existing{title=e.title;place=e.place;category=e.category;date=e.date;notes=e.notes}}
 }
}
struct Landscape:View {
 var body:some View {
 GeometryReader{g in
 Canvas{ctx,size in
 let w=size.width,h=size.height
 ctx.fill(Path(CGRect(origin:.zero,size:size)),with:.color(sage))
 var lake=Path();lake.move(to:CGPoint(x:w*0.40,y:-h*0.1));lake.addCurve(to:CGPoint(x:w*0.66,y:h*1.1),control1:CGPoint(x:w*1.25,y:h*0.06),control2:CGPoint(x:w*0.26,y:h*0.72));lake.addCurve(to:CGPoint(x:w*0.40,y:-h*0.1),control1:CGPoint(x:w*0.05,y:h*0.70),control2:CGPoint(x:w*0.60,y:h*0.36));ctx.fill(lake,with:.color(Color(red:0.57,green:0.73,blue:0.78)))
 var trail=Path();trail.move(to:CGPoint(x:w*0.18,y:0));trail.addCurve(to:CGPoint(x:w*0.3,y:h),control1:CGPoint(x:w*0.5,y:h*0.3),control2:CGPoint(x:-w*0.15,y:h*0.7));ctx.stroke(trail,with:.color(.white.opacity(0.8)),style:StrokeStyle(lineWidth:12));ctx.stroke(trail,with:.color(ink.opacity(0.3)),style:StrokeStyle(lineWidth:1,dash:[3,4]))
 for (x,y) in [(0.12,0.2),(0.2,0.33),(0.83,0.24),(0.88,0.43)]{let cx=w*x,cy=h*y;ctx.stroke(Path{p in p.move(to:CGPoint(x:cx,y:cy));p.addLine(to:CGPoint(x:cx,y:cy+22))},with:.color(ink.opacity(0.5)),lineWidth:2);ctx.fill(Path(ellipseIn:CGRect(x:cx-12,y:cy-20,width:24,height:30)),with:.color(Color(red:0.48,green:0.65,blue:0.55)))}
 for i in 0..<5{let y=h*(0.15+Double(i)*0.15);var line=Path();line.move(to:CGPoint(x:w*0.5,y:y));line.addQuadCurve(to:CGPoint(x:w*0.62,y:y),control:CGPoint(x:w*0.56,y:y-5));ctx.stroke(line,with:.color(.white.opacity(0.4)),lineWidth:1)}
 ctx.draw(Text("Stillwater").font(.system(size:18,design:.serif).italic()).foregroundStyle(ink.opacity(0.6)),at:CGPoint(x:w*0.59,y:h*0.45))
 }
 }.accessibilityHidden(true)
 }
}
