# -*- coding: utf-8 -*-
"""ტრეიდების ისტორია.
- მიმდინარე სეზონი: ყოველი ტრეიდი დეტალურად (ESPN-ის აქტივობიდან)
- წინა სეზონები: ESPN დეტალებს აღარ გასცემს — მხოლოდ ტრეიდების რაოდენობა გუნდების მიხედვით (არქივიდან)"""
import datetime
import json


def _name(t):
    return " ".join(getattr(t, "team_name", str(t or "")).split())


def current(league):
    """[{date, sides: [{team, gives: [{name, pid}]}]}] — უახლესი პირველი."""
    # ESPN-ის ახალი transaction feed მიღებულ trade-ს 224 ტიპით აბრუნებს,
    # ხოლო espn-api ჯერ მხოლოდ ძველ 244 (TRADED) ტიპს იცნობს. ამიტომ raw
    # communication feed-ს ვკითხულობთ და ორივე ტიპს ვამუშავებთ.
    try:
        teams = {int(t.team_id): t for t in league.teams}
        roster_players = {int(p.playerId): p for t in league.teams for p in (getattr(t, "roster", None) or [])}
        filters = {
            "topics": {
                "filterType": {"value": ["ACTIVITY_TRANSACTIONS"]},
                "limit": 100,
                "limitPerMessageSet": {"value": 100},
                "offset": 0,
                "sortMessageDate": {"sortPriority": 1, "sortAsc": False},
                "filterIncludeMessageTypeIds": {"value": [224, 244]},
            }
        }
        data = league.espn_request.league_get(
            extend="/communication/",
            params={"view": "kona_league_communication"},
            headers={"x-fantasy-filter": json.dumps(filters)},
        )
        out, seen = [], set()
        for topic in data.get("topics", []):
            messages = [m for m in topic.get("messages", []) if m.get("messageTypeId") in (224, 244)]
            signature = tuple(sorted((int(m.get("from", 0)), int(m.get("to", 0)), int(m.get("targetId", 0))) for m in messages))
            if not messages or signature in seen:
                continue
            seen.add(signature)
            sides = {}
            for message in messages:
                source = int(message.get("from", 0))
                target = int(message.get("to", 0))
                pid = int(message.get("targetId", 0))
                if source not in teams or target not in teams or not pid:
                    continue
                player = league.player_map.get(pid) or league.player_map.get(str(pid)) or roster_players.get(pid)
                player_name = player if isinstance(player, str) else getattr(player, "name", f"Player {pid}")
                sides.setdefault(source, {"team": _name(teams[source]), "to": _name(teams[target]), "gives": []})["gives"].append({
                    "name": player_name, "pid": pid
                })
            if len(sides) >= 2:
                stamp = topic.get("date") or messages[0].get("date")
                out.append({"date": datetime.datetime.fromtimestamp(stamp / 1000, datetime.timezone.utc).isoformat(),
                            "sides": list(sides.values())})
        if out:
            return out
    except Exception:
        # ძველი ESPN ფორმატისთვის ქვემოთ არსებული espn-api fallback რჩება.
        pass

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
