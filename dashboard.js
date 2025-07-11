document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURATION ---
    const config = {
        SUDX_TOKEN_ADDRESS: '0xc56F971934961267586e8283C06018167F0D0E4C',
        POLYGONSCAN_API_KEY: 'GF6AW9NRDHK52444KQ987DI8ZGPJPWJ1JS',
        RPC_URL: 'https://polygon-rpc.com/',
        WEBSOCKET_URL: 'wss://polygon-mainnet.g.alchemy.com/v2/mGB_x3972_p1au41i8s1AdG91T5nJvjF', // Using a public Alchemy WS
        // Add your LP addresses here as they are created
        MONITORED_POOLS: [
            // Example: { name: 'SUDX/USDC on QuickSwap', address: '0x...', dex: 'QuickSwap' }
        ],
        // Common DEX Routers on Polygon
        MONITORED_DEXS: {
            'QuickSwap': '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
            'SushiSwap': '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
        }
    };

    // --- DOM Elements ---
    const priceElement = document.getElementById('sudx-price');
    const liquidityElement = document.getElementById('total-liquidity');
    const marketCapElement = document.getElementById('market-cap');
    const holdersElement = document.getElementById('total-holders');
    const transactionFeed = document.getElementById('transaction-feed');
    const connectionStatus = document.getElementById('connection-status');

    // --- ABIs ---
    const ERC20_ABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address account) view returns (uint256)",
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];

    // --- Helper Functions ---
    const formatAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;
    const formatNumber = (num, options = {}) => new Intl.NumberFormat('en-US', options).format(num);

    // --- Main Logic ---

    // 1. Fetch Total Holders
    async function fetchHolders() {
        try {
            const url = `https://api.polygonscan.com/api?module=token&action=tokenholderlist&contractaddress=${config.SUDX_TOKEN_ADDRESS}&apikey=${config.POLYGONSCAN_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === "1") {
                // PolygonScan API for token holder list is sometimes just an estimate.
                // A more accurate way is to get holder count, but that's a pro feature.
                // For now, we can count the returned holders, but it might be capped at 1000.
                // A better proxy is to use the 'tokeninfo' action if available or just show the count from the list.
                const holderCountUrl = `https://api.polygonscan.com/api?module=token&action=tokeninfo&contractaddress=${config.SUDX_TOKEN_ADDRESS}&apikey=${config.POLYGONSCAN_API_KEY}`;
                const countResponse = await fetch(holderCountUrl);
                const countData = await countResponse.json();
                
                // The tokeninfo endpoint is not standard. Let's parse the holder list page as a fallback.
                // This is complex. The most reliable free method is counting the list.
                if (data.result && data.result.length > 0) {
                    holdersElement.textContent = formatNumber(data.result.length);
                     if (data.result.length >= 1000) {
                        holdersElement.textContent += "+"; // Indicate the list is likely capped
                    }
                } else {
                     holdersElement.textContent = 'N/A';
                }
            } else {
                holdersElement.textContent = 'N/A';
                console.error("Failed to fetch holders:", data.message);
            }
        } catch (error) {
            holdersElement.textContent = 'Error';
            console.error("Error fetching holders:", error);
        }
    }


    // 2. Setup Live Transaction Feed
    function setupWebSocketListener() {
        try {
            const provider = new ethers.providers.WebSocketProvider(config.WEBSOCKET_URL);
            const sudxContract = new ethers.Contract(config.SUDX_TOKEN_ADDRESS, ERC20_ABI, provider);

            provider._websocket.onopen = () => {
                connectionStatus.className = 'status-connected';
                connectionStatus.querySelector('p').textContent = 'Live Feed Connected';
            };

            provider._websocket.onerror = (err) => {
                console.error("WebSocket Error:", err);
                connectionStatus.className = 'status-disconnected';
                connectionStatus.querySelector('p').textContent = 'Feed Disconnected';
            };
            
            provider._websocket.onclose = () => {
                connectionStatus.className = 'status-disconnected';
                connectionStatus.querySelector('p').textContent = 'Feed Disconnected';
                // Optional: try to reconnect
            };

            sudxContract.on("Transfer", (from, to, value, event) => {
                const decimals = 18; // Assuming 18 decimals for SUDX
                const formattedValue = ethers.utils.formatUnits(value, decimals);

                const item = document.createElement('div');
                item.className = 'feed-item';
                item.innerHTML = `
                    <div class="col-from address" title="${from}">${formatAddress(from)}</div>
                    <div class="col-to address" title="${to}">${formatAddress(to)}</div>
                    <div class="col-value value">${formatNumber(formattedValue, { maximumFractionDigits: 2 })} SUDX</div>
                `;

                transactionFeed.prepend(item);

                // Keep the list from getting too long
                if (transactionFeed.children.length > 50) {
                    transactionFeed.lastChild.remove();
                }
            });

        } catch (error) {
            console.error("Could not set up WebSocket:", error);
            connectionStatus.className = 'status-disconnected';
            connectionStatus.querySelector('p').textContent = 'Connection Failed';
        }
    }

    // --- Initial Load ---
    fetchHolders();
    setupWebSocketListener();
    // Price/liquidity logic will be called here once a pool is configured.
});
