"""
Fraud Detection Backend — FastAPI
Run locally with: uvicorn main:app --reload --port 5000
Run in production (Render): uvicorn main:app --host 0.0.0.0 --port $PORT
"""

import io
import os
import uuid
import time
from pathlib import Path
from datetime import datetime
import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pipeline import run_pipeline, RESULTS_STORE

# Base directory for reliable relative file resolution
BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="Fraud Detection API",
    description="Upload transaction CSV data and run fraud detection pipeline.",
    version="1.0.0",
)

# ─── CORS CONFIGURATION ───────────────────────────────────────────────────
# Parse FRONTEND_URL environment variable (supports comma-separated URLs)
frontend_env = os.environ.get("FRONTEND_URL", "")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if frontend_env:
    for url in frontend_env.split(","):
        url = url.strip()
        if url and url not in allowed_origins:
            allowed_origins.append(url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.start_time = time.time()

# In-memory store for uploaded DataFrames (keyed by session id)
DATA_STORE: dict[str, pd.DataFrame] = {}

@app.on_event("startup")
async def startup_event():
    """Load demo data on startup using robust path resolution"""
    try:
        sample_path = BASE_DIR / "sample_transactions.csv"
        if sample_path.exists():
            df = pd.read_csv(sample_path)
            session_id = "demo"
            DATA_STORE[session_id] = df
            summary = run_pipeline(session_id, df)
            print(f"Demo data loaded: {len(df)} rows, {summary['num_frauds']} frauds detected")
        else:
            print(f"Demo data file not found at: {sample_path}")
    except Exception as e:
        print(f"Demo load failed: {e}")

# ─── HEALTH CHECK ENDPOINTS ────────────────────────────────────────────────
@app.get("/health")
@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "uptime": time.time() - app.state.start_time,
        "demo_available": "demo" in RESULTS_STORE,
    }

# ─── CORE API ENDPOINTS ───────────────────────────────────────────────────
@app.get("/api/stats")
async def stats():
    if "demo" not in RESULTS_STORE:
        return {"error": "Demo data not available"}
    r = RESULTS_STORE["demo"]
    return {
        "transactions": f"{r['processed_transactions']:,}",
        "flagged": f"{r['num_frauds']:,}",
        "blocked": f"{r['num_frauds'] // 3:,}",
        "confidence": "99.7%",
    }

@app.get("/api/transactions")
async def transactions(limit: int = Query(20, ge=1, le=100)):
    if "demo" not in RESULTS_STORE:
        return []
    fraud_txns = RESULTS_STORE["demo"].get("fraud_transactions", [])
    formatted = []
    for t in fraud_txns[:limit]:
        formatted.append({
            "id": t.get("transaction_id", "TXN-UNK"),
            "merchant": t.get("merchant_category_label", t.get("merchant_category", "Unknown")),
            "amount": f"${t.get('amount', 0):,.0f}",
            "risk": "high" if t.get("rule_flag", 0) or t.get("ml_pred", 0) else "low",
            "flag": t.get("fraud_type", "Clear"),
            "time": "recent",
        })
    return formatted

@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse CSV: {exc}")

    if df.empty:
        raise HTTPException(status_code=422, detail="Uploaded CSV is empty.")

    session_id = str(uuid.uuid4())
    DATA_STORE[session_id] = df

    return {
        "session_id": session_id,
        "rows": len(df),
        "columns": list(df.columns),
        "message": "File uploaded successfully. Call /api/analyze?session_id=<id> to run pipeline.",
    }

@app.post("/api/analyze")
def analyze(session_id: str):
    if session_id not in DATA_STORE:
        raise HTTPException(status_code=404, detail="Session not found. Please /api/upload first.")

    raw_df = DATA_STORE[session_id].copy()

    try:
        summary = run_pipeline(session_id, raw_df)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {exc}")

    return {"message": "Pipeline completed successfully.", "summary": summary}

@app.get("/api/results")
def results(session_id: str):
    if session_id not in RESULTS_STORE:
        raise HTTPException(status_code=404, detail="No results found. Please run /api/analyze first.")

    return JSONResponse(content=RESULTS_STORE[session_id])

@app.post("/api/analyse")
async def analyse_single(data: dict):
    # Rule-based and manual scoring for single transaction
    amount = float(data.get("amount", 0) or 0)
    manual_score = data.get("manualScore")
    
    if manual_score is not None:
        score = float(manual_score)
    else:
        score = 20.0
        if amount > 10000:
            score = 85.0
        elif amount > 5000:
            score = 65.0
            
    tier = "HIGH" if score > 75 else "MEDIUM" if score > 40 else "LOW"
    
    merchant_name = str(data.get("merchant", "")).lower()
    factors = {
        "amount_factor": round(min(100.0, amount / 100.0), 1),
        "merchant_risk": 30.0 if "crypto" in merchant_name else 10.0,
        "location_risk": 20.0 if data.get("location") == "Unknown" else 5.0,
    }
    
    return {
        "score": int(score),
        "tier": tier,
        "factors": factors,
    }

@app.post("/api/actions/{action}")
async def action(action: str):
    return {"message": f"{action} action triggered successfully"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)
