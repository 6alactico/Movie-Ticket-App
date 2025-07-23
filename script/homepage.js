const moviesWrapper = document.getElementById("movies-wrapper");
const searchInput = document.getElementById("search");
const searchResults = document.getElementById("search-results");

const nowPlaying = [
  1087192, 1061474, 1083433, 1234821, 911430, 1100988, 1022787,
];
const comingSoon = [617126, 1035259, 1175942, 1339658, 1125257];

let allMovieDetails = {};
let currentList = nowPlaying;

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

  movies.forEach((movie) => {
    allMovieDetails[movie.id] = movie;
  });
  movieContainers(currentList);
  setupButtons();
  console.log(movies);
}

function movieContainers(movieIds, isComingSoon = false) {
  moviesWrapper.innerHTML = "";
  movieIds.forEach((id) => {
    const movie = allMovieDetails[id];
    if (!movie) return;

    const movieHTML = `
          <div class="movie-container">
                <a class="movie-poster" href="showtimes-and-details.html?id=${
                  movie.id
                }">
                <img src="${IMAGE_BASE_URL + movie.poster_path}" alt="${
      movie.title
    } Poster">
                ${
                  isComingSoon && movie.release_date
                    ? `<p class="release-date">Coming ${movie.release_date.substring(
                        6,
                        10
                      )}</p>`
                    : ""
                }
                </a>
            <div class="movie-text">
              <h2><a href="">${movie.title}</a></h2>
                <div class="flex-row">
                  <p>${movie.certification || "NR"}</p>
                  <span>&bull;</span>
                  <p>${convertRuntime(movie.runtime)}</p>
                </div>
            </div>
          </div>
        `;
    moviesWrapper.insertAdjacentHTML("beforeend", movieHTML);
    console.log(movie.genres[0]);
  });
}

function displaySearchResults(movies) {
  searchResults.classList.remove("hidden");
  searchResults.innerHTML = "";

  movies.forEach((movie) => {
    const el = document.createElement("p");
    el.textContent = movie.title;
    searchResults.appendChild(el);
  });
}

function clearSearchResults() {
  searchResults.classList.add("hidden");
  searchResults.innerHTML = "";
}

function searchMovie(query) {
  if (!query) {
    clearSearchResults();
    return;
  }

  const lowerQuery = query.toLowerCase();
  const matches = Object.values(allMovieDetails).filter((movie) =>
    movie.title.toLowerCase().includes(lowerQuery)
  );

  displaySearchResults(matches);
}

searchInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchMovie(event.target.value.trim());
  }
});

searchInput.addEventListener("input", (event) => {
  searchMovie(event.target.value.trim());
});

preloadAllMovies();