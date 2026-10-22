# -*- coding: utf-8 -*-
"""ერთი მოთამაშის გვერდი: თამაშების ჟურნალი (ფანტაზი ქულა + სტატისტიკა), სეზონის საშუალოები,
მომავალი თამაშები და ვის ეკუთვნოდა ლიგის დრაფტებში."""
import datetime

import history as H
import projections as PJ

LINE = ("PTS", "REB", "AST", "STL", "BLK", "3PM", "TO", "FGM", "FGA", "FTM", "FTA", "MIN")
AVG = ("PTS", "REB", "AST", "STL", "BLK", "3PM", "TO", "MIN", "FG%", "FT%")


def _utc(d):
    if not isinstance(d, datetime.datetime):
        return None
    return (d.astimezone(datetime.timezone.utc) if d.tzinfo is None else d).isoformat()


def _owner(league, pid):
    for t in league.teams:
        for p in t.roster or []:
            if p.playerId == pid:
                return {"tid": t.team_id, "team": " ".join(t.team_name.split()), "slot": getattr(p, "lineupSlot", None)}
    return None


def _drafts(league, pid):
    """ვინ აიყვანა დრაფტზე: ახლანდელი სეზონი + არქივის სეზონები."""
    out = []
    for i, d in enumerate([d for d in (league.draft or []) if d.playerId and d.playerId > 0], 1):
        if d.playerId == pid:
            out.append({"season": H.season_label(league.year), "team": " ".join(getattr(d.team, "team_name", "").split()),
                        "round": d.round_num, "pick": d.round_pick, "n": i, "total": None, "avg": None, "rank": None})
    for year, s in sorted(H.load_archive().items(), reverse=True):
        for d in s.get("draft") or []:
            if d.get("pid") == pid:
                team = (s.get("teams") or {}).get(str(d.get("team")), {}).get("name", "")
                out.append({"season": H.season_label(int(year)), "team": " ".join(team.split()), "round": d.get("round"),
                            "pick": d.get("pick"), "n": d.get("n"), "total": d.get("total"), "avg": d.get("avg"), "rank": d.get("rank")})
    return out


def _last_season(league, pid):
    """წინა სეზონის ჯამი პირდაპირ ESPN-იდან (espn-api მხოლოდ მიმდინარე სეზონს არჩევს)."""
    prev = league.year - 1
    try:
        raw = league.espn_request.get_player_card([pid], league.finalScoringPeriod, [f"00{prev}"])
        player = (raw.get("players") or [{}])[0]
        player = player.get("player", player)
        for split in player.get("stats", []):
            if split.get("seasonId") == prev and split.get("id") == f"00{prev}" and split.get("statSourceId") == 0:
                gp = float((split.get("stats") or {}).get("42", 0) or 0)
                return {"season": H.season_label(prev), "total": round(split.get("appliedTotal", 0)),
                        "avg": round(split.get("appliedAverage", 0), 1), "gp": int(gp)}
    except Exception:
        pass
    return None


def build(league, pid):
    p = league.player_info(playerId=pid)
    if not p:
        return None
    today = max(1, int(getattr(league, "scoringPeriodId", 0) or 1))
    games = []
    for k, v in p.stats.items():
        if not str(k).isdigit() or not v.get("total"):
            continue
        tot = v["total"]
        if not tot.get("MIN") and not tot.get("PTS"):
            continue
        games.append({"sp": int(k), "date": _utc(v.get("date")), "opp": v.get("team"), "fpts": round(float(v.get("applied_total") or 0), 1),
                      "line": {s: round(float(tot.get(s, 0) or 0)) for s in LINE}})
    games.sort(key=lambda g: -g["sp"])

    season = p.stats.get(f"{league.year}_total") or {}
    avg = season.get("avg") or {}
    upcoming = sorted(
        ({"sp": int(sp), "date": _utc(g.get("date")), "opp": g.get("team")} for sp, g in (p.schedule or {}).items()
         if str(sp).isdigit() and int(sp) >= today and not any(x["sp"] == int(sp) for x in games)),
        key=lambda g: g["sp"],
    )[:7]
    inj = getattr(p, "injuryStatus", None)
    return {
        "pid": pid, "name": p.name, "pro": p.proTeam, "pos": p.position,
        "injury": inj if inj not in (None, "ACTIVE", "NORMAL") else None,
        "return": p.expected_return_date.isoformat() if getattr(p, "expected_return_date", None) else None,
        "owner": _owner(league, pid),
        "season": {
            "label": H.season_label(league.year), "gp": int(PJ._gp(p)),
            "total": round(float(p.total_points or 0)), "avg": round(float(p.avg_points or 0), 1),
            "projected_avg": round(float(p.projected_avg_points or 0), 1), "per_game": round(PJ.per_game(p), 1),
            "line": {s: round(float(avg.get(s, 0) or 0), 3 if "%" in s else 1) for s in AVG} if avg else None,
        },
        "last_season": _last_season(league, pid),
        "games": games,
        "upcoming": upcoming,
        "drafts": _drafts(league, pid),
        "updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
