# Changelog

## Unreleased

- Renamed the project from **Hallucination Heatmap** to **LLM Hallucination Detector** (repo `llm-hallucination-detector`) to make it easier to find in search. The UI title, metadata, social card, extension name and export schema (`llm-hallucination-detector/v1`) are updated to match.
- Added a 13-page illustrated wiki (`wiki/`), published automatically to the GitHub Wiki.

## 0.2.0 — 2026-10-03

### Security
- The server binds to `127.0.0.1` by default (was `0.0.0.0`). It is configurable with `ANALYZER_HOST`.
- API requests now require an allowed `Host` header (DNS-rebinding protection) and reject foreign `Origin`s.
- `POST /api/analyze` requires `Content-Type: application/json`, which blocks cross-site "simple" requests that could spend provider credits.
- The static server uses an explicit allowlist. Source files, tests, tools and dotfiles are no longer downloadable, and directory listings are disabled.
- Added CSP, `X-Frame-Options`, `Permissions-Policy` and COOP headers. Inline styles were removed so the CSP can be strict.
- Added a per-IP rate limit, a socket timeout, and generic 500 messages that don't leak internals.
- Extension: only accepts messages from its own content scripts, enforces a request timeout, and drops the unused `activeTab` permission.

### Fixed
- Extension highlight styles (`content.css`) were never loaded.
- Extension: verdicts such as `unsupported` could be highlighted as *supported*.
- Absolute asset and API paths broke hosting under a sub-path (e.g. GitHub Pages).
- The *Invented statistics* demo labelled a claim that contradicts its source as merely *unverified*.
- Pasted responses can now be verified without filling in the question field.

### Added
- Two new demo examples: *Fabricated citation* and *Spec drift*.
- An `examples/` folder with a RAG gate, batch evaluation to CSV, curl requests, and an offline mock provider.
- End-to-end and HTTP security test suites.
- SEO: descriptive title and meta, canonical URL, Open Graph and Twitter cards, JSON-LD (`SoftwareApplication` and `FAQPage`), sitemap, robots.txt, web manifest, favicons, and a crawlable "How it works" and FAQ section.
- UI: larger and more readable type, keyboard token navigation, accessible tabs, a modal focus trap, a skip link, reduced-motion and print styles, and a GitHub link.
- CI, GitHub Pages deployment, issue and PR templates, and Dependabot for Actions.
- `HeatmapClient.health()` and the `HEATMAP_URL` environment variable.

### Changed
- The Pillow mock-up renderer was replaced by real Playwright browser screenshots (`tools/capture_screenshots.mjs`).

## 0.1.0

- Initial prototype.
