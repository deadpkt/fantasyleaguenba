# -*- coding: utf-8 -*-
"""/api/pickem — კვირის პროგნოზები.
GET  ?week=N  — მატჩაფები, ჩაკეტვის დრო, ცხრილი; სხვების არჩევანი ჩანს მხოლოდ ჩაკეტვის შემდეგ
POST {action: "login", tid, pin}                — შესვლა (პირველად PIN-ი ინახება); აბრუნებს ჩემს პროგნოზებს
POST {action: "pick", tid, pin, week, picks}    — პროგნოზის შენახვა (ჩაკეტვამდე)
POST {action: "reset", password, tid}           — კომისარი PIN-ს აუქმებს"""
import hmac
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "_lib"))

import espn_feed as ef  # noqa: E402
import pickem_core as P  # noqa: E402
import store  # noqa: E402

CACHE = 60
_mem = {"at": 0.0, "v": None}


def _league_info():
    """ESPN-ის ნაწილი (კალენდარი, თარიღები, გუნდები) — მეხსიერებაში 60 წამი."""
    if _mem["v"] is None or time.time() - _mem["at"] > CACHE:
        league = ef.connect(ef.load_config())
        reg = league.settings.reg_season_count or 19
        sched = {w: ms for w, ms in P.schedule(league).items() if w <= reg}
        dates = P.sp_dates(league)
        _mem["v"] = {
            "year": league.year,
            "current": league.currentMatchupPeriod,
            "reg": reg,
            "sched": sched,
            "locks": {w: P.lock_at(dates, w) for w in sched},
            "teams": {t.team_id: " ".join(t.team_name.split()) for t in league.teams},
        }
        _mem["at"] = time.time()
    return _mem["v"]


def _locked(info, week, now_ms=None):
    at = info["locks"].get(week)
    now_ms = now_ms or time.time() * 1000
    return at is not None and now_ms >= at


def _open_week(info):
    """პირველი კვირა, რომელიც ჯერ არ ჩაკეტილა."""
    return next((w for w in sorted(info["sched"]) if not _locked(info, w)), None)


def _check_admin(password):
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
            info = _league_info()
            q = parse_qs(urlparse(self.path).query)
            open_w = _open_week(info)
            try:
                week = int(q.get("week", [0])[0]) or open_w or info["current"]
            except ValueError:
                week = open_w or info["current"]
            week = max(1, min(week, info["reg"]))
            picks = P.all_picks(info["year"])
            board, oracle = P.leaderboard(info["sched"], picks, info["teams"])
            locked = _locked(info, week)
            name = lambda t: {"tid": t, "name": info["teams"].get(t, "?")}
            pins = P.pins_set()
            self._send(200, {
                "season": info["year"],
                "weeks": info["reg"],
                "current_week": info["current"],
                "open_week": open_w,
                "week": week,
                "lock_at": info["locks"].get(week),
                "locked": locked,
                "matchups": [{"id": m["id"], "home": name(m["home"]), "away": name(m["away"]), "winner": m["winner"]}
                             for m in info["sched"].get(week, [])],
                "submitted": sorted(t for (w, t) in picks if w == week),
                # სხვების არჩევანი — მხოლოდ ჩაკეტვის შემდეგ
                "picks": {str(t): p for (w, t), p in picks.items() if w == week} if locked else {},
                "teams": [{"tid": t, "name": n, "has_pin": t in pins} for t, n in sorted(info["teams"].items())],
                "leaderboard": board,
                "oracle": oracle,
                "writable": store.enabled(),
            })
        except Exception as e:
            self._send(502, {"error": str(e)})

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(min(n, 20000)) or b"{}")
        except ValueError:
            return self._send(400, {"error": "არასწორი მოთხოვნა"})
        try:
            info = _league_info()
            action = body.get("action")
            try:
                tid = int(body.get("tid"))
            except (TypeError, ValueError):
                return self._send(400, {"error": "გუნდი არ არის არჩეული"})
            if tid not in info["teams"]:
                return self._send(404, {"error": "გუნდი ვერ მოიძებნა"})

            if action == "reset":
                if not _check_admin(body.get("password")):
                    return self._send(401, {"error": "პაროლი არასწორია"})
                P.reset_pin(tid)
                return self._send(200, {"ok": True})

            try:
                ok = P.check_pin(tid, body.get("pin"))
            except ValueError as e:
                return self._send(400, {"error": str(e)})
            except PermissionError as e:
                return self._send(429, {"error": str(e)})
            if not ok:
                return self._send(401, {"error": "PIN არასწორია"})

            mine = {str(w): p for (w, t), p in P.all_picks(info["year"]).items() if t == tid}
            if action == "login":
                return self._send(200, {"ok": True, "picks": mine})

            if action == "pick":
                week = int(body.get("week") or 0)
                if week not in info["sched"]:
                    return self._send(400, {"error": "ასეთი კვირა არ არსებობს"})
                if _locked(info, week):
                    return self._send(409, {"error": "ეს კვირა უკვე ჩაიკეტა, თამაშები დაიწყო"})
                valid = {m["id"]: {m["home"], m["away"]} for m in info["sched"][week]}
                clean = {}
                for mid, win in (body.get("picks") or {}).items():
                    try:
                        win = int(win)
                    except (TypeError, ValueError):
                        continue
                    if mid in valid and win in valid[mid]:
                        clean[mid] = win
                if not clean:
                    return self._send(400, {"error": "არცერთი პროგნოზი არ არის არჩეული"})
                store.hset(P.picks_key(info["year"]), f"{week}:{tid}", json.dumps(clean))
                mine[str(week)] = clean
                return self._send(200, {"ok": True, "picks": mine})

            return self._send(400, {"error": "უცნობი მოქმედება"})
        except Exception as e:
            self._send(500, {"error": str(e)})
