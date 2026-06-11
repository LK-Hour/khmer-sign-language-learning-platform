#!/usr/bin/env python3
"""Run all automated checks for the finger-spelling prediction pipeline."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FRONTEND = ROOT / "frontend"
BACKEND = ROOT / "backend"
FE_BASE = os.environ.get("FE_BASE", "http://127.0.0.1:3002")


def run(label: str, cmd: list[str], *, cwd: Path, env: dict | None = None) -> None:
    print(f"\n>>> {label}")
    merged = os.environ.copy()
    if env:
        merged.update(env)
    result = subprocess.run(cmd, cwd=cwd, env=merged)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def main() -> int:
    run(
        "Frontend keypoint vector unit test",
        ["node", "scripts/test-keypoints.mjs"],
        cwd=FRONTEND,
    )
    run(
        "Backend integration test",
        [sys.executable, "scripts/test_prediction_pipeline.py"],
        cwd=BACKEND,
        env={"FE_BASE": FE_BASE},
    )
    run(
        "Backend ML smoke test",
        [sys.executable, "scripts/smoke_test_ml.py"],
        cwd=BACKEND,
    )
    run(
        "Browser E2E (Playwright)",
        ["node", "scripts/test-browser-e2e.mjs"],
        cwd=FRONTEND,
        env={"FE_BASE": FE_BASE},
    )

    print("\n========================================")
    print("ALL AUTOMATED TESTS PASSED (100%)")
    print("========================================")
    print(f"Frontend base URL used: {FE_BASE}")
    print("Manual step: open a lesson in your browser, allow camera, press REC.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
