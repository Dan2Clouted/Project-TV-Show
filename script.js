let allShows = [];
let allEpisodes = [];
let episodeCache = {};

// ========================
// INIT
// ========================
function setup() {
  fetch("https://api.tvmaze.com/shows")
    .then((res) => res.json())
    .then((shows) => {
      allShows = shows;

      shows.sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
      );

      renderShows(allShows);
      updateShowCount(allShows.length, allShows.length);
      setupShowSearch();
      populateShowSelector(shows);
    });
}

// ========================
// SHOW SELECTOR
// ========================
function populateShowSelector(shows) {
  const selector = document.getElementById("show-selector");
  selector.innerHTML = "";

  shows.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    selector.appendChild(option);
  });

  selector.onchange = function () {
    openShow(selector.value);
  };
}

// ========================
// RENDER SHOWS
// ========================
function renderShows(showList) {
  const container = document.getElementById("shows-container");
  container.innerHTML = "";

  showList.forEach((show) => {
    const card = document.createElement("div");
    card.classList.add("show-card");

    card.innerHTML = `
      <h2>${show.name}</h2>

      <div class="card-content">
        <img src="${show.image?.medium || ""}" />

        <div class="text">
          <p>${show.summary}</p>

          <div class="info-box">
            <p><strong>Genres:</strong> ${show.genres.join(", ")}</p>
            <p><strong>Status:</strong> ${show.status}</p>
            <p><strong>Rating:</strong> ${show.rating?.average || "N/A"}</p>
            <p><strong>Runtime:</strong> ${show.runtime} mins</p>
          </div>
        </div>
      </div>
    `;

    card.onclick = () => openShow(show.id);

    container.appendChild(card);
  });
}

// ========================
// SHOW SEARCH
// ========================
function setupShowSearch() {
  const input = document.getElementById("show-search");

  input.addEventListener("input", function () {
    const term = input.value.toLowerCase();

    const filtered = allShows.filter(
      (show) =>
        show.name.toLowerCase().includes(term) ||
        show.genres.join(" ").toLowerCase().includes(term) ||
        show.summary.toLowerCase().includes(term),
    );

    renderShows(filtered);
    updateShowCount(filtered.length, allShows.length);
  });
}

// ========================
// OPEN SHOW
// ========================
function openShow(showId) {
  document.getElementById("shows-view").style.display = "none";
  document.getElementById("episodes-view").style.display = "block";

  loadEpisodesForShow(showId);
}

// ========================
// BACK BUTTON
// ========================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("back-btn").onclick = function () {
    document.getElementById("episodes-view").style.display = "none";
    document.getElementById("shows-view").style.display = "block";
  };
});

// ========================
// LOAD EPISODES
// ========================
function loadEpisodesForShow(showId) {
  const message = document.getElementById("message");

  if (episodeCache[showId]) {
    allEpisodes = episodeCache[showId];
    renderEpisodes(allEpisodes);
    return;
  }

  message.textContent = "Loading episodes...";

  fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
    .then((res) => res.json())
    .then((episodes) => {
      episodeCache[showId] = episodes;
      allEpisodes = episodes;

      message.textContent = "";
      renderEpisodes(allEpisodes);
    })
    .catch(() => {
      message.textContent = "Failed to load episodes.";
    });
}

// ========================
// RENDER EPISODES
// ========================
function renderEpisodes(list) {
  makePageForEpisodes(list);
  updateCount(list);

  populateSelector(allEpisodes);

  setupSearch();
}

// ========================
// SEARCH EPISODES
// ========================
function setupSearch() {
  const searchInput = document.getElementById("search");
  searchInput.value = "";

  searchInput.oninput = function () {
    const term = searchInput.value.toLowerCase();

    const filtered = allEpisodes.filter(
      (ep) =>
        ep.name.toLowerCase().includes(term) ||
        ep.summary.toLowerCase().includes(term),
    );

    makePageForEpisodes(filtered);
    updateCount(filtered);
  };
}

// ========================
// EPISODE DROPDOWN
// ========================
function populateSelector(list) {
  const selector = document.getElementById("show-select");
  selector.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = "All Episodes";
  selector.appendChild(defaultOption);

  list.forEach((ep) => {
    const season = String(ep.season).padStart(2, "0");
    const number = String(ep.number).padStart(2, "0");

    const option = document.createElement("option");
    option.value = ep.id;
    option.textContent = `S${season}E${number} - ${ep.name}`;
    selector.appendChild(option);
  });

  selector.onchange = function () {
    if (selector.value === "all") {
      makePageForEpisodes(allEpisodes);
      updateCount(allEpisodes);
    } else {
      const selected = allEpisodes.find((ep) => ep.id == selector.value);
      makePageForEpisodes([selected]);
      updateCount([selected]);
    }
  };
}

// ========================
// CREATE EPISODE CARDS
// ========================
function makePageForEpisodes(list) {
  const root = document.getElementById("root");
  root.innerHTML = "";

  list.forEach((ep) => {
    const season = String(ep.season).padStart(2, "0");
    const number = String(ep.number).padStart(2, "0");

    const card = document.createElement("div");
    card.classList.add("episode-card");

    card.innerHTML = `
      <h2>${ep.name} - S${season}E${number}</h2>
      <img src="${ep.image?.medium || ""}" />
      ${ep.summary}
    `;

    root.appendChild(card);
  });
}

// ========================
// COUNTS
// ========================
function updateShowCount(filtered, total) {
  document.getElementById("show-count").textContent =
    `Found ${filtered} / ${total} shows`;
}

function updateCount(list) {
  document.getElementById("count").textContent =
    `Displaying ${list.length} episode(s)`;
}

window.onload = setup;
