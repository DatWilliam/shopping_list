"""Startet Küchenzettel lokal auf dem PC.

    py main.py              → öffnet http://localhost:8000 im Browser
    py main.py 8080         → anderer Port
    py main.py --no-browser → nur den Server starten

Auf dem PC läuft die App damit komplett (inkl. Offline-Modus, „installieren“ in Chrome/Edge).
Fürs Handy braucht es HTTPS – siehe README.md (GitHub Pages).
"""
from __future__ import annotations

import functools
import http.server
import socket
import sys
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    # Windows liefert .js sonst manchmal als text/plain aus – dann laden ES-Module nicht.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".json": "application/json",
        ".webmanifest": "application/manifest+json",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:  # leiser
        pass


def lan_ip() -> str | None:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("10.255.255.255", 1))
            return s.getsockname()[0]
    except OSError:
        return None


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    port = int(args[0]) if args else 8000
    handler = functools.partial(Handler, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("", port), handler) as httpd:
        url = f"http://localhost:{port}/"
        print(f"Küchenzettel läuft auf {url}")
        ip = lan_ip()
        if ip:
            print(f"Im WLAN (nur zum Ausprobieren, ohne Offline-Modus): http://{ip}:{port}/")
        print("Beenden mit Strg+C")
        if "--no-browser" not in sys.argv:
            webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nBeendet.")


if __name__ == "__main__":
    main()
