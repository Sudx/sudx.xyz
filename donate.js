document.addEventListener('DOMContentLoaded', () => {
    const donateButton = document.getElementById('donateToSUDXBtn');
    const amountInput = document.getElementById('donationAmount');
    const statusElement = document.getElementById('donation-status');

    const sudxTokenAddress = '0xc56F971934961267586e8283C06018167F0D0E4C';
    const daoTreasuryAddress = '0xA5dEa0A7E9c47d52e735c1d4129Cc02a54966E21';
    
    // A minimal ABI for an ERC20 transfer function
    const sudxTokenABI = [
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transfer",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [
                {
                    "name": "",
                    "type": "uint8"
                }
            ],
            "type": "function"
        }
    ];

    function showStatus(message, isError = false) {
        statusElement.textContent = message;
        statusElement.style.display = 'block';
        statusElement.style.color = isError ? 'var(--secondary-glow-color)' : 'var(--primary-glow-color)';
    }

    async function handleDonation() {
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
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();

            // Create a contract instance
            const sudxContract = new ethers.Contract(sudxTokenAddress, sudxTokenABI, signer);

            // Get token decimals (SUDX uses 18)
            const decimals = await sudxContract.decimals();
            const amountInWei = ethers.utils.parseUnits(amount, decimals);

            showStatus('Preparing transaction...');

            // Send the transaction
            const tx = await sudxContract.transfer(daoTreasuryAddress, amountInWei);
            
            showStatus(`Transaction sent! Waiting for confirmation... Hash: ${tx.hash.substring(0,10)}...`);

            // Wait for the transaction to be mined
            await tx.wait();

            showStatus('Donation successful! Thank you for your support.');
            amountInput.value = ''; // Clear input field

        } catch (error) {
            console.error('Donation failed:', error);
            let errorMessage = 'Donation failed. Please check the console for details.';
            if (error.code === 4001) { // User rejected transaction
                errorMessage = 'Transaction cancelled by user.';
            } else if (error.data?.message) {
                errorMessage = `Error: ${error.data.message}`;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showStatus(errorMessage, true);
        }
    }

    if (donateButton) {
        donateButton.addEventListener('click', handleDonation);
    }
});
