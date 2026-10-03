# 🔧 Configuration

All settings live in a `.env` file next to `server.py` (copy `.env.example`). Real environment variables take precedence over `.env`.

## Models

| Variable | Default | Purpose |
|---|---|---|
| `LLM_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible **/v1 root** (not `/chat/completions`) |
| `LLM_API_KEY` | — | Key for the generation model. Never sent to the browser. |
| `LLM_MODEL` | `gpt-4o-mini` | Generation model name |
| `VERIFIER_BASE_URL` | = `LLM_BASE_URL` | Endpoint for the claim verifier |
| `VERIFIER_API_KEY` | = `LLM_API_KEY` | Key for the verifier |
| `VERIFIER_MODEL` | = `LLM_MODEL` | Verifier model. A *different* model gives a less correlated check. |

`OPENAI_BASE_URL`, `OPENAI_API_KEY` and `OPENAI_MODEL` are accepted as fallbacks.

## Server & security

| Variable | Default | Purpose |
|---|---|---|
| `ANALYZER_HOST` | `127.0.0.1` | Interface to bind. `0.0.0.0` only on a trusted network. |
| `ANALYZER_PORT` | `8787` | Port |
| `ALLOWED_HOSTS` | *(local only)* | Extra `Host` header values to accept, comma-separated |
| `ALLOWED_EXTENSION_IDS` | *(any)* | Restrict which Chrome extension IDs may call the API |
| `RATE_LIMIT_PER_MINUTE` | `30` | `/api/analyze` calls per client IP per minute (`0` = off) |
| `HEATMAP_URL` | `http://127.0.0.1:8787` | Used by the **Python client** to find the server |

## Provider cheat-sheet

| Provider | `LLM_BASE_URL` | Logprobs? |
|---|---|---|
| OpenAI | `https://api.openai.com/v1` | ✅ most chat models |
| Azure OpenAI (v1 API) | `https://<resource>.openai.azure.com/openai/v1` | ✅ model-dependent |
| vLLM | `http://localhost:8000/v1` | ✅ |
| LM Studio | `http://localhost:1234/v1` | model-dependent |
| Ollama | `http://localhost:11434/v1` | model/version-dependent |
| Groq / Together / OpenRouter | provider's `/v1` URL | varies; falls back to verifier mode |

> [!NOTE]
> Logprob support differs by provider and model. When a provider rejects `logprobs`, the server retries without them and tells you via a warning.
