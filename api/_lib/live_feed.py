# -*- coding: utf-8 -*-
"""ამ კვირის მატჩაფები ლაივ ანგარიშით და მოთამაშეების ქულებით."""
import datetime

import espn_feed as ef

BENCH = {"BE", "IR"}


def _team(t, score, proj, lineup):
    players = []
    for p in lineup:
        slot = getattr(p, "slot_position", None) or getattr(p, "position", None) or "—"
        players.append({
            "name": p.name, "pid": p.playerId, "slot": slot, "pro": getattr(p, "proTeam", None),
            "opp": None if getattr(p, "pro_opponent", None) in (None, "None") else p.pro_opponent,
            "points": round(float(getattr(p, "points", 0) or 0), 1),
            "played": bool(getattr(p, "game_played", False)),
            "injury": getattr(p, "injuryStatus", None)
            if getattr(p, "injuryStatus", None) not in (None, "ACTIVE", "NORMAL") else None,
        })
    starters = sorted([p for p in players if p["slot"] not in BENCH], key=lambda p: -p["points"])
    bench = sorted([p for p in players if p["slot"] in BENCH], key=lambda p: -p["points"])
    return {"name": " ".join(getattr(t, "team_name", "BYE").split()), "score": round(float(score or 0), 1),
            "projected": round(float(proj), 1) if proj and proj > 0 else None,
            "starters": starters, "bench": bench}


def build(league):
    period = league.currentMatchupPeriod
    boxes = league.box_scores()
    is_points = bool(boxes) and hasattr(boxes[0], "home_score")
    matchups = []
    for b in boxes:
        if not getattr(b.home_team, "team_name", None) or not getattr(b.away_team, "team_name", None):
            continue
        # ESPN დრაფტის შემდეგ, მაგრამ პირველი სათამაშო დღის დაწყებამდე matchup-ის
        # lineup-ს ცარიელს აბრუნებს. ამ შუალედში გუნდის უკვე შევსებული roster გამოვიყენოთ.
        home_lineup = b.home_lineup or getattr(b.home_team, "roster", None) or []
        away_lineup = b.away_lineup or getattr(b.away_team, "roster", None) or []
        if is_points:
            home = _team(b.home_team, b.home_score, b.home_projected, home_lineup)
            away = _team(b.away_team, b.away_score, b.away_projected, away_lineup)
        else:
            home = _team(b.home_team, b.home_wins, None, home_lineup)
            away = _team(b.away_team, b.away_wins, None, away_lineup)
        matchups.append({"home": home, "away": away})
    return {
        "period": period,
        "is_points": is_points,
        "drafted": ef.is_drafted(league),
        "updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "matchups": matchups,
    }
