const ANALYZER_URL = 'http://127.0.0.1:8787/api/analyze';
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_TEXT_CHARS = 100_000;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only accept requests from this extension's own content scripts.
  if (sender.id !== chrome.runtime.id) return false;
  if (!message || message.type !== 'HH_ANALYZE_TEXT') return false;

  const text = String(message.text || '').trim().slice(0, MAX_TEXT_CHARS);
  if (!text) {
    sendResponse({ ok: false, error: 'No response text was selected.' });
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  fetch(ANALYZER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      mode: 'verify',
      prompt: 'Audit factual claims in this assistant response. No source context is attached; use a cautious best-effort review and mark unverifiable claims as unverified.',
      context: '',
      existing_response: text
    })
  })
    .then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Analyzer returned ${response.status}`);
      return payload;
    })
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) => sendResponse({
      ok: false,
      error: error.name === 'AbortError' ? 'The local analyzer timed out.' : (error.message || 'Could not reach the local analyzer.')
    }))
    .finally(() => clearTimeout(timer));

  // Keep the extension message port open for the async local API request.
  return true;
});
