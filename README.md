# Wolt Channel Fantasy — საიტი

React + TypeScript (Vite) ფრონტი და Python API (Vercel Functions), რომელიც მონაცემებს ESPN-იდან ავტომატურად იღებს.

## ლოკალურად გაშვება

```bash
npm install
pip install -r requirements.txt
npm run dev
```

`npm run dev` ორივეს უშვებს: API — `localhost:3001`, საიტი — `localhost:5173`.
საჭიროა `.env` ფაილი (git-ში არ იტვირთება):

```
LEAGUE_ID=543766853
ESPN_S2=...
SWID={...}
ADMIN_PASSWORD=...
```

## Vercel — გარემოს ცვლადები

Settings → Environment Variables:

| ცვლადი | რისთვის |
|---|---|
| `LEAGUE_ID`, `ESPN_S2`, `SWID` | ESPN ლიგაზე წვდომა |
| `ADMIN_PASSWORD` | კომისრის პაროლი `/announcements` გვერდისთვის |

## განცხადებების შენახვა (Upstash Redis)

1. Vercel → პროექტი → **Storage** → **Create Database** → **Upstash for Redis** (Free).
2. **Connect to Project** — ავტომატურად დაემატება `KV_REST_API_URL` და `KV_REST_API_TOKEN`.
3. **Redeploy**.

შემდეგ `/announcements` → „კომისარი“ → პაროლი (`ADMIN_PASSWORD`) → წერ, ამაგრებ, შლი.
ლოკალურად განცხადებები ინახება `api/_lib/announcements.local.json`-ში.

## გვერდები

მთავარი · Live · განცხადებები · სიახლეები · მენეჯერები · ცხრილი · ტრეიდები · წესები · ისტორია · რეკორდები · სეზონები · H2H

> წინა სეზონების ტრეიდებზე ESPN მხოლოდ რაოდენობას აბრუნებს (დეტალებს — არა), ამიტომ არქივში გუნდების მიხედვით რაოდენობა ჩანს.
> მიმდინარე სეზონის ტრეიდები სრულად ჩანს.
