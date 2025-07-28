document.addEventListener('DOMContentLoaded', () => {
    const submissionSection = document.getElementById('submission');
    const confirmButtons = document.querySelectorAll('.btn-confirm');
    const form = document.getElementById('mission-form');
    const statusDiv = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

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
    // --- End of Validation Logic ---

    const completedMissions = {
        x: false,
        telegram: false,
        reddit: false // Optional
    };

    confirmButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mission = button.dataset.mission;
            if (mission) {
                completedMissions[mission] = true;
                button.classList.add('completed');
                button.textContent = 'Completed';
                button.disabled = true;
                checkAndRevealForm();
            }
        });
    });

    function checkAndRevealForm() {
        if (completedMissions.x && completedMissions.telegram) {
            submissionSection.style.display = 'block';
            submissionSection.scrollIntoView({ behavior: 'smooth' });
            validateInputs(); // Initial check when form is revealed
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (submitBtn.disabled) {
            return; // Should not happen, but as a safeguard
        }
        statusDiv.style.display = 'none';
        statusDiv.textContent = '';

        const formData = {
            walletAddress: document.getElementById('walletAddress').value,
            xUsername: document.getElementById('xUsername').value,
            telegramUsername: document.getElementById('telegramUsername').value,
            redditUsername: document.getElementById('redditUsername').value,
        };

        try {
            const response = await fetch('/api/submit_mission', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                showStatus('Submission successful! Thank you for participating.', 'success');
                form.reset();
                submitBtn.disabled = true; // Disable after successful submission
            } else {
                const errorData = await response.json();
                showStatus(`Error: ${errorData.message || 'An unknown error occurred.'}`, 'error');
            }
        } catch (error) {
            console.error('Submission error:', error);
            showStatus('An error occurred while submitting the form. Please try again later.', 'error');
        }
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        statusDiv.style.display = 'block';
    }
});
