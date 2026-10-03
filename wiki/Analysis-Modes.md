# 🎛️ Analysis Modes

| | 🧪 Demo library | 🔥 OpenAI-compatible · logprobs | 🔍 Verifier mode |
|---|:---:|:---:|:---:|
| Needs API key | ❌ | ✅ | ✅ |
| Generates an answer | Curated | ✅ | ✅ (or uses your pasted answer) |
| Token heatmap | ✅ | ✅ | ❌ |
| Claim verdicts | ✅ | ✅ with context | ✅ |
| Trust score | Fixed demo value | Composite | Evidence-only |
| Works on ChatGPT/Claude answers | — | ❌ | ✅ |

## 🧪 Demo library
Five hand-labelled scenarios with no network calls. Perfect for presentations and for learning to read the heatmap. See [[Demo Examples]].

## 🔥 OpenAI-compatible · logprobs
Sends your question (plus optional context) with `logprobs=true`.
- If the provider **rejects logprobs**, the server automatically regenerates without them and switches to verifier scoring. You'll see a warning toast.
- If you add **source context**, a verifier pass runs as well and you get the composite trust score.

## 🔍 Verifier mode · no logprobs
For models or products that don't expose logprobs.

**Checking an answer you already have** (ChatGPT, Claude, Gemini, a colleague's draft):
1. Expand **"Analyze an existing response instead"**.
2. Paste the answer.
3. Choose **Verifier mode** and run.

> [!TIP]
> For a less biased check, use a **different model** as the verifier than the one that wrote the answer. Set `VERIFIER_MODEL` / `VERIFIER_BASE_URL` (see [[Configuration]]).
