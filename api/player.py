# -*- coding: utf-8 -*-
"""GET /api/player?pid=123 — მოთამაშის გვერდი (თამაშების ჟურნალი, საშუალოები, ვის ეკუთვნოდა). CDN-ში 1 წუთი."""
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "_lib"))

import espn_feed  # noqa: E402
import player_card  # noqa: E402

CACHE_SECONDS = 60
_mem = {}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        try:
            pid = int((q.get("pid") or ["0"])[0])
        except ValueError:
            pid = 0
        try:
            if pid <= 0:
                raise ValueError("pid არასწორია")
            hit = _mem.get(pid)
            if not hit or time.time() - hit[0] > CACHE_SECONDS / 2:
                league = espn_feed.connect(espn_feed.load_config())
                data = player_card.build(league, pid)
                if data is None:
                    raise LookupError("მოთამაშე ვერ მოიძებნა")
                _mem[pid] = (time.time(), json.dumps(data, ensure_ascii=False).encode("utf-8"))
            body, code = _mem[pid][1], 200
        except (ValueError, LookupError) as e:
            body, code = json.dumps({"error": str(e)}, ensure_ascii=False).encode("utf-8"), 404
        except Exception as e:
            body, code = json.dumps({"error": str(e)}, ensure_ascii=False).encode("utf-8"), 502
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", f"public, s-maxage={CACHE_SECONDS}, stale-while-revalidate=300" if code == 200 else "no-store")
        self.end_headers()
        self.wfile.write(body)
