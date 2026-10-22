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


def _line_avg(avg, keys=AVG):
    """საშუალოები თამაშზე (FG%/FT% ათწილადით)."""
    if not avg:
        return None
    return {k: round(float(avg.get(k, 0) or 0), 3 if "%" in k else 1) for k in keys}


def _card(league, pid):
    """ESPN-ის მოთამაშის ბარათი პირდაპირ: წინა სეზონი, ფლობის %, ADP, ნომერი, სეზონის შეფასება.
    (espn-api ამათ არ არჩევს, ამიტომ თვითონ ვკითხულობთ)."""
    prev = league.year - 1
    out = {"last_season": None, "owned": None, "adp": None, "jersey": None, "outlook": None}
    try:
        from espn_api.basketball.constant import STATS_MAP
        raw = league.espn_request.get_player_card([pid], league.finalScoringPeriod, [f"00{prev}"])
        player = (raw.get("players") or [{}])[0]
        player = player.get("player", player)
        own = player.get("ownership") or {}
        out["owned"] = round(own["percentOwned"], 1) if own.get("percentOwned") is not None else None
        out["adp"] = round(own["averageDraftPosition"], 1) if own.get("averageDraftPosition") else None
        out["jersey"] = player.get("jersey") or None
        out["outlook"] = (player.get("seasonOutlook") or "").strip() or None
        for split in player.get("stats", []):
            if split.get("seasonId") == prev and split.get("id") == f"00{prev}" and split.get("statSourceId") == 0:
                gp = float((split.get("stats") or {}).get("42", 0) or 0)
                avg = {STATS_MAP.get(k, k): v for k, v in (split.get("averageStats") or {}).items()}
                out["last_season"] = {"season": H.season_label(prev), "total": round(split.get("appliedTotal", 0)),
                                      "avg": round(split.get("appliedAverage", 0), 1), "gp": int(gp), "line": _line_avg(avg)}
    except Exception:
        pass
    return out


def build(league, pid):
    p = league.player_info(playerId=pid, include_news=True)
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
    card = _card(league, pid)
    proj = p.stats.get(f"{league.year}_projected") or {}
    news = [{"date": n.get("published"), "headline": n.get("headline", ""), "story": (n.get("story") or "")[:600]}
            for n in (p.news or [])[:4] if n.get("headline")]
    return {
        "pid": pid, "name": p.name, "pro": p.proTeam, "pos": p.position,
        "jersey": card["jersey"], "pos_rank": getattr(p, "posRank", None) or None,
        "owned": card["owned"], "adp": card["adp"], "outlook": card["outlook"], "news": news,
        "projection": {"avg": round(float(proj.get("applied_avg") or 0), 1), "total": round(float(proj.get("applied_total") or 0)),
                       "line": _line_avg(proj.get("avg"))} if proj else None,
        "injury": inj if inj not in (None, "ACTIVE", "NORMAL") else None,
        "return": p.expected_return_date.isoformat() if getattr(p, "expected_return_date", None) else None,
        "owner": _owner(league, pid),
        "season": {
            "label": H.season_label(league.year), "gp": int(PJ._gp(p)),
            "total": round(float(p.total_points or 0)), "avg": round(float(p.avg_points or 0), 1),
            "projected_avg": round(float(p.projected_avg_points or 0), 1), "per_game": round(PJ.per_game(p), 1),
            "line": {s: round(float(avg.get(s, 0) or 0), 3 if "%" in s else 1) for s in AVG} if avg else None,
        },
        "last_season": card["last_season"],
        "games": games,
        "upcoming": upcoming,
        "drafts": _drafts(league, pid),
        "updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
