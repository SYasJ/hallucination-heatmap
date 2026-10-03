"""Tiny standard-library client for a local Hallucination Heatmap server."""
from __future__ import annotations

import json
import os
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class HeatmapClient:
    """Call a running ``server.py`` instance from a Python/RAG pipeline.

    The provider credential stays on the analyzer server; this client only calls
    the local ``/api/analyze`` endpoint.
    """

    def __init__(self, base_url: str | None = None, timeout: float = 90):
        base_url = base_url or os.environ.get("HEATMAP_URL") or "http://127.0.0.1:8787"
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def health(self) -> dict[str, Any]:
        """Return the analyzer's ``/api/health`` payload (raises RuntimeError if unreachable)."""
        return self._request(Request(self.base_url + "/api/health", headers={"Accept": "application/json"}))

    def analyze(
        self,
        prompt: str,
        *,
        context: str = "",
        mode: str = "logprobs",
        existing_response: str = "",
    ) -> dict[str, Any]:
        """Generate and analyze a response, or verify a response already in hand."""
        payload = {
            "prompt": prompt,
            "context": context,
            "mode": mode,
            "existing_response": existing_response,
        }
        request = Request(
            self.base_url + "/api/analyze",
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json", "Accept": "application/json"},
        )
        return self._request(request)

    def _request(self, request: Request) -> dict[str, Any]:
        try:
            with urlopen(request, timeout=self.timeout) as response:
                result = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            message = exc.read().decode("utf-8", errors="replace")
            try:
                detail = json.loads(message).get("error", message)
            except (json.JSONDecodeError, AttributeError):
                detail = message
            raise RuntimeError(f"Heatmap returned HTTP {exc.code}: {detail}") from exc
        except URLError as exc:
            raise RuntimeError(f"Could not reach Heatmap at {self.base_url}: {exc.reason}") from exc
        if not isinstance(result, dict):
            raise RuntimeError("Heatmap returned an unexpected response format.")
        return result

    def verify_existing(
        self,
        prompt: str,
        response: str,
        *,
        context: str = "",
    ) -> dict[str, Any]:
        """Run the secondary verifier on text from a closed API or prior call."""
        return self.analyze(prompt, context=context, mode="verify", existing_response=response)
