document.addEventListener("DOMContentLoaded", () => {
  const getStoredItem = (key, defaultValue = null) => {
   try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
     return JSON.parse(stored);
   } catch (error) {
     console.error(`Error parsing JSON for key "${key}":`, error);
     return defaultValue;
    }
 }
  const movieTitle = getStoredItem("movieTitle");
  const movieFormat = getStoredItem("selectedFormat");
  const movieDate = getStoredItem("selectedDate");
  const movieTime = getStoredItem("selectedTime");
  const movieId = getStoredItem("movieId");
  const selectedSeats = getStoredItem("selectedSeats");

  const selectedTickets = getStoredItem("ticketInfo")[0];
  const ticketTotals = getStoredItem("ticketInfo")[1];
  const subtotal = getStoredItem("Subtotal");

  const ticketList = document.querySelector(".ticket-list");
  if (ticketList) {
    ticketList.innerHTML = "";
  }
  
  console.log("Selected Seats:", selectedSeats);
  console.log("Selected Tickets:", selectedTickets);
  console.log("Ticket Totals:", ticketTotals);

  if (ticketList && selectedTickets && ticketTotals) {
  for (const [type, quantity] of Object.entries(selectedTickets)) {
    if (quantity > 0) {
      const li = document.createElement("li");
      li.className = "selected-ticket";
      li.textContent = `${type}: ${quantity} $${ticketTotals[type] || 0}`;
      ticketList.appendChild(li);
    }
  }
}
  const subtotalEl = document.querySelector(".subtotal").textContent = `$${parseFloat(subtotal).toFixed(2)}`;
  console.log("Subtotal:", subtotalEl);

  const titleEl = document.querySelector("#checkout-main .movie-title");
  if (titleEl && movieTitle) {
    titleEl.textContent = movieTitle;
  }
  const selectedSeatsEl = document.querySelector(".selected-seats");
  if (selectedSeatsEl && selectedSeats) { selectedSeatsEl.textContent = selectedSeats.join(", "); }

  const infoEl = document.querySelector(".checkout-movie-info");
  if (infoEl && movieFormat && movieDate && movieTime) {
    infoEl.textContent = formatMovieDateTime(movieFormat, movieDate, movieTime);
  }

  const backBtn = document.querySelector(".checkout-header #back-button");
  const editTime = document.querySelector(".date-time-display .edit-button");
  const editSeats = document.querySelector(".selected-seats-display .edit-button");

  if (movieId && movieFormat && movieDate && movieTime) {
    const params = new URLSearchParams({
      id: movieId,
      format: movieFormat,
      date: movieDate,
      time: movieTime,
    });

    backBtn.href = `seats-and-tickets.html?${params.toString()}`;
    editTime.href = `showtimes-and-details.html?id=${movieId}`;
    editSeats.href = `seats-and-tickets.html?${params.toString()}`;
  }
});