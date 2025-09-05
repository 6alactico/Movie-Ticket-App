import { getMovieDetails, getCertification, IMAGE_BASE_URL } from "./api.js";
import { setupSegmentedButtons, convertRuntime,setupSortHandlers, setupFilterHandlers } from "./utils.js";

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

async function initHomepage() {
  await preloadAllMovies();
  initMovieContainers(currentList);
  initSegmentedButtons(allMovieDetails);
  filterChips();
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

function filterChips() {
  const chips = document.querySelectorAll('.chip');
  chips.forEach(chip => {
    const dropdown = chip.closest('.dropdown');
    const menu = dropdown.querySelector('.dropdown__menu');

    chip.addEventListener("click", (e) => {
      if (e.target.closest('.dropdown__item')) return;

      const isHidden = menu.classList.contains("hidden");
      menu.classList.toggle("hidden", !isHidden);
      chip.setAttribute('aria-expanded', String(isHidden));

      console.log(`Chip ${chip.dataset.index} clicked`);
    });
  }); 
  
  const dropdownItems = document.querySelectorAll('.dropdown__item');
  
  dropdownItems.forEach(item => {
    item.addEventListener("click", () => {
        const menu = item.closest('.dropdown__menu');
        const dropdown = item.closest('.dropdown');
        const selectedSpan = dropdown.querySelector('.item-selected');
        console.log("Selected item:", selectedSpan);
        const isActive = item.classList.contains('active');
  
        menu.querySelectorAll('.dropdown__item').forEach(el => {
          el.classList.remove("active");
        });
        
        if (!isActive) {
          item.classList.add("active");
          selectedSpan.textContent = activeGenres;
        } else {
          selectedSpan.textContent = "";
        }

        menu.classList.add("hidden");
        dropdown.querySelector('.chip').setAttribute('aria-expanded', 'false');
        console.log("Selected item:", item.textContent);
    });
  });

  setupSortHandlers(allMovieDetails, currentList, initMovieContainers, {sortGroup: "#sort-by .dropdown__item"});
  setupFilterHandlers(allMovieDetails, currentList, initMovieContainers, {chipGroup: "dropdown__item"});
}

initHomepage();