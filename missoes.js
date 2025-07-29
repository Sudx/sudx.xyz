document.addEventListener('DOMContentLoaded', () => {
    // --- SECTION SELECTORS ---
    const submissionSection = document.getElementById('submission');
    const form = document.getElementById('mission-form');
    const statusDiv = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

    // --- MISSION CARDS ---
    const missionXCard = document.getElementById('mission-x');
    const missionTelegramCard = document.getElementById('mission-telegram');
    const missionRedditCard = document.getElementById('mission-reddit');

    // --- ACTION BUTTONS ---
    // Each action button within a mission card
    const missionXActions = missionXCard.querySelectorAll('.mission-actions .btn');
    const missionTelegramActions = missionTelegramCard.querySelectorAll('.mission-actions .btn');
    const missionRedditActions = missionRedditCard.querySelectorAll('.mission-actions .btn');

    // --- CONFIRM BUTTONS ---
    const confirmXBtn = missionXCard.querySelector('.btn-confirm');
    const confirmTelegramBtn = missionTelegramCard.querySelector('.btn-confirm');
    const confirmRedditBtn = missionRedditCard.querySelector('.btn-confirm');

    // --- STATE TRACKING ---
    const completedMissions = {
        x: false,
        telegram: false,
        reddit: false // Optional
    };

    // --- INITIAL SETUP ---
    // Disable all confirm buttons initially
    confirmXBtn.disabled = true;
    confirmTelegramBtn.disabled = true;
    confirmRedditBtn.disabled = true;

    // --- HELPER FUNCTION TO CHECK COMPLETION ---
    /**
     * Checks if all action buttons in a NodeList have been clicked.
     * @param {NodeListOf<Element>} actionButtons - The list of buttons to check.
     * @returns {boolean} - True if all buttons have the 'clicked' class.
     */
    const allActionsClicked = (actionButtons) => {
        return actionButtons.length > 0 && Array.from(actionButtons).every(btn => btn.classList.contains('clicked'));
    };

    // --- EVENT LISTENERS FOR ACTION BUTTONS ---

    // Mission X: Requires all 3 buttons to be clicked
    missionXActions.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.add('clicked');
            button.innerHTML = '✓ Done'; // Visual feedback
            button.style.pointerEvents = 'none'; // Prevent re-clicking the link
            
            // Enable confirm button only if all actions are done
            if (allActionsClicked(missionXActions)) {
                confirmXBtn.disabled = false;
            }
        }, { once: true }); // Ensure the event fires only once per button
    });

    // Mission Telegram: Requires 1 button to be clicked
    missionTelegramActions.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.add('clicked');
            button.innerHTML = '✓ Joined';
            button.style.pointerEvents = 'none';

            if (allActionsClicked(missionTelegramActions)) {
                confirmTelegramBtn.disabled = false;
            }
        }, { once: true });
    });

    // Mission Reddit: Requires 1 button to be clicked
    missionRedditActions.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.add('clicked');
            button.innerHTML = '✓ Followed';
            button.style.pointerEvents = 'none';

            if (allActionsClicked(missionRedditActions)) {
                confirmRedditBtn.disabled = false;
            }
        }, { once: true });
    });

    // --- EVENT LISTENERS FOR CONFIRM BUTTONS ---
    [confirmXBtn, confirmTelegramBtn, confirmRedditBtn].forEach(button => {
        button.addEventListener('click', () => {
            const mission = button.dataset.mission;
            if (mission) {
                completedMissions[mission] = true;
                button.classList.add('completed');
                button.textContent = 'Mission Confirmed';
                button.disabled = true; // Permanently disable after confirming

                // Also disable the action buttons in that card
                const card = document.getElementById(`mission-${mission}`);
                card.querySelectorAll('.mission-actions .btn').forEach(btn => {
                    btn.style.pointerEvents = 'none';
                    btn.classList.add('finalized');
                });

                checkAndRevealForm();
            }
        });
    });

    // --- FORM LOGIC ---
    function checkAndRevealForm() {
        // Reveal form only if the REQUIRED missions are done
        if (completedMissions.x && completedMissions.telegram) {
            submissionSection.style.display = 'block';
            submissionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            validateInputs(); // Initial check when form is revealed
        }
    }

    // --- Form Input Validation ---
    const requiredInputs = [
        document.getElementById('walletAddress'),
        document.getElementById('xUsername'),
        document.getElementById('telegramUsername')
    ];

    function validateInputs() {
        const allFilled = requiredInputs.every(input => input.value.trim() !== '');
        submitBtn.disabled = !allFilled;
    }

    requiredInputs.forEach(input => {
        input.addEventListener('input', validateInputs);
    });

    // --- FORM SUBMISSION ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (submitBtn.disabled) return;

        statusDiv.style.display = 'none';
        statusDiv.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const formData = {
            walletAddress: document.getElementById('walletAddress').value,
            xUsername: document.getElementById('xUsername').value,
            telegramUsername: document.getElementById('telegramUsername').value,
            redditUsername: document.getElementById('redditUsername').value,
        };

        try {
            const response = await fetch('/api/submit_mission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                showStatus(result.message || 'Submission successful!', 'success');
                form.reset();
            } else {
                showStatus(`Error: ${result.message || 'An unknown error occurred.'}`, 'error');
                submitBtn.disabled = false; // Re-enable on error
            }
        } catch (error) {
            console.error('Submission error:', error);
            showStatus('An error occurred. Please check your connection and try again.', 'error');
            submitBtn.disabled = false; // Re-enable on network error
        } finally {
            submitBtn.textContent = 'Submit for Airdrop';
        }
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        statusDiv.style.display = 'block';
    }
});