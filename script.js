const episodeCache = {};

let allEpisodes = [];

function setup() {
  const message = document.getElementById("message");
  message.textContent = "Loading shows...";

  // ✅ fetch all shows first
  fetch("https://api.tvmaze.com/shows")
    .then(function (response) {
      return response.json();
    })
    .then(function (shows) {
      message.textContent = "";

      // ✅ sort shows alphabetically
      shows.sort(function (a, b) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });

      const showSelector = document.getElementById("show-selector");

      for (const show of shows) {
        const option = document.createElement("option");
        option.value = show.id;
        option.textContent = show.name;
        showSelector.appendChild(option);
      }

      // ✅ load episodes when show changes
      showSelector.addEventListener("change", function () {
        loadEpisodesForShow(showSelector.value);
      });

      // ✅ load first show on page load
      loadEpisodesForShow(showSelector.value);
    })
    .catch(function () {
      message.textContent = "Something went wrong. Please try again.";
    });
}

// 📺 LOAD EPISODES FOR A SHOW
function loadEpisodesForShow(showId) {
  // ✅ use cache if already fetched
  if (episodeCache[showId]) {
    allEpisodes = episodeCache[showId];
    populateSelector(allEpisodes);
    setupSearch();
    makePageForEpisodes(allEpisodes);
    updateCount(allEpisodes);
    return;
  }

  fetch("https://api.tvmaze.com/shows/" + showId + "/episodes")
    .then(function (response) {
      return response.json();
    })
    .then(function (episodes) {
      // ✅ store in cache
      episodeCache[showId] = episodes;
      allEpisodes = episodes;
      populateSelector(allEpisodes);
      setupSearch();
      makePageForEpisodes(allEpisodes);
      updateCount(allEpisodes);
    });
}

// 🔍 SEARCH SETUP
function setupSearch() {
  const searchInput = document.getElementById("search");
  searchInput.value = "";

  searchInput.oninput = function () {
    const term = searchInput.value.toLowerCase();

    const filtered = allEpisodes.filter(function (episode) {
      return (
        episode.name.toLowerCase().includes(term) ||
        episode.summary.toLowerCase().includes(term)
      );
    });

    makePageForEpisodes(filtered);
    updateCount(filtered);
  };
}

// 📋 DROPDOWN SELECTOR
function populateSelector(episodeList) {
  const selector = document.getElementById("show-select");

  selector.innerHTML = "";

  // ✅ default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = "All Episodes";
  selector.appendChild(defaultOption);

  for (const episode of episodeList) {
    const option = document.createElement("option");

    const season = String(episode.season).padStart(2, "0");
    const number = String(episode.number).padStart(2, "0");

    option.value = episode.id;
    option.textContent = `S${season}E${number} - ${episode.name}`;

    selector.appendChild(option);
  }

  // 🎯 scroll to episode
  selector.onchange = function () {
    const value = selector.value;

    if (value === "all") {
      makePageForEpisodes(allEpisodes);
      updateCount(allEpisodes);
    } else {
      const card = document.getElementById("episode-" + value);
      if (card) {
        card.scrollIntoView({ behavior: "smooth" });
      }
    }
  };
}

// 🎬 RENDER EPISODES
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  for (let episode of episodeList) {
    const card = document.createElement("div");
    card.classList.add("episode-card");
    card.id = "episode-" + episode.id;

    const title = document.createElement("h2");
    const image = document.createElement("img");
    const summary = document.createElement("p");

    const season = String(episode.season).padStart(2, "0");
    const number = String(episode.number).padStart(2, "0");

    title.textContent = `${episode.name} - S${season}E${number}`;

    // ⚠️ safe image handling
    image.src = episode.image?.medium || "";
    image.alt = episode.name;

    summary.innerHTML = episode.summary;

    card.appendChild(title);
    card.appendChild(image);
    card.appendChild(summary);

    rootElem.appendChild(card);
  }
}

// 🔢 UPDATE COUNT
function updateCount(list) {
  const count = document.getElementById("count");
  count.textContent = `Displaying ${list.length} episode(s)`;
}

window.onload = setup;
