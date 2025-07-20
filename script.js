
const navItems = document.querySelectorAll('.nav-item.mobile');
navItems.forEach(item => { 
    item.addEventListener("click", () => { 
        navItems.forEach(nav => { 
            nav.classList.remove("active");
            nav.setAttribute("aria-pressed", "false");
        });
        
        item.classList.add("active");
        item.setAttribute("aria-pressed", "true");
    });
});

const buttons = document.querySelectorAll(".segmented-btn[data-index]");
const nowPlayingButton = document.querySelector('.now-playing-btn');
const comingSoonButton = document.querySelector('.coming-soon-btn');

buttons.forEach(button => {
    button.addEventListener("click", () => {
        buttons.forEach(btn => {
            btn.classList.remove("active");
            btn.setAttribute("aria-pressed", "false");
        });

        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");
        
        if (nowPlayingButton && comingSoonButton) {
            if (button === nowPlayingButton) {
                nowPlayingButton.setAttribute("aria-pressed", "true");
                comingSoonButton.setAttribute("aria-pressed", "false");
            } else if (button === comingSoonButton) {
                nowPlayingButton.setAttribute("aria-pressed", "false");
                comingSoonButton.setAttribute("aria-pressed", "true");
            }
        }
        console.log(`Button ${button.dataset.index} clicked`);
        console.log(button);
    });
});