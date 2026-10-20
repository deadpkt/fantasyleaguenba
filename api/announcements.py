# -*- coding: utf-8 -*-
"""/api/announcements
GET  — ყველა განცხადება (კომისრის + ავტომატური)
POST — {password, action: "add" | "delete" | "pin", ...} — მხოლოდ ADMIN_PASSWORD-ით
POST — {action: "react", id, emoji, delta: 1 | -1} — ყველასთვის (ემოჯი-რეაქციები)"""
import datetime
import html
import hmac
import json
import os
import sys
import uuid
import urllib.parse
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "_lib"))

import store  # noqa: E402

MAX_TITLE, MAX_TEXT, MAX_IMAGE = 120, 2000, 1000
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
            query = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
            preview_id = str((query.get("preview") or [""])[0])
            if preview_id:
                return self._preview(preview_id)
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
                image = str(body.get("image") or "").strip()[:MAX_IMAGE]
                if image and not image.lower().startswith(("https://", "http://")):
                    return self._send(400, {"error": "სურათის ლინკი უნდა იწყებოდეს http:// ან https://-ით"})
                items.insert(0, {"id": uuid.uuid4().hex[:10], "title": title,
                                 "text": str(body.get("text") or "").strip()[:MAX_TEXT],
                                 "image": image,
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

    def _preview(self, aid):
        item = next((a for a in store.load() if str(a.get("id")) == aid), None)
        proto = self.headers.get("X-Forwarded-Proto", "https")
        host = self.headers.get("X-Forwarded-Host") or self.headers.get("Host", "")
        origin = f"{proto}://{host}" if host else ""
        target = f"{origin}/announcements?announcement={urllib.parse.quote(aid)}"
        if not item:
            self.send_response(302)
            self.send_header("Location", f"{origin}/announcements")
            self.end_headers()
            return
        title = str(item.get("title") or "Wolt Channel Fantasy")
        description = str(item.get("text") or "ლიგის განცხადება").replace("\n", " ")[:240]
        image = str(item.get("image") or f"{origin}/og.png")
        esc = lambda value: html.escape(value, quote=True)
        document = f"""<!doctype html><html lang=\"ka\"><head><meta charset=\"utf-8\">
<title>{esc(title)}</title><meta name=\"description\" content=\"{esc(description)}\">
<meta property=\"og:type\" content=\"article\"><meta property=\"og:site_name\" content=\"Wolt Channel Fantasy\">
<meta property=\"og:title\" content=\"{esc(title)}\"><meta property=\"og:description\" content=\"{esc(description)}\">
<meta property=\"og:image\" content=\"{esc(image)}\"><meta property=\"og:url\" content=\"{esc(target)}\">
<meta name=\"twitter:card\" content=\"summary_large_image\"><meta name=\"twitter:title\" content=\"{esc(title)}\">
<meta name=\"twitter:description\" content=\"{esc(description)}\"><meta name=\"twitter:image\" content=\"{esc(image)}\">
<meta http-equiv=\"refresh\" content=\"0;url={esc(target)}\"><link rel=\"canonical\" href=\"{esc(target)}\"></head>
<body><p><a href=\"{esc(target)}\">განცხადების გახსნა</a></p><script>location.replace({json.dumps(target)})</script></body></html>"""
        payload = document.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "public, s-maxage=60")
        self.end_headers()
        self.wfile.write(payload)

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
