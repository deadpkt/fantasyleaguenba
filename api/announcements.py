# -*- coding: utf-8 -*-
"""/api/announcements
GET  — ყველა განცხადება (კომისრის + ავტომატური)
POST — {password, action: "add" | "delete" | "pin", ...} — მხოლოდ ADMIN_PASSWORD-ით
POST — {action: "react", id, emoji, delta: 1 | -1} — ყველასთვის (ემოჯი-რეაქციები)"""
import datetime
import hmac
import json
import os
import sys
import uuid
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "_lib"))

import store  # noqa: E402

MAX_TITLE, MAX_TEXT = 120, 2000
# ნებადართული რეაქციები (სხვა ემოჯი არ მიიღება)
EMOJIS = ("🔥", "🏀", "😂", "👏", "😮", "💀")


def _auto():
    """ESPN-დან ავტომატური განცხადებები (დრაფტის თარიღი და ა.შ.)."""
    try:
        import espn_feed as ef
        import news_feed
        return [a for a in news_feed.auto_announcements(ef.connect(ef.load_config()))]
    except Exception:
        return []


def _check(password):
    real = os.environ.get("ADMIN_PASSWORD", "")
    return bool(real) and hmac.compare_digest(str(password or "").encode(), real.encode())


class handler(BaseHTTPRequestHandler):
    def _send(self, code, body, cache="no-store"):
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", cache)
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        try:
            items = [{**a, "auto": False} for a in store.load()]
            items.sort(key=lambda a: (not a.get("pinned"), a.get("created") or a.get("date") or ""), reverse=False)
            pinned = [a for a in items if a.get("pinned")]
            rest = sorted([a for a in items if not a.get("pinned")], key=lambda a: a.get("created") or a.get("date") or "", reverse=True)
            all_items = pinned + rest + _auto()
            try:
                rx = store.reactions()
            except Exception:
                rx = {}
            for a in all_items:
                a["reactions"] = rx.get(a.get("id"), {})
            self._send(200, {"items": all_items, "writable": store.enabled(),
                             "admin": bool(os.environ.get("ADMIN_PASSWORD"))}, "public, s-maxage=5")
        except Exception as e:
            self._send(502, {"error": str(e)})

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(min(n, 20000)) or b"{}")
        except ValueError:
            return self._send(400, {"error": "არასწორი მოთხოვნა"})
        if body.get("action") == "react":
            return self._react(body)
        if not _check(body.get("password")):
            return self._send(401, {"error": "პაროლი არასწორია"})
        action = body.get("action")
        if action == "login":
            return self._send(200, {"ok": True})
        try:
            items = store.load()
            if action == "add":
                title = str(body.get("title") or "").strip()[:MAX_TITLE]
                if not title:
                    return self._send(400, {"error": "სათაური ცარიელია"})
                now = datetime.datetime.now(datetime.timezone.utc)
                items.insert(0, {"id": uuid.uuid4().hex[:10], "title": title,
                                 "text": str(body.get("text") or "").strip()[:MAX_TEXT],
                                 "pinned": bool(body.get("pinned")), "date": now.date().isoformat(),
                                 "created": now.isoformat()})
            elif action == "delete":
                items = [a for a in items if a.get("id") != body.get("id")]
                try:
                    store.drop_reactions(str(body.get("id")))
                except Exception:
                    pass
            elif action == "pin":
                for a in items:
                    if a.get("id") == body.get("id"):
                        a["pinned"] = not a.get("pinned")
            else:
                return self._send(400, {"error": "უცნობი მოქმედება"})
            store.save(items)
            self._send(200, {"ok": True})
        except Exception as e:
            self._send(500, {"error": str(e)})

    def _react(self, body):
        aid, emoji = str(body.get("id") or ""), body.get("emoji")
        try:
            delta = -1 if int(body.get("delta", 1)) < 0 else 1
        except (TypeError, ValueError):
            delta = 1
        if emoji not in EMOJIS:
            return self._send(400, {"error": "ეს ემოჯი არ შეიძლება"})
        try:
            ids = {a.get("id") for a in store.load()} | {"auto-draft", "auto-deadline"}
            if aid not in ids:
                return self._send(404, {"error": "განცხადება ვერ მოიძებნა"})
            self._send(200, {"ok": True, "count": store.react(aid, emoji, delta)})
        except Exception as e:
            self._send(500, {"error": str(e)})
