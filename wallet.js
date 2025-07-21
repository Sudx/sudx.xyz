document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const sudxTokenAddress = '0xc56F971934961267586e8283C06018167F0D0E4C';
    const sudxDaoTreasuryAddress = '0xA5dEa0A7E9c47d52e735c1d4129Cc02a54966E21';
    const usdcTokenAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
    const liquidityFundAddress = '0xffC666cD50a6250CDc83E44C5f6e57Ec6f6074b4';

    const tokenABI = [
        "function transfer(address to, uint256 amount)",
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)"
    ];

    // --- STATE ---
    let provider;
    let signer;
    let userAddress;

    // --- UI ELEMENTS ---
    const connectWalletBtnDesktop = document.getElementById('connectWalletBtnDesktop');
    const connectWalletBtnMobile = document.getElementById('connectWalletBtnMobile');
    const walletMessage = document.getElementById('wallet-message');
    const donateToSUDXBtn = document.getElementById('donateToSUDXBtn');
    const donateUSDCBtn = document.getElementById('donateUSDCBtn');

    // --- UI UPDATE LOGIC ---

    function updateUI() {
        const buttons = [connectWalletBtnDesktop, connectWalletBtnMobile].filter(btn => btn); // Filter out nulls

        if (userAddress) {
            // Connected State
            const shortAddress = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
            buttons.forEach(btn => {
                btn.textContent = shortAddress;
                btn.disabled = true;
            });

            if (walletMessage) {
                walletMessage.style.display = 'none';
            }
            if (donateToSUDXBtn) {
                donateToSUDXBtn.disabled = false;
            }
            if (donateUSDCBtn) {
                donateUSDCBtn.disabled = false;
            }
        } else {
            // Disconnected State
            buttons.forEach(btn => {
                btn.textContent = 'Connect Wallet';
                btn.disabled = false;
            });

            if (walletMessage) {
                walletMessage.style.display = 'block';
            }
            if (donateToSUDXBtn) {
                donateToSUDXBtn.disabled = true;
            }
            if (donateUSDCBtn) {
                donateUSDCBtn.disabled = true;
            }
        }
    }

    // --- WALLET LOGIC ---

    async function connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            alert('MetaMask is not installed. Please install it to use this feature.');
            return;
        }
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            handleAccountsChanged(accounts);
            window.ethereum.on('accountsChanged', handleAccountsChanged);
        } catch (error) {
            console.error('User rejected connection:', error);
            alert('You must connect your wallet to proceed.');
        }
    }
    
    async function handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            userAddress = null;
            signer = null;
            console.log('Wallet disconnected.');
        } else {
            userAddress = accounts[0];
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            console.log('Wallet connected:', userAddress);
        }
        updateUI();
    }

    // --- DONATION LOGIC ---

    async function handleDonation(tokenAddress, tokenName, tokenABI, toAddress) {
        if (!signer) {
            alert('Please connect your wallet to donate.');
            return;
        }

        const amountString = prompt(`Enter the amount of ${tokenName} you wish to donate:`);
        if (!amountString || isNaN(amountString) || parseFloat(amountString) <= 0) {
            alert('Please enter a valid positive number.');
            return;
        }

        try {
            const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
            const decimals = await tokenContract.decimals();
            const amount = ethers.utils.parseUnits(amountString, decimals);

            const balance = await tokenContract.balanceOf(userAddress);
            if (balance.lt(amount)) {
                alert(`Insufficient ${tokenName} balance.`);
                return;
            }

            const tx = await tokenContract.transfer(toAddress, amount);
            alert('Transaction initiated. Please confirm in your wallet and wait for confirmation.');
            await tx.wait();
            alert(`Donation successful! Thank you for your support.`);
            console.log(`Transaction successful with hash: ${tx.hash}`);
        } catch (error) {
            console.error(`${tokenName} donation failed:`, error);
            alert(`${tokenName} donation failed. Error: ${error.message || 'See console for details.'}`);
        }
    }

    // --- INITIALIZATION ---
    
    const allConnectButtons = [connectWalletBtnDesktop, connectWalletBtnMobile].filter(btn => btn);
    allConnectButtons.forEach(btn => btn.addEventListener('click', connectWallet));

    if (donateToSUDXBtn) {
        donateToSUDXBtn.addEventListener('click', () => handleDonation(sudxTokenAddress, 'SUDX', tokenABI, sudxDaoTreasuryAddress));
    }
    if (donateUSDCBtn) {
        donateUSDCBtn.addEventListener('click', () => handleDonation(usdcTokenAddress, 'USDC', tokenABI, liquidityFundAddress));
    }

    // Set initial UI state
    updateUI();
});
