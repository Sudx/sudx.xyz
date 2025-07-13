// --- CONFIGURATION ---
const sudxTokenAddress = '0xc56F971934961267586e8283C06018167F0D0E4C';
const sudxDaoTreasuryAddress = '0xA5dEa0A7E9c47d52e735c1d4129Cc02a54966E21'; // Official DAO Treasury

const sudxTokenABI = [
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
const donateToSUDXBtn = document.getElementById('donateToSUDXBtn');
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
        alert('You must connect your wallet to use the donation feature.');
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
    donateToSUDXBtn.disabled = false; // Enable the donate button
    walletMessage.style.display = 'none'; // Hide message
}

function resetUI() {
    connectWalletBtn.textContent = 'Connect Wallet';
    connectWalletBtn.disabled = false;
    donateToSUDXBtn.disabled = true; // Disable donate button if not connected
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

    const amountString = prompt(`Enter the amount of SUDX you wish to donate to the project:`);

    if (!amountString || isNaN(amountString) || parseFloat(amountString) <= 0) {
        alert('Please enter a valid positive number.');
        return;
    }

    try {
        const tokenContract = new ethers.Contract(sudxTokenAddress, sudxTokenABI, signer);
        const decimals = await tokenContract.decimals();
        const amount = ethers.utils.parseUnits(amountString, decimals);

        const balance = await tokenContract.balanceOf(userAddress);
        if (balance.lt(amount)) {
            alert('Insufficient SUDX balance.');
            return;
        }

        const tx = await tokenContract.transfer(sudxDaoTreasuryAddress, amount);
        alert('Transaction initiated. Please confirm in your wallet and wait for confirmation.');
        
        await tx.wait();
        
        alert(`Donation successful! Thank you for supporting the SUDX project.`);
        console.log(`Transaction successful with hash: ${tx.hash}`);

    } catch (error) {
        console.error('Donation failed:', error);
        alert(`Donation failed. Error: ${error.message || 'See console for details.'}`);
    }
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    connectWalletBtn.addEventListener('click', connectWallet);
    donateToSUDXBtn.addEventListener('click', handleDonation);
    
    // Initially disable the donate button and show message
    donateToSUDXBtn.disabled = true;
    if (walletMessage) {
        walletMessage.style.display = 'block';
    }
});