# -*- coding: utf-8 -*-
"""სიახლეები: NBA სტატიები, მოთამაშეების ფანტაზი-სიახლეები, ტრავმები, ლიგის განცხადებები."""
import datetime
import json
import os
import urllib.request
from concurrent.futures import ThreadPoolExecutor

import espn_feed as ef

HERE = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "Mozilla/5.0"}
NBA_NEWS = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=30"
INJURIES = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries"
PLAYER_NEWS = "https://site.api.espn.com/apis/fantasy/v2/games/fba/news/players?playerId={pid}&limit=3"


def _get(url, timeout=12):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        return json.load(r)


def nba_news():
    out = []
    for a in _get(NBA_NEWS).get("articles", []):
        img = next((i.get("url") for i in a.get("images", []) if i.get("url")), None)
        out.append({
            "headline": a.get("headline"), "description": a.get("description"), "published": a.get("published"),
            "image": img, "link": (a.get("links", {}).get("web", {}) or {}).get("href"), "type": a.get("type"),
        })
    return out


def _player_news(pid):
    try:
        feed = _get(PLAYER_NEWS.format(pid=pid), timeout=8).get("feed", [])
    except Exception:
        return []
    return [{"pid": pid, "headline": n.get("headline"), "story": n.get("story") or n.get("description"),
             "published": n.get("published"), "source": n.get("type")} for n in feed]


def fantasy_news(league, archive):
    """ლიგისთვის მნიშვნელოვანი მოთამაშეები: როსტერებში მყოფები, დრაფტამდე — შარშანდელი ტოპ პიკები."""
    owners, names = {}, {}
    for t in league.teams:
        for p in t.roster:
            owners[p.playerId] = " ".join(t.team_name.split())
            names[p.playerId] = p.name
    pids = list(owners)
    if not pids:
        last = max((int(y) for y, s in archive.items() if s.get("draft")), default=None)
        if last:
            top = sorted(archive[str(last)]["draft"], key=lambda d: d.get("total", 0), reverse=True)[:40]
            pids = [d["pid"] for d in top]
            names.update({d["pid"]: d["player"] for d in top})
    pids = pids[:90]
    with ThreadPoolExecutor(max_workers=12) as ex:
        items = [n for chunk in ex.map(_player_news, pids) for n in chunk]
    seen, out = set(), []
    for n in sorted(items, key=lambda n: n.get("published") or "", reverse=True):
        key = (n["pid"], n["headline"])
        if key in seen or not n["headline"]:
            continue
        seen.add(key)
        n["player"] = names.get(n["pid"])
        n["owner"] = owners.get(n["pid"])
        out.append(n)
    return out[:60]


def injuries(league):
    owners = {}
    for t in league.teams:
        for p in t.roster:
            owners[p.name] = " ".join(t.team_name.split())
    out = []
    for team in _get(INJURIES).get("injuries", []):
        for i in team.get("injuries", []):
            ath = i.get("athlete", {})
            name = ath.get("displayName")
            href = next((l.get("href") for l in ath.get("links", []) if l.get("href")), "") or ""
            pid = None
            if "/id/" in href:
                try:
                    pid = int(href.split("/id/")[1].split("/")[0])
                except ValueError:
                    pid = None
            out.append({"player": name, "pid": pid, "team": team.get("displayName"), "status": i.get("status"),
                        "comment": i.get("shortComment"), "date": i.get("date"), "owner": owners.get(name)})
    out.sort(key=lambda x: x.get("date") or "", reverse=True)  # უახლესი ზემოთ
    out.sort(key=lambda x: x["owner"] is None)  # ლიგის მოთამაშეები პირველ რიგში
    return out


def auto_announcements(league):
    """ავტომატური განცხადებები ESPN-ის პარამეტრებიდან."""
    items = []
    try:
        raw = league.espn_request.league_get(params={"view": ["mSettings"]})
        st = raw.get("settings", {})
        tz = datetime.timezone(datetime.timedelta(hours=4))
        d = st.get("draftSettings", {}).get("date")
        if d and not ef.is_drafted(league):
            when = datetime.datetime.fromtimestamp(d / 1000, tz)
            items.append({"id": "auto-draft", "date": datetime.date.today().isoformat(), "title": "დრაფტის თარიღი",
                          "text": f"დრაფტი {when:%d.%m} · {when:%H:%M} თბილისის დროით. "
                                  f"ფორმატი: {st['draftSettings'].get('type', '').title()}, "
                                  f"{st['draftSettings'].get('timePerSelection', '?')} წამი პიკზე.",
                          "pinned": False, "auto": True})
        dl = st.get("tradeSettings", {}).get("deadlineDate")
        if dl:
            when = datetime.datetime.fromtimestamp(dl / 1000, tz)
            items.append({"id": "auto-deadline", "date": datetime.date.today().isoformat(), "title": "ტრეიდების დედლაინი",
                          "text": f"ტრეიდები იკეტება {when:%d.%m.%Y}-ს.", "pinned": False, "auto": True})
    except Exception:
        pass
    return items


def announcements(league):
    """კომისრის (საცავიდან) + ავტომატური."""
    import store
    try:
        items = [{**a, "auto": False} for a in store.load()]
    except Exception:
        items = []
    pinned = [a for a in items if a.get("pinned")]
    rest = sorted([a for a in items if not a.get("pinned")], key=lambda a: a.get("created") or a.get("date") or "", reverse=True)
    return pinned + rest + auto_announcements(league)


def build():
    cfg = ef.load_config()
    league = ef.connect(cfg)
    try:
        with open(os.path.join(HERE, "archive.json"), encoding="utf-8") as f:
            archive = json.load(f)
    except (OSError, ValueError):
        archive = {}
    out = {"updated": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    for key, fn in (("announcements", lambda: announcements(league)), ("nba", nba_news),
                    ("fantasy", lambda: fantasy_news(league, archive)), ("injuries", lambda: injuries(league))):
        try:
            out[key] = fn()
        except Exception as e:  # ერთი წყაროს ჩავარდნა დანარჩენს არ აფუჭებს
            out[key] = []
            out.setdefault("errors", {})[key] = str(e)
    return out
