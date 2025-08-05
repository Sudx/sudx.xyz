console.log("tracking.js: Script loaded");

document.addEventListener('DOMContentLoaded', function() {
    console.log("tracking.js: DOMContentLoaded event fired.");

    // Track "Buy SUDX Now" button
    const buyButton = document.querySelector('a[href*="quickswap.exchange"]');
    if (buyButton && buyButton.innerText.toLowerCase().includes('buy sudx now')) {
        console.log("tracking.js: 'Buy SUDX Now' button found. Attaching listener.");
        buyButton.addEventListener('click', function() {
            console.log("tracking.js: 'Buy SUDX Now' button clicked.");
            if (typeof gtag === 'function') {
                console.log("tracking.js: Firing 'buy_sudx_now_click' gtag event.");
                gtag('event', 'buy_sudx_now_click', {
                    'event_category': 'engagement',
                    'event_label': 'QuickSwap Link'
                });
            } else {
                console.warn("tracking.js: gtag function not found.");
            }
        });
    } else {
        console.log("tracking.js: 'Buy SUDX Now' button not found on this page.");
    }

    // Track "Join Community" buttons in the main section
    const communitySection = document.getElementById('community');
    if (communitySection) {
        console.log("tracking.js: Community section found.");
        const communityLinks = communitySection.querySelectorAll('a.btn');
        console.log(`tracking.js: Found ${communityLinks.length} community links in the section. Attaching listeners.`);
        communityLinks.forEach(link => {
            link.addEventListener('click', function() {
                const platform = link.innerText || 'Unknown';
                console.log(`tracking.js: Community link clicked: ${platform.trim()}`);
                if (typeof gtag === 'function') {
                    console.log("tracking.js: Firing 'join_community' gtag event.");
                    gtag('event', 'join_community', {
                        'event_category': 'engagement',
                        'event_label': platform.trim()
                    });
                } else {
                    console.warn("tracking.js: gtag function not found.");
                }
            });
        });
    } else {
        console.log("tracking.js: Community section not found on this page.");
    }

    // Track "Join Community" link in the nav
    const navCommunityLink = document.querySelector('a[href="/#community"]');
    if (navCommunityLink) {
        console.log("tracking.js: Nav community link found. Attaching listener.");
        navCommunityLink.addEventListener('click', function() {
            console.log("tracking.js: Nav community link clicked.");
            if (typeof gtag === 'function') {
                console.log("tracking.js: Firing 'join_community' (nav) gtag event.");
                gtag('event', 'join_community', {
                    'event_category': 'engagement',
                    'event_label': 'Nav Link Click'
                });
            } else {
                console.warn("tracking.js: gtag function not found.");
            }
        });
    } else {
        console.log("tracking.js: Nav community link not found on this page.");
    }

    console.log("tracking.js: Initialization complete.");
});
