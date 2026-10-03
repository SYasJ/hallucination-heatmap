# Contributing

Thanks for helping improve LLM Hallucination Detector!

## Ground rules

- **Zero runtime dependencies.** The server and client use only the Python standard library, and the UI is vanilla JavaScript. Please keep it that way.
- **Be honest about signals.** Never present verifier output as token probability, and never present any score as proof of truth.
- **Treat model output as untrusted.** Escape it before inserting it into HTML. The UI enforces a strict CSP, so don't add inline `<script>`, `style=""` attributes, or third-party CDNs.

## Development loop

```bash
python3 server.py                                  # http://localhost:8787
python3 -m unittest discover -s tests -v           # all tests, offline
node --check app.js extension/content.js extension/background.js
```

To exercise live modes without an API key, run `python3 examples/mock_provider.py` and point
`LLM_BASE_URL` at `http://127.0.0.1:9999/v1` (see README).

If you change the UI, refresh the screenshots:

```bash
npm i -D playwright && npx playwright install chromium
node tools/capture_screenshots.mjs
```

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Add or update tests for behaviour changes.
3. Make sure CI passes and describe what you checked in the PR template.
