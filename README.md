# FraudGuard — FinTech Fraud Detection

Upload a transaction CSV and get instant fraud detection results: risk
scoring, model metrics, and pattern breakdowns by category, device, payment
method, and time of day.

## Live Demo

`https://<your-frontend>.vercel.app` — replace with your deployed link before submission (see D1 in the deliverables guide).

## Tech Stack

**Frontend:** React 18 · Tailwind CSS · Framer Motion · Recharts · Vite
**Backend:** FastAPI · pandas · scikit-learn (RandomForest with class weighting)
**Deploy:** Frontend → Vercel/Netlify · Backend → Render

## Project Structure

```
.
├── backend/          FastAPI service — upload, pipeline, results API
│   ├── main.py        API routes
│   ├── pipeline.py     cleaning → features → rules → ML → classification
│   └── sample_transactions.csv   demo dataset loaded on startup
└── frontend/         React dashboard
    └── src/
        ├── App.jsx              state + data flow
        ├── components/          Hero, UploadDock, KpiRow, charts, ledger
        └── lib/                 api.js (backend client), demoData.js (offline fallback)
```

## How to run locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 5000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
The dev server proxies `/api/*` to `http://localhost:5000` automatically —
no `.env` needed for local development.

## How to deploy

**Backend → Render**
1. New Web Service → point at `backend/` → `uvicorn main:app --host 0.0.0.0 --port $PORT`
2. Set `FRONTEND_URL` env var to your deployed frontend URL (comma-separate multiple origins).

**Frontend → Vercel or Netlify**
1. Import the repo, set the project root to `frontend/`.
2. Add env var `VITE_API_URL` = your Render backend URL (e.g. `https://fraudguard-api.onrender.com`).
3. Build command `npm run build`, output directory `dist` (both `vercel.json` and `netlify.toml` are already configured).

## API Contract

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/upload` | Upload a CSV, returns `session_id` |
| `POST` | `/api/analyze?session_id=` | Runs the pipeline, returns summary metrics |
| `GET`  | `/api/results?session_id=` | Full results incl. flagged transactions |
| `GET`  | `/api/stats` / `/api/transactions` | Demo dataset convenience endpoints |

## Team

_Add your team names here._

## Other deliverables

This repo covers **D1 (deployed dashboard)** and **D2 (source code)**. The
hackathon also requires D3 (AI prompt documentation), D4 (architecture
diagram), D5 (one-page technical summary), and D6 (slides) — see
`deliverables.pdf` for the exact format expected for each.
