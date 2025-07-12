import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights();
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

    // This space is intentionally left blank.
});

// Ethers.js needs to be loaded for parseUnits to work. Ensure the main HTML file includes it.
// The index.html does not seem to include ethers.js, it needs to be added.
// Let's add it to the footer of index.html

const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask to use this feature.');
        return null;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];
        alert(`Wallet Connected: ${userAddress}`);
        return userAddress;
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        if (error.code === 4001) {
            alert('Connection request cancelled by user.');
        } else {
            alert(`An error occurred while connecting: ${error.message}`);
        }
        return null;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', (event) => {
            event.preventDefault();
            connectWallet();
        });
    }

    // --- TOKENOMICS CHART LOGIC ---
    const tokenomicsSection = document.getElementById('tokenomics');
    if (tokenomicsSection) {
        const ctx = document.getElementById('tokenomicsChart').getContext('2d');
        
        const data = {
            labels: [
                'Ecosystem & Rewards', 
                'Liquidity Pool', 
                'Team & Founders', 
                'Marketing & Partnerships', 
                'Strategic Treasury'
            ],
            datasets: [{
                data: [45, 24.95, 15, 10, 5],
                backgroundColor: [
                    '#9e00ff', // Electric Purple
                    '#00f6ff', // Neon Cyan
                    '#ff00e6', // Neon Magenta
                    '#6a00ff', // Darker Purple
                    '#d100ff'  // Lighter Magenta
                ],
                borderColor: '#0d021a', // Background color for separation
                borderWidth: 3,
                hoverOffset: 10
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e6e0f5', // Text color
                        font: {
                            family: "'Inter', sans-serif",
                            size: 14
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed + '%';
                            }
                            return label;
                        }
                    },
                    titleFont: {
                        size: 16,
                        family: "'Inter', sans-serif"
                    },
                    bodyFont: {
                        size: 14,
                        family: "'Inter', sans-serif"
                    },
                    backgroundColor: 'rgba(13, 2, 26, 0.9)',
                    titleColor: '#00f6ff',
                    bodyColor: '#e6e0f5'
                }
            }
        };

        new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: options
        });
    }
});