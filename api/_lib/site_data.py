# -*- coding: utf-8 -*-
"""ლიგის ვებსაიტისთვის მონაცემების აწყობა (JSON). გამოყენება: python site_data.py out.json"""
import datetime
import json
import sys

import espn_feed as ef
import history as H


def build():
    cfg = ef.load_config()
    league = ef.connect(cfg)
    S = H.refresh(league, cfg)
    names = H.owner_key_map(S)
    nm = lambda o: names.get(o, {}).get("name", "?").strip()

    # მიმდინარე სეზონი
    cur_y = league.year
    cur = {
        "label": H.season_label(cur_y), "week": league.currentMatchupPeriod, "drafted": ef.is_drafted(league),
        "standings": [{"name": t.team_name.strip(), "w": t.wins, "l": t.losses, "pf": round(t.points_for)}
                      for t in sorted(league.teams, key=lambda t: (t.standing or 99, -t.wins))],
    }

    # ჩემპიონები
    champs = []
    for y in sorted(S):
        s = S[y]
        if s["complete"]:
            c = next((t for t in s["teams"].values() if t["final"] == 1), None)
            r = next((t for t in s["teams"].values() if t["final"] == 2), None)
            if c:
                champs.append({"season": H.season_label(y), "team": c["name"].strip(),
                               "rec": f"{c['w']}-{c['l']}", "runner": r["name"].strip() if r else None})

    # all-time + კარიერა
    alltime = []
    for o, r in H.alltime(S):
        c = H.career(S, o) or {}
        alltime.append({"team": nm(o), "w": r["w"], "l": r["l"], "t": r["t"], "pct": round(r["pct"], 3),
                        "ppg": round(r["ppg"]), "pf": round(r["pf"]), "titles": r["titles"],
                        "titles_y": [H.season_label(y) for y in r["titles_y"]], "finals": r["finals"],
                        "playoffs": r["playoffs"], "seasons": r["seasons"], "best_week": round(r["best_week"]),
                        "ovr": c.get("ovr", 60),
                        "history": [{"season": H.season_label(h["year"]), "team": h["name"].strip(), "rec": h["rec"],
                                     "final": h["final"], "complete": h["complete"]} for h in c.get("history", [])]})

    # რეკორდები
    rc = H.records(S)
    records = []
    if rc:
        L = H.season_label
        records = [
            {"k": "ყველაზე მაღალი კვირა", "v": f"{rc['high']['score']:,.0f}", "who": nm(rc["high"]["owner"]),
             "when": f"{L(rc['high']['year'])} · კვირა {rc['high']['p']}"},
            {"k": "ყველაზე დაბალი კვირა", "v": f"{rc['low']['score']:,.0f}", "who": nm(rc["low"]["owner"]),
             "when": f"{L(rc['low']['year'])} · კვირა {rc['low']['p']}"},
        ]
        if rc["blowout"]:
            b = rc["blowout"]
            records.append({"k": "ყველაზე დიდი განადგურება", "v": f"+{b['margin']:,.0f}", "who": f"{nm(b['winner'])} vs {nm(b['loser'])}",
                            "when": f"{L(b['year'])} · კვირა {b['p']} · {b['ws']:,.0f}–{b['ls']:,.0f}"})
        if rc["closest"]:
            c = rc["closest"]
            records.append({"k": "ყველაზე ახლო მატჩი", "v": f"{c['margin']:,.0f}", "who": f"{nm(c['winner'])} vs {nm(c['loser'])}",
                            "when": f"{L(c['year'])} · კვირა {c['p']} · {c['ws']:,.0f}–{c['ls']:,.0f}"})
        records.append({"k": "მოგებების სერია", "v": str(rc["win_streak"]["n"]), "who": nm(rc["win_streak"]["owner"]), "when": "ზედიზედ"})
        records.append({"k": "წაგებების სერია", "v": str(rc["lose_streak"]["n"]), "who": nm(rc["lose_streak"]["owner"]), "when": "ზედიზედ"})
        u = rc["unlucky"]
        if u[0] < u[5]:
            records.append({"k": "ყველაზე უიღბლო წაგება", "v": f"{u[0]:,.0f}", "who": nm(u[1]),
                            "when": f"{L(u[3])} · კვირა {u[4]} · მაინც წააგო"})
        lk = rc["lucky"]
        if lk[0] > lk[5]:
            records.append({"k": "ყველაზე იღბლიანი მოგება", "v": f"{lk[0]:,.0f}", "who": nm(lk[1]),
                            "when": f"{L(lk[3])} · კვირა {lk[4]} · მაინც მოიგო"})

    # სეზონები
    seasons = []
    for y in sorted(S, reverse=True):
        s = S[y]
        if not H.done_games(s):
            continue
        rp = H.season_recap(s)
        a = rp["awards"]
        tids = sorted(s["teams"], key=lambda k: (s["teams"][k]["final"] or 99, s["teams"][k]["seed"]))
        weeks = sorted({g["p"] for g in H.done_games(s, include_playoffs=False)})
        grid = {k: {} for k in tids}
        for g in H.done_games(s, include_playoffs=False):
            for tid, sc, opp, osc in ((g["h"], g["hs"], g["a"], g["as"]), (g["a"], g["as"], g["h"], g["hs"])):
                grid[str(tid)][g["p"]] = [round(sc), 1 if sc > osc else (0 if sc < osc else 2)]
        dr = H.draft_review(s, top=5)
        seasons.append({
            "label": H.season_label(y), "complete": s["complete"],
            "standings": [{"name": t["name"].strip(), "w": t["w"], "l": t["l"], "pf": round(t["pf"]), "pa": round(t["pa"]),
                           "final": t["final"], "seed": t["seed"], "acq": t["acq"], "trades": t["trades"]} for t in rp["order"]],
            "awards": {
                "mvp": {"player": a["mvp"]["player"], "total": a["mvp"]["total"], "avg": a["mvp"]["avg"]} if a["mvp"] else None,
                "pf": {"team": a["pf"]["name"].strip(), "v": round(a["pf"]["pf"])},
                "pa": {"team": a["pa"]["name"].strip(), "v": round(a["pa"]["pa"])},
                "acq": {"team": a["acq"]["name"].strip(), "v": a["acq"]["acq"]},
                "trades": {"team": a["trades"]["name"].strip(), "v": a["trades"]["trades"]},
                "best_week": {"team": a["best_week"][1].strip(), "v": round(a["best_week"][0]), "p": a["best_week"][2]} if a["best_week"] else None,
            },
            "weekly": {"weeks": weeks, "teams": [{"name": s["teams"][k]["name"].strip(),
                                                  "scores": [grid[k].get(w) for w in weeks]} for k in tids]},
            "luck": [{"name": x["name"].strip(), "real": round(x["real"], 3), "allplay": round(x["allplay"], 3),
                      "luck": round(x["luck"], 3)} for x in H.luck(s)],
            "power": [{"name": x["name"].strip(), "score": x["score"], "rec": x["rec"], "ppg": round(x["ppg"])} for x in H.power(s)],
            "draft": {
                "steals": [{"player": x["player"], "n": x["n"], "rank": x["rank"], "total": round(x["total"]),
                            "team": s["teams"].get(str(x["team"]), {}).get("name", "?").strip()} for x in dr["steals"]],
                "busts": [{"player": x["player"], "n": x["n"], "rank": x["rank"], "total": round(x["total"]),
                           "team": s["teams"].get(str(x["team"]), {}).get("name", "?").strip()} for x in dr["busts"]],
                "grades": [{"team": g["name"].strip(), "grade": g["grade"], "best": g["best"]["player"]} for g in dr["grades"]],
                "round1": [{"n": x["n"], "player": x["player"], "rank": x["rank"], "total": round(x["total"]),
                            "team": s["teams"].get(str(x["team"]), {}).get("name", "?").strip()}
                           for x in (s.get("draft") or []) if x["round"] == 1],
            } if dr else None,
        })

    # H2H მატრიცა (ყველა სეზონი)
    owners = [r[0] for r in H.alltime(S)]
    h2h = {o: {p: [0, 0] for p in owners} for o in owners}
    for y, s in S.items():
        for g in H.done_games(s):
            if g["hs"] == g["as"]:
                continue
            ho, ao = s["teams"][str(g["h"])]["owner"], s["teams"][str(g["a"])]["owner"]
            if ho in h2h and ao in h2h:
                w, l = (ho, ao) if g["hs"] > g["as"] else (ao, ho)
                h2h[w][l][0] += 1
                h2h[l][w][1] += 1
    matrix = {"teams": [nm(o) for o in owners], "cells": [[h2h[o][p] for p in owners] for o in owners]}

    return {"league": league.settings.name.strip(), "updated": datetime.date.today().isoformat(),
            "current": cur, "champions": champs, "alltime": alltime, "records": records,
            "seasons": seasons, "h2h": matrix}


if __name__ == "__main__":
    data = build()
    out = sys.argv[1] if len(sys.argv) > 1 else "site_data.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"✅ {out}")
