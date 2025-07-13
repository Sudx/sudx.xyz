import { injectSpeedInsights } from '@vercel/speed-insights';
injectSpeedInsights();

// --- CONFIGURATION ---
const usdcTokenAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'; // Official USDC on Polygon
const liquidityFundAddress = '0xffC666cD50a6250CDc83E44C5f6e57Ec6f6074b4'; // SUDX Liquidity Fund

const usdcTokenABI = [
    "function transfer(address to, uint256 amount)",
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

// --- STATE VARIABLES ---
let provider;
let signer;
let userAddress;

// --- UI ELEMENTS ---
const connectWalletBtn = document.getElementById('connectWalletBtn');
const donateUSDCBtn = document.getElementById('donateUSDCBtn');
const walletMessage = document.getElementById('wallet-message');

// --- WALLET CONNECTION LOGIC ---

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed. Please install it to use this feature.');
        return;
    }
    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        console.log('Wallet connected:', userAddress);
        updateUIForConnection();
        
        window.ethereum.on('accountsChanged', handleAccountsChanged);

    } catch (error) {
        console.error('User rejected connection:', error);
        alert('You must connect your wallet to use this feature.');
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length > 0) {
        userAddress = accounts[0];
        signer = provider.getSigner();
        console.log('Account changed to:', userAddress);
        updateUIForConnection();
    } else {
        console.log('Wallet disconnected');
        resetUI();
    }
}

function updateUIForConnection() {
    connectWalletBtn.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
    connectWalletBtn.disabled = true;
    donateUSDCBtn.disabled = false; // Enable the donate button
    walletMessage.style.display = 'none'; // Hide message
}

function resetUI() {
    connectWalletBtn.textContent = 'Connect Wallet';
    connectWalletBtn.disabled = false;
    donateUSDCBtn.disabled = true; // Disable donate button if not connected
    walletMessage.style.display = 'block'; // Show message
    userAddress = null;
    signer = null;
}

// --- DONATION LOGIC ---

async function handleDonation() {
    if (!signer) {
        alert('Please connect your wallet to donate.');
        await connectWallet();
        return;
    }

    const amountString = prompt(`Enter the amount of USDC you wish to donate to the liquidity fund:`);

    if (!amountString || isNaN(amountString) || parseFloat(amountString) <= 0) {
        alert('Please enter a valid positive number.');
        return;
    }

    try {
        const tokenContract = new ethers.Contract(usdcTokenAddress, usdcTokenABI, signer);
        const decimals = await tokenContract.decimals();
        const amount = ethers.utils.parseUnits(amountString, decimals);

        const balance = await tokenContract.balanceOf(userAddress);
        if (balance.lt(amount)) {
            alert('Insufficient USDC balance.');
            return;
        }

        const tx = await tokenContract.transfer(liquidityFundAddress, amount);
        alert('Transaction initiated. Please confirm in your wallet and wait for confirmation.');
        
        await tx.wait();
        
        alert(`Donation successful! Thank you for contributing to the liquidity pool.`);
        console.log(`Transaction successful with hash: ${tx.hash}`);

    } catch (error) {
        console.error('Donation failed:', error);
        alert(`Donation failed. Error: ${error.message || 'See console for details.'}`);
    }
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    connectWalletBtn.addEventListener('click', connectWallet);
    donateUSDCBtn.addEventListener('click', handleDonation);
    
    // Initially disable the donate button and show message
    donateUSDCBtn.disabled = true;
    if (walletMessage) {
        walletMessage.style.display = 'block';
    }
});
