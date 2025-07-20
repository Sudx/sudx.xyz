document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    // Toggle mobile menu on hamburger click
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when a link is clicked
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });

    // Handle wallet button ID conflict
    const connectWalletBtnDesktop = document.getElementById('connectWalletBtnDesktop');
    const connectWalletBtnMobile = document.getElementById('connectWalletBtnMobile');

    // You can now use these two variables to attach your wallet connection logic.
    // For example:
    // if (connectWalletBtnDesktop) {
    //     connectWalletBtnDesktop.addEventListener('click', () => {
    //         console.log('Desktop wallet connect clicked');
    //         // Add your wallet connection logic here
    //     });
    // }
    // if (connectWalletBtnMobile) {
    //     connectWalletBtnMobile.addEventListener('click', () => {
    //         console.log('Mobile wallet connect clicked');
    //         // Add your wallet connection logic here
    //     });
    // }
});
