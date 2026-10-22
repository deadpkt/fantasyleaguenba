# -*- coding: utf-8 -*-
"""მოთამაშეებზე დაფუძნებული პროგნოზი: ვინ რამდენ ქულას მოიტანს კვირის ბოლომდე და მომავალ კვირებში.

ლოგიკა (როგორც რეალურ daily-lineup ლიგაში):
  * მოთამაშის ქულა თამაშზე = ფაქტობრივი საშუალო + ESPN-ის პროგნოზი (სეზონის დასაწყისში პროგნოზს მეტი წონა აქვს);
  * ტრავმა ამცირებს შანსს, რომ ითამაშებს (OUT, IR, DAY_TO_DAY…);
  * ყოველ დღეს გუნდი ათამაშებს 10 საუკეთესოს (აქტიური სლოტები) იმათგან, ვისაც იმ დღეს თამაში აქვს;
  * მიმდინარე კვირაში უკვე დაგროვილ ქულას ემატება დარჩენილი დღეების პროგნოზი.
"""
import math

import pickem_core

BENCH = {"BE", "IR"}
# რამდენ თამაშს "ენდობა" ESPN-ის პროგნოზი ფაქტობრივ საშუალოსთან შედარებით
PRIOR_GAMES = 6
# ერთი მოთამაშის ერთი თამაშის გაბნევა (ქულის ფარდობითი სტანდარტული გადახრა)
GAME_SD = 0.38


def _gp(p):
    """ამ სეზონში ნათამაშები თამაშები (ESPN-ის "<წელი>_total" ჩანაწერიდან)."""
    for k, v in (getattr(p, "stats", {}) or {}).items():
        if str(k).endswith("_total") and isinstance(v, dict):
            return float(((v.get("total") or {}).get("GP")) or 0)
    return 0.0


def per_game(p):
    """მოსალოდნელი ფანტაზი-ქულა ერთ თამაშზე."""
    avg = float(getattr(p, "avg_points", 0) or 0)
    proj = float(getattr(p, "projected_avg_points", 0) or 0)
    gp = _gp(p)
    if proj <= 0:
        return avg
    if avg <= 0 or gp <= 0:
        return proj
    return (gp * avg + PRIOR_GAMES * proj) / (gp + PRIOR_GAMES)


def availability(status, weeks_ahead):
    """შანსი, რომ ითამაშებს (0–1). weeks_ahead: 0 = ეს კვირა, 1 = შემდეგი…"""
    s = (status or "").upper()
    if not s or s in ("ACTIVE", "NORMAL"):
        return 1.0
    table = {
        "INJURY_RESERVE": (0.0, 0.35, 0.8),
        "OUT": (0.2, 0.7, 0.95),
        "SUSPENSION": (0.0, 0.8, 1.0),
        "DOUBTFUL": (0.35, 0.95, 1.0),
        "QUESTIONABLE": (0.7, 1.0, 1.0),
        "DAY_TO_DAY": (0.8, 1.0, 1.0),
    }
    row = next((v for k, v in table.items() if k in s), (0.85, 1.0, 1.0))
    return row[min(weeks_ahead, 2)]


def team_days(league):
    """NBA გუნდის აბრევიატურა → თამაშის დღეები (ESPN scoringPeriodId-ები), ლიგის კალენდრიდან."""
    try:
        from espn_api.basketball.constant import PRO_TEAM_MAP
    except ImportError:
        return {}
    out = {}
    for pro_id, days in (getattr(league, "pro_schedule", None) or {}).items():
        abbr = PRO_TEAM_MAP.get(pro_id)
        if abbr:
            out[abbr] = {int(sp) for sp in days if str(sp).isdigit()}
    return out


def game_days(p, by_team=None):
    """მოთამაშის თამაშის დღეები. თავისუფალ აგენტებს ESPN კალენდარს არ აძლევს — მაშინ გუნდის კალენდარი."""
    out = set()
    for sp in (getattr(p, "schedule", {}) or {}):
        try:
            out.add(int(sp))
        except (TypeError, ValueError):
            pass
    if not out and by_team:
        out = set(by_team.get(getattr(p, "proTeam", None), set()))
    return out


def _week_of(sp):
    return 1 if sp <= 6 else (sp - 7) // 7 + 2


def project_days(players, days, slots, weeks_ahead_of, played_today=None, today=None):
    """players: [(pid, per_game, status, days_set)]. აბრუნებს (ჯამი, ვარიაცია, თამაშები_მოთამაშეზე)."""
    total = var = 0.0
    games = {}
    for sp in days:
        cand = []
        for pid, pg, status, gdays in players:
            if sp not in gdays:
                continue
            if today is not None and sp == today and played_today and played_today.get(pid):
                continue  # დღევანდელი თამაში უკვე ჩათვლილია ქულაში
            a = availability(status, weeks_ahead_of(sp))
            if a <= 0 or pg <= 0:
                continue
            cand.append((pg * a, pg, a, pid))
        cand.sort(reverse=True)
        for exp, pg, a, pid in cand[:slots]:
            total += exp
            # გაბნევა: თამაშის ქულის გაბნევა + ითამაშებს თუ არა
            var += a * (GAME_SD * pg) ** 2 + a * (1 - a) * pg ** 2
            games[pid] = games.get(pid, 0) + 1
    return total, var, games


def active_slots(settings):
    roster = (settings or {}).get("roster") or []
    n = sum(r.get("count", 0) for r in roster if r.get("slot") not in BENCH)
    return n or 10


def build(league, settings, live_scores=None, played_today=None):
    """live_scores: {team_id: ამ კვირაში დაგროვილი ქულა}. played_today: {pid: True} — დღეს უკვე ითამაშა.

    აბრუნებს:
      teams[team_id] = {"so_far", "remaining", "final", "sd", "games_left", "weeks": {კვირა: [საშუალო, sd]}}
      players[pid]   = {"per_game", "week_games", "week_left", "ros_games", "week_expected"}
    """
    slots = active_slots(settings)
    week = league.currentMatchupPeriod
    today = max(1, int(getattr(league, "scoringPeriodId", 0) or 1))
    reg = league.settings.reg_season_count or 19
    live_scores = live_scores or {}
    played_today = played_today or {}

    def weeks_ahead_of(sp):
        return max(0, _week_of(sp) - week)

    teams, players = {}, {}
    for t in league.teams:
        roster = [(p.playerId, per_game(p), getattr(p, "injuryStatus", None), game_days(p)) for p in (t.roster or [])]
        lo, hi = pickem_core.bounds(week)
        left_days = [sp for sp in range(max(lo, today), hi + 1)]
        rem, rem_var, games_left = project_days(roster, left_days, slots, weeks_ahead_of, played_today, today)
        so_far = float(live_scores.get(t.team_id, 0) or 0)
        weeks = {}
        for w in range(week, reg + 1):
            a, b = pickem_core.bounds(w)
            mean, var, _ = project_days(roster, range(a, b + 1), slots, weeks_ahead_of)
            # მოდელის საკუთარი ცდომილება (ტრეიდები, ტრავმები, ფორმა) დროსთან ერთად იზრდება
            model = 0.05 + 0.01 * min(w - week, 8)
            weeks[w] = [round(mean), round(math.sqrt(var + (model * mean) ** 2))]
        teams[t.team_id] = {
            "name": " ".join(t.team_name.split()),
            "so_far": round(so_far, 1),
            "remaining": round(rem, 1),
            "final": round(so_far + rem, 1),
            "sd": round(math.sqrt(rem_var), 1),
            "games_left": sum(games_left.values()),
            "weeks": weeks,
        }
        lo, hi = pickem_core.bounds(week)
        for pid, pg, status, gdays in roster:
            week_days = [d for d in gdays if lo <= d <= hi]
            players[pid] = {
                "per_game": round(pg, 1),
                "week_games": len(week_days),
                "week_left": games_left.get(pid, 0),
                "ros_games": len([d for d in gdays if d >= today]),
                "week_expected": round(sum(pg * availability(status, 0) for d in week_days if d >= today and not (d == today and played_today.get(pid))), 1),
            }
    return {"week": week, "today": today, "slots": slots, "teams": teams, "players": players}


def win_prob(a, b):
    """a, b: teams[...] — მატჩის მოგების შანსი a-სთვის."""
    sd = math.sqrt((a.get("sd") or 0) ** 2 + (b.get("sd") or 0) ** 2)
    diff = (a.get("final") or 0) - (b.get("final") or 0)
    if sd < 1:
        return 1.0 if diff > 0 else 0.0 if diff < 0 else 0.5
    return 0.5 * (1 + math.erf(diff / (sd * math.sqrt(2))))
