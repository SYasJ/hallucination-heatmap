const ANALYZER_URL = 'http://127.0.0.1:8787/api/analyze';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'HH_ANALYZE_TEXT') return false;

  const text = String(message.text || '').trim();
  if (!text) {
    sendResponse({ ok: false, error: 'No response text was selected.' });
    return false;
  }

  fetch(ANALYZER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    .catch((error) => sendResponse({ ok: false, error: error.message || 'Could not reach the local analyzer.' }));

  // Keep the extension message port open for the async local API request.
  return true;
});
