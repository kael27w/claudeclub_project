# ⚡ Quick Start Guide

Get running in **5 minutes**!

## 1️⃣ Prerequisites Check

```bash
# Check Node.js version (need 18.0+)
node --version

# Check npm version (need 9.0+)
npm --version
```

Don't have them? [Download Node.js](https://nodejs.org/)

## 2️⃣ Install

```bash
# Clone the repo
git clone <your-repo-url>
cd claudeclub_project

# Install dependencies (takes 1-2 minutes)
npm install
```

## 3️⃣ Get API Keys

### Required (pick one):

**Option A: OpenAI (Recommended for beginners)**
- Sign up at [platform.openai.com](https://platform.openai.com)
- Get $5 free credit
- Copy your API key

**Option B: Anthropic (Better AI quality)**
- Sign up at [console.anthropic.com](https://console.anthropic.com)
- Get $5 free credit
- Copy your API key

### Optional (for enhanced features):

**Perplexity** - Real-time research for any city
- Sign up at [perplexity.ai](https://www.perplexity.ai/settings/api)
- 5 free requests/day
- Copy your API key

## 4️⃣ Configure Environment

```bash
# Copy the example file
cp .env.example .env.local

# Open .env.local and add your keys:
# - CHATGPT_API_KEY=sk-...     (OpenAI)
# OR
# - ANTHROPIC_API_KEY=sk-ant-... (Anthropic)
#
# Optional:
# - PERPLEXITY_API_KEY=pplx-...
# - USE_PERPLEXITY=true
```

**Minimum working .env.local:**
```bash
CHATGPT_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=false
```

## 5️⃣ Run It!

```bash
# Seed cache with default examples (optional but recommended)
npm run cache:seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 🎮 Try It Out

**Test with default examples:**
1. Click "São Paulo Exchange"
2. Click "Barcelona Exchange"
3. Click "Tokyo Semester"

**Test with custom query:**
```
Studying in Lisbon, Portugal for 5 months
with a 4000 EUR budget, love architecture
and nightlife, from California
```

## 🐛 Troubleshooting

### "API Key not found"
- Check your `.env.local` file exists
- Ensure API keys are correct (no quotes needed)
- Restart the dev server: `Ctrl+C` then `npm run dev`

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Port 3000 already in use"
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill
npm run dev
```

### Want to test without API keys?
```bash
# In .env.local
NEXT_PUBLIC_DEMO_MODE=true
npm run dev
```

## 📚 Next Steps

- Read the full [README.md](./README.md)
- Check out [CONTRIBUTING.md](./CONTRIBUTING.md)
- Explore the code in `lib/destination-agent.ts`

## 💬 Need Help?

Open an issue on GitHub with:
- What you tried
- Error messages (if any)
- Your Node.js version (`node --version`)
- Your OS (macOS, Windows, Linux)

---

**Happy coding! 🚀**
