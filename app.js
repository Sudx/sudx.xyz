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
});