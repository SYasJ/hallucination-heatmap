"""End-to-end: analyzer server + offline mock OpenAI-compatible provider."""
import os
import sys
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "examples"))

import mock_provider  # noqa: E402
import server  # noqa: E402
from heatmap_client import HeatmapClient  # noqa: E402


class EndToEndTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.provider = mock_provider.make_server(0)
        cls.analyzer = server.ThreadingHTTPServer(("127.0.0.1", 0), server.HeatmapHandler)
        for srv in (cls.provider, cls.analyzer):
            threading.Thread(target=srv.serve_forever, daemon=True).start()
        cls.env = patch.dict(os.environ, {
            "LLM_BASE_URL": f"http://127.0.0.1:{cls.provider.server_address[1]}/v1",
            "LLM_API_KEY": "mock-key",
            "LLM_MODEL": "mock-model",
        })
        cls.env.start()
        cls.client = HeatmapClient(f"http://127.0.0.1:{cls.analyzer.server_address[1]}")

    @classmethod
    def tearDownClass(cls):
        cls.env.stop()
        for srv in (cls.provider, cls.analyzer):
            srv.shutdown()
            srv.server_close()

    def test_health(self):
        self.assertTrue(self.client.health()["ok"])

    def test_logprobs_with_context_produces_composite_score(self):
        run = self.client.analyze("Can I return a used blender after 60 days?",
                                  context="Unused products may be returned within 30 days.")
        self.assertEqual(run["analysis_method"], "logprobs")
        self.assertEqual(run["score_method"], "composite")
        self.assertTrue(run["tokens"])
        low = [t for t in run["tokens"] if t["confidence"] < 0.55]
        self.assertTrue(any("90" in t["token"] for t in low))
        self.assertIn("contradicted", {c["status"] for c in run["claims"]})

    def test_logprobs_without_context_has_no_trust_score(self):
        run = self.client.analyze("When did Apollo 11 land?")
        self.assertEqual(run["claims"], [])
        self.assertIsNone(run["trust_score"])
        self.assertIsNotNone(run["mean_token_confidence"])

    def test_verify_existing_response(self):
        run = self.client.verify_existing("Check this.", "Items can be returned within 90 days.",
                                          context="Return within 30 days.")
        self.assertEqual(run["analysis_method"], "verifier")
        self.assertEqual(run["score_method"], "evidence_only")
        self.assertEqual(run["tokens"], [])

    def test_errors_surface_as_runtime_error(self):
        with self.assertRaises(RuntimeError):
            self.client.analyze("", mode="logprobs")


if __name__ == "__main__":
    unittest.main()
