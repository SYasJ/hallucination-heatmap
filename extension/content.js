(() => {
  'use strict';
  if (window.__hallucinationHeatmapInstalled) return;
  window.__hallucinationHeatmapInstalled = true;

  const ACTION_ATTR = 'data-heatmap-action-added';
  const SKIP_SELECTOR = '[data-heatmap-extension-root]';
  let scanQueued = false;
  let activeMessage = null;
  let panelHost = null;

  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const statusText = (status) => {
    const normalized = String(status || 'unverified').toLowerCase().replace(/[ -]/g, '_');
    if (['supported', 'entailed', 'grounded', 'verified'].includes(normalized)) return 'Supported';
    if (['contradicted', 'refuted', 'conflicts', 'false'].includes(normalized)) return 'Contradicted';
    return 'Unverified';
  };
  const statusClass = (status) => statusText(status).toLowerCase().replace(/\s/g, '-');

  function findAssistantMessages() {
    const selector = [
      '[data-message-author-role="assistant"]',
      '.font-claude-message',
      '[data-testid*="assistant-message"]',
      '[data-testid*="assistant-turn"]'
    ].join(',');
    const candidates = Array.from(document.querySelectorAll(selector));
    return candidates.filter((node) => {
      if (!node || node.closest(SKIP_SELECTOR) || node.hasAttribute(ACTION_ATTR)) return false;
      if (node.closest('[data-message-author-role="user"]')) return false;
      const text = cleanMessageText(node);
      if (text.length < 30) return false;
      // Avoid placing duplicate actions on nested assistant wrappers.
      return !Array.from(node.querySelectorAll(selector)).some((child) => child !== node && cleanMessageText(child).length > text.length * 0.65);
    });
  }

  function cleanMessageText(node) {
    const clone = node.cloneNode(true);
    clone.querySelectorAll(SKIP_SELECTOR).forEach((element) => element.remove());
    return String(clone.innerText || clone.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  }

  function makeActionHost(messageNode) {
    const host = document.createElement('div');
    host.setAttribute('data-heatmap-extension-root', 'action');
    host.style.cssText = 'display:block;position:relative;z-index:1;margin:8px 0 2px;max-width:max-content;';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { all: initial; display:block; font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        button { display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border:1px solid #d7e7e1;border-radius:7px;background:#f5fbf8;color:#347d70;font:600 11px/1.2 Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(20,45,55,.04); }
        button:hover { background:#eaf7f1;border-color:#a8d5c7; }
        button:disabled { opacity:.65;cursor:wait; }
        svg { width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round; }
      </style>
      <button type="button" aria-label="Analyze this answer with Hallucination Heatmap">
        <svg viewBox="0 0 20 20"><path d="M10 2.8 16 5v4.4c0 3.7-2.5 6.3-6 7.8-3.5-1.5-6-4.1-6-7.8V5l6-2.2Z"/><path d="m7.4 9.9 1.7 1.7 3.7-3.8"/></svg>
        <span>Analyze answer</span>
      </button>`;
    const button = shadow.querySelector('button');
    button.addEventListener('click', async () => {
      const text = cleanMessageText(messageNode);
      if (!text) return;
      activeMessage = messageNode;
      button.disabled = true;
      button.querySelector('span').textContent = 'Checking…';
      showPanel({ loading: true });
      try {
        const response = await chrome.runtime.sendMessage({ type: 'HH_ANALYZE_TEXT', text });
        if (!response || !response.ok) throw new Error(response?.error || 'The local analyzer did not respond.');
        highlightClaims(messageNode, response.result?.claims || []);
        showPanel({ result: response.result });
        button.querySelector('span').textContent = 'Reviewed · analyze again';
      } catch (error) {
        showPanel({ error: error.message || 'Could not reach the local analyzer.' });
        button.querySelector('span').textContent = 'Retry analysis';
      } finally {
        button.disabled = false;
      }
    });
    return host;
  }

  function addActions() {
    findAssistantMessages().forEach((node) => {
      node.setAttribute(ACTION_ATTR, 'true');
      node.appendChild(makeActionHost(node));
    });
  }

  function scheduleScan() {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(() => {
      scanQueued = false;
      addActions();
    });
  }

  function getPanel() {
    if (panelHost) return panelHost.shadowRoot;
    panelHost = document.createElement('div');
    panelHost.setAttribute('data-heatmap-extension-root', 'panel');
    panelHost.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483647;width:min(370px,calc(100vw - 28px));';
    const shadow = panelHost.attachShadow({ mode: 'open' });
    document.documentElement.appendChild(panelHost);
    return shadow;
  }

  function showPanel({ loading = false, result = null, error = '' } = {}) {
    const shadow = getPanel();
    if (!result && !error && !loading) {
      shadow.innerHTML = '';
      return;
    }
    const claims = Array.isArray(result?.claims) ? result.claims : [];
    const score = result?.trust_score;
    const hasSource = Boolean(result?.evidence_score !== null && result?.evidence_score !== undefined);
    const scoreLabel = score === null || score === undefined ? '—' : `${Math.round(Number(score))}`;
    const scoreMeta = hasSource ? 'source context score' : 'no source attached';
    const claimHTML = claims.slice(0, 5).map((claim) => {
      const status = statusText(claim.status || claim.verdict);
      const confValue = Number(claim.confidence);
      const confidence = claim.confidence === null || claim.confidence === undefined || !Number.isFinite(confValue) ? '' : `<small class="claim-confidence">${Math.round(confValue * (confValue <= 1 ? 100 : 1))}% estimate</small>`;
      return `<div class="claim ${statusClass(claim.status || claim.verdict)}"><span class="claim-mark">${status === 'Supported' ? '✓' : status === 'Contradicted' ? '!' : '?'}</span><div><strong>${escapeHTML(claim.claim || claim.text || 'Claim')}</strong><small>${escapeHTML(claim.evidence || claim.evidence_quote || 'No supporting quote returned.')}</small>${confidence}</div><em>${escapeHTML(status)}</em></div>`;
    }).join('');
    const title = loading ? 'Checking response…' : error ? 'Analyzer unavailable' : 'Response review';
    const body = loading
      ? '<div class="loading-bar"><i></i></div><p class="muted">Sending this response to your local verifier…</p>'
      : error
        ? `<div class="error-box">${escapeHTML(error)}<br><small>Start <code>python3 server.py</code> and configure a verifier model.</small></div>`
        : `<div class="score-row"><span class="score">${escapeHTML(scoreLabel)}</span><div><b>${escapeHTML(scoreMeta)}</b><small>${hasSource ? 'Evidence-only score · heuristic' : 'Trust score unavailable without sources'}</small></div></div>
           <div class="source-warning"><b>No source context.</b> Independent verifier estimates can be wrong; this is not token logprob data or proof of truth.</div>
           ${claimHTML || '<p class="muted">No structured claims were returned.</p>'}
           <div class="panel-foot">Reviewed only after your click · text sent to local analyzer</div>`;
    shadow.innerHTML = `<style>
      :host { all:initial; font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#27374b; }
      * { box-sizing:border-box; }
      .panel { width:100%;overflow:hidden;border:1px solid #dbe5e7;border-radius:12px;background:#fff;box-shadow:0 18px 48px rgba(16,31,47,.22);font:11px/1.5 Inter,ui-sans-serif,system-ui,sans-serif; }
      header { display:flex;align-items:center;gap:9px;padding:11px 12px;border-bottom:1px solid #edf0f2;background:#fbfdfc; }
      .logo { width:25px;height:25px;display:grid;place-items:center;border-radius:7px;background:#e8f6f0;color:#328c79; }
      .logo svg { width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round; }
      .head-copy { flex:1;min-width:0; }
      .head-copy strong { display:block;color:#324357;font-size:11px; }
      .head-copy small { display:block;color:#94a0aa;font-size:8px; }
      .close { width:24px;height:24px;border:1px solid #e6ecee;border-radius:6px;background:#fff;color:#758392;font:18px/1 sans-serif;cursor:pointer; }
      main { max-height:min(62vh,520px);overflow:auto;padding:11px 12px 12px; }
      .score-row { display:flex;align-items:center;gap:10px;padding:8px 9px;border:1px solid #edf0f1;border-radius:8px;background:#fbfcfc; }
      .score { min-width:38px;color:#327f70;font-size:24px;font-weight:750;line-height:1;letter-spacing:-1px; }
      .score-row b { display:block;color:#425267;font-size:9px; }
      .score-row small { display:block;margin-top:2px;color:#929eaa;font-size:8px; }
      .source-warning { margin:9px 0;padding:8px 9px;border:1px solid #f0e6cf;border-radius:7px;background:#fffaf0;color:#786741;font-size:8px;line-height:1.5; }
      .claim { display:grid;grid-template-columns:17px minmax(0,1fr) auto;gap:7px;align-items:start;margin-top:6px;padding:8px;border:1px solid #edf0f2;border-radius:7px; }
      .claim-mark { width:16px;height:16px;display:grid;place-items:center;border-radius:5px;background:#fff1f1;color:#be5d65;font-weight:800; }
      .claim.supported .claim-mark { background:#e9f6f1;color:#348875; }
      .claim.unverified .claim-mark { background:#fff5e4;color:#ab7928; }
      .claim strong { display:block;color:#4b5a6b;font-size:8px;line-height:1.45; }
      .claim small { display:block;margin-top:3px;color:#8b97a3;font-size:7px;line-height:1.45; }
      .claim .claim-confidence { color:#9a86d1; }
      .claim em { padding:2px 4px;border-radius:4px;background:#fff0f0;color:#b4545d;font-size:6.5px;font-style:normal;font-weight:700;white-space:nowrap; }
      .claim.supported em { background:#e9f6f1;color:#347d6c; }
      .claim.unverified em { background:#fff5e4;color:#9a7028; }
      .muted { margin:9px 0;color:#8a96a2;font-size:8px; }
      .loading-bar {height:4px;overflow:hidden;border-radius:9px;background:#edf3f0;}
      .loading-bar i {display:block;width:40%;height:100%;border-radius:inherit;background:#55b49b;animation:load 1s ease-in-out infinite alternate;}
      @keyframes load {from{transform:translateX(0)}to{transform:translateX(150%)} }
      .error-box { padding:9px;border:1px solid #f1dddd;border-radius:7px;background:#fff6f6;color:#aa4c57;font-size:9px; }
      .error-box small { display:inline-block;margin-top:5px;color:#8b8588;font-size:7px; }
      code { padding:1px 3px;border-radius:3px;background:#f0f2f3;font-family:ui-monospace,monospace; }
      .panel-foot { margin-top:10px;padding-top:8px;border-top:1px solid #edf0f2;color:#9aa4ae;font-size:7px; }
    </style><section class="panel"><header><span class="logo"><svg viewBox="0 0 20 20"><path d="M10 2.8 16 5v4.4c0 3.7-2.5 6.3-6 7.8-3.5-1.5-6-4.1-6-7.8V5l6-2.2Z"/><path d="m7.4 9.9 1.7 1.7 3.7-3.8"/></svg></span><div class="head-copy"><strong>${escapeHTML(title)}</strong><small>Hallucination Heatmap · local MVP</small></div><button class="close" type="button" aria-label="Close">×</button></header><main>${body}</main></section>`;
    shadow.querySelector('.close')?.addEventListener('click', () => showPanel());
  }

  function clearHighlights() {
    if (!window.CSS || !CSS.highlights) return;
    ['hh-contradicted', 'hh-unverified', 'hh-supported'].forEach((name) => CSS.highlights.delete(name));
  }

  function makeRangeForText(root, target) {
    const needle = String(target || '').trim();
    if (needle.length < 3) return null;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim() || node.parentElement?.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    // Try exact matches inside one text node first; this is the common case.
    for (const textNode of nodes) {
      const index = textNode.nodeValue.indexOf(needle);
      if (index >= 0) {
        const range = document.createRange();
        range.setStart(textNode, index);
        range.setEnd(textNode, index + needle.length);
        return range;
      }
    }
    return null;
  }

  function highlightClaims(messageNode, claims) {
    clearHighlights();
    if (!window.CSS || !CSS.highlights || typeof Highlight === 'undefined') return;
    const groups = { contradicted: [], unverified: [], supported: [] };
    claims.forEach((claim) => {
      const label = statusText(claim.status || claim.verdict);
      const key = label === 'Contradicted' ? 'contradicted' : label === 'Supported' ? 'supported' : 'unverified';
      const range = makeRangeForText(messageNode, claim.text_span || claim.span || '');
      if (range) groups[key].push(range);
    });
    Object.entries(groups).forEach(([key, ranges]) => {
      if (ranges.length) CSS.highlights.set(`hh-${key}`, new Highlight(...ranges));
    });
  }

  scheduleScan();
  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
