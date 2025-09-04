import {
  getStoredItem,
  setStoredItem,
  getQueryParam,
  removeStoredItems,
  storeBookingMeta,
} from "./utils.js";

const $ = (s) => document.querySelector(s);

const rows = ["A", "B", "C", "D", "E", "F", "G"];
const seatsPerRow = 10;
const wheelchairSeats = new Set(["G3", "G4", "G7", "G8"]);

function initSeatsAndTickets() {
  const movieMeta = getStoredItem("movieMeta");
  console.log("Movie Meta:", movieMeta);
  const showtimeMeta = getStoredItem("showtimeMeta");
  console.log("Showtime Meta:", showtimeMeta);
  const bookingMeta = getStoredItem("bookingMeta") || {};
  console.log("Booking Meta:", bookingMeta);

  const movieId = movieMeta?.id || getQueryParam("id") || getStoredItem("id");
  const format = showtimeMeta?.selectedFormat || getQueryParam("format") || getStoredItem("selectedFormat");
  const date = showtimeMeta?.selectedDate || getQueryParam("date") || getStoredItem("selectedDate");
  const time =
    showtimeMeta?.selectedTime ||
    getQueryParam("time") ||
    getStoredItem("selectedTime");

  if (!movieId || !format || !date || !time) {
    console.warn("Missing required query parameters or stored values.");
    return;
  }

  try {
    displayMovieDetails(movieMeta, format, date, time);
    initNavigationButtons(movieId);
    initZoomButtons();
    initSeats(movieId, format, date, time);
    initSeatSelection(bookingMeta);
    initTicketSelection(bookingMeta);
    repositionSegmentedButtons();

    const screenNumber = getScreenNumber(movieId);
    storeBookingMeta({
      screenNumber,
      selectedSeats: getStoredItem("selectedSeats") || [],
      ticketInfo: getStoredItem("ticketInfo") || {},
    });

    getReserved(movieId, format, date, time);
  } catch (error) {
    console.error("Error loading movie details:", error);
    return;
  }

  const checkoutBtn = $(".button.checkout");
  if (checkoutBtn) {
    checkoutBtn.href = `checkout.html?id=${movieId}&title=${movieMeta.title}&format=${format}&date=${date}&time=${time}`;
  }
}

function displayMovieDetails(movieMeta, format, date, time) {
  $(".booking-header__movie-title").textContent = movieMeta.title || "Title not specified";
  $(".booking-header__movie-format").textContent = format || "Format not specified";
  let count = 0;
  const replace = date.replace(/,/g, () => (++count === 2 ? '' : ','));
  $(".booking-header__movie-date").textContent = replace.slice(0, 11) || "Date not specified";
  $(".booking-header__movie-time").textContent = time || "Time not specified";
}

function initNavigationButtons(movieId) {
  const backBtn = $(".booking-header .back-button");
  const closeBtn = $(".booking-header .close-button");

  const clearSelections = () =>
    removeStoredItems([
      "selectedFormat",
      "selectedDate",
      "selectedTime",
      "ticketInfo",
      "selectedSeats",
    ]);

  if (backBtn) {
    backBtn.href = `showtimes-and-details.html?id=${movieId}`;
    backBtn.addEventListener("click", clearSelections);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      clearSelections();
      removeStoredItems([
        "id",
        "posterPath",
        "title",
        "releaseDate",
        "certification",
        "runtime",
        "screenNumber",
        "bookingMeta",
      ]);
    });
  }
}

function initZoomButtons() {
  const minify = $(".seating__zoom-buttons .minify");
  const magnify = $(".seating__zoom-buttons .magnify");
  const seats = $(".seating__seats");

  if (!minify || !magnify || !seats) return;

  minify.addEventListener("click", () => {
    minify.classList.add("hidden");
    magnify.classList.remove("hidden");
    seats.classList.add("zoom");
  });

  magnify.addEventListener("click", () => {
    magnify.classList.add("hidden");
    minify.classList.remove("hidden");
    seats.classList.remove("zoom");
  });
}

// Get reserved seats for a specific showtime
function getReserved(movieId, format, date, time) {
  const key = `${movieId}-${format}-${date}-${time}`; // Create a unique key for the showtime
  let reserved = new Set(getStoredItem(key, []));

  if (reserved.size === 0) {
    while (reserved.size < 10) {
      const row = rows[Math.floor(Math.random() * rows.length)];
      const seatNum = Math.floor(Math.random() * seatsPerRow) + 1;
      reserved.add(`${row}${seatNum}`);
    }
    setStoredItem(key, [...reserved]);
  }
  return reserved;
}

// Initialize seats for a specific showtime
function initSeats(movieId, format, date, time) {
  const seatsContainer = $(".seating__seats");
  if (!seatsContainer) return;

  const reservedSeats = getReserved(movieId, format, date, time);

  seatsContainer.innerHTML = "";

  rows.forEach((row) => {
    for (let i = 1; i <= seatsPerRow; i++) {
      const seatId = `${row}${i}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "seating__seat";
      btn.dataset.row = row;
      btn.dataset.seat = i;

      if (row === "G" && (i === 5 || i === 6)) btn.classList.add("invisible");

      if (wheelchairSeats.has(seatId)) {
        btn.classList.add("wheelchair");
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 20 20" width="24" height="24">
            <path d="M5.25 2.625A1.313 1.313 0 1 0 5.25 0a1.313 1.313 0 0 0 0 2.625ZM3.295 6.759a.655.655 0 1 0-.462-1.227 4.376 4.376 0 1 0 5.404 6.152.656.656 0 1 0-1.16-.618 3.061 3.061 0 1 1-3.782-4.307Zm3.81-1.947-.053-.265a1.304 1.304 0 0 0-2.56.511l.633 3.159c.164.817.88 1.405 1.717 1.405H9.59c.183 0 .345.112.41.285l.993 2.65c.164.44.65.672 1.097.521l1.312-.437a.874.874 0 0 0 .553-1.107.874.874 0 0 0-1.108-.553l-.511.17-.698-1.86A2.19 2.19 0 0 0 9.59 7.872H7.717L7.454 6.56h1.734a.874.874 0 1 0 0-1.75H7.104v.003Z"/>
          </svg>
        `;
      } else {
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="seating__svg" viewBox="0 0 32 32">
            <path d="M8.958 18.991c.474-1.911-.693-5.184-3.006-5.184V7.8C6 5.7 7.7 4 9.8 4h12.3C24.3 4 26 5.7 26 7.8V14c-1.565.169-2.915.742-2.996 4.994l-14.046-.003ZM9 29H5c-1.1 0-2-.9-2-2V17c0-1.7 1.3-3 3-3s3 1.3 3 3v12zm18 0h-4V17c0-1.7 1.3-3 3-3s3 1.3 3 3v10c0 1.1-.9 2-2 2zM9 19h14v10H9z"/>
          </svg>
          <span class="seating__seat-id">${seatId}</span>
        `;
      }

      if (reservedSeats.has(seatId)) {
        btn.classList.add("reserved");
        btn.disabled = true;
      }
      seatsContainer.appendChild(btn);
    }
  });
}

// Initialize seat selection
function initSeatSelection(bookingMeta) {
  const seats = document.querySelectorAll(".seating__seat");
  const selection = $(".seating__selection-qty");
  const savedSeats = getStoredItem("selectedSeats", []);
  let selectedSeats = [...savedSeats];
  let quantity = selectedSeats.length;

  if (selection)
    selection.textContent = `${quantity} Seat${
      quantity !== 1 ? "s" : ""
    } Selected`;

  seats.forEach((seat) => {
    const seatId = seat.dataset.row + seat.dataset.seat;
    seat.setAttribute("aria-label", "Seat");

    if (seat.classList.contains("reserved")) {
      seat.disabled = true;
    }
    if (savedSeats.includes(seatId)) {
      seat.classList.add("selected");
    }

    seat.addEventListener("click", () => {
      seat.classList.toggle("selected");
      if (seat.classList.contains("selected")) {
        selectedSeats.push(seatId);
        quantity++;
      } else {
        selectedSeats = selectedSeats.filter((s) => s !== seatId);
        quantity--;
      }
      if (selection)
        selection.textContent = `${quantity} Seat${
          quantity !== 1 ? "s" : ""
        } Selected`;

      bookingMeta.selectedSeats = selectedSeats;
      setStoredItem("bookingMeta", bookingMeta);
    });
  });
}

// Initialize ticket selection
function initTicketSelection(bookingMeta) {
  const tickets = document.querySelectorAll(".tickets__type");
  const subtotalEl = $(".ticket-summary__subtotal");
  const ticketQty = $(".tickets__quantity");
  const summaryQty = $(".ticket-summary__quantity");

  const ticketInfo = getStoredItem("ticketInfo", {});
  console.log("Ticket Info:", ticketInfo);
  const savedSelectedTickets = ticketInfo.selectedTickets || {};

  tickets.forEach((ticket) => {
    const decrementBtn = ticket.querySelector(".decrement");
    const incrementBtn = ticket.querySelector(".increment");
    const counterValue = ticket.querySelector(".counter-value");
    const type = ticket.dataset.type;

    let quantity = savedSelectedTickets[type] || 0;
    updateUI(quantity);

    function updateUI(qty) {
      quantity = Math.max(0, qty);
      ticket.dataset.quantity = quantity;
      counterValue.textContent = quantity;
      decrementBtn.classList.toggle("active", quantity > 0);
    }

    function changeQuantity(delta) {
      const newQty = quantity + delta;
      if (newQty >= 0) {
        updateUI(newQty);
        recalcSubtotal(bookingMeta);
      }
    }

    decrementBtn.addEventListener("click", () => changeQuantity(-1));
    incrementBtn.addEventListener("click", () => changeQuantity(1));
  });

  // Recalculate the subtotal whenever the ticket selection changes
  function recalcSubtotal(currentBookingMeta) {
    let totalPrice = 0, totalQty = 0;
    const selectedTickets = {};
    const ticketTypeTotal = {};

    tickets.forEach((ticket) => {
      const price = parseFloat(ticket.querySelector(".tickets__price")?.dataset.price) || 0;
      const qty = parseInt(ticket.dataset.quantity || 0);
      const type = ticket.dataset.type;

      if (qty > 0 && price > 0) {
        selectedTickets[type] = qty;
        ticketTypeTotal[type] = (price * qty).toFixed(2);
        totalPrice += price * qty;
        totalQty += qty;
      }
    });

    if (subtotalEl)
      subtotalEl.textContent = `Subtotal: $${totalPrice.toFixed(2)}`;
    if (ticketQty)
      ticketQty.textContent =
        totalQty > 0
          ? `${totalQty} Ticket${totalQty > 1 ? "s" : ""} Selected`
          : "Select Tickets";
    if (summaryQty) summaryQty.textContent = `Qty: ${totalQty}`;

    const ticketInfo = {
      selectedTickets,
      ticketTypeTotal,
      subtotal: totalPrice.toFixed(2),
      totalTicketQty: totalQty,
    };
    currentBookingMeta.ticketInfo = ticketInfo;
    setStoredItem("bookingMeta", currentBookingMeta);
  }

  recalcSubtotal(bookingMeta);
}

// Get the screen number for a movie based on its ID
function getScreenNumber(movieId) {
  const idStr = String(movieId); 
  let hash = 0;
  
  // Generate a hash from the movie ID string
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0; // convert to 32-bit integer
  }

  const minScreen = 1, maxScreen = 15;
  const screenNumber = (Math.abs(hash) % (maxScreen - minScreen + 1)) + minScreen; // Map the hash to a screen number
  console.log("Screen number", screenNumber);
  return screenNumber;
}

const bookingFooter = $(".booking__footer");
const ticketsSection = $(".tickets-section");

function repositionSegmentedButtons() {
  if (!bookingFooter || !ticketsSection) {
    console.warn("Missing element in repositionSegmentedButtons");
    return;
  }
  const updatePosition = () => {
    if (window.innerWidth >= 768) {
      ticketsSection.appendChild(bookingFooter);
    } else {
      document.body.appendChild(bookingFooter);
    }
  };
  updatePosition();
  window.addEventListener("resize", updatePosition);
  console.log("Repositioned segmented buttons based on screen size");
}

initSeatsAndTickets();
