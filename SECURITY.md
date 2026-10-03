# Security Policy

## Supported versions

Only the latest release on `main` receives security fixes.

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Use GitHub's
[private vulnerability reporting](https://github.com/SYasJ/llm-hallucination-detector/security/advisories/new)
and include the steps to reproduce, the impact, and any suggested fix. You should get an
acknowledgement within a few days.

## Threat model and scope

LLM Hallucination Detector is a **local developer tool**. The analyzer has no user authentication. It is
designed to run on `127.0.0.1` and be used by the person running it.

In scope:

- Leaking provider API keys, `.env` contents, or server files over HTTP
- Cross-site requests, DNS rebinding, or another website or extension driving the local API
- XSS in the web UI or the browser extension (model output is untrusted and must always be escaped)
- Path traversal in the static file server

Out of scope:

- Exposing the server on a public network (`ANALYZER_HOST=0.0.0.0`) without your own authentication or proxy
- Incorrect verdicts or scores. These are model estimates, not security guarantees.
- Prompt injection that changes a verdict. Inputs are passed to models as untrusted data, but no LLM-based check is injection-proof.

## Hardening already in place

The [README](README.md#security) has the full list: localhost binding, Host-header allowlist, origin checks,
JSON-only POSTs, a static file allowlist, strict CSP and security headers, rate limiting, body-size limits,
and no payload logging.
