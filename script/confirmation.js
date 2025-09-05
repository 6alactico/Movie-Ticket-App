import { getStoredItem, getQueryParam, setStoredItem } from "./utils.js";

const $ = (s) => document.querySelector(s);

function initConfirmation() {
  const movieMeta = getStoredItem("movieMeta");
  const showtimeMeta = getStoredItem("showtimeMeta");
  const bookingMeta = getStoredItem("bookingMeta");
  const movieId = movieMeta?.id || getQueryParam("id") || getStoredItem("id");
  const orderNumber = generateOrderNumber(movieId, new Date());

  setStoredItem("orderNumber", orderNumber);
  const userEmail = getStoredItem("email");
  $(".confirmation__email").textContent = userEmail;
  displayConfirmationDetails(movieMeta, showtimeMeta, bookingMeta, orderNumber);
  const qrCode = generateQRCode();
  setStoredItem("qrCode", qrCode);
  saveUpcomingTicket(movieMeta, showtimeMeta, bookingMeta);
}

function displayConfirmationDetails(
  movieMeta,
  showtimeMeta,
  bookingMeta,
  orderNumber
) {
  $(".movie-details__poster").src = movieMeta?.posterPath || "";
  $(".movie-details__title").textContent = movieMeta?.title || "";
  $(".movie-details__certification").textContent =
    movieMeta?.certification.certification || "";
  $(".movie-details__runtime").textContent = movieMeta?.runtime || "";
  $(".movie-details__date").textContent =
    showtimeMeta?.selectedDate || "Date not specified";
  $(".movie-details__time").textContent =
    showtimeMeta?.selectedTime || "Time not specified";
  $(".movie-details__format").textContent =
    showtimeMeta?.selectedFormat || "Format not specified";
  $(".movie-details__screen-num").textContent = `Screen: ${
    bookingMeta?.screenNumber || ""
  }`;
  $(
    ".movie-details__selected-seats"
  ).textContent = `Seats: ${bookingMeta?.selectedSeats.join(", ")}`;
  $(".movie-details__order-num").textContent = `Order No. ${orderNumber}`;
}

// Generate a unique order number based on movie ID and timestamp
// Format: YYYYMMDD-movieID-last6digitsOfTimestamp-random3digits
function generateOrderNumber(movieId, timestamp) {
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const timeString = String(date.getTime()).slice(-6);
  const moviePrefix = String(movieId).slice(-3);
  const randomDigits = String(Math.floor(Math.random() * 1000)).padStart(
    3,
    "0"
  );
  return `${y}${m}${d}-${moviePrefix}-${timeString}-${randomDigits}`;
}

// Save the upcoming ticket to local storage
function saveUpcomingTicket(movieMeta, showtimeMeta, bookingMeta) {
  const ticket = {
    id: movieMeta?.id,
    title: movieMeta?.title,
    poster: movieMeta?.posterPath,
    certification: movieMeta?.certification,
    runtime: movieMeta?.runtime,
    format: showtimeMeta?.selectedFormat,
    date: showtimeMeta?.selectedDate,
    time: showtimeMeta?.selectedTime,
    screenNumber: bookingMeta?.screenNumber,
    selectedSeats: bookingMeta?.selectedSeats,
    orderNumber: getStoredItem("orderNumber"),
  };

  const upcomingTickets = getStoredItem("upcomingTickets", []);

  const alreadyExists = upcomingTickets.some(
    (t) =>
      t.id === ticket.id && t.date === ticket.date && t.time === ticket.time
  );
  if (alreadyExists) {
    console.warn("Ticket already exists in upcoming tickets:", ticket);
    return;
  }

  upcomingTickets.push(ticket);
  setStoredItem("upcomingTickets", upcomingTickets);
  console.log("Saved upcoming ticket:", ticket);
}

// Generate a QR code for the order confirmation
function generateQRCode() {
  const canvas = $("#qr");
  if (!canvas) return;

  const size = 1024;
  canvas.width = canvas.height = size;

  new QRious({
    element: canvas,
    value: "https://github.com/6alactico",
    size,
    foreground: "hsl(0deg 0% 19%)",
  });
}

initConfirmation();