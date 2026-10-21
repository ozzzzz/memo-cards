"""Validate datasets: manifest entries exist, schema is right, no orphan files."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent
DATA = ROOT / "data"
MANIFEST = DATA / "manifest.json"


def load(path: Path, errors: list[str]):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append(f"{path.name}: missing")
    except json.JSONDecodeError as exc:
        errors.append(f"{path.name}: invalid JSON ({exc})")
    return None


def check_deck(name: str, deck, errors: list[str]) -> None:
    if not isinstance(deck, dict):
        errors.append(f"{name}: top level must be an object")
        return
    if not isinstance(deck.get("title"), str) or not deck["title"]:
        errors.append(f"{name}: 'title' must be a non-empty string")
    if "description" in deck and not isinstance(deck["description"], str):
        errors.append(f"{name}: 'description' must be a string")
    cards = deck.get("cards")
    if not isinstance(cards, list) or not cards:
        errors.append(f"{name}: 'cards' must be a non-empty list")
        return
    seen = set()
    for i, card in enumerate(cards, 1):
        where = f"{name} card #{i}"
        if not isinstance(card, dict):
            errors.append(f"{where}: must be an object")
            continue
        if not isinstance(card.get("front"), str) or not card["front"]:
            errors.append(f"{where}: 'front' must be a non-empty string")
        back = card.get("back")
        lines = back if isinstance(back, list) else [back]
        if not lines or not all(isinstance(line, str) and line for line in lines):
            errors.append(f"{where}: 'back' must be a non-empty string or list of non-empty strings")
        if "note" in card and not isinstance(card["note"], str):
            errors.append(f"{where}: 'note' must be a string")
        if "image" in card:
            image = card["image"]
            if not isinstance(image, str) or not image:
                errors.append(f"{where}: 'image' must be a non-empty string")
            elif not (ROOT / image).is_file():
                errors.append(f"{where}: image {image!r} not found")
        extra = set(card) - {"front", "back", "note", "image"}
        if extra:
            errors.append(f"{where}: unknown keys {sorted(extra)}")
        front = card.get("front")
        if front in seen:
            errors.append(f"{where}: duplicate front {front!r}")
        seen.add(front)


def main() -> int:
    errors: list[str] = []
    manifest = load(MANIFEST, errors)
    listed: list[str] = []
    if manifest is not None:
        if not isinstance(manifest, list) or not all(isinstance(f, str) for f in manifest):
            errors.append("manifest.json: must be a list of filenames")
        else:
            listed = manifest
            for name in sorted({f for f in listed if listed.count(f) > 1}):
                errors.append(f"manifest.json: duplicate entry {name}")

    for name in listed:
        deck = load(DATA / name, errors)
        if deck is not None:
            check_deck(name, deck, errors)

    on_disk = {p.name for p in DATA.glob("*.json")} - {MANIFEST.name}
    for name in sorted(on_disk - set(listed)):
        errors.append(f"{name}: not listed in manifest.json")

    if errors:
        print("\n".join(errors))
        return 1
    print(f"ok: {len(listed)} datasets")
    return 0


if __name__ == "__main__":
    sys.exit(main())
