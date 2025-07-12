import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights();
import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights();

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
    // --- CONFIGURATION ---
    const MAINNET_CONTRACT_ADDRESS = '0xc56F971934961267586e8283C06018167F0D0E4C';

    // --- DYNAMIC CONTENT ---
    const contractLink = document.getElementById('contractLink');
    const contractAddressDisplay = document.getElementById('contractAddress');

    if (MAINNET_CONTRACT_ADDRESS) {
        const polygonScanUrl = `https://polygonscan.com/token/${MAINNET_CONTRACT_ADDRESS}`;
        if (contractLink) {
            contractLink.href = polygonScanUrl;
        }
        if (contractAddressDisplay) {
            contractAddressDisplay.textContent = `Mainnet Contract: ${MAINNET_CONTRACT_ADDRESS}`;
        }
    }

    // --- WALLET CONNECT BUTTON ---
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', (event) => {
            event.preventDefault();
            connectWallet();
        });
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
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const userAddress = accounts[0];

                const amountString = prompt("Enter the amount of MATIC you would like to donate:", "1");
                if (amountString === null || amountString.trim() === "") {
                    return;
                }

                const amountInMatic = parseFloat(amountString);
                if (isNaN(amountInMatic) || amountInMatic <= 0) {
                    alert("Invalid amount. Please enter a positive number.");
                    return;
                }

                const amountInWei = ethers.utils.parseUnits(amountInMatic.toString(), 18)._hex;

                const transactionParameters = {
                    to: donationAddress,
                    from: userAddress,
                    value: amountInWei,
                };

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
});