import { getStoredItem, setStoredItem, setupSegmentedButtons, storeShowtimeMeta } from "./utils.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function initTickets() {
  movePastTickets();
  const upcoming = getStoredItem("upcomingTickets", []);
  const past = getStoredItem("pastTickets", []);
  initSegmentedButtons();
  displayTickets(upcoming, "upcoming");
  displayTickets(past, "past");
}

function generateTicketQRCode(canvas, value) {
  if (!canvas) return;
  new QRious({
    element: canvas,
    value,
    size: 200,
    foreground: "hsl(0deg 0% 19%)",
  });
}

function displayTickets(ticketsArray, type) {
  const list = document.querySelector(`.tickets__${type}-list`);
  list.innerHTML = "";

  ticketsArray.forEach((ticket) => {
    const li = document.createElement("li");
    li.className = "flex-row list-item";
    li.innerHTML = `
      <div class="list-item__poster"><img src="${ticket.poster || ""}" alt="${
      ticket.title || ""
    }"></div>
      <section class="flex-column list-item__overview">
        <h2 class="list-item__title">${ticket.title || ""}</h2>
        <p class="list-item__date-time">${ticket.date || ""} at ${
      ticket.time || ""
    }</p>
        <a href="#" class="list-item__link">View Details</a>
     </section>
     <article class="flex-column item-details hidden">
      <div class="item-details__poster-container"><img class="item-details__poster" src="${ticket.poster || ""}" alt="${ticket.title || ""}"></div>
        <section class="item-details__info">
          <h4>${ticket.title || ""}</h4>
            <div class="flex-row" role="group" aria-label="Movie Information">
              <p class="item-details__certification" aria-label="Movie Rating">${
                ticket.certification.certification || "N/A"
              }</p>
              <p class="item-details__runtime" aria-label="Movie Duration">${
                ticket.runtime || "N/A"
              }</p>
            </div>
          <div class="flex-row item-details__showtime">
          <p>${ticket.date || "Date not specified"}</p>
          <p>${ticket.time || "Time not specified"}</p>
          </div>
          <div class="flex-row item-details__seating-info">
            <p>${ticket.format || "Standard"}</p>
            <p>Screen: ${ticket.screenNumber || ""}</p>
            <p>Seats: ${
              ticket.selectedSeats ? ticket.selectedSeats.join(", ") : ""
            }</p>
          </div>
          <div class="flex-column item-details__order-info">
            <div class="item-details__qr-container">
              <canvas class="item-details__qr" aria-label="Scan this QR code at the theater to check in" role="img"></canvas>
            </div>
            <p class="item-details__order-num">Order No. ${
              ticket.orderNumber || ""
            }</p>
          </div>
        </section>
     </article>
  `;
    list.appendChild(li);
    const qrCanvas = li.querySelector(".item-details__qr");
    generateTicketQRCode(qrCanvas, ticket.orderNumber || "");
    const button = li.querySelector(".list-item__link");
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const details = li.querySelector(".item-details");
      details.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!li.contains(e.target)) {
        const details = li.querySelector(".item-details");
        details.classList.add("hidden");
      }
    });
  });
  // console.log(`Displayed ${ticketsArray.length} ${type} tickets`);
}

function movePastTickets() {
  const upcomingTickets = getStoredItem("upcomingTickets", []);
  const pastTickets = getStoredItem("pastTickets", []);
  const stillUpcoming = [];

  upcomingTickets.forEach((ticket) => {
    // skip entries missing date or time
    if (!ticket.date || !ticket.time) {
      stillUpcoming.push(ticket);
      return;
    }

    const ticketDateTime = new Date(`${ticket.date} ${ticket.time}`);
    console.log("Ticket Date Time", ticketDateTime);
    const now = new Date();
    console.log("Current Date Time", now);

    // Check if the ticket is in the past
    if (ticketDateTime < now) {
      pastTickets.push(ticket);
      console.log("Moved to past tickets:", ticket);
    } else {
      stillUpcoming.push(ticket);
    }
  });

  setStoredItem("upcomingTickets", stillUpcoming);
  setStoredItem("pastTickets", pastTickets);
}

function initSegmentedButtons() {
  const upcomingBtn = $("#tickets-header__upcoming-btn");
  const pastBtn = $("#tickets-header__past-btn");
  const buttons = $$(".segmented-buttons button[data-index]");

  const handlers = new Map([
    [ upcomingBtn, () => {
        toggleSegment("upcoming");
        const up = getStoredItem("upcomingTickets", []);
        displayTickets(up, "upcoming");
      },
    ],
    [ pastBtn, () => {
        toggleSegment("past");
        const past = getStoredItem("pastTickets", []);
        displayTickets(past, "past");
      },
    ],
  ]);

  setupSegmentedButtons(buttons, handlers);

  function toggleSegment(name) {
    $$(".segmented-section").forEach((sec) => sec.classList.add("hidden"));
    const target = document.getElementById(name);
    if (target) target.classList.remove("hidden");
  }
}

initTickets();