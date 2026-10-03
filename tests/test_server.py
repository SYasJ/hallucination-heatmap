import math
import unittest

import server


class LogprobTests(unittest.TestCase):
    def test_selected_token_probability_is_exp_of_logprob(self):
        payload = {
            "choices": [{
                "logprobs": {
                    "content": [
                        {"token": "Hello", "logprob": math.log(0.8)},
                        {"token": " world", "logprob": math.log(0.25)},
                    ]
                }
            }]
        }
        tokens = server.parse_logprob_tokens(payload)
        self.assertEqual([item["token"] for item in tokens], ["Hello", " world"])
        self.assertAlmostEqual(tokens[0]["confidence"], 0.8)
        self.assertAlmostEqual(tokens[1]["confidence"], 0.25)

    def test_missing_logprobs_returns_empty_list(self):
        self.assertEqual(server.parse_logprob_tokens({"choices": [{"message": {"content": "answer"}}]}), [])


class ScoringTests(unittest.TestCase):
    def test_evidence_score_is_unavailable_without_context(self):
        claims = [{"status": "supported", "confidence": 0.95}]
        self.assertIsNone(server.score_evidence(claims, ""))

    def test_evidence_score_penalizes_contradictions(self):
        claims = [
            {"status": "supported", "confidence": 0.9},
            {"status": "contradicted", "confidence": 0.9},
        ]
        self.assertEqual(server.score_evidence(claims, "a source"), 50.0)

    def test_unknown_verdict_is_not_treated_as_supported(self):
        self.assertEqual(server.normalize_verdict("I am not sure", has_context=True), "unverified")
        self.assertEqual(server.normalize_verdict("not_in_context", has_context=True), "not_in_context")
        self.assertEqual(server.normalize_verdict("supported", has_context=False), "supported")

    def test_composite_requires_both_signals(self):
        self.assertIsNone(server.composite_score(None, 95))
        self.assertEqual(server.composite_score(20, 90), 41.0)


class RequestPromptTests(unittest.TestCase):
    def test_context_is_serialized_as_task_data_not_appended_to_system_prompt(self):
        messages = server.make_generation_messages("Can I return it?", "Return within 30 days.")
        self.assertIn('"source_context": "Return within 30 days."', messages[1]["content"])
        self.assertIn("untrusted data", messages[0]["content"])

    def test_pasted_response_can_use_verifier_key_without_generation_key(self):
        cfg = {
            "base_url": "https://example.test/v1",
            "api_key": "",
            "model": "unused-model",
            "verifier_base_url": "https://example.test/v1",
            "verifier_api_key": "verifier-secret",
            "verifier_model": "review-model",
            "configured": False,
            "verifier_configured": True,
        }
        verify_response = {
            "choices": [{"message": {"content": '{"claims":[{"claim":"The answer is 42.","text_span":"The answer is 42.","verdict":"supported","confidence":0.9,"evidence":"The source says 42."}]}'}}]
        }
        from unittest.mock import patch
        with patch.object(server, "config", return_value=cfg), patch.object(server, "provider_chat", return_value=verify_response):
            result, status = server.analyze({
                "prompt": "Check this answer.",
                "context": "The source says 42.",
                "existing_response": "The answer is 42.",
                "mode": "verify",
            })
        self.assertEqual(status, 200)
        self.assertEqual(result["analysis_method"], "verifier")
        self.assertIsNone(result["mean_token_confidence"])
        self.assertIsNotNone(result["trust_score"])


if __name__ == "__main__":
    unittest.main()
