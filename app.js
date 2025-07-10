document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    // Once the SUDX Token is deployed on Polygon Mainnet, update this address.
    const MAINNET_CONTRACT_ADDRESS = '0xc56F971934961267586e8283C06018167F0D0E4C'; // Updated contract address

    // --- DYNAMIC CONTENT ---
    const contractLink = document.getElementById('contractLink');
    const contractAddressDisplay = document.getElementById('contractAddress');

    if (MAINNET_CONTRACT_ADDRESS) {
        const polygonScanUrl = `https://polygonscan.com/token/${MAINNET_CONTRACT_ADDRESS}`;
        if (contractLink) {
            contractLink.href = polygonScanUrl;
            // The text is already set in HTML, so no need to change it here unless dynamic
        }
        if (contractAddressDisplay) {
            contractAddressDisplay.textContent = `Mainnet Contract: ${MAINNET_CONTRACT_ADDRESS}`;
        }
    }

    // --- DONATION BUTTON LOGIC ---
    const donateButton = document.getElementById('donateButton');
    if (donateButton) {
        donateButton.addEventListener('click', async (event) => {
            event.preventDefault();

            const donationAddress = '0xffC666cD50a6250CDc83E44C5f6e57Ec6f6074b4';

            if (typeof window.ethereum === 'undefined') {
                alert('Please install MetaMask to use this feature.');
                return;
            }

            try {
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const userAddress = accounts[0];

                // Prompt for donation amount
                const amountString = prompt("Enter the amount of MATIC you would like to donate:", "1");
                if (amountString === null || amountString.trim() === "") {
                    // User cancelled the prompt
                    return;
                }

                const amountInMatic = parseFloat(amountString);
                if (isNaN(amountInMatic) || amountInMatic <= 0) {
                    alert("Invalid amount. Please enter a positive number.");
                    return;
                }

                // Convert MATIC to Wei (the smallest unit) and then to hex
                const amountInWei = ethers.utils.parseUnits(amountInMatic.toString(), 18)._hex;

                // Create transaction parameters
                const transactionParameters = {
                    to: donationAddress,
                    from: userAddress,
                    value: amountInWei,
                };

                // Send the transaction
                alert("Please confirm the transaction in your MetaMask wallet.");
                const txHash = await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [transactionParameters],
                });

                alert(`Transaction sent! Thank you for your donation. Transaction hash: ${txHash}`);

            } catch (error) {
                console.error('Donation failed:', error);
                if (error.code === 4001) {
                    alert('Transaction cancelled by user.');
                } else {
                    alert(`An error occurred: ${error.message}`);
                }
            }
        });
    }

    // --- DASHBOARD PREVIEW LOGIC ---
    // This logic seems to replace the dashboard content. If you want the dashboard to be functional,
    // this part should be removed or updated. For now, I will leave it as is.
    if (window.location.pathname.includes('dashboard.html')) {
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = `
                <div style="text-align: center; padding: 100px; font-family: 'Inter', sans-serif; color: #e6e0f5;">
                    <h1 style="color: #8a42f5; font-size: 2.5rem;">Dashboard Coming Soon</h1>
                    <p style="font-size: 1.2rem; line-height: 1.7;">
                        The on-chain statistics dashboard will be activated once the initial liquidity pool is created.
                    </p>
                    <a href="index.html" class="btn" style="display: inline-block; margin-top: 30px; padding: 15px 35px; background-color: #8a42f5; color: #fff; text-decoration: none; font-weight: 700; border-radius: 12px;">Return to Homepage</a>
                </div>
            `;
        }
    }
});

// Ethers.js needs to be loaded for parseUnits to work. Ensure the main HTML file includes it.
// The index.html does not seem to include ethers.js, it needs to be added.
// Let's add it to the footer of index.html
