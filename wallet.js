document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTS & UI ELEMENTS ---
    const CONNECT_BUTTON_TEXT = 'Connect Wallet';
    const connectWalletBtnDesktop = document.getElementById('connectWalletBtnDesktop');
    const connectWalletBtnMobile = document.getElementById('connectWalletBtnMobile');
    const allConnectButtons = [connectWalletBtnDesktop, connectWalletBtnMobile].filter(btn => btn);

    // --- STATE ---
    let userAddress = null;

    // --- UI UPDATE LOGIC ---
    function updateUI() {
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
    }

    // --- WALLET LOGIC ---
    async function connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            alert('Please install a browser wallet like MetaMask to connect.');
            return;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            handleAccountsChanged(accounts);
        } catch (error) {
            console.error('User rejected the connection request:', error);
            // No need for an alert here, as the user actively cancelled the request.
        }
    }

    function disconnectWallet() {
        userAddress = null;
        sessionStorage.removeItem('userAddress');
        console.log('Wallet disconnected.');
        updateUI();
    }

    function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            // MetaMask is locked or the user has disconnected all accounts
            console.log('Please connect to MetaMask.');
            disconnectWallet();
        } else if (accounts[0] !== userAddress) {
            userAddress = accounts[0];
            sessionStorage.setItem('userAddress', userAddress);
            console.log('Wallet connected:', userAddress);
            updateUI();
        }
    }

    // --- EVENT HANDLERS ---
    function handleConnectClick() {
        if (userAddress) {
            disconnectWallet();
        } else {
            connectWallet();
        }
    }

    // --- INITIALIZATION ---
    function init() {
        allConnectButtons.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', handleConnectClick);
            }
        });

        // Check for persisted address
        const storedAddress = sessionStorage.getItem('userAddress');
        if (storedAddress) {
            userAddress = storedAddress;
        }

        updateUI();

        // Set up wallet event listeners
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', handleAccountsChanged);

            window.ethereum.on('chainChanged', (_chainId) => {
                // Reload the page to ensure the correct network context
                console.log('Network changed. Reloading page.');
                window.location.reload();
            });
        }
    }

    init();
});
