import { getMovieDetails, getCertification, IMAGE_BASE_URL } from "./api.js";
import { setupSegmentedButtons, convertRuntime, setupSortHandlers, setupFilterHandlers } from "./utils.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const moviesWrapper = document.getElementById("movies-wrapper");
const nowPlaying = [
  1087192, 1061474, 1083433, 1234821, 911430, 1100988, 1022787, 617126, 936108,
];
const comingSoon = [
  1035259, 1175942, 1339658, 1125257, 1319969, 1007734, 1149504, 1367763,
  1316147, 1257009, 1245993, 1337562,
];
const today = new Date().toISOString().slice(0, 10);

let allMovieDetails = {};
let currentList = nowPlaying; // Keep track of the current list of movies
let debounceTimeout;

async function initHomepage() {
  await preloadAllMovies();
  initMovieContainers(currentList);
  initCarousel();
  initFilterMenu();
  initSegmentedButtons(allMovieDetails);
  repositionSegmentedButtons();
  initSearch();
  initSections();
}

async function preloadAllMovies() {
  const movieIds = [...nowPlaying, ...comingSoon];
  const movies = await Promise.all(
    movieIds.map(async (movieId) => {
      const [releaseInfo, details] = await Promise.all([
        getCertification(movieId),
        getMovieDetails(movieId),
      ]);
      if (releaseInfo.release_date) {
        details.release_date = releaseInfo.release_date;
      }
      return { ...details, certification: releaseInfo.certification || "NR" };
    })
  );

  movies.forEach((movie) => (allMovieDetails[movie.id] = movie));

  // Move movies from Coming Soon to Now Playing if their release date is today or earlier
  const toMove = [];
  comingSoon.forEach((movieId) => {
    const movie = allMovieDetails[movieId];
    if (movie && movie.release_date <= today) {
      toMove.push(movieId);
    }
  });

  toMove.forEach((movieId) => {
    const idx = comingSoon.indexOf(movieId);
    if (idx !== -1) {
      comingSoon.splice(idx, 1);
      nowPlaying.push(movieId);
      const movie = allMovieDetails[movieId];
    }
  });

  // Sort nowPlaying by release_date (newest first) and set as currentList
  const sortedNowPlaying = [...nowPlaying].sort(
    (a, b) =>
      new Date(allMovieDetails[b].release_date) -
      new Date(allMovieDetails[a].release_date)
  );
  currentList = sortedNowPlaying;
  initMovieContainers(currentList);
}

function initMovieContainers(ids, isComingSoon = false) {
  moviesWrapper.innerHTML = "";

  ids.forEach((id) => {
    const movie = allMovieDetails[id];
    if (!movie) return;

    const releaseDate =
      isComingSoon && movie.release_date
        ? `<p class="movie-card__release-date">Coming ${movie.release_date.slice(
            6,
            10
          )}</p>`
        : "";

    moviesWrapper.insertAdjacentHTML(
      "beforeend",
      `<article class="movie-card flex-column">
        <a class="movie-card__poster" href="showtimes-and-details.html?id=${
          movie.id
        }">
          <img src="${IMAGE_BASE_URL + movie.poster_path}" alt="${
        movie.title
      } Poster">
          ${releaseDate}
        </a>
          <a class="movie-card__title" href="showtimes-and-details.html?id=${
            movie.id
          }">${movie.title}</a>
            <p class="flex-row movie-card__text-inline">
              <span class="movie-card__certification"><strong>${
                movie.certification || "NR"
              }</strong></span>
                &bull;
              <span class="movie-card__runtime">${convertRuntime(
                movie.runtime
              )}</span>
            </p>
      </article>`
    );
    console.log(movie.release_date, movie.title);
  });

  const movieCards = $$(".movie-card__poster");
  movieCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const url = new URL(card.href, window.location.origin);
      const movieId = url.searchParams.get("id");
      const movie = allMovieDetails[movieId];
      if (movie) window.location.href = card.href;
    });
  });
}

function initCarousel() {
  const track = $(".carousel__slides");
  const paginationDots = $$(".carousel__pagination-dot");
  const buttons = $$("[data-direction]");

  if (!track || paginationDots.length === 0) return;

  let slides = $$(".carousel__slide");
  let currentIndex = 1;

  const firstClone = slides[0].cloneNode(true);
  firstClone.classList.add("first-clone");
  track.appendChild(firstClone);

  const lastClone = slides[slides.length - 1].cloneNode(true);
  lastClone.classList.add("last-clone");
  track.insertBefore(lastClone, slides[0]);

  slides = $$(".carousel__slide");

  track.style.transition = "none";
  track.style.transform = `translateX(-${currentIndex * 100}%)`;

  track.addEventListener("transitionend", () => {
    if (slides[currentIndex].classList.contains("first-clone")) {
      currentIndex = 1;
      showSlides(false);
    } else if (slides[currentIndex].classList.contains("last-clone")) {
      currentIndex = slides.length - 2;
      showSlides(false);
    }
  });

  function showSlides(transition = true) {
    track.style.transition = transition ? "" : "none";
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    updateDots();
  }

  function updateDots() {
    paginationDots.forEach((dot) => dot.classList.remove("active"));
    paginationDots[
      (currentIndex - 1 + paginationDots.length) % paginationDots.length
    ].classList.add("active");
  }

  paginationDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      currentIndex = index + 1;
      showSlides(true);
    });
  });

  function automaticSlides() {
    currentIndex++;
    if (currentIndex >= slides.length) {
      currentIndex = 1;
      showSlides(false);
    } else {
      showSlides(true);
    }
    setTimeout(automaticSlides, 4000);
  }

  showSlides(false);
  setTimeout(automaticSlides, 4000);

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const direction = parseInt(button.dataset.direction, 10);
      currentIndex = (currentIndex + direction + slides.length) % slides.length;
      showSlides();
      console.log("button clicked", button.dataset.direction);
    });
  });
}

function initFilterMenu() {
  const filterBtn = $(".index-header__filter-button");
  const filterMenu = $(".filter");
  const closeBtn = $(".filter .close-button");

  setupSortHandlers(allMovieDetails, currentList, initMovieContainers, {sortGroup: "#sort-by .filter__chip"});

  setupFilterHandlers(allMovieDetails, initMovieContainers, currentList, { chipGroup: "filter__chip" });

  const screenContainer = $(".dimmed-screen");
  filterBtn?.addEventListener("click", () => {
    filterMenu.classList.toggle("active");
    screenContainer.classList.toggle(
      "dimmed",
      filterMenu.classList.contains("active")
    );
  });

  closeBtn?.addEventListener("click", () => {
    filterMenu?.classList.remove("active");
    screenContainer?.classList.remove("dimmed");
  });
}

function initSegmentedButtons(allMovieDetails) {
  const nowPlayingButtons = $$(".movies__now-playing-btn");  // Multiple Now Playing buttons
  const comingSoonButtons = $$(".movies__coming-soon-btn");  // Multiple Coming Soon buttons
  const buttons = $$(".segmented-buttons button[data-index]");

  // Sort nowPlaying by release_date (newest first)
  const sortedNowPlaying = [...nowPlaying].sort(
    (a, b) =>
      new Date(allMovieDetails[b].release_date) -
      new Date(allMovieDetails[a].release_date)
  );

  const sortedComingSoon = [...comingSoon].sort(
    (a, b) =>
      new Date(allMovieDetails[b].release_date) -
      new Date(allMovieDetails[a].release_date)
  );

  // Create handler for each button dynamically
  const handlers = new Map();

  nowPlayingButtons.forEach((button) => {
    handlers.set(button, () => {
      const currentList = sortedNowPlaying;
      initMovieContainers(currentList);
      console.log(currentList);
    });
  });

  comingSoonButtons.forEach((button) => {
    handlers.set(button, () => {
      const currentList = sortedComingSoon;
      initMovieContainers(currentList, true);
      console.log(currentList);
    });
  });

  setupSegmentedButtons(buttons, handlers);
}
const segBtns = $(".segmented-buttons");
const header = $(".index-header");
const inline = $(".browse-movies-container");
const moviesLink = $(".browse-movies-link");

function repositionSegmentedButtons() {
  if (!segBtns || !inline || !moviesLink || !header) {
  console.warn("Missing element in repositionSegmentedButtons");
  return;
}
  const updatePosition = () => {
    if (window.innerWidth >= 768) {
      inline.insertBefore(segBtns, moviesLink);
    } else {
      header.appendChild(segBtns);
    }
  };
  updatePosition();
  window.addEventListener("resize", updatePosition);
  console.log("Repositioned segmented buttons based on screen size");
}

function initSearch() {
  const searchInput = $(".search__input");
  const searchResults = $(".search__results");
  if (!searchInput || !searchResults) return;

  const displaySearchResults = (movies) => {
    searchResults.classList.remove("hidden");
    searchResults.innerHTML = "";

    if (movies.length === 0) {
      const noResults = document.createElement("p");
      noResults.className = "search__no-results";
      noResults.textContent = "No results found";
      searchResults.appendChild(noResults);
      return;
    }

    movies.forEach((movie) => {
      const result = document.createElement("p");
      result.className = "search__result";
      result.tabIndex = 0;
      result.textContent = movie.title;

      const goToDetails = () =>
        (window.location.href = `showtimes-and-details.html?id=${movie.id}`);
      result.addEventListener("click", goToDetails);
      result.addEventListener("keypress", (e) => {
        if (e.key === "Enter") goToDetails();
      });
      searchResults.appendChild(result);
    });
  };

  const searchMovie = (query) => {
    if (!query) {
      searchResults.classList.add("search__results--hidden");
      searchResults.innerHTML = "";
      return;
    }

    const matches = Object.values(allMovieDetails).filter((movie) =>
      movie.title.toLowerCase().includes(query.toLowerCase())
    );
    displaySearchResults(matches);
  };

  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchMovie(e.target.value.trim());
    }, 300);

    if (e.target.value.trim() === "") {
      searchResults.classList.add("hidden");
      searchResults.innerHTML = "";
    } else {
      searchResults.classList.remove("hidden");
    }
  });

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchMovie(e.target.value.trim());
    }
  });
}

function initSections() {
  fetch("script/json/categories.json")
    .then((response) => response.json())
    .then(({ categories }) => {
      // Process the categories data
      const allItems = categories.flatMap((cat) =>
        cat.items.map((item) => ({
          ...item,
          price: parseFloat(item.price).toFixed(2),
        }))
      );
  
      const firstFive = allItems.slice(0, 5);
  
      const container = document.querySelector(
        ".homepage.concessions-list__items"
      );
      firstFive.forEach(({ name, price, image }) => {
        const li = document.createElement("li");
        li.className = "list-item";
        li.innerHTML = `
              <div class="image-container"><img src="${image}" alt="${name}"></div>
              <div class="flex-row list-item__details">
                  <div class="flex-column">
                  <span class="list-item__name">${name}</span>
                  <span class="list-item__price">$${price}</span>
                  </div>
                  <button class="list-item__add-btn" aria-label="Add item to Cart">
                      <svg width="24" height="24" class="plus-circle" viewBox="0 0 16 16">
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                      </svg>
                  </button>
              </div>`;
        container.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Error fetching categories:", error);
    });
  
  fetch("script/json/news.json")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      data.categories.forEach((category) => {
        console.log(category);
      });
  
      const container = document.querySelector(".news-list__items");
      data.categories.forEach(({ headline, image }) => {
        const li = document.createElement("li");
        li.className = "flex-column list-item";
        li.innerHTML = `
              <div class="image-container"><img src="${image}" alt="${headline}"></div>
              <h3 class="list-item__headline">${headline}</h3>
              `;
        container.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Error fetching categories:", error);
    });
}

initHomepage();