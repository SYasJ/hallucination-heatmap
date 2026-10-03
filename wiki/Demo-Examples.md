# 🧪 Demo Examples

Five curated scenarios ship with the app. Each one teaches a different hallucination pattern.

### 1. 🛡️ Policy mismatch (*RAG · unsupported*)
<img src="https://raw.githubusercontent.com/SYasJ/llm-hallucination-detector/main/screenshots/01-policy-mismatch.png" alt="Policy mismatch" width="100%">

**Pattern:** a confident answer contradicts the retrieved policy (90 days vs. 30, "used" vs. "unused").<br>
**Lesson:** mean token confidence is ~90%, yet both claims are contradicted. Trust score **40 → Needs review**.

### 2. 📊 Invented statistics (*Research · citation risk*)
<img src="https://raw.githubusercontent.com/SYasJ/llm-hallucination-detector/main/screenshots/02-invented-statistics.png" alt="Invented statistics" width="100%">

**Pattern:** a 240-adult pilot becomes a "2023 Stanford trial of 2,400 patients" with made-up effect sizes.<br>
**Lesson:** the fabricated specifics (*Stanford*, *2,400*, *37%*, *22%*) are exactly the red tokens (trust **29**).

### 3. ✅ Grounded answer (*Reference · supported*)
<img src="https://raw.githubusercontent.com/SYasJ/llm-hallucination-detector/main/screenshots/03-grounded-answer.png" alt="Grounded answer" width="100%">

**Pattern:** the Apollo 11 facts match the source.<br>
**Lesson:** this is what "good" looks like: high confidence **and** supported claims (trust **98, strong signal**).

### 4. ⚖️ Fabricated citation (*Legal · invented case*)
<img src="https://raw.githubusercontent.com/SYasJ/llm-hallucination-detector/main/screenshots/04-fabricated-citation.png" alt="Fabricated citation" width="100%">

**Pattern:** a real case (Tarasoff) followed by a plausible but invented appellate citation.<br>
**Lesson:** the invented case name, volume and page numbers drop into the red zone (trust **43**). Always verify citations in a legal database.

### 5. 🔋 Spec drift (*Product · wrong numbers*)
<img src="https://raw.githubusercontent.com/SYasJ/llm-hallucination-detector/main/screenshots/05-spec-drift.png" alt="Spec drift" width="100%">

**Pattern:** a mostly correct summary that changes "3 hours" to "5 hours" and invents wireless charging.<br>
**Lesson:** partial hallucinations score in the middle (**63, mixed signal**), and the claim list shows exactly which sentence to fix.
