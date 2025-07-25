const track = document.querySelector(".carousel-slides");
const paginationDots = document.querySelectorAll(".pagination-dot");
let slides = document.querySelectorAll(".carousel-slide");
let currentIndex = 1;

// Clone slides
track.appendChild(slides[0].cloneNode(true)).classList.add("first-clone");
track
  .insertBefore(slides[slides.length - 1].cloneNode(true), slides[0])
  .classList.add("last-clone");

slides = document.querySelectorAll(".carousel-slide"); // Update slides

track.style.transition = "none";
track.style.transform = `translateX(-${currentIndex * 100}%)`;

function updateDots() {
  paginationDots.forEach((dot) => dot.classList.remove("active"));
  paginationDots[
    (currentIndex - 1 + paginationDots.length) % paginationDots.length
  ].classList.add("active");
}

function showSlides(trans = true) {
  if (!trans) {
    track.style.transition = "none";
  } else {
    track.style.transition = "";
  }

  track.style.transform = `translateX(-${currentIndex * 100}%)`;
  updateDots();
}

track.addEventListener("transitionend", () => {
  if (slides[currentIndex].classList.contains("first-clone")) {
    currentIndex = 1;
    showSlides(false);
  } else if (slides[currentIndex].classList.contains("last-clone")) {
    currentIndex = slides.length - 2;
    showSlides(false);
  }
});

paginationDots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    currentIndex = index + 1;
    showSlides(true);
  });
});

function automaticSlides() {
  currentIndex++;
  showSlides();
  if (currentIndex >= slides.length) {
    setTimeout(() => {
      currentIndex = 1;
      showSlides(false);
    }, 500);
  }
  setTimeout(automaticSlides, 4000);
}
showSlides(false); // Initial jump without animation
setTimeout(automaticSlides, 4000);

const filterButton = document.querySelector(".filter-btn");
const bellButton = document.querySelector(".bell-btn");
const appContainer = document.querySelector("app-container");

filterButton.addEventListener("click", () => {
  let filterMenu = document.querySelector(".filter-menu");

  if (!filterMenu) {
    filterMenu = document.createElement("div");
    filterMenu.classList.add("filter-menu");
    filterMenu.innerHTML = `
      <div class="filter-option">Genre</div>
      <div class="filter-option">Rating</div>
      <div class="filter-option">Release Date</div>
    `;
    appContainer.appendChild(filterMenu);
  }

  filterMenu.classList.toggle("active");
});

bellButton.addEventListener("click", () => {
  let notificationMenu = document.querySelector(".notification-menu");

  if (!notificationMenu) {
    notificationMenu = document.createElement("div");
    notificationMenu.classList.add("notification-menu");
    notificationMenu.innerHTML = `
      <div class="notification">Notification 1</div>
      <div class="notification">Notification 2</div>
      <div class="notification">Notification 3</div>
    `;
    appContainer.appendChild(notificationMenu);
  }
  notificationMenu.classList.toggle("active");
});

const navItems = document.querySelectorAll('.nav-item.mobile');
navItems.forEach(item => { 
    item.addEventListener("click", e => { 
        e.preventDefault();

        navItems.forEach(nav => { 
            nav.classList.remove("active");
            nav.setAttribute("aria-pressed", "false");
        });
        
        item.classList.add("active");
        item.setAttribute("aria-pressed", "true");

        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        const index = item.querySelector('a')?.dataset.index;
        if (index) {
            const targetScreen = document.getElementById(index);
            if (targetScreen) {
                targetScreen.classList.remove('hidden');
            }
        }
    });
});

function setupButtons() {
  const nowPlayingButton = document.querySelector('.now-playing-btn');
  const comingSoonButton = document.querySelector('.coming-soon-btn');
  const buttons = document.querySelectorAll('#screen1 .segmented-btn[data-index]');
  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(btn => {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
      });

      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
      
      if (button === nowPlayingButton) {
        currentList = nowPlaying;
        movieContainers(nowPlaying);
      } else if (button === comingSoonButton) {
        currentList = comingSoon;
        movieContainers(comingSoon, true);
      }
      console.log(`Button ${button.dataset.index} clicked`);
    });
  });
}
