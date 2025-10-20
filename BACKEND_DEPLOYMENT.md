# Backend Deployment Guide

Quick guide to deploy the Python Flask backend to various hosting platforms.

## Render.com Deployment (Recommended)

### Why Render?
- Free tier available
- Easy Python support
- Automatic HTTPS
- Simple deployment process

### Steps:

1. **Create Render Account**: https://render.com

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure Service**:
   ```
   Name: stock-analysis-backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: python stock_analysis_app.py
   ```

4. **Environment Variables** (Optional):
   ```
   OPENAI_API_KEY=your-key-here
   ```

5. **Deploy**: Click "Create Web Service"

6. **Copy URL**: After deployment, copy your URL (e.g., `https://stock-analysis-backend.onrender.com`)

7. **Update Cloudflare**: Add this URL as `BACKEND_URL` in Cloudflare Pages environment variables

---

## Railway Deployment

### Steps:

1. **Create Railway Account**: https://railway.app

2. **New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure**:
   - Railway auto-detects Python
   - Add environment variables:
     ```
     PORT=8888
     OPENAI_API_KEY=your-key-here (optional)
     ```

4. **Get URL**:
   - Go to "Settings" tab
   - Copy the deployment URL

5. **Update Cloudflare**: Add URL as `BACKEND_URL`

---

## Fly.io Deployment

### Prerequisites:
```bash
curl -L https://fly.io/install.sh | sh
```

### Steps:

1. **Create fly.toml**:
   ```toml
   app = "stock-analysis-backend"
   primary_region = "iad"

   [env]
     PORT = "8888"

   [http_service]
     internal_port = 8888
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0

   [[vm]]
     cpu_kind = "shared"
     cpus = 1
     memory_mb = 256
   ```

2. **Deploy**:
   ```bash
   flyctl auth login
   flyctl launch --no-deploy
   flyctl deploy
   ```

3. **Set Secrets**:
   ```bash
   flyctl secrets set OPENAI_API_KEY=your-key-here
   ```

4. **Get URL**:
   ```bash
   flyctl info
   ```

5. **Update Cloudflare**: Add URL as `BACKEND_URL`

---

## Heroku Deployment

### Steps:

1. **Install Heroku CLI**:
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Login**:
   ```bash
   heroku login
   ```

3. **Create App**:
   ```bash
   heroku create stock-analysis-backend
   ```

4. **Create Procfile**:
   ```
   web: python stock_analysis_app.py
   ```

5. **Deploy**:
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

6. **Set Environment Variables**:
   ```bash
   heroku config:set OPENAI_API_KEY=your-key-here
   ```

7. **Get URL**:
   ```bash
   heroku info
   ```

---

## Testing Your Backend

After deployment, test with:

```bash
# Replace with your backend URL
curl https://your-backend.onrender.com/api/market-news
```

You should see a JSON response with news items.

---

## Important Notes

1. **Free Tier Limitations**:
   - Render: Spins down after 15 minutes of inactivity (cold starts ~30s)
   - Railway: Limited free hours per month
   - Fly.io: Limited free tier resources

2. **Production Recommendations**:
   - Use paid tier for no cold starts
   - Add Redis for caching
   - Set up monitoring and alerts
   - Configure auto-scaling

3. **Security**:
   - Never commit API keys
   - Use environment variables
   - Enable HTTPS (automatic on all platforms)
   - Consider adding API rate limiting

4. **Performance**:
   - Consider adding caching for stock data
   - Use a CDN for static assets (Cloudflare handles this)
   - Monitor response times

---

## Cost Comparison

| Platform | Free Tier | Paid Tier |
|----------|-----------|-----------|
| Render | 750 hours/month | $7/month |
| Railway | $5 credit/month | $5/month per resource |
| Fly.io | 3 VMs, 256MB each | ~$2-10/month |
| Heroku | No free tier | $7/month |

---

## Next Steps After Deployment

1. Copy your backend URL
2. Set `BACKEND_URL` in Cloudflare Pages
3. Test all API endpoints
4. Monitor logs for errors
5. Set up uptime monitoring (e.g., UptimeRobot)
