# -*- coding: utf-8 -*-
"""ლიგის პარამეტრები ESPN-იდან: ქულების სისტემა, როსტერი, ტრეიდები, პლეი-ოფი."""
from espn_api.basketball.constant import POSITION_MAP, STATS_MAP

# სტატისტიკის ქართული სახელები
STAT_KA = {
    "PTS": "ქულა", "BLK": "ბლოკი", "STL": "ჩაჭრა", "AST": "საგოლე პასი", "OREB": "შეტევითი მოხსნა",
    "DREB": "დაცვითი მოხსნა", "REB": "მოხსნა", "EJ": "თამაშიდან გაძევება", "FF": "უხეში ფოლი (flagrant)",
    "PF": "პერსონალური ფოლი", "TF": "ტექნიკური ფოლი", "TO": "დანაკარგი", "DQ": "დისკვალიფიკაცია",
    "FGM": "ჩაგდებული სროლა (FG)", "FGA": "სროლის მცდელობა (FG)", "FTM": "ჩაგდებული ჯარიმა",
    "FTA": "ჯარიმის მცდელობა", "3PM": "ჩაგდებული სამიანი", "3PA": "სამიანის მცდელობა",
    "DD": "Double-double", "TD": "Triple-double", "QD": "Quadruple-double", "MIN": "წუთი", "GS": "სტარტში გამოსვლა",
}


def _examples(pts):
    """რამდენი ქულა იწერება ტიპურ მოქმედებაზე (ESPN ერთდროულად ითვლის რამდენიმე სტატს)."""
    p = lambda k: pts.get(k, 0.0)
    ex = [
        ("ჩაგდებული სამქულიანი", 3 * p("PTS") + p("3PM") + p("3PA") + p("FGM") + p("FGA")),
        ("აცდენილი სამქულიანი", p("3PA") + p("FGA")),
        ("ჩაგდებული ორქულიანი", 2 * p("PTS") + p("FGM") + p("FGA")),
        ("აცდენილი ორქულიანი", p("FGA")),
        ("ჩაგდებული ჯარიმა", p("PTS") + p("FTM") + p("FTA")),
        ("აცდენილი ჯარიმა", p("FTA")),
        ("შეტევითი მოხსნა", p("REB") + p("OREB")),
        ("დაცვითი მოხსნა", p("REB") + p("DREB")),
        ("საგოლე პასი", p("AST")),
        ("ჩაჭრა", p("STL")),
        ("ბლოკი", p("BLK")),
        ("დანაკარგი", p("TO")),
    ]
    return [{"label": l, "points": round(v, 2)} for l, v in ex if v]


def build(league):
    raw = league.espn_request.league_get(params={"view": ["mSettings"]})
    st = raw.get("settings", {})
    items = st.get("scoringSettings", {}).get("scoringItems", [])
    scoring, pts = [], {}
    for it in items:
        abbr = STATS_MAP.get(str(it.get("statId")), str(it.get("statId")))
        v = float(it.get("points", 0))
        pts[abbr] = v
        scoring.append({"abbr": abbr, "label": STAT_KA.get(abbr, abbr), "points": v})
    scoring.sort(key=lambda x: (-x["points"] if x["points"] > 0 else 1000 - x["points"]))

    slots = st.get("rosterSettings", {}).get("lineupSlotCounts", {})
    roster = [{"slot": POSITION_MAP.get(int(k), k), "count": v} for k, v in slots.items() if v]
    order = ["PG", "SG", "SF", "PF", "C", "G", "F", "UT", "BE", "IR"]
    roster.sort(key=lambda r: order.index(r["slot"]) if r["slot"] in order else 99)

    sched = st.get("scheduleSettings", {})
    trade = st.get("tradeSettings", {})
    acq = st.get("acquisitionSettings", {})
    draft = st.get("draftSettings", {})
    return {
        "scoring_type": st.get("scoringSettings", {}).get("scoringType"),
        "scoring": scoring,
        "examples": _examples(pts),
        "roster": roster,
        "teams": len(league.teams),
        "regular_season_weeks": sched.get("matchupPeriodCount"),
        "playoff_teams": sched.get("playoffTeamCount"),
        "playoff_round_weeks": sched.get("playoffMatchupPeriodLength"),
        "trade_deadline": trade.get("deadlineDate"),
        "veto_votes": trade.get("vetoVotesRequired"),
        "waiver_hours": acq.get("waiverHours"),
        "acquisition_limit": acq.get("acquisitionLimit"),
        "acquisition_type": acq.get("acquisitionType"),
        "draft_type": draft.get("type"),
        "pick_seconds": draft.get("timePerSelection"),
    }
