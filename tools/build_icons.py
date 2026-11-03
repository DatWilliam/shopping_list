"""Baut icons/sprite.svg aus den schwarz-weißen OpenMoji-Icons, die in js/foods.js vorkommen.

Aufruf (im App-Ordner):  py tools/build_icons.py

Jedes Emoji in foods.js (z. B. '🧅') wird als <symbol id="e1F9C5"> in die Sprite-Datei
übernommen. Linien und Flächen bekommen fill/stroke="currentColor", damit die Icons im
hellen und dunklen Design die Textfarbe annehmen.

OpenMoji – https://openmoji.org – Lizenz CC BY-SA 4.0
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

VERSION = "17.0.0"
BASE = f"https://cdn.jsdelivr.net/npm/openmoji@{VERSION}"
ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "tools" / "_cache" / VERSION
SOURCE = ROOT / "js" / "foods.js"
OUT = ROOT / "icons" / "sprite.svg"
VIEWBOX = "5 5 62 62"  # OpenMoji zeichnet in 72×72 mit Rand – etwas enger zuschneiden


def fetch(path: str) -> str:
    target = CACHE / path
    if not target.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(f"{BASE}/{path}", headers={"User-Agent": "kuechenzettel-build"})
        with urllib.request.urlopen(req, timeout=60) as res:
            target.write_bytes(res.read())
    return target.read_text(encoding="utf-8")


def key(emoji: str) -> str:
    """Gleiche Logik wie iconKey() in app.js: Codepoints ohne FE0F, mit '-' verbunden."""
    return "-".join(f"{ord(c):X}" for c in emoji if c != "\ufe0f")


def emojis_in(text: str) -> list[str]:
    text = re.sub(r"\\u\{([0-9A-Fa-f]+)\}", lambda m: chr(int(m.group(1), 16)), text)
    text = re.sub(r"\\u([0-9A-Fa-f]{4})", lambda m: chr(int(m.group(1), 16)), text)
    found: list[str] = []
    for s in re.findall(r"'([^'\n]{1,12})'", text):
        if all(ord(c) > 0x2000 for c in s) and s not in found:
            found.append(s)
    return found


def to_symbol(svg: str, sid: str) -> tuple[str, set[str]]:
    inner = re.search(r"<svg[^>]*>(.*)</svg>", svg, re.S).group(1)
    inner = re.sub(r"<!--.*?-->", "", inner, flags=re.S)
    inner = re.sub(r'\s(?:id|class|stroke-miterlimit)="[^"]*"', "", inner)
    inner = re.sub(r"#000000\b|#000\b", "currentColor", inner, flags=re.I)
    inner = re.sub(r"<g>\s*</g>|<g\s*/>", "", inner)
    inner = re.sub(r">\s+<", "><", inner).strip()
    other_colors = set(re.findall(r'(?:fill|stroke)="(#[0-9A-Fa-f]{3,6})"', inner))
    return f'<symbol id="e{sid}" viewBox="{VIEWBOX}">{inner}</symbol>', other_colors


def main() -> int:
    emojis = emojis_in(SOURCE.read_text(encoding="utf-8"))
    index = json.loads(fetch("data/openmoji.json"))
    by_key = {key("".join(chr(int(h, 16)) for h in e["hexcode"].split("-"))): e["hexcode"] for e in index}

    symbols, missing = [], []
    for emoji in emojis:
        k = key(emoji)
        hexcode = by_key.get(k)
        if not hexcode:
            missing.append(f"{emoji} ({k})")
            continue
        symbol, colors = to_symbol(fetch(f"black/svg/{hexcode}.svg"), k)
        if colors:
            print(f"  Hinweis: {emoji} enthält weitere Farben {sorted(colors)}")
        symbols.append(symbol)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg">\n'
        "<!-- OpenMoji (https://openmoji.org), CC BY-SA 4.0 – erzeugt mit tools/build_icons.py -->\n"
        + "\n".join(symbols) + "\n</svg>\n",
        encoding="utf-8",
    )
    print(f"{len(symbols)} Icons → {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")
    if missing:
        print("Nicht in OpenMoji gefunden:", ", ".join(missing))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
