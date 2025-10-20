# Quick Start - Deploy to Cloudflare Pages

Get your Stock Analysis app live in ~10 minutes! 🚀

## Step 1: Deploy Backend (5 minutes)

### Using Render (Easiest, Free Tier)

1. Go to **https://render.com** → Sign up/Login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub: **madiwelakombuwa/stock-analysis-app**
4. Configure:
   ```
   Name: stock-analysis-backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: python stock_analysis_app.py
   ```
5. Click **"Create Web Service"** → Wait 2-3 minutes
6. **Copy your URL**: `https://stock-analysis-backend-xxxx.onrender.com`

✅ Backend deployed!

---

## Step 2: Deploy Frontend (5 minutes)

### Option A: Using Wrangler CLI

```bash
# 1. Install Wrangler (if not installed)
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Deploy
wrangler pages deploy public --project-name stock-analysis-app

# 4. Set environment variable
wrangler pages secret put BACKEND_URL
# When prompted, paste: https://stock-analysis-backend-xxxx.onrender.com
```

### Option B: Using Cloudflare Dashboard

1. Go to **https://dash.cloudflare.com** → **Pages**
2. Click **"Create a project"** → **"Connect to Git"**
3. Select repository: **stock-analysis-app**
4. Configure:
   ```
   Build command: (leave empty)
   Build output directory: public
   ```
5. Click **"Save and Deploy"**
6. After deployment, go to **Settings** → **Environment variables**
7. Add variable:
   ```
   Name: BACKEND_URL
   Value: https://stock-analysis-backend-xxxx.onrender.com
   ```

✅ Frontend deployed!

---

## Step 3: Test Your App

1. Visit: `https://stock-analysis-app.pages.dev`
2. Search for a stock: Try **"AAPL"** or **"TSLA"**
3. Explore features:
   - 📊 8 Pillars Analysis
   - 📈 Price Charts with Golden/Death Cross
   - 📰 Stock News
   - 🤖 AI Insights (requires OpenAI API key)
   - 📄 PDF Reports

---

## Optional: Add OpenAI API Key

For AI-powered insights:

1. Get API key from: https://platform.openai.com/api-keys
2. In your app, click **Settings** (⚙️ icon)
3. Paste your API key and save
4. Go to **"AI Insights"** tab to see AI analysis

---

## Troubleshooting

### "Failed to fetch stock data"
- Wait 30 seconds if using Render free tier (cold start)
- Check that `BACKEND_URL` is set correctly in Cloudflare
- Verify backend is running: Visit your Render dashboard

### API calls not working
- Ensure `BACKEND_URL` includes `https://`
- No trailing slash in the URL
- Redeploy Cloudflare Pages after adding environment variable

### Still having issues?
Check the full docs: `DEPLOYMENT.md` or `BACKEND_DEPLOYMENT.md`

---

## What's Next?

- 🌐 **Custom Domain**: Set up in Cloudflare Pages → Custom domains
- 📊 **Analytics**: Enable Cloudflare Web Analytics
- ⚡ **Performance**: Enable caching for API responses
- 🔒 **Security**: Add rate limiting to backend
- 💰 **Upgrade**: Move to paid tier to avoid cold starts

---

## Architecture Summary

```
User Browser
    ↓
Cloudflare Pages (Frontend)
    ↓
Worker Functions (API Proxy)
    ↓
Python Flask Backend (Render/Railway/Fly.io)
    ↓
External APIs (yfinance, OpenAI)
```

---

## Cost Breakdown

- **Cloudflare Pages**: FREE (unlimited requests)
- **Render Free Tier**: FREE (with cold starts)
- **OpenAI API**: Pay per use (~$0.01-0.10 per analysis)

**Total**: $0/month for light usage

---

## Support & Documentation

- **Full Deployment Guide**: `DEPLOYMENT.md`
- **Backend Options**: `BACKEND_DEPLOYMENT.md`
- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Render Docs**: https://render.com/docs

---

**Made with ❤️ using Cloudflare Pages + Python Flask**

Last updated: 2025-10-20
