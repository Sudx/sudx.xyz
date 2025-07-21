document.addEventListener('DOMContentLoaded', function() {
    // Track "Buy SUDX Now" button
    const buyButton = document.querySelector('a[href*="quickswap.exchange"]');
    if (buyButton && buyButton.innerText.toLowerCase().includes('buy sudx now')) {
        buyButton.addEventListener('click', function() {
            if (typeof gtag === 'function') {
                gtag('event', 'buy_sudx_now_click', {
                    'event_category': 'engagement',
                    'event_label': 'QuickSwap Link'
                });
            }
        });
    }

    // Track "Join Community" buttons in the main section
    const communitySection = document.getElementById('community');
    if (communitySection) {
        const communityLinks = communitySection.querySelectorAll('a.btn');
        communityLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (typeof gtag === 'function') {
                    const platform = link.innerText || 'Unknown';
                    gtag('event', 'join_community', {
                        'event_category': 'engagement',
                        'event_label': platform.trim()
                    });
                }
            });
        });
    }

    // Track "Join Community" link in the nav
    const navCommunityLink = document.querySelector('a[href="/#community"]');
    if (navCommunityLink) {
        navCommunityLink.addEventListener('click', function() {
            if (typeof gtag === 'function') {
                gtag('event', 'join_community', {
                    'event_category': 'engagement',
                    'event_label': 'Nav Link Click'
                });
            }
        });
    }
});