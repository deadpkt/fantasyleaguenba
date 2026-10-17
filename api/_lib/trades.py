# -*- coding: utf-8 -*-
"""ტრეიდების ისტორია.
- მიმდინარე სეზონი: ყოველი ტრეიდი დეტალურად (ESPN-ის აქტივობიდან)
- წინა სეზონები: ESPN დეტალებს აღარ გასცემს — მხოლოდ ტრეიდების რაოდენობა გუნდების მიხედვით (არქივიდან)"""
import datetime


def _name(t):
    return " ".join(getattr(t, "team_name", str(t or "")).split())


def current(league):
    """[{date, sides: [{team, gives: [{name, pid}]}]}] — უახლესი პირველი."""
    out = []
    try:
        acts = league.recent_activity(size=100, msg_type="TRADED")
    except Exception:
        return out
    for a in acts:
        sides = {}
        for team, action, player, *_ in a.actions:
            if action != "TRADED":
                continue
            # ESPN-ში ტრეიდის ჩანაწერი გუნდს უთითებს, საიდანაც მოთამაშე წავიდა
            side = sides.setdefault(_name(team), [])
            side.append({"name": getattr(player, "name", str(player)), "pid": getattr(player, "playerId", None)})
        if not sides:
            continue
        teams = list(sides)
        res = []
        for t in teams:
            # 2-გუნდიან ტრეიდში მიმღები = მეორე გუნდი
            to = [x for x in teams if x != t][0] if len(teams) == 2 else None
            res.append({"team": t, "to": to, "gives": sides[t]})
        out.append({"date": datetime.datetime.fromtimestamp(a.date / 1000, datetime.timezone.utc).isoformat(), "sides": res})
    return out


def past(seasons, season_label):
    """[{season, total, teams: [{team, trades}]}] — წინა სეზონების მიმოხილვა."""
    out = []
    for y in sorted(seasons, reverse=True):
        s = seasons[y]
        if not s.get("complete"):
            continue
        teams = sorted(({"team": " ".join(t["name"].split()), "trades": t.get("trades", 0)} for t in s["teams"].values()),
                       key=lambda x: -x["trades"])
        # თითო ტრეიდში 2 გუნდი მონაწილეობს
        total = sum(t["trades"] for t in teams) // 2
        out.append({"season": season_label(y), "total": total, "teams": teams})
    return out
