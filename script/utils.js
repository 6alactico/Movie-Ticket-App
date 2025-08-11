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
