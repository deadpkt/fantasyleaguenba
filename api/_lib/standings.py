# -*- coding: utf-8 -*-
"""ESPN-ის Standings გვერდის მონაცემები: ცხრილი (W-L-T, PCT, GB, PF, PA, სერია, ტრანზაქციები),
გუნდების სეზონის სტატისტიკა (ჯამები) და ტრეიდის ბლოკი. ერთი მოთხოვნა mTeam ხედით."""

STATS = ("PTS", "REB", "AST", "STL", "BLK", "3PM", "TO", "FGM", "FTM", "OREB", "3PA", "DD", "TD")
CLINCH = {"CLINCHED_PLAYOFFS": "x", "CLINCHED_DIVISION": "y", "CLINCHED_FIRST_ROUND_BYE": "z", "ELIMINATED": "e"}


def build(league):
    try:
        from espn_api.basketball.constant import STATS_MAP
        raw = league.espn_request.league_get(params={"view": ["mTeam", "mStandings"]})
    except Exception:
        return []
    out = []
    for t in raw.get("teams", []):
        o = (t.get("record") or {}).get("overall") or {}
        vals = {STATS_MAP.get(k, k): v for k, v in (t.get("valuesByStat") or {}).items()}
        tc = t.get("transactionCounter") or {}
        # ტრეიდის ბლოკი: ON_THE_BLOCK = გასაყიდად, UNTOUCHABLE = ხელშეუხებელი
        block = ((t.get("tradeBlock") or {}).get("players")) or {}
        streak = o.get("streakType") or "NONE"
        out.append({
            "tid": t.get("id"),
            "name": " ".join((t.get("name") or "").split()),
            "abbrev": t.get("abbrev"),
            "seed": t.get("playoffSeed") or 0,
            "w": o.get("wins", 0), "l": o.get("losses", 0), "t": o.get("ties", 0),
            "pct": round(o.get("percentage", 0) or 0, 3),
            "gb": o.get("gamesBack", 0) or 0,
            "pf": round(o.get("pointsFor", 0) or 0, 1),
            "pa": round(o.get("pointsAgainst", 0) or 0, 1),
            "streak": f"{'W' if streak == 'WIN' else 'L' if streak == 'LOSS' else 'T'}{o.get('streakLength')}" if streak != "NONE" and o.get("streakLength") else "-",
            "clinch": CLINCH.get(t.get("playoffClinchType") or "", ""),
            "acq": tc.get("acquisitions", 0), "drops": tc.get("drops", 0), "trades": tc.get("trades", 0),
            "moves": tc.get("moveToActive", 0),
            "proj_rank": t.get("currentProjectedRank") or None,
            "stats": {k: round(float(vals.get(k, 0) or 0)) for k in STATS},
            "on_block": [int(pid) for pid, st in block.items() if st == "ON_THE_BLOCK"],
            "untouchable": [int(pid) for pid, st in block.items() if st == "UNTOUCHABLE"],
        })
    out.sort(key=lambda r: (r["seed"] or 99, -r["pct"], -r["pf"]))
    return out
