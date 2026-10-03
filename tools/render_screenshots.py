#!/usr/bin/env python3
"""Render annotated PNG captures for the three built-in demo states."""
from __future__ import annotations

import math
import os
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "screenshots"
OUT.mkdir(exist_ok=True)
W, H = 1600, 1050
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

SCENARIOS = [
    {
        "file": "01-policy-mismatch.png",
        "name": "Policy mismatch",
        "tag": "RAG · UNSUPPORTED",
        "question": "Can I return a used blender after 60 days?",
        "context": "RETURNS POLICY · HELP CENTER\nStandard items: unused products in original packaging may be returned within 30 days of delivery.\nDefective items: contact support within 1 year. Approved refunds take 5–7 business days.",
        "response": "Yes, you can return the used blender within 90 days of purchase. The policy allows opened items, and refunds are processed immediately to your original payment method.",
        "evidence": 18,
        "mean": 90,
        "trust": 40,
        "claims": [
            ("A used blender can be returned after 60 days.", "CONTRADICTED", "The policy requires unused items within 30 days."),
            ("The return window is 90 days and refunds are immediate.", "CONTRADICTED", "Source says 30 days; approved refunds take 5–7 days."),
        ],
        "source": "Standard items must be unused and returned within 30 days of delivery. Refunds after approval take 5–7 business days.",
        "selected": "90",
        "probability": "38%",
        "logprob": "−0.97",
        "low": {"90", "days", "immediately"},
        "medium": {"opened", "processed"},
        "example_index": 0,
        "footnote": "High model confidence can still accompany a contradiction.",
    },
    {
        "file": "02-invented-statistics.png",
        "name": "Invented statistics",
        "tag": "RESEARCH · CITATION RISK",
        "question": "Create a one-line, evidence-based summary for leadership.",
        "context": "STUDY SUMMARY · 12-WEEK PILOT\nThe pilot included 240 adults using a guided exercise program. Participants reported improved self-reported mobility compared with baseline. No exact effect size, fall-rate reduction, control group, or Stanford affiliation is provided.",
        "response": "A 2023 Stanford trial of 2,400 patients found a 37% reduction in falls over six months. The program also improved mobility by 22%, proving it prevents falls in older adults.",
        "evidence": 8,
        "mean": 79,
        "trust": 29,
        "claims": [
            ("The study was a 2023 Stanford trial of 2,400 patients.", "NOT IN SOURCE", "Reference describes a 240-adult pilot; no Stanford affiliation."),
            ("Falls fell 37%; mobility improved 22%.", "NOT IN SOURCE", "No exact effect size or fall-rate reduction is reported."),
            ("The program proves it prevents falls.", "NOT IN SOURCE", "A baseline comparison does not establish causation."),
        ],
        "source": "240 adults · 12-week pilot · self-reported mobility improved vs baseline. No exact effect size or control group described.",
        "selected": "37%",
        "probability": "16%",
        "logprob": "−1.83",
        "low": {"2023", "Stanford", "2,400", "37%", "22%"},
        "medium": {"proving", "prevents"},
        "example_index": 1,
        "footnote": "Specific figures and affiliations are absent from the source.",
    },
    {
        "file": "03-grounded-answer.png",
        "name": "Grounded answer",
        "tag": "REFERENCE · SUPPORTED",
        "question": "When did Apollo 11 land on the Moon, and who stepped out first?",
        "context": "NASA MISSION SUMMARY\nApollo 11’s lunar module landed on the Moon on July 20, 1969. Neil Armstrong was the first astronaut to descend the ladder to the lunar surface. Buzz Aldrin followed.",
        "response": "Apollo 11 landed on the Moon on July 20, 1969. Neil Armstrong stepped onto the lunar surface first, followed by Buzz Aldrin.",
        "evidence": 98,
        "mean": 98,
        "trust": 98,
        "claims": [
            ("Apollo 11 landed on July 20, 1969.", "SUPPORTED", "NASA summary confirms the landing date."),
            ("Neil Armstrong went first; Buzz Aldrin followed.", "SUPPORTED", "The source names Armstrong first and Aldrin next."),
        ],
        "source": "Apollo 11 landed on July 20, 1969. Neil Armstrong descended first; Buzz Aldrin followed.",
        "selected": "1969.",
        "probability": "99%",
        "logprob": "−0.01",
        "low": set(),
        "medium": {"first,"},
        "example_index": 2,
        "footnote": "Strong token confidence and source support agree in this example.",
    },
]


def font(size: int, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    path = MONO if mono else (BOLD if bold else REG)
    return ImageFont.truetype(path, size=size)


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(draw: ImageDraw.ImageDraw, x, y, value, size=12, color="#26364a", bold=False, mono=False):
    draw.text((x, y), str(value), font=font(size, bold, mono), fill=color)


def text_width(draw, value, size=12, bold=False, mono=False):
    bbox = draw.textbbox((0, 0), str(value), font=font(size, bold, mono))
    return bbox[2] - bbox[0]


def wrap(draw, value, x, y, max_width, size=11, color="#637386", bold=False, line_gap=5, max_lines=None):
    face = font(size, bold)
    words = str(value).split()
    lines, current = [], ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if draw.textbbox((0, 0), candidate, font=face)[2] <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    if max_lines and len(lines) > max_lines:
        lines = lines[:max_lines]
        while lines[-1] and draw.textbbox((0, 0), lines[-1] + "…", font=face)[2] > max_width:
            lines[-1] = lines[-1][:-1]
        lines[-1] = lines[-1].rstrip() + "…"
    for line in lines:
        draw.text((x, y), line, font=face, fill=color)
        y += size + line_gap
    return y


def draw_logo(draw):
    rounded(draw, (22, 24, 53, 55), 9, "#1d3146", outline="#3a4a5d")
    colors = ["#55c1a8", "#efbd63", "#e77d82", "#8b95de"]
    boxes = [(29, 31, 38, 40), (41, 31, 50, 40), (29, 43, 38, 52), (41, 43, 50, 52)]
    for box, color in zip(boxes, colors):
        rounded(draw, box, 2, color)
    text(draw, 62, 23, "heatmap", 19, "#f5f8fb", True)
    text(draw, 63, 46, "C O N F I D E N C E   L A Y E R", 7, "#8293a8", True)


def draw_heatmap(draw, scenario, box):
    x0, y0, x1, y1 = box
    rounded(draw, box, 7, "#fcfdfd", outline="#e8edf0")
    x, y = x0 + 14, y0 + 15
    max_x = x1 - 14
    pieces = re.findall(r"\S+\s*", scenario["response"])
    base = font(12)
    selected_box = None
    for piece in pieces:
        word = piece.strip()
        if not word:
            continue
        trailing = piece[len(word):]
        w = draw.textbbox((0, 0), word, font=base)[2]
        space_w = draw.textbbox((0, 0), trailing, font=base)[2] if trailing else 0
        total = w + space_w
        if x + total > max_x:
            x = x0 + 14
            y += 31
        if word in scenario["low"]:
            bg, fg = "#ffe0e1", "#963f4a"
        elif word in scenario["medium"]:
            bg, fg = "#ffefc9", "#835818"
        else:
            bg, fg = "#d9f1e8", "#276d5d"
        rounded(draw, (x - 2, y - 3, x + w + 2, y + 23), 4, bg)
        draw.text((x, y), word, font=base, fill=fg)
        if word == scenario["selected"].rstrip(".,!?;:") or word.rstrip(".,!?;:") == scenario["selected"].rstrip(".,!?;:"):
            selected_box = (x - 3, y - 4, x + w + 3, y + 24)
        x += total + 1
    if selected_box:
        draw.rounded_rectangle(selected_box, radius=4, outline="#53746f", width=1)


def draw_claim(draw, x, y, width, claim, status, evidence):
    rounded(draw, (x, y, x + width, y + 58), 6, "#ffffff", outline="#edf0f2")
    if status == "SUPPORTED":
        icon_bg, icon_fg, pill_bg, pill_fg, symbol = "#e9f6f1", "#398b78", "#e9f6f1", "#377f6e", "✓"
    elif status == "CONTRADICTED":
        icon_bg, icon_fg, pill_bg, pill_fg, symbol = "#fff0f0", "#bd555f", "#fff0f0", "#b8505a", "!"
    else:
        icon_bg, icon_fg, pill_bg, pill_fg, symbol = "#fff5e4", "#b17a21", "#fff5e4", "#a2762d", "?"
    rounded(draw, (x + 9, y + 9, x + 27, y + 27), 5, icon_bg)
    text(draw, x + 15, y + 9, symbol, 11, icon_fg, True)
    pill_w = text_width(draw, status, 7, True) + 11
    rounded(draw, (x + width - pill_w - 8, y + 10, x + width - 8, y + 25), 4, pill_bg)
    text(draw, x + width - pill_w - 3, y + 13, status, 6, pill_fg, True)
    max_text = width - 50 - pill_w
    wrap(draw, claim, x + 34, y + 8, max_text, 8, "#4e5d70", True, line_gap=3, max_lines=2)
    wrap(draw, evidence, x + 34, y + 34, width - 46, 7, "#909ba7", line_gap=2, max_lines=1)


def draw_screenshot(s):
    image = Image.new("RGB", (W, H), "#f4f6f8")
    d = ImageDraw.Draw(image)
    # Left navigation.
    d.rectangle((0, 0, 243, H), fill="#182639")
    draw_logo(d)
    rounded(d, (18, 90, 225, 137), 8, "#223249", outline="#334359")
    rounded(d, (29, 101, 57, 129), 7, "#375d67")
    text(d, 38, 106, "L", 12, "#d0f6ed", True)
    text(d, 67, 97, "W O R K S P A C E", 7, "#8493a7", True)
    text(d, 67, 111, "Local sandbox", 10, "#e5ebf1", True)
    text(d, 28, 164, "A N A L Y Z E", 8, "#718197", True)
    rounded(d, (13, 183, 230, 221), 7, "#293a50", outline="#34465d")
    d.rectangle((13, 192, 15, 212), fill="#4ac2a8")
    text(d, 31, 195, "≋", 15, "#dce9f1", True)
    text(d, 57, 195, "Response lab", 11, "#f4fafb", True)
    rounded(d, (177, 195, 216, 210), 4, "#304d50")
    text(d, 184, 198, "L I V E", 6, "#7cdbbd", True)
    text(d, 31, 234, "▦", 16, "#a9b5c4")
    text(d, 57, 238, "Example library", 10, "#a9b5c4")
    text(d, 202, 238, "03", 8, "#94a1b1", True)
    text(d, 28, 286, "I N T E G R A T E", 8, "#718197", True)
    text(d, 31, 310, "‹ ›", 11, "#a9b5c4", True)
    text(d, 57, 309, "API & SDK", 10, "#a9b5c4")
    text(d, 31, 344, "▤", 14, "#a9b5c4")
    text(d, 57, 347, "Browser extension", 10, "#a9b5c4")
    rounded(d, (17, 789, 226, 944), 9, "#1d2d42", outline="#354559")
    rounded(d, (29, 802, 55, 828), 7, "#284b4c")
    text(d, 35, 806, "✓", 15, "#68d1b6", True)
    text(d, 29, 839, "Your key stays yours", 10, "#e8eff5", True)
    wrap(d, "Provider credentials stay on your local server. They never enter this page.", 29, 857, 180, 8, "#9aa8b7", line_gap=4, max_lines=3)
    rounded(d, (29, 910, 212, 933), 5, "#24374c", outline="#3b4d60")
    text(d, 37, 916, "Connection settings", 8, "#c9d6e0")
    text(d, 192, 914, "→", 11, "#70ceb3", True)
    d.ellipse((23, 979, 30, 986), fill="#4cb69b")
    text(d, 37, 976, "Local-first preview", 8, "#8190a3")
    text(d, 196, 976, "v0.1", 8, "#6f7f91", mono=True)

    # Top bar.
    d.rectangle((244, 0, W, 59), fill="#ffffff")
    d.line((244, 59, W, 59), fill="#e9edf1", width=1)
    text(d, 282, 22, "Workspace", 9, "#8994a2")
    text(d, 341, 22, "/", 9, "#bdc5cd")
    text(d, 354, 22, "Response lab", 9, "#3a4859", True)
    d.ellipse((1329, 25, 1335, 31), fill="#43b397")
    text(d, 1342, 21, "Demo data loaded", 8, "#7d8a97")
    d.ellipse((1455, 16, 1482, 43), fill="#e6e1f9")
    text(d, 1464, 22, "L", 10, "#6959ae", True)

    # Heading.
    text(d, 285, 81, "◆", 8, "#46ac98")
    text(d, 299, 81, "M O D E L   O B S E R V A B I L I T Y", 8, "#8792a1", True)
    text(d, 520, 81, "/", 8, "#b5bec7")
    text(d, 535, 81, "T O K E N   I N S P E C T I O N", 8, "#8792a1", True)
    text(d, 284, 101, "Hallucination", 28, "#18263b", True)
    text(d, 502, 101, "Heatmap", 28, "#328f81", True)
    rounded(d, (655, 108, 697, 126), 4, "#f5f2ff", outline="#dcd6f6")
    text(d, 663, 113, "B E T A", 6, "#7563bc", True)
    text(d, 285, 143, "See where your model is certain, where it’s guessing, and what the evidence actually says.", 10, "#778494")
    rounded(d, (1387, 113, 1515, 141), 6, "#ffffff", outline="#e2e9ed")
    d.ellipse((1398, 124, 1404, 130), fill="#46b899")
    text(d, 1410, 121, "Curated demo", 8, "#627283", True)
    rounded(d, (1525, 113, 1554, 141), 6, "#ffffff", outline="#e2e8ed")
    text(d, 1533, 120, "⚙", 11, "#8793a2")

    # Science note.
    rounded(d, (284, 164, 1554, 211), 7, "#fffaf0", outline="#f0e4c8")
    text(d, 297, 178, "△", 13, "#c08a30", True)
    text(d, 319, 176, "Confidence is not correctness.", 9, "#574928", True)
    text(d, 480, 176, "Token logprobs show how likely the model was to choose a word—not whether it’s true. Heatmap keeps model certainty and source evidence separate.", 8, "#716445")
    text(d, 1429, 177, "How scoring works  ↗", 8, "#98742d", True)

    # Mode and buttons.
    rounded(d, (284, 225, 1554, 278), 8, "#ffffff", outline="#e4e9ed")
    text(d, 299, 240, "A N A L Y S I S   M O D E", 7, "#8b97a4", True)
    rounded(d, (433, 234, 674, 268), 5, "#fbfcfd", outline="#e7ebef")
    text(d, 445, 246, "☷   Demo library", 9, "#334255", True)
    text(d, 652, 245, "⌄", 12, "#8894a1")
    d.ellipse((695, 249, 701, 255), fill="#8a78d0")
    text(d, 710, 245, "Explore three annotated examples. No API key required.", 8, "#84909d")
    rounded(d, (1353, 235, 1440, 268), 5, "#ffffff", outline="#dfe6eb")
    text(d, 1367, 246, "⇩  API guide", 8, "#556477", True)
    rounded(d, (1448, 235, 1538, 268), 5, "#328f81", outline="#2b8f81")
    text(d, 1461, 246, "▶  Run analysis", 8, "#ffffff", True)

    # Input panel.
    left_x, left_y, left_w = 284, 293, 397
    rounded(d, (left_x, left_y, left_x + left_w, 784), 9, "#ffffff", outline="#e5eaee")
    d.line((left_x, left_y + 62, left_x + left_w, left_y + 62), fill="#edf0f3")
    rounded(d, (298, 309, 327, 338), 7, "#fafbfc", outline="#e6ebef")
    text(d, 307, 317, "01", 9, "#81909d", True, mono=True)
    text(d, 338, 309, "I N P U T", 7, "#8794a2", True)
    text(d, 338, 322, "Question & evidence", 12, "#27364a", True)
    text(d, 628, 321, "Reset ↻", 8, "#7c8998")

    # Example selection tabs.
    tab_y = 365
    labels = [("Policy mismatch", "RAG · unsupported"), ("Invented statistics", "Research · citation risk"), ("Grounded answer", "Reference · supported")]
    tab_gap = 5
    tab_w = 119
    for idx, (title, subtitle) in enumerate(labels):
        x = 294 + idx * (tab_w + tab_gap)
        active = idx == s["example_index"]
        rounded(d, (x, tab_y, x + tab_w, tab_y + 48), 6, "#f1faf7" if active else "#ffffff", outline="#8bc9bb" if active else "#e9edf0")
        icon = ["!", "↗", "✓"][idx]
        col = ["#c8646b", "#8a70cc", "#3b9a82"][idx]
        rounded(d, (x + 6, tab_y + 11, x + 28, tab_y + 33), 6, ["#fff0f0", "#f2efff", "#e9f7f2"][idx])
        text(d, x + 13, tab_y + 15, icon, 10, col, True)
        text(d, x + 34, tab_y + 10, title, 7, "#297c70" if active else "#4e5c6c", True)
        text(d, x + 34, tab_y + 25, subtitle, 6, "#9aa4af")

    # Prompt input.
    text(d, 299, 426, "Q U E S T I O N   /   T A S K", 7, "#687789", True)
    rounded(d, (298, 443, 666, 507), 6, "#fbfcfd", outline="#e4e9ed")
    wrap(d, s["question"], 308, 453, 343, 10, "#37465a", line_gap=4, max_lines=3)
    text(d, 617, 426, f"{len(s['question'])} chars", 7, "#a1aab5")

    # Source context.
    text(d, 299, 522, "S U P P O R T I N G   C O N T E X T", 7, "#687789", True)
    rounded(d, (298, 539, 666, 698), 6, "#fbfcfd", outline="#e4e9ed")
    display_context = s["context"].replace("\n", " ")
    wrap(d, display_context, 308, 550, 347, 8, "#536274", line_gap=5, max_lines=8)
    d.ellipse((300, 706, 305, 711), fill="#4ab59a")
    text(d, 311, 703, "Included in evidence check", 7, "#98a3ae")
    text(d, 623, 703, f"{len(s['context'].split())} words", 7, "#98a3ae")
    d.line((298, 730, 666, 730), fill="#edf0f2")
    rounded(d, (299, 743, 315, 759), 8, "#ffffff", outline="#dfe5e9")
    text(d, 304, 744, "+", 10, "#728193", True)
    text(d, 322, 746, "Analyze an existing response instead", 8, "#657487", True)

    # Privacy card under input.
    rounded(d, (284, 797, 681, 854), 8, "#fbfcfd", outline="#e9edf0")
    rounded(d, (296, 812, 320, 836), 7, "#e9f7f2")
    text(d, 303, 816, "✓", 11, "#3e9985", True)
    text(d, 330, 808, "Private by default", 9, "#49586b", True)
    text(d, 330, 825, "Demo data stays in your browser; live calls use the local proxy.", 7, "#8995a2")
    rounded(d, (644, 816, 660, 832), 8, "#ffffff", outline="#dce4e8")
    text(d, 650, 818, "i", 8, "#8a99a4", True)

    # Metrics cards on right.
    rx, rw, gap = 697, 857, 9
    card_w = (rw - gap * 2) / 3
    metric_y = 293
    metric_h = 101
    # Trust metric.
    rounded(d, (rx, metric_y, rx + card_w, metric_y + metric_h), 8, "#ffffff", outline="#e5eaee")
    text(d, rx + 12, metric_y + 11, "T R U S T   S C O R E", 7, "#82909f", True)
    center = (rx + 39, metric_y + 66)
    d.ellipse((center[0] - 23, center[1] - 23, center[0] + 23, center[1] + 23), outline="#edf1f4", width=6)
    d.arc((center[0] - 23, center[1] - 23, center[0] + 23, center[1] + 23), -90, -90 + 3.6 * s["trust"], fill="#d2775e" if s["trust"] < 50 else ("#d1a34f" if s["trust"] < 80 else "#4aa98e"), width=6)
    text(d, center[0] - 9, center[1] - 8, str(s["trust"]), 13, "#28384c", True)
    text(d, center[0] + 10, center[1] - 3, "/100", 6, "#9aa4ae")
    text(d, rx + 70, metric_y + 42, "Needs review" if s["trust"] < 50 else ("Mixed signal" if s["trust"] < 80 else "Strong signal"), 9, "#b45f54" if s["trust"] < 50 else ("#9b7023" if s["trust"] < 80 else "#36816f"), True)
    text(d, rx + 70, metric_y + 58, "Evidence 70% · confidence 30%", 7, "#7f8b99")
    text(d, rx + 70, metric_y + 73, "Composite · not calibrated", 7, "#a2abb4")

    # Evidence card.
    ex = rx + card_w + gap
    rounded(d, (ex, metric_y, ex + card_w, metric_y + metric_h), 8, "#ffffff", outline="#e5eaee")
    text(d, ex + 11, metric_y + 11, "E V I D E N C E   A L I G N M E N T", 7, "#82909f", True)
    text(d, ex + 11, metric_y + 37, f"{s['evidence']}%", 22, "#2d3c50", True)
    risk_count = sum(1 for _, status, _ in s["claims"] if status != "SUPPORTED")
    pill = f"{risk_count} claims at risk" if risk_count else "2 supported"
    rounded(d, (ex + 111, metric_y + 42, ex + 194, metric_y + 58), 4, "#fff0f0" if risk_count else "#e9f6f1")
    text(d, ex + 116, metric_y + 46, pill, 6, "#b5585e" if risk_count else "#36816f", True)
    rounded(d, (ex + 11, metric_y + 68, ex + card_w - 11, metric_y + 72), 3, "#eff2f4")
    rounded(d, (ex + 11, metric_y + 68, ex + 11 + (card_w - 22) * s["evidence"] / 100, metric_y + 72), 3, "#d46f77" if risk_count else "#59b69a")
    text(d, ex + 11, metric_y + 80, "Claim support against supplied context", 7, "#96a0ac")

    # Confidence card.
    cx = ex + card_w + gap
    rounded(d, (cx, metric_y, cx + card_w, metric_y + metric_h), 8, "#ffffff", outline="#e5eaee")
    text(d, cx + 11, metric_y + 11, "M E A N   T O K E N   C O N F I D E N C E", 7, "#82909f", True)
    text(d, cx + 11, metric_y + 37, f"{s['mean']}%", 22, "#2d3c50", True)
    rounded(d, (cx + 117, metric_y + 42, cx + 203, metric_y + 58), 4, "#e9f6f1" if s["mean"] >= 85 else "#fff5e3")
    text(d, cx + 123, metric_y + 46, "Model confident" if s["mean"] >= 85 else "Mixed signals", 6, "#36816f" if s["mean"] >= 85 else "#9b7023", True)
    rounded(d, (cx + 11, metric_y + 68, cx + card_w - 11, metric_y + 72), 3, "#eff2f4")
    rounded(d, (cx + 11, metric_y + 68, cx + 11 + (card_w - 22) * s["mean"] / 100, metric_y + 72), 3, "#59b69a")
    text(d, cx + 11, metric_y + 80, "Mean selected-token probability · not truth", 7, "#96a0ac")

    # Output card.
    oy, oh = 406, 436
    rounded(d, (rx, oy, rx + rw, oy + oh), 9, "#ffffff", outline="#e5eaee")
    d.line((rx, oy + 59, rx + rw, oy + 59), fill="#edf0f3")
    rounded(d, (rx + 14, oy + 14, rx + 43, oy + 43), 7, "#f4f9f8", outline="#e0eeeb")
    text(d, rx + 23, oy + 22, "02", 9, "#4f9c8e", True, mono=True)
    text(d, rx + 54, oy + 12, "O U T P U T   I N S P E C T O R", 7, "#8794a2", True)
    text(d, rx + 54, oy + 26, "Model response", 12, "#27364a", True)
    rounded(d, (rx + rw - 251, oy + 17, rx + rw - 171, oy + 40), 5, "#ffffff", outline="#e9edf0")
    text(d, rx + rw - 242, oy + 24, "RUN HM-0042", 7, "#98a2ad", mono=True)
    rounded(d, (rx + rw - 162, oy + 17, rx + rw - 110, oy + 40), 5, "#ffffff", outline="#e6ebef")
    text(d, rx + rw - 150, oy + 24, "▢  Copy", 7, "#657486")
    rounded(d, (rx + rw - 102, oy + 17, rx + rw - 14, oy + 40), 5, "#f5fbf9", outline="#d9e9e4")
    text(d, rx + rw - 90, oy + 24, "⇩  Export", 7, "#348b7e", True)
    d.rectangle((rx, oy + 60, rx + rw, oy + 91), fill="#fcfdfd")
    d.line((rx, oy + 91, rx + rw, oy + 91), fill="#f0f2f4")
    rounded(d, (rx + 14, oy + 68, rx + 112, oy + 84), 4, "#f8fbfa", outline="#e5ebe9")
    d.ellipse((rx + 21, oy + 74, rx + 26, oy + 79), fill="#55ae97")
    text(d, rx + 31, oy + 71, "D E M O   M O D E L", 6, "#64756f", True)
    text(d, rx + 124, oy + 72, "│", 8, "#e3e8ec")
    text(d, rx + 136, oy + 72, "Token logprobs + evidence check", 7, "#8b97a4")
    text(d, rx + rw - 52, oy + 72, "320 ms", 7, "#9aa4af")

    text(d, rx + 16, oy + 103, "G E N E R A T E D   R E S P O N S E", 7, "#8794a2", True)
    text(d, rx + 16, oy + 116, "Select a token to inspect its probability.", 7, "#a0a9b3")
    draw_heatmap(d, s, (rx + 14, oy + 137, rx + rw - 14, oy + 247))

    # Inspector strip.
    rounded(d, (rx + 14, oy + 257, rx + rw - 14, oy + 307), 6, "#ffffff", outline="#edf0f2")
    rounded(d, (rx + 23, oy + 269, rx + 50, oy + 296), 6, "#f4f1fe")
    text(d, rx + 29, oy + 276, "Aa", 10, "#806ac9", True)
    text(d, rx + 61, oy + 264, "T O K E N   I N S P E C T O R", 6, "#98a2ad", True)
    text(d, rx + 61, oy + 278, f"“{s['selected']}”", 10, "#354459", True)
    text(d, rx + 61, oy + 292, "Selected token · next-token probability", 6, "#97a1ac")
    d.line((rx + 528, oy + 267, rx + 528, oy + 297), fill="#edf0f2")
    text(d, rx + 543, oy + 266, "T O K E N   C O N F I D E N C E", 6, "#98a2ad", True)
    text(d, rx + 543, oy + 281, s["probability"], 10, "#38485c", True)
    d.line((rx + 672, oy + 267, rx + 672, oy + 297), fill="#edf0f2")
    text(d, rx + 687, oy + 266, "L O G P R O B", 6, "#98a2ad", True)
    text(d, rx + 687, oy + 281, s["logprob"], 10, "#38485c", True)

    # Legend.
    text(d, rx + 15, oy + 320, "C O N F I D E N C E", 6, "#929daa", True)
    rounded(d, (rx + 119, oy + 322, rx + 127, oy + 330), 2, "#e28a8d")
    text(d, rx + 133, oy + 319, "Low <55%", 7, "#788696")
    rounded(d, (rx + 207, oy + 322, rx + 215, oy + 330), 2, "#ebc46f")
    text(d, rx + 221, oy + 319, "Mixed 55–84%", 7, "#788696")
    rounded(d, (rx + 319, oy + 322, rx + 327, oy + 330), 2, "#65bda3")
    text(d, rx + 333, oy + 319, "High ≥85%", 7, "#788696")
    text(d, rx + rw - 148, oy + 319, "Hover or click a word", 7, "#a2abb4")

    # Claims.
    d.line((rx, oy + 342, rx + rw, oy + 342), fill="#edf0f3")
    text(d, rx + 15, oy + 352, "C L A I M   C H E C K", 7, "#8794a2", True)
    text(d, rx + 15, oy + 365, "What the evidence supports", 10, "#334257", True)
    rounded(d, (rx + rw - 62, oy + 357, rx + rw - 14, oy + 375), 4, "#f3f5f6")
    text(d, rx + rw - 53, oy + 363, f"{len(s['claims'])} checks", 6, "#85919f")
    claim_y = oy + 382
    claim_gap = 5
    claim_h = 25
    available = min(2, len(s["claims"]))
    for idx, item in enumerate(s["claims"][:available]):
        # Compact claim rows to keep the screenshot in-frame.
        claim, status, evidence = item
        cy = claim_y + idx * (claim_h + claim_gap)
        rounded(d, (rx + 14, cy, rx + rw - 14, cy + claim_h), 5, "#ffffff", outline="#edf0f2")
        if status == "SUPPORTED":
            bg, fg, pill = "#e9f6f1", "#398b78", "#e9f6f1"
        elif status == "CONTRADICTED":
            bg, fg, pill = "#fff0f0", "#bd555f", "#fff0f0"
        else:
            bg, fg, pill = "#fff5e4", "#b17a21", "#fff5e4"
        rounded(d, (rx + 22, cy + 5, rx + 38, cy + 21), 4, bg)
        text(d, rx + 28, cy + 7, "✓" if status == "SUPPORTED" else ("!" if status == "CONTRADICTED" else "?"), 8, fg, True)
        status_display = "NOT IN SOURCE" if status == "NOT IN SOURCE" else status
        pill_w = text_width(d, status_display, 6, True) + 10
        rounded(d, (rx + rw - 22 - pill_w, cy + 6, rx + rw - 22, cy + 20), 4, pill)
        text(d, rx + rw - 18 - pill_w, cy + 10, status_display, 5, fg, True)
        wrap(d, claim, rx + 46, cy + 3, rw - pill_w - 100, 7, "#4e5d70", True, line_gap=1, max_lines=1)
        wrap(d, evidence, rx + 46, cy + 14, rw - 65, 6, "#909ba7", line_gap=1, max_lines=1)

    # Evidence & method cards.
    gy = 854
    half = (rw - 9) / 2
    rounded(d, (rx, gy, rx + half, gy + 124), 8, "#ffffff", outline="#e5eaee")
    rounded(d, (rx + 12, gy + 12, rx + 36, gy + 36), 6, "#eff6fa")
    text(d, rx + 19, gy + 17, "▤", 11, "#6688a1")
    text(d, rx + 44, gy + 10, "S O U R C E   C O N T E X T", 6, "#8794a2", True)
    text(d, rx + 44, gy + 23, "Evidence used in this run", 9, "#334257", True)
    wrap(d, s["source"], rx + 13, gy + 49, half - 25, 7, "#758394", line_gap=3, max_lines=3)
    d.line((rx + 12, gy + 100, rx + half - 12, gy + 100), fill="#f0f2f4")
    d.ellipse((rx + 14, gy + 108, rx + 19, gy + 113), fill="#4ab59a")
    text(d, rx + 25, gy + 105, s["tag"].lower(), 6, "#96a1ad")
    text(d, rx + half - 62, gy + 105, "View input ↗", 6, "#478f82", True)

    mx = rx + half + 9
    rounded(d, (mx, gy, rx + rw, gy + 124), 8, "#ffffff", outline="#e5eaee")
    rounded(d, (mx + 12, gy + 12, mx + 36, gy + 36), 6, "#eaf6f2")
    text(d, mx + 18, gy + 16, "✓", 12, "#488d7e", True)
    text(d, mx + 44, gy + 10, "M E T H O D", 6, "#8794a2", True)
    text(d, mx + 44, gy + 23, "Two signals, never blended blindly", 9, "#334257", True)
    wrap(d, "Token probability measures model choice likelihood. Claim checks measure support in the supplied source. A confident contradiction should still fail the evidence check.", mx + 13, gy + 48, half - 27, 7, "#818d9a", line_gap=3, max_lines=4)
    text(d, mx + 13, gy + 105, "Scoring notes  →", 7, "#478f82", True)

    # Page footer.
    text(d, 285, 1008, "Hallucination Heatmap  ·  local-first prototype", 7, "#9aa4ae")
    text(d, 1314, 1008, "For evaluation support—not a truth guarantee.", 7, "#9aa4ae")
    image.save(OUT / s["file"], optimize=True)
    print(OUT / s["file"])


if __name__ == "__main__":
    for scenario in SCENARIOS:
        draw_screenshot(scenario)
