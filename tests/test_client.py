import json
import unittest
from unittest.mock import patch

import heatmap_client


class _FakeResponse:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return b'{"output":"Checked answer","trust_score":42}'


class HeatmapClientTests(unittest.TestCase):
    @patch("heatmap_client.urlopen", return_value=_FakeResponse())
    def test_analyze_posts_prompt_and_context_to_local_api(self, mock_urlopen):
        client = heatmap_client.HeatmapClient("http://localhost:8787/")
        result = client.analyze("Question?", context="Evidence.", mode="logprobs")
        request = mock_urlopen.call_args.args[0]
        payload = json.loads(request.data.decode("utf-8"))
        self.assertEqual(request.full_url, "http://localhost:8787/api/analyze")
        self.assertEqual(payload["prompt"], "Question?")
        self.assertEqual(payload["context"], "Evidence.")
        self.assertEqual(result["trust_score"], 42)


if __name__ == "__main__":
    unittest.main()
