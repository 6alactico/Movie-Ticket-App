document.addEventListener("DOMContentLoaded", () => {
  fetch("./nav.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then((html) => {
      // Assuming you have a placeholder with id="nav-placeholder" in your HTML
      const navPlaceholder = document.getElementById("nav-placeholder");
      if (navPlaceholder) {
        navPlaceholder.innerHTML = html;

        // Setup navigation behavior after the HTML is loaded
        setupNavigation();
      } else {
        console.warn("Nav placeholder not found");
      }
    })
    .catch((err) => {
      console.error("Failed to load nav:", err);
      console.error("Make sure nav.html is in the same directory as this HTML file");
    });

  function setupNavigation() {
    // Setup the dynamic href behavior for the movies link
    setupNavLinkBehavior();

    // Setup active state management for nav items
    setupNavActiveStates();

    // Set the correct active state based on current page
    setActiveNavItem();
  }

  function setActiveNavItem() {
    const currentPage =
      window.location.pathname.split("/").pop() || "index.html";
    const navItems = document.querySelectorAll(".nav-list li");

    navItems.forEach((item) => {
      const link = item.querySelector("a");
      if (link) {
        const linkPage = link.getAttribute("href");

        // Remove active class from all items first
        item.classList.remove("active");
        link.classList.remove("active");

        // Add active class to matching page
        if (
          linkPage === currentPage ||
          (currentPage === "" && linkPage === "index.html") ||
          (currentPage === "index.html" && linkPage === "index.html")
        ) {
          item.classList.add("active");
          link.classList.add("active");
          console.log(`Set active nav item for page: ${currentPage}`);
        }
      }
    });
  }

  function setupNavLinkBehavior() {
    const navLink = document.getElementById("movies");
    if (!navLink) {
      console.warn("Movies nav link not found");
      return false;
    }

    function updateLinkHref() {
      if (window.innerWidth >= 768) {
        navLink.href = "movies.html";
      } else {
        navLink.href = "index.html";
      }
      console.log(
        `Updated nav link href to: ${navLink.href} (window width: ${window.innerWidth}px)`
      );
    }

    updateLinkHref();
    window.addEventListener("resize", updateLinkHref);
    return true;
  }

  function setupNavActiveStates() {
    // Look for nav items - they could be li elements or a elements with nav-item class
    const navItems = document.querySelectorAll(".nav-list li");
    console.log(`Found ${navItems.length} nav items`);

    navItems.forEach((item) => {
      const link = item.querySelector("a");
      if (link) {
        link.addEventListener("click", (e) => {
          // Don't prevent default navigation - let links work normally

          // Update active states by removing 'active' class from all nav items
          navItems.forEach((navItem) => {
            navItem.classList.remove("active");
            // Also remove from nested a tags that might have the class
            const nestedLink = navItem.querySelector("a");
            if (nestedLink) {
              nestedLink.classList.remove("active");
            }
          });

          // Add active class to the clicked item
          item.classList.add("active");
          // Also add to the link if it expects the class there
          link.classList.add("active");

          console.log("Clicked nav item:", item, "Link href:", link.href);
        });
      }
    });
  }
});