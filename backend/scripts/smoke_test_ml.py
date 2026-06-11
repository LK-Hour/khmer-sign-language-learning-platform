"""Quick local smoke test for finger-spelling API + ML predict."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "http://localhost:8000"


def get_token() -> str:
    req = urllib.request.Request(
        f"{BASE}/api/auth/login/guest",
        method="POST",
        headers={"Content-Type": "application/json"},
        data=b"{}",
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
    return data["access_token"]


def main() -> int:
    print("=== Backend smoke test ===")

    with urllib.request.urlopen(f"{BASE}/api/finger_spelling/units") as resp:
        units = json.loads(resp.read().decode())
    print(f"OK units: {len(units)}")

    token = get_token()
    print("OK guest login")

    req = urllib.request.Request(
        f"{BASE}/api/finger_spelling/practice/predict/status",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req) as resp:
        status = json.loads(resp.read().decode())
    print(f"OK predict/status: {status}")

    body = json.dumps({"features": [0.0] * 126}).encode()
    req = urllib.request.Request(
        f"{BASE}/api/finger_spelling/practice/predict/features",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req) as resp:
        prediction = json.loads(resp.read().decode())
    print(
        "OK predict/features:",
        f"class={prediction['predicted_class_index']}",
        f"confidence={prediction['match_confidence']:.2f}%",
    )

    print("=== All tests passed ===")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except urllib.error.URLError as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
