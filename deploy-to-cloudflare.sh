#!/bin/bash
# Cloudflare Pages Deployment Script
# Run this after completing backend deployment

set -e

echo "================================================"
echo "Stock Analysis App - Cloudflare Pages Deployment"
echo "================================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

echo "✅ Wrangler CLI ready"
echo ""

# Check if logged in
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Not logged in to Cloudflare"
    echo "   Please run: wrangler login"
    echo ""
    read -p "Press enter after logging in..."
fi

echo ""
echo "📦 Deploying to Cloudflare Pages..."
echo ""

# Deploy to Cloudflare Pages
wrangler pages deploy public --project-name stock-analysis-app

echo ""
echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Set your backend URL as an environment variable:"
echo "   wrangler pages secret put BACKEND_URL --project-name stock-analysis-app"
echo ""
echo "2. Or set it in the Cloudflare dashboard:"
echo "   https://dash.cloudflare.com → Pages → stock-analysis-app → Settings → Environment variables"
echo ""
echo "   Variable name: BACKEND_URL"
echo "   Value: https://your-backend.onrender.com (or your backend URL)"
echo ""
echo "3. Visit your app at:"
echo "   https://stock-analysis-app.pages.dev"
echo ""
echo "================================================"
