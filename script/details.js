async function loadMovieDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get("id");

  if (!movieId) return;

  try {
    const [details, certification] = await Promise.all([
      getMovieDetails(movieId),
      getCertification(movieId),
    ]);
    details.certification = certification;
    details.runtime = convertRuntime(details.runtime);
    
    document.getElementById("movie-title").textContent = details.title;
    document.getElementById("genre").textContent = details.genres[0].name || "N/A";
    document.getElementById("year").textContent = details.release_date ? details.release_date.substring(0, 4) : "N/A";
    document.getElementById("rating").textContent = details.certification || "NR";
    document.getElementById("runtime").textContent = details.runtime;
  } catch (error) {
    console.error("Error loading movie details:", error);
  }
}

loadMovieDetailsPage();

const buttons = document.querySelectorAll('.showtimes-and-details-page .segmented-btn');
buttons.forEach(button => {
  button.addEventListener("click", () => {
    buttons.forEach(btn => {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    });

    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");

    const targetSection = document.getElementById(button.dataset.target);
    if (targetSection) {
      document.querySelectorAll('.segmented-section').forEach(section => {
        section.classList.add('hidden');
      });
      targetSection.classList.remove('hidden');
    }
  });
});

// DATE SELECTOR
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const container = document.querySelector(".date-selector");
const numberOfButtons = 14;

const startDate = new Date();

for (let i = 0; i < numberOfButtons; i++) {
  const currentDate = new Date(startDate);
  currentDate.setDate(startDate.getDate() + i);

  const dayIndex = currentDate.getDay();
  const dayName = daysOfWeek[dayIndex];

  const button = document.createElement("button");
  button.className = "date-tab";

  button.innerHTML = `
    <div class="day-name">${dayName.slice(0, 3)}</div>
    <div class="day-num">${currentDate.getDate()}</div>
  `;

  button.addEventListener('click', () => {
    console.log(`Selected date: ${currentDate.toDateString()}`);
  });

  container.appendChild(button);
  console.log(button);
}