# ❓ FAQ

<details><summary><b>Can token logprobs alone detect hallucinations?</b></summary>

Partly. Low probability often marks guesses (invented numbers, names, citations), but models can be **confidently wrong**. That's why claim checking against your sources carries 70% of the trust score.
</details>

<details><summary><b>Does it work with ChatGPT, Claude or Gemini?</b></summary>

Yes, in **verifier mode**: paste the answer, or use the [[Chrome Extension]]. Consumer chat apps don't expose token logprobs, so you get claim-level review only.
</details>

<details><summary><b>Which models support logprobs?</b></summary>

Many OpenAI chat models, vLLM and several open-model servers. Support varies by provider and model; the app falls back automatically when they're rejected. See [[Configuration]].
</details>

<details><summary><b>Is my API key safe?</b></summary>

Keys stay in a local `.env` file read by the server. The browser and the hosted demo never receive them. See [[Security]].
</details>

<details><summary><b>Is the trust score a probability of truth?</b></summary>

No. It's a transparent heuristic for triage. Calibrate thresholds on your own labelled examples, and keep humans in the loop for high-stakes use.
</details>

<details><summary><b>Does the online demo cost me anything?</b></summary>

No. GitHub Pages and Actions are free for public repos, and the demo makes no model calls. See [[Live Demo and Hosting]].
</details>

<details><summary><b>Can I use it in production?</b></summary>

As a **local tool, an evaluation harness or a CI check**, yes. As a public multi-user service, add authentication and spend limits first.
</details>

<details><summary><b>Why was it called "Hallucination Heatmap"?</b></summary>

That was the original prototype name. It was renamed to **LLM Hallucination Detector** so people searching for that term can find it. The heatmap is still the core visual.
</details>
