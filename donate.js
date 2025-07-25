document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const donateSUDXBtn = document.getElementById('donateToSUDXBtn');
    const donateUSDCBtn = document.getElementById('donateUSDCBtn');
    const sudxAmountInput = document.getElementById('donationAmount');
    const usdcAmountInput = document.getElementById('usdcAmount');
    const donationStatusElem = document.getElementById('donation-status');
    const fundingStatusElem = document.getElementById('funding-status');

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
        element.textContent = message;
        element.style.display = 'block';
        element.style.color = isError ? '#ff4d4d' : '#00ff00'; // Using more vibrant error/success colors
    }

    // --- Core Transaction Logic ---
    async function handleTransaction(button, amountInput, statusElem, tokenAddress, recipientAddress, tokenName) {
        if (typeof window.ethereum === 'undefined') {
            showStatus(statusElem, 'Wallet not found. Please install MetaMask.', true);
            return;
        }

        const amount = amountInput.value;
        if (!amount || parseFloat(amount) <= 0) {
            showStatus(statusElem, 'Please enter a valid amount.', true);
            return;
        }

        button.disabled = true;
        showStatus(statusElem, 'Connecting to wallet...');

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();

            const tokenContract = new ethers.Contract(tokenAddress, erc20TokenABI, signer);
            const decimals = await tokenContract.decimals();
            const amountInBaseUnits = ethers.utils.parseUnits(amount, decimals);

            showStatus(statusElem, 'Preparing transaction...');
            const tx = await tokenContract.transfer(recipientAddress, amountInBaseUnits);
            
            showStatus(statusElem, `Transaction sent! Waiting for confirmation...`);
            await tx.wait();

            showStatus(statusElem, `Success! Your ${tokenName} has been sent. Thank you!`);
            amountInput.value = '';

        } catch (error) {
            console.error(`${tokenName} transaction failed:`, error);
            let errorMessage = `Failed to send ${tokenName}. See console for details.`;
            if (error.code === 4001) {
                errorMessage = 'Transaction cancelled by user.';
            } else if (error.message?.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for transaction.';
            }
            showStatus(statusElem, errorMessage, true);
        } finally {
            button.disabled = false;
        }
    }

    // --- Event Listeners ---
    if (donateSUDXBtn) {
        donateSUDXBtn.addEventListener('click', () => {
            handleTransaction(donateSUDXBtn, sudxAmountInput, donationStatusElem, sudxTokenAddress, daoTreasuryAddress, 'SUDX');
        });
    }

    if (donateUSDCBtn) {
        donateUSDCBtn.addEventListener('click', () => {
            handleTransaction(donateUSDCBtn, usdcAmountInput, fundingStatusElem, usdcTokenAddress, liquidityFundAddress, 'USDC');
        });
    }
});