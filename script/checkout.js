import { getStoredItem, getQueryParam, setStoredItem, storeCheckoutMeta, removeStoredItems } from "./utils.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const backBtn = $(".checkout-header .back-button");
const editTimeBtn = $("#checkout__edit-time");
const editSeatsBtn = $("#checkout__edit-seats");
const payButton = $(".checkout-nav__pay-button");

function initCheckout() {
  const movieMeta = getStoredItem("movieMeta");
  const showtimeMeta = getStoredItem("showtimeMeta");
  const bookingMeta = getStoredItem("bookingMeta");

  const movieId = movieMeta?.id || getQueryParam("id") || getStoredItem("id");
  const title = movieMeta?.title || getQueryParam("title") || getStoredItem("title");
  const format = showtimeMeta?.selectedFormat || getQueryParam("format") || getStoredItem("selectedFormat");
  const date = showtimeMeta?.selectedDate || getQueryParam("date") || getStoredItem("selectedDate");
  const time = showtimeMeta?.selectedTime || getQueryParam("time") || getStoredItem("selectedTime");
  const poster = movieMeta?.posterPath || getQueryParam("posterPath") || getStoredItem("posterPath");
  const selectedSeats = bookingMeta?.selectedSeats || getStoredItem("selectedSeats", []);
  const ticketInfo = bookingMeta?.ticketInfo || getStoredItem("ticketInfo", {});

  if (!movieId || !format || !date || !time || !poster) {
    console.warn("Missing required query parameters or stored values.");
    return;
  }
  const selectedTickets = ticketInfo.selectedTickets || {}; // e.g., { "Adult": 2, "Child": 1 }
  const ticketTotals = ticketInfo.ticketTypeTotal || {}; // e.g., { "Adult": 20.00, "Child": 10.00 }
  const subtotal = ticketInfo.subtotal || "0.00"; // e.g., "30.00"

  displayMovieDetails(title, format, date, time, poster);
  displaySelectedSeats(selectedSeats);
  renderTicketList(selectedTickets, ticketTotals);
  displayTotals(subtotal);
  initCheckoutMeta();

  if (backBtn) backBtn.href = `seats-and-tickets.html?id=${movieId}&format=${format}&date=${date}&time=${time}`;
  if (editTimeBtn) editTimeBtn.href = `showtimes-and-details.html?id=${movieId}`;
  if (editSeatsBtn) editSeatsBtn.href = `seats-and-tickets.html?id=${movieId}&format=${format}&date=${date}&time=${time}`;

  payButton?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.setItem("movieId", JSON.stringify(movieId));
    window.location.href = `confirmation.html?id=${movieId}&format=${format}&date=${date}&time=${time}`;
  });
}

function displayMovieDetails(title, format, date, time, poster) {
  $(".checkout__movie-title").textContent = title;
  $(".checkout__movie-format").textContent = format || "Format not specified";
  $(".checkout__movie-date").textContent = date || "Date not specified";
  $(".checkout__movie-time").textContent = time || "Time not specified";
  $(".checkout__movie-poster img").src = poster || "";
}

function displaySelectedSeats(seats = []) {
  const el = $(".checkout__selected-seats");
  if (el && seats.length) el.textContent = seats.join(", ");
}

function renderTicketList(tickets, totals) {
  const list = $(".order-summary__ticket-list");
  list.innerHTML = "";

  Object.entries(tickets).forEach(([type, qty]) => {
    if (qty > 0) {
      const li = document.createElement("li");
      li.className = "flex-row order-summary__selected-ticket";
      li.textContent = `${type} Ticket (${qty})`;

      const span = document.createElement("span");
      span.textContent = `$${totals[type] || "0.00"}`;
      li.appendChild(span);

      list.appendChild(li);
    }
  });
}

function displayTotals(amount) {
  const subtotalEl = $(".subtotal");
  const taxRate = 6.25;
  const subtotal = parseFloat(amount).toFixed(2);
  const taxes = ((amount * taxRate) / 100).toFixed(2);
  const grandTotal = (parseFloat(amount) + parseFloat(taxes)).toFixed(2);

  subtotalEl && (subtotalEl.textContent = `$${subtotal}`);
  $(".taxes") && ($(".taxes").textContent = `$${taxes}`);
  $$(".order-summary__total").forEach((el) => (el.textContent = `$${grandTotal}`));
}

// Dropdown toggle
$("#order-summary__dropdown-button")?.addEventListener("click", () => {
  $(".order-summary__dropdown")?.classList.toggle("active");
});

function initCheckoutMeta() {
  const emailInput = $(".email");
  const errorMessage = document.getElementById('error-message');
  const cardInput = $("#card-number");
  const expiryInput = $("#expiry-date");
  const cvvInput = $("#cvv");

  // Email validation
  if (emailInput) {
    emailInput.addEventListener("input", (e) => {
      e.target.classList.toggle("invalid", !e.target.checkValidity());
      storeCheckoutMeta({ email: e.target.value, cardNumber: cardInput?.value, expiryDate: expiryInput?.value, cvv: cvvInput?.value });
      console.log("Email input value:", e.target.value);
      console.log("Email input validity:", e.target.checkValidity());
    });
    console.log("Email input validation initialized.");
  } else {
    errorMessage.textContent = "Valid email is required.";
    emailInput.classList.add("invalid");
    console.warn("Email input not found.");
  }

  // Only allow digits in text inputs
  $$('input[type="text"]').forEach((input) =>
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "");
    })
  );

  // Format card number
  if (cardInput) {
    cardInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      e.target.value = value.replace(/(\d{4})(?=\d)/g, "$1 ");
      storeCheckoutMeta({
        email: emailInput?.value,
        cardNumber: e.target.value,
        expiryDate: expiryInput?.value,
        cvv: cvvInput?.value,
      });
    });
  }

  // Format expiry date
  if (expiryInput) {
    expiryInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "").slice(0, 4);
      if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2);
      e.target.value = value;
      storeCheckoutMeta({
        email: emailInput?.value,
        cardNumber: cardInput?.value,
        expiryDate: e.target.value,
        cvv: cvvInput?.value,
      });
    });
  }

  // Format CVV
  if (cvvInput) {
    cvvInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3);
      storeCheckoutMeta({
        email: emailInput?.value,
        cardNumber: cardInput?.value,
        expiryDate: expiryInput?.value,
        cvv: e.target.value,
      });
    });
  }
    // Radio-based dropdown logic
  $$(".radio").forEach((radio) =>
    radio.addEventListener("click", () => {
      $$(".radio-button__dropdown").forEach((drop) => drop.classList.add("hidden"));
      const target = document.getElementById(radio.dataset.target);
      if (target) target.classList.remove("hidden");
      localStorage.removeItem("checkoutMeta");
    })
  );
}

initCheckout();