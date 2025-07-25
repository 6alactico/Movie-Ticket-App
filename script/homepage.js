const moviesWrapper = document.getElementById("movies-wrapper");
const searchInput = document.getElementById("search");
const searchResults = document.getElementById("search-results");

const nowPlaying = [ 1087192, 1061474, 1083433, 1234821, 911430, 1100988, 1022787];
const comingSoon = [617126, 1035259, 1175942, 1339658, 1125257];

let allMovieDetails = {};
let currentList = nowPlaying;
let debounceTimeout;

async function preloadAllMovies() {
  const allIds = [...nowPlaying, ...comingSoon];
  const movies = await Promise.all(
    allIds.map(async (movieId) => {
      const [certification, details] = await Promise.all([
        getCertification(movieId),
        getMovieDetails(movieId),
      ]);
      return { ...details, certification, runtime: details.runtime };
    })
  );

  movies.forEach(m => { allMovieDetails[m.id] = m; });
  movieContainers(currentList);
  setupButtons();
}

function movieContainers(ids, isComingSoon = false) {
  moviesWrapper.innerHTML = "";
  ids.forEach((id) => {
    const m = allMovieDetails[id];
    if (!m) return;

    moviesWrapper.insertAdjacentHTML("beforeend", `
      <div class="movie-item flex-column">
        <a class="movie-poster" href="showtimes-and-details.html?id=${m.id}">
          <img src="${IMAGE_BASE_URL + m.poster_path}" alt="${m.title} Poster">
          ${isComingSoon && m.release_date ? `<p class="release-date">Coming ${m.release_date.substring(6, 10)}</p>`: ""}
        </a>
        <div class="movie-text">
          <a class="movie-title" href="showtimes-and-details.html?id=${m.id}">${m.title}</a>
            <div class="flex-row">
              <p>${m.certification || "NR"}</p>
              <span>&bull;</span>
              <p>${convertRuntime(m.runtime)}</p>
            </div>
        </div>
      </div>
    `);
    console.log(m.genres[0]);
  });
}

function displaySearchResults(movies) {
  searchResults.classList.remove("hidden");
  searchResults.innerHTML = "";

  movies.forEach(m => {
    const searchResult = document.createElement("p");
    searchResult.className = "search-result";
    searchResult.textContent = m.title;
    searchResult.tabIndex = 0;
    searchResult.addEventListener("click", () => window.location.href = `showtimes-and-details.html?id=${m.id}`);
    searchResult.addEventListener("keypress", e => { if (e.key === "Enter") window.location.href = `showtimes-and-details.html?id=${m.id}`; });

    searchResults.appendChild(searchResult);
  });
}

function clearSearchResults() {
  searchResults.classList.add("hidden");
  searchResults.innerHTML = "";
}

function searchMovie(query) {
  if (!query) return clearSearchResults();
  const q = query.toLowerCase();
  const matches = Object.values(allMovieDetails).filter(m => m.title.toLowerCase().includes(q));
  displaySearchResults(matches);
}

searchInput.addEventListener("input", (e) => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => searchMovie(e.target.value.trim()), 300);
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchMovie(e.target.value.trim());
  }
});

preloadAllMovies();