#!/usr/bin/env python3
"""Offline, deterministic OpenAI-compatible provider for trying LLM Hallucination Detector without an API key.

It implements just enough of ``POST /v1/chat/completions`` for the analyzer:

* generation calls get a canned answer with per-token ``logprobs``;
* verifier calls (detected by the "claim auditor" system prompt) get a JSON claim audit
  computed with a naive keyword check against the supplied ``source_context``.

The verdicts are *fake* — this exists for demos, tests and CI, not for real evaluation.

    python3 examples/mock_provider.py            # serves http://127.0.0.1:9999/v1
    LLM_BASE_URL=http://127.0.0.1:9999/v1 LLM_API_KEY=mock python3 server.py
"""
from __future__ import annotations

import json
import math
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

CANNED_ANSWERS = [
    # (keyword in task, answer, {token: probability} overrides for "guessed" tokens)
    ("return", "Yes, you can return the used blender within 90 days of purchase. Refunds are processed immediately.",
     {"90": 0.38, "days": 0.49, "immediately.": 0.43}),
    ("apollo", "Apollo 11 landed on the Moon on July 20, 1969. Neil Armstrong stepped out first.", {}),
]
DEFAULT_ANSWER = ("The supplied context does not fully answer this question, so I cannot confirm the details.", {})


def _answer_for(task: str) -> tuple[str, dict[str, float]]:
    lowered = task.lower()
    for keyword, answer, overrides in CANNED_ANSWERS:
        if keyword in lowered:
            return answer, overrides
    return DEFAULT_ANSWER


def _logprobs(answer: str, overrides: dict[str, float]) -> dict[str, Any]:
    content = []
    for index, word in enumerate(answer.split(" ")):
        token = word if index == 0 else " " + word
        probability = overrides.get(word, 0.97)
        content.append({"token": token, "logprob": math.log(probability), "top_logprobs": []})
    return {"content": content}


def _sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def _audit(data: dict[str, Any]) -> dict[str, Any]:
    response = str(data.get("assistant_response") or "")
    source = str(data.get("source_context") or "")
    source_numbers = set(re.findall(r"\d+(?:\.\d+)?", source))
    claims = []
    for sentence in _sentences(response)[:8]:
        numbers = set(re.findall(r"\d+(?:\.\d+)?", sentence))
        if not source:
            verdict, evidence = "unverified", "No source context was supplied (mock verifier)."
        elif numbers and not numbers <= source_numbers:
            verdict, evidence = "contradicted", "Numbers in this claim do not appear in the source (mock check)."
        elif any(w.lower() in source.lower() for w in re.findall(r"[A-Za-z]{5,}", sentence)):
            verdict, evidence = "supported", "Key terms overlap with the source (mock check)."
        else:
            verdict, evidence = "not_in_context", "The source does not mention this (mock check)."
        claims.append({"claim": sentence, "text_span": sentence, "verdict": verdict, "confidence": 0.8, "evidence": evidence})
    return {"claims": claims}


class MockHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: Any) -> None:  # keep test output quiet
        if os.environ.get("MOCK_PROVIDER_VERBOSE"):
            super().log_message(fmt, *args)

    def do_POST(self) -> None:
        if not self.path.rstrip("/").endswith("/chat/completions"):
            self._send({"error": {"message": "Not found"}}, 404)
            return
        if not self.headers.get("Authorization", "").startswith("Bearer "):
            self._send({"error": {"message": "Missing bearer token"}}, 401)
            return
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")
        messages = body.get("messages") or []
        system = next((m.get("content", "") for m in messages if m.get("role") == "system"), "")
        user = json.loads(next((m.get("content", "{}") for m in messages if m.get("role") == "user"), "{}") or "{}")
        choice: dict[str, Any] = {"index": 0, "finish_reason": "stop"}
        if "claim auditor" in system:
            choice["message"] = {"role": "assistant", "content": json.dumps(_audit(user))}
        else:
            answer, overrides = _answer_for(str(user.get("task", "")))
            choice["message"] = {"role": "assistant", "content": answer}
            if body.get("logprobs"):
                choice["logprobs"] = _logprobs(answer, overrides)
        self._send({
            "id": "mock-1",
            "object": "chat.completion",
            "model": body.get("model", "mock-model"),
            "choices": [choice],
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        })

    def _send(self, payload: dict[str, Any], status: int = 200) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)


def make_server(port: int = 9999) -> ThreadingHTTPServer:
    return ThreadingHTTPServer(("127.0.0.1", port), MockHandler)


if __name__ == "__main__":
    port = int(os.environ.get("MOCK_PROVIDER_PORT", "9999"))
    print(f"Mock OpenAI-compatible provider on http://127.0.0.1:{port}/v1 (fake verdicts, for demos only)")
    make_server(port).serve_forever()
