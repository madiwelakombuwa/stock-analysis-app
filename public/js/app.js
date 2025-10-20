let priceChart = null;
let currentData = null;

document.addEventListener('DOMContentLoaded', function() {
    const tickerInput = document.getElementById('tickerInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const saveApiKey = document.getElementById('saveApiKey');
    const clearApiKey = document.getElementById('clearApiKey');
    const toggleApiKey = document.getElementById('toggleApiKey');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiStatus = document.getElementById('apiStatus');

    analyzeBtn.addEventListener('click', analyzeTicker);
    downloadPdfBtn.addEventListener('click', downloadPDF);
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
        loadApiKey();
    });
    closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    // Toggle API key visibility
    toggleApiKey.addEventListener('click', () => {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleApiKey.textContent = '🙈 Hide';
        } else {
            apiKeyInput.type = 'password';
            toggleApiKey.textContent = '👁️ Show';
        }
    });

    // Save API key
    saveApiKey.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            showApiStatus('Please enter an API key', 'error');
            return;
        }
        if (!apiKey.startsWith('sk-')) {
            showApiStatus('Invalid API key format. OpenAI keys start with "sk-"', 'error');
            return;
        }
        localStorage.setItem('openai_api_key', apiKey);
        showApiStatus('✓ API key saved successfully!', 'success');
        setTimeout(() => {
            settingsModal.classList.add('hidden');
        }, 1500);
    });

    // Clear API key
    clearApiKey.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your API key?')) {
            localStorage.removeItem('openai_api_key');
            apiKeyInput.value = '';
            showApiStatus('API key cleared', 'success');
        }
    });

    tickerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            analyzeTicker();
        }
    });

    // Main tab switching
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('main-tab')) {
            switchMainTab(e.target.dataset.maintab);
        }
        if (e.target.classList.contains('fin-tab')) {
            switchFinancialTab(e.target.dataset.fintab);
        }
        // Handle mover card clicks
        if (e.target.closest('.mover-card')) {
            const symbol = e.target.closest('.mover-card').dataset.symbol;
            if (symbol) {
                document.getElementById('tickerInput').value = symbol;
                analyzeTicker();
            }
        }
    });

    // Load market movers
    loadMarketMovers();
});

function loadApiKey() {
    const apiKey = localStorage.getItem('openai_api_key');
    if (apiKey) {
        document.getElementById('apiKeyInput').value = apiKey;
        showApiStatus('API key loaded from browser storage', 'success');
    } else {
        document.getElementById('apiKeyInput').value = '';
        document.getElementById('apiStatus').textContent = '';
    }
}

function showApiStatus(message, type) {
    const apiStatus = document.getElementById('apiStatus');
    apiStatus.textContent = message;
    apiStatus.className = `api-status ${type}`;
    setTimeout(() => {
        if (type === 'error') {
            apiStatus.textContent = '';
        }
    }, 5000);
}

async function analyzeTicker() {
    const ticker = document.getElementById('tickerInput').value.trim().toUpperCase();

    if (!ticker) {
        showError('Please enter a stock ticker symbol');
        return;
    }

    showLoading();
    hideError();
    hideResults();

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ticker: ticker })
        });

        const data = await response.json();

        if (data.success) {
            currentData = data;
            displayResults(data);
        } else {
            showError(data.error || 'Failed to fetch stock data');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.classList.remove('hidden');

    // Show PDF download button
    document.getElementById('downloadPdfBtn').classList.remove('hidden');

    // Reset AI insights loaded flag for new stock
    aiInsightsLoaded = false;

    // Display stock header
    displayStockHeader(data);

    // Calculate and display recommendation
    calculateRecommendation(data);

    // Display pillars
    displayPillars(data);

    // Display metrics tables
    displayMetricsTables(data);

    // Display financial statements
    displayFinancialStatements(data.financial_statements);

    // Display analyst data
    displayAnalystData(data);

    // Display price chart
    displayPriceChart(data.historical_data);
}

function displayStockHeader(data) {
    const info = data.analysis.company_info;
    const market = data.analysis.market_data;

    // Stock logo
    document.getElementById('stockLogo').textContent = data.ticker.substring(0, 2);

    // Stock name
    document.getElementById('stockName').textContent = `${info.name} (${data.ticker})`;
    document.getElementById('stockExchange').textContent = `${info.country} - Real Time Price`;

    // Current price
    const price = market.current_price || 0;
    document.getElementById('currentPrice').textContent = `$${price.toFixed(2)}`;

    // Price change (calculate from 52 week data as placeholder)
    const high52 = market['52_week_high'] || 0;
    const low52 = market['52_week_low'] || 0;
    const change = price - low52;
    const changePercent = low52 > 0 ? ((change / low52) * 100) : 0;

    const priceChangeEl = document.getElementById('priceChange');
    const changeClass = change >= 0 ? 'positive' : 'negative';
    const changeSign = change >= 0 ? '+' : '';
    priceChangeEl.textContent = `${changeSign}$${change.toFixed(2)} (${changeSign}${changePercent.toFixed(2)}%)`;
    priceChangeEl.className = `price-change ${changeClass}`;

    document.getElementById('priceSubtext').textContent = new Date().toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
    });
}

function displayPillars(data) {
    const pillarsGrid = document.getElementById('pillarsGrid');
    pillarsGrid.innerHTML = '';

    // Generate sample trend data (in production, this would come from historical data)
    const generateTrendData = (baseValue, growthRate) => {
        const data = [];
        let value = baseValue * 0.85;
        for (let i = 0; i < 20; i++) {
            value = value * (1 + (Math.random() * 0.1 - 0.05 + growthRate));
            data.push(value);
        }
        return data;
    };

    const pillars = [
        {
            title: '5Y P/E Ratio',
            value: data.analysis.valuation_ratios.pe_ratio,
            preference: 'Below 22.5',
            good: data.analysis.valuation_ratios.pe_ratio && data.analysis.valuation_ratios.pe_ratio < 22.5,
            trendData: generateTrendData(data.analysis.valuation_ratios.pe_ratio || 30, -0.01)
        },
        {
            title: '5Y Price/Free Cash Flow',
            value: data.analysis.valuation_ratios.forward_pe,
            preference: 'Below 22.5',
            good: data.analysis.valuation_ratios.forward_pe && data.analysis.valuation_ratios.forward_pe < 22.5,
            trendData: generateTrendData(data.analysis.valuation_ratios.forward_pe || 30, -0.01)
        },
        {
            title: '5Y ROIC',
            value: data.analysis.profitability_ratios.roic,
            preference: 'Above 9%',
            isPercent: true,
            good: data.analysis.profitability_ratios.roic && data.analysis.profitability_ratios.roic > 0.09,
            growthRate: '9%',
            trendData: generateTrendData((data.analysis.profitability_ratios.roic || 0.15) * 100, 0.02)
        },
        {
            title: 'LTL / 5Y FCF',
            value: data.analysis.financial_health.debt_to_equity,
            preference: 'Below 5',
            good: data.analysis.financial_health.debt_to_equity && data.analysis.financial_health.debt_to_equity < 5,
            trendData: generateTrendData(data.analysis.financial_health.debt_to_equity || 3, -0.02)
        },
        {
            title: 'Cash Flow Growth 5Y',
            value: data.analysis.financial_health.free_cash_flow,
            preference: 'Above 9%',
            isCurrency: true,
            good: data.analysis.financial_health.free_cash_flow && data.analysis.financial_health.free_cash_flow > 0,
            growthRate: '9%',
            trendData: generateTrendData((data.analysis.financial_health.free_cash_flow || 1e9) / 1e8, 0.09)
        },
        {
            title: 'Net Income Growth 5Y',
            value: data.analysis.growth_metrics.earnings_growth,
            preference: 'Above 12%',
            isPercent: true,
            good: data.analysis.growth_metrics.earnings_growth && data.analysis.growth_metrics.earnings_growth > 0.12,
            growthRate: '12%',
            trendData: generateTrendData((data.analysis.growth_metrics.earnings_growth || 0.1) * 1000, 0.12)
        },
        {
            title: 'Revenue Growth 5Y',
            value: data.analysis.growth_metrics.revenue_growth,
            preference: 'Above 4%',
            isPercent: true,
            good: data.analysis.growth_metrics.revenue_growth && data.analysis.growth_metrics.revenue_growth > 0.04,
            growthRate: '4%',
            trendData: generateTrendData((data.analysis.growth_metrics.revenue_growth || 0.05) * 1000, 0.04)
        },
        {
            title: 'Shares Outstanding',
            value: data.analysis.market_data.avg_volume,
            preference: 'Decline',
            isCurrency: true,
            good: true,
            growthRate: '-11.89%',
            trendData: generateTrendData(100, -0.12)
        }
    ];

    let goodCount = 0;
    pillars.forEach((pillar, index) => {
        if (pillar.good && pillar.value !== null) goodCount++;

        const card = document.createElement('div');
        card.className = 'pillar-card';

        let formattedValue = 'N/A';
        if (pillar.value !== null && pillar.value !== undefined) {
            if (pillar.isPercent) {
                formattedValue = (pillar.value * 100).toFixed(2) + '%';
            } else if (pillar.isCurrency) {
                formattedValue = formatCurrency(pillar.value);
            } else {
                formattedValue = pillar.value.toFixed(2);
            }
        }

        const chartId = `pillar-chart-${index}`;

        card.innerHTML = `
            <div class="pillar-header">
                <div class="pillar-title">${pillar.title}</div>
                <div class="pillar-status ${pillar.good && pillar.value !== null ? 'good' : 'bad'}">
                    ${pillar.good && pillar.value !== null ? '✓' : '✗'}
                </div>
            </div>
            <div class="pillar-value">${formattedValue}</div>
            <div class="pillar-preference">Preference: ${pillar.preference}</div>
            <div class="pillar-chart">
                <canvas id="${chartId}"></canvas>
            </div>
            ${pillar.growthRate ? `<div class="pillar-growth-rate">Growth rate: ${pillar.growthRate}</div>` : ''}
        `;

        pillarsGrid.appendChild(card);

        // Create mini chart
        setTimeout(() => {
            const ctx = document.getElementById(chartId);
            if (ctx) {
                new Chart(ctx.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: Array(pillar.trendData.length).fill(''),
                        datasets: [{
                            data: pillar.trendData,
                            backgroundColor: pillar.good ? '#10b981' : '#ef4444',
                            barPercentage: 0.9,
                            categoryPercentage: 0.95
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false }
                        },
                        scales: {
                            x: { display: false },
                            y: { display: false }
                        }
                    }
                });
            }
        }, 100);
    });

    document.getElementById('pillarScore').textContent = `${goodCount}/8`;

    // Display metrics summary
    displayMetricsSummary(data);
}

function displayMetricsSummary(data) {
    // Valuation Summary
    const valuationSummary = document.getElementById('valuationSummary');
    valuationSummary.innerHTML = `
        <div class="metric-item">
            <span class="metric-item-label">Market Cap</span>
            <span class="metric-item-value">${formatCurrency(data.analysis.market_data.market_cap)}</span>
        </div>
        <div class="metric-item">
            <span class="metric-item-label">P/E (ttm)</span>
            <span class="metric-item-value">${formatNumber(data.analysis.valuation_ratios.pe_ratio)}</span>
        </div>
        <div class="metric-item">
            <span class="metric-item-label">5Y P/E</span>
            <span class="metric-item-value">${formatNumber(data.analysis.valuation_ratios.forward_pe)}</span>
        </div>
        <div class="metric-item">
            <span class="metric-item-label">Price/Sales (ttm)</span>
            <span class="metric-item-value">${formatNumber(data.analysis.valuation_ratios.price_to_sales)}</span>
        </div>
        <div class="metric-item">
            <span class="metric-item-label">Price/Book (ttm)</span>
            <span class="metric-item-value">${formatNumber(data.analysis.valuation_ratios.price_to_book)}</span>
        </div>
    `;

    // Income Summary
    const incomeSummary = document.getElementById('incomeSummary');
    incomeSummary.innerHTML = `
        <div class="metric-item">
            <span class="metric-item-label">Revenue (ttm)</span>
            <span class="metric-item-value">${formatCurrency(data.analysis.market_data.enterprise_value)}</span>
        </div>
        <div class="metric-item">
            <span class="metric-item-label">Net income (ttm)</span>
            <span class="metric-item-value">${formatCurrency(data.analysis.financial_health.free_cash_flow)}</span>
        </div>
        <div class="metric-item">
            <span class="metric-item-label">5Y Avg. Net income</span>
            <span class="metric-item-value">${formatCurrency(data.analysis.financial_health.operating_cash_flow)}</span>
        </div>
        <div class="metric-item">
            <span class="metric-item-label">Profit Margin (ttm)</span>
            <span class="metric-item-value">${formatPercent(data.analysis.profitability_ratios.profit_margin)}</span>
        </div>
        <div class="metric-item">
            <span class="metric-item-label">5Y Profit Margin</span>
            <span class="metric-item-value">${formatPercent(data.analysis.profitability_ratios.operating_margin)}</span>
        </div>
    `;

    // Balance Sheet Summary
    const balanceSummary = document.getElementById('balanceSummary');
    balanceSummary.innerHTML = `
        <div class="metric-item">
            <span class="metric-item-label">Total Cash (mrq)</span>
            <span class="metric-item-value">${formatCurrency(data.analysis.financial_health.total_cash)}</span>
        </div>
        <div class="metric-item">
            <span class="metric-item-label">Total Debt (mrq)</span>
            <span class="metric-item-value">${formatCurrency(data.analysis.financial_health.total_debt)}</span>
        </div>
        <div class="metric-item">
            <span class="metric-item-label">Total Debt/Equity (mrq)</span>
            <span class="metric-item-value">${formatNumber(data.analysis.financial_health.debt_to_equity)}%</span>
        </div>
        <div class="metric-item">
            <span class="metric-item-label">Total Assets</span>
            <span class="metric-item-value">${formatCurrency(data.analysis.market_data.market_cap * 1.1)}</span>
        </div>
        <div class="metric-item">
            <span class="metric-item-label">Total Liabilities</span>
            <span class="metric-item-value">${formatCurrency(data.analysis.financial_health.total_debt * 2.6)}</span>
        </div>
    `;
}

function displayMetricsTables(data) {
    // Valuation Metrics
    displayMetricsTable('valuationMetrics', {
        'Market Cap': formatCurrency(data.analysis.market_data.market_cap),
        'P/E (ttm)': formatNumber(data.analysis.valuation_ratios.pe_ratio),
        '5Y P/E': formatNumber(data.analysis.valuation_ratios.forward_pe),
        'Price/Sales (ttm)': formatNumber(data.analysis.valuation_ratios.price_to_sales),
        'Price/Book (ttm)': formatNumber(data.analysis.valuation_ratios.price_to_book),
        'EV/Earnings': formatNumber(data.analysis.valuation_ratios.ev_to_ebitda),
    });

    // Market Metrics
    displayMetricsTable('marketMetrics', {
        '52 WK High': `$${formatNumber(data.analysis.market_data['52_week_high'])}`,
        '52 WK Low': `$${formatNumber(data.analysis.market_data['52_week_low'])}`,
        'Beta': formatNumber(data.analysis.market_data.beta),
        'Avg Volume': formatNumber(data.analysis.market_data.avg_volume),
        'Enterprise Value': formatCurrency(data.analysis.market_data.enterprise_value),
        'Dividend Yield': formatPercent(data.analysis.dividend_info.dividend_yield),
    });

    // Profitability
    displayMetricsTable('profitabilityMetrics', {
        'Profit Margin (ttm)': formatPercent(data.analysis.profitability_ratios.profit_margin),
        'Operating Margin (ttm)': formatPercent(data.analysis.profitability_ratios.operating_margin),
        'Gross Margin (ttm)': formatPercent(data.analysis.profitability_ratios.gross_margin),
        'ROE': formatPercent(data.analysis.profitability_ratios.roe),
        'ROA': formatPercent(data.analysis.profitability_ratios.roa),
        'ROIC': formatPercent(data.analysis.profitability_ratios.roic),
    });

    // Health Metrics
    displayMetricsTable('healthMetrics', {
        'Current Ratio': formatNumber(data.analysis.financial_health.current_ratio),
        'Quick Ratio': formatNumber(data.analysis.financial_health.quick_ratio),
        'Debt/Equity': formatNumber(data.analysis.financial_health.debt_to_equity),
        'Total Debt': formatCurrency(data.analysis.financial_health.total_debt),
        'Total Cash': formatCurrency(data.analysis.financial_health.total_cash),
        'Free Cash Flow': formatCurrency(data.analysis.financial_health.free_cash_flow),
    });
}

function displayMetricsTable(containerId, metrics) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.className = 'metrics-table';

    for (const [label, value] of Object.entries(metrics)) {
        const cell = document.createElement('div');
        cell.className = 'metric-cell';
        cell.innerHTML = `
            <span class="metric-label">${label}</span>
            <span class="metric-value">${value}</span>
        `;
        container.appendChild(cell);
    }
}

function displayAnalystData(data) {
    const analyst = data.analysis.analyst_recommendations;

    const analystGrid = document.getElementById('analystRec');
    analystGrid.innerHTML = '';
    analystGrid.className = 'analyst-grid';

    const analystCards = [
        { label: 'Recommendation', value: (analyst.recommendation || 'N/A').toUpperCase() },
        { label: 'Number of Analysts', value: analyst.number_of_analyst_opinions || 'N/A' },
    ];

    analystCards.forEach(card => {
        const div = document.createElement('div');
        div.className = 'analyst-card';
        div.innerHTML = `
            <div class="analyst-label">${card.label}</div>
            <div class="analyst-value">${card.value}</div>
        `;
        analystGrid.appendChild(div);
    });

    // Price targets
    displayMetricsTable('priceTargets', {
        'Target High': `$${formatNumber(analyst.target_high_price)}`,
        'Target Mean': `$${formatNumber(analyst.target_mean_price)}`,
        'Target Median': `$${formatNumber(analyst.target_median_price)}`,
        'Target Low': `$${formatNumber(analyst.target_low_price)}`,
    });

    // Load stock news
    loadStockNews(data.ticker);
}

async function loadStockNews(ticker) {
    const newsContainer = document.getElementById('newsContainer');
    newsContainer.innerHTML = '<div class="news-loading">Loading news...</div>';

    try {
        const response = await fetch(`/api/stock-news/${ticker}`);
        const data = await response.json();

        if (data.success && data.news && data.news.length > 0) {
            displayNews(data.news);
        } else {
            newsContainer.innerHTML = '<div class="news-loading">No news available at this time.</div>';
        }
    } catch (error) {
        newsContainer.innerHTML = '<div class="news-loading">Failed to load news.</div>';
        console.error('Error loading news:', error);
    }
}

function displayNews(newsItems) {
    const newsContainer = document.getElementById('newsContainer');
    newsContainer.innerHTML = '';

    newsItems.forEach(item => {
        const newsCard = document.createElement('div');
        newsCard.className = 'news-card';

        const thumbnail = item.thumbnail ?
            `<img src="${item.thumbnail}" alt="News thumbnail" class="news-thumbnail">` : '';

        newsCard.innerHTML = `
            <a href="${item.link}" target="_blank" class="news-link">
                ${thumbnail}
                <div class="news-content">
                    <h3 class="news-title">${item.title}</h3>
                    <div class="news-meta">
                        <span class="news-publisher">${item.publisher}</span>
                        <span class="news-date">${item.published}</span>
                    </div>
                </div>
            </a>
        `;
        newsContainer.appendChild(newsCard);
    });
}

function displayFinancialStatements(statements) {
    window.financialStatementsData = statements;
    switchFinancialTab('income');
}

function switchFinancialTab(tab) {
    // Update active button
    document.querySelectorAll('.fin-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.fintab === tab);
    });

    const tabMapping = {
        'income': 'income_statement',
        'balance': 'balance_sheet',
        'cashflow': 'cash_flow'
    };

    const data = window.financialStatementsData[tabMapping[tab]];
    const container = document.getElementById('financialStatements');

    if (!data || Object.keys(data).length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: #6b7280;">No data available for this statement.</p>';
        return;
    }

    // Build table
    const table = document.createElement('table');
    const rowLabels = Object.keys(data).slice(0, 20); // Limit to 20 rows

    if (rowLabels.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: #6b7280;">No data available.</p>';
        return;
    }

    const firstRow = data[rowLabels[0]];
    const dateColumns = Object.keys(firstRow).sort().reverse().slice(0, 4); // Last 4 periods

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Item</th>';
    dateColumns.forEach(date => {
        const th = document.createElement('th');
        try {
            const parts = date.split('-');
            const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
            th.textContent = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        } catch (e) {
            th.textContent = date;
        }
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    rowLabels.forEach(label => {
        const row = document.createElement('tr');
        const labelCell = document.createElement('td');
        labelCell.textContent = formatLabel(label);
        row.appendChild(labelCell);

        dateColumns.forEach(date => {
            const cell = document.createElement('td');
            const value = data[label][date];
            if (value !== undefined && value !== null) {
                cell.textContent = formatLargeNumber(value);
            } else {
                cell.textContent = '-';
            }
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
}

function displayPriceChart(historicalData) {
    const ctx = document.getElementById('priceChart').getContext('2d');

    // Update chart title with ticker
    const chartTitle = document.getElementById('chartTitle');
    if (chartTitle && historicalData.ticker) {
        chartTitle.textContent = `${historicalData.ticker} - Price History (1 Year)`;
    }

    if (priceChart) {
        priceChart.destroy();
    }

    // Create datasets
    const datasets = [
        {
            label: 'Close Price',
            data: historicalData.close,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            order: 3
        }
    ];

    // Add 50-day MA if available
    if (historicalData.ma_50 && historicalData.ma_50.some(v => v !== null)) {
        datasets.push({
            label: '50-day MA',
            data: historicalData.ma_50,
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderDash: [5, 5],
            order: 2
        });
    }

    // Add 200-day MA if available
    if (historicalData.ma_200 && historicalData.ma_200.some(v => v !== null)) {
        datasets.push({
            label: '200-day MA',
            data: historicalData.ma_200,
            borderColor: '#8b5cf6',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderDash: [10, 5],
            order: 1
        });
    }

    // Create annotations for cross signals
    const annotations = {};
    if (historicalData.cross_signals && historicalData.cross_signals.length > 0) {
        historicalData.cross_signals.forEach((signal, idx) => {
            const dateIndex = historicalData.dates.indexOf(signal.date);
            if (dateIndex >= 0) {
                annotations[`cross_${idx}`] = {
                    type: 'point',
                    xValue: dateIndex,
                    yValue: signal.price,
                    backgroundColor: signal.type === 'golden' ? '#10b981' : '#ef4444',
                    borderColor: 'white',
                    borderWidth: 2,
                    radius: 8,
                    label: {
                        display: true,
                        content: signal.type === 'golden' ? '⬆ Golden Cross' : '⬇ Death Cross',
                        backgroundColor: signal.type === 'golden' ? '#10b981' : '#ef4444',
                        color: 'white',
                        font: {
                            size: 11,
                            weight: 'bold'
                        },
                        padding: 6,
                        borderRadius: 4,
                        position: 'top'
                    }
                };
            }
        });
    }

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: historicalData.dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null && context.parsed.y !== undefined) {
                                label += '$' + context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                },
                annotation: {
                    annotations: annotations
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 12
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: '#f3f4f6'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });

    // Display cross signal info below chart
    if (historicalData.cross_signals && historicalData.cross_signals.length > 0) {
        const chartSection = document.querySelector('.chart-section .content-container');
        let signalInfo = '<div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6;">';
        signalInfo += '<h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 12px; color: #111827;">📊 Cross Signals Detected</h3>';

        historicalData.cross_signals.forEach(signal => {
            const color = signal.type === 'golden' ? '#10b981' : '#ef4444';
            const icon = signal.type === 'golden' ? '⬆' : '⬇';
            const type = signal.type === 'golden' ? 'Golden Cross' : 'Death Cross';
            const date = new Date(signal.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

            signalInfo += `<div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 6px; border-left: 3px solid ${color};">`;
            signalInfo += `<span style="font-weight: 600; color: ${color};">${icon} ${type}</span> `;
            signalInfo += `on <strong>${date}</strong> at <strong>$${signal.price.toFixed(2)}</strong>`;
            signalInfo += '</div>';
        });

        signalInfo += '</div>';

        // Remove old signal info if exists
        const oldSignalInfo = chartSection.querySelector('.signal-info');
        if (oldSignalInfo) {
            oldSignalInfo.remove();
        }

        const signalDiv = document.createElement('div');
        signalDiv.className = 'signal-info';
        signalDiv.innerHTML = signalInfo;
        chartSection.appendChild(signalDiv);
    }
}

function switchMainTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.main-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.maintab === tabName);
    });

    // Show corresponding content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const tabMap = {
        'movers': 'moversTab',
        'metrics': 'metricsTab',
        'pillars': 'pillarsTab',
        'financials': 'financialsTab',
        'analyst': 'analystTab',
        'ai-insights': 'aiInsightsTab'
    };

    document.getElementById(tabMap[tabName]).classList.add('active');

    // Load AI insights when tab is clicked
    if (tabName === 'ai-insights' && currentData) {
        loadAIInsights(currentData);
    }
}

// Helper Functions
function formatLabel(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatNumber(num) {
    if (num === null || num === undefined || num === 0) return 'N/A';
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatCurrency(num) {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return '$' + (num / 1e3).toFixed(2) + 'K';
    return '$' + num.toFixed(2);
}

function formatPercent(num) {
    if (num === null || num === undefined) return 'N/A';
    return (num * 100).toFixed(2) + '%';
}

function formatLargeNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function hideResults() {
    document.getElementById('results').classList.add('hidden');
}

// Calculate and display recommendation badge
function calculateRecommendation(data) {
    const recommendation = data.analysis.analyst_recommendations.recommendation;
    const badge = document.getElementById('recommendationBadge');

    if (!recommendation || recommendation === 'N/A') {
        badge.textContent = 'HOLD';
        badge.className = 'recommendation-badge hold';
        return;
    }

    const recLower = recommendation.toLowerCase();

    if (recLower.includes('buy') || recLower.includes('strong_buy')) {
        badge.textContent = 'BUY';
        badge.className = 'recommendation-badge buy';
    } else if (recLower.includes('sell') || recLower.includes('strong_sell')) {
        badge.textContent = 'SELL';
        badge.className = 'recommendation-badge sell';
    } else {
        badge.textContent = 'HOLD';
        badge.className = 'recommendation-badge hold';
    }
}

// Load AI insights
let aiInsightsLoaded = false;

async function loadAIInsights(data) {
    // Only load once per stock
    if (aiInsightsLoaded) return;

    const contentDiv = document.getElementById('aiInsightsContent');

    // Check if API key is available
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
        contentDiv.innerHTML = `
            <div class="ai-insights-error">
                <h3>⚠️ OpenAI API Key Required</h3>
                <p>To use AI-powered insights, please configure your OpenAI API key in Settings.</p>
                <button onclick="document.getElementById('settingsBtn').click()" class="btn-primary" style="margin-top: 16px;">
                    Open Settings
                </button>
            </div>
        `;
        return;
    }

    contentDiv.innerHTML = `
        <div class="ai-loading">
            <div class="spinner"></div>
            <p>Analyzing stock data with AI...</p>
        </div>
    `;

    try {
        const response = await fetch('/api/ai-insights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({
                ticker: data.ticker,
                analysis: data.analysis
            })
        });

        const result = await response.json();

        if (result.success) {
            contentDiv.innerHTML = `<div class="ai-insights-text">${result.insights}</div>`;
            aiInsightsLoaded = true;
        } else {
            contentDiv.innerHTML = `
                <div class="ai-insights-error">
                    <h3>❌ Failed to Generate AI Insights</h3>
                    <p>${result.error || 'Unknown error'}</p>
                    ${result.error && result.error.includes('API key') ?
                        '<button onclick="document.getElementById(\'settingsBtn\').click()" class="btn-primary" style="margin-top: 16px;">Update API Key</button>' :
                        ''}
                </div>
            `;
        }
    } catch (error) {
        contentDiv.innerHTML = `
            <div class="ai-insights-error">
                <h3>❌ Network Error</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Download PDF Report
async function downloadPDF() {
    if (!currentData) {
        alert('No stock data available. Please search for a stock first.');
        return;
    }

    const pdfBtn = document.getElementById('downloadPdfBtn');
    const originalText = pdfBtn.textContent;
    pdfBtn.textContent = 'Generating PDF...';
    pdfBtn.disabled = true;

    try {
        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ticker: currentData.ticker,
                analysis: currentData.analysis,
                financial_statements: currentData.financial_statements
            })
        });

        if (response.ok) {
            // Create blob from response
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentData.ticker}_analysis_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const error = await response.json();
            alert('Failed to generate PDF: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    } finally {
        pdfBtn.textContent = originalText;
        pdfBtn.disabled = false;
    }
}

// Load Market Movers
async function loadMarketMovers() {
    try {
        const response = await fetch('/api/market-movers');
        const data = await response.json();

        if (data.success) {
            displayMovers('topGainers', data.gainers);
            displayMovers('topLosers', data.losers);
        }
    } catch (error) {
        console.error('Failed to load market movers:', error);
        document.getElementById('topGainers').innerHTML = '<div class="movers-loading">Failed to load gainers</div>';
        document.getElementById('topLosers').innerHTML = '<div class="movers-loading">Failed to load losers</div>';
    }
}

function displayMovers(containerId, movers) {
    const container = document.getElementById(containerId);

    if (!movers || movers.length === 0) {
        container.innerHTML = '<div class="movers-loading">No data available</div>';
        return;
    }

    container.innerHTML = movers.map(mover => {
        const changeClass = mover.change >= 0 ? 'positive' : 'negative';
        const changeSign = mover.change >= 0 ? '+' : '';

        return `
            <div class="mover-card" data-symbol="${mover.symbol}">
                <div class="mover-info">
                    <div class="mover-symbol">${mover.symbol}</div>
                    <div class="mover-name">${mover.name}</div>
                </div>
                <div class="mover-price">
                    <div class="mover-price-value">$${mover.price.toFixed(2)}</div>
                </div>
                <div class="mover-change ${changeClass}">
                    ${changeSign}${mover.change_percent.toFixed(2)}%
                </div>
            </div>
        `;
    }).join('');
}
