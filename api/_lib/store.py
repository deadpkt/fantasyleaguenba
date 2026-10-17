# -*- coding: utf-8 -*-
"""განცხადებების შენახვა.
Vercel-ზე: Upstash Redis (Vercel → Storage → Upstash Redis → Connect) — გარემოს ცვლადები თვითონ ემატება
(KV_REST_API_URL / KV_REST_API_TOKEN ან UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
თუ Redis არ არის — იკითხება announcements.json (მხოლოდ წასაკითხად)."""
import json
import os
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
KEY = "wcf:announcements"
# ლოკალურად (npm run dev) Redis-ის ნაცვლად ეს ფაილი — GitHub-ზე არ იტვირთება
LOCAL_FILE = os.path.join(HERE, "announcements.local.json")


def _local():
    return bool(os.environ.get("WCF_LOCAL")) and not _cfg()[0]


def _cfg():
    url = os.environ.get("KV_REST_API_URL") or os.environ.get("UPSTASH_REDIS_REST_URL")
    token = os.environ.get("KV_REST_API_TOKEN") or os.environ.get("UPSTASH_REDIS_REST_TOKEN")
    return (url.rstrip("/"), token) if url and token else (None, None)


def enabled():
    return _cfg()[0] is not None or _local()


def _redis(*cmd):
    url, token = _cfg()
    req = urllib.request.Request(url, data=json.dumps(list(cmd)).encode(), method="POST",
                                 headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.load(r).get("result")


def _file_items():
    try:
        with open(os.path.join(HERE, "announcements.json"), encoding="utf-8") as f:
            return [a for a in json.load(f).get("items", []) if a.get("title")]
    except (OSError, ValueError):
        return []


def load():
    if _local():
        try:
            with open(LOCAL_FILE, encoding="utf-8") as f:
                return json.load(f)
        except (OSError, ValueError):
            return _file_items()
    if enabled():
        raw = _redis("GET", KEY)
        if raw:
            try:
                return json.loads(raw)
            except ValueError:
                return []
        return _file_items()
    return _file_items()


def save(items):
    if _local():
        with open(LOCAL_FILE, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        return
    if not enabled():
        raise RuntimeError("Redis არ არის დაკავშირებული (Vercel → Storage → Upstash Redis)")
    _redis("SET", KEY, json.dumps(items, ensure_ascii=False))


# ── რეაქციები (ემოჯიები განცხადებებზე) ──
# Redis: ერთი hash  "wcf:reactions"  →  ველი "<id>|<emoji>" = რაოდენობა
R_KEY = "wcf:reactions"
R_LOCAL = os.path.join(HERE, "reactions.local.json")


def _r_local_load():
    try:
        with open(R_LOCAL, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def reactions():
    """{id: {emoji: n}}"""
    if _local():
        flat = _r_local_load()
    elif enabled():
        raw = _redis("HGETALL", R_KEY) or []
        flat = dict(zip(raw[::2], raw[1::2]))
    else:
        return {}
    out = {}
    for field, n in flat.items():
        aid, _, emoji = field.partition("|")
        n = int(n)
        if n > 0:
            out.setdefault(aid, {})[emoji] = n
    return out


def react(aid, emoji, delta):
    field = f"{aid}|{emoji}"
    if _local():
        flat = _r_local_load()
        flat[field] = max(0, int(flat.get(field, 0)) + delta)
        with open(R_LOCAL, "w", encoding="utf-8") as f:
            json.dump(flat, f, ensure_ascii=False)
        return flat[field]
    if not enabled():
        raise RuntimeError("Redis არ არის დაკავშირებული")
    n = int(_redis("HINCRBY", R_KEY, field, delta))
    if n < 0:
        _redis("HSET", R_KEY, field, 0)
        n = 0
    return n


def drop_reactions(aid):
    """წაშლილი განცხადების რეაქციების გასუფთავება."""
    if _local():
        flat = {k: v for k, v in _r_local_load().items() if not k.startswith(aid + "|")}
        with open(R_LOCAL, "w", encoding="utf-8") as f:
            json.dump(flat, f, ensure_ascii=False)
    elif enabled():
        fields = [f for f in (_redis("HKEYS", R_KEY) or []) if f.startswith(aid + "|")]
        if fields:
            _redis("HDEL", R_KEY, *fields)
