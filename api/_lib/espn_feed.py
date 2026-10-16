# -*- coding: utf-8 -*-
"""ESPN Fantasy Basketball — კავშირი. პარამეტრები გარემოს ცვლადებიდან (Vercel → Settings → Environment Variables):
LEAGUE_ID (სავალდებულო), ESPN_S2 და SWID (პრივატული ლიგისთვის), SEASON_YEAR (არასავალდებულო)."""
import datetime
import os

from espn_api.basketball import League


def _default_year():
    # NBA-ს სეზონი ოქტომბერში იწყება: 2026 წლის ოქტომბერი = ESPN-ის „2027“ სეზონი
    now = datetime.date.today()
    return now.year + 1 if now.month >= 9 else now.year


def load_config():
    return {
        "league_id": os.environ.get("LEAGUE_ID", "").strip(),
        "year": int(os.environ.get("SEASON_YEAR") or _default_year()),
        "espn_s2": os.environ.get("ESPN_S2", "").strip(),
        "swid": os.environ.get("SWID", "").strip(),
    }


def connect(cfg, year=None):
    if not cfg.get("league_id"):
        raise RuntimeError("LEAGUE_ID გარემოს ცვლადი არ არის დაყენებული")
    kw = {}
    if cfg.get("espn_s2") and cfg.get("swid"):
        kw = {"espn_s2": cfg["espn_s2"], "swid": cfg["swid"]}
    return League(league_id=int(cfg["league_id"]), year=int(year or cfg["year"]), **kw)


def is_drafted(league):
    return bool(league.draft)
