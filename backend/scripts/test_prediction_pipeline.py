#!/usr/bin/env python3
"""End-to-end checks for finger-spelling prediction pipeline."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

BASE = "http://localhost:8000"
FE = "http://localhost:3000"


def get_token() -> str:
    req = urllib.request.Request(
        f"{BASE}/api/auth/login/guest",
        method="POST",
        headers={"Content-Type": "application/json"},
        data=b"{}",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())["access_token"]


def check(name: str, fn) -> None:
    fn()
    print(f"PASS {name}")


def main() -> int:
    failures: list[tuple[str, str]] = []

    def run(name: str, fn) -> None:
        try:
            check(name, fn)
        except Exception as exc:  # noqa: BLE001
            failures.append((name, str(exc)))
            print(f"FAIL {name}: {exc}")

    def test_lesson_detail() -> None:
        with urllib.request.urlopen(f"{BASE}/api/finger_spelling/lessons/1", timeout=15) as resp:
            data = json.loads(resp.read().decode())
        assert data.get("imageUrl"), "lesson missing imageUrl"
        print("  lesson 1 has imageUrl")

    def test_predict(token: str) -> None:
        features = [0.1] * 63 + [0.2] * 63
        body = json.dumps({"features": features, "handedness": "Right"}).encode()
        req = urllib.request.Request(
            f"{BASE}/api/finger_spelling/practice/predict/features",
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode())
        assert "match_confidence" in data
        assert "predicted_class_index" in data
        print(
            f"  class={data['predicted_class_index']} "
            f"confidence={data['match_confidence']:.2f}%"
        )

    def test_bad_features(token: str) -> None:
        body = json.dumps({"features": [0.0] * 10}).encode()
        req = urllib.request.Request(
            f"{BASE}/api/finger_spelling/practice/predict/features",
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )
        try:
            urllib.request.urlopen(req, timeout=15)
            raise AssertionError("expected HTTP 400 for short feature vector")
        except urllib.error.HTTPError as exc:
            assert exc.code == 400, f"expected 400, got {exc.code}"

    def test_practice_session(token: str) -> None:
        req = urllib.request.Request(
            f"{BASE}/api/finger_spelling/practice/lessons/1/sessions",
            data=b"{}",
            method="POST",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
        assert data.get("id"), "session id missing"
        print(f"  session_id={data['id']}")

    def test_frontend() -> None:
        fe_base = os.environ.get("FE_BASE", "http://127.0.0.1:3002")
        for path in ("/en/finger-spelling/lessons/1", "/models/hand_landmarker.task"):
            with urllib.request.urlopen(f"{fe_base}{path}", timeout=90) as resp:
                assert resp.status == 200
                chunk = resp.read(8192)
            print(f"  {path} -> 200 ({len(chunk)}+ bytes)")

    print("=== Prediction pipeline integration test ===")

    token = get_token()
    print("PASS guest login")

    run("backend lesson detail", test_lesson_detail)
    run("backend predict/features (126 keypoints)", lambda: test_predict(token))
    run("backend predict rejects invalid payload", lambda: test_bad_features(token))
    run("backend practice session (auth)", lambda: test_practice_session(token))
    run("frontend lesson page + MediaPipe model asset", test_frontend)

    print("---")
    if failures:
        print(f"FAILED {len(failures)} check(s)")
        for name, err in failures:
            print(f"  - {name}: {err}")
        return 1

    print("ALL CHECKS PASSED (100%)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
