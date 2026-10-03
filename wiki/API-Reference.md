# 🔌 API Reference

Base URL: `http://localhost:8787`

## `POST /api/analyze`

Headers: `Content-Type: application/json` (**required**; other types get `415`).

### Request

| Field | Type | Required | Notes |
|---|---|---|---|
| `prompt` | string | ✅* | The question or task (≤ 30,000 chars) |
| `context` | string | | Ground-truth source text (≤ 200,000 chars). Enables claim scoring. |
| `mode` | `"logprobs"` \| `"verify"` | | Default `logprobs` |
| `existing_response` | string | | Verify this text instead of generating (≤ 100,000 chars) |

\* Either `prompt` or `existing_response` must be present.

```bash
curl -s http://localhost:8787/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Can I return a used blender after 60 days?",
       "context":"Unused items in original packaging: return within 30 days.",
       "mode":"logprobs"}'
```

### Response

```jsonc
{
  "id": "HM-1A2B3C4D",
  "created_at": "2026-10-03T08:00:00Z",
  "output": "Yes, you can return the used blender within 90 days…",
  "tokens": [{ "token": "Yes", "confidence": 0.95, "logprob": -0.05 }],
  "claims": [{
    "claim": "A used blender can be returned after 60 days.",
    "text_span": "you can return the used blender within 90 days",
    "status": "contradicted",          // supported | contradicted | not_in_context | unverified
    "confidence": 0.9,                  // verifier certainty, 0–1
    "evidence": "Unused items … within 30 days."
  }],
  "evidence_score": 18.0,               // 0–100 | null
  "mean_token_confidence": 89.4,        // 0–100 | null
  "trust_score": 39.4,                  // 0–100 | null
  "score_method": "composite",          // composite | evidence_only | null
  "analysis_method": "logprobs",        // logprobs | verifier
  "model": "gpt-4o-mini",
  "verifier_model": "gpt-4o-mini",
  "latency_ms": 1840,
  "usage": { "prompt_tokens": 120, "completion_tokens": 40 },
  "warnings": [],
  "caveat": "Token confidence is not factual truth. …"
}
```

### Status codes

| Code | When |
|---|---|
| `200` | Success |
| `400` | Bad JSON, missing prompt, or bad `mode` |
| `403` | Disallowed `Host` or cross-site `Origin` |
| `413` | Body or field too large |
| `415` | Not `application/json` |
| `429` | Rate limit exceeded |
| `503` | No API key configured |
| `502` / `504` | Provider error or timeout (message included) |

## `GET /api/health`
`{"ok": true, "service": "llm-hallucination-detector", "version": "0.2.0"}`

## `GET /api/config`
A non-secret status report: whether keys are configured, model names, and sanitized base URLs. **It never returns keys.**

## Export format (`llm-hallucination-detector/v1`)
The **Export** button in the UI downloads a JSON record with the run ID, model, trust score and method, evidence alignment, mean token confidence, output, claims (with `text_span` and verdict) and tokens, ready to log next to your evaluation metrics.
