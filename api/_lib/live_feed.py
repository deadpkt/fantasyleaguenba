# -*- coding: utf-8 -*-
"""ამ კვირის მატჩაფები ლაივ ანგარიშით და მოთამაშეების ქულებით."""
import datetime

import espn_feed as ef

BENCH = {"BE", "IR"}


def _team(t, score, proj, lineup):
    players = []
    for p in lineup:
        players.append({
            "name": p.name, "pid": p.playerId, "slot": p.slot_position, "pro": p.proTeam,
            "opp": None if p.pro_opponent in (None, "None") else p.pro_opponent,
            "points": round(float(p.points or 0), 1), "played": bool(p.game_played),
            "injury": p.injuryStatus if p.injuryStatus not in (None, "ACTIVE", "NORMAL") else None,
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
        if is_points:
            home = _team(b.home_team, b.home_score, b.home_projected, b.home_lineup)
            away = _team(b.away_team, b.away_score, b.away_projected, b.away_lineup)
        else:
            home = _team(b.home_team, b.home_wins, None, b.home_lineup)
            away = _team(b.away_team, b.away_wins, None, b.away_lineup)
        matchups.append({"home": home, "away": away})
    return {
        "period": period,
        "is_points": is_points,
        "drafted": ef.is_drafted(league),
        "updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "matchups": matchups,
    }
