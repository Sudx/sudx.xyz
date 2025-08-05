console.log("dashboard.js: Script loaded");

document.addEventListener('DOMContentLoaded', () => {
    console.log("dashboard.js: DOMContentLoaded event fired.");

    // --- CONFIGURATION ---
    const SUDX_TOKEN_ADDRESS = '0xc56F971934961267586e8283C06018167F0D0E4C';
    const CHAIN_NAME = 'polygon';
    console.log(`dashboard.js: Configured for token ${SUDX_TOKEN_ADDRESS} on chain ${CHAIN_NAME}.`);

    // --- DOM ELEMENTS ---
    const marketPriceElem = document.getElementById('market-price');
    const marketLiquidityElem = document.getElementById('market-liquidity');
    const marketVolumeElem = document.getElementById('market-volume');
    const marketCapElem = document.getElementById('market-cap');
    const poolsTableBody = document.getElementById('pools-table-body');
    const swapsTableBody = document.getElementById('swaps-table-body');
    console.log("dashboard.js: All DOM elements selected.");

    // --- HELPER FUNCTIONS ---
    const formatCurrency = (value) => {
        if (typeof value !== 'number') return '$0.00';
        return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    const formatCurrencyShort = (value) => {
        if (typeof value !== 'number') return '$0';
        if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
        if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
        return formatCurrency(value);
    };
    const formatPrice = (value) => {
        if (typeof value !== 'number') return '$0.00';
        if (value < 0.01) {
             return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 6 });
        }
        return formatCurrency(value);
    };

    // --- MAIN LOGIC ---
    async function fetchMarketData() {
        const apiUrl = `https://api.dexscreener.com/latest/dex/tokens/${SUDX_TOKEN_ADDRESS}`;
        console.log(`dashboard.js: Fetching market data from: ${apiUrl}`);

        try {
            const response = await fetch(apiUrl);
            console.log(`dashboard.js: API response status: ${response.status}`);
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            const data = await response.json();
            console.log("dashboard.js: Successfully fetched and parsed API data.", data);
            
            if (!data.pairs || data.pairs.length === 0) {
                console.warn('dashboard.js: No pairs found for the SUDX token.');
                displayNoData();
                return;
            }

            const validPairs = data.pairs.filter(p => p.liquidity && p.priceUsd);
            console.log(`dashboard.js: Found ${data.pairs.length} pairs, ${validPairs.length} are valid.`);

            processAndDisplayOverview(validPairs);
            displayPoolsTable(validPairs);
            fetchAndDisplaySwaps(validPairs);

        } catch (error) {
            console.error("dashboard.js: Failed to fetch market data:", error);
            displayError();
        }
    }

    function processAndDisplayOverview(pairs) {
        console.log("dashboard.js: Processing and displaying overview.");
        const totalLiquidity = pairs.reduce((sum, pair) => sum + pair.liquidity.usd, 0);
        const totalVolume24h = pairs.reduce((sum, pair) => sum + pair.volume.h24, 0);
        
        const primaryPair = pairs.sort((a, b) => b.liquidity.usd - a.liquidity.usd)[0];
        const marketCap = primaryPair.fdv; 
        const price = parseFloat(primaryPair.priceUsd);
        console.log(`dashboard.js: Overview calculated - Price: ${price}, Liquidity: ${totalLiquidity}, Volume: ${totalVolume24h}, MarketCap: ${marketCap}`);

        marketPriceElem.textContent = formatPrice(price);
        marketLiquidityElem.textContent = formatCurrencyShort(totalLiquidity);
        marketVolumeElem.textContent = formatCurrencyShort(totalVolume24h);
        marketCapElem.textContent = formatCurrencyShort(marketCap);
    }

    function displayPoolsTable(pairs) {
        console.log("dashboard.js: Displaying pools table.");
        poolsTableBody.innerHTML = '';

        if (pairs.length === 0) {
            console.log("dashboard.js: No active pools to display.");
            const row = poolsTableBody.insertRow();
            row.innerHTML = `<td colspan="5" style="text-align: center;">No active pools found.</td>`;
            return;
        }

        const sortedPairs = pairs.sort((a, b) => b.liquidity.usd - a.liquidity.usd);
        console.log(`dashboard.js: Displaying ${sortedPairs.length} sorted pools.`);

        sortedPairs.forEach(pair => {
            const row = poolsTableBody.insertRow();
            row.innerHTML = `
                <td><a href="${pair.url}" target="_blank" rel="noopener noreferrer" class="table-link">${pair.baseToken.symbol}/${pair.quoteToken.symbol}</a></td>
                <td>${pair.dexId}</td>
                <td>${formatCurrencyShort(pair.liquidity.usd)}</td>
                <td>${formatCurrencyShort(pair.volume.h24)}</td>
                <td>${formatPrice(parseFloat(pair.priceUsd))}</td>
            `;
        });
    }
    
    async function fetchAndDisplaySwaps(pairs) {
        console.log("dashboard.js: Fetching and displaying swaps.");
        swapsTableBody.innerHTML = '';
        
        const topPairs = pairs.slice(0, 3);
        let allSwaps = [];
        console.log(`dashboard.js: Fetching swaps for top ${topPairs.length} pairs.`);

        for (const pair of topPairs) {
            try {
                const swapsUrl = `https://api.dexscreener.com/latest/dex/pairs/${pair.chainId}/${pair.pairAddress}`;
                console.log(`dashboard.js: Fetching swaps from ${swapsUrl}`);
                const response = await fetch(swapsUrl);
                const data = await response.json();
                if (data.pair && data.pair.txns) {
                    const swaps = data.pair.txns.map(txn => ({...txn, pair: data.pair }));
                    allSwaps.push(...swaps);
                    console.log(`dashboard.js: Found ${swaps.length} swaps for pair ${pair.pairAddress}.`);
                }
            } catch (error) {
                console.warn(`dashboard.js: Could not fetch swaps for pair ${pair.pairAddress}:`, error);
            }
        }

        if (allSwaps.length === 0) {
            console.log("dashboard.js: No recent swaps found to display.");
            swapsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No recent swaps found.</td></tr>`;
            return;
        }

        const recentSwaps = allSwaps.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
        console.log(`dashboard.js: Displaying ${recentSwaps.length} most recent swaps.`);

        recentSwaps.forEach(swap => {
            const isBuy = swap.type === 'buy';
            const tokenSymbol = swap.pair.baseToken.symbol;
            const amountToken = parseFloat(swap.amount0 > swap.amount1 ? swap.amount0 : swap.amount1).toFixed(2);
            
            const row = swapsTableBody.insertRow();
            row.innerHTML = `
                <td class="${isBuy ? 'buy' : 'sell'}">${isBuy ? 'BUY' : 'SELL'}</td>
                <td>${formatCurrency(swap.amountUsd)}</td>
                <td>${amountToken} ${tokenSymbol}</td>
                <td>${swap.pair.dexId}</td>
                <td>${new Date(swap.timestamp).toLocaleTimeString()}</td>
            `;
        });
    }

    function displayError() {
        console.error("dashboard.js: Displaying error message on dashboard.");
        const errorMsg = "Error loading data";
        marketPriceElem.textContent = errorMsg;
        marketLiquidityElem.textContent = errorMsg;
        marketVolumeElem.textContent = errorMsg;
        marketCapElem.textContent = errorMsg;
        poolsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">${errorMsg}. Try reloading the page.</td></tr>`;
        swapsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">${errorMsg}.</td></tr>`;
    }
    
    function displayNoData() {
        console.warn("dashboard.js: Displaying 'no data' message on dashboard.");
        const noDataMsg = "N/A";
        marketPriceElem.textContent = noDataMsg;
        marketLiquidityElem.textContent = noDataMsg;
        marketVolumeElem.textContent = noDataMsg;
        marketCapElem.textContent = noDataMsg;
        poolsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No liquidity pools found for this token.</td></tr>`;
        swapsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No swaps found.</td></tr>`;
    }

    // --- INITIALIZATION ---
    console.log("dashboard.js: Initializing, performing first fetch.");
    fetchMarketData();
    
    console.log("dashboard.js: Setting up data refresh interval (60 seconds).");
    setInterval(fetchMarketData, 60000);
});
