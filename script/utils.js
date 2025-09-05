import { IMAGE_BASE_URL } from "./api.js";

/**
 * Get a localStorage item and safely parse it as JSON.
 * @param {string} key
 * @param {any} defaultValue
 */
export function getStoredItem(key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return defaultValue;
  }
}

/**
 * Set a value in localStorage after stringifying it.
 * @param {string} key
 * @param {any} value
 */
export function setStoredItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error setting localStorage key "${key}":`, e);
  }
}

export function removeStoredItem(key, value) {
  try {
    localStorage.removeItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error setting localStorage key "${key}":`, e);
  }
}

/**
 * Get a URL query parameter by name.
 * @param {string} key
 */
export function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

/**
 * Remove one or more localStorage items.
 * @param {string[]} keys
 */
export function removeStoredItems(keys = []) {
  keys.forEach((key) => localStorage.removeItem(key));
}

export function setStoredItems(keys = []) {
  keys.forEach((key) => localStorage.setItem(key));
}

/**
 * Initializes segmented buttons with active state and action callbacks.
 * @param {NodeList|HTMLElement[]} buttons
 * @param {Object} handlers
 * @param {Function} [onClickOutside]
 */

export function setupSegmentedButtons(buttons, handlers, onClickOutside) {
  const btnArray = Array.from(buttons);
  btnArray.forEach((button) => {
    button.addEventListener("click", () => {
      btnArray.forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
      });

      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");

      let handler;

      if (handlers instanceof Map) {
        handler = handlers.get(button);
      } else {
        const key = button.dataset.index || button.id || button.className;
        handler = handlers[key];
      }

      if (typeof handler === "function") {
        handler(button);
      } else if (typeof onClickOutside === "function") {
        onClickOutside(button);
      }

      console.log(
        `Button ${
          button.dataset.index || button.id || button.className
        } clicked`
      );
    });
  });
}

// Store movie metadata
export function storeMovieMeta({
  id,
  title,
  certification,
  poster_path,
  runtime,
  release_date,
}) {
  const movieMeta = {
    id,
    title,
    certification: certification || "NR",
    posterPath: poster_path ? IMAGE_BASE_URL + poster_path : "",
    releaseDate: release_date || "",
    runtime: runtime || 0,
  };

  setStoredItem("movieMeta", movieMeta);
  return movieMeta;
}

// Store showtime metadata
export function storeShowtimeMeta({ format, date, dateIso, time, timeIso }) {
  const showtimeMeta = {
    selectedFormat: format,
    selectedDate: date,
    dateIso: dateIso,
    selectedTime: time,
    timeIso: timeIso,
  };
  setStoredItem("showtimeMeta", showtimeMeta);
  return showtimeMeta;
}

// Store booking metadata
export function storeBookingMeta({ screenNumber, selectedSeats, ticketInfo }) {
  const bookingMeta = {
    screenNumber: screenNumber,
    selectedSeats: selectedSeats || [],
    ticketInfo: ticketInfo || {},
  };

  setStoredItem("bookingMeta", bookingMeta);
}

export function storeCheckoutMeta({ email, cardNumber, expiryDate, cvv }) {
  const checkoutMeta = {
    email: email || "",
    cardNumber: cardNumber || "",
    expiryDate: expiryDate || "",
    cvv: cvv || "",
  };
  setStoredItem("checkoutMeta", checkoutMeta);
}

export function convertRuntime(minutes) {
  if (!minutes) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

export const ascendingChip = $("#ascending");
export const descendingChip = $("#descending");
export const oldestChip = $("#oldest");
export const filterGenre = $("#genre");
export const ratingChips = $("#rating");

export function setupSortHandlers(
  allMovieDetails,
  currentList,
  initMovieContainers,
  selectors
) {
  const sortItems = $$(selectors.sortGroup);

  sortItems.forEach((item) => {
    item.addEventListener("click", () => {
      sortItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      const sortType = item.textContent.trim().toLowerCase();
      let sortedList = [...currentList];

      switch (sortType) {
        case "featured":
          sortedList = currentList;
          break;
        case "a-z":
          sortedList.sort((a, b) =>
            allMovieDetails[a].title.localeCompare(allMovieDetails[b].title)
          );
          break;
        case "z-a":
          sortedList.sort((a, b) =>
            allMovieDetails[b].title.localeCompare(allMovieDetails[a].title)
          );
          break;
        case "oldest":
          sortedList.sort(
            (a, b) =>
              new Date(allMovieDetails[a].release_date) -
              new Date(allMovieDetails[b].release_date)
          );
          break;
        default:
          // If no valid sort type, return to default list
          sortedList = currentList;
      }

      initMovieContainers(sortedList);
    });
  });
}

export function setupFilterHandlers(allMovieDetails, currentList, initMovieContainers, selectors, selectedGenres) {
  const genres = Array.from(
    new Set(
      Object.values(allMovieDetails)
        .flatMap((m) => m.genres || [])
        .map((g) => (g.name === "Science Fiction" ? "Sci-Fi" : g.name))
    )
  );

  genres.forEach((genre) => {
    const chipItem = document.createElement("li");
    const chip = document.createElement("button");
    chip.textContent = genre;
    chip.classList.add(selectors.chipGroup, "genre");

    chip.addEventListener("click", () => {
      chip.classList.toggle("active");

      // Update the active genres
      const activeGenres = Array.from($$(`.${selectors.chipGroup}.active`)).map(
        (c) => c.textContent.trim()
      );

      console.log("Active Genres:", activeGenres);

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
            selectedGenres = activeGenres;
          });
        });
        initMovieContainers(filtered);
      }
    });

    chipItem.appendChild(chip);
    filterGenre.appendChild(chipItem);
  });

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
    button.classList.add(selectors.chipGroup, "rating");
    button.addEventListener("click", () => {
      button.classList.toggle("active");
      const activeRatings = Array.from(
        $$(`.${selectors.chipGroup}.active`)
      ).map((c) => c.textContent.trim());

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
}
