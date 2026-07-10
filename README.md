# KhaiKhai Fund

A small fullstack web app to track a shared team fund. Record **donations**
(money in) and **expenses** (money out), and see a live balance, totals, and a
full transaction ledger. Works in any browser — including phones, where it can
be **installed to the home screen** like an app (PWA).

## Stack
- **Backend:** Python + Flask
- **Database:** Postgres in production (durable), SQLite locally — chosen
  automatically based on the `DATABASE_URL` env var
- **Frontend:** plain HTML / CSS / JavaScript (no build step)
- **Prod server:** gunicorn

---

## Run locally
```bash
cd khaikhai-fund
pip install -r requirements.txt
python app.py
```
With no `DATABASE_URL` set, it uses a local SQLite file (`fund.db`). Open
http://127.0.0.1:5000 (also reachable from a phone on the same Wi-Fi at
`http://YOUR-PC-IP:5000`). On Windows you can just double-click
`start_server.bat`.

---

## Deploy to a public URL with durable data (Render)

Everything is preconfigured. The `render.yaml` blueprint provisions a **free
Postgres database** and a web service, and injects the DB connection string
into the app as `DATABASE_URL` — so your fund data survives restarts and
redeploys.

### 1. Put the code on GitHub
```bash
cd khaikhai-fund
git init
git add .
git commit -m "KhaiKhai Fund"
git branch -M main
git remote add origin https://github.com/<you>/khaikhai-fund.git
git push -u origin main
```

### 2. Create the services on Render
1. Go to https://render.com and sign in with GitHub.
2. **New ➜ Blueprint**, pick the `khaikhai-fund` repo. Render reads
   `render.yaml`, creates the Postgres database + web service, and links them.
3. Click **Apply**. In ~1–2 minutes you get a URL like
   `https://khaikhai-fund.onrender.com`. The table is created automatically on
   first boot.

### 3. Install on your phone (optional)
Open the URL in the phone browser ➜ **Share / menu ➜ Add to Home Screen**.
It launches full-screen with the ₹ icon, like a native app.

> **Notes on Render's free tier:** the free Postgres instance is time-limited
> (Render expires free databases after ~30 days — you'll get an email; back up
> or upgrade before then). The free web service also sleeps after inactivity,
> so the first request after a nap takes a few seconds to wake up. Upgrading
> either to a paid plan removes these limits.

### Other hosts
The same `Procfile` works on **Railway**, **Fly.io**, and **Heroku**. Any host
that runs `gunicorn app:app` and provides a `DATABASE_URL` will serve it with
Postgres; without one it falls back to SQLite.

---

## Features
- Live **balance**, **total collected**, **total spent**.
- Ledger sorted newest-first, filter by All / Donations / Expenses, per-row delete.
- **Export to Excel** (`/api/export`) — summary block on top, columns
  Date / Type / Name-Item / Note / Amount.
- Installable **PWA** (manifest + service worker + icons).

## API
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/transactions` | List all transactions + summary |
| GET | `/api/summary` | Balance / collected / spent |
| POST | `/api/transactions` | Add an entry (JSON body) |
| DELETE | `/api/transactions/<id>` | Remove an entry |
| GET | `/api/export` | Download the ledger as `.xlsx` |

## Config (env vars)
| Var | Default | Meaning |
|-----|---------|---------|
| `DATABASE_URL` | *(unset)* | Postgres connection string. If set, uses Postgres; otherwise SQLite. Render sets this for you. |
| `KHAIKHAI_DB` | `fund.db` | SQLite file path (local fallback only) |
| `PORT` | `5000` | Port (Render sets this automatically) |
| `HOST` | `0.0.0.0` | Bind address (local dev only) |
