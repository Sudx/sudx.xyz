console.log("wallet.js: Script loaded");

document.addEventListener('DOMContentLoaded', () => {
    console.log("wallet.js: DOMContentLoaded event fired.");

    // --- CONSTANTS & UI ELEMENTS ---
    const CONNECT_BUTTON_TEXT = 'Connect Wallet';
    const connectWalletBtnDesktop = document.getElementById('connectWalletBtnDesktop');
    const connectWalletBtnMobile = document.getElementById('connectWalletBtnMobile');
    const allConnectButtons = [connectWalletBtnDesktop, connectWalletBtnMobile].filter(btn => btn);
    console.log(`wallet.js: Found ${allConnectButtons.length} connect buttons.`);

    // --- STATE ---
    let userAddress = null;

    // --- UI UPDATE LOGIC ---
    function updateUI() {
        console.log("wallet.js: Updating UI, current address:", userAddress);
        if (userAddress) {
            // Connected State
            const shortAddress = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
            allConnectButtons.forEach(btn => {
                btn.textContent = shortAddress;
                btn.title = `Connected as ${userAddress}. Click to disconnect.`;
            });
        } else {
            // Disconnected State
            allConnectButtons.forEach(btn => {
                btn.textContent = CONNECT_BUTTON_TEXT;
                btn.title = 'Connect your wallet';
            });
        }
        console.log("wallet.js: UI update complete.");
    }

    // --- WALLET LOGIC ---
    async function connectWallet() {
        console.log("wallet.js: connectWallet function called.");
        if (typeof window.ethereum === 'undefined') {
            console.error("wallet.js: MetaMask (or other browser wallet) is not installed.");
            alert('Please install a browser wallet like MetaMask to connect.');
            return;
        }

        try {
            console.log("wallet.js: Requesting accounts from wallet...");
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            handleAccountsChanged(accounts);
        } catch (error) {
            console.error('wallet.js: User rejected the connection request:', error);
        }
    }

    function disconnectWallet() {
        console.log("wallet.js: disconnectWallet function called.");
        userAddress = null;
        sessionStorage.removeItem('userAddress');
        console.log('wallet.js: Wallet disconnected.');
        updateUI();
    }

    function handleAccountsChanged(accounts) {
        console.log("wallet.js: handleAccountsChanged triggered.", accounts);
        if (accounts.length === 0) {
            console.log('wallet.js: No accounts found, disconnecting.');
            disconnectWallet();
        } else if (accounts[0] !== userAddress) {
            userAddress = accounts[0];
            sessionStorage.setItem('userAddress', userAddress);
            console.log('wallet.js: Wallet connected:', userAddress);
            updateUI();
        } else {
            console.log("wallet.js: Account changed, but it's the same address.");
        }
    }

    // --- EVENT HANDLERS ---
    function handleConnectClick() {
        console.log("wallet.js: Connect button clicked.");
        if (userAddress) {
            disconnectWallet();
        } else {
            connectWallet();
        }
    }

    // --- INITIALIZATION ---
    function init() {
        console.log("wallet.js: Initializing script.");
        allConnectButtons.forEach((btn, index) => {
            if (btn) {
                console.log(`wallet.js: Attaching click listener to button ${index}.`);
                btn.addEventListener('click', handleConnectClick);
            }
        });

        const storedAddress = sessionStorage.getItem('userAddress');
        if (storedAddress) {
            console.log("wallet.js: Found stored address in sessionStorage:", storedAddress);
            userAddress = storedAddress;
        } else {
            console.log("wallet.js: No address found in sessionStorage.");
        }

        updateUI();

        if (typeof window.ethereum !== 'undefined') {
            console.log("wallet.js: Setting up wallet event listeners (accountsChanged, chainChanged).");
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', (_chainId) => {
                console.log('wallet.js: Network changed. Reloading page.');
                window.location.reload();
            });
        } else {
            console.warn("wallet.js: window.ethereum not found. Wallet event listeners not set up.");
        }
        console.log("wallet.js: Initialization complete.");
    }

    init();
});
