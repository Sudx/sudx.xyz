console.log("nav.js: Script loaded");

document.addEventListener('DOMContentLoaded', () => {
    console.log("nav.js: DOMContentLoaded event fired.");
    
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        console.log("nav.js: Hamburger and nav-menu found. Attaching click listener.");
        hamburger.addEventListener('click', () => {
            console.log("nav.js: Hamburger clicked.");
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    } else {
        console.error("nav.js: Hamburger or nav-menu element not found.");
    }

    const navLinks = document.querySelectorAll('.nav-links a');
    console.log(`nav.js: Found ${navLinks.length} navigation links. Attaching click listeners.`);
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            console.log(`nav.js: Nav link clicked: ${link.href}`);
            if (hamburger && hamburger.classList.contains('active')) {
                console.log("nav.js: Closing mobile menu because a link was clicked.");
                hamburger.classList.remove('active');
                if (navMenu) {
                    navMenu.classList.remove('active');
                }
            }
        });
    });

    // The wallet connection logic is handled by wallet.js, so we don't need to log it here.
    // This script's job is just the mobile navigation.
    console.log("nav.js: Initialization complete.");
});
