# -*- coding: utf-8 -*-
"""ლიგის აქტივობა ESPN-იდან (შეტყობინებებისთვის): ვინ ვინ აიყვანა, გაუშვა, ტრეიდები.
ESPN-ის კოდები: 178 თავისუფალი აგენტი, 180 waiver, 179/181/239 გაშვება,
224 ტრეიდი მიღებულია (განხილვაშია), 244 ტრეიდი დამუშავდა. 188 = შემადგენლობის ცვლა (არ გვჭირდება)."""
import datetime
import json

ADD = {178: "add", 180: "waiver"}
DROP = {179, 181, 239}
TRADE = {224: "trade_review", 244: "trade"}


def _name(t):
    return " ".join(getattr(t, "team_name", "").split())


def build(league, size=40):
    try:
        teams = {int(t.team_id): t for t in league.teams}
        filters = {
            "topics": {
                "filterType": {"value": ["ACTIVITY_TRANSACTIONS"]},
                "limit": size,
                "limitPerMessageSet": {"value": 25},
                "offset": 0,
                "sortMessageDate": {"sortPriority": 1, "sortAsc": False},
                "filterIncludeMessageTypeIds": {"value": [178, 180, 179, 181, 239, 224, 244]},
            }
        }
        data = league.espn_request.league_get(
            extend="/communication/",
            params={"view": "kona_league_communication"},
            headers={"x-fantasy-filter": json.dumps(filters)},
        )
    except Exception:
        return []

    def player(pid):
        p = league.player_map.get(pid) or league.player_map.get(str(pid))
        return {"name": p if isinstance(p, str) else f"Player {pid}", "pid": pid}

    out = []
    for topic in data.get("topics", []):
        msgs = [m for m in topic.get("messages", []) if m.get("messageTypeId") in (*ADD, *DROP, *TRADE)]
        if not msgs:
            continue
        date = datetime.datetime.fromtimestamp(topic.get("date", 0) / 1000, datetime.timezone.utc).isoformat()
        kinds = {m["messageTypeId"] for m in msgs}
        trade = next((TRADE[k] for k in (244, 224) if k in kinds), None)
        if trade:
            sides = {}
            for m in msgs:
                src, dst = int(m.get("from") or 0), int(m.get("to") or 0)
                if src in teams and dst in teams:
                    sides.setdefault(src, {"team": _name(teams[src]), "to": _name(teams[dst]), "gives": []})["gives"].append(player(int(m["targetId"])))
            if len(sides) >= 2:
                out.append({"id": f"{topic.get('id', date)}-{trade}", "kind": trade, "date": date, "sides": list(sides.values())})
            continue
        # დამატება / გაშვება: ერთ ჩანაწერში შეიძლება ორივე იყოს (აიყვანა X, გაუშვა Y)
        tid = next((int(m.get("for") if m["messageTypeId"] == 239 else m.get("to") or 0) for m in msgs), 0)
        if tid not in teams:
            continue
        added = [player(int(m["targetId"])) for m in msgs if m["messageTypeId"] in ADD]
        dropped = [player(int(m["targetId"])) for m in msgs if m["messageTypeId"] in DROP]
        kind = next((ADD[m["messageTypeId"]] for m in msgs if m["messageTypeId"] in ADD), "drop")
        out.append({"id": str(topic.get("id", date)), "kind": kind, "date": date, "team": _name(teams[tid]), "tid": tid,
                    "added": added, "dropped": dropped})
    return out
