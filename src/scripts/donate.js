console.log("donate.js: Script loaded");

document.addEventListener('DOMContentLoaded', () => {
    console.log("donate.js: DOMContentLoaded event fired.");

    // --- DOM Elements ---
    const donateSUDXBtn = document.getElementById('donateToSUDXBtn');
    const donateUSDCBtn = document.getElementById('donateUSDCBtn');
    const sudxAmountInput = document.getElementById('donationAmount');
    const usdcAmountInput = document.getElementById('usdcAmount');
    const donationStatusElem = document.getElementById('donation-status');
    const fundingStatusElem = document.getElementById('funding-status');
    console.log("donate.js: All DOM elements selected.");

    // --- Contract & Wallet Addresses ---
    const sudxTokenAddress = '0xc56F971934961267586e8283C06018167F0D0E4C';
    const usdcTokenAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
    const daoTreasuryAddress = '0xA5dEa0A7E9c47d52e735c1d4129Cc02a54966E21';
    const liquidityFundAddress = '0xffC666cD50a6250CDc83E44C5f6e57Ec6f6074b4';

    // --- Minimal ERC20 ABI ---
    const erc20TokenABI = [
        { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" },
        { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "type": "function" }
    ];

    // --- Helper Functions ---
    function showStatus(element, message, isError = false) {
        console.log(`donate.js: Displaying status in ${element.id}: "${message}" (Error: ${isError})`);
        element.textContent = message;
        element.style.display = 'block';
        element.style.color = isError ? '#ff4d4d' : '#00ff00';
    }

    // --- Core Transaction Logic ---
    async function handleTransaction(button, amountInput, statusElem, tokenAddress, recipientAddress, tokenName) {
        console.log(`donate.js: handleTransaction called for ${tokenName}.`);
        
        if (typeof window.ethereum === 'undefined') {
            showStatus(statusElem, 'Wallet not found. Please install MetaMask.', true);
            console.error("donate.js: window.ethereum not found.");
            return;
        }

        const amount = amountInput.value;
        console.log(`donate.js: Amount entered: ${amount}`);
        if (!amount || parseFloat(amount) <= 0) {
            showStatus(statusElem, 'Please enter a valid amount.', true);
            return;
        }

        button.disabled = true;
        showStatus(statusElem, 'Connecting to wallet...');

        try {
            console.log("donate.js: Creating Web3Provider and requesting accounts.");
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();
            console.log("donate.js: Wallet connected. Signer address:", userAddress);

            console.log(`donate.js: Creating contract instance for ${tokenName} at ${tokenAddress}`);
            const tokenContract = new ethers.Contract(tokenAddress, erc20TokenABI, signer);
            const decimals = await tokenContract.decimals();
            const amountInBaseUnits = ethers.utils.parseUnits(amount, decimals);
            console.log(`donate.js: Decimals: ${decimals}, Amount in base units: ${amountInBaseUnits.toString()}`);

            showStatus(statusElem, 'Preparing transaction...');
            console.log(`donate.js: Calling transfer() to ${recipientAddress} with amount ${amountInBaseUnits.toString()}`);
            const tx = await tokenContract.transfer(recipientAddress, amountInBaseUnits);
            console.log("donate.js: Transaction sent:", tx);
            
            showStatus(statusElem, `Transaction sent! Waiting for confirmation... (Tx: ${tx.hash.substring(0, 10)}...)`);
            await tx.wait();
            console.log("donate.js: Transaction confirmed:", tx.hash);

            showStatus(statusElem, `Success! Your ${tokenName} has been sent. Thank you!`);
            amountInput.value = '';

        } catch (error) {
            console.error(`donate.js: ${tokenName} transaction failed:`, error);
            let errorMessage = `Failed to send ${tokenName}. See console for details.`;
            if (error.code === 4001) {
                errorMessage = 'Transaction cancelled by user.';
            } else if (error.message?.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for transaction.';
            }
            showStatus(statusElem, errorMessage, true);
        } finally {
            console.log("donate.js: Re-enabling button.");
            button.disabled = false;
        }
    }

    // --- Event Listeners ---
    if (donateSUDXBtn) {
        console.log("donate.js: Attaching click listener to SUDX donate button.");
        donateSUDXBtn.addEventListener('click', () => {
            handleTransaction(donateSUDXBtn, sudxAmountInput, donationStatusElem, sudxTokenAddress, daoTreasuryAddress, 'SUDX');
        });
    } else {
        console.error("donate.js: SUDX donate button not found.");
    }

    if (donateUSDCBtn) {
        console.log("donate.js: Attaching click listener to USDC donate button.");
        donateUSDCBtn.addEventListener('click', () => {
            handleTransaction(donateUSDCBtn, usdcAmountInput, fundingStatusElem, usdcTokenAddress, liquidityFundAddress, 'USDC');
        });
    } else {
        console.error("donate.js: USDC donate button not found.");
    }

    console.log("donate.js: Initialization complete.");
});
