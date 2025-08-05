console.log("airdrop.js: Script loaded");

document.addEventListener('DOMContentLoaded', () => {
    console.log("airdrop.js: DOMContentLoaded event fired.");

    // --- SECTION SELECTORS ---
    const submissionSection = document.getElementById('submission');
    const form = document.getElementById('mission-form');
    const statusDiv = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');
    console.log("airdrop.js: Core elements selected.");

    // --- MISSION CARDS ---
    const missionXCard = document.getElementById('mission-x');
    const missionTelegramCard = document.getElementById('mission-telegram');
    const missionRedditCard = document.getElementById('mission-reddit');

    // --- ACTION BUTTONS ---
    const missionXActions = missionXCard.querySelectorAll('.mission-actions .btn');
    const missionTelegramActions = missionTelegramCard.querySelectorAll('.mission-actions .btn');
    const missionRedditActions = missionRedditCard.querySelectorAll('.mission-actions .btn');

    // --- CONFIRM BUTTONS ---
    const confirmXBtn = missionXCard.querySelector('.btn-confirm');
    const confirmTelegramBtn = missionTelegramCard.querySelector('.btn-confirm');
    const confirmRedditBtn = missionRedditCard.querySelector('.btn-confirm');
    console.log("airdrop.js: All mission cards and buttons selected.");

    // --- STATE TRACKING ---
    const completedMissions = {
        x: false,
        telegram: false,
        reddit: false
    };
    console.log("airdrop.js: Initial mission state:", completedMissions);

    // --- INITIAL SETUP ---
    confirmXBtn.disabled = true;
    confirmTelegramBtn.disabled = true;
    confirmRedditBtn.disabled = true;
    console.log("airdrop.js: Confirm buttons disabled initially.");

    // --- HELPER FUNCTION ---
    const allActionsClicked = (actionButtons) => {
        return actionButtons.length > 0 && Array.from(actionButtons).every(btn => btn.classList.contains('clicked'));
    };

    // --- EVENT LISTENERS FOR ACTION BUTTONS ---
    missionXActions.forEach(button => {
        button.addEventListener('click', () => {
            console.log("airdrop.js: Mission X action clicked.", button.textContent);
            button.classList.add('clicked');
            button.innerHTML = '✓ Done';
            button.style.pointerEvents = 'none';
            if (allActionsClicked(missionXActions)) {
                console.log("airdrop.js: All Mission X actions completed. Enabling confirm button.");
                confirmXBtn.disabled = false;
            }
        }, { once: true });
    });

    missionTelegramActions.forEach(button => {
        button.addEventListener('click', () => {
            console.log("airdrop.js: Mission Telegram action clicked.");
            button.classList.add('clicked');
            button.innerHTML = '✓ Joined';
            button.style.pointerEvents = 'none';
            if (allActionsClicked(missionTelegramActions)) {
                console.log("airdrop.js: All Mission Telegram actions completed. Enabling confirm button.");
                confirmTelegramBtn.disabled = false;
            }
        }, { once: true });
    });

    missionRedditActions.forEach(button => {
        button.addEventListener('click', () => {
            console.log("airdrop.js: Mission Reddit action clicked.");
            button.classList.add('clicked');
            button.innerHTML = '✓ Followed';
            button.style.pointerEvents = 'none';
            if (allActionsClicked(missionRedditActions)) {
                console.log("airdrop.js: All Mission Reddit actions completed. Enabling confirm button.");
                confirmRedditBtn.disabled = false;
            }
        }, { once: true });
    });
    console.log("airdrop.js: Action button listeners attached.");

    // --- EVENT LISTENERS FOR CONFIRM BUTTONS ---
    [confirmXBtn, confirmTelegramBtn, confirmRedditBtn].forEach(button => {
        button.addEventListener('click', () => {
            const mission = button.dataset.mission;
            console.log(`airdrop.js: Confirm button clicked for mission: ${mission}`);
            if (mission) {
                completedMissions[mission] = true;
                button.classList.add('completed');
                button.textContent = 'Mission Confirmed';
                button.disabled = true;
                console.log("airdrop.js: Updated mission state:", completedMissions);

                const card = document.getElementById(`mission-${mission}`);
                card.querySelectorAll('.mission-actions .btn').forEach(btn => {
                    btn.style.pointerEvents = 'none';
                    btn.classList.add('finalized');
                });

                checkAndRevealForm();
            }
        });
    });
    console.log("airdrop.js: Confirm button listeners attached.");

    // --- FORM LOGIC ---
    function checkAndRevealForm() {
        console.log("airdrop.js: Checking if form should be revealed.");
        if (completedMissions.x && completedMissions.telegram) {
            console.log("airdrop.js: Required missions completed. Revealing form.");
            submissionSection.style.display = 'block';
            submissionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            validateInputs();
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
        console.log(`airdrop.js: Validating inputs. All filled: ${allFilled}`);
        submitBtn.disabled = !allFilled;
    }

    requiredInputs.forEach(input => {
        input.addEventListener('input', validateInputs);
    });
    console.log("airdrop.js: Input validation listeners attached.");

    // --- FORM SUBMISSION ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("airdrop.js: Form submission initiated.");
        if (submitBtn.disabled) {
            console.warn("airdrop.js: Submission attempted but button is disabled.");
            return;
        }

        statusDiv.style.display = 'none';
        statusDiv.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const formData = {
            walletAddress: document.getElementById('walletAddress').value,
            xUsername: document.getElementById('xUsername').value,
            telegramUsername: document.getElementById('telegramUsername').value,
            redditUsername: document.getElementById('redditUsername').value,
            email: document.getElementById('email').value,
        };
        console.log("airdrop.js: Form data collected:", formData);

        try {
            console.log("airdrop.js: Sending fetch request to /api/submit_mission");
            const response = await fetch('/api/submit_mission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            console.log(`airdrop.js: Received response with status: ${response.status}`);

            const result = await response.json();
            console.log("airdrop.js: Parsed response JSON:", result);

            if (response.ok) {
                showStatus(result.message || 'Submission successful!', 'success');
                form.reset();
            } else {
                showStatus(`Error: ${result.error || 'An unknown error occurred.'}`, 'error');
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('airdrop.js: Submission fetch error:', error);
            showStatus('A network error occurred. Please check your connection and try again.', 'error');
            submitBtn.disabled = false;
        } finally {
            submitBtn.textContent = 'Submit for Airdrop';
        }
    });
    console.log("airdrop.js: Form submit listener attached.");

    function showStatus(message, type) {
        console.log(`airdrop.js: Displaying status: "${message}" (type: ${type})`);
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        statusDiv.style.display = 'block';
    }

    console.log("airdrop.js: Initialization complete.");
});
