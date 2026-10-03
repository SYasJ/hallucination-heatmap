# 🌐 Live Demo and Hosting

## What the live demo is

**https://syasj.github.io/llm-hallucination-detector/** is the same web UI, published as **static files** on GitHub Pages:

- ✅ The five demo scenarios work fully in the visitor's browser.
- ❌ Live analysis is **disabled** on the hosted demo, because there's no server there and therefore no API key. Visitors are told to run `server.py` locally.

## 💰 Does it cost anything?

| Item | Cost | Why |
|---|---|---|
| GitHub Pages hosting | **$0** | Free for public repositories |
| GitHub Actions (CI + deploy) | **$0** | Standard runners are free and unlimited for public repos |
| LLM / API usage from the demo | **$0** | The hosted demo makes **no** model calls and never touches your key |
| LLM usage when *you* run locally | Your provider's normal rates | Only when you run live analysis with your own key |

## 📏 GitHub Pages limits

| Limit | Value | This project |
|---|---|---|
| Published site size | ≤ 1 GB | ~2 MB |
| Bandwidth | ~100 GB / month (soft) | A page view is ~150 KB, so roughly 600,000 visits a month |
| Repo size (recommended) | ≤ 1 GB | ~2.5 MB |

These are *soft* limits. If a site greatly exceeds them, GitHub may contact you; nothing is billed. See [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

## ⚙️ One-time setup (repo owner)

1. **Settings → Pages → Build and deployment → Source: _GitHub Actions_**
2. **Actions → Deploy demo to GitHub Pages → Run workflow** (afterwards it runs on every push to `main`)
3. **Repo home → ⚙️ About → Website: "Use your GitHub Pages website"**

## Hosting live analysis for others?

The included server has no user accounts. If you want a public live version, put it behind authentication (an OAuth proxy, Cloudflare Access or similar), keep the rate limit on, and set a spend cap with your model provider.
