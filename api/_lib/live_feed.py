# -*- coding: utf-8 -*-
"""ამ კვირის მატჩაფები: ლაივ ანგარიში, მოთამაშეების სრული სტატისტიკა (დღეს და კვირაში) და
მოთამაშეებზე დაფუძნებული პროგნოზი (projections.py)."""
import datetime
import time

import espn_feed as ef
import league_settings
import pickem_core
import projections as PJ

BENCH = {"BE", "IR"}
LINE = ("PTS", "REB", "AST", "STL", "BLK", "TO", "3PM", "FGM", "FGA", "FTM", "FTA", "MIN")
_settings = {"at": 0.0, "v": None}


def settings(league):
    """ლიგის პარამეტრები ერთი საათით ინახება (სლოტები იშვიათად იცვლება)."""
    if _settings["v"] is None or time.time() - _settings["at"] > 3600:
        try:
            _settings["v"] = league_settings.build(league)
        except Exception:
            _settings["v"] = {}
        _settings["at"] = time.time()
    return _settings["v"]


def _line(p):
    """სტატისტიკის ხაზი ESPN-ის stats-იდან (ერთადერთი ჩანაწერი: დღე ან კვირა)."""
    for v in (getattr(p, "stats", {}) or {}).values():
        tot = (v or {}).get("total") or {}
        if tot:
            return {k: round(float(tot.get(k, 0) or 0)) for k in LINE}
    return None


def _injury(p):
    s = getattr(p, "injuryStatus", None)
    return s if s not in (None, "ACTIVE", "NORMAL") else None


def _utc(d):
    """espn-api თარიღს სერვერის ლოკალურ დროში აბრუნებს (naive) — UTC-ში გადაგვყავს."""
    if not isinstance(d, datetime.datetime):
        return None
    return (d.astimezone(datetime.timezone.utc) if d.tzinfo is None else d).isoformat()


def _tip(p, sp):
    """თამაშის დაწყების დრო (ISO, UTC)."""
    g = (getattr(p, "schedule", {}) or {}).get(str(sp)) or {}
    return _utc(g.get("date"))


def _week_games(p, days):
    """კვირის განრიგი: {დღე: [მეტოქე, დაწყება]} მხოლოდ იმ დღეებისთვის, როცა თამაშობს."""
    out = {}
    sched = getattr(p, "schedule", {}) or {}
    for sp in days:
        g = sched.get(str(sp))
        if g:
            out[str(sp)] = [g.get("team"), _utc(g.get("date"))]
    return out


def _days(league, lo, hi, today):
    """კვირის დღეები თარიღით (ამერიკული დღე, როცა თამაშები იმართება)."""
    seen = {}
    for t in league.teams:
        for p in t.roster or []:
            for sp, g in (getattr(p, "schedule", {}) or {}).items():
                if str(sp).isdigit() and lo <= int(sp) <= hi and int(sp) not in seen and g.get("date"):
                    seen[int(sp)] = g["date"]
    out = []
    for sp in range(lo, hi + 1):
        d = seen.get(sp)
        # ღამის თამაშები UTC-ში შემდეგ დღეზე გადადის: ამერიკული (ET) დღე = UTC - 5 სთ
        day = (datetime.datetime.fromisoformat(_utc(d)) - datetime.timedelta(hours=5)).date().isoformat() if d else None
        out.append({"sp": sp, "date": day, "today": sp == today, "past": sp < today})
    # თარიღი, რომელიც ვერ ვიპოვეთ, მეზობლიდან
    for i, x in enumerate(out):
        if x["date"] is None:
            for j, y in enumerate(out):
                if y["date"]:
                    x["date"] = (datetime.date.fromisoformat(y["date"]) + datetime.timedelta(days=i - j)).isoformat()
                    break
    return out


def build(league):
    period = league.currentMatchupPeriod
    today = max(1, int(getattr(league, "scoringPeriodId", 0) or 1))
    week_boxes = league.box_scores(matchup_total=True)
    day_boxes = league.box_scores(matchup_total=False)
    is_points = bool(week_boxes) and hasattr(week_boxes[0], "home_score")

    # დღევანდელი ხაზები pid-ით
    day = {}
    for b in day_boxes:
        for p in list(b.home_lineup or []) + list(b.away_lineup or []):
            day[p.playerId] = p

    live_scores, played_today = {}, {}
    for b in week_boxes:
        for side in ("home", "away"):
            t = getattr(b, f"{side}_team")
            if getattr(t, "team_id", None) is not None:
                live_scores[t.team_id] = getattr(b, f"{side}_score", 0) if is_points else 0
    for pid, p in day.items():
        line = _line(p)
        played_today[pid] = bool(getattr(p, "game_played", 0) == 100 or (line and line.get("MIN")))

    proj = PJ.build(league, settings(league), live_scores, played_today)
    lo, hi = pickem_core.bounds(period)
    week_days = range(lo, hi + 1)

    def player(p):
        d = day.get(p.playerId)
        dline = _line(d) if d else None
        opp = getattr(d, "pro_opponent", None) if d else None
        has_game = opp not in (None, "None")
        if not has_game:
            status = "none"
        elif getattr(d, "game_played", 0) == 100:
            status = "final"
        elif dline and dline.get("MIN"):
            status = "live"
        else:
            status = "upcoming"
        pj = proj["players"].get(p.playerId, {})
        return {
            "name": p.name, "pid": p.playerId,
            # კვირის roster-ში ESPN ყველას ერთ სლოტს უწერს — სწორი სლოტი დღევანდელ lineup-შია
            "slot": (getattr(d, "slot_position", None) if d else None) or getattr(p, "lineupSlot", None) or getattr(p, "slot_position", None) or "BE",
            "pro": getattr(p, "proTeam", None), "opp": opp if has_game else None, "injury": _injury(p),
            "status": status, "tip": _tip(p, today) if has_game else None,
            "today": round(float(getattr(d, "points", 0) or 0), 1) if d else 0,
            "today_line": dline if status in ("final", "live") else None,
            "points": round(float(getattr(p, "points", 0) or 0), 1),
            "week_line": _line(p),
            "per_game": pj.get("per_game", 0), "week_left": pj.get("week_left", 0), "week_games": pj.get("week_games", 0),
            "games": _week_games(p, week_days),
            # ძველი ველი (თავსებადობისთვის)
            "played": status == "final",
        }

    def team(t, score, espn_proj, lineup):
        players = [player(p) for p in lineup]
        starters = sorted([p for p in players if p["slot"] not in BENCH], key=lambda p: (-p["today"], -p["points"]))
        bench = sorted([p for p in players if p["slot"] in BENCH], key=lambda p: -p["points"])
        pt = proj["teams"].get(getattr(t, "team_id", None), {})
        espn = round(float(espn_proj), 1) if espn_proj and espn_proj > 0 else None
        return {
            "tid": getattr(t, "team_id", None),
            "name": " ".join(getattr(t, "team_name", "BYE").split()),
            "score": round(float(score or 0), 1),
            "today": round(sum(p["today"] for p in starters), 1),
            "projected": pt.get("final") if pt else espn,
            "espn_projected": espn,
            "remaining": pt.get("remaining"), "games_left": pt.get("games_left"), "sd": pt.get("sd"),
            "starters": starters, "bench": bench,
        }

    matchups = []
    for b in week_boxes:
        if not getattr(b.home_team, "team_name", None) or not getattr(b.away_team, "team_name", None):
            continue
        # დრაფტის შემდეგ, პირველ სათამაშო დღემდე ESPN lineup-ს ცარიელს აბრუნებს — მაშინ roster
        hl = b.home_lineup or getattr(b.home_team, "roster", None) or []
        al = b.away_lineup or getattr(b.away_team, "roster", None) or []
        if is_points:
            home = team(b.home_team, b.home_score, b.home_projected, hl)
            away = team(b.away_team, b.away_score, b.away_projected, al)
        else:
            home = team(b.home_team, b.home_wins, None, hl)
            away = team(b.away_team, b.away_wins, None, al)
        ph, pa = proj["teams"].get(home["tid"]), proj["teams"].get(away["tid"])
        home["win"] = round(PJ.win_prob(ph, pa), 3) if ph and pa else None
        away["win"] = round(1 - home["win"], 3) if home["win"] is not None else None
        matchups.append({"home": home, "away": away})

    return {
        "period": period,
        "today": today,
        "is_points": is_points,
        "drafted": ef.is_drafted(league),
        "updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "days": _days(league, lo, hi, today),
        "matchups": matchups,
    }
