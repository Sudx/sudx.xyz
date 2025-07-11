// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAÇÃO ---
    // Endereço do token SUDX na rede Polygon. 
    // Este é o único dado que precisamos para encontrar todos os seus pares.
    const SUDX_TOKEN_ADDRESS = '0xc56F971934961267586e8283C06018167F0D0E4C'; // Endereço de exemplo, substitua pelo real
    const CHAIN_NAME = 'polygon'; // ou 'bsc', 'ethereum', etc.

    // --- ELEMENTOS DO DOM ---
    const marketPriceElem = document.getElementById('market-price');
    const marketLiquidityElem = document.getElementById('market-liquidity');
    const marketVolumeElem = document.getElementById('market-volume');
    const marketCapElem = document.getElementById('market-cap');
    const poolsTableBody = document.getElementById('pools-table-body');
    const swapsTableBody = document.getElementById('swaps-table-body');

    // --- FUNÇÕES AUXILIARES ---

    /**
     * Formata um número como uma string de moeda em USD.
     * @param {number} value O número a ser formatado.
     * @returns {string} A string formatada (ex: $1,234.56).
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
     * Formata um número grande com abreviações (K, M, B).
     * @param {number} value O número a ser formatado.
     * @returns {string} A string formatada (ex: $1.23M).
     */
    const formatCurrencyShort = (value) => {
        if (typeof value !== 'number') return '$0';
        if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
        if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
        return formatCurrency(value);
    };

    /**
     * Formata o preço, mostrando mais casas decimais para valores pequenos.
     * @param {number} value O preço a ser formatado.
     * @returns {string} A string de preço formatada.
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

    // --- LÓGICA PRINCIPAL ---

    /**
     * Busca os dados da API do DEX Screener e atualiza o dashboard.
     */
    async function fetchMarketData() {
        const apiUrl = `https://api.dexscreener.com/latest/dex/tokens/${SUDX_TOKEN_ADDRESS}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }
            const data = await response.json();
            
            if (!data.pairs || data.pairs.length === 0) {
                console.warn('Nenhum par encontrado para o token SUDX.');
                displayNoData();
                return;
            }

            // Filtra pares que podem não ter dados completos
            const validPairs = data.pairs.filter(p => p.liquidity && p.priceUsd);

            // Processa e exibe os dados
            processAndDisplayOverview(validPairs);
            displayPoolsTable(validPairs);
            fetchAndDisplaySwaps(validPairs);

        } catch (error) {
            console.error("Falha ao buscar dados do mercado:", error);
            displayError();
        }
    }

    /**
     * Calcula e exibe a visão geral do mercado (agregado).
     * @param {Array} pairs A lista de pares da API.
     */
    function processAndDisplayOverview(pairs) {
        const totalLiquidity = pairs.reduce((sum, pair) => sum + pair.liquidity.usd, 0);
        const totalVolume24h = pairs.reduce((sum, pair) => sum + pair.volume.h24, 0);
        
        // Usa o FDV (Fully Diluted Valuation) do par mais líquido como uma aproximação do Market Cap
        const primaryPair = pairs.sort((a, b) => b.liquidity.usd - a.liquidity.usd)[0];
        const marketCap = primaryPair.fdv; 
        const price = parseFloat(primaryPair.priceUsd);

        marketPriceElem.textContent = formatPrice(price);
        marketLiquidityElem.textContent = formatCurrencyShort(totalLiquidity);
        marketVolumeElem.textContent = formatCurrencyShort(totalVolume24h);
        marketCapElem.textContent = formatCurrencyShort(marketCap);
    }

    /**
     * Exibe a tabela de pools de liquidez ativos.
     * @param {Array} pairs A lista de pares da API.
     */
    function displayPoolsTable(pairs) {
        poolsTableBody.innerHTML = ''; // Limpa a tabela

        if (pairs.length === 0) {
            poolsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum pool ativo encontrado.</td></tr>';
            return;
        }

        // Ordena por liquidez (maior primeiro)
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
     * Busca e exibe os swaps mais recentes dos principais pools.
     * @param {Array} pairs A lista de pares da API.
     */
    async function fetchAndDisplaySwaps(pairs) {
        swapsTableBody.innerHTML = ''; // Limpa a tabela
        
        // Pega os 3 pares mais líquidos para buscar swaps
        const topPairs = pairs.slice(0, 3);
        let allSwaps = [];

        for (const pair of topPairs) {
            try {
                const swapsUrl = `https://api.dexscreener.com/latest/dex/pairs/${pair.chainId}/${pair.pairAddress}`;
                const response = await fetch(swapsUrl);
                const data = await response.json();
                if (data.pair && data.pair.txns) {
                    // Adiciona informações do par a cada transação
                    const swaps = data.pair.txns.map(txn => ({...txn, pair: data.pair }));
                    allSwaps.push(...swaps);
                }
            } catch (error) {
                console.warn(`Não foi possível buscar swaps para o par ${pair.pairAddress}:`, error);
            }
        }

        if (allSwaps.length === 0) {
            swapsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum swap recente encontrado.</td></tr>';
            return;
        }

        // Ordena todos os swaps por data (mais recente primeiro) e pega os 20 mais recentes
        const recentSwaps = allSwaps.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

        recentSwaps.forEach(swap => {
            const isBuy = swap.type === 'buy';
            const tokenSymbol = swap.pair.baseToken.symbol;
            const amountToken = parseFloat(swap.amount0 > swap.amount1 ? swap.amount0 : swap.amount1).toFixed(2);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="${isBuy ? 'buy' : 'sell'}">${isBuy ? 'COMPRA' : 'VENDA'}</td>
                <td>${formatCurrency(swap.amountUsd)}</td>
                <td>${amountToken} ${tokenSymbol}</td>
                <td>${swap.pair.dexId}</td>
                <td>${new Date(swap.timestamp).toLocaleTimeString()}</td>
            `;
            swapsTableBody.appendChild(row);
        });
    }

    /**
     * Exibe uma mensagem de erro no dashboard.
     */
    function displayError() {
        const errorMsg = "Erro ao carregar dados";
        marketPriceElem.textContent = errorMsg;
        marketLiquidityElem.textContent = errorMsg;
        marketVolumeElem.textContent = errorMsg;
        marketCapElem.textContent = errorMsg;
        poolsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">${errorMsg}. Tente recarregar a página.</td></tr>`;
        swapsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">${errorMsg}.</td></tr>`;
    }
    
    /**
     * Exibe mensagem quando nenhum dado é encontrado.
     */
    function displayNoData() {
        const noDataMsg = "N/A";
        marketPriceElem.textContent = noDataMsg;
        marketLiquidityElem.textContent = noDataMsg;
        marketVolumeElem.textContent = noDataMsg;
        marketCapElem.textContent = noDataMsg;
        poolsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Nenhum pool de liquidez encontrado para este token.</td></tr>`;
        swapsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Nenhum swap encontrado.</td></tr>`;
    }


    // --- INICIALIZAÇÃO ---
    fetchMarketData();
    
    // Opcional: Atualiza os dados a cada 60 segundos
    setInterval(fetchMarketData, 60000);
});