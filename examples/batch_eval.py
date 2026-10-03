#!/usr/bin/env python3
"""Example: score a JSONL dataset of (prompt, context[, response]) rows and write a CSV report.

    python3 examples/batch_eval.py examples/dataset.jsonl examples/output/report.csv

Rows with a ``response`` field are verified as-is (verifier mode); others are generated
and scored with token logprobs.
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from heatmap_client import HeatmapClient  # noqa: E402

FIELDS = ["id", "trust_score", "score_method", "evidence_score", "mean_token_confidence",
          "contradicted", "not_in_context", "supported", "unverified", "output", "error"]


def main(dataset: Path, report: Path) -> int:
    client = HeatmapClient()
    report.parent.mkdir(parents=True, exist_ok=True)
    rows = [json.loads(line) for line in dataset.read_text(encoding="utf-8").splitlines() if line.strip()]
    with report.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        for index, row in enumerate(rows, 1):
            record = {"id": row.get("id", index)}
            try:
                if row.get("response"):
                    run = client.verify_existing(row["prompt"], row["response"], context=row.get("context", ""))
                else:
                    run = client.analyze(row["prompt"], context=row.get("context", ""), mode="logprobs")
                statuses = [c["status"] for c in run.get("claims", [])]
                record.update({
                    "trust_score": run.get("trust_score"),
                    "score_method": run.get("score_method"),
                    "evidence_score": run.get("evidence_score"),
                    "mean_token_confidence": run.get("mean_token_confidence"),
                    **{s: statuses.count(s) for s in ("contradicted", "not_in_context", "supported", "unverified")},
                    "output": run.get("output", ""),
                })
            except RuntimeError as exc:
                record["error"] = str(exc)
            writer.writerow(record)
            print(f"[{index}/{len(rows)}] {record['id']}: trust={record.get('trust_score')} {record.get('error') or ''}")
    print(f"Wrote {report}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    sys.exit(main(Path(sys.argv[1]), Path(sys.argv[2])))
