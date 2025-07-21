document.addEventListener('DOMContentLoaded', () => {
    const donateUSDCBtn = document.getElementById('donateUSDCBtn');
    const amountInput = document.getElementById('usdcAmount');
    const statusElement = document.getElementById('funding-status');

    // Polygon Mainnet Addresses
    const usdcTokenAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
    const liquidityFundAddress = '0xffC666cD50a6250CDc83E44C5f6e57Ec6f6074b4';

    // Minimal ABI for ERC20 transfer and decimals functions
    const erc20TokenABI = [
        {
            "constant": false,
            "inputs": [
                { "name": "_to", "type": "address" },
                { "name": "_value", "type": "uint256" }
            ],
            "name": "transfer",
            "outputs": [{ "name": "", "type": "bool" }],
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [{ "name": "", "type": "uint8" }],
            "type": "function"
        }
    ];

    function showStatus(message, isError = false) {
        statusElement.textContent = message;
        statusElement.style.display = 'block';
        statusElement.style.color = isError ? 'var(--secondary-glow-color)' : 'var(--primary-glow-color)';
    }

    async function handleFunding() {
        if (typeof window.ethereum === 'undefined') {
            showStatus('Wallet not found. Please install MetaMask.', true);
            return;
        }

        const amount = amountInput.value;
        if (!amount || parseFloat(amount) <= 0) {
            showStatus('Please enter a valid amount.', true);
            return;
        }

        try {
            // Use the provider from the wallet
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []); // Ensure wallet is connected
            const signer = provider.getSigner();
            
            // Create a contract instance for USDC
            const usdcContract = new ethers.Contract(usdcTokenAddress, erc20TokenABI, signer);

            // USDC on Polygon has 6 decimals
            const decimals = await usdcContract.decimals();
            const amountInBaseUnits = ethers.utils.parseUnits(amount, decimals);

            showStatus('Preparing transaction...');

            // Send the transaction
            const tx = await usdcContract.transfer(liquidityFundAddress, amountInBaseUnits);
            
            showStatus(`Transaction sent! Waiting for confirmation... Hash: ${tx.hash.substring(0,10)}...`);

            // Wait for the transaction to be mined
            await tx.wait();

            showStatus('Funding successful! Thank you for your support.');
            amountInput.value = ''; // Clear input field

        } catch (error) {
            console.error('Funding failed:', error);
            let errorMessage = 'Funding failed. Please check the console for details.';

            if (error.code === 'CALL_EXCEPTION' && error.method === 'decimals()') {
                errorMessage = 'Could not read token data. Please ensure you are on the Polygon Mainnet and the token has been added to your wallet.';
            } else if (error.code === 4001) { // User rejected transaction
                errorMessage = 'Transaction cancelled by user.';
            } else if (error.message?.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for transaction.';
            } else if (error.data?.message) {
                errorMessage = `Error: ${error.data.message}`;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showStatus(errorMessage, true);
        }
    }

    if (donateUSDCBtn) {
        donateUSDCBtn.addEventListener('click', handleFunding);
    }
});
