# -*- coding: utf-8 -*-
"""GET /api/news — NBA სიახლეები, ფანტაზი-სიახლეები, ტრავმები, ლიგის განცხადებები (CDN-ში 15 წუთი)."""
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "_lib"))

import news_feed  # noqa: E402

CACHE_SECONDS = 900
_mem = {"at": 0.0, "body": None}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            if _mem["body"] is None or time.time() - _mem["at"] > CACHE_SECONDS / 2:
                _mem["body"] = json.dumps(news_feed.build(), ensure_ascii=False).encode("utf-8")
                _mem["at"] = time.time()
            body, code = _mem["body"], 200
        except Exception as e:
            body, code = json.dumps({"error": str(e)}, ensure_ascii=False).encode("utf-8"), 502
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", f"public, s-maxage={CACHE_SECONDS}, stale-while-revalidate=86400"
                         if code == 200 else "no-store")
        self.end_headers()
        self.wfile.write(body)
