# -*- coding: utf-8 -*-
"""GET /api/logo?u=<ESPN ლოგოს URL> — გუნდის ლოგოს გამოტანა.
ESPN-ზე ატვირთული ლოგოები მხოლოდ შესულ მომხმარებელს ჩანს, ამიტომ სერვერი მათ ლიგის cookie-ებით
მოიტანს (cookie-ები სერვერზე რჩება). დაშვებულია მხოლოდ ESPN-ის მისამართები — ეს ღია proxy არ არის."""
import os
import sys
import urllib.request
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "_lib"))

import espn_feed  # noqa: E402

ALLOWED_HOSTS = {"mystique-api.fantasy.espn.com", "g.espncdn.com", "a.espncdn.com"}
MAX_BYTES = 2_000_000


def fetch(url):
    host = urlparse(url).hostname or ""
    if urlparse(url).scheme != "https" or host not in ALLOWED_HOSTS:
        raise ValueError("not allowed")
    cfg = espn_feed.load_config()
    headers = {"User-Agent": "Mozilla/5.0"}
    if host == "mystique-api.fantasy.espn.com" and cfg["espn_s2"] and cfg["swid"]:
        headers["Cookie"] = f"espn_s2={cfg['espn_s2']}; SWID={cfg['swid']}"
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=10) as r:
        ctype = r.headers.get("Content-Type", "")
        if not ctype.startswith("image/"):
            raise ValueError("not an image")
        return r.read(MAX_BYTES + 1), ctype


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        url = (parse_qs(urlparse(self.path).query).get("u") or [""])[0]
        try:
            body, ctype = fetch(url)
            if len(body) > MAX_BYTES:
                raise ValueError("too large")
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800")
            # SVG-ში სკრიპტი არ უნდა გაეშვას, თუ ვინმე პირდაპირ გახსნის
            self.send_header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox")
            self.send_header("X-Content-Type-Options", "nosniff")
        except Exception:
            body = b""
            self.send_response(404)
            # წაშლილ ლოგოს ყოველ გვერდზე თავიდან არ ვითხოვთ ESPN-იდან
            self.send_header("Cache-Control", "public, max-age=3600, s-maxage=3600")
        self.end_headers()
        self.wfile.write(body)
