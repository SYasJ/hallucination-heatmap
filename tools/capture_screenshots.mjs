#!/usr/bin/env node
// Capture real browser screenshots of the demo states, plus favicons and the
// social-sharing (Open Graph) image.
//
// Usage:
//   python3 server.py &                      # serve the app on :8787
//   npm i -D playwright && npx playwright install chromium   # once
//   node tools/capture_screenshots.mjs [http://localhost:8787/]
//
// Set CHROMIUM_PATH to reuse an existing Chromium binary.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2] || 'http://localhost:8787/';
const out = (...parts) => path.join(ROOT, ...parts);

const SCENES = [
  { file: '01-policy-mismatch.png', example: 'policy' },
  { file: '02-invented-statistics.png', example: 'study' },
  { file: '03-grounded-answer.png', example: 'fact' },
  { file: '04-fabricated-citation.png', example: 'citation' },
  { file: '05-spec-drift.png', example: 'specs' },
];

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  for (const scene of SCENES) {
    await page.click(`[data-example="${scene.example}"]`);
    await page.waitForTimeout(450); // let the dial/progress transitions settle
    await page.screenshot({ path: out('screenshots', scene.file), clip: { x: 0, y: 0, width: 1440, height: 1000 } });
    console.log('wrote screenshots/' + scene.file);
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  await mobile.goto(BASE, { waitUntil: 'networkidle' });
  await mobile.screenshot({ path: out('screenshots', 'mobile.png') });
  console.log('wrote screenshots/mobile.png');

  // Open Graph card built around a live capture of the output inspector.
  await page.click('[data-example="policy"]');
  await page.waitForTimeout(450);
  const shot = await page.locator('.output-panel').screenshot();
  const card = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await card.setContent(`<!doctype html><html><body style="margin:0">
    <div style="width:1200px;height:630px;display:flex;gap:40px;align-items:center;padding:0 0 0 64px;box-sizing:border-box;
      background:linear-gradient(135deg,#172337 0%,#1f3550 100%);font-family:Inter,system-ui,sans-serif;overflow:hidden">
      <div style="flex:0 0 430px;color:#fff">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:28px">
          <img src="data:image/svg+xml;base64,${(await readFile(out('assets', 'favicon.svg'))).toString('base64')}" width="56" height="56">
          <span style="font-size:19px;font-weight:650;letter-spacing:-.2px;color:#c9d6e3">Hallucination detection for LLM &amp; RAG</span>
        </div>
        <div style="font-size:50px;line-height:1.05;font-weight:800;letter-spacing:-2px">LLM Hallucination<br><span style="color:#58cdb2">Detector</span></div>
        <p style="margin:22px 0 0;font-size:23px;line-height:1.4;color:#c9d6e3">See where your LLM is guessing. Token logprobs + claim checks against your sources.</p>
        <p style="margin:26px 0 0;font-size:16px;color:#8fa3b8">Free · open source · runs locally · OpenAI-compatible</p>
      </div>
      <img src="data:image/png;base64,${shot.toString('base64')}" style="width:760px;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.45);align-self:flex-start;margin-top:70px">
    </div></body></html>`);
  await card.screenshot({ path: out('assets', 'og-image.png') });
  console.log('wrote assets/og-image.png');

  // PNG icons from the SVG favicon.
  const svg = (await readFile(out('assets', 'favicon.svg'))).toString('base64');
  for (const [name, size] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512], ['../extension/icons/icon-16.png', 16], ['../extension/icons/icon-48.png', 48], ['../extension/icons/icon-128.png', 128]]) {
    const icon = await browser.newPage({ viewport: { width: size, height: size } });
    await icon.setContent(`<html><body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${svg}" width="${size}" height="${size}" style="display:block"></body></html>`);
    await icon.screenshot({ path: out('assets', name), omitBackground: true });
    await icon.close();
    console.log('wrote assets/' + name);
  }
} finally {
  await browser.close();
}
