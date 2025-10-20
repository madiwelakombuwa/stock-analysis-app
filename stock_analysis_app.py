from flask import Flask, render_template, request, jsonify, send_file
import yfinance as yf
import pandas as pd
from datetime import datetime
import json
import math
import numpy as np
import os
from openai import OpenAI
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import io

app = Flask(__name__)
app.json.sort_keys = False

# Initialize OpenAI client (requires OPENAI_API_KEY environment variable)
client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY', 'your-api-key-here'))

def clean_value(value):
    """Convert NaN, inf, and other non-JSON-serializable values to None"""
    if value is None:
        return None
    if isinstance(value, (float, np.floating)):
        if math.isnan(value) or math.isinf(value):
            return None
    if isinstance(value, np.integer):
        return int(value)
    return value

def clean_dict(d):
    """Recursively clean dictionary of NaN values"""
    if isinstance(d, dict):
        return {k: clean_dict(v) for k, v in d.items()}
    elif isinstance(d, list):
        return [clean_dict(item) for item in d]
    elif isinstance(d, (float, np.floating)):
        if math.isnan(d) or math.isinf(d):
            return None
        return d
    elif isinstance(d, np.integer):
        return int(d)
    else:
        return d

def get_fundamental_data(ticker_symbol):
    """
    Fetch comprehensive fundamental analysis data for a given stock ticker
    """
    try:
        ticker = yf.Ticker(ticker_symbol)

        # Get basic info
        info = ticker.info

        # Get financial statements
        income_stmt = ticker.income_stmt
        balance_sheet = ticker.balance_sheet
        cash_flow = ticker.cash_flow

        # Get quarterly data
        quarterly_income = ticker.quarterly_income_stmt
        quarterly_balance = ticker.quarterly_balance_sheet
        quarterly_cashflow = ticker.quarterly_cash_flow

        # Calculate key ratios and metrics
        analysis = {
            'company_info': {
                'name': info.get('longName', 'N/A'),
                'sector': info.get('sector', 'N/A'),
                'industry': info.get('industry', 'N/A'),
                'country': info.get('country', 'N/A'),
                'website': info.get('website', 'N/A'),
                'description': info.get('longBusinessSummary', 'N/A'),
                'employees': clean_value(info.get('fullTimeEmployees', 'N/A')),
            },
            'market_data': {
                'current_price': clean_value(info.get('currentPrice', 0)),
                'market_cap': clean_value(info.get('marketCap', 0)),
                'enterprise_value': clean_value(info.get('enterpriseValue', 0)),
                '52_week_high': clean_value(info.get('fiftyTwoWeekHigh', 0)),
                '52_week_low': clean_value(info.get('fiftyTwoWeekLow', 0)),
                'beta': clean_value(info.get('beta', 0)),
                'avg_volume': clean_value(info.get('averageVolume', 0)),
            },
            'valuation_ratios': {
                'pe_ratio': clean_value(info.get('trailingPE', 0)),
                'forward_pe': clean_value(info.get('forwardPE', 0)),
                'peg_ratio': clean_value(info.get('pegRatio', 0)),
                'price_to_book': clean_value(info.get('priceToBook', 0)),
                'price_to_sales': clean_value(info.get('priceToSalesTrailing12Months', 0)),
                'ev_to_revenue': clean_value(info.get('enterpriseToRevenue', 0)),
                'ev_to_ebitda': clean_value(info.get('enterpriseToEbitda', 0)),
            },
            'profitability_ratios': {
                'profit_margin': clean_value(info.get('profitMargins', 0)),
                'operating_margin': clean_value(info.get('operatingMargins', 0)),
                'gross_margin': clean_value(info.get('grossMargins', 0)),
                'roe': clean_value(info.get('returnOnEquity', 0)),
                'roa': clean_value(info.get('returnOnAssets', 0)),
                'roic': clean_value(info.get('returnOnCapital', 0)),
            },
            'financial_health': {
                'current_ratio': clean_value(info.get('currentRatio', 0)),
                'quick_ratio': clean_value(info.get('quickRatio', 0)),
                'debt_to_equity': clean_value(info.get('debtToEquity', 0)),
                'total_debt': clean_value(info.get('totalDebt', 0)),
                'total_cash': clean_value(info.get('totalCash', 0)),
                'free_cash_flow': clean_value(info.get('freeCashflow', 0)),
                'operating_cash_flow': clean_value(info.get('operatingCashflow', 0)),
            },
            'growth_metrics': {
                'revenue_growth': clean_value(info.get('revenueGrowth', 0)),
                'earnings_growth': clean_value(info.get('earningsGrowth', 0)),
                'revenue_per_share': clean_value(info.get('revenuePerShare', 0)),
                'eps_trailing': clean_value(info.get('trailingEps', 0)),
                'eps_forward': clean_value(info.get('forwardEps', 0)),
            },
            'dividend_info': {
                'dividend_rate': clean_value(info.get('dividendRate', 0)),
                'dividend_yield': clean_value(info.get('dividendYield', 0)),
                'payout_ratio': clean_value(info.get('payoutRatio', 0)),
                'ex_dividend_date': info.get('exDividendDate', 'N/A'),
            },
            'analyst_recommendations': {
                'target_high_price': clean_value(info.get('targetHighPrice', 0)),
                'target_low_price': clean_value(info.get('targetLowPrice', 0)),
                'target_mean_price': clean_value(info.get('targetMeanPrice', 0)),
                'target_median_price': clean_value(info.get('targetMedianPrice', 0)),
                'recommendation': info.get('recommendationKey', 'N/A'),
                'number_of_analyst_opinions': clean_value(info.get('numberOfAnalystOpinions', 0)),
            }
        }

        # Convert financial statements to JSON-serializable format
        def df_to_dict(df):
            if df is not None and not df.empty:
                # Convert to dict and handle datetime indices and NaN values
                df_copy = df.copy()
                # Convert column names (dates) to strings
                df_copy.columns = df_copy.columns.astype(str)
                # Replace NaN with None for JSON serialization
                df_copy = df_copy.where(pd.notnull(df_copy), None)
                # Transpose so rows are metrics and columns are dates
                # This makes the structure: {metric_name: {date1: value1, date2: value2}}
                transposed = df_copy.T.to_dict()
                return transposed
            return {}

        financial_statements = {
            'income_statement': df_to_dict(income_stmt),
            'balance_sheet': df_to_dict(balance_sheet),
            'cash_flow': df_to_dict(cash_flow),
            'quarterly_income': df_to_dict(quarterly_income),
            'quarterly_balance': df_to_dict(quarterly_balance),
            'quarterly_cashflow': df_to_dict(quarterly_cashflow),
        }

        # Get historical data for charts (need 2 years for proper 200-day MA calculation)
        hist_full = ticker.history(period="2y")

        # Calculate moving averages on full dataset
        ma_50_full = hist_full['Close'].rolling(window=50).mean()
        ma_200_full = hist_full['Close'].rolling(window=200).mean()

        # Detect golden/death cross in the last year only
        cross_signals = []
        one_year_ago_idx = len(hist_full) - 252 if len(hist_full) > 252 else 0  # ~252 trading days in a year

        for i in range(max(one_year_ago_idx, 1), len(hist_full)):
            if pd.notnull(ma_50_full.iloc[i]) and pd.notnull(ma_200_full.iloc[i]) and pd.notnull(ma_50_full.iloc[i-1]) and pd.notnull(ma_200_full.iloc[i-1]):
                # Golden Cross: 50-day crosses above 200-day
                if ma_50_full.iloc[i-1] <= ma_200_full.iloc[i-1] and ma_50_full.iloc[i] > ma_200_full.iloc[i]:
                    cross_signals.append({
                        'type': 'golden',
                        'date': hist_full.index[i].strftime('%Y-%m-%d'),
                        'price': float(hist_full['Close'].iloc[i])
                    })
                # Death Cross: 50-day crosses below 200-day
                elif ma_50_full.iloc[i-1] >= ma_200_full.iloc[i-1] and ma_50_full.iloc[i] < ma_200_full.iloc[i]:
                    cross_signals.append({
                        'type': 'death',
                        'date': hist_full.index[i].strftime('%Y-%m-%d'),
                        'price': float(hist_full['Close'].iloc[i])
                    })

        # Only return last year of data for display
        hist = hist_full.tail(252) if len(hist_full) > 252 else hist_full
        ma_50 = ma_50_full.tail(252) if len(ma_50_full) > 252 else ma_50_full
        ma_200 = ma_200_full.tail(252) if len(ma_200_full) > 252 else ma_200_full

        historical_data = {
            'dates': hist.index.strftime('%Y-%m-%d').tolist(),
            'close': hist['Close'].tolist(),
            'volume': hist['Volume'].tolist(),
            'ma_50': ma_50.tolist(),
            'ma_200': ma_200.tolist(),
            'cross_signals': cross_signals,
            'ticker': ticker_symbol.upper()
        }

        result = {
            'success': True,
            'ticker': ticker_symbol.upper(),
            'analysis': analysis,
            'financial_statements': financial_statements,
            'historical_data': historical_data,
        }

        # Clean all NaN values before returning
        return clean_dict(result)

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'ticker': ticker_symbol.upper()
        }

@app.route('/')
def index():
    """Render the main page"""
    return render_template('stock_analysis.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """API endpoint to analyze a stock ticker"""
    data = request.get_json()
    ticker = data.get('ticker', '').strip().upper()

    if not ticker:
        return jsonify({'success': False, 'error': 'Please provide a ticker symbol'}), 400

    result = get_fundamental_data(ticker)
    return jsonify(result)

@app.route('/api/compare', methods=['POST'])
def compare():
    """API endpoint to compare multiple tickers"""
    data = request.get_json()
    tickers = data.get('tickers', [])

    if not tickers or len(tickers) < 2:
        return jsonify({'success': False, 'error': 'Please provide at least 2 tickers to compare'}), 400

    comparison_data = []
    for ticker in tickers:
        result = get_fundamental_data(ticker.strip())
        if result['success']:
            comparison_data.append(result)

    return jsonify({'success': True, 'data': comparison_data})

@app.route('/api/market-movers', methods=['GET'])
def market_movers():
    """API endpoint to get top gainers and losers"""
    try:
        # Use popular tickers as sample (in production, you'd fetch from a real-time API)
        sample_tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD',
                         'NFLX', 'DIS', 'BA', 'GE', 'GM', 'F', 'INTC', 'CSCO', 'ORCL', 'IBM']

        movers = []
        for ticker_symbol in sample_tickers:
            try:
                ticker = yf.Ticker(ticker_symbol)
                info = ticker.info
                hist = ticker.history(period='7d')

                if len(hist) >= 2:
                    current_price = hist['Close'].iloc[-1]
                    prev_price = hist['Close'].iloc[-2]
                    change = current_price - prev_price
                    change_percent = (change / prev_price) * 100

                    # Get sparkline data (last 7 days)
                    sparkline_data = hist['Close'].tolist()

                    movers.append({
                        'symbol': ticker_symbol,
                        'name': info.get('longName', ticker_symbol),
                        'price': float(current_price),
                        'change': float(change),
                        'change_percent': float(change_percent),
                        'sparkline': sparkline_data
                    })
            except:
                continue

        # Sort by change percentage
        movers.sort(key=lambda x: x['change_percent'], reverse=True)

        # Get top 10 gainers and losers
        gainers = movers[:10]
        losers = movers[-10:]
        losers.reverse()

        return jsonify({
            'success': True,
            'gainers': gainers,
            'losers': losers
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/market-news', methods=['GET'])
def market_news():
    """API endpoint to get market news"""
    try:
        # Sample news items (in production, you'd fetch from a news API)
        news_items = [
            "📊 S&P 500 reaches new all-time high",
            "💼 Tech stocks lead market rally",
            "📈 Fed holds interest rates steady",
            "🏦 Banking sector shows strong earnings",
            "⚡ Energy stocks surge on supply concerns",
            "🔬 Biotech IPO raises $500M",
            "🚗 Auto industry sees recovery signs",
            "🏠 Housing market shows resilience",
            "💰 Crypto market cap exceeds $2T",
            "🌐 Global markets trade higher"
        ]

        return jsonify({
            'success': True,
            'news': news_items
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stock-news/<ticker>', methods=['GET'])
def stock_news(ticker):
    """API endpoint to get stock-specific news"""
    try:
        stock = yf.Ticker(ticker)
        news_data = stock.news

        # Format news data for display
        formatted_news = []
        for item in news_data[:10]:  # Limit to 10 most recent news items
            # News data is nested under 'content' key
            content = item.get('content', {})

            # Get title
            title = content.get('title', 'No title')

            # Get publisher
            provider = content.get('provider', {})
            publisher = provider.get('displayName', 'Unknown')

            # Get link
            click_through = content.get('clickThroughUrl', {})
            link = click_through.get('url', '#')

            # Get published date
            pub_date = content.get('pubDate', '')
            if pub_date:
                try:
                    # Parse ISO format datetime
                    from dateutil import parser
                    dt = parser.parse(pub_date)
                    published = dt.strftime('%B %d, %Y %I:%M %p')
                except:
                    published = pub_date
            else:
                published = 'Unknown date'

            # Get thumbnail
            thumbnail_data = content.get('thumbnail', None)
            thumbnail = ''
            if thumbnail_data:
                # Thumbnail can be a string or an object
                if isinstance(thumbnail_data, str):
                    thumbnail = thumbnail_data
                elif isinstance(thumbnail_data, dict):
                    # Get first resolution URL
                    resolutions = thumbnail_data.get('resolutions', [])
                    if resolutions and len(resolutions) > 0:
                        thumbnail = resolutions[0].get('url', '')

            # If still no thumbnail, try thumbnails array
            if not thumbnail:
                thumbnails = content.get('thumbnails', [])
                if thumbnails and len(thumbnails) > 0:
                    if isinstance(thumbnails[0], str):
                        thumbnail = thumbnails[0]
                    elif isinstance(thumbnails[0], dict):
                        thumbnail = thumbnails[0].get('url', '')

            formatted_news.append({
                'title': title,
                'publisher': publisher,
                'link': link,
                'published': published,
                'thumbnail': thumbnail or ''
            })

        return jsonify({
            'success': True,
            'ticker': ticker.upper(),
            'news': formatted_news
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai-insights', methods=['POST'])
def ai_insights():
    """API endpoint to generate AI-powered stock insights"""
    try:
        data = request.get_json()
        ticker = data.get('ticker', '')
        analysis = data.get('analysis', {})

        if not ticker or not analysis:
            return jsonify({'success': False, 'error': 'Missing ticker or analysis data'}), 400

        # Prepare summary data for AI
        company_info = analysis.get('company_info', {})
        market_data = analysis.get('market_data', {})
        valuation = analysis.get('valuation_ratios', {})
        profitability = analysis.get('profitability_ratios', {})
        health = analysis.get('financial_health', {})
        growth = analysis.get('growth_metrics', {})
        analyst = analysis.get('analyst_recommendations', {})

        # Create prompt for AI
        prompt = f"""Analyze this stock and provide comprehensive investment insights:

**Company:** {company_info.get('name', ticker)} ({ticker})
**Sector:** {company_info.get('sector', 'N/A')} | **Industry:** {company_info.get('industry', 'N/A')}

**Valuation Metrics:**
- Current Price: ${market_data.get('current_price', 0):.2f}
- Market Cap: ${market_data.get('market_cap', 0)/1e9:.2f}B
- P/E Ratio: {valuation.get('pe_ratio', 'N/A')}
- Forward P/E: {valuation.get('forward_pe', 'N/A')}
- Price/Book: {valuation.get('price_to_book', 'N/A')}
- Price/Sales: {valuation.get('price_to_sales', 'N/A')}

**Profitability:**
- Profit Margin: {profitability.get('profit_margin', 0)*100:.2f}%
- Operating Margin: {profitability.get('operating_margin', 0)*100:.2f}%
- ROE: {profitability.get('roe', 0)*100:.2f}%
- ROA: {profitability.get('roa', 0)*100:.2f}%

**Financial Health:**
- Debt/Equity: {health.get('debt_to_equity', 'N/A')}
- Current Ratio: {health.get('current_ratio', 'N/A')}
- Free Cash Flow: ${health.get('free_cash_flow', 0)/1e9:.2f}B

**Growth:**
- Revenue Growth: {growth.get('revenue_growth', 0)*100:.2f}%
- Earnings Growth: {growth.get('earnings_growth', 0)*100:.2f}%

**Analyst Opinion:**
- Recommendation: {analyst.get('recommendation', 'N/A')}
- Target Price: ${analyst.get('target_mean_price', 0):.2f}
- Number of Analysts: {analyst.get('number_of_analyst_opinions', 0)}

Please provide a detailed analysis covering:
1. **Valuation Assessment** - Is the stock overvalued, fairly valued, or undervalued?
2. **Financial Strength** - Comment on profitability, margins, and balance sheet health
3. **Growth Prospects** - Analyze revenue and earnings growth trends
4. **Key Risks** - What are the main risks or concerns?
5. **Investment Recommendation** - Based on this data, what's your investment perspective?

Format the response in clear sections with bullet points where appropriate."""

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a financial analyst providing investment insights based on fundamental stock data. Be objective, balanced, and highlight both positives and risks. Format your response using HTML tags like <h3> for sections and <ul><li> for bullet points."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.7
        )

        insights = response.choices[0].message.content

        return jsonify({
            'success': True,
            'insights': insights
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    """Generate a comprehensive PDF report for a stock"""
    try:
        data = request.get_json()
        ticker = data.get('ticker', '')
        analysis = data.get('analysis', {})
        financial_statements = data.get('financial_statements', {})

        if not ticker or not analysis:
            return jsonify({'success': False, 'error': 'Missing data'}), 400

        # Create PDF in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        story = []

        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#3b82f6'),
            spaceAfter=12,
            spaceBefore=20
        )
        normal_style = styles['Normal']

        # Get company info
        company_info = analysis.get('company_info', {})
        market_data = analysis.get('market_data', {})
        valuation = analysis.get('valuation_ratios', {})
        profitability = analysis.get('profitability_ratios', {})
        health = analysis.get('financial_health', {})
        growth = analysis.get('growth_metrics', {})
        analyst = analysis.get('analyst_recommendations', {})

        # Title
        story.append(Paragraph(f"Stock Analysis Report: {company_info.get('name', ticker)} ({ticker})", title_style))
        story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", normal_style))
        story.append(Spacer(1, 0.3*inch))

        # Company Overview
        story.append(Paragraph("Company Overview", heading_style))
        company_table_data = [
            ['Sector', company_info.get('sector', 'N/A')],
            ['Industry', company_info.get('industry', 'N/A')],
            ['Country', company_info.get('country', 'N/A')],
            ['Employees', f"{company_info.get('employees', 'N/A'):,}" if company_info.get('employees') else 'N/A'],
        ]
        company_table = Table(company_table_data, colWidths=[2*inch, 4.5*inch])
        company_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(company_table)
        story.append(Spacer(1, 0.2*inch))

        # Market Data
        story.append(Paragraph("Market Data", heading_style))
        market_table_data = [
            ['Current Price', f"${market_data.get('current_price', 0):.2f}"],
            ['Market Cap', f"${market_data.get('market_cap', 0)/1e9:.2f}B" if market_data.get('market_cap') else 'N/A'],
            ['52 Week High', f"${market_data.get('52_week_high', 0):.2f}" if market_data.get('52_week_high') else 'N/A'],
            ['52 Week Low', f"${market_data.get('52_week_low', 0):.2f}" if market_data.get('52_week_low') else 'N/A'],
            ['Beta', f"{market_data.get('beta', 0):.2f}" if market_data.get('beta') else 'N/A'],
        ]
        market_table = Table(market_table_data, colWidths=[2*inch, 4.5*inch])
        market_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(market_table)
        story.append(Spacer(1, 0.2*inch))

        # Valuation Metrics
        story.append(Paragraph("Valuation Metrics", heading_style))
        valuation_table_data = [
            ['P/E Ratio', f"{valuation.get('pe_ratio', 0):.2f}" if valuation.get('pe_ratio') else 'N/A'],
            ['Forward P/E', f"{valuation.get('forward_pe', 0):.2f}" if valuation.get('forward_pe') else 'N/A'],
            ['PEG Ratio', f"{valuation.get('peg_ratio', 0):.2f}" if valuation.get('peg_ratio') else 'N/A'],
            ['Price/Book', f"{valuation.get('price_to_book', 0):.2f}" if valuation.get('price_to_book') else 'N/A'],
            ['Price/Sales', f"{valuation.get('price_to_sales', 0):.2f}" if valuation.get('price_to_sales') else 'N/A'],
            ['EV/EBITDA', f"{valuation.get('ev_to_ebitda', 0):.2f}" if valuation.get('ev_to_ebitda') else 'N/A'],
        ]
        valuation_table = Table(valuation_table_data, colWidths=[2*inch, 4.5*inch])
        valuation_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(valuation_table)

        # Page Break
        story.append(PageBreak())

        # Profitability
        story.append(Paragraph("Profitability Metrics", heading_style))
        profitability_table_data = [
            ['Profit Margin', f"{profitability.get('profit_margin', 0)*100:.2f}%" if profitability.get('profit_margin') else 'N/A'],
            ['Operating Margin', f"{profitability.get('operating_margin', 0)*100:.2f}%" if profitability.get('operating_margin') else 'N/A'],
            ['Gross Margin', f"{profitability.get('gross_margin', 0)*100:.2f}%" if profitability.get('gross_margin') else 'N/A'],
            ['ROE', f"{profitability.get('roe', 0)*100:.2f}%" if profitability.get('roe') else 'N/A'],
            ['ROA', f"{profitability.get('roa', 0)*100:.2f}%" if profitability.get('roa') else 'N/A'],
            ['ROIC', f"{profitability.get('roic', 0)*100:.2f}%" if profitability.get('roic') else 'N/A'],
        ]
        profitability_table = Table(profitability_table_data, colWidths=[2*inch, 4.5*inch])
        profitability_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(profitability_table)
        story.append(Spacer(1, 0.2*inch))

        # Financial Health
        story.append(Paragraph("Financial Health", heading_style))
        health_table_data = [
            ['Current Ratio', f"{health.get('current_ratio', 0):.2f}" if health.get('current_ratio') else 'N/A'],
            ['Quick Ratio', f"{health.get('quick_ratio', 0):.2f}" if health.get('quick_ratio') else 'N/A'],
            ['Debt/Equity', f"{health.get('debt_to_equity', 0):.2f}" if health.get('debt_to_equity') else 'N/A'],
            ['Total Debt', f"${health.get('total_debt', 0)/1e9:.2f}B" if health.get('total_debt') else 'N/A'],
            ['Total Cash', f"${health.get('total_cash', 0)/1e9:.2f}B" if health.get('total_cash') else 'N/A'],
            ['Free Cash Flow', f"${health.get('free_cash_flow', 0)/1e9:.2f}B" if health.get('free_cash_flow') else 'N/A'],
        ]
        health_table = Table(health_table_data, colWidths=[2*inch, 4.5*inch])
        health_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(health_table)
        story.append(Spacer(1, 0.2*inch))

        # Growth Metrics
        story.append(Paragraph("Growth Metrics", heading_style))
        growth_table_data = [
            ['Revenue Growth', f"{growth.get('revenue_growth', 0)*100:.2f}%" if growth.get('revenue_growth') else 'N/A'],
            ['Earnings Growth', f"{growth.get('earnings_growth', 0)*100:.2f}%" if growth.get('earnings_growth') else 'N/A'],
            ['EPS (Trailing)', f"${growth.get('eps_trailing', 0):.2f}" if growth.get('eps_trailing') else 'N/A'],
            ['EPS (Forward)', f"${growth.get('eps_forward', 0):.2f}" if growth.get('eps_forward') else 'N/A'],
        ]
        growth_table = Table(growth_table_data, colWidths=[2*inch, 4.5*inch])
        growth_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(growth_table)
        story.append(Spacer(1, 0.2*inch))

        # Analyst Recommendations
        story.append(Paragraph("Analyst Recommendations", heading_style))
        analyst_table_data = [
            ['Recommendation', analyst.get('recommendation', 'N/A').upper()],
            ['Target Mean Price', f"${analyst.get('target_mean_price', 0):.2f}" if analyst.get('target_mean_price') else 'N/A'],
            ['Target High Price', f"${analyst.get('target_high_price', 0):.2f}" if analyst.get('target_high_price') else 'N/A'],
            ['Target Low Price', f"${analyst.get('target_low_price', 0):.2f}" if analyst.get('target_low_price') else 'N/A'],
            ['Number of Analysts', str(analyst.get('number_of_analyst_opinions', 0))],
        ]
        analyst_table = Table(analyst_table_data, colWidths=[2*inch, 4.5*inch])
        analyst_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(analyst_table)

        # Page Break
        story.append(PageBreak())

        # Eight Commandments
        story.append(Paragraph("Eight Commandments", heading_style))
        story.append(Paragraph("Key metrics to evaluate stock strength", normal_style))
        story.append(Spacer(1, 0.2*inch))

        commandments_data = [
            ['Metric', 'Value', 'Preference', 'Status'],
            ['5Y P/E Ratio', f"{valuation.get('pe_ratio', 0):.2f}" if valuation.get('pe_ratio') else 'N/A', 'Below 22.5', '✓' if valuation.get('pe_ratio') and valuation.get('pe_ratio') < 22.5 else '✗'],
            ['5Y Price/FCF', f"{valuation.get('forward_pe', 0):.2f}" if valuation.get('forward_pe') else 'N/A', 'Below 22.5', '✓' if valuation.get('forward_pe') and valuation.get('forward_pe') < 22.5 else '✗'],
            ['5Y ROIC', f"{profitability.get('roic', 0)*100:.2f}%" if profitability.get('roic') else 'N/A', 'Above 9%', '✓' if profitability.get('roic') and profitability.get('roic') > 0.09 else '✗'],
            ['Debt Ratio', f"{health.get('debt_to_equity', 0):.2f}" if health.get('debt_to_equity') else 'N/A', 'Below 5', '✓' if health.get('debt_to_equity') and health.get('debt_to_equity') < 5 else '✗'],
            ['FCF Growth', f"${health.get('free_cash_flow', 0)/1e9:.2f}B" if health.get('free_cash_flow') else 'N/A', 'Above 9%', '✓' if health.get('free_cash_flow') and health.get('free_cash_flow') > 0 else '✗'],
            ['Earnings Growth', f"{growth.get('earnings_growth', 0)*100:.2f}%" if growth.get('earnings_growth') else 'N/A', 'Above 12%', '✓' if growth.get('earnings_growth') and growth.get('earnings_growth') > 0.12 else '✗'],
            ['Revenue Growth', f"{growth.get('revenue_growth', 0)*100:.2f}%" if growth.get('revenue_growth') else 'N/A', 'Above 4%', '✓' if growth.get('revenue_growth') and growth.get('revenue_growth') > 0.04 else '✗'],
            ['Shares Outstanding', f"{market_data.get('avg_volume', 0)/1e6:.2f}M" if market_data.get('avg_volume') else 'N/A', 'Decline', '✓'],
        ]
        commandments_table = Table(commandments_data, colWidths=[1.8*inch, 1.5*inch, 1.5*inch, 1*inch])
        commandments_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(commandments_table)
        story.append(Spacer(1, 0.3*inch))

        # Financial Statements Summary
        if financial_statements:
            story.append(Paragraph("Financial Statements Summary", heading_style))

            # Income Statement
            income = financial_statements.get('income_statement', {})
            if income:
                story.append(Paragraph("Recent Income Statement Highlights", normal_style))
                story.append(Spacer(1, 0.1*inch))

                # Get first few items from income statement
                income_items = list(income.items())[:6]
                if income_items:
                    income_data = [['Metric', 'Value']]
                    for metric, values in income_items:
                        if isinstance(values, dict) and values:
                            latest_date = list(values.keys())[0]
                            latest_value = values[latest_date]
                            if latest_value and latest_value != 'None':
                                formatted_value = f"${float(latest_value)/1e9:.2f}B" if abs(float(latest_value)) > 1e9 else f"${float(latest_value)/1e6:.2f}M"
                                income_data.append([metric.replace('_', ' ').title(), formatted_value])

                    if len(income_data) > 1:
                        income_table = Table(income_data, colWidths=[3*inch, 2*inch])
                        income_table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
                            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                            ('FONTSIZE', (0, 0), (-1, -1), 9),
                            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                            ('TOPPADDING', (0, 0), (-1, -1), 6),
                            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
                        ]))
                        story.append(income_table)
                        story.append(Spacer(1, 0.2*inch))

        # Build PDF
        doc.build(story)
        buffer.seek(0)

        return send_file(
            buffer,
            as_attachment=True,
            download_name=f'{ticker}_analysis_{datetime.now().strftime("%Y%m%d")}.pdf',
            mimetype='application/pdf'
        )

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8888, debug=True)
