# -*- coding: utf-8 -*-
"""GET /api/data — ლიგის ყველა მონაცემი JSON-ად, პირდაპირ ESPN-იდან.
Vercel-ის CDN პასუხს 10 წუთით ინახავს და ფონზე ანახლებს, ამიტომ საიტი სწრაფია და
ESPN-ზე ცვლილება (ქულა, ტრეიდი, ცხრილი) საიტზე მაქსიმუმ ~10 წუთში ჩანს."""
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "_lib"))

import site_data  # noqa: E402

CACHE_SECONDS = 600
_mem = {"at": 0.0, "body": None}


def payload():
    if _mem["body"] is None or time.time() - _mem["at"] > CACHE_SECONDS / 2:
        _mem["body"] = json.dumps(site_data.build(), ensure_ascii=False).encode("utf-8")
        _mem["at"] = time.time()
    return _mem["body"]


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            body, code = payload(), 200
        except Exception as e:  # ESPN მიუწვდომელია / ცვლადები არასწორია
            body, code = json.dumps({"error": str(e)}, ensure_ascii=False).encode("utf-8"), 502
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", f"public, s-maxage={CACHE_SECONDS}, stale-while-revalidate=86400"
                         if code == 200 else "no-store")
        self.end_headers()
        self.wfile.write(body)
