# Stock Fundamental Analysis Web Application

A comprehensive web application for fundamental stock analysis featuring the "Eight Commandments" investment framework, powered by yfinance and enhanced with AI insights.

![Stock Analysis Dashboard](https://img.shields.io/badge/Python-3.7+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## Features

### 🎯 Eight Commandments Framework
A proprietary investment screening methodology that evaluates stocks across 8 critical metrics:
1. **5Y P/E Ratio** - Preference: Below 22.5
2. **5Y Price/FCF** - Preference: Below 22.5
3. **5Y ROIC** - Preference: Above 9%
4. **Debt Ratio** - Preference: Below 5
5. **FCF Growth** - Preference: Above 9%
6. **Earnings Growth** - Preference: Above 12%
7. **Revenue Growth** - Preference: Above 4%
8. **Shares Outstanding** - Preference: Declining

Each metric is automatically evaluated with pass/fail indicators and visual progress tracking.

### 📊 Comprehensive Fundamental Analysis
- **Company Information**: Name, sector, industry, employee count, business description
- **Market Data**: Current price, market cap, enterprise value, 52-week high/low, beta, average volume
- **Valuation Ratios**: P/E, Forward P/E, PEG, Price-to-Book, Price-to-Sales, EV/Revenue, EV/EBITDA
- **Profitability Metrics**: Profit margin, operating margin, gross margin, ROE, ROA, ROIC
- **Financial Health**: Current ratio, quick ratio, debt-to-equity, total debt, total cash, free cash flow
- **Growth Metrics**: Revenue growth, earnings growth, EPS (trailing & forward), revenue per share
- **Dividend Information**: Dividend rate, yield, payout ratio, ex-dividend date
- **Analyst Recommendations**: Target prices (high/low/mean/median), recommendation, analyst count

### 📈 Market Overview
- **Top Movers**: Real-time tracking of top gaining and losing stocks
- **Clickable Cards**: Quick analysis by clicking any stock in the movers list
- **Live Data**: Constantly updated market data from Yahoo Finance

### 📰 Latest News
- **Stock-Specific News**: Real-time news articles for each analyzed stock
- **Rich Media**: News thumbnails and article previews
- **Direct Links**: Click to read full articles from trusted publishers
- **Publisher Attribution**: See source and publication date for each article

### 🤖 AI-Powered Insights
- **GPT-4 Analysis**: Comprehensive AI-generated investment insights
- **Valuation Assessment**: Is the stock overvalued, fairly valued, or undervalued?
- **Financial Strength**: Analysis of profitability, margins, and balance sheet health
- **Growth Prospects**: Evaluation of revenue and earnings growth trends
- **Risk Analysis**: Identification of key risks and concerns
- **Investment Recommendation**: AI-powered investment perspective

### 📄 PDF Export
- **Comprehensive Reports**: Download complete analysis as professionally formatted PDF
- **All Metrics Included**: Company info, market data, valuation, profitability, financial health
- **Eight Commandments**: Pass/fail status for all 8 commandments
- **Financial Statements**: Key highlights from income statement, balance sheet, and cash flow
- **Multi-Page Layout**: Clean, organized presentation suitable for sharing

### 📊 Data Visualization
- **Interactive Price Chart**: 1-year stock price history with 50-day and 200-day moving averages
- **Golden/Death Cross Detection**: Automatic identification of bullish and bearish signals
- **Financial Statements**: Income statement, balance sheet, and cash flow statement with multi-period data
- **Responsive Design**: Beautiful modern UI that works on desktop and mobile

### 🔧 Technical Features
- RESTful API endpoints
- Real-time data fetching from Yahoo Finance
- Clean, modern UI with professional color scheme
- Tabbed interface for easy navigation
- Number formatting with K/M/B/T suffixes
- Percentage and currency formatting
- Responsive mobile-first design

## Installation

### Prerequisites
- Python 3.7+
- pip3

### Install Dependencies
```bash
pip3 install -r requirements.txt
```

Or install manually:
```bash
pip3 install flask yfinance pandas numpy openai reportlab python-dateutil
```

### Configure OpenAI API (Optional)
The AI Insights feature requires an OpenAI API key. Set it as an environment variable:

```bash
export OPENAI_API_KEY='your-openai-api-key-here'
```

Or add it to your `.bashrc` or `.zshrc` for permanent configuration.

**Note:** The app will work without an API key, but AI Insights will not be available.

## Usage

### Start the Application
```bash
python3 stock_analysis_app.py
```

The application will start on `http://localhost:8888`

Open your browser and navigate to:
```
http://localhost:8888
```

### Access the Web Interface
1. Open your browser and navigate to `http://localhost:8888`
2. Enter a stock ticker symbol (e.g., AAPL, MSFT, GOOGL, TSLA)
3. Click "Analyze" or press Enter
4. View comprehensive fundamental analysis data

### API Endpoints

#### Analyze Single Stock
```bash
POST /api/analyze
Content-Type: application/json

{
  "ticker": "AAPL"
}
```

Response:
```json
{
  "success": true,
  "ticker": "AAPL",
  "analysis": {
    "company_info": {...},
    "market_data": {...},
    "valuation_ratios": {...},
    "profitability_ratios": {...},
    "financial_health": {...},
    "growth_metrics": {...},
    "dividend_info": {...},
    "analyst_recommendations": {...}
  },
  "financial_statements": {
    "income_statement": {...},
    "balance_sheet": {...},
    "cash_flow": {...}
  },
  "historical_data": {
    "dates": [...],
    "close": [...],
    "volume": [...]
  }
}
```

#### Compare Multiple Stocks
```bash
POST /api/compare
Content-Type: application/json

{
  "tickers": ["AAPL", "MSFT", "GOOGL"]
}
```

## Example Tickers to Try

- **Technology**: AAPL (Apple), MSFT (Microsoft), GOOGL (Google), META (Meta), NVDA (NVIDIA)
- **Finance**: JPM (JPMorgan), BAC (Bank of America), GS (Goldman Sachs)
- **Consumer**: AMZN (Amazon), WMT (Walmart), COST (Costco)
- **Automotive**: TSLA (Tesla), F (Ford), GM (General Motors)
- **Healthcare**: JNJ (Johnson & Johnson), PFE (Pfizer), UNH (UnitedHealth)

## File Structure

```
AgentKit/
├── stock_analysis_app.py       # Flask backend server
├── templates/
│   └── stock_analysis.html     # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css          # Styling
│   └── js/
│       └── app.js             # Frontend JavaScript
└── yfinance/                   # yfinance library (cloned from GitHub)
```

## Key Metrics Explained

### Valuation Ratios
- **P/E Ratio**: Price-to-Earnings - measures how much investors pay per dollar of earnings
- **Forward P/E**: Based on projected earnings
- **PEG Ratio**: P/E divided by earnings growth rate
- **Price-to-Book**: Market value vs book value
- **EV/EBITDA**: Enterprise value to earnings before interest, taxes, depreciation, amortization

### Profitability
- **ROE**: Return on Equity - profit generated from shareholder equity
- **ROA**: Return on Assets - profit generated from total assets
- **Margins**: Gross, operating, and net profit margins

### Financial Health
- **Current Ratio**: Current assets / current liabilities (liquidity measure)
- **Quick Ratio**: (Current assets - inventory) / current liabilities
- **Debt-to-Equity**: Total debt / shareholder equity
- **Free Cash Flow**: Operating cash flow - capital expenditures

## Data Source

This application uses the yfinance library to fetch data from Yahoo Finance. The data is for informational and educational purposes only. Always verify information and consult financial professionals before making investment decisions.

## Important Notes

- **Rate Limits**: Yahoo Finance may rate limit requests. Avoid making too many requests in a short period.
- **Data Accuracy**: While yfinance is generally reliable, always verify critical data from official sources.
- **Real-time Data**: Some data may be delayed by 15-20 minutes depending on the exchange.
- **Educational Use**: This tool is for research and educational purposes only, not investment advice.

## Troubleshooting

### Port Already in Use
If port 8888 is already in use, edit `stock_analysis_app.py` and change the port:
```python
app.run(host='0.0.0.0', port=XXXX, debug=True)  # Change XXXX to any available port
```

### Missing Data
Some stocks may not have complete fundamental data available. This is normal for:
- Recently IPO'd companies
- Foreign stocks
- OTC/Pink sheet stocks
- Cryptocurrencies

### Slow Loading
First-time requests may be slower as yfinance fetches and caches data. Subsequent requests will be faster.

## License

This project uses the yfinance library which is distributed under the Apache Software License.

## Disclaimer

This application is for educational and research purposes only. The data provided should not be used as the sole basis for investment decisions. Always conduct thorough research and consult with qualified financial advisors before making investment decisions.

Yahoo!, Y!Finance, and Yahoo! finance are registered trademarks of Yahoo, Inc. This application is not affiliated with, endorsed by, or vetted by Yahoo, Inc.
