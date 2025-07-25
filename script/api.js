const API_KEY = "21de7c983ab26bdffe3683f541e5870b";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

async function getMovieDetails(movieId) {
  const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`;
  const response = await fetch(url);
  return await response.json();
}

async function getCertification(movieId) {
  const url = `${BASE_URL}/movie/${movieId}/release_dates?api_key=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const usRelease = data.results.find((item) => item.iso_3166_1 === "US");
    const certificationEntry = usRelease?.release_dates.find(
      (entry) => entry.certification
    );
    return certificationEntry?.certification || "";
  } catch (error) {
    return "";
  }
}

async function getMovieCredits(movieId) {
  const url = `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}&language=en-US`;
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Error fetching movie credits:", error);
    return { cast: [], crew: [] };
  }
}

function convertRuntime(minutes) {
  if (!minutes) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatMovieDateTime(format, dateStr, timeStr, options = {}) {
  if (!format || !dateStr || !timeStr) return "";
  const date = new Date(dateStr);
  const time = new Date(timeStr);
  const datePart = options.shortDate ? date.toDateString().slice(0, 10) : date.toDateString();
  const timePart = time.toLocaleTimeString(options.locale || "en-US", options.timeOptions || {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${format} • ${datePart} • ${timePart}`;
}