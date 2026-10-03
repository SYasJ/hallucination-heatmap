# Examples

Every example talks to a running analyzer (`python3 server.py`). Set `HEATMAP_URL` if it isn't on `http://127.0.0.1:8787`.

No API key? Start the offline mock provider first. Its verdicts are fake and exist only to exercise the pipeline:

```bash
python3 examples/mock_provider.py &
LLM_BASE_URL=http://127.0.0.1:9999/v1 LLM_API_KEY=mock python3 server.py
```

| Example | Run |
| --- | --- |
| **RAG guardrail.** Escalate when the trust score is low or a claim is contradicted. | `python3 examples/rag_gate.py` |
| **Batch evaluation.** JSONL in, CSV out. Rows with `response` are verified as-is. | `python3 examples/batch_eval.py examples/dataset.jsonl examples/output/report.csv` |
| **Raw HTTP.** Sends each file in `requests/`. | `./examples/curl.sh http://localhost:8787` |

Request bodies in [`requests/`](requests/):

- `logprobs-with-context.json`: generates an answer, gets token logprobs, and checks claims against the context (composite score)
- `verify-existing-response.json`: audits a pasted answer against a source (evidence-only score)
- `verify-without-context.json`: best-effort review with no source (no trust score, by design)
