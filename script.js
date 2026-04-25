let allShows = [];
let allEpisodes = [];
let episodeCache = {};
let favourites = JSON.parse(localStorage.getItem("favourites")) || [];
let showFavouritesOnly = false;

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

function sortShows(shows, type) {
  const sorted = [...shows];

  if (type === "rating") {
    sorted.sort((a, b) => {
      const aRating = a.rating?.average || 0;
      const bRating = b.rating?.average || 0;
      return bRating - aRating; // highest first
    });
  } else {
    // default A–Z
    sorted.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );
  }

  return sorted;
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
      <div class="card-header">
        <h2>${show.name}</h2>
        <button class="fav-btn">${favourites.includes(show.id) ? "★" : "☆"}</button>
      </div>

      <div class="card-content">
        <img src="${show.image?.medium || ""}" />

        <div class="text">
          <div class="summary">
            ${show.summary}
          </div>
          <button class="read-more-btn">Read more</button>

          <div class="info-box">
            <p><strong>Genres:</strong> ${show.genres.join(", ")}</p>
            <p><strong>Status:</strong> ${show.status}</p>
            <p><strong>Rating:</strong> ${show.rating?.average || "N/A"}</p>
            <p><strong>Runtime:</strong> ${show.runtime} mins</p>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);

    // FAVOURITE LOGIC
    const favBtn = card.querySelector(".fav-btn");

    favBtn.onclick = function (e) {
      e.stopPropagation();

      if (favourites.includes(show.id)) {
        favourites = favourites.filter((id) => id !== show.id);
        favBtn.textContent = "☆";
      } else {
        favourites.push(show.id);
        favBtn.textContent = "★";
      }

      localStorage.setItem("favourites", JSON.stringify(favourites));
    };

    // READ MORE LOGIC
    const summary = card.querySelector(".summary");
    const button = card.querySelector(".read-more-btn");

    const fullText = summary.innerText;
    const shortText = fullText.slice(0, 150) + "...";

    summary.innerText = shortText;

    button.onclick = function (e) {
      e.stopPropagation();

      if (button.textContent === "Read more") {
        summary.innerText = fullText;
        button.textContent = "Read less";
      } else {
        summary.innerText = shortText;
        button.textContent = "Read more";
      }
    };

    // CARD CLICK
    card.onclick = () => openShow(show.id);
  });
}

// ========================
// SHOW SEARCH
// ========================
function setupShowSearch() {
  const input = document.getElementById("show-search");
  const sortSelect = document.getElementById("sort-select");
  const favToggle = document.getElementById("fav-toggle");

  function updateView() {
    const term = input.value.toLowerCase();
    const sortType = sortSelect.value;

    let filtered = allShows.filter(
      (show) =>
        show.name.toLowerCase().includes(term) ||
        show.genres.join(" ").toLowerCase().includes(term) ||
        show.summary.toLowerCase().includes(term),
    );

    // apply favourites filter
    if (showFavouritesOnly) {
      filtered = filtered.filter((show) => favourites.includes(show.id));
    }

    if (showFavouritesOnly && filtered.length === 0) {
      document.getElementById("shows-container").innerHTML =
        "<p style='text-align:center; margin-top:40px;'>⭐ No favourite shows yet</p>";
      updateShowCount(0, allShows.length);
      return;
    }
    const sorted = sortShows(filtered, sortType);

    renderShows(sorted);
    updateShowCount(filtered.length, allShows.length);
  }

  input.addEventListener("input", updateView);
  sortSelect.addEventListener("change", updateView);

  // toggle logic
  favToggle.onclick = function () {
    showFavouritesOnly = !showFavouritesOnly;

    favToggle.classList.toggle("active");

    updateView();
  };
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
