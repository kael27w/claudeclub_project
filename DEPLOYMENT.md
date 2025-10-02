# 🚀 Deployment Guide

This guide covers deploying your Study Abroad Destination Intelligence app to production.

## 🎯 Pre-Deployment Checklist

- [ ] All tests pass (`npm run type-check` and `npm run lint`)
- [ ] Environment variables are documented in `.env.example`
- [ ] Production API keys are ready
- [ ] Build succeeds locally (`npm run build`)
- [ ] Test production build locally (`npm run build && npm start`)

## 🌟 Recommended: Vercel (Easiest)

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

### Manual Deploy

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Add Environment Variables:**
   - Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
   - Settings → Environment Variables
   - Add all variables from `.env.example`

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Automatic Deployments

Connect your GitHub repo to Vercel for automatic deployments:
1. Import project in Vercel dashboard
2. Select your repository
3. Add environment variables
4. Deploy!

Every push to `main` will automatically deploy.

## 🐳 Alternative: Docker

### Build Docker Image

```dockerfile
# Create Dockerfile in project root:
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy app files
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
```

### Build and Run

```bash
# Build image
docker build -t study-abroad-app .

# Run container
docker run -p 3000:3000 \
  -e CHATGPT_API_KEY=your_key \
  -e ANTHROPIC_API_KEY=your_key \
  study-abroad-app
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    restart: unless-stopped
```

Run: `docker-compose up -d`

## ☁️ Other Platforms

### Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

4. **Configure:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Add environment variables in Netlify dashboard

### Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Initialize project:**
   ```bash
   railway init
   ```

4. **Add environment variables:**
   ```bash
   railway variables set CHATGPT_API_KEY=your_key
   railway variables set ANTHROPIC_API_KEY=your_key
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

### Render

1. Create a new Web Service in [Render Dashboard](https://render.com)
2. Connect your GitHub repo
3. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add environment variables
5. Deploy!

### DigitalOcean App Platform

1. Create new app in [DigitalOcean](https://cloud.digitalocean.com/apps)
2. Select your GitHub repo
3. Configure:
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - HTTP Port: `3000`
4. Add environment variables
5. Deploy!

## 🔐 Environment Variables for Production

### Required
```bash
CHATGPT_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_DEMO_MODE=false
```

### Optional (Recommended)
```bash
PERPLEXITY_API_KEY=pplx-...
USE_PERPLEXITY=true
OPENEXCHANGERATES_API_KEY=...
NEWS_API_KEY=...
```

### Important Notes

⚠️ **Never commit `.env.local` or `.env.production` to git!**

✅ **Always use environment variable UI in your deployment platform**

✅ **Double-check all keys are correct before deploying**

## 📊 Post-Deployment

### 1. Test Your Deployment

```bash
# Test API endpoint
curl -X POST https://your-domain.com/api/destination/analyze \
  -H "Content-Type: application/json" \
  -d '{"query": "Studying in Paris for 6 months with 5000 EUR budget"}'
```

### 2. Monitor Performance

- Set up error tracking (Sentry, LogRocket)
- Monitor API usage and costs
- Check response times
- Review server logs

### 3. Cache Seeding (Optional)

For production, you can seed the cache on a schedule:

```bash
# Add to cron or deployment script
npm run cache:seed
```

Or use a scheduled task in your deployment platform.

## 🔄 CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          CHATGPT_API_KEY: ${{ secrets.CHATGPT_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 🐛 Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Working

- Check variable names match exactly
- No quotes around values in deployment UI
- Restart/redeploy after adding variables
- Check logs for "undefined" values

### API Errors in Production

- Verify API keys are correct
- Check API key quotas/limits
- Review server logs for specific errors
- Test API endpoints directly

### Slow Performance

- Enable caching in production
- Use `npm run cache:seed` before launch
- Consider CDN for static assets
- Monitor API response times

## 📈 Scaling Considerations

### High Traffic

- Use Vercel's Edge Network (automatic)
- Implement rate limiting
- Cache aggressively
- Consider API key rotation

### Cost Optimization

- Monitor API usage closely
- Implement request throttling
- Use demo mode for non-critical requests
- Cache responses for 6+ hours
- Consider API key pooling

## 🔒 Security Best Practices

1. **API Keys:**
   - Never expose in client-side code
   - Use server-side API routes only
   - Rotate keys regularly

2. **Rate Limiting:**
   - Implement per-user limits
   - Add CAPTCHA for suspicious traffic

3. **CORS:**
   - Restrict to your domain only
   - Don't allow `*` in production

4. **HTTPS:**
   - Always use HTTPS (free with Vercel)
   - Redirect HTTP to HTTPS

## 📞 Support

Deployment issues?

1. Check platform-specific docs
2. Review error logs
3. Test locally first
4. Open an issue on GitHub

---

**Happy deploying! 🎉**
