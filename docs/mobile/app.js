import "../web/model.js";
import { $, escape as e, shell, editor, field, choices, check, notes, wireReset } from "./ui.js";
const { seed, validate, places, categories } = window.Journal;
let data = structuredClone(seed),
  tab = "outside",
  query = "",
  favorites = false,
  place = "";
function edit(entry, at) {
  const v = entry || {
    title: "",
    place: at || "lake",
    category: "moment",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    starred: false,
  };
  editor(
    entry ? "An observation" : "Keep an observation",
    field("Title", "title", v.title, "text", 80) +
      choices("Place", "place", places, v.place) +
      choices("Kind", "category", categories, v.category) +
      field("Date", "date", v.date, "date") +
      notes(v.notes, 4000) +
      check("Keep as a favorite", "starred", v.starred),
    (form) => {
      const next = {
        id: v.id || crypto.randomUUID(),
        title: form.get("title"),
        place: form.get("place"),
        category: form.get("category"),
        date: form.get("date"),
        notes: form.get("notes"),
        starred: form.has("starred"),
      };
      data = validate({
        ...data,
        entries: entry
          ? data.entries.map((x) => (x.id === v.id ? next : x))
          : [next, ...data.entries],
      });
      render();
    },
    entry
      ? () => {
          data = { ...data, entries: data.entries.filter((x) => x.id !== v.id) };
          render();
        }
      : null,
  );
}
function row(v) {
  return `<button class="card note-row" data-entry="${v.id}"><span class="symbol" aria-hidden="true">${v.category === "bird" ? "↟" : v.category === "plant" ? "❧" : "☼"}</span><span><h3>${e(v.title)}${v.starred ? " ☆" : ""}</h3><small>${places[v.place]} · ${v.date}</small><p>${e(v.notes)}</p></span></button>`;
}
function list() {
  const q = query.toLowerCase();
  return (
    data.entries
      .filter(
        (v) =>
          (!favorites || v.starred) &&
          (!place || v.place === place) &&
          [v.title, v.notes, places[v.place]].some((s) => s.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(row)
      .join("") ||
    '<p class="empty">A fresh page.<br>Try another search or keep a new observation.</p>'
  );
}
function render() {
  let content = "";
  if (tab === "outside")
    content = `<p class="eyebrow">A personal field journal / SW-03</p><h1>Go slowly.<br>Look closely.</h1><p class="caption">There’s a whole world in the small things.</p><figure class="landscape"><img src="../web/assets/landscape.svg" alt="Illustrated Stillwater lake and woodland"><figcaption>Somewhere by the water.</figcaption></figure><button id="add" class="primary">＋ Keep an observation ↗</button><div class="spread section-head"><span class="eyebrow">Recently noticed</span><button data-tab="journal">All notes →</button></div>${
      [...data.entries]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 1)
        .map(row)
        .join("") || "<p>The first page is yours.</p>"
    }`;
  if (tab === "journal")
    content = `<p class="eyebrow">Your collected days</p><div class="spread"><h1>My journal.</h1><button id="add" aria-label="Add an observation">＋</button></div><label class="search">Search observations<input id="search" type="search" value="${e(query)}" placeholder="A place, a detail, a memory…"></label><div class="filters"><button id="favorites" aria-pressed="${favorites}">${favorites ? "★ Favorites" : "☆ Favorites"}</button><button id="all" aria-pressed="${!favorites && !place}">All places</button></div>${place ? `<p class="eyebrow">${places[place]}</p>` : ""}<div id="entries">${list()}</div>`;
  if (tab === "places")
    content = `<p class="eyebrow">Familiar paths / fictional places</p><h1>A little<br>closer.</h1>${Object.entries(
      places,
    )
      .map(
        ([id, name]) =>
          `<article class="card place"><h2>${name}</h2><p class="caption">${{ lake: "Watch the water. Wait for what moves.", grove: "Look up. Listen for the little things.", meadow: "Follow the light through the grass." }[id]}</p><div class="spread"><button data-place="${id}">${data.entries.filter((v) => v.place === id).length} notes →</button><button data-add="${id}" aria-label="Add observation at ${name}">＋</button></div></article>`,
      )
      .join("")}`;
  shell(
    '<img class="brand-mark" src="../web/assets/stillwater-mark.svg" alt="">stillwater',
    content +
      '<p class="app-note">Fictional places · Mobile browser preview.<br>Your observations stay in this preview until you reload.</p>',
    [
      ["outside", "Outside", tab === "outside"],
      ["journal", "Journal", tab === "journal"],
      ["places", "Places", tab === "places"],
    ],
  );
  document.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        tab = b.dataset.tab;
        render();
        window.scrollTo(0, 0);
        document.querySelector(`.tabs [data-tab="${tab}"]`).focus();
      }),
  );
  bindEntries();
  if ($("#add")) $("#add").onclick = () => edit();
  if ($("#search"))
    $("#search").oninput = (event) => {
      query = event.target.value;
      $("#entries").innerHTML = list();
      bindEntries();
    };
  if ($("#favorites"))
    $("#favorites").onclick = () => {
      favorites = !favorites;
      render();
      $("#favorites").focus();
    };
  if ($("#all"))
    $("#all").onclick = () => {
      favorites = false;
      place = "";
      query = "";
      render();
      $("#all").focus();
    };
  document.querySelectorAll("[data-place]").forEach(
    (b) =>
      (b.onclick = () => {
        place = b.dataset.place;
        favorites = false;
        query = "";
        tab = "journal";
        render();
        window.scrollTo(0, 0);
      }),
  );
  document
    .querySelectorAll("[data-add]")
    .forEach((b) => (b.onclick = () => edit(null, b.dataset.add)));
  wireReset(() => {
    data = structuredClone(seed);
    tab = "outside";
    query = "";
    favorites = false;
    place = "";
    render();
  });
}
function bindEntries() {
  document
    .querySelectorAll("[data-entry]")
    .forEach((b) => (b.onclick = () => edit(data.entries.find((v) => v.id === b.dataset.entry))));
}
render();
