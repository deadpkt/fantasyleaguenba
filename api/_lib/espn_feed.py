# -*- coding: utf-8 -*-
"""ESPN Fantasy Basketball — კავშირი. პარამეტრები გარემოს ცვლადებიდან (Vercel → Settings → Environment Variables):
LEAGUE_ID (სავალდებულო), ESPN_S2 და SWID (პრივატული ლიგისთვის), SEASON_YEAR (არასავალდებულო)."""
import datetime
import os
from urllib.parse import quote

from espn_api.basketball import League


def _default_year():
    # NBA-ს სეზონი ოქტომბერში იწყება: 2026 წლის ოქტომბერი = ESPN-ის „2027“ სეზონი
    now = datetime.date.today()
    return now.year + 1 if now.month >= 9 else now.year


def _env(name):
    """ჰარები და ზედმეტი ბრჭყალები კოპირებისას ხშირად ერევა — ვაშორებთ."""
    return os.environ.get(name, "").strip().strip('"').strip("'").strip()


def _fix_s2(s2):
    # ESPN_S2 cookie URL-კოდირებულია (%2B, %2F…). თუ გაშიფრული ჩაიწერა (+, /, =), ვაბრუნებთ კოდირებულს.
    if s2 and "%" not in s2 and any(c in s2 for c in "+/="):
        return quote(s2, safe="")
    return s2


def _fix_swid(swid):
    # SWID ფიგურულ ფრჩხილებშია: {XXXXXXXX-XXXX-...}
    if swid and not swid.startswith("{"):
        swid = "{" + swid.strip("{}") + "}"
    return swid


def load_config():
    return {
        "league_id": _env("LEAGUE_ID"),
        "year": int(_env("SEASON_YEAR") or _default_year()),
        "espn_s2": _fix_s2(_env("ESPN_S2")),
        "swid": _fix_swid(_env("SWID")),
    }


def connect(cfg, year=None):
    if not cfg.get("league_id"):
        raise RuntimeError("LEAGUE_ID გარემოს ცვლადი არ არის დაყენებული")
    if not (cfg.get("espn_s2") and cfg.get("swid")):
        raise RuntimeError("ESPN_S2 ან SWID გარემოს ცვლადი ცარიელია (პრივატულ ლიგას ორივე სჭირდება)")
    try:
        return League(league_id=int(cfg["league_id"]), year=int(year or cfg["year"]),
                      espn_s2=cfg["espn_s2"], swid=cfg["swid"])
    except Exception as e:
        if "credentials" in str(e).lower() or "401" in str(e):
            raise RuntimeError(
                f"ESPN-მა შესვლის მონაცემები არ მიიღო. შეამოწმე Vercel-ში: ESPN_S2 ({len(cfg['espn_s2'])} სიმბოლო, "
                f"უნდა იყოს ~340 და შეიცავდეს %-ს) და SWID ({len(cfg['swid'])} სიმბოლო, უნდა იყოს 38, {{...}}-ში). "
                "ბრჭყალების გარეშე ჩაწერე, მერე Redeploy.") from e
        raise


def is_drafted(league):
    return bool(league.draft)
