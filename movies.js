const API_KEY = '21de7c983ab26bdffe3683f541e5870b';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const moviesWrapper = document.getElementById("movies-wrapper");

async function fetchMovies() {
    try {
      const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
      const data = await response.json();
      const movies = data.results;
      console.log(data.results);

      const moviesWithCerts = await Promise.all(
        movies.map(async (movie) => {
            const [certification, details] = await Promise.all([
                getCertification(movie.id),
                getMovieDetails(movie.id)
            ]);
            return { ...movie, certification,
                runtime: details?.runtime
            };
        })
      );

      movieContainers(moviesWithCerts);
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    }
  }

async function getMovieDetails(movieId) {
    const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch details for ${movieId}:", error);
      return null;
    }
  }

function convertRuntime(minutes) {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

function movieContainers(movies) {
    movies.forEach(movie => {
        const movieHTML = `
            <div class="movie-container">
            <div class="movie-poster">
                <img src="${IMAGE_BASE_URL + movie.poster_path}" alt="${movie.title} Poster">
            </div>
            <div class="movie-text">
                <h2>${movie.title}</h2>
                <div class="flex-row">
                <p>${movie.certification || 'NR'}</p>
                <span>&bull;</span>
                <p>${convertRuntime(movie.runtime)}</p>
                </div>
            </div>
            </div>
        `;
        moviesWrapper.insertAdjacentHTML("beforeend", movieHTML);
        console.log(`${movie.title}`, convertRuntime(movie.runtime));
    });
}

  fetchMovies();

async function getCertification(movieId) {
    const url = `${BASE_URL}/movie/${movieId}/release_dates?api_key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error fetching search results');
        const data = await response.json();

        const usRelease = data.results.find(item => item.iso_3166_1 === 'US');
        const certificationEntry = usRelease?.release_dates.find(entry => entry.certification);
        return certificationEntry?.certification || '';
    } catch (error) {
        console.error(`Error fetching certification for movie ID ${movieId}:`, error);
        return '';
    }
}