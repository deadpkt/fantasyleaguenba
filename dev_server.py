# -*- coding: utf-8 -*-
"""ლოკალური გადახედვა Vercel-ის გარეშე: python dev_server.py  →  http://localhost:3001 (მხოლოდ API; საიტი: npm run dev)
პარამეტრები იკითხება .env ფაილიდან (LEAGUE_ID=..., ESPN_S2=..., SWID=...)."""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# Windows-ზე reuse_address ერთ პორტზე ორ სერვერს უშვებს — ძველი აგრძელებს პასუხს. ვკრძალავთ.
ThreadingHTTPServer.allow_reuse_address = sys.platform != "win32"

HERE = os.path.dirname(os.path.abspath(__file__))
env = os.path.join(HERE, ".env")
if os.path.exists(env):
    for line in open(env, encoding="utf-8-sig"):
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"'))

os.environ.setdefault("WCF_LOCAL", "1")
sys.path.insert(0, os.path.join(HERE, "api"))
import data  # noqa: E402
import logo  # noqa: E402
import news as news_api  # noqa: E402
import live as live_api  # noqa: E402
import announcements as ann_api  # noqa: E402


class Dev(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=HERE, **kw)

    def do_GET(self):
        if self.path.startswith("/api/data"):
            return data.handler.do_GET(self)
        if self.path.startswith("/api/live"):
            return live_api.handler.do_GET(self)
        if self.path.startswith("/api/announcements"):
            return ann_api.handler.do_GET(self)
        if self.path.startswith("/api/news"):
            return news_api.handler.do_GET(self)
        if self.path.startswith("/api/logo"):
            return logo.handler.do_GET(self)
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/announcements"):
            return ann_api.handler.do_POST(self)
        self.send_error(404)

    # ann_api.handler-ის დამხმარე მეთოდი
    _send = ann_api.handler._send
    _react = ann_api.handler._react


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    print(f"🏀 http://localhost:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Dev).serve_forever()
