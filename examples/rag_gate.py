#!/usr/bin/env python3
"""Example: gate a RAG answer on its trust score before showing it to a user.

    python3 server.py                      # in another terminal (needs an API key or the mock provider)
    python3 examples/rag_gate.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from heatmap_client import HeatmapClient  # noqa: E402

TRUST_THRESHOLD = 70  # Prototype heuristic — tune on your own labelled data.


def retrieve(question: str) -> str:
    """Stand-in for your retriever (vector DB, search API, ...)."""
    return (
        "RETURNS POLICY\n"
        "Unused products in original packaging may be returned within 30 days of delivery.\n"
        "Refunds are issued 5–7 business days after approval."
    )


def answer_with_guardrail(question: str) -> dict:
    context = retrieve(question)
    run = HeatmapClient().analyze(question, context=context, mode="logprobs")
    risky = [c for c in run["claims"] if c["status"] in {"contradicted", "not_in_context"}]
    score = run["trust_score"]
    if score is None or score < TRUST_THRESHOLD or risky:
        return {
            "answer": "I couldn't verify that against our policy. Please check the returns page or contact support.",
            "escalate": True,
            "trust_score": score,
            "flagged_claims": [c["claim"] for c in risky],
            "draft": run["output"],
        }
    return {"answer": run["output"], "escalate": False, "trust_score": score}


if __name__ == "__main__":
    import json

    print(json.dumps(answer_with_guardrail("Can I return a used blender after 60 days?"), indent=2, ensure_ascii=False))
