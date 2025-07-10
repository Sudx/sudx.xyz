document.addEventListener('DOMContentLoaded', async () => {
    // --- Configuration ---
    const RPC_URL = 'https://polygon-rpc.com/'; // Polygon Mainnet RPC
    const SUDX_TOKEN_ADDRESS = '0xc56F971934961267586e8283C06018167F0D0E4C';
    // This will be the SUDX/USDC pair address once created on a DEX
    const PAIR_ADDRESS = '0x...'; // IMPORTANT: Replace with the actual SUDX/USDC pair address
    const USDT_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'; // Official Polygon PoS USDC Address

    // --- ABIs (Interfaces) ---
    const ERC20_ABI = [
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)"
    ];
    const PAIR_ABI = [
        "function getReserves() view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)",
        "function token0() view returns (address)",
        "function token1() view returns (address)"
    ];

    // --- Ethers.js Provider ---
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

    // --- DOM Elements ---
    const priceElement = document.getElementById('sudx-price');
    const liquidityElement = document.getElementById('total-liquidity');
    const holdersElement = document.getElementById('total-holders');
    const volumeElement = document.getElementById('volume-24h');

    // --- Functions ---

    /**
     * Formats large numbers for display
     */
    function formatNumber(num) {
        if (num === null || num === undefined) return 'N/A';
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }

    /**
     * Fetches and displays the SUDX price
     */
    async function fetchPriceAndLiquidity() {
        try {
            if (PAIR_ADDRESS === '0x...') {
                priceElement.textContent = 'N/A';
                liquidityElement.textContent = 'N/A';
                console.warn("Pair address is not set.");
                return;
            }

            const pairContract = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, provider);
            const sudxContract = new ethers.Contract(SUDX_TOKEN_ADDRESS, ERC20_ABI, provider);
            const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

            const [reserves, token0Address] = await Promise.all([
                pairContract.getReserves(),
                pairContract.token0()
            ]);
            
            const sudxDecimals = await sudxContract.decimals();
            const usdtDecimals = await usdtContract.decimals();

            let sudxReserve, usdtReserve;

            // Check which token is token0 and which is token1
            if (ethers.utils.getAddress(token0Address) === ethers.utils.getAddress(SUDX_TOKEN_ADDRESS)) {
                sudxReserve = reserves._reserve0;
                usdtReserve = reserves._reserve1;
            } else {
                sudxReserve = reserves._reserve1;
                usdtReserve = reserves._reserve0;
            }

            if (sudxReserve.isZero() || usdtReserve.isZero()) {
                 priceElement.textContent = '$0.00';
                 liquidityElement.textContent = '$0.00';
                 return;
            }

            const formattedSudxReserve = ethers.utils.formatUnits(sudxReserve, sudxDecimals);
            const formattedUsdtReserve = ethers.utils.formatUnits(usdtReserve, usdtDecimals);

            // Price = USDT reserve / SUDX reserve
            const price = formattedUsdtReserve / formattedSudxReserve;
            priceElement.textContent = `$${price.toFixed(6)}`;

            // Total Liquidity = 2 * USDT reserve (since it's a 50/50 pool)
            const totalLiquidity = formattedUsdtReserve * 2;
            liquidityElement.textContent = `$${formatNumber(totalLiquidity)}`;

        } catch (error) {
            console.error("Failed to fetch price and liquidity:", error);
            priceElement.textContent = 'Error';
            liquidityElement.textContent = 'Error';
        }
    }

    /**
     * Fetches total holders (this is a placeholder as it requires an external API)
     */
    async function fetchTotalHolders() {
        // NOTE: Fetching total holders directly from a contract is not possible.
        // This usually requires an indexed service like PolygonScan's API, Covalent, etc.
        // For now, we will display "N/A" (Not Available).
        holdersElement.textContent = 'N/A';
    }
    
    /**
     * Fetches 24h volume (this is a placeholder as it requires an external API)
     */
    async function fetch24hVolume() {
        // NOTE: Fetching trading volume requires a DEX-specific or an analytics API.
        // This is a complex task beyond what a simple RPC call can do.
        // For now, we will display "N/A" (Not Available).
        volumeElement.textContent = 'N/A';
    }


    // --- Initial Load ---
    fetchPriceAndLiquidity();
    fetchTotalHolders();
    fetch24hVolume();
});
