# -*- coding: utf-8 -*-
"""პროგნოზები (Pick'em): მენეჯერები ყოველ კვირას ირჩევენ მატჩაფების გამარჯვებულებს.
ქულები: სწორი პროგნოზი = +1, ყველა სწორი ("იდეალური კვირა") = +1 ბონუსი.

ESPN-ის კვირები: 1-ლი კვირა = სეზონის გახსნიდან კვირამდე (დღეები 1–6), შემდეგ ორშაბათი–კვირა (7 დღე).
პროგნოზი იკეტება კვირის პირველი NBA თამაშის დაწყებისას.

შენახვა (Redis hash-ები):
  wcf:pick:<year>   ველი "<კვირა>:<team_id>" = {"<matchup_id>": <გამარჯვებულის team_id>}
  wcf:pick:pins     ველი team_id = "salt$hash" (PIN-ი pbkdf2-ით)
  wcf:pick:fails    ველი team_id = "<მცდელობები>|<unix დრო>"
"""
import hashlib
import hmac
import json
import os
import time

import store

PINS, FAILS = "wcf:pick:pins", "wcf:pick:fails"
MAX_FAILS, LOCK_SECONDS = 5, 15 * 60
PERFECT_BONUS = 1


def picks_key(year):
    return f"wcf:pick:{year}"


def bounds(week):
    """კვირის პირველი და ბოლო დღე (ESPN scoringPeriodId)."""
    return (1, 6) if week == 1 else (7 * (week - 1), 7 * week - 1)


def sp_dates(league):
    """ESPN დღე → ამ დღის პირველი თამაშის დრო (ms, UTC)."""
    g = league.espn_request.get_pro_schedule()
    out = {}
    for t in g.get("settings", {}).get("proTeams", []):
        for sp, games in (t.get("proGamesByScoringPeriod") or {}).items():
            for gm in games or []:
                k = int(sp)
                out[k] = min(out.get(k, gm["date"]), gm["date"])
    return out


def lock_at(dates, week):
    first, last = bounds(week)
    return next((dates[sp] for sp in range(first, last + 1) if sp in dates), None)


def _tid(x):
    return getattr(x, "team_id", x) if x else None


def schedule(league):
    """{კვირა: [{id, home, away, winner}]} — რეგულარული სეზონი, გუნდების კალენდრიდან."""
    weeks = {}
    for t in league.teams:
        for i, m in enumerate(t.schedule):
            h, a = _tid(m.home_team), _tid(m.away_team)
            if not h or not a:
                continue
            mid = f"{min(h, a)}-{max(h, a)}"
            win = {"HOME": h, "AWAY": a, "TIE": 0}.get(getattr(m, "winner", None))
            weeks.setdefault(i + 1, {})[mid] = {"id": mid, "home": h, "away": a, "winner": win}
    return {w: list(v.values()) for w, v in sorted(weeks.items())}


def all_picks(year):
    """{(კვირა, team_id): {matchup_id: გამარჯვებული}}"""
    out = {}
    for field, raw in store.hgetall(picks_key(year)).items():
        w, _, tid = field.partition(":")
        try:
            out[(int(w), int(tid))] = {k: int(v) for k, v in json.loads(raw).items()}
        except (ValueError, TypeError):
            continue
    return out


def leaderboard(sched, picks, teams):
    """ქულები დასრულებულ კვირებზე. teams: {team_id: name}"""
    rows = {tid: {"tid": tid, "name": n, "points": 0, "correct": 0, "total": 0, "perfect": 0, "oracle": 0} for tid, n in teams.items()}
    last_oracle = None
    for w, ms in sched.items():
        if not ms or any(m["winner"] is None for m in ms):
            continue  # კვირა ჯერ არ დასრულებულა
        res = {m["id"]: m["winner"] for m in ms}
        week_scores = {}
        for (pw, tid), p in picks.items():
            if pw != w or tid not in rows:
                continue
            ok = sum(1 for mid, win in p.items() if mid in res and res[mid] == win)
            r = rows[tid]
            r["correct"] += ok
            r["total"] += len(ms)
            r["points"] += ok
            if ok == len(ms):
                r["perfect"] += 1
                r["points"] += PERFECT_BONUS
            week_scores[tid] = ok
        if week_scores:
            best = max(week_scores.values())
            if best > 0:
                winners = [t for t, v in week_scores.items() if v == best]
                for t in winners:
                    rows[t]["oracle"] += 1
                last_oracle = {"week": w, "tids": winners, "correct": best, "of": len(ms)}
    board = sorted(rows.values(), key=lambda r: (-r["points"], -r["correct"], r["name"].lower()))
    return board, last_oracle


# ── PIN ──
def _hash(pin, salt):
    return hashlib.pbkdf2_hmac("sha256", pin.encode(), salt.encode(), 100_000).hex()


def has_pin(tid):
    return str(tid) in store.hgetall(PINS)


def pins_set():
    return {int(k) for k in store.hgetall(PINS)}


def check_pin(tid, pin):
    """True / False. პირველად შეყვანილი PIN ინახება. 5 არასწორის შემდეგ — 15 წუთი ბლოკი."""
    tid, pin = str(tid), str(pin or "")
    if not pin.isdigit() or not 4 <= len(pin) <= 8:
        raise ValueError("PIN უნდა იყოს 4–8 ციფრი")
    fails = store.hgetall(FAILS).get(tid)
    if fails:
        n, _, ts = fails.partition("|")
        if int(n) >= MAX_FAILS:
            if time.time() - float(ts) < LOCK_SECONDS:
                raise PermissionError("ბევრჯერ შეიყვანე არასწორი PIN. სცადე 15 წუთში")
            store.hdel(FAILS, tid)  # ბლოკის დრო გავიდა — თავიდან
            fails = None
    saved = store.hgetall(PINS).get(tid)
    if not saved:
        salt = os.urandom(8).hex()
        store.hset(PINS, tid, f"{salt}${_hash(pin, salt)}")
        return True
    salt, _, h = saved.partition("$")
    if hmac.compare_digest(_hash(pin, salt), h):
        if fails:
            store.hdel(FAILS, tid)
        return True
    n = int(fails.partition("|")[0]) + 1 if fails else 1
    store.hset(FAILS, tid, f"{n}|{time.time()}")
    return False


def reset_pin(tid):
    store.hdel(PINS, str(tid))
    store.hdel(FAILS, str(tid))
