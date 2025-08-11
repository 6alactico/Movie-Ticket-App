import {
  getQueryParam,
  getStoredItem,
  setStoredItem,
  setStoredItems,
  storeMovieMeta,
  storeShowtimeMeta,
  removeStoredItem,
  removeStoredItems,
  setupSegmentedButtons,
  convertRuntime,
} from "./utils.js";
import {
  getMovieDetails,
  IMAGE_BASE_URL,
  getCertification,
  getMovieCredits,
} from "./api.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

async function initDetailsPage() {
  const movieId = getQueryParam("id");
  if (!movieId) return;

  try {
    const [movie, certification, credits] = await Promise.all([
      getMovieDetails(movieId),
      getCertification(movieId),
      getMovieCredits(movieId),
    ]);

    // Update release date from certification data if available
    if (certification.release_date) {
      movie.release_date = certification.release_date;
    }

    Object.assign(movie, {
      certification,
      cast: credits.cast || [],
      crew: credits.crew || [],
      runtimeRaw: movie.runtime,
      runtime: convertRuntime(movie.runtime),
    });

    storeMovieMeta(movie);
    initMovieDetails(movie);
    initDateSelector(movie);
    initFavoriteButton(movie);
    initSegmentedButtons();
    initInfoButtons();
  } catch (error) {
    console.error("Error loading movie details:", error);
  }
}

// Initialize movie details section
function initMovieDetails(movie) {
  const [year, month, day] = movie.release_date?.split("-") || [];
  $(".selected-movie__title").textContent = movie.title;
  $(".selected-movie__genre").textContent = movie.genres?.[0]?.name || "N/A";
  $(".selected-movie__year").textContent = year || "N/A";
  $(".selected-movie__rating").textContent =
    movie.certification.certification || "NR";
  $(".selected-movie__runtime").textContent = movie.runtime;
  $(".details__movie-overview").textContent =
    movie.overview || "No description available.";
  $(".selected-movie__poster img").src = IMAGE_BASE_URL + movie.poster_path;
  $(
    ".details__release-date"
  ).textContent = `Release Date: ${day}-${month}-${year}`;
  console.log("Release Date:", movie.release_date);
  initListItems(movie.cast, ".details__list-items.cast");
  initListItems(movie.crew, ".details__list-items.crew");
  initShowtimes({ ...movie, runtime: movie.runtimeRaw });
}

function initListItems(members, selector) {
  const container = $(selector);
  if (!container) return;
  container.innerHTML = members
    .map(
      ({ name, profile_path }) => `
      <li class="flex-column details__list-item">
        <div class="details__member-poster">
          <img 
               src="${
                 profile_path
                   ? IMAGE_BASE_URL + profile_path
                   : "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"
               }" 
               alt="${name} Poster"/>
        </div>
        <p class="details__member-name">${name}</p>
      </li>`
    )
    .join("");
}

function initSegmentedButtons() {
  const showtimes = document.getElementById("showtimes__showtimes-button");
  const details = document.getElementById("showtimes__details-button");
  const buttons = $$(".segmented-buttons button[data-index]");
  const handlers = new Map([
    [showtimes, () => toggleSegment("showtimes")],
    [details, () => toggleSegment("details")],
  ]);
  setupSegmentedButtons(buttons, handlers);

  function toggleSegment(name) {
    $$(".segmented-section").forEach((sec) => sec.classList.add("hidden"));
    const target = document.getElementById(name);
    if (target) target.classList.remove("hidden");
  }
}

function initDateSelector(movie) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const container = $(".date-selector");
  if (!container) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get movie's release date
  // Create date using year, month, day to avoid timezone issues
  const [year, month, day] = movie.release_date.split("-").map(Number);
  const movieReleaseDate = new Date(year, month - 1, day); // month is 0-based in Date constructor
  movieReleaseDate.setHours(0, 0, 0, 0);

  // Use movie's release date if it's in the future, otherwise use today
  const startDate = movieReleaseDate > today ? movieReleaseDate : today;
  let selectedDate = new Date(startDate);

  for (let i = 0; i < 14; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i); // Increment the date

    const monthName = months[currentDate.getMonth()];
    const dayName = days[currentDate.getDay()];

    const btn = document.createElement("button");
    btn.className = "flex-column date-selector__tab";
    btn.innerHTML = `
      <div class="date-selector__tab-name">${dayName}</div>
      <div class="date-selector__tab-num">${monthName} ${currentDate.getDate()}</div>
    `;

    btn.addEventListener("click", () => {
      $$(".date-selector__tab").forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
      selectedDate = currentDate;
      initShowtimes(movie, selectedDate);
      const isoDay = selectedDate.toDateString().slice(0, 10);
      storeShowtimeMeta({ date: isoDay });
    });
    container.appendChild(btn);
  }

  const firstTab = $(".date-selector__tab");
  if (firstTab) {
    firstTab.classList.add("active");
    initShowtimes(movie, selectedDate);
  }
}

// Random number generator for shuffling showtimes
class SeededRandom {
  constructor(seed) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }
}

// Hash function to create a seed from a string
function hashSeed(str) {
  let hash = 0;
  for (const char of str) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Shuffle an array using a seeded random number generator
function seededShuffle(array, rng) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Parse a time string (HH:MM) and return a Date object
function parseTime(timeStr, date) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// Initialize showtimes for a movie on a specific date
// This function generates showtimes based on the movie's runtime and format
function initShowtimes(movie, date = new Date()) {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const dateIso = date.toISOString().split("T")[0].replace(/-/g, "/");
  const runtime = movie.runtimeRaw;
  const buffer = 20;
  const formats = [
    { name: "Standard", start: "10:30", end: "22:00" },
    { name: "IMAX", start: "11:00", end: "21:00" },
    { name: "D-BOX", start: "12:00", end: "20:00" },
  ];

  formats.forEach(({ name, start, end }) => {
    let current = parseTime(start, date);
    const closing = parseTime(end, date);
    const times = [];

    while (current <= closing) {
      times.push(new Date(current));
      current.setMinutes(current.getMinutes() + runtime + buffer);
      const remainder = current.getMinutes() % 15;
      if (remainder)
        current.setMinutes(current.getMinutes() + (15 - remainder));
      current.setSeconds(0, 0);
    }

    const seed = hashSeed(`${name}-${dateStr}-${movie.id}`);
    const rng = new SeededRandom(seed);
    const [minCount, maxCount] = name === "Standard" ? [3, 3] : [1, 2];
    const count = Math.floor(rng.next() * (maxCount - minCount + 1)) + minCount;
    const limited = seededShuffle(times, rng)
      .slice(0, count)
      .sort((a, b) => a - b);

    initShowtimesButtons(name, limited, movie, dateStr, dateIso, date);
  });
}

// Initialize showtimes buttons for a specific format
function initShowtimesButtons(
  format,
  times,
  movie,
  dateStr,
  dateIso,
  selectedDate
) {
  const className = format.toLowerCase().replace(/\s+/g, "-");
  const container = $(`.showtimes__format.${className} .showtimes__buttons`);
  if (!container) {
    console.warn(`No container found for format: ${format}`);
    return;
  }
  container.innerHTML = "";
  const now = new Date();
  const isToday = selectedDate.toDateString() === now.toDateString();

  times.forEach((time) => {
    const timeStr = time.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const timeIso = time.toISOString().split("T")[1].slice(0, 8);
    const timeButton = document.createElement("a");
    timeButton.className = "showtimes__time";
    timeButton.textContent = timeStr;

    if (isToday && time < now) {
      timeButton.classList.add("disabled");
      timeButton.removeAttribute("href");
    } else {
      timeButton.href = `seats-and-tickets.html?id=${movie.id}&format=${format}&date=${dateStr}&time=${timeStr}`;
      timeButton.addEventListener("click", () => {
        storeShowtimeMeta({
          format,
          date: dateStr,
          dateIso,
          time: timeStr,
          timeIso,
        });
      });
    }
    container.appendChild(timeButton);
  });
}

// Initialize info buttons to toggle bottom sheets for format details
function initInfoButtons() {
  const infoBtns = $$(".showtimes__info-btn");
  const bottomSheets = $$(".showtimes__bottom-sheet");
  const screenContainer = $(".showtimes-details");

  // Setup info buttons to toggle bottom sheets
  infoBtns.forEach((btn, i) => {
    const sheet = bottomSheets[i];
    btn.addEventListener("click", () => {
      bottomSheets.forEach((other, idx) => {
        if (idx !== i) other.classList.remove("active");
      });
      sheet.classList.toggle("active");
      screenContainer.classList.toggle(
        "dimmed",
        sheet.classList.contains("active")
      );
    });
  });

  // Close bottom sheets when clicking outside
  document.addEventListener("click", (event) => {
    if (![...infoBtns].some((btn) => btn.contains(event.target))) {
      bottomSheets.forEach((sheet) => {
        if (!sheet.contains(event.target)) {
          sheet.classList.remove("active");
          screenContainer.classList.remove("dimmed");
        }
      });
    }
  });
}

// Add back button functionality to clear stored movie data
const backButton = $(".showtimes-details__back-button");
if (backButton) {
  backButton.addEventListener("click", () => {
    removeStoredItems([
      "id",
      "posterPath",
      "title",
      "releaseDate",
      "certification",
      "runtime",
    ]);
  });
}

function initFavoriteButton(movie) {
  const favoriteButton = $(".selected-movie__favorite-button");
  // get or initialize favorite list
  let favoriteMovies = getStoredItem("favoriteMovies", []);
  if (favoriteButton) {
    favoriteButton.addEventListener("click", () => {
      const path = favoriteButton.querySelector("svg path");
      if (path) {
        const isActive = favoriteButton.classList.toggle("active");
        path.classList.toggle("active", isActive);
        if (isActive) {
          // add to favorites
          const movieMeta = storeMovieMeta(movie);
          favoriteMovies.push(movieMeta);
          console.log("Added to favorites:", movieMeta);
        } else {
          // remove from favorites
          favoriteMovies = favoriteMovies.filter((f) => f.id !== movie.id);
          console.log("Removed from favorites:", movie.id);
        }
        setStoredItem("favoriteMovies", favoriteMovies);
      }
      favoriteButton.setAttribute(
        "aria-pressed",
        favoriteButton.classList.contains("active")
      );
    });
  }
}

initDetailsPage();
