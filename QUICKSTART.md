# Stock Analysis App - Quick Start Guide

## Overview

This is a comprehensive stock fundamental analysis web application built with **yfinance** library from https://github.com/ranaroussi/yfinance. It provides real-time stock data, fundamental analysis, and AI-powered insights.

## Features

- **Stock Fundamental Analysis** - Comprehensive metrics including P/E, ROE, profit margins, debt ratios, and more
- **Eight Commandments Framework** - Proprietary investment screening based on 8 critical metrics
- **AI-Powered Insights** - GPT-4 analysis of stock data (requires OpenAI API key)
- **PDF Export** - Download professional analysis reports
- **Interactive Charts** - Price history with 50-day and 200-day moving averages
- **Market Movers** - Track top gainers and losers
- **Stock News** - Latest news articles for each stock
- **Financial Statements** - Income statement, balance sheet, and cash flow data

## Installation

### 1. Install Dependencies

```bash
pip3 install -r requirements.txt
```

Or install manually:

```bash
pip3 install flask yfinance pandas numpy openai reportlab python-dateutil --break-system-packages
```

### 2. (Optional) Set OpenAI API Key

For AI-powered insights, you need an OpenAI API key:

**Option A: Environment Variable**
```bash
export OPENAI_API_KEY='your-api-key-here'
```

**Option B: Configure in the App**
1. Start the application
2. Click the "Settings" button (gear icon) in the top right
3. Enter your OpenAI API key
4. Click "Save API Key"

Get your API key from: https://platform.openai.com/api-keys

## Usage

### Start the Application

```bash
python3 stock_analysis_app.py
```

The app will start on **http://localhost:8888**

### Access the Web Interface

1. Open your browser and navigate to: **http://localhost:8888**
2. Enter a stock ticker symbol (e.g., AAPL, MSFT, GOOGL, TSLA)
3. Click "Search" or press Enter
4. View comprehensive analysis across multiple tabs

### Features Overview

#### Top Movers
- See the top gaining and losing stocks
- Click any stock card to analyze it instantly

#### Metrics Tab
- Valuation ratios (P/E, Price/Book, EV/EBITDA)
- Market data (market cap, 52-week high/low, beta)
- Profitability metrics (ROE, ROA, profit margins)
- Financial health indicators (debt/equity, cash flow)

#### Eight Commandments
- Automated evaluation of 8 critical investment metrics
- Pass/fail indicators for each commandment
- Overall score showing how many commandments the stock passes

The 8 Commandments:
1. 5Y P/E Ratio - Below 22.5
2. 5Y Price/FCF - Below 22.5
3. 5Y ROIC - Above 9%
4. Debt Ratio - Below 5
5. FCF Growth - Above 9%
6. Earnings Growth - Above 12%
7. Revenue Growth - Above 4%
8. Shares Outstanding - Declining

#### Financials Tab
- Income Statement
- Balance Sheet
- Cash Flow Statement
- Multi-period historical data

#### Analyst Tab
- Analyst recommendations (Buy, Hold, Sell)
- Price targets (High, Low, Mean, Median)
- Latest news articles with thumbnails

#### AI Insights Tab
- AI-powered analysis of the stock
- Valuation assessment
- Financial strength evaluation
- Growth prospects analysis
- Risk identification
- Investment recommendation

Note: Requires OpenAI API key

#### Price Chart
- 1-year price history
- 50-day and 200-day moving averages
- Golden Cross and Death Cross detection

### PDF Export

Click the "Download PDF" button to generate a comprehensive PDF report including:
- Company overview
- Market data
- Valuation metrics
- Profitability ratios
- Financial health indicators
- Growth metrics
- Eight Commandments scorecard
- Financial statement highlights

## Example Stocks to Try

- **Technology**: AAPL (Apple), MSFT (Microsoft), GOOGL (Google), NVDA (NVIDIA), META (Meta)
- **Finance**: JPM (JPMorgan), BAC (Bank of America), GS (Goldman Sachs)
- **Consumer**: AMZN (Amazon), WMT (Walmart), COST (Costco), TGT (Target)
- **Automotive**: TSLA (Tesla), F (Ford), GM (General Motors)
- **Healthcare**: JNJ (Johnson & Johnson), PFE (Pfizer), UNH (UnitedHealth)
- **Energy**: XOM (Exxon), CVX (Chevron), COP (ConocoPhillips)

## API Endpoints

The application also provides RESTful API endpoints:

### Analyze Single Stock

```bash
POST /api/analyze
Content-Type: application/json

{
  "ticker": "AAPL"
}
```

### Compare Multiple Stocks

```bash
POST /api/compare
Content-Type: application/json

{
  "tickers": ["AAPL", "MSFT", "GOOGL"]
}
```

### Get Stock News

```bash
GET /api/stock-news/<ticker>
```

### Get Market Movers

```bash
GET /api/market-movers
```

### Get AI Insights

```bash
POST /api/ai-insights
Content-Type: application/json
X-API-Key: your-openai-api-key

{
  "ticker": "AAPL",
  "analysis": { ... }
}
```

## Troubleshooting

### Port Already in Use

If port 8888 is already in use, edit `stock_analysis_app.py` and change:
```python
app.run(host='0.0.0.0', port=9999, debug=True)  # Change to any available port
```

### Missing Data

Some stocks may not have complete fundamental data. This is normal for:
- Recently IPO'd companies
- Foreign stocks
- OTC/Pink sheet stocks
- Cryptocurrencies

### API Key Not Working

If AI Insights aren't working:
1. Verify your OpenAI API key is valid
2. Check your OpenAI account has credits
3. Ensure the key has proper permissions
4. Try setting it via Settings modal instead of environment variable

### Slow Performance

- First-time requests may be slower as yfinance fetches and caches data
- Subsequent requests will be faster
- Market movers may take 10-15 seconds on first load

## Data Source

This application uses **yfinance** (https://github.com/ranaroussi/yfinance) to fetch data from Yahoo Finance.

**Important Notes:**
- Data is for educational and informational purposes only
- Yahoo Finance may rate limit requests
- Some data may be delayed by 15-20 minutes
- Always verify critical data from official sources
- This tool is NOT investment advice

## Technology Stack

- **Backend**: Flask (Python web framework)
- **Data Source**: yfinance (Yahoo Finance API wrapper)
- **Data Processing**: pandas, numpy
- **AI**: OpenAI GPT-4o-mini
- **PDF Generation**: ReportLab
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js

## License

This project uses the yfinance library which is distributed under the Apache Software License.

## Disclaimer

This application is for educational and research purposes only. The data provided should not be used as the sole basis for investment decisions. Always conduct thorough research and consult with qualified financial advisors before making investment decisions.

Yahoo!, Y!Finance, and Yahoo! finance are registered trademarks of Yahoo, Inc. This application is not affiliated with, endorsed by, or vetted by Yahoo, Inc.
