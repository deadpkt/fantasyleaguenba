# -*- coding: utf-8 -*-
"""/api/community — გამოკითხვები და ტრეშ-თოქი.
მენეჯერი შედის იგივე გუნდით + PIN-ით, რაც პროგნოზებში (pickem_core).

GET                                                   — {polls, wall}
POST {action: "vote", tid, pin, id, option}           — ხმის მიცემა (ღია გამოკითხვაზე შეიძლება შეცვლა)
POST {action: "wall_post", tid, pin, text, target?}   — მესიჯი (≤280 სიმბოლო, 20 წამში ერთხელ)
POST {action: "wall_delete", tid, pin, id}            — საკუთარი მესიჯის წაშლა (ან კომისარი: password)
POST {action: "wall_react", id, emoji, delta}         — რეაქცია მესიჯზე
POST {action: "poll_create" | "poll_close" | "poll_delete", password, ...} — მხოლოდ კომისარი"""
import datetime
import hmac
import json
import os
import sys
import time
import uuid
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "_lib"))

import espn_feed as ef  # noqa: E402
import pickem_core as P  # noqa: E402
import store  # noqa: E402

POLLS, WALL, LAST = "wcf:polls", "wcf:wall", "wcf:wall:last"
VOTES = "wcf:votes:{}"
MAX_TEXT, MAX_WALL, COOLDOWN = 280, 200, 20
EMOJIS = ("🔥", "🏀", "😂", "👏", "😮", "💀")
_teams = {"at": 0.0, "v": None}


def _team_ids():
    if _teams["v"] is None or time.time() - _teams["at"] > 600:
        league = ef.connect(ef.load_config())
        _teams["v"] = {t.team_id for t in league.teams}
        _teams["at"] = time.time()
    return _teams["v"]


def _now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _admin(password):
    real = os.environ.get("ADMIN_PASSWORD", "")
    return bool(real) and hmac.compare_digest(str(password or "").encode(), real.encode())


def _json(raw, default=None):
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return default


def _polls():
    out = []
    for raw in store.hgetall(POLLS).values():
        p = _json(raw)
        if not p:
            continue
        votes = {int(t): int(o) for t, o in store.hgetall(VOTES.format(p["id"])).items()}
        p["votes"] = votes  # team_id → ვარიანტი (ღიაა — მეგობრების ლიგაა)
        out.append(p)
    # ღია ზემოთ, მერე ახალი → ძველი
    return sorted(out, key=lambda p: (bool(p.get("closed")), -_ts(p.get("created"))))


def _ts(iso):
    try:
        return datetime.datetime.fromisoformat(iso).timestamp()
    except (TypeError, ValueError):
        return 0


def _wall():
    rx = store.reactions()
    items = [m for m in (_json(r) for r in store.hgetall(WALL).values()) if m]
    for m in items:
        m["reactions"] = rx.get(m["id"], {})
    return sorted(items, key=lambda m: m.get("created", ""), reverse=True)


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
            self._send(200, {"polls": _polls(), "wall": _wall(), "writable": store.enabled()})
        except Exception as e:
            self._send(502, {"error": str(e)})

    def _me(self, body):
        """გუნდი + PIN → team_id, ან (კოდი, შეცდომა)."""
        try:
            tid = int(body.get("tid"))
        except (TypeError, ValueError):
            return None, (400, "გუნდი არ არის არჩეული")
        if tid not in _team_ids():
            return None, (404, "გუნდი ვერ მოიძებნა")
        try:
            ok = P.check_pin(tid, body.get("pin"))
        except ValueError as e:
            return None, (400, str(e))
        except PermissionError as e:
            return None, (429, str(e))
        return (tid, None) if ok else (None, (401, "PIN არასწორია"))

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(min(n, 20000)) or b"{}")
        except ValueError:
            return self._send(400, {"error": "არასწორი მოთხოვნა"})
        a = body.get("action")
        try:
            # ── რეაქცია (შესვლის გარეშე) ──
            if a == "wall_react":
                mid, emoji = str(body.get("id") or ""), body.get("emoji")
                if emoji not in EMOJIS:
                    return self._send(400, {"error": "ეს ემოჯი არ შეიძლება"})
                if mid not in store.hgetall(WALL):
                    return self._send(404, {"error": "მესიჯი ვერ მოიძებნა"})
                try:
                    delta = -1 if int(body.get("delta", 1)) < 0 else 1
                except (TypeError, ValueError):
                    delta = 1
                return self._send(200, {"ok": True, "count": store.react(mid, emoji, delta)})

            # ── კომისარი ──
            if a in ("poll_create", "poll_close", "poll_delete") or (a == "wall_delete" and body.get("password")):
                if not _admin(body.get("password")):
                    return self._send(401, {"error": "პაროლი არასწორია"})
                if a == "poll_create":
                    q = str(body.get("q") or "").strip()[:160]
                    opts = [str(o).strip()[:80] for o in (body.get("options") or []) if str(o).strip()][:8]
                    if not q or len(opts) < 2:
                        return self._send(400, {"error": "კითხვა და მინიმუმ 2 ვარიანტი საჭიროა"})
                    pid = uuid.uuid4().hex[:10]
                    store.hset(POLLS, pid, json.dumps({"id": pid, "q": q, "options": opts, "created": _now(), "closed": False}, ensure_ascii=False))
                elif a == "poll_close":
                    raw = store.hgetall(POLLS).get(str(body.get("id")))
                    p = _json(raw)
                    if not p:
                        return self._send(404, {"error": "ვერ მოიძებნა"})
                    p["closed"] = not p.get("closed")
                    store.hset(POLLS, p["id"], json.dumps(p, ensure_ascii=False))
                elif a == "poll_delete":
                    pid = str(body.get("id"))
                    store.hdel(POLLS, pid)
                    for t in store.hgetall(VOTES.format(pid)):
                        store.hdel(VOTES.format(pid), t)
                else:  # wall_delete კომისრის მიერ
                    mid = str(body.get("id"))
                    store.hdel(WALL, mid)
                    store.drop_reactions(mid)
                return self._send(200, {"ok": True})

            # ── მენეჯერი (გუნდი + PIN) ──
            tid, err = self._me(body)
            if err:
                return self._send(err[0], {"error": err[1]})

            if a == "vote":
                pid = str(body.get("id"))
                p = _json(store.hgetall(POLLS).get(pid))
                if not p:
                    return self._send(404, {"error": "გამოკითხვა ვერ მოიძებნა"})
                if p.get("closed"):
                    return self._send(409, {"error": "გამოკითხვა დახურულია"})
                try:
                    opt = int(body.get("option"))
                except (TypeError, ValueError):
                    return self._send(400, {"error": "ვარიანტი არ არის არჩეული"})
                if not 0 <= opt < len(p["options"]):
                    return self._send(400, {"error": "ასეთი ვარიანტი არ არსებობს"})
                store.hset(VOTES.format(pid), str(tid), str(opt))
                return self._send(200, {"ok": True})

            if a == "wall_post":
                text = " ".join(str(body.get("text") or "").split())[:MAX_TEXT]
                if not text:
                    return self._send(400, {"error": "მესიჯი ცარიელია"})
                last = float(store.hgetall(LAST).get(str(tid)) or 0)
                if time.time() - last < COOLDOWN:
                    return self._send(429, {"error": f"ცოტა მოიცადე, {COOLDOWN} წამში ერთი მესიჯი შეიძლება"})
                target = body.get("target")
                target = int(target) if str(target or "").isdigit() and int(target) in _team_ids() and int(target) != tid else None
                mid = uuid.uuid4().hex[:10]
                store.hset(WALL, mid, json.dumps({"id": mid, "tid": tid, "target": target, "text": text, "created": _now()}, ensure_ascii=False))
                store.hset(LAST, str(tid), str(time.time()))
                # ძველი მესიჯების გასუფთავება
                items = sorted((_json(r) or {} for r in store.hgetall(WALL).values()), key=lambda m: m.get("created", ""))
                for old in items[:-MAX_WALL]:
                    store.hdel(WALL, old.get("id", ""))
                    store.drop_reactions(old.get("id", ""))
                return self._send(200, {"ok": True})

            if a == "wall_delete":
                mid = str(body.get("id"))
                m = _json(store.hgetall(WALL).get(mid))
                if not m:
                    return self._send(404, {"error": "მესიჯი ვერ მოიძებნა"})
                if m.get("tid") != tid:
                    return self._send(403, {"error": "მხოლოდ საკუთარი მესიჯის წაშლა შეიძლება"})
                store.hdel(WALL, mid)
                store.drop_reactions(mid)
                return self._send(200, {"ok": True})

            return self._send(400, {"error": "უცნობი მოქმედება"})
        except Exception as e:
            self._send(500, {"error": str(e)})
