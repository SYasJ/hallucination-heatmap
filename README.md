# Hallucination Heatmap

A local-first prototype for inspecting model-token likelihood and source support side by side. It includes a no-key demo workspace, a small OpenAI-compatible API proxy, JSON trust-score export, and a click-to-review Chrome extension MVP for ChatGPT and Claude.

> **Important:** logprob is not truth. A model can be highly confident in a false claim. Verifier judgments can also be wrong. The prototype score is a product/demo heuristic, not a calibrated probability of correctness.

## Run the demo

Requirements: Python 3.10+; no Python or JavaScript packages are needed.

```bash
python3 server.py
```

Open <http://localhost:8787>. The three curated scenarios work without credentials:

1. **Policy mismatch** — a fluent answer contradicts a 30-day, unused-item return policy.
2. **Invented statistics** — a plausible research summary adds sample size, affiliation, and effect sizes missing from the source.
3. **Grounded answer** — Apollo 11 facts align with the supplied reference.

Select a sample to change the prompt, source and annotated output. Hover or click a highlighted token to inspect its probability. The demo is fixed, labelled data; it does not pretend to analyze a custom question without a model call.

## Connect an OpenAI-compatible API

Copy `.env.example` to `.env`, set your endpoint and key, then restart the server:

```bash
cp .env.example .env
# Edit .env, then:
python3 server.py
```

Example configuration:

```dotenv
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your-key
LLM_MODEL=gpt-4o-mini

# Optional: use a different verifier model/provider
VERIFIER_BASE_URL=https://api.openai.com/v1
VERIFIER_API_KEY=your-verifier-key
VERIFIER_MODEL=your-verifier-model
```

`LLM_BASE_URL` should be the provider's Chat Completions API root (normally the `/v1` URL, not `/chat/completions`). The backend keeps the key server-side and makes same-origin requests from the UI. The API settings panel reports whether a key is configured, but never returns the key.

### Analysis modes

- **OpenAI-compatible · logprobs** — requests `logprobs=true` and `top_logprobs=0`. The chosen-token confidence is `exp(logprob)`. If the API rejects logprobs for this model, the server falls back to a regular answer and a claim-level verifier pass when possible. Providers vary in their logprob behavior.
- **Verifier mode · no logprobs** — uses a second pass to label factual claims as supported, contradicted, not in the supplied context, or unverified. A verifier highlight is explicitly **not** a token probability. If no context is attached, the pass is only a best-effort review against model knowledge and no source-grounded trust score is produced.
- **Existing/closed-model response** — expand “Analyze an existing response instead”, paste the output, choose Verifier mode, and run. This can review an answer from ChatGPT, Claude, or another API without claiming to recover its original token logprobs. The configured verifier endpoint must use the supported Chat Completions-compatible shape; direct native provider APIs need an adapter.

The default verifier is the configured generation model. For a less correlated check, configure a separate verifier model or endpoint. A second model is still not a proof of truth.

## Local HTTP API

The UI uses `POST /api/analyze`. The server accepts a task, optional retrieval context, and mode:

```bash
curl -s http://localhost:8787/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Can I return a used blender after 60 days?",
    "context": "Unused items in original packaging: return within 30 days.",
    "mode": "logprobs"
  }' | python3 -m json.tool
```

For a previously generated response, pass `existing_response` and `mode: "verify"`:

```json
{
  "prompt": "Does this answer follow the policy?",
  "context": "Unused items in original packaging: return within 30 days.",
  "existing_response": "Yes, used items can be returned within 90 days.",
  "mode": "verify"
}
```

Other endpoints: `GET /api/health` and `GET /api/config` (safe, non-secret configuration status).

A zero-dependency Python helper is included for RAG/evaluation workers:

```python
from heatmap_client import HeatmapClient

heatmap = HeatmapClient("http://127.0.0.1:8787")
run = heatmap.analyze(
    "Can I return this item after 60 days?",
    context="Unused items may be returned within 30 days.",
    mode="logprobs",
)
record = {
    "answer": run["output"],
    "trust_score": run["trust_score"],  # may be null if evidence is unavailable
    "claims": run["claims"],
}
```

### Trust score and export

The downloadable `hallucination-heatmap/v1` JSON contains the output, claim verdicts, available token logprobs, evidence alignment, mean token confidence, metric scales, and caveats. The score fields use a 0–100 scale; each token confidence is a 0–1 probability. Where both evidence alignment and token confidence exist, the demo score is:

```text
trust_score = 0.70 × evidence_alignment + 0.30 × mean_token_confidence
```

With verifier-only analysis and a supplied context, the UI reports an **evidence-only** score. With no source context, it deliberately leaves a source-grounded trust score unavailable. The weights and cutoffs are exposed for prototyping, not validated calibration; do not treat this score as a universal production gate.

Color thresholds for actual token logprobs: **red <55%**, **amber 55–84%**, **green ≥85%**. Those colors represent the model's selected-token probability only. The separate claim check is the source-alignment signal.

## Browser extension MVP

The `extension/` folder is a Manifest V3 unpacked Chrome extension. It adds an **Analyze answer** button on matching ChatGPT/Claude assistant messages; it does not read or upload a conversation until the user clicks. On click it sends the selected response text to `http://127.0.0.1:8787` for verifier-only review. Where exact quoted spans map to page text, Chrome's CSS Custom Highlight API adds claim-level colors without rewriting the response DOM.

1. Run this app locally and configure a verifier API key.
2. Visit `chrome://extensions` and enable **Developer mode**.
3. Choose **Load unpacked** and select `extension/`.
4. Refresh a ChatGPT or Claude tab and click **Analyze answer** under a response.

The page selectors are best-effort and can break as either product changes its DOM. No source is attached by this prototype extension, so its verdict is not source-grounded. For anything beyond a local demo, add consent UX, authentication, rate limits, domain review, and a tested provider adapter.

## Example screenshots

These are illustrative captures of the fixed demo states, not live model runs. The app and backend need no third-party packages; regenerating the PNGs with `tools/render_screenshots.py` additionally requires Pillow (`python3 -m pip install Pillow`).

### 1. Policy mismatch — confident output, contradicted by the source

![Policy mismatch: 90-day return claim conflicts with the 30-day policy](screenshots/01-policy-mismatch.png)

### 2. Invented statistics — plausible details absent from the study summary

![Invented statistics: unsupported study affiliation and effect sizes](screenshots/02-invented-statistics.png)

### 3. Grounded answer — high token likelihood and source support agree

![Grounded Apollo 11 answer](screenshots/03-grounded-answer.png)

## Safety and deployment notes

- `.env` is intentionally not served by the static server. Do not commit real credentials.
- The server listens on `0.0.0.0` for the workspace preview. It has no user authentication, quota controls, or production-grade access controls. Keep it on a trusted development environment; do not expose it as a public API without adding those controls.
- Prompt and context data are sent to the configured provider in live mode. Demo mode makes no provider calls.
- The verifier's source quote and verdict are model-generated. Validate citations and critical decisions independently, especially for legal, medical, financial, or policy-sensitive applications.
- This repo is a prototype, not an SDK or a certified hallucination detector.

## Tests

```bash
python3 -m unittest discover -s tests -v
node --check app.js
```

## Project layout

```text
index.html             Browser workbench
styles.css / app.js    Responsive UI and curated examples
server.py              Standard-library local API + static server
heatmap_client.py      Zero-dependency Python client for RAG pipelines
extension/             Manifest V3 ChatGPT/Claude helper MVP
screenshots/           Illustrative demo-state PNGs
tools/                  Screenshot renderer
.env.example            Safe template (copy to local .env)
LICENSE                 MIT
```
