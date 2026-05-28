#!/usr/bin/env python3
"""Rename dataset image files and reseed curriculum media paths.

Typical use:
    python seed_data/rename_and_reseed_media.py --reseed --wipe --wipe-media
    python seed_data/rename_and_reseed_media.py --dry-run
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = PROJECT_ROOT / "data_set" / "Fingerspelling data for development"
SEED_SCRIPT = Path(__file__).resolve().parent / "seed_curriculum.py"


def _safe_console(value: str) -> str:
    return value.encode("ascii", errors="backslashreplace").decode("ascii")


def _normalize_filename_part(value: str) -> str:
    cleaned = re.sub(r"\s+", "_", value.strip())
    cleaned = re.sub(r'[<>:"/\\|?*]', "_", cleaned)
    cleaned = re.sub(r"_+", "_", cleaned).strip("._")
    return cleaned or "item"


def _sorted_pngs(folder: Path) -> list[Path]:
    return sorted([p for p in folder.glob("*.png") if p.is_file()], key=lambda p: p.name)


def _rename_files_in_folder(
    folder: Path,
    *,
    prefix: str,
    dry_run: bool = False,
) -> int:
    pngs = _sorted_pngs(folder)
    if not pngs:
        return 0

    rename_plan: list[tuple[Path, Path]] = []
    for index, src in enumerate(pngs, start=1):
        dst = folder / f"{prefix}_{index:04d}.png"
        if src.name == dst.name:
            continue
        rename_plan.append((src, dst))

    if not rename_plan:
        return 0

    if dry_run:
        for src, dst in rename_plan:
            print(f"[dry-run] { _safe_console(src.name) } -> { _safe_console(dst.name) }")
        return len(rename_plan)

    # Two-phase rename to avoid collisions when destination already exists.
    temp_pairs: list[tuple[Path, Path]] = []
    for i, (src, _) in enumerate(rename_plan, start=1):
        tmp = src.with_name(f"__tmp_rename_{i:04d}.png")
        src.rename(tmp)
        temp_pairs.append((tmp, src))

    for (tmp, _original_src), (_src, dst) in zip(temp_pairs, rename_plan):
        tmp.rename(dst)

    for src, dst in rename_plan:
        print(f"{_safe_console(src.name)} -> {_safe_console(dst.name)}")
    return len(rename_plan)


def rename_dataset_images(*, dry_run: bool = False) -> int:
    if not DATASET_ROOT.exists():
        raise FileNotFoundError(f"Dataset root not found: {DATASET_ROOT}")

    changed = 0

    consonants = DATASET_ROOT / "Consonants"
    if consonants.exists():
        for letter_dir in sorted([p for p in consonants.iterdir() if p.is_dir()], key=lambda p: p.name):
            for variant in ("Main", "Sub"):
                target_dir = letter_dir / variant
                if not target_dir.exists():
                    continue
                prefix = f"{_normalize_filename_part(letter_dir.name)}_{variant}"
                changed += _rename_files_in_folder(target_dir, prefix=prefix, dry_run=dry_run)

    grouped_dirs = [
        ("Vowels", "Vowel"),
        ("Diacritics", "Diacritic"),
        ("Independent vowels", "Independent"),
        ("Number", "Number"),
    ]
    for parent_name, tag in grouped_dirs:
        parent = DATASET_ROOT / parent_name
        if not parent.exists():
            continue
        for item_dir in sorted([p for p in parent.iterdir() if p.is_dir()], key=lambda p: p.name):
            prefix = f"{_normalize_filename_part(item_dir.name)}_{tag}"
            changed += _rename_files_in_folder(item_dir, prefix=prefix, dry_run=dry_run)

    return changed


def run_reseed(*, wipe: bool = False, wipe_media: bool = False, dry_run: bool = False) -> int:
    command = [sys.executable, str(SEED_SCRIPT)]
    if wipe:
        command.append("--wipe")
    if wipe_media:
        command.append("--wipe-media")
    if dry_run:
        command.append("--dry-run")

    print("Running reseed:", " ".join(command))
    result = subprocess.run(command, cwd=PROJECT_ROOT / "backend", check=False)
    return result.returncode


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Rename fingerspelling image files and reseed DB media paths."
    )
    parser.add_argument("--dry-run", action="store_true", help="Preview renames without changing files.")
    parser.add_argument(
        "--reseed",
        action="store_true",
        help="Run seed_curriculum.py after renaming to refresh media file_url values.",
    )
    parser.add_argument(
        "--wipe",
        action="store_true",
        help="Pass --wipe to seed_curriculum.py (clears curriculum tables before reseed).",
    )
    parser.add_argument(
        "--wipe-media",
        action="store_true",
        help="Pass --wipe-media to seed_curriculum.py (requires --wipe in seed script behavior).",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()

    print(f"Dataset root: {_safe_console(str(DATASET_ROOT))}")
    renamed_count = rename_dataset_images(dry_run=args.dry_run)
    print(f"Renamed files: {renamed_count}")

    if not args.reseed:
        print("Skip reseed (use --reseed to update DB media paths).")
        return

    code = run_reseed(
        wipe=args.wipe,
        wipe_media=args.wipe_media,
        dry_run=args.dry_run,
    )
    if code != 0:
        raise SystemExit(code)


if __name__ == "__main__":
    main()
