# -*- coding: utf-8 -*-
"""ლიგის ისტორია ყველა სეზონიდან: all-time ცხრილი, რეკორდები, იღბალი, დრაფტის ანალიზი,
სეზონის შეჯამებები, Power Rankings. დასრულებული სეზონები ინახება archive.json-ში."""
import json
import os

import espn_feed as ef

HERE = os.path.dirname(os.path.abspath(__file__))
ARCHIVE_FILE = os.path.join(HERE, "archive.json")


def season_label(year):
    return f"{year - 1}-{str(year)[2:]}"


# ================================================================== ერთი სეზონის აწყობა
def build_season(league, with_draft=True):
    """ESPN League -> ჩვენი ფორმატი (JSON-ად შესანახი)."""
    s = league.settings
    raw = league.espn_request.league_get(params={"view": ["mMatchupScore", "mTeam", "mSettings"]})
    teams = {}
    for t in league.teams:
        owner = (t.owners or [{}])[0] if t.owners else {}
        owner_id = owner.get("id") if isinstance(owner, dict) else None
        oname = ""
        if isinstance(owner, dict):
            oname = (f"{owner.get('firstName', '')} {owner.get('lastName', '')}".strip()
                     or owner.get("displayName", ""))
        teams[str(t.team_id)] = {
            "name": t.team_name.strip(), "owner": owner_id or f"t{t.team_id}", "owner_name": oname,
            "w": t.wins, "l": t.losses, "t": t.ties, "pf": round(t.points_for, 1), "pa": round(t.points_against, 1),
            "final": t.final_standing or 0, "seed": t.standing, "acq": t.acquisitions, "trades": t.trades,
            "logo": t.logo_url,
        }
    multi = {int(k) for k, v in (s.matchup_periods or {}).items() if len(v) > 1}
    games = []
    for m in raw.get("schedule", []):
        if "away" not in m or "home" not in m:
            continue
        p = m.get("matchupPeriodId")
        games.append({
            "p": p, "h": m["home"]["teamId"], "a": m["away"]["teamId"],
            "hs": round(m["home"].get("totalPoints", 0), 1), "as": round(m["away"].get("totalPoints", 0), 1),
            "win": m.get("winner", "UNDECIDED"),
            "po": m.get("playoffTierType", "NONE") != "NONE" or p > s.reg_season_count,
            "tier": m.get("playoffTierType", "NONE"),
            "multi": p in multi,
        })
    season = {"year": league.year, "name": s.name.strip(), "reg": s.reg_season_count,
              "playoff_teams": s.playoff_team_count, "teams": teams, "games": games,
              "complete": all(g["win"] != "UNDECIDED" for g in games) and bool(games),
              "draft": [], "scoring": s.scoring_type}
    if with_draft and league.draft:
        season["draft"] = _draft_values(league)
    return season


def _draft_values(league):
    """დრაფტის ყველა პიკი + მოთამაშის სეზონის ჯამური ქულები."""
    picks = [p for p in league.draft if p.playerId and p.playerId > 0]
    totals = {}
    ids = [p.playerId for p in picks]
    for i in range(0, len(ids), 50):
        try:
            got = league.player_info(playerId=ids[i:i + 50])
        except Exception:
            got = []
        if not isinstance(got, list):
            got = [got] if got else []
        for pl in got:
            totals[pl.playerId] = (float(pl.total_points or 0), float(pl.avg_points or 0))
    out = []
    for n, p in enumerate(picks, 1):
        tot, avg = totals.get(p.playerId, (0.0, 0.0))
        out.append({"n": n, "round": p.round_num, "pick": p.round_pick, "pid": p.playerId,
                    "player": p.playerName, "team": getattr(p.team, "team_id", None),
                    "total": round(tot, 1), "avg": round(avg, 1)})
    ranked = sorted(out, key=lambda x: x["total"], reverse=True)
    for r, x in enumerate(ranked, 1):
        x["rank"] = r
    return out


# ================================================================== არქივი
def load_archive():
    try:
        with open(ARCHIVE_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def save_archive(arc):
    # Vercel-ზე ფაილური სისტემა მხოლოდ წასაკითხია — მაშინ არქივი მხოლოდ მეხსიერებაში რჩება
    try:
        with open(ARCHIVE_FILE, "w", encoding="utf-8") as f:
            json.dump(arc, f, ensure_ascii=False)
    except OSError:
        pass


def refresh(league, cfg):
    """წინა სეზონები ერთხელ ჩამოიტვირთება, მიმდინარე — ყოველ ჯერზე. აბრუნებს {year: season}."""
    arc = load_archive()
    changed = False
    for y in getattr(league, "previousSeasons", None) or []:
        key = str(y)
        if key in arc and arc[key].get("complete"):
            continue
        try:
            old = ef.connect(cfg, y)
            arc[key] = build_season(old)
            changed = True
            print(f"  🏛  არქივი: სეზონი {season_label(y)} ჩაიტვირთა")
        except Exception as e:
            print(f"  ⚠ სეზონი {y} ვერ ჩაიტვირთა: {e}")
    if changed:
        save_archive(arc)
    cur = build_season(league, with_draft=False)
    if cur["complete"]:
        # სეზონი დასრულდა — ერთხელ შევინახოთ დრაფტის ანალიზით (ჯილდოებისთვის / Wrapped-ისთვის)
        if not arc.get(str(league.year), {}).get("complete"):
            try:
                arc[str(league.year)] = build_season(league, with_draft=True)
                save_archive(arc)
            except Exception as e:
                print(f"  ⚠ სეზონის დაარქივება ვერ მოხერხდა: {e}")
        cur = arc.get(str(league.year), cur)
    arc = dict(arc)
    arc[str(league.year)] = cur
    return {int(k): v for k, v in arc.items()}


# ================================================================== დამხმარე
def owner_key_map(seasons):
    """owner -> უახლესი გუნდის სახელი + team_id (Discord-თან დასაკავშირებლად)."""
    out = {}
    for y in sorted(seasons):
        for tid, t in seasons[y]["teams"].items():
            out[t["owner"]] = {"name": t["name"], "tid": int(tid), "owner_name": t["owner_name"]}
    return out


def _owner(season, tid):
    return season["teams"][str(tid)]["owner"]


def done_games(season, include_playoffs=True):
    return [g for g in season["games"] if g["win"] != "UNDECIDED" and (include_playoffs or not g["po"])]


# ================================================================== All-time
def alltime(seasons):
    rows = {}
    for y, s in seasons.items():
        for tid, t in s["teams"].items():
            r = rows.setdefault(t["owner"], {"w": 0, "l": 0, "t": 0, "pf": 0.0, "pa": 0.0, "titles": 0,
                                             "titles_y": [], "finals": 0, "playoffs": 0, "seasons": 0, "weeks": 0,
                                             "best_week": 0.0})
            if not any(g for g in done_games(s) if str(g["h"]) == tid or str(g["a"]) == tid):
                continue
            r["seasons"] += 1
            if s["complete"]:
                if t["final"] == 1:
                    r["titles"] += 1
                    r["titles_y"].append(y)
                if t["final"] in (1, 2):
                    r["finals"] += 1
                if t["seed"] and t["seed"] <= s["playoff_teams"]:
                    r["playoffs"] += 1
        for g in done_games(s, include_playoffs=False):
            for me, them, ms, ts in ((g["h"], g["a"], g["hs"], g["as"]), (g["a"], g["h"], g["as"], g["hs"])):
                r = rows[_owner(s, me)]
                r["pf"] += ms
                r["pa"] += ts
                r["weeks"] += 1
                if not g["multi"]:
                    r["best_week"] = max(r["best_week"], ms)
                if ms > ts:
                    r["w"] += 1
                elif ms < ts:
                    r["l"] += 1
                else:
                    r["t"] += 1
    for r in rows.values():
        n = r["w"] + r["l"] + r["t"]
        r["pct"] = (r["w"] + 0.5 * r["t"]) / n if n else 0.0
        r["ppg"] = r["pf"] / r["weeks"] if r["weeks"] else 0.0
    return sorted(rows.items(), key=lambda kv: (kv[1]["titles"], kv[1]["pct"], kv[1]["pf"]), reverse=True)


# ================================================================== რეკორდების წიგნი
def records(seasons):
    weeks, games, streaks = [], [], []
    for y, s in sorted(seasons.items()):
        for g in done_games(s):
            if g["multi"]:
                continue
            for me, them, ms, ts in ((g["h"], g["a"], g["hs"], g["as"]), (g["a"], g["h"], g["as"], g["hs"])):
                weeks.append((ms, _owner(s, me), _owner(s, them), y, g["p"], ts))
            games.append((abs(g["hs"] - g["as"]), g, y, s))
    if not weeks:
        return None

    def gdesc(item):
        mg, g, y, s = item
        w, l = (g["h"], g["a"]) if g["hs"] > g["as"] else (g["a"], g["h"])
        ws, ls = max(g["hs"], g["as"]), min(g["hs"], g["as"])
        return {"margin": mg, "winner": _owner(s, w), "loser": _owner(s, l), "ws": ws, "ls": ls, "year": y, "p": g["p"]}

    decided = [x for x in games if x[0] > 0]
    # სერიები (ქრონოლოგიურად ყველა სეზონში)
    seq = {}
    for y, s in sorted(seasons.items()):
        for g in sorted(done_games(s), key=lambda g: g["p"]):
            if g["hs"] == g["as"]:
                continue
            for me, won in ((g["h"], g["hs"] > g["as"]), (g["a"], g["as"] > g["hs"])):
                seq.setdefault(_owner(s, me), []).append(won)
    best_w = best_l = (0, None)
    for o, res in seq.items():
        cw = cl = 0
        for won in res:
            cw, cl = (cw + 1, 0) if won else (0, cl + 1)
            if cw > best_w[0]:
                best_w = (cw, o)
            if cl > best_l[0]:
                best_l = (cl, o)
    combined = max(games, key=lambda x: x[1]["hs"] + x[1]["as"])
    hi, lo = max(weeks), min(weeks)
    return {
        "high": {"score": hi[0], "owner": hi[1], "year": hi[3], "p": hi[4]},
        "low": {"score": lo[0], "owner": lo[1], "year": lo[3], "p": lo[4]},
        "blowout": gdesc(max(decided, key=lambda x: x[0])) if decided else None,
        "closest": gdesc(min(decided, key=lambda x: x[0])) if decided else None,
        "combined": {"score": combined[1]["hs"] + combined[1]["as"], **gdesc(combined)},
        "win_streak": {"n": best_w[0], "owner": best_w[1]},
        "lose_streak": {"n": best_l[0], "owner": best_l[1]},
        "unlucky": max(weeks, key=lambda w: w[0] if w[0] < w[5] else -1),   # ყველაზე მაღალი ქულა წაგებისას
        "lucky": min(weeks, key=lambda w: w[0] if w[0] > w[5] else 1e9),    # ყველაზე დაბალი ქულა მოგებისას
    }


# ================================================================== იღბალი (all-play)
def luck(season):
    """all-play: ყოველ კვირას შენი ქულა ყველა გუნდის წინააღმდეგ. luck = რეალური% − all-play%."""
    by_p = {}
    for g in done_games(season, include_playoffs=False):
        by_p.setdefault(g["p"], []).extend([(g["h"], g["hs"]), (g["a"], g["as"])])
    ap = {}
    for p, sc in by_p.items():
        for tid, s in sc:
            r = ap.setdefault(tid, [0, 0])
            for other, os_ in sc:
                if other == tid:
                    continue
                r[0] += s > os_
                r[1] += 1
    out = []
    for tid, (w, n) in ap.items():
        t = season["teams"][str(tid)]
        games = t["w"] + t["l"] + t["t"]
        real = (t["w"] + 0.5 * t["t"]) / games if games else 0
        allp = w / n if n else 0
        out.append({"tid": tid, "owner": t["owner"], "name": t["name"], "real": real, "allplay": allp,
                    "luck": real - allp, "ap_w": w, "ap_l": n - w})
    return sorted(out, key=lambda x: x["luck"], reverse=True)


# ================================================================== Power Rankings
def power(season, recent=3):
    games = done_games(season, include_playoffs=False)
    if not games:
        return []
    last_p = max(g["p"] for g in games)
    stats = {}
    for g in games:
        for tid, sc in ((g["h"], g["hs"]), (g["a"], g["as"])):
            r = stats.setdefault(tid, {"pf": 0, "n": 0, "recent": []})
            r["pf"] += sc
            r["n"] += 1
            if g["p"] > last_p - recent:
                r["recent"].append(sc)
    lk = {x["tid"]: x for x in luck(season)}
    ppg = {t: r["pf"] / r["n"] for t, r in stats.items()}
    rec = {t: sum(r["recent"]) / len(r["recent"]) if r["recent"] else ppg[t] for t, r in stats.items()}
    lo, hi = min(ppg.values()), max(ppg.values())
    rlo, rhi = min(rec.values()), max(rec.values())
    out = []
    for tid in stats:
        t = season["teams"][str(tid)]
        n1 = (ppg[tid] - lo) / (hi - lo) if hi > lo else 0.5
        n2 = (rec[tid] - rlo) / (rhi - rlo) if rhi > rlo else 0.5
        games_n = t["w"] + t["l"] + t["t"]
        wp = (t["w"] + 0.5 * t["t"]) / games_n if games_n else 0.5
        score = 100 * (0.35 * lk.get(tid, {}).get("allplay", 0.5) + 0.3 * n1 + 0.2 * n2 + 0.15 * wp)
        out.append({"tid": tid, "owner": t["owner"], "name": t["name"], "score": round(score, 1),
                    "rec": f"{t['w']}-{t['l']}", "ppg": ppg[tid], "recent": rec[tid]})
    return sorted(out, key=lambda x: x["score"], reverse=True)


# ================================================================== სეზონის შეჯამება + ჯილდოები
def season_recap(season):
    teams = season["teams"]
    order = sorted(teams.items(), key=lambda kv: (kv[1]["final"] or 99, kv[1]["seed"]))
    lk = luck(season)
    wk = []
    for g in done_games(season):
        if not g["multi"]:
            wk += [(g["hs"], g["h"], g["p"]), (g["as"], g["a"], g["p"])]
    best = max(wk) if wk else None
    draft = season.get("draft") or []
    mvp = max(draft, key=lambda x: x["total"]) if draft else None
    awards = {
        "pf": max(teams.values(), key=lambda t: t["pf"]),
        "pa": max(teams.values(), key=lambda t: t["pa"]),
        "acq": max(teams.values(), key=lambda t: t["acq"]),
        "trades": max(teams.values(), key=lambda t: t["trades"]),
        "lucky": lk[0] if lk else None,
        "unlucky": lk[-1] if lk else None,
        "best_week": (best[0], teams[str(best[1])]["name"], best[2]) if best else None,
        "mvp": mvp,
    }
    return {"year": season["year"], "name": season["name"], "order": [t for _, t in order],
            "champion": order[0][1] if order and order[0][1]["final"] == 1 else None, "awards": awards}


def draft_review(season, top=3):
    d = season.get("draft") or []
    if not d:
        return None
    n = len(d)
    for x in d:
        x["value"] = x["n"] - x["rank"]          # + = steal, − = bust
    steals = sorted([x for x in d if x["round"] and x["round"] >= 3], key=lambda x: x["value"], reverse=True)[:top]
    busts = sorted([x for x in d if x["round"] and x["round"] <= 3], key=lambda x: x["value"])[:top]
    by_team = {}
    for x in d:
        by_team.setdefault(x["team"], []).append(x)
    team_scores = []
    for tid, picks in by_team.items():
        if tid is None or str(tid) not in season["teams"]:
            continue
        val = sum(x["value"] for x in picks) / max(1, len(picks))
        best = max(picks, key=lambda x: x["total"])
        team_scores.append((season["teams"][str(tid)]["name"], val, best, int(tid)))
    team_scores.sort(key=lambda x: x[1], reverse=True)
    grades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"]
    graded = []
    for i, (name, val, best, tid) in enumerate(team_scores):
        g = grades[min(len(grades) - 1, round(i * (len(grades) - 1) / max(1, len(team_scores) - 1)))]
        graded.append({"name": name, "grade": g, "best": best, "tid": tid})
    return {"steals": steals, "busts": busts, "grades": graded, "picks": n,
            "first": d[0] if d else None}


# ================================================================== კარიერა (/career)
def career(seasons, owner):
    at = dict(alltime(seasons))
    r = at.get(owner)
    if not r:
        return None
    hist = []
    for y, s in sorted(seasons.items()):
        for tid, t in s["teams"].items():
            if t["owner"] == owner and (t["w"] + t["l"] + t["t"]) > 0:
                hist.append({"year": y, "name": t["name"], "rec": f"{t['w']}-{t['l']}", "final": t["final"],
                             "pf": t["pf"], "complete": s["complete"]})
    all_ppg = [v["ppg"] for v in at.values() if v["weeks"]]
    pct_rank = sum(p <= r["ppg"] for p in all_ppg) / len(all_ppg) if all_ppg else 0.5
    ovr = 62 + 22 * r["pct"] + 8 * pct_rank + 4 * min(r["titles"], 3) + 1.5 * min(r["finals"], 4)
    ovr = int(max(60, min(99, round(ovr))))
    return {**r, "ovr": ovr, "history": hist}


# ================================================================== პლეი-ოფის შანსები
def playoff_odds(season, sims=10000, seed=7):
    """Monte Carlo: დარჩენილი რეგულარული სეზონი × sims. აბრუნებს [{name, tid, odds, seed_avg}, ...]"""
    import numpy as np
    rng = np.random.default_rng(seed)
    teams = [int(t) for t in season["teams"]]
    idx = {t: i for i, t in enumerate(teams)}
    played = done_games(season, include_playoffs=False)
    left = [g for g in season["games"] if g["win"] == "UNDECIDED" and not g["po"]]
    if not left:
        return []
    scores = {t: [] for t in teams}
    for g in played:
        scores[g["h"]].append(g["hs"])
        scores[g["a"]].append(g["as"])
    allsc = [x for v in scores.values() for x in v] or [100.0]
    gmu, gsd = float(np.mean(allsc)), float(np.std(allsc) or 1)
    mu = np.array([np.mean(scores[t]) * len(scores[t]) / (len(scores[t]) + 2) + gmu * 2 / (len(scores[t]) + 2)
                   if scores[t] else gmu for t in teams])
    sd = np.array([max(np.std(scores[t]), gsd * 0.6) if len(scores[t]) > 2 else gsd for t in teams])
    w0 = np.array([season["teams"][str(t)]["w"] + 0.5 * season["teams"][str(t)]["t"] for t in teams], float)
    pf0 = np.array([season["teams"][str(t)]["pf"] for t in teams], float)
    n = len(teams)
    wins = np.tile(w0, (sims, 1))
    pf = np.tile(pf0, (sims, 1))
    for g in left:
        h, a = idx[g["h"]], idx[g["a"]]
        hs = rng.normal(mu[h], sd[h], sims)
        as_ = rng.normal(mu[a], sd[a], sims)
        wins[:, h] += hs > as_
        wins[:, a] += as_ > hs
        pf[:, h] += hs
        pf[:, a] += as_
    key = wins * 1e7 + pf                      # ჯერ მოგებები, მერე ქულები
    order = np.argsort(-key, axis=1)
    k = season["playoff_teams"] or 4
    made = np.zeros(n)
    first = np.zeros(n)
    for i in range(n):
        pos = np.argmax(order == i, axis=1)
        made[i] = np.mean(pos < k)
        first[i] = np.mean(pos == 0)
    out = [{"tid": t, "name": season["teams"][str(t)]["name"], "odds": float(made[idx[t]]),
            "top": float(first[idx[t]]), "rec": f"{season['teams'][str(t)]['w']}-{season['teams'][str(t)]['l']}"}
           for t in teams]
    return sorted(out, key=lambda x: (x["odds"], x["top"]), reverse=True)


# ================================================================== Wrapped
def wrapped(seasons, owner, year):
    s = seasons.get(year)
    if not s:
        return None
    tid = next((int(k) for k, t in s["teams"].items() if t["owner"] == owner), None)
    if tid is None:
        return None
    t = s["teams"][str(tid)]
    mine = []
    vs = {}
    for g in done_games(s):
        if tid not in (g["h"], g["a"]):
            continue
        me_h = g["h"] == tid
        ms_, ts = (g["hs"], g["as"]) if me_h else (g["as"], g["hs"])
        opp = g["a"] if me_h else g["h"]
        if not g["multi"]:
            mine.append((ms_, g["p"], opp, ts))
        r = vs.setdefault(opp, [0, 0])
        if ms_ > ts:
            r[0] += 1
        elif ms_ < ts:
            r[1] += 1
    if not mine:
        return None
    best = max(mine)
    worst = min(mine)
    name = lambda o: s["teams"][str(o)]["name"]
    nemesis = max(vs.items(), key=lambda kv: (kv[1][1], -kv[1][0]))
    victim = max(vs.items(), key=lambda kv: (kv[1][0], -kv[1][1]))
    lk = next((x for x in luck(s) if x["tid"] == tid), None)
    picks = [d for d in (s.get("draft") or []) if d["team"] == tid]
    top_pick = max(picks, key=lambda d: d["total"]) if picks else None
    steal = max(picks, key=lambda d: d["n"] - d["rank"]) if picks else None
    order = sorted(s["teams"].values(), key=lambda x: (x["final"] or 99, x["seed"]))
    rank = next(i for i, x in enumerate(order, 1) if x is t)
    pf_rank = sorted((x["pf"] for x in s["teams"].values()), reverse=True).index(t["pf"]) + 1
    return {
        "year": year, "team": t["name"], "rec": f"{t['w']}-{t['l']}", "rank": rank, "n": len(order),
        "champion": t["final"] == 1 and s["complete"], "pf": t["pf"], "pf_rank": pf_rank,
        "best": (best[0], best[1], name(best[2])), "worst": (worst[0], worst[1], name(worst[2])),
        "nemesis": (name(nemesis[0]), *nemesis[1]) if nemesis[1][1] else None,
        "victim": (name(victim[0]), *victim[1]) if victim[1][0] else None,
        "luck": lk["luck"] if lk else 0.0, "acq": t["acq"], "trades": t["trades"],
        "top_pick": top_pick, "steal": steal if steal and steal["n"] - steal["rank"] > 0 else None,
    }
