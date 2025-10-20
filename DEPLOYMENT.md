# Stock Analysis App - Cloudflare Pages Deployment Guide

This guide will help you deploy your Stock Analysis application using **Cloudflare Pages** for the frontend and **Worker Functions** to proxy API calls to your Python backend.

## Architecture Overview

- **Frontend**: Deployed on Cloudflare Pages (HTML, CSS, JS)
- **Worker Functions**: Serverless functions on Cloudflare that proxy API requests
- **Backend**: Python Flask app hosted separately (Render, Railway, Fly.io, etc.)

## Prerequisites

1. **Cloudflare Account** - Sign up at https://dash.cloudflare.com/sign-up
2. **Wrangler CLI** - Install with: `npm install -g wrangler`
3. **Python Backend Hosting** - Choose one:
   - [Render](https://render.com) (Recommended, has free tier)
   - [Railway](https://railway.app)
   - [Fly.io](https://fly.io)
   - Any other Python hosting service

## Step 1: Deploy Python Backend

### Option A: Deploy to Render

1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `stock-analysis-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python stock_analysis_app.py`
5. Add environment variable:
   - `OPENAI_API_KEY` = (optional, can be set per-user in frontend)
6. Click "Create Web Service"
7. Wait for deployment and copy the URL (e.g., `https://stock-analysis-backend.onrender.com`)

### Option B: Deploy to Railway

1. Go to https://railway.app and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Python and deploy
5. Add environment variables in the "Variables" tab:
   - `PORT` = `8888`
   - `OPENAI_API_KEY` = (optional)
6. Get your deployment URL from the "Settings" tab

### Option C: Deploy to Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Initialize and deploy
flyctl launch --name stock-analysis-backend
flyctl deploy
```

## Step 2: Deploy to Cloudflare Pages

### Option A: Deploy via Wrangler CLI (Recommended)

1. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

2. **Set your backend URL as a secret**:
   ```bash
   # Replace with your actual backend URL from Step 1
   wrangler pages secret put BACKEND_URL
   # When prompted, enter: https://your-backend-url.onrender.com
   ```

3. **Deploy to Cloudflare Pages**:
   ```bash
   wrangler pages deploy public --project-name stock-analysis-app
   ```

4. **Set environment variable in Cloudflare Dashboard**:
   - Go to https://dash.cloudflare.com
   - Navigate to "Pages" → "stock-analysis-app" → "Settings" → "Environment variables"
   - Add variable:
     - **Variable name**: `BACKEND_URL`
     - **Value**: `https://your-backend-url.onrender.com` (from Step 1)
     - **Environment**: Production and Preview

### Option B: Deploy via GitHub (Automatic Deployments)

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Add Cloudflare Pages configuration"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**:
   - Go to https://dash.cloudflare.com
   - Navigate to "Pages" → "Create a project"
   - Select "Connect to Git"
   - Choose your repository
   - Configure build settings:
     - **Build command**: (leave empty)
     - **Build output directory**: `public`
   - Click "Save and Deploy"

3. **Set environment variables**:
   - In Cloudflare Pages dashboard, go to "Settings" → "Environment variables"
   - Add:
     - **Variable name**: `BACKEND_URL`
     - **Value**: `https://your-backend-url.onrender.com`

## Step 3: Test Your Deployment

1. Visit your Cloudflare Pages URL (e.g., `https://stock-analysis-app.pages.dev`)
2. Try searching for a stock ticker (e.g., "AAPL")
3. Verify all features work:
   - Stock analysis
   - Market movers
   - AI insights (requires OpenAI API key)
   - PDF generation

## Environment Variables

### Backend (Python Flask)
- `OPENAI_API_KEY` - (Optional) OpenAI API key for AI insights
- `PORT` - Port number (default: 8888)

### Frontend (Cloudflare Pages)
- `BACKEND_URL` - URL of your Python backend (Required)

## Custom Domain (Optional)

1. In Cloudflare Pages dashboard, go to "Custom domains"
2. Click "Set up a custom domain"
3. Enter your domain name
4. Follow the DNS configuration instructions

## Troubleshooting

### Issue: API calls failing with CORS errors
- Ensure `BACKEND_URL` environment variable is set correctly in Cloudflare Pages
- Check that your Python backend is running and accessible

### Issue: "Failed to fetch stock data"
- Verify your backend is deployed and running
- Check backend logs for errors
- Ensure the backend URL in Cloudflare matches your deployment

### Issue: AI Insights not working
- Set your OpenAI API key in the frontend Settings modal
- Or set `OPENAI_API_KEY` environment variable in your backend

### Issue: PDF generation fails
- Ensure all required Python packages are installed on backend
- Check backend logs for reportlab errors

## Local Development

To test locally before deploying:

1. **Run Python backend**:
   ```bash
   pip install -r requirements.txt
   python stock_analysis_app.py
   ```

2. **Test with local functions**:
   ```bash
   wrangler pages dev public --port 8787
   ```

   Set environment variable:
   ```bash
   export BACKEND_URL=http://localhost:8888
   ```

## Cost Estimates

- **Cloudflare Pages**: Free tier includes unlimited requests
- **Render Free Tier**: Good for testing (spins down after inactivity)
- **Railway**: $5/month after free trial
- **Fly.io**: Free tier includes 3 shared VMs

## Security Notes

1. Never commit API keys to Git
2. Use environment variables for sensitive data
3. The OPENAI_API_KEY can be stored per-user in browser localStorage
4. Consider adding rate limiting to your backend

## Next Steps

- Set up monitoring for your backend
- Configure custom domain
- Add analytics (Cloudflare Web Analytics)
- Set up GitHub Actions for CI/CD
- Configure caching for better performance

## Support

For issues with:
- **Cloudflare Pages**: https://developers.cloudflare.com/pages/
- **Backend hosting**: Check your hosting provider's documentation
- **Application issues**: Check application logs

---

**Deployment Date**: $(date +%Y-%m-%d)
**Version**: 1.0.0
