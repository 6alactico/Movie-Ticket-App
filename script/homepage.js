import { getMovieDetails, getCertification, IMAGE_BASE_URL } from "./api.js";
import { setupSegmentedButtons, convertRuntime } from "./utils.js";

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
  initSearch();
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
  const filterBtn = $(".movies-header__filter-button");
  const filterMenu = $(".filter");
  const closeBtn = $(".filter .close-button");
  const ascendingChip = $("#ascending");
  const descendingChip = $("#descending");
  const oldestChip = $("#oldest");
  const filterGenre = $("#genre");
  const ratingChips = $("#rating");

  function toggleChipActive(chip, groupSelector) {
    const isActive = chip.classList.contains("active");
    $$(groupSelector).forEach((c) => c.classList.remove("active"));
    if (!isActive) chip.classList.add("active");
    return !isActive;
  }

  // Sort chips alphabetically
  if (ascendingChip) {
    ascendingChip.addEventListener("click", () => {
      const shouldApply = toggleChipActive(
        ascendingChip,
        "#sort-by .filter__chip"
      );
      initMovieContainers(
        shouldApply
          ? [...currentList].sort((a, b) =>
              allMovieDetails[a].title.localeCompare(allMovieDetails[b].title)
            )
          : currentList
      );
    });
  }

  // Sort chips in reverse alphabetical order
  if (descendingChip) {
    descendingChip.addEventListener("click", () => {
      const shouldApply = toggleChipActive(
        descendingChip,
        "#sort-by .filter__chip"
      );
      initMovieContainers(
        shouldApply
          ? [...currentList].sort((a, b) =>
              allMovieDetails[b].title.localeCompare(allMovieDetails[a].title)
            )
          : currentList
      );
    });
  }

  // Sort by oldest release date
  if (oldestChip) {
    oldestChip.addEventListener("click", () => {
      const shouldApply = toggleChipActive(
        oldestChip,
        "#sort-by .filter__chip"
      );
      initMovieContainers(
        shouldApply
          ? [...currentList].sort(
              (a, b) =>
                new Date(allMovieDetails[a].release_date) -
                new Date(allMovieDetails[b].release_date)
            )
          : currentList
      );
    });
  }

  // Map 'Science Fiction' to 'Sci-Fi' for display
  const genres = Array.from(
    new Set(
      Object.values(allMovieDetails)
        .flatMap((m) => m.genres || [])
        .map((g) => (g.name === "Science Fiction" ? "Sci-Fi" : g.name))
    )
  );
  console.log(genres);

  // Create certification chips
  const certValues = Array.from(
    new Set(
      Object.values(allMovieDetails).flatMap((m) => m.certification || [])
    )
  );
  certValues.forEach((cert) => {
    const chip = document.createElement("li");
    const button = document.createElement("button");
    button.textContent = cert;
    button.classList.add("filter__chip", "rating");
    button.addEventListener("click", () => {
      button.classList.toggle("active");
      const activeRatings = Array.from($$(".filter__chip.rating.active")).map(
        (c) => c.textContent.trim()
      );

      if (activeRatings.length === 0) {
        initMovieContainers(currentList);
      } else {
        const filtered = currentList.filter((id) => {
          const movie = allMovieDetails[id];
          return activeRatings.includes(movie.certification);
        });
        initMovieContainers(filtered);
      }
    });
    chip.appendChild(button);
    ratingChips.appendChild(chip);
  });

  // Create genre chips
  genres.forEach((genre) => {
    const chipItem = document.createElement("li");
    const chip = document.createElement("button");
    chip.textContent = genre;
    chip.classList.add("filter__chip", "genre");

    chip.addEventListener("click", () => {
      chip.classList.toggle("active");

      // Update the active genres
      const activeGenres = Array.from($$(".filter__chip.genre.active")).map(
        (c) => c.textContent.trim()
      );

      // If no active genres, show all movies
      if (activeGenres.length === 0) {
        initMovieContainers(currentList);
      } else {
        const filtered = currentList.filter((id) => {
          const movie = allMovieDetails[id];

          // Map 'Sci-Fi' back to 'Science Fiction' for filtering
          return movie.genres?.some((g) => {
            if (activeGenres.includes("Sci-Fi")) {
              return (
                g.name === "Science Fiction" || activeGenres.includes(g.name)
              );
            }
            return activeGenres.includes(g.name);
          });
        });
        initMovieContainers(filtered);
      }
    });

    chipItem.appendChild(chip);
    filterGenre.appendChild(chipItem);
  });

  const screenContainer = $(".movies");
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
  const nowPlayingButton = $("#movies__now-playing-btn");
  const comingSoonButton = $("#movies__coming-soon-btn");
  const buttons = $$(".segmented-buttons button[data-index]");

  // Sort nowPlaying by release_date (newest first)
  const sortedNowPlaying = [...nowPlaying].sort(
    (a, b) =>
      new Date(allMovieDetails[b].release_date) -
      new Date(allMovieDetails[a].release_date)
  );

  const handlers = new Map([
    [
      nowPlayingButton,
      () => {
        currentList = sortedNowPlaying;
        initMovieContainers(currentList);
        console.log(currentList);
      },
    ],
    [
      comingSoonButton,
      () => {
        currentList = comingSoon;
        initMovieContainers(currentList, true);
        console.log(currentList);
      },
    ],
  ]);

  setupSegmentedButtons(buttons, handlers);
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

initHomepage();
