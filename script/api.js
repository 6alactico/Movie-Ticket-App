export const API_KEY = "21de7c983ab26bdffe3683f541e5870b";
export const BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export async function getMovieDetails(movieId) {
  const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`;
  const response = await fetch(url);
  return await response.json();
}

export async function getCertification(movieId) {
  const url = `${BASE_URL}/movie/${movieId}/release_dates?api_key=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    const usRelease = data.results.find(item => item.iso_3166_1 === "US"); // Find US release info
    if (!usRelease) return { certification: "NR", release_date: null };

    // Find certification entry
    const certEntry = usRelease.release_dates.find(entry => entry.certification && entry.certification.trim() !== "");
    const certification = certEntry ? certEntry.certification : "NR";

    // Find release date
    const sortedDates = usRelease.release_dates
      .filter(d => d.release_date)
      .sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
    const theatrical = sortedDates.find(d => d.type === 3); // Get theatrical release type
    const release_date = theatrical ? theatrical.release_date.slice(0, 10) : (sortedDates[0]?.release_date?.slice(0, 10) || null);

    return { certification, release_date };
  } catch (error) {
   console.error("Error fetching US release info:", error);
    return { certification: "NR", release_date: null };
  }
}

export async function getMovieCredits(movieId) {
  const url = `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}&language=en-US`;
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Error fetching movie credits:", error);
    return { cast: [], crew: [] };
  }
}