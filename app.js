(() => {
  'use strict';

  const examples = {
    policy: {
      id: 'policy',
      label: 'Policy mismatch',
      query: 'Can I return a used blender after 60 days?',
      context: 'RETURNS POLICY · HELP CENTER\nStandard items: unused products in original packaging may be returned within 30 days of delivery.\nDefective items: contact support within 1 year of purchase for assessment.\nRefunds are issued 5–7 business days after approval.',
      sourceLabel: '1 source · returns policy',
      model: 'DEMO MODEL',
      method: 'Token logprobs + evidence check',
      latency: 320,
      evidence_score: 18,
      tokens: [
        ['Yes, ', .95], ['you ', .99], ['can ', .98], ['return ', .97], ['the ', .99], ['used ', .91], ['blender ', .96], ['within ', .98], ['90 ', .38], ['days ', .49], ['of ', .99], ['purchase. ', .96],
        ['The ', .99], ['policy ', .97], ['allows ', .94], ['opened ', .82], ['items, ', .92], ['and ', .98], ['refunds ', .94], ['are ', .99], ['processed ', .88], ['immediately ', .43], ['to ', .99], ['your ', .99], ['original ', .96], ['payment ', .96], ['method. ', .97]
      ].map(([token, confidence]) => ({ token, confidence, logprob: Math.log(confidence) })),
      claims: [
        { claim: 'A used blender can be returned after 60 days.', status: 'contradicted', evidence: 'Standard items must be unused and returned within 30 days of delivery.' },
        { claim: 'The return window is 90 days and refunds are immediate.', status: 'contradicted', evidence: 'The source says 30 days; approved refunds take 5–7 business days.' }
      ],
      preferredToken: '90'
    },
    study: {
      id: 'study',
      label: 'Invented statistics',
      query: 'Create a one-line, evidence-based summary for leadership.',
      context: 'STUDY SUMMARY · 12-WEEK PILOT\nThe pilot included 240 adults using a guided exercise program. Participants reported improved self-reported mobility compared with baseline. The supplied summary does not report an exact effect size, a fall-rate reduction, a control group, or a Stanford affiliation.',
      sourceLabel: '1 source · study summary',
      model: 'DEMO MODEL',
      method: 'Token logprobs + evidence check',
      latency: 410,
      evidence_score: 8,
      tokens: [
        ['A ', .98], ['2023 ', .28], ['Stanford ', .17], ['trial ', .96], ['of ', .98], ['2,400 ', .13], ['patients ', .93], ['found ', .95], ['a ', .99], ['37% ', .16], ['reduction ', .82], ['in ', .99], ['falls ', .69], ['over ', .94], ['six ', .92], ['months. ', .95],
        ['The ', .99], ['program ', .96], ['also ', .97], ['improved ', .96], ['mobility ', .91], ['by ', .98], ['22%, ', .19], ['proving ', .63], ['it ', .99], ['prevents ', .75], ['falls ', .84], ['in ', .99], ['older ', .88], ['adults. ', .95]
      ].map(([token, confidence]) => ({ token, confidence, logprob: Math.log(confidence) })),
      claims: [
        { claim: 'The study was a 2023 Stanford trial of 2,400 patients.', status: 'contradicted', evidence: 'The supplied summary describes a 240-adult pilot and explicitly does not report a Stanford affiliation.' },
        { claim: 'The program reduced falls by 37% and improved mobility by 22%.', status: 'not_in_context', evidence: 'No exact effect size or fall-rate reduction is reported in the source.' },
        { claim: 'The program proves it prevents falls in older adults.', status: 'not_in_context', evidence: 'The source reports self-reported change from baseline; it does not establish causation.' }
      ],
      preferredToken: '37%'
    },
    fact: {
      id: 'fact',
      label: 'Grounded answer',
      query: 'When did Apollo 11 land on the Moon, and who stepped out first?',
      context: 'NASA MISSION SUMMARY\nApollo 11’s lunar module landed on the Moon on July 20, 1969. Neil Armstrong was the first astronaut to descend the ladder to the lunar surface. Buzz Aldrin followed.',
      sourceLabel: '1 source · mission summary',
      model: 'DEMO MODEL',
      method: 'Token logprobs + evidence check',
      latency: 280,
      evidence_score: 98,
      tokens: [
        ['Apollo ', .99], ['11 ', .99], ['landed ', .98], ['on ', .99], ['the ', .99], ['Moon ', .99], ['on ', .99], ['July ', .97], ['20, ', .96], ['1969. ', .99],
        ['Neil ', .99], ['Armstrong ', .99], ['stepped ', .96], ['onto ', .95], ['the ', .99], ['lunar ', .98], ['surface ', .98], ['first, ', .96], ['followed ', .97], ['by ', .99], ['Buzz ', .98], ['Aldrin. ', .99]
      ].map(([token, confidence]) => ({ token, confidence, logprob: Math.log(confidence) })),
      claims: [
        { claim: 'Apollo 11 landed on July 20, 1969.', status: 'supported', evidence: '“Apollo 11’s lunar module landed on the Moon on July 20, 1969.”' },
        { claim: 'Neil Armstrong stepped onto the surface first; Buzz Aldrin followed.', status: 'supported', evidence: '“Neil Armstrong was the first astronaut … Buzz Aldrin followed.”' }
      ],
      preferredToken: '1969.'
    },
    citation: {
      id: 'citation',
      label: 'Fabricated citation',
      query: 'Which court case established the duty-to-warn rule in this memo? Cite it.',
      context: 'INTERNAL LEGAL MEMO · DRAFT\nThe duty-to-warn principle discussed in this memo comes from Tarasoff v. Regents of the University of California (Cal. 1976). The memo cites no other authority and does not discuss federal appellate decisions.',
      sourceLabel: '1 source · legal memo',
      model: 'DEMO MODEL',
      method: 'Token logprobs + evidence check',
      latency: 365,
      evidence_score: 34,
      tokens: [
        ['The ', .99], ['rule ', .95], ['comes ', .93], ['from ', .99], ['Tarasoff ', .97], ['v. ', .99], ['Regents ', .98], ['(1976), ', .91],
        ['later ', .58], ['affirmed ', .41], ['in ', .97], ['Henderson ', .12], ['v. ', .96], ['Mercy ', .09], ['Health, ', .22], ['982 ', .07], ['F.3d ', .31], ['411 ', .06], ['(9th ', .44], ['Cir. ', .93], ['2011). ', .29]
      ].map(([token, confidence]) => ({ token, confidence, logprob: Math.log(confidence) })),
      claims: [
        { claim: 'The duty-to-warn rule comes from Tarasoff v. Regents (1976).', status: 'supported', evidence: '“…comes from Tarasoff v. Regents of the University of California (Cal. 1976).”' },
        { claim: 'The rule was affirmed in Henderson v. Mercy Health, 982 F.3d 411 (9th Cir. 2011).', status: 'not_in_context', evidence: 'The memo cites no other authority and does not discuss federal appellate decisions. Verify any citation in a legal database before use.' }
      ],
      preferredToken: 'Mercy'
    },
    specs: {
      id: 'specs',
      label: 'Spec drift',
      query: 'Summarize the battery life and charging specs for the X200 headphones.',
      context: 'PRODUCT SHEET · X200 WIRELESS HEADPHONES\nBattery life: up to 30 hours with ANC off, 22 hours with ANC on.\nCharging: USB-C. A 10-minute charge provides about 3 hours of playback.\nWireless charging: not supported.',
      sourceLabel: '1 source · product sheet',
      model: 'DEMO MODEL',
      method: 'Token logprobs + evidence check',
      latency: 298,
      evidence_score: 52,
      tokens: [
        ['The ', .99], ['X200 ', .98], ['lasts ', .95], ['up ', .99], ['to ', .99], ['30 ', .94], ['hours ', .99], ['with ', .97], ['ANC ', .96], ['off ', .95], ['and ', .97], ['22 ', .9], ['hours ', .99], ['with ', .98], ['ANC ', .97], ['on. ', .96],
        ['A ', .97], ['10-minute ', .93], ['USB-C ', .88], ['charge ', .97], ['gives ', .9], ['about ', .93], ['5 ', .36], ['hours, ', .7], ['and ', .95], ['it ', .96], ['supports ', .62], ['Qi ', .31], ['wireless ', .87], ['charging. ', .92]
      ].map(([token, confidence]) => ({ token, confidence, logprob: Math.log(confidence) })),
      claims: [
        { claim: 'Battery life is up to 30 hours with ANC off and 22 hours with ANC on.', status: 'supported', evidence: '“Battery life: up to 30 hours with ANC off, 22 hours with ANC on.”' },
        { claim: 'A 10-minute charge gives about 5 hours of playback.', status: 'contradicted', evidence: 'The sheet says a 10-minute charge provides about 3 hours.' },
        { claim: 'The headphones support Qi wireless charging.', status: 'contradicted', evidence: '“Wireless charging: not supported.”' }
      ],
      preferredToken: '5'
    }
  };

  const state = {
    activeExample: 'policy',
    result: null,
    selectedTokenIndex: 0,
    showHeatmap: true,
    backend: { available: false, configured: false, verifierConfigured: false, model: null, baseUrl: null, verifierBaseUrl: null },
    toastTimer: null,
    runCounter: 42
  };

  const $ = (id) => document.getElementById(id);
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const round = (value, digits = 0) => Number(Number(value).toFixed(digits));

  function safeNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function probabilityPercent(value) {
    const n = safeNumber(value);
    if (n === null) return null;
    return Math.round((n <= 1 ? n * 100 : n));
  }

  function averageTokenConfidence(tokens) {
    const values = (tokens || []).map((t) => probabilityPercent(t.confidence)).filter((n) => n !== null);
    return values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  }

  function calculateTrust(evidenceScore, confidenceScore) {
    if (evidenceScore === null || confidenceScore === null) return null;
    return round((evidenceScore * 0.7) + (confidenceScore * 0.3));
  }

  function normalizeStatus(status) {
    const value = String(status || '').toLowerCase().replace(/[ -]/g, '_');
    if (['supported', 'entailed', 'grounded', 'verified'].includes(value)) return 'supported';
    if (['contradicted', 'refuted', 'conflicts', 'false'].includes(value)) return 'contradicted';
    if (['not_in_context', 'not_in_source', 'unsupported', 'not_supported', 'missing'].includes(value)) return 'not_in_context';
    return 'unverified';
  }

  function cloneExample(id) {
    const ex = examples[id];
    const tokens = ex.tokens.map((t) => ({ ...t }));
    const confidence = averageTokenConfidence(tokens);
    return {
      id: `HM-${String(++state.runCounter).padStart(4, '0')}`,
      exampleId: id,
      output: tokens.map((t) => t.token).join(''),
      tokens,
      claims: ex.claims.map((claim) => ({ ...claim, status: normalizeStatus(claim.status) })),
      evidence_score: ex.evidence_score,
      mean_token_confidence: confidence,
      trust_score: calculateTrust(ex.evidence_score, confidence),
      analysis_method: 'logprobs',
      mode: 'demo',
      model: ex.model,
      method_label: ex.method,
      latency_ms: ex.latency,
      context: ex.context,
      source_label: ex.sourceLabel,
      created_at: new Date().toISOString(),
      score_method: 'composite',
      note: 'Curated demonstration data. Not a live model result.'
    };
  }

  function currentExample() { return examples[state.activeExample]; }

  function countWords(text) {
    const trimmed = String(text || '').trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }

  function updateInputCounts() {
    const question = $('questionInput').value;
    const context = $('contextInput').value;
    $('questionCount').textContent = `${question.length} chars`;
    $('contextCount').textContent = `${countWords(context)} words`;
    if ($('modeSelect').value === 'demo' && state.result && (question !== currentExample().query || context !== currentExample().context)) {
      $('modeHint').innerHTML = '<span class="hint-dot"></span><span>Demo output is curated. Switch to an API mode to analyze edits.</span>';
    }
  }

  function updateSelectedExample(id, reset = true) {
    if (!examples[id]) return;
    state.activeExample = id;
    document.querySelectorAll('.example-tab').forEach((button) => {
      const active = button.dataset.example === id;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    const ex = examples[id];
    $('questionInput').value = ex.query;
    $('contextInput').value = ex.context;
    $('existingResponseInput').value = '';
    $('existingResponseInput').closest('details').open = false;
    updateInputCounts();
    if (reset) {
      state.result = cloneExample(id);
      renderResult(state.result);
      $('modeSelect').value = 'demo';
      updateModeUI();
    }
  }

  function setModeHint() {
    const mode = $('modeSelect').value;
    const hint = $('modeHint');
    const modeStatus = $('modeStatus');
    modeStatus.classList.remove('is-offline');
    if (mode === 'demo') {
      hint.innerHTML = `<span class="hint-dot"></span><span>Explore ${Object.keys(examples).length} annotated examples. No API key required.</span>`;
      modeStatus.innerHTML = '<span class="mode-status-dot"></span><span>Curated demo</span>';
      return;
    }
    if (!state.backend.available) {
      hint.innerHTML = '<span class="hint-dot"></span><span>Live modes need the local server: run <code>python3 server.py</code> and open http://localhost:8787.</span>';
      modeStatus.innerHTML = '<span class="mode-status-dot"></span><span>Local server offline</span>';
      modeStatus.classList.add('is-offline');
      return;
    }
    if (mode === 'logprobs') {
      const hasPasted = Boolean($('existingResponseInput')?.value.trim());
      const ready = hasPasted ? state.backend.verifierConfigured : state.backend.configured;
      hint.innerHTML = `<span class="hint-dot"></span><span>${hasPasted ? 'Pasted output will use verifier mode; original token logprobs are unavailable.' : (ready ? 'Ready to call your OpenAI-compatible endpoint.' : 'Set an API key on the local server to run a live request.')}</span>`;
      modeStatus.innerHTML = `<span class="mode-status-dot"></span><span>${ready ? (hasPasted ? 'Verifier ready' : 'Provider connected') : 'Setup required'}</span>`;
      modeStatus.classList.toggle('is-offline', !ready);
      return;
    }
    const canGenerateAndVerify = state.backend.configured && state.backend.verifierConfigured;
    const canVerifyPaste = state.backend.verifierConfigured;
    const hasPasted = Boolean($('existingResponseInput')?.value.trim());
    const ready = hasPasted ? canVerifyPaste : canGenerateAndVerify;
    hint.innerHTML = `<span class="hint-dot"></span><span>${hasPasted ? 'Pasted output uses the verifier only; no original token probabilities.' : 'Uses a second-pass verifier. Results are claim-level estimates, not token probabilities.'}</span>`;
    modeStatus.innerHTML = `<span class="mode-status-dot"></span><span>${ready ? 'Verifier ready' : 'Setup required'}</span>`;
    modeStatus.classList.toggle('is-offline', !ready);
  }

  function updateModeUI() {
    setModeHint();
    const mode = $('modeSelect').value;
    $('runButton').querySelector('span').textContent = mode === 'demo' ? 'Run analysis' : 'Analyze response';
  }

  async function checkBackend() {
    try {
      const response = await fetch('api/config', { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok || !(response.headers.get('Content-Type') || '').includes('application/json')) throw new Error('API is not available');
      const info = await response.json();
      state.backend = {
        available: true,
        configured: Boolean(info.configured),
        verifierConfigured: Boolean(info.verifier_configured),
        model: info.model || null,
        baseUrl: info.base_url || null,
        verifierBaseUrl: info.verifier_base_url || info.base_url || null,
        verifierModel: info.verifier_model || null
      };
      const anyProvider = state.backend.configured || state.backend.verifierConfigured;
      $('serverStatusText').textContent = state.backend.configured ? 'Local API connected' : (state.backend.verifierConfigured ? 'Local verifier ready' : 'Demo data loaded');
      $('serverStatusText').previousElementSibling.style.background = anyProvider ? '#43b397' : '#9a88d8';
    } catch (_error) {
      state.backend = { available: false, configured: false, verifierConfigured: false, model: null, baseUrl: null, verifierBaseUrl: null };
      $('serverStatusText').textContent = 'Demo data loaded';
    }
    updateModeUI();
  }

  function levelForConfidence(confidence) {
    const percent = probabilityPercent(confidence);
    if (percent === null) return 'level-neutral';
    if (percent < 55) return 'level-low';
    if (percent < 85) return 'level-medium';
    return 'level-high';
  }

  function statusClass(status) {
    const normalized = normalizeStatus(status);
    if (normalized === 'supported') return 'level-supported';
    if (normalized === 'contradicted') return 'level-contradicted';
    return 'level-unverified';
  }

  function getDisplayTokens(result) {
    const hasConfidenceTokens = Array.isArray(result.tokens) && result.tokens.some((t) => safeNumber(t.confidence) !== null);
    if (hasConfidenceTokens) {
      return result.tokens.map((token) => ({
        token: token.token ?? token.text ?? '',
        confidence: safeNumber(token.confidence),
        logprob: safeNumber(token.logprob),
        status: token.status ? normalizeStatus(token.status) : null,
        claimIndex: safeNumber(token.claim_index)
      }));
    }
    const output = String(result.output || '');
    const claims = result.claims || [];
    const claimRanges = [];
    claims.forEach((claim, claimIndex) => {
      const span = String(claim.text_span || claim.span || '').trim();
      if (!span) return;
      const start = output.indexOf(span);
      if (start >= 0) claimRanges.push({ start, end: start + span.length, claimIndex, status: normalizeStatus(claim.status || claim.verdict) });
    });
    const words = output.match(/\s+|\S+/g) || [];
    let offset = 0;
    return words.map((token) => {
      const start = offset;
      const end = offset + token.length;
      offset = end;
      if (/^\s+$/.test(token)) return { token, confidence: null, logprob: null, status: null, claimIndex: null };
      const matched = claimRanges.find((range) => start < range.end && end > range.start);
      return {
        token,
        confidence: null,
        logprob: null,
        status: matched ? matched.status : 'unverified',
        claimIndex: matched ? matched.claimIndex : null
      };
    });
  }

  function statusLabel(status) {
    const s = normalizeStatus(status);
    if (s === 'supported') return 'Supported';
    if (s === 'contradicted') return 'Contradicted';
    if (s === 'not_in_context') return 'Not in source';
    return 'Unverified';
  }

  function renderResult(result) {
    state.result = result;
    const tokens = getDisplayTokens(result);
    state.displayTokens = tokens;
    const hasTokenConfidence = tokens.some((t) => probabilityPercent(t.confidence) !== null);
    const method = result.analysis_method || 'logprobs';
    const isVerifier = method === 'verifier' || method === 'verification' || method === 'secondary_verifier';
    const claims = Array.isArray(result.claims) ? result.claims : [];
    const evidenceScore = safeNumber(result.evidence_score);
    const confidence = safeNumber(result.mean_token_confidence) !== null
      ? probabilityPercent(result.mean_token_confidence)
      : (hasTokenConfidence ? averageTokenConfidence(tokens) : null);
    const trustScore = safeNumber(result.trust_score);

    renderMetrics({ trustScore, evidenceScore, confidence, claims, hasTokenConfidence, isVerifier, scoreMethod: result.score_method });
    renderOutput(tokens, result, { hasTokenConfidence, isVerifier });
    renderClaims(claims, isVerifier);
    renderEvidence(result);

    $('runIdLabel').textContent = result.id ? `RUN ${String(result.id).toUpperCase()}` : `RUN HM-${String(++state.runCounter).padStart(4, '0')}`;
    const model = result.model || (result.mode === 'demo' ? 'DEMO MODEL' : state.backend.model || 'CONNECTED MODEL');
    $('modelPill').innerHTML = `<span class="model-dot"></span> ${escapeHTML(String(model).toUpperCase())}`;
    $('methodLabel').textContent = result.method_label || (isVerifier ? 'Secondary verifier · claim-level estimate' : (evidenceScore === null ? 'Token logprobs · no source check' : 'Token logprobs + claim verification'));
    $('latencyLabel').textContent = result.latency_ms ? `${Math.round(result.latency_ms)} ms` : (result.mode === 'demo' ? 'Demo' : '—');
    $('methodCardTitle').textContent = isVerifier ? 'Verifier support is not token confidence' : 'Two signals, never blended blindly';
    $('methodCardText').textContent = isVerifier
      ? 'The secondary model estimates whether claims are supported, contradicted, or unverified. Without the original provider’s logprobs, this is not a token probability or proof of truth.'
      : (evidenceScore === null
          ? 'Token probability measures model choice likelihood, not truth. Add a source context or verifier pass to score whether factual claims are supported.'
          : 'Token probability measures model choice likelihood. Claim checks measure support in the supplied source. A confident contradiction should still fail the evidence check.');
    $('confidenceLegend').classList.toggle('verifier-legend', isVerifier);
    if (isVerifier) {
      $('confidenceLegend').innerHTML = '<span class="legend-title">CLAIM SUPPORT</span><span class="legend-item"><i class="legend-swatch low"></i>Contradicted</span><span class="legend-item"><i class="legend-swatch medium"></i>Unverified</span><span class="legend-item"><i class="legend-swatch high"></i>Supported</span><span class="legend-help">Verifier estimate · not logprobs</span>';
    } else {
      $('confidenceLegend').innerHTML = '<span class="legend-title">CONFIDENCE</span><span class="legend-item"><i class="legend-swatch low"></i>Low <b>&lt;55%</b></span><span class="legend-item"><i class="legend-swatch medium"></i>Mixed <b>55–84%</b></span><span class="legend-item"><i class="legend-swatch high"></i>High <b>≥85%</b></span><span class="legend-help">Hover, click, or use ← → keys</span>';
    }
    const subtitle = isVerifier
      ? 'Verifier-estimated claim support · not token probabilities.'
      : (hasTokenConfidence ? 'Select a token to inspect its probability.' : 'No token logprobs were returned by this provider.');
    $('responseSubtitle').textContent = subtitle;
    const selected = chooseInitialToken(tokens, result);
    selectToken(selected, false);
    if (!state.showHeatmap) $('responseText').classList.add('plain-mode');
  }

  function renderMetrics({ trustScore, evidenceScore, confidence, claims, hasTokenConfidence, isVerifier, scoreMethod }) {
    const dialProgress = $('dialProgress');
    const circumference = 2 * Math.PI * 41;
    const score = trustScore === null ? null : Math.max(0, Math.min(100, trustScore));
    $('trustScoreValue').textContent = score === null ? '—' : String(Math.round(score));
    dialProgress.style.strokeDasharray = String(circumference);
    dialProgress.style.strokeDashoffset = String(score === null ? circumference : circumference * (1 - score / 100));
    const color = score === null ? '#cbd3da' : score >= 80 ? '#4aa98e' : score >= 50 ? '#d1a34f' : '#d2775e';
    dialProgress.style.stroke = color;
    $('trustDial').setAttribute('aria-label', score === null ? 'Trust score unavailable' : `Trust score ${Math.round(score)} out of 100`);
    const trustLabel = score === null ? 'Not scored' : score >= 80 ? 'Strong signal' : score >= 50 ? 'Mixed signal' : 'Needs review';
    $('trustLabel').textContent = trustLabel;
    $('trustLabel').style.color = color;
    const composite = scoreMethod === 'composite' || (trustScore !== null && evidenceScore !== null && confidence !== null && !isVerifier);
    $('trustFormula').textContent = composite ? 'Evidence 70% · confidence 30%' : (score !== null ? (isVerifier ? 'Evidence-only score' : 'Provider score') : 'Requires source context');
    $('trustMethod').textContent = composite ? 'Prototype composite · not calibrated' : (score !== null ? 'Review with source evidence' : 'No truth score inferred');

    if (evidenceScore === null) {
      $('evidenceMetricLabel').textContent = 'SOURCE ALIGNMENT';
      $('evidenceValue').innerHTML = '—';
      $('evidenceProgress').style.width = '0%';
      $('evidenceProgress').className = 'progress-warn';
      $('evidenceCaption').textContent = 'Add source context to measure grounding';
      $('claimCountBadge').textContent = claims.length ? `${claims.length} claims checked` : 'No source context';
      $('claimCountBadge').className = 'metric-badge badge-warn';
    } else {
      $('evidenceMetricLabel').textContent = isVerifier ? 'VERIFIER / SOURCE ALIGNMENT' : 'EVIDENCE ALIGNMENT';
      $('evidenceValue').innerHTML = `${Math.round(evidenceScore)}<span>%</span>`;
      $('evidenceProgress').style.width = `${Math.max(0, Math.min(100, evidenceScore))}%`;
      $('evidenceProgress').className = evidenceScore >= 80 ? 'progress-good' : evidenceScore >= 50 ? 'progress-warn' : 'progress-risk';
      $('evidenceCaption').textContent = isVerifier ? 'Secondary-model estimate against context' : 'Claim support against supplied context';
      const riskCount = claims.filter((c) => normalizeStatus(c.status || c.verdict) !== 'supported').length;
      $('claimCountBadge').textContent = riskCount ? `${riskCount} claim${riskCount === 1 ? '' : 's'} at risk` : `${claims.length} supported`;
      $('claimCountBadge').className = `metric-badge ${riskCount ? 'badge-risk' : 'badge-good'}`;
    }

    $('confidenceMetricLabel').textContent = isVerifier ? 'TOKEN LOGPROBS' : 'MEAN TOKEN CONFIDENCE';
    if (confidence === null || !hasTokenConfidence) {
      $('confidenceValue').innerHTML = '<span>—</span>';
      $('confidenceProgress').style.width = '0%';
      $('confidenceProgress').className = 'progress-warn';
      $('confidenceBadge').textContent = isVerifier ? 'Not available' : 'Not returned';
      $('confidenceBadge').className = 'metric-badge badge-warn';
      $('confidenceCaption').textContent = isVerifier ? 'Verifier mode does not produce token probabilities' : 'Provider did not return token logprobs';
    } else {
      $('confidenceValue').innerHTML = `${Math.round(confidence)}<span>%</span>`;
      $('confidenceProgress').style.width = `${Math.max(0, Math.min(100, confidence))}%`;
      $('confidenceProgress').className = confidence >= 85 ? 'progress-good' : confidence >= 55 ? 'progress-warn' : 'progress-risk';
      $('confidenceBadge').textContent = confidence >= 85 ? 'Model confident' : confidence >= 55 ? 'Mixed signals' : 'Low confidence';
      $('confidenceBadge').className = `metric-badge ${confidence >= 85 ? 'badge-good' : confidence >= 55 ? 'badge-warn' : 'badge-risk'}`;
      $('confidenceCaption').textContent = 'Mean selected-token probability · not truth';
    }
  }

  function chooseInitialToken(tokens, result) {
    if (!tokens.length) return 0;
    const preferred = currentExample()?.preferredToken;
    if (result.mode === 'demo' && preferred) {
      const found = tokens.findIndex((t) => String(t.token).trim() === preferred);
      if (found >= 0) return found;
    }
    let lowest = null;
    let lowestIndex = 0;
    tokens.forEach((token, index) => {
      const pct = probabilityPercent(token.confidence);
      if (pct !== null && (lowest === null || pct < lowest)) { lowest = pct; lowestIndex = index; }
    });
    return lowestIndex;
  }

  function renderOutput(tokens, result, { hasTokenConfidence, isVerifier }) {
    const response = $('responseText');
    if (!tokens.length) {
      response.textContent = result.output || '(No output returned)';
      return;
    }
    response.innerHTML = tokens.map((token, index) => {
      const text = String(token.token ?? '');
      if (/^\s+$/.test(text)) return escapeHTML(text);
      const confidence = probabilityPercent(token.confidence);
      const status = token.status ? normalizeStatus(token.status) : null;
      const cls = confidence !== null ? levelForConfidence(token.confidence) : statusClass(status || 'unverified');
      const title = confidence !== null
        ? `${escapeHTML(text.trim())} · token probability ${confidence}%${token.logprob !== null ? ` · logprob ${Number(token.logprob).toFixed(2)}` : ''}`
        : `${escapeHTML(text.trim())} · ${statusLabel(status || 'unverified')} · verifier estimate`;
      return `<span class="heat-token ${cls}" data-token-index="${index}" title="${title}">${escapeHTML(text)}</span>`;
    }).join('');
    response.classList.toggle('verifier-output', isVerifier && !hasTokenConfidence);
    response.classList.toggle('plain-mode', !state.showHeatmap);
    response.querySelectorAll('.heat-token').forEach((span) => {
      span.addEventListener('mouseenter', () => selectToken(Number(span.dataset.tokenIndex), false));
      span.addEventListener('click', (event) => { event.stopPropagation(); selectToken(Number(span.dataset.tokenIndex), true); });
    });
  }

  function selectToken(index, markSelected = true) {
    const tokens = state.displayTokens || [];
    if (!tokens.length) return;
    const bounded = Math.max(0, Math.min(index, tokens.length - 1));
    state.selectedTokenIndex = bounded;
    const token = tokens[bounded];
    const text = String(token.token || '').replace(/\s+/g, ' ').trim();
    const confidence = probabilityPercent(token.confidence);
    const result = state.result || {};
    const isVerifier = ['verifier', 'verification', 'secondary_verifier'].includes(result.analysis_method);
    const matchedClaim = token.claimIndex !== null && token.claimIndex !== undefined && result.claims?.[token.claimIndex]
      ? result.claims[token.claimIndex]
      : findClaimForToken(token, result.claims || []);
    const status = token.status || (matchedClaim ? normalizeStatus(matchedClaim.status || matchedClaim.verdict) : 'unverified');
    $('inspectorToken').textContent = text ? `“${text}”` : 'Whitespace';
    $('inspectorToken').title = text;
    if (confidence !== null) {
      $('inspectorLabel').textContent = 'TOKEN INSPECTOR';
      $('inspectorDetail').textContent = 'Selected token · next-token probability';
      $('inspectorStatLabel').textContent = 'TOKEN CONFIDENCE';
      $('inspectorStatValue').textContent = `${confidence}%`;
      $('inspectorLogprob').textContent = token.logprob === null || token.logprob === undefined ? '—' : `${Number(token.logprob).toFixed(2)}`;
      $('inspectorIcon').textContent = 'Aa';
    } else {
      $('inspectorLabel').textContent = isVerifier ? 'CLAIM CHECK' : 'TOKEN INSPECTOR';
      $('inspectorDetail').textContent = isVerifier ? 'Secondary verifier estimate · not a token probability' : 'Provider did not return token logprobs';
      $('inspectorStatLabel').textContent = isVerifier ? 'VERDICT' : 'CONFIDENCE';
      $('inspectorStatValue').textContent = isVerifier ? statusLabel(status) : 'N/A';
      $('inspectorLogprob').textContent = '—';
      $('inspectorIcon').textContent = isVerifier ? (normalizeStatus(status) === 'supported' ? '✓' : normalizeStatus(status) === 'contradicted' ? '!' : '?') : 'Aa';
    }
    $('responseText').querySelectorAll('.heat-token').forEach((span) => span.classList.toggle('selected', Number(span.dataset.tokenIndex) === bounded));
    if (markSelected) {
      $('responseText').querySelector('.heat-token.selected')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  function moveTokenSelection(step) {
    const tokens = state.displayTokens || [];
    let index = state.selectedTokenIndex;
    for (let i = 0; i < tokens.length; i += 1) {
      index += step;
      if (index < 0 || index >= tokens.length) return;
      if (!/^\s*$/.test(String(tokens[index].token || ''))) break;
    }
    selectToken(index, true);
  }

  function findClaimForToken(token, claims) {
    const text = String(token.token || '').trim().toLowerCase().replace(/^[^\p{L}\p{N}%]+|[^\p{L}\p{N}%]+$/gu, '');
    if (!text) return null;
    return claims.find((claim) => {
      const span = String(claim.text_span || claim.span || '').toLowerCase();
      return span && span.includes(text);
    }) || null;
  }

  function renderClaims(claims, isVerifier) {
    $('checksCount').textContent = `${claims.length} check${claims.length === 1 ? '' : 's'}`;
    if (!claims.length) {
      $('claimsList').innerHTML = `<div class="claim-row status-unverified"><div class="claim-symbol">?</div><div><div class="claim-text">No claim check available.</div><div class="claim-evidence">${isVerifier ? 'Verifier returned no structured claims.' : 'Add source context and run a verifier pass to check factual support.'}</div></div><span class="claim-status">Not checked</span></div>`;
      return;
    }
    $('claimsList').innerHTML = claims.map((claim) => {
      const status = normalizeStatus(claim.status || claim.verdict);
      const label = statusLabel(status);
      const symbol = status === 'supported' ? '✓' : status === 'contradicted' ? '!' : '?';
      const evidence = claim.evidence || claim.evidence_quote || claim.reason || (isVerifier ? 'Verifier did not provide a source quote.' : 'No supporting quote was returned.');
      const confidence = probabilityPercent(claim.confidence);
      const extra = confidence !== null ? ` · verifier ${confidence}%` : '';
      return `<div class="claim-row status-${status}"><div class="claim-symbol">${symbol}</div><div><div class="claim-text">${escapeHTML(claim.claim || claim.text || 'Claim')}</div><div class="claim-evidence">${escapeHTML(evidence)}${extra ? `<em>${escapeHTML(extra)}</em>` : ''}</div></div><span class="claim-status">${escapeHTML(label)}</span></div>`;
    }).join('');
  }

  function renderEvidence(result) {
    const context = String(result.context ?? $('contextInput').value ?? '').trim();
    if (context) {
      $('sourcePreview').textContent = context.length > 390 ? `${context.slice(0, 390).trim()}…` : context;
      $('sourceStatus').textContent = result.source_label || (result.mode === 'demo' ? '1 source · demo corpus' : 'Supplied context');
      $('viewFullContext').disabled = false;
      $('viewFullContext').style.opacity = '1';
    } else {
      $('sourcePreview').textContent = 'No supporting context was attached. The verifier can offer a best-effort review, but source alignment and a source-grounded trust score are unavailable.';
      $('sourceStatus').textContent = 'No source context';
      $('viewFullContext').disabled = true;
      $('viewFullContext').style.opacity = '.45';
    }
  }

  function toast(message, isError = false) {
    const node = $('toast');
    $('toastMessage').textContent = message;
    node.classList.toggle('error', isError);
    node.classList.add('visible');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => node.classList.remove('visible'), 2600);
  }

  async function runAnalysis() {
    const mode = $('modeSelect').value;
    const question = $('questionInput').value.trim();
    const context = $('contextInput').value.trim();
    const existing = $('existingResponseInput').value.trim();
    if (!question && !(existing && mode !== 'demo')) { toast('Add a question or task first.', true); $('questionInput').focus(); return; }
    if (mode === 'demo') {
      const ex = currentExample();
      if (question !== ex.query || context !== ex.context) {
        toast('Demo output is curated. Connect an API to analyze edited inputs.', true);
        return;
      }
      state.result = cloneExample(state.activeExample);
      renderResult(state.result);
      toast('Curated example reloaded. This is not a live model call.');
      return;
    }
    if (!state.backend.available) {
      openModal('settings');
      toast('Live modes need the local server. Run python3 server.py, then open http://localhost:8787.', true);
      return;
    }
    const missingCredentials = existing
      ? !state.backend.verifierConfigured
      : (!state.backend.configured || (mode === 'verify' && !state.backend.verifierConfigured));
    if (missingCredentials) {
      openModal('settings');
      toast(existing ? 'Configure a verifier API key to review pasted output.' : 'Configure the required provider credentials on the local server.', true);
      return;
    }
    const actualMode = existing ? 'verify' : mode;
    if (existing && mode === 'logprobs') toast('Pasted output has no original logprobs; using verifier mode.');
    const button = $('runButton');
    button.disabled = true;
    button.classList.add('loading');
    button.querySelector('span').textContent = 'Analyzing…';
    try {
      const response = await fetch('api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: question, context, mode: actualMode, existing_response: existing })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || payload.message || `Analysis failed (${response.status})`);
      const normalized = {
        ...payload,
        id: payload.id || `HM-${String(++state.runCounter).padStart(4, '0')}`,
        mode: actualMode,
        context,
        source_label: context ? 'Supplied context · API run' : 'No source context',
        created_at: payload.created_at || new Date().toISOString()
      };
      if (normalized.mean_token_confidence === undefined || normalized.mean_token_confidence === null) normalized.mean_token_confidence = averageTokenConfidence(normalized.tokens || []);
      if (normalized.trust_score === undefined) normalized.trust_score = calculateTrust(safeNumber(normalized.evidence_score), safeNumber(normalized.mean_token_confidence));
      if (!normalized.method_label) normalized.method_label = normalized.analysis_method === 'verifier'
        ? 'Secondary verifier · claim-level estimate'
        : (normalized.evidence_score === null ? 'Token logprobs · no source check' : 'Token logprobs + claim verification');
      renderResult(normalized);
      $('serverStatusText').textContent = 'Live analysis complete';
      if (Array.isArray(normalized.warnings) && normalized.warnings.length) {
        toast(normalized.warnings[0], true);
      } else {
        toast(normalized.analysis_method === 'verifier' ? 'Verifier analysis complete. Review claim-level estimates.' : 'Live analysis complete. Review low-confidence tokens and claims.');
      }
    } catch (error) {
      toast(error.message || 'Could not reach the analyzer.', true);
      if (/fetch|network|failed to fetch/i.test(error.message || '')) $('serverStatusText').textContent = 'Local API unavailable';
    } finally {
      button.disabled = false;
      button.classList.remove('loading');
      updateModeUI();
    }
  }

  async function copyOutput() {
    const text = state.result?.output || '';
    if (!text) return toast('There is no response to copy.', true);
    try {
      await navigator.clipboard.writeText(text);
      toast('Model response copied to clipboard.');
    } catch (_error) {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
      toast('Model response copied to clipboard.');
    }
  }

  function exportResult() {
    if (!state.result) return toast('No analysis result to export.', true);
    const result = state.result;
    const tokens = getDisplayTokens(result);
    const exportData = {
      schema: 'hallucination-heatmap/v1',
      run_id: result.id || null,
      created_at: result.created_at || new Date().toISOString(),
      model: result.model || null,
      analysis_method: result.analysis_method || 'logprobs',
      source_context_provided: Boolean(String(result.context || '').trim()),
      score_scale: '0-100',
      token_confidence_scale: '0-1 probability',
      trust_score: safeNumber(result.trust_score),
      trust_score_method: result.score_method === 'composite'
        ? 'prototype composite: 70% evidence alignment + 30% mean token confidence'
        : result.score_method === 'evidence_only'
          ? 'evidence-only verifier estimate; token logprobs unavailable'
          : (safeNumber(result.evidence_score) !== null && safeNumber(result.mean_token_confidence) !== null ? 'prototype composite: 70% evidence alignment + 30% mean token confidence' : null),
      evidence_alignment: safeNumber(result.evidence_score),
      mean_token_confidence: safeNumber(result.mean_token_confidence),
      output: result.output || '',
      claims: (result.claims || []).map((claim) => ({
        claim: claim.claim || claim.text || '',
        text_span: claim.text_span || null,
        verdict: normalizeStatus(claim.status || claim.verdict),
        verifier_confidence: safeNumber(claim.confidence),
        evidence: claim.evidence || claim.evidence_quote || null
      })),
      tokens: tokens.map((token) => ({
        token: token.token,
        confidence: safeNumber(token.confidence),
        logprob: safeNumber(token.logprob),
        evidence_status: token.status ? normalizeStatus(token.status) : undefined
      })),
      caveat: 'Model confidence is not factual truth. Verifier outputs are estimates. The prototype trust score is a heuristic and is not calibrated.'
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slugify(result.id || 'heatmap-run')}-trust-score.json`;
    document.body.appendChild(link); link.click(); link.remove();
    URL.revokeObjectURL(url);
    toast('Trust score and claim audit exported as JSON.');
  }

  function slugify(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  function openModal(section = 'settings') {
    const title = $('modalTitle');
    const content = $('modalContent');
    let html = '';
    if (section === 'settings') {
      title.textContent = 'Connection settings';
      const connected = state.backend.configured;
      const verifierConnected = state.backend.verifierConfigured;
      const anyConnection = connected || verifierConnected;
      const generationDetail = connected ? `Generation: ${escapeHTML(state.backend.model || 'configured')} · ${escapeHTML(state.backend.baseUrl || 'endpoint configured')}` : 'Generation: not configured';
      const verifierDetail = verifierConnected ? `Verifier: ${escapeHTML(state.backend.verifierModel || 'configured')} · ${escapeHTML(state.backend.verifierBaseUrl || state.backend.baseUrl || 'endpoint configured')}` : 'Verifier: not configured';
      const connectionSummary = `${generationDetail} · ${verifierDetail}`;
      html = `<p class="modal-lead">Connect an OpenAI-compatible chat completions endpoint from the local server. The browser never receives your provider API key.</p>
        <div class="setting-status ${anyConnection ? 'connected' : ''}"><i class="setting-status-dot"></i><div><strong>${!state.backend.available ? 'Local server not detected' : connected ? 'Generation provider detected' : verifierConnected ? 'Verifier-only connection detected' : 'Demo mode is ready; no API key detected'}</strong><small>${!state.backend.available ? 'This page is running as a static demo. Clone the repo and run python3 server.py to enable live analysis.' : anyConnection ? connectionSummary : 'Add your credentials to .env, then restart server.py.'}</small></div></div>
        <h3 class="modal-section-title">Quick start</h3>
        <div class="modal-code">git clone https://github.com/SYasJ/hallucination-heatmap.git
cd hallucination-heatmap
cp .env.example .env   <span class="code-muted"># add your key</span>
python3 server.py      <span class="code-muted"># → http://localhost:8787</span></div>
        <h3 class="modal-section-title">Local configuration</h3>
        <div class="modal-code">LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your-key-here
LLM_MODEL=gpt-4o-mini

<span class="code-muted"># Optional separate verifier</span>
VERIFIER_MODEL=your-verifier-model</div>
        <div class="modal-callout"><span>ⓘ</span><div><strong>Keep secrets server-side.</strong> Copy <code>.env.example</code> to <code>.env</code>. The local Python server reads it. Never put a provider key in browser JavaScript or commit a real <code>.env</code> file.</div></div>
        <button class="secondary-button" id="checkConnectionButton" type="button"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 9.5A6 6 0 0 0 5.8 5.2L4 7M4 7V3.8M4 7h3.2M4 10.5A6 6 0 0 0 14.2 14.8L16 13m0 0v3.2M16 13h-3.2"/></svg>Check local connection</button>`;
    } else if (section === 'api') {
      title.textContent = 'API & RAG integration';
      html = `<p class="modal-lead">Wrap an OpenAI-compatible generation call, keep token logprobs with the response, and export a compact trust record into your retrieval or evaluation pipeline.</p>
        <h3 class="modal-section-title">POST /api/analyze</h3>
        <div class="modal-code">curl -X POST http://localhost:8787/api/analyze \\
  -H 'Content-Type: application/json' \\
  -d '{
    "prompt": "Can I return this after 60 days?",
    "context": "Unused items: 30-day return window.",
    "mode": "logprobs"
  }'</div>
        <div class="modal-callout"><span>↳</span><div><strong>RAG handoff:</strong> the downloadable JSON includes <code>trust_score</code>, <code>evidence_alignment</code>, <code>mean_token_confidence</code>, claim verdicts, token logprobs, and a caveat. Scores are heuristic; set your own thresholds and review policy.</div></div>
        <h3 class="modal-section-title">Response modes</h3>
        <div class="modal-example-steps"><b>1</b><div><strong>logprobs</strong> — requests selected-token log probabilities from compatible chat completions APIs.</div><b>2</b><div><strong>verify</strong> — generates (or accepts pasted output) and makes a separate claim-support pass. Highlights are verifier estimates, not token probabilities.</div><b>3</b><div><strong>demo</strong> — five fixed, annotated examples; no network request and no generated data.</div></div>
        <h3 class="modal-section-title">Python client</h3>
        <div class="modal-code">from heatmap_client import HeatmapClient

run = HeatmapClient().analyze(
    "Can I return this after 60 days?",
    context="Unused items: 30-day return window.",
)
print(run["trust_score"], run["claims"])</div>
        <div class="modal-callout"><span>↳</span><div><strong>More examples:</strong> see the <code>examples/</code> folder for a RAG gate, batch evaluation to CSV, and an offline mock provider.</div></div>`;
    } else if (section === 'extension') {
      title.textContent = 'Browser extension · local MVP';
      html = `<p class="modal-lead">A Manifest V3 prototype adds an “Analyze answer” action to assistant messages on ChatGPT and Claude. It sends text only after you click; it does not monitor or upload conversations automatically.</p>
        <div class="modal-example-steps"><b>1</b><div>Start the local analyzer with <code>python3 server.py</code> and configure a verifier model.</div><b>2</b><div>Open <code>chrome://extensions</code>, turn on Developer mode, choose <strong>Load unpacked</strong>, then select the project’s <code>extension/</code> folder.</div><b>3</b><div>On ChatGPT or Claude, click <strong>Analyze answer</strong> under a response. The extension returns a best-effort verifier review.</div></div>
        <div class="modal-callout warning"><span>!</span><div><strong>Best-effort DOM hooks.</strong> ChatGPT/Claude page markup changes often. This extension is a source prototype, not a store-ready release. Without retrieved context it cannot establish source-grounded truth; review its verdicts.</div></div>
        <div class="modal-code">Local endpoint: http://127.0.0.1:8787
Permissions: chatgpt.com, claude.ai, local analyzer only</div>`;
    } else if (section === 'scoring') {
      title.textContent = 'Reading confidence & trust';
      html = `<p class="modal-lead">Heatmap deliberately separates two kinds of signal that are easy to conflate.</p>
        <div class="modal-example-steps"><b>A</b><div><strong>Token confidence</strong> = exp(logprob) for the token the model selected. Red marks lower probability, amber mixed, green higher. This is model self-likelihood, not calibrated factual accuracy.</div><b>B</b><div><strong>Evidence alignment</strong> = a claim-level verifier’s estimate of support or contradiction against supplied context. A separate model can also be wrong.</div><b>C</b><div><strong>Prototype trust score</strong> = 70% evidence alignment + 30% mean token confidence when both are available. If logprobs are unavailable, the verifier-only score is evidence-only. It is an illustrative heuristic, not a calibrated or universal score.</div></div>
        <div class="modal-callout warning"><span>!</span><div><strong>Do not treat red as proof of a hallucination—or green as proof of truth.</strong> A confidently wrong token can be green. Use source citations, domain checks, and human review for high-stakes use.</div></div>`;
    } else if (section === 'context') {
      title.textContent = 'Source context used';
      const context = state.result?.context || $('contextInput').value || 'No source context provided.';
      html = `<p class="modal-lead">The exact context submitted for this result:</p><div class="modal-code modal-code-prose">${escapeHTML(context)}</div>`;
    }
    content.innerHTML = html;
    if (!$('modalBackdrop').classList.contains('open')) state.lastFocus = document.activeElement;
    $('modalBackdrop').classList.add('open');
    $('modalBackdrop').setAttribute('aria-hidden', 'false');
    $('modalClose').focus();
    const checkButton = $('checkConnectionButton');
    if (checkButton) checkButton.addEventListener('click', async () => {
      checkButton.disabled = true;
      checkButton.textContent = 'Checking…';
      await checkBackend();
      checkButton.disabled = false;
      openModal('settings');
      toast(state.backend.configured ? 'Local API is configured.' : 'API server is running, but no key is configured.');
    });
  }

  function closeModal() {
    if (!$('modalBackdrop').classList.contains('open')) return;
    $('modalBackdrop').classList.remove('open');
    $('modalBackdrop').setAttribute('aria-hidden', 'true');
    if (state.lastFocus && typeof state.lastFocus.focus === 'function') state.lastFocus.focus();
    state.lastFocus = null;
  }

  function trapModalFocus(event) {
    if (event.key !== 'Tab' || !$('modalBackdrop').classList.contains('open')) return;
    const focusable = Array.from($('modalBackdrop').querySelectorAll('button:not([disabled]), a[href], textarea, select, [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function bindEvents() {
    const tabs = Array.from(document.querySelectorAll('.example-tab'));
    tabs.forEach((button, index) => {
      button.addEventListener('click', () => updateSelectedExample(button.dataset.example));
      button.addEventListener('keydown', (event) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        let next = null;
        if (event.key in keys) next = (index + keys[event.key] + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        tabs[next].focus();
        updateSelectedExample(tabs[next].dataset.example);
      });
    });
    $('responseText').addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); moveTokenSelection(1); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); moveTokenSelection(-1); }
    });
    $('modeSelect').addEventListener('change', updateModeUI);
    $('runButton').addEventListener('click', runAnalysis);
    $('exportButton').addEventListener('click', exportResult);
    $('copyOutputButton').addEventListener('click', copyOutput);
    $('resetExampleButton').addEventListener('click', () => {
      $('modeSelect').value = 'demo';
      updateSelectedExample(state.activeExample);
      toast('Restored the curated example.');
    });
    $('clearContext').addEventListener('click', () => { $('contextInput').value = ''; updateInputCounts(); toast('Source context cleared.'); });
    $('clearResponse').addEventListener('click', () => { $('existingResponseInput').value = ''; toast('Pasted response cleared.'); });
    $('questionInput').addEventListener('input', updateInputCounts);
    $('contextInput').addEventListener('input', updateInputCounts);
    $('existingResponseInput').addEventListener('input', () => {
      if ($('modeSelect').value === 'demo' && $('existingResponseInput').value.trim()) {
        $('modeHint').innerHTML = '<span class="hint-dot"></span><span>Select Verifier mode to check pasted output; original token logprobs are unavailable.</span>';
      } else if ($('modeSelect').value !== 'demo') {
        updateModeUI();
      }
    });
    $('toggleWordView').addEventListener('click', () => {
      state.showHeatmap = !state.showHeatmap;
      $('responseText').classList.toggle('plain-mode', !state.showHeatmap);
      $('toggleWordView').innerHTML = `${state.showHeatmap ? 'Heatmap' : 'Plain text'} <span class="toggle-pill ${state.showHeatmap ? 'active' : ''}" aria-hidden="true"><i></i></span>`;
      $('toggleWordView').setAttribute('aria-pressed', String(state.showHeatmap));
      toast(state.showHeatmap ? 'Heatmap enabled.' : 'Heatmap hidden.');
    });
    $('settingsButton').addEventListener('click', () => openModal('settings'));
    $('helpButton').addEventListener('click', () => openModal('scoring'));
    $('apiButton').addEventListener('click', () => openModal('api'));
    $('privacyMore').addEventListener('click', () => openModal('settings'));
    $('viewFullContext').addEventListener('click', () => openModal('context'));
    document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => {
      const nav = button.dataset.nav;
      if (nav === 'lab') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (nav === 'examples') { document.querySelector('.example-picker').scrollIntoView({ behavior: 'smooth', block: 'center' }); document.querySelector('.example-tab.active')?.focus({ preventScroll: true }); return; }
      if (nav === 'guide') { $('guide').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      openModal(nav);
    }));
    $('modalClose').addEventListener('click', closeModal);
    $('modalDone').addEventListener('click', closeModal);
    $('modalBackdrop').addEventListener('click', (event) => { if (event.target === $('modalBackdrop')) closeModal(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); trapModalFocus(event); });
  }

  function init() {
    bindEvents();
    updateSelectedExample('policy');
    checkBackend();
  }

  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
