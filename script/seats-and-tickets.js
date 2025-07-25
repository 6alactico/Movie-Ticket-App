// Handles ticket and seat selection
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const selectedFormat = params.get("format");
  const selectedDate = params.get("date");
  const selectedTime = params.get("time");
  const movieId = params.get("id");
  const movieTitleEl = document.querySelector(".seats-tickets-header h2");
  const dateTimeDisplay = document.querySelector(".movie-overview");
  const backBtn = document.querySelector(".seats-tickets-header #back-button");
  const closeBtn = document.querySelector(".seats-tickets-header #close-button");

  localStorage.setItem("selectedFormat", JSON.stringify(selectedFormat));
  localStorage.setItem("selectedDate", JSON.stringify(selectedDate));
  localStorage.setItem("selectedTime", JSON.stringify(selectedTime));
  localStorage.setItem("movieId", JSON.stringify(movieId));

  if (selectedFormat && selectedDate && selectedTime && dateTimeDisplay) {
    dateTimeDisplay.textContent = formatMovieDateTime(selectedFormat, selectedDate, selectedTime);
  }

  if (!movieId) return;

  try {
    const [details, certification, credits] = await Promise.all([
      getMovieDetails(movieId),
      getCertification(movieId),
      getMovieCredits(movieId),
    ]);

    if (movieTitleEl) movieTitleEl.textContent = details.title;
    localStorage.setItem("movieTitle", JSON.stringify(details.title));
    if (backBtn && closeBtn) {
        backBtn.href = `showtimes-and-details.html?id=${movieId}`;  
        backBtn.addEventListener("click", () => {
            localStorage.removeItem('selectedSeats');
            localStorage.removeItem('selectedTickets');
        });

        closeBtn.addEventListener("click", () => {
            localStorage.removeItem('selectedSeats');
            localStorage.removeItem('selectedTickets');
        });
    }
    console.log(details, certification, credits);
  } catch (error) {
    console.error("Error loading movie details:", error);
  }
});

const minify = document.querySelector('.minify-btn');
const magnify = document.querySelector('.magnify-btn');
const seatMap = document.querySelector('.seat-map');

minify.addEventListener('click', () => {
    minify.classList.add('hidden');
    magnify.classList.remove('hidden');
    seatMap.classList.add('zoom');
});

magnify.addEventListener('click', () => {
    magnify.classList.add('hidden');
    minify.classList.remove('hidden');
    seatMap.classList.remove('zoom');
});

const seats = document.querySelectorAll('.seat');
const selection = document.querySelector('.selection-quantity');
const savedSelectedSeats = JSON.parse(localStorage.getItem("selectedSeats")) || [];
let quantity = savedSelectedSeats.length;
let selectedSeats = [...savedSelectedSeats];
let reservedSeats = [];

seats.forEach((seat) => {
    const seatId = seat.dataset.row + seat.dataset.seat;
    seat.setAttribute('aria-label', 'Seat');
    if (seat.classList.contains('reserved')) {
        seat.disabled = true;
        reservedSeats.push(seatId);
    }

    if (savedSelectedSeats.includes(seatId)) {
        seat.classList.add('selected');
    }

    seat.addEventListener('click', () => {
        seat.classList.toggle('selected');
        if (seat.classList.contains('selected')) {
            quantity++;
            selectedSeats.push(seatId);
        } else {
            quantity--;
            selectedSeats = selectedSeats.filter(s => s !== seatId);
        }
        localStorage.setItem("selectedSeats", JSON.stringify(selectedSeats));
        selection.textContent = quantity;
        console.log(`Seats selected: ${quantity}`);
    });
});

localStorage.setItem("reserved", JSON.stringify(reservedSeats));
selection.textContent = quantity;

const tickets = document.querySelectorAll('.ticket');
const subtotal = document.querySelector('.subtotal');
const ticketQty = document.querySelector('.ticket-quantity');

tickets.forEach(ticket => {
    const decrementBtn = ticket.querySelector('.decrement');
    const incrementBtn = ticket.querySelector('.increment');
    const counterValue = ticket.querySelector('.counter-value');
    let selectedQuantity = parseInt(ticket.dataset.quantity) || 0;
    updateUI(selectedQuantity);

    function updateUI(quantity) {
        selectedQuantity = Math.max(0, quantity);
        ticket.dataset.quantity = selectedQuantity;
        counterValue.textContent = selectedQuantity;

        if (selectedQuantity > 0) {
            decrementBtn.classList.add('active');
        } else {
            decrementBtn.classList.remove('active');
        }
    }

    function updateQuantity(change) {
        let newQuantity = selectedQuantity + change;
        if(newQuantity >= 0) {
            updateUI(newQuantity);
            recalculateSubtotal();
        }
    }

    decrementBtn.addEventListener('click', () => { updateQuantity(-1); });
    incrementBtn.addEventListener('click', () => { updateQuantity(1); });
});

function recalculateSubtotal() {
    let totalPrice = 0;
    let totalQuantity = 0;
    let selectedTickets = {};
    let ticketTotals = {};

    tickets.forEach(ticket => {
        const priceElement = ticket.querySelector('.ticket-price');
        const price = parseFloat(priceElement?.getAttribute('data-price')) || 0;
        const quantity = parseInt(ticket.dataset.quantity || 0);
        const ticketType = ticket.dataset.type;
        
        if (quantity > 0 && price > 0) {
            selectedTickets[ticketType] = quantity;
            const subTotalPerType = price * quantity;
            ticketTotals[ticketType] = subTotalPerType.toFixed(2);
            totalPrice += subTotalPerType;
            totalQuantity += quantity;
        }
    });

    subtotal.textContent = totalPrice.toFixed(2);

    if (ticketQty) {
        ticketQty.textContent = totalQuantity > 0 ? `${totalQuantity} Ticket${totalQuantity > 1 ? 's' : ''} Selected` : 'Select Tickets';
    }

     let ticketInfo = [selectedTickets, ticketTotals];
    console.log(ticketInfo);

    localStorage.setItem("ticketInfo", JSON.stringify(ticketInfo));
    localStorage.setItem("ticketTotals", JSON.stringify(ticketTotals));
    localStorage.setItem("Subtotal", totalPrice.toFixed(2));


    console.log('Selected Tickets:', selectedTickets);
    console.log('Total Price Per Ticket Type:', ticketTotals);
    console.log('Subtotal:', totalPrice.toFixed(2));
    console.log('Ticket quantity:', totalQuantity);
}