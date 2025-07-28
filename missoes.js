document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mission-form');
    const statusDiv = document.getElementById('form-status');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusDiv.style.display = 'none';
        statusDiv.textContent = '';

        const formData = {
            walletAddress: document.getElementById('walletAddress').value,
            xUsername: document.getElementById('xUsername').value,
            telegramUsername: document.getElementById('telegramUsername').value,
            redditUsername: document.getElementById('redditUsername').value,
        };

        // Basic validation
        if (!formData.walletAddress || !formData.xUsername || !formData.telegramUsername) {
            showStatus('Please fill out all required fields.', 'error');
            return;
        }

        try {
            // We will send this to the admin-dashboard backend
            const response = await fetch('/api/submit_mission', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const result = await response.json();
                showStatus('Submission successful! Thank you for participating.', 'success');
                form.reset();
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
