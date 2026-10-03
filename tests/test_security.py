"""HTTP-level security tests: static allowlist, host/origin checks, content type, rate limiting."""
import json
import threading
import unittest
from http.client import HTTPConnection
from unittest.mock import patch

import server


class _ServerCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.HeatmapHandler)
        cls.port = cls.httpd.server_address[1]
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def request(self, method, path, body=None, headers=None):
        conn = HTTPConnection("127.0.0.1", self.port, timeout=5)
        conn.request(method, path, body=body, headers=headers or {})
        response = conn.getresponse()
        data = response.read()
        conn.close()
        return response, data


class StaticFileTests(_ServerCase):
    def test_public_files_are_served(self):
        for path in ("/", "/index.html", "/app.js", "/styles.css", "/robots.txt", "/assets/favicon.svg"):
            with self.subTest(path=path):
                self.assertEqual(self.request("GET", path)[0].status, 200)

    def test_private_files_are_not_served(self):
        for path in ("/server.py", "/.env", "/.env.example", "/.git/config", "/tests/test_server.py",
                     "/heatmap_client.py", "/tools/", "/screenshots/", "/assets/../server.py",
                     "/%2e%2e/etc/passwd", "/assets/.hidden.png", "/extension/manifest.json"):
            with self.subTest(path=path):
                self.assertEqual(self.request("GET", path)[0].status, 404)

    def test_security_headers_present(self):
        response, _ = self.request("GET", "/")
        self.assertIn("default-src 'self'", response.getheader("Content-Security-Policy"))
        self.assertEqual(response.getheader("X-Frame-Options"), "DENY")
        self.assertEqual(response.getheader("X-Content-Type-Options"), "nosniff")


class ApiAccessTests(_ServerCase):
    def test_health(self):
        response, data = self.request("GET", "/api/health")
        self.assertEqual(response.status, 200)
        self.assertEqual(json.loads(data)["version"], server.__version__)

    def test_config_never_returns_secrets(self):
        with patch.dict("os.environ", {"LLM_API_KEY": "sk-super-secret", "LLM_BASE_URL": "https://user:pw@example.test/v1?key=abc"}):
            _, data = self.request("GET", "/api/config")
        text = data.decode()
        self.assertNotIn("sk-super-secret", text)
        self.assertNotIn("pw@", text)
        self.assertNotIn("key=abc", text)

    def test_dns_rebinding_host_is_rejected(self):
        response, _ = self.request("GET", "/api/config", headers={"Host": "attacker.example"})
        self.assertEqual(response.status, 403)

    def test_extra_allowed_host(self):
        with patch.dict("os.environ", {"ALLOWED_HOSTS": "heatmap.internal"}):
            response, _ = self.request("GET", "/api/health", headers={"Host": "heatmap.internal:8787"})
        self.assertEqual(response.status, 200)

    def test_cross_site_origin_is_rejected(self):
        response, _ = self.request("POST", "/api/analyze", body=b"{}", headers={
            "Origin": "https://evil.example", "Content-Type": "application/json"})
        self.assertEqual(response.status, 403)
        self.assertIsNone(response.getheader("Access-Control-Allow-Origin"))

    def test_simple_cross_site_post_requires_json_content_type(self):
        response, _ = self.request("POST", "/api/analyze", body=b'{"prompt":"x"}', headers={"Content-Type": "text/plain"})
        self.assertEqual(response.status, 415)

    def test_preflight_from_other_site_is_rejected(self):
        response, _ = self.request("OPTIONS", "/api/analyze", headers={"Origin": "https://evil.example"})
        self.assertEqual(response.status, 403)

    def test_extension_origin_can_be_restricted(self):
        with patch.dict("os.environ", {"ALLOWED_EXTENSION_IDS": "abcdefg"}):
            ok, _ = self.request("OPTIONS", "/api/analyze", headers={"Origin": "chrome-extension://abcdefg"})
            blocked, _ = self.request("OPTIONS", "/api/analyze", headers={"Origin": "chrome-extension://other"})
        self.assertEqual(ok.status, 204)
        self.assertEqual(blocked.status, 403)

    def test_oversized_and_invalid_bodies(self):
        headers = {"Content-Type": "application/json"}
        self.assertEqual(self.request("POST", "/api/analyze", body=b"[1]", headers=headers)[0].status, 400)
        self.assertEqual(self.request("POST", "/api/analyze", body=b"not json", headers=headers)[0].status, 400)
        big = {"Content-Type": "application/json", "Content-Length": str(server.MAX_BODY_BYTES + 1)}
        conn = HTTPConnection("127.0.0.1", self.port, timeout=5)
        conn.putrequest("POST", "/api/analyze")
        for k, v in big.items():
            conn.putheader(k, v)
        conn.endheaders()
        self.assertEqual(conn.getresponse().status, 413)
        conn.close()


class RateLimiterTests(unittest.TestCase):
    def test_limits_per_client(self):
        limiter = server.RateLimiter(2, window_seconds=60)
        self.assertTrue(limiter.allow("a"))
        self.assertTrue(limiter.allow("a"))
        self.assertFalse(limiter.allow("a"))
        self.assertTrue(limiter.allow("b"))

    def test_zero_disables_limit(self):
        limiter = server.RateLimiter(0)
        self.assertTrue(all(limiter.allow("a") for _ in range(100)))


class HostParsingTests(unittest.TestCase):
    def test_host_without_port(self):
        self.assertEqual(server.host_without_port("localhost:8787"), "localhost")
        self.assertEqual(server.host_without_port("[::1]:8787"), "[::1]")
        self.assertEqual(server.host_without_port("127.0.0.1"), "127.0.0.1")


if __name__ == "__main__":
    unittest.main()
