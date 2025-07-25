// Handles and displays showtimes and movie details
async function loadMovieDetailsPage() {
  const movieId = new URLSearchParams(window.location.search).get("id");
  if (!movieId) return;
  try {
    const [details, certification, credits] = await Promise.all([
      getMovieDetails(movieId),
      getCertification(movieId),
      getMovieCredits(movieId),
    ]);

    Object.assign(details, {
      certification,
      cast: credits.cast || [],
      crew: credits.crew || [],
      runtimeRaw: details.runtime,
      runtimeFormatted: convertRuntime(details.runtime),
    });

    localStorage.setItem("movieTitle", JSON.stringify(details.title));

    movieDetailsPage(details);
    dateSelector(details);
  } catch (error) {
    console.error("Error loading movie details:", error);
  }
}

loadMovieDetailsPage();

function movieDetailsPage(details) {
 document.getElementById("movie-title").textContent = details.title;
  document.getElementById("genre").textContent = details.genres[0].name || "N/A";
  document.getElementById("year").textContent = details.release_date ? details.release_date.substring(0, 4) : "N/A";
  document.getElementById("rating").textContent = details.certification || "NR";
  document.getElementById("runtime").textContent = details.runtimeFormatted;
  showtimes({ ...details, runtime: details.runtimeRaw});
  document.getElementById("movie-synopsis").textContent = `Synopsis: ${details.overview}` || "No description available.";
  document.querySelector(".movie-poster-lg img").src = IMAGE_BASE_URL + details.poster_path;

  const [year, month, day] = details.release_date?.split("-") || [];
  document.querySelector(".release-date").textContent = `Released: ${day || "N/A"}-${month || "N/A"}-${year || "N/A"}`;

  const createListItems = (members, selector) => {
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = "";
    members.forEach(member => {
      const li = document.createElement("li");
      li.className = "list-item flex-column";

      const img = document.createElement("img");
      img.src = IMAGE_BASE_URL + member.profile_path || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";
      img.alt = `${member.name} Poster`;

      const p = document.createElement("p");
      p.textContent = member.name;

      li.append(img, p);
      container.appendChild(li);
    });
  };
  createListItems(details.cast || [], ".cast-list");
  createListItems(details.crew || [], ".crew-list");
}

const buttons = document.querySelectorAll('.showtimes-and-details-screen .segmented-btn');
buttons.forEach(button => {
  button.addEventListener("click", () => {
    buttons.forEach(btn => {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    });

    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");

    document.querySelectorAll('.segmented-section').forEach(section => section.classList.add('hidden'));

    const target = document.getElementById(button.dataset.target);
    if (target) target.classList.remove('hidden');
  });
});

// Date Selector
let selectedDate = new Date();

function dateSelector(details) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const container = document.querySelector(".date-selector");
  const startDate = new Date();
  
  for (let i = 0; i < 14; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const dayIndex = currentDate.getDay();
    const dayName = days[dayIndex];
    
    const btn = document.createElement("button");
    btn.className = "date-tab";
  
    btn.innerHTML = `
      <div class="day-name">${days[currentDate.getDay()]}</div>
      <div class="day-num">${currentDate.getDate()}</div>
    `;
  
    btn.addEventListener("click", () => {
      container.querySelectorAll(".date-tab").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      selectedDate = currentDate;
      showtimes(details, selectedDate);
    });

    container.appendChild(btn);
  }

  selectedDate = new Date(startDate);

   const firstTab = document.querySelector(".date-tab");
   if (firstTab) { 
     firstTab.classList.add("active");
     showtimes(details, selectedDate);
   }
}
// Seeded Random Number Generator
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

function hashSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededShuffle(array, rng) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Showtimes
const startTime = new Date();
startTime.setHours(10, 0, 0, 0);
const endTime = new Date();
endTime.setHours(22, 0, 0, 0);

let hour = startTime.getHours();
let minute = startTime.getMinutes();  

function showtimes(details, selectedDate = new Date()) {
  const dateStr = selectedDate.toISOString().slice(0, 10);
  const runtime = details.runtimeRaw;
  const buffer = 20;

  const formats = [
    { name: "Standard", start: "10:00", end: "22:00" },
    { name: "RealD 3D", start: "11:00", end: "21:00" },
    { name: "D-BOX", start: "12:00", end: "20:00" },
  ];

  formats.forEach(({ name, start, end}) => {
    let current = parseTime(start, selectedDate);
    const closing = parseTime(end, selectedDate);
    const times = [];
    
    while (current <= closing) {
      times.push(new Date(current));
      current.setMinutes(current.getMinutes() + runtime + buffer);
    }

    const seed = hashSeed(`${name}-${dateStr}-${details.id}`);
    const rng = new SeededRandom(seed);
    const [minCount, maxCount] = name === "Standard" ? [2, 4] : [1, 2];

    const count = Math.floor(rng.next() * (maxCount - minCount + 1)) + minCount;
    const limited = seededShuffle(times, rng).slice(0, count).sort((a, b) => a - b);

    showtimeButtons(name, limited, details);
  });
}

function parseTime(timeStr, d) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(d);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function showtimeButtons(format, times, details) {
  const className = format.toLowerCase().replace(/\s+/g, "-");
  const container = document.querySelector(`.format.${className} .showtime-btns`);

  if (!container) console.warn(`No container found for format: ${format}`);

  container.innerHTML = "";

  times.forEach(time => {
    const timeButton = document.createElement("a");
    timeButton.href = `seats-and-tickets.html?id=${details.id}&format=${format}&date=${selectedDate}&time=${time}`;
    timeButton.className = "time-btn";
    timeButton.disabled = false;

    timeButton.textContent = time.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    if (isToday && time < now) {
      timeButton.classList.add("disabled");
      timeButton.removeAttribute('href');
    }

    container.appendChild(timeButton);
  });
}

const backBtn = document.querySelector(".movie-overview #back-button");
const closeBtn = document.querySelector(".movie-overview #close-button");
if (backBtn && closeBtn) {
  backBtn.addEventListener("click", () => { 
    localStorage.removeItem('selectedSeats');
    localStorage.removeItem('selectedTickets');
  });
  
  closeBtn.addEventListener("click", () => {
    localStorage.removeItem('selectedSeats');
    localStorage.removeItem('selectedTickets');
  });
}