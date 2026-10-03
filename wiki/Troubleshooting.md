# 🛠️ Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| **404** on the live demo | GitHub Pages not enabled, or not deployed yet | Settings → Pages → Source **GitHub Actions**, then run the *Deploy demo* workflow (see [[Live Demo and Hosting]]) |
| "Local server offline" in the UI | You're on the hosted demo or `server.py` isn't running | `python3 server.py`, then open http://localhost:8787 |
| "Setup required" / `503` | No API key | `cp .env.example .env`, add `LLM_API_KEY`, restart |
| `403 Host not allowed` | You opened the server via a hostname other than localhost | Add it to `ALLOWED_HOSTS` |
| `403 Cross-origin request blocked` | A page on another origin is calling the API | Expected protection. Call it from the same origin, or from your extension. |
| `415` | Request isn't JSON | Send `Content-Type: application/json` |
| `429` | Rate limit | Wait a minute, or raise `RATE_LIMIT_PER_MINUTE` |
| Warning: "does not support logprobs" | Your provider or model rejects logprobs | Expected fallback. Results switch to verifier scoring. |
| No trust score shown | No source context supplied | Paste the reference text into **Supporting context** |
| Extension button missing | The chat site changed its HTML, or the page wasn't refreshed | Refresh the tab. If it's still missing, open an issue with the site and date. |

Still stuck? [Open an issue](https://github.com/SYasJ/llm-hallucination-detector/issues/new/choose). Please don't paste API keys or confidential prompts.
