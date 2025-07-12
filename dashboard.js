import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights();
// Waits for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    // Address of the SUDX token on the Polygon network.
    // This is the only data we need to find all its pairs.
    const SUDX_TOKEN_ADDRESS = '0xc56F971934961267586e8283C06018167F0D0E4C'; // Example address, replace with the real one
    const CHAIN_NAME = 'polygon'; // or 'bsc', 'ethereum', etc.

    // --- DOM ELEMENTS ---
    const marketPriceElem = document.getElementById('market-price');
    const marketLiquidityElem = document.getElementById('market-liquidity');
    const marketVolumeElem = document.getElementById('market-volume');
    const marketCapElem = document.getElementById('market-cap');
    const poolsTableBody = document.getElementById('pools-table-body');
    const swapsTableBody = document.getElementById('swaps-table-body');

    // --- HELPER FUNCTIONS ---

    /**
     * Formats a number as a USD currency string.
     * @param {number} value The number to format.
     * @returns {string} The formatted string (e.g., $1,234.56).
     */
    const formatCurrency = (value) => {
        if (typeof value !== 'number') return '$0.00';
        return value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };
    
    /**
     * Formats a large number with abbreviations (K, M, B).
     * @param {number} value The number to format.
     * @returns {string} The formatted string (e.g., $1.23M).
     */
    const formatCurrencyShort = (value) => {
        if (typeof value !== 'number') return '$0';
        if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
        if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
        return formatCurrency(value);
    };

    /**
     * Formats the price, showing more decimal places for small values.
     * @param {number} value The price to format.
     * @returns {string} The formatted price string.
     */
    const formatPrice = (value) => {
        if (typeof value !== 'number') return '$0.00';
        if (value < 0.01) {
             return value.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 6,
            });
        }
        return formatCurrency(value);
    };

    // --- MAIN LOGIC ---

    /**
     * Fetches data from the DEX Screener API and updates the dashboard.
     */
    async function fetchMarketData() {
        const apiUrl = `https://api.dexscreener.com/latest/dex/tokens/${SUDX_TOKEN_ADDRESS}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            const data = await response.json();
            
            if (!data.pairs || data.pairs.length === 0) {
                console.warn('No pairs found for the SUDX token.');
                displayNoData();
                return;
            }

            // Filter out pairs that may not have complete data
            const validPairs = data.pairs.filter(p => p.liquidity && p.priceUsd);

            // Process and display the data
            processAndDisplayOverview(validPairs);
            displayPoolsTable(validPairs);
            fetchAndDisplaySwaps(validPairs);

        } catch (error) {
            console.error("Failed to fetch market data:", error);
            displayError();
        }
    }

    /**
     * Calculates and displays the market overview (aggregated).
     * @param {Array} pairs The list of pairs from the API.
     */
    function processAndDisplayOverview(pairs) {
        const totalLiquidity = pairs.reduce((sum, pair) => sum + pair.liquidity.usd, 0);
        const totalVolume24h = pairs.reduce((sum, pair) => sum + pair.volume.h24, 0);
        
        // Use the FDV (Fully Diluted Valuation) of the most liquid pair as an approximation of the Market Cap
        const primaryPair = pairs.sort((a, b) => b.liquidity.usd - a.liquidity.usd)[0];
        const marketCap = primaryPair.fdv; 
        const price = parseFloat(primaryPair.priceUsd);

        marketPriceElem.textContent = formatPrice(price);
        marketLiquidityElem.textContent = formatCurrencyShort(totalLiquidity);
        marketVolumeElem.textContent = formatCurrencyShort(totalVolume24h);
        marketCapElem.textContent = formatCurrencyShort(marketCap);
    }

    /**
     * Displays the table of active liquidity pools.
     * @param {Array} pairs The list of pairs from the API.
     */
    function displayPoolsTable(pairs) {
        poolsTableBody.innerHTML = ''; // Clear the table

        if (pairs.length === 0) {
            poolsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No active pools found.</td></tr>';
            return;
        }

        // Sort by liquidity (highest first)
        const sortedPairs = pairs.sort((a, b) => b.liquidity.usd - a.liquidity.usd);

        sortedPairs.forEach(pair => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <a href="${pair.url}" target="_blank" rel="noopener noreferrer">
                        ${pair.baseToken.symbol}/${pair.quoteToken.symbol}
                    </a>
                </td>
                <td>${pair.dexId}</td>
                <td>${formatCurrencyShort(pair.liquidity.usd)}</td>
                <td>${formatCurrencyShort(pair.volume.h24)}</td>
                <td>${formatPrice(parseFloat(pair.priceUsd))}</td>
            `;
            poolsTableBody.appendChild(row);
        });
    }
    
    /**
     * Fetches and displays the most recent swaps from the main pools.
     * @param {Array} pairs The list of pairs from the API.
     */
    async function fetchAndDisplaySwaps(pairs) {
        swapsTableBody.innerHTML = ''; // Clear the table
        
        // Get the 3 most liquid pairs to fetch swaps from
        const topPairs = pairs.slice(0, 3);
        let allSwaps = [];

        for (const pair of topPairs) {
            try {
                const swapsUrl = `https://api.dexscreener.com/latest/dex/pairs/${pair.chainId}/${pair.pairAddress}`;
                const response = await fetch(swapsUrl);
                const data = await response.json();
                if (data.pair && data.pair.txns) {
                    // Add pair information to each transaction
                    const swaps = data.pair.txns.map(txn => ({...txn, pair: data.pair }));
                    allSwaps.push(...swaps);
                }
            } catch (error) {
                console.warn(`Could not fetch swaps for pair ${pair.pairAddress}:`, error);
            }
        }

        if (allSwaps.length === 0) {
            swapsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No recent swaps found.</td></tr>';
            return;
        }

        // Sort all swaps by date (most recent first) and get the 20 most recent
        const recentSwaps = allSwaps.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

        recentSwaps.forEach(swap => {
            const isBuy = swap.type === 'buy';
            const tokenSymbol = swap.pair.baseToken.symbol;
            const amountToken = parseFloat(swap.amount0 > swap.amount1 ? swap.amount0 : swap.amount1).toFixed(2);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="${isBuy ? 'buy' : 'sell'}">${isBuy ? 'BUY' : 'SELL'}</td>
                <td>${formatCurrency(swap.amountUsd)}</td>
                <td>${amountToken} ${tokenSymbol}</td>
                <td>${swap.pair.dexId}</td>
                <td>${new Date(swap.timestamp).toLocaleTimeString()}</td>
            `;
            swapsTableBody.appendChild(row);
        });
    }

    /**
     * Displays an error message on the dashboard.
     */
    function displayError() {
        const errorMsg = "Error loading data";
        marketPriceElem.textContent = errorMsg;
        marketLiquidityElem.textContent = errorMsg;
        marketVolumeElem.textContent = errorMsg;
        marketCapElem.textContent = errorMsg;
        poolsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">${errorMsg}. Try reloading the page.</td></tr>`;
        swapsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">${errorMsg}.</td></tr>`;
    }
    
    /**
     * Displays a message when no data is found.
     */
    function displayNoData() {
        const noDataMsg = "N/A";
        marketPriceElem.textContent = noDataMsg;
        marketLiquidityElem.textContent = noDataMsg;
        marketVolumeElem.textContent = noDataMsg;
        marketCapElem.textContent = noDataMsg;
        poolsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No liquidity pools found for this token.</td></tr>`;
        swapsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No swaps found.</td></tr>`;
    }


    // --- INITIALIZATION ---
    fetchMarketData();
    
    // Optional: Refresh data every 60 seconds
    setInterval(fetchMarketData, 60000);
});