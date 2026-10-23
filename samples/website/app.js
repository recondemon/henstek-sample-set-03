(async () => {
  const { el, date, connect } = JournalUI,
    { places, categories, filtered } = Journal;
  let api,
    place = "lake",
    starred = false;
  const details = {
    lake: [
      "PLACE 01 / WATERSIDE",
      "By the water",
      "Where the ripples slow down and the patient ones wait.",
      "Watch one patch of water for a full minute. What changes?",
    ],
    grove: [
      "PLACE 02 / WOODLAND",
      "Under the trees",
      "A quieter world of shifting light, leaf litter and hidden voices.",
      "Stand still and listen. How many different sounds can you separate?",
    ],
    meadow: [
      "PLACE 03 / OPEN GROUND",
      "Out in the open",
      "Room for the wind, low clouds and whatever the season brings.",
      "Find three different shapes in the grass. Leave them where they are.",
    ],
  };
  function render(data) {
    document.getElementById("note-count").textContent = data.entries.length;
    const box = document.getElementById("place-entries");
    box.replaceChildren();
    const matches = filtered(data.entries, { place });
    for (const e of matches.slice(0, 2)) {
      const b = el("button", e.title);
      b.append(el("small", date(e.date).replace(", 2026", "")));
      b.onclick = () => api.edit(e);
      box.append(b);
    }
    if (!matches.length)
      box.append(el("p", "Your first observation belongs here.", "empty"));
    const list = document.getElementById("journal-entries");
    list.replaceChildren();
    const found = filtered(data.entries, {
      query: document.getElementById("search").value,
      category: document.getElementById("category").value,
      starred,
    });
    for (const e of found) {
      const card = el("article", undefined, "journal-card"),
        h = el("header"),
        fav = el("button", e.starred ? "★" : "☆", "favorite");
      fav.ariaLabel = (e.starred ? "Unfavorite " : "Favorite ") + e.title;
      fav.ariaPressed = String(e.starred);
      fav.onclick = () => api.toggle(e.id);
      h.append(el("span", categories[e.category].toUpperCase()), fav);
      const foot = el("footer"),
        edit = el("button", "Open note ↗");
      edit.onclick = () => api.edit(e);
      foot.append(el("span", date(e.date)), edit);
      card.append(h, el("h3", e.title), el("p", e.notes), foot);
      list.append(card);
    }
    if (!found.length)
      list.append(
        el(
          "p",
          "Nothing here yet. Try another filter or add your first observation.",
          "empty",
        ),
      );
  }
  api = await connect("stillwater.web.v1", render);
  render(api.value);
  function choose(p) {
    place = p;
    const [number, title, description, prompt] = details[p];
    document.getElementById("place-number").textContent = number;
    document.getElementById("place-title").textContent = title;
    document.getElementById("place-description").textContent = description;
    document.getElementById("place-prompt").textContent = prompt;
    const art = document.getElementById("place-art");
    art.src = p === "lake" ? "assets/heron.svg" : "assets/landscape.svg";
    art.alt =
      p === "lake"
        ? "Illustration of a heron standing among reeds"
        : "Illustrated fictional lake, woodland and meadow";
    document
      .querySelectorAll("[data-place]")
      .forEach((b) => (b.ariaPressed = String(b.dataset.place === p)));
    render(api.value);
  }
  document
    .querySelectorAll("[data-place]")
    .forEach((b) => (b.onclick = () => choose(b.dataset.place)));
  for (const name of ["explore", "journal"])
    document.getElementById(name + "-tab").onclick = () => {
      for (const v of ["explore", "journal"]) {
        document.getElementById(v + "-view").hidden = v !== name;
        document.getElementById(v + "-tab").ariaPressed = String(v === name);
      }
    };
  document.getElementById("new-entry").onclick = () => api.edit(null, place);
  document.getElementById("place-note").onclick = () => api.edit(null, place);
  document.getElementById("search").oninput = () => render(api.value);
  document.getElementById("category").onchange = () => render(api.value);
  document.getElementById("star-filter").onclick = (e) => {
    starred = !starred;
    e.currentTarget.ariaPressed = String(starred);
    render(api.value);
  };
  document.getElementById("export").onclick = api.export;
  document.getElementById("import").onclick = api.import;
})();
