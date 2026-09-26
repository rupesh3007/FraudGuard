"""
pipeline.py
===========
All processing stages for the fraud detection system.

Stages
------
1. Data Cleaning
2. Feature Engineering
3. Rule-Based Fraud Detection
4. Machine Learning (RandomForestClassifier)
5. Evaluation
6. Fraud-Type Classification
"""

import warnings
import time
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Global results store  (populated by run_pipeline, read by /results endpoint)
# ---------------------------------------------------------------------------
RESULTS_STORE: dict[str, Any] = {}


# ===========================================================================
# STAGE 1 — DATA CLEANING
# ===========================================================================

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Perform data cleaning:
    - Remove duplicate rows
    - Detect amount_col & make numeric (preserve for rules)
    - Detect and convert datetime columns
    - Impute missing values (mean for numeric, mode for categorical)
    - Label-encode *non-amount* object columns only
    """


    # --- Identify amount column early (preserve numeric) ------------------
    amount_candidates = ['transaction_amount', 'amount', 'amt', 'value']
    amount_col = next((col for col in amount_candidates if col in df.columns), None)
    if amount_col:
        df[amount_col] = pd.to_numeric(df[amount_col], errors='coerce')
        print(f"[Clean] Preserved '{amount_col}' as numeric: {df[amount_col].dtype}")

    # --- 1a. Remove duplicates -------------------------------------------
    before = len(df)
    df = df.drop_duplicates()
    print(f"[Clean] Removed {before - len(df)} duplicate rows. Remaining: {len(df)}")

    # --- 1b. Detect & parse datetime columns ------------------------------
    for col in df.select_dtypes(include=["object", "string"]).columns:
        if col == amount_col:
            continue
        sample = df[col].dropna().head(200)
        if sample.empty:
            continue
        sample_values = sample.astype("string").str.strip()
        parsed_sample = pd.to_datetime(
            sample_values, errors="coerce", format="mixed", utc=True
        )
        if parsed_sample.notna().mean() > 0.6:
            values = df[col].astype("string").str.strip()
            parsed = pd.to_datetime(values, errors="coerce", format="mixed", utc=True)
            epoch_seconds = values.str.fullmatch(r"\d{10}", na=False)
            epoch_milliseconds = values.str.fullmatch(r"\d{13}", na=False)
            if epoch_seconds.any():
                parsed.loc[epoch_seconds] = pd.to_datetime(
                    pd.to_numeric(values.loc[epoch_seconds]), unit="s", utc=True
                )
            if epoch_milliseconds.any():
                parsed.loc[epoch_milliseconds] = pd.to_datetime(
                    pd.to_numeric(values.loc[epoch_milliseconds]), unit="ms", utc=True
                )
            df[col] = parsed
            print(f"[Clean] Converted '{col}' to datetime.")

    # --- 1c. Impute missing values ----------------------------------------
    for col in df.columns:
        if df[col].isnull().sum() == 0:
            continue
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            mode_val = df[col].mode()
            df[col] = df[col].fillna(mode_val[0] if not mode_val.empty else pd.NaT)
        elif pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].mean())
            print(f"[Clean] Imputed numeric '{col}' with mean.")
        else:
            mode_val = df[col].mode()
            df[col] = df[col].fillna(mode_val[0] if not mode_val.empty else "unknown")
            print(f"[Clean] Imputed categorical '{col}' with mode.")

    # --- 1d. Label-encode LOW-CARDINALITY object columns only (fix high-cardinality leak) ---
    le = LabelEncoder()
    object_cols = df.select_dtypes(include="object").columns
    low_cardinality = ['merchant_category', 'payment_method', 'transaction_status', 'channel']
    for col in object_cols:
        if col in low_cardinality and col != amount_col:
            # Preserve the original human-readable label alongside the encoded
            # column so downstream consumers (e.g. the dashboard charts/table)
            # can display "Groceries" instead of a raw integer code.
            df[f"{col}_label"] = df[col].astype(str)
            df[col] = le.fit_transform(df[col].astype(str))
            print(f"[Clean] Label-encoded '{col}'.")
        elif col in ['user_id']:  # Keep raw for frequency features
            print(f"[Clean] Preserved '{col}' as raw string.")
        else:
            print(f"[Clean] Skipped high-cardinality '{col}'.")

    return df, amount_col if amount_col else None


# ===========================================================================
# STAGE 2 — FEATURE ENGINEERING
# ===========================================================================

def engineer_features(df: pd.DataFrame, raw_df: pd.DataFrame, amount_col=None) -> pd.DataFrame:
    """
    Create derived features... FIXED: frequency encoding for user_id
    """
    user_col = _find_column(df, ["user_id", "userid", "customer_id", "account_id", "nameOrig"])
    if amount_col is None:
        amount_col = _find_column(df, ["amount", "transaction_amount", "amt", "value"])
    time_col   = _find_column_dtype(df, "datetime")
    device_col = _find_column(df, ["device", "device_id", "deviceid"])

    print(f"[Feature] user_col={user_col}, amount_col={amount_col}")

    # FIXED: Frequency encoding for user_id (instead of label encoding)
    if user_col and user_col in df.columns:
        freq_map = df[user_col].value_counts().to_dict()
        df['user_frequency'] = df[user_col].map(freq_map)
        print(f"[Feature] Added user_frequency.")

    # -- Transaction frequency per user ------------------------------------
    if user_col and user_col in df.columns:
        freq = df.groupby(user_col)[user_col].transform("count")
        df["transaction_frequency"] = freq
    else:
        df["transaction_frequency"] = 1

    # -- Average transaction amount per user --------------------------------
    if user_col and user_col in df.columns and amount_col:
        avg_amt = df.groupby(user_col)[amount_col].transform("mean")
        df["avg_transaction_amount"] = avg_amt
    elif amount_col:
        df["avg_transaction_amount"] = df[amount_col].mean()
    else:
        df["avg_transaction_amount"] = 0.0

    # -- Time difference between consecutive transactions per user ----------
    if time_col and user_col and user_col in df.columns:
        temp = df[[user_col, time_col]].copy()
        temp = temp.sort_values([user_col, time_col])
        temp["time_diff_seconds"] = (
            temp.groupby(user_col)[time_col]
                .diff()
                .dt.total_seconds()
                .fillna(0)
        )
        df["time_diff_seconds"] = temp["time_diff_seconds"].reindex(df.index).fillna(0)
    else:
        df["time_diff_seconds"] = 0.0

    # -- Number of unique devices per user ----------------------------------
    if device_col and user_col and user_col in df.columns:
        dev_count = df.groupby(user_col)[device_col].transform("nunique")
        df["device_count"] = dev_count
    else:
        df["device_count"] = 1

    # -- High-value transaction flag ----------------------------------------
    if amount_col:
        threshold_95 = df[amount_col].quantile(0.95)
        df["is_high_value"] = (df[amount_col] > threshold_95).astype(int)
    else:
        df["is_high_value"] = 0

    print("[Feature] Feature engineering complete.")
    return df


# ===========================================================================
# STAGE 3 — RULE-BASED FRAUD DETECTION
# ===========================================================================

def rule_based_detection(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply three heuristic rules and store the combined result in 'rule_flag':
    1. High amount  : transaction amount > 95th-percentile threshold
    2. Velocity     : user made > 10 transactions and avg time between them < 60 s
    3. Behavioural  : transaction amount deviates > 3σ from the user's average
    """
    amount_col = _find_column(df, ["amount", "transaction_amount", "amt", "value"])

    rule_flag = pd.Series(0, index=df.index)

    # Rule 1 — High-amount transactions
    if amount_col:
        high_threshold = df[amount_col].quantile(0.95)
        rule1 = (df[amount_col] > high_threshold).astype(int)
        rule_flag |= rule1
        print(f"[Rules] Rule-1 (high amount >{high_threshold:.2f}) flagged {rule1.sum()} rows.")

    # Rule 2 — Velocity fraud
    if "transaction_frequency" in df.columns and "time_diff_seconds" in df.columns:
        rule2 = (
            (df["transaction_frequency"] > 10) &
            (df["time_diff_seconds"] < 60) &
            (df["time_diff_seconds"] > 0)
        ).astype(int)
        rule_flag |= rule2
        print(f"[Rules] Rule-2 (velocity) flagged {rule2.sum()} rows.")

    # Rule 3 — Abnormal deviation from user average (>3σ)
    if amount_col and "avg_transaction_amount" in df.columns:
        std_amt = df[amount_col].std()
        if std_amt > 0:
            rule3 = (
                (df[amount_col] - df["avg_transaction_amount"]).abs() > 3 * std_amt
            ).astype(int)
            rule_flag |= rule3
            print(f"[Rules] Rule-3 (behavioral anomaly) flagged {rule3.sum()} rows.")

    df["rule_flag"] = rule_flag.astype(int)
    print(f"[Rules] Total rule_flag=1: {df['rule_flag'].sum()}")
    return df


# ===========================================================================
# STAGE 4 — MACHINE LEARNING
# ===========================================================================

def train_and_predict(df: pd.DataFrame):
    """
    Train a RandomForestClassifier only when the data contains real fraud labels.
    Evaluate on a stratified holdout, and keep rules separate from model metrics.
    - Returns (df_with_predictions, metrics_dict).
    """
    target_aliases = {"fraud", "isfraud", "is_fraud", "fraudulent", "class", "label"}
    target_col = next(
        (column for column in df.columns if column.lower().replace(" ", "_") in target_aliases),
        None,
    )
    if target_col is None:
        print("[ML] No labeled fraud target found; using rule-based results only.")
        df["ml_pred"] = 0
        return df, {
            "accuracy": None,
            "precision": None,
            "recall": None,
            "f1_score": None,
            "metrics_available": False,
            "evaluation_method": "unlabeled dataset; supervised metrics unavailable",
            "model_train_seconds": None,
            "model_predict_seconds": None,
            "model_features": 0,
            "target_column": None,
        }

    raw_target = df[target_col]
    if pd.api.types.is_bool_dtype(raw_target):
        y = raw_target.map({True: 1, False: 0})
    else:
        numeric_target = pd.to_numeric(raw_target, errors="coerce")
        labeled_values = numeric_target.dropna()
        if not labeled_values.empty and labeled_values.isin([0, 1]).all():
            y = numeric_target
        else:
            normalized_target = raw_target.astype("string").str.strip().str.lower()
            label_map = {
                "1": 1, "true": 1, "yes": 1, "fraud": 1, "fraudulent": 1,
                "0": 0, "false": 0, "no": 0, "normal": 0, "legitimate": 0,
                "legit": 0, "non-fraud": 0, "nonfraud": 0,
            }
            y = normalized_target.map(label_map)

    valid_labels = y.notna()
    y = y.loc[valid_labels].astype("int8")
    if y.nunique() < 2 or y.value_counts().min() < 2:
        print("[ML] At least two examples of each fraud class are required; using rules only.")
        df["ml_pred"] = 0
        return df, {
            "accuracy": None,
            "precision": None,
            "recall": None,
            "f1_score": None,
            "metrics_available": False,
            "evaluation_method": "insufficient labeled examples; supervised metrics unavailable",
            "model_train_seconds": None,
            "model_predict_seconds": None,
            "model_features": 0,
            "target_column": target_col,
        }

    excluded = {
        target_alias.lower() for target_alias in target_aliases
    } | {"rule_flag", "fraud_type", "ml_pred", "isflaggedfraud"}
    excluded.update(
        column.lower() for column in df.columns
        if column.lower().replace(" ", "_") in target_aliases
    )
    excluded.update({"transaction_id", "transactionid", "nameorig", "namedest"})

    feature_frame = df.loc[valid_labels]
    numeric_features = [
        column for column in feature_frame.select_dtypes(include=[np.number]).columns
        if column.lower() not in excluded
    ]
    max_categories = min(100, max(20, int(np.sqrt(len(feature_frame)))))
    categorical_features = [
        column for column in feature_frame.select_dtypes(include=["object", "string", "category"]).columns
        if column.lower() not in excluded
        and feature_frame[column].nunique(dropna=True) <= max_categories
    ]
    feature_columns = numeric_features + categorical_features
    if not feature_columns:
        print("[ML] No usable model features; using rules only.")
        df["ml_pred"] = 0
        return df, {
            "accuracy": None,
            "precision": None,
            "recall": None,
            "f1_score": None,
            "metrics_available": False,
            "evaluation_method": "no usable features; supervised metrics unavailable",
            "model_train_seconds": None,
            "model_predict_seconds": None,
            "model_features": 0,
            "target_column": target_col,
        }

    X = df[feature_columns]
    X_labeled = X.loc[valid_labels]
    X_train, X_test, y_train, y_test = train_test_split(
        X_labeled, y, test_size=0.2, random_state=42, stratify=y
    )

    transformers = []
    if numeric_features:
        transformers.append(("numeric", SimpleImputer(strategy="median"), numeric_features))
    if categorical_features:
        categorical_pipeline = Pipeline([
            ("impute", SimpleImputer(strategy="most_frequent")),
            ("encode", OneHotEncoder(handle_unknown="ignore", min_frequency=5)),
        ])
        transformers.append(("categorical", categorical_pipeline, categorical_features))

    model = Pipeline([
        ("features", ColumnTransformer(transformers, remainder="drop")),
        ("classifier", RandomForestClassifier(
            n_estimators=100,
            max_depth=18,
            min_samples_leaf=2,
            class_weight="balanced_subsample",
            n_jobs=-1,
            random_state=42,
        )),
    ])

    train_started = time.perf_counter()
    model.fit(X_train, y_train)
    train_seconds = time.perf_counter() - train_started

    test_predictions = model.predict(X_test)
    precision = precision_score(y_test, test_predictions, zero_division=0)
    recall = recall_score(y_test, test_predictions, zero_division=0)
    f1 = f1_score(y_test, test_predictions, zero_division=0)
    accuracy = accuracy_score(y_test, test_predictions)

    predict_started = time.perf_counter()
    df["ml_pred"] = model.predict(X).astype(int)
    predict_seconds = time.perf_counter() - predict_started

    print(
        f"[ML] Holdout accuracy={accuracy:.4f} precision={precision:.4f} "
        f"recall={recall:.4f} F1={f1:.4f} train={train_seconds:.3f}s"
    )
    return df, {
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "metrics_available": True,
        "evaluation_method": "stratified 80/20 holdout",
        "model_train_seconds": round(train_seconds, 4),
        "model_predict_seconds": round(predict_seconds, 4),
        "model_features": len(feature_columns),
        "target_column": target_col,
    }


# ===========================================================================
# STAGE 5 — FRAUD-TYPE CLASSIFICATION
# ===========================================================================

def classify_fraud_type(row: pd.Series) -> str:
    """
    Classify each transaction into one of four fraud types:
    - High Amount Fraud     : flagged by rule_flag AND is_high_value
    - Velocity Fraud        : flagged by rule_flag AND high transaction_frequency with low time_diff
    - Behavioral Anomaly    : flagged by rule_flag but not the above specific types
    - Normal                : not flagged
    """
    if row.get("rule_flag", 0) == 0 and row.get("ml_pred", 0) == 0:
        return "Normal"

    if row.get("is_high_value", 0) == 1:
        return "High Amount Fraud"

    if (row.get("transaction_frequency", 0) > 10 and
            0 < row.get("time_diff_seconds", 999) < 60):
        return "Velocity Fraud"

    return "Behavioral Anomaly"


def add_fraud_type(df: pd.DataFrame) -> pd.DataFrame:
    """Assign fraud patterns with vectorized masks for large datasets."""
    flagged = df["rule_flag"].eq(1) | df["ml_pred"].eq(1)
    high_value = df.get("is_high_value", pd.Series(0, index=df.index)).eq(1)
    frequency = df.get("transaction_frequency", pd.Series(0, index=df.index))
    time_diff = df.get("time_diff_seconds", pd.Series(0, index=df.index))
    velocity = frequency.gt(10) & time_diff.gt(0) & time_diff.lt(60)

    df["fraud_type"] = "Normal"
    df.loc[flagged, "fraud_type"] = "Behavioral Anomaly"
    df.loc[flagged & velocity, "fraud_type"] = "Velocity Fraud"
    df.loc[flagged & high_value, "fraud_type"] = "High Amount Fraud"
    print("[Classify] Fraud types assigned.")
    return df


# ===========================================================================
# ORCHESTRATOR
# ===========================================================================

def run_pipeline(session_id: str, raw_df: pd.DataFrame) -> dict:
    """
    Run all pipeline stages in order and persist results to RESULTS_STORE.
    Returns a brief summary dict.
    """
    print(f"\n{'='*60}")
    print(f" Starting pipeline  [session={session_id}]")
    print(f"{'='*60}\n")

# Stage 1 — Clean  
    df, amount_col = clean_data(raw_df.copy())
    raw_count = len(raw_df)

# Stage 2 — Feature engineer
    df = engineer_features(df, raw_df.copy(), amount_col)

    # Stage 3 — Rule-based detection
    df = rule_based_detection(df)

    # Stage 4 — ML
    df, metrics = train_and_predict(df)

    # Stage 5 — Fraud-type classification
    df = add_fraud_type(df)

    # -----------------------------------------------------------------------
    # Build result payload
    # -----------------------------------------------------------------------
    total_transactions = len(df)
    raw_transactions = raw_count
    fraud_mask = (df["rule_flag"] == 1) | (df["ml_pred"] == 1)
    num_frauds = int(fraud_mask.sum())
    fraud_pct  = round(num_frauds / total_transactions * 100, 2) if total_transactions else 0.0

    # Fraud transactions — return as list of dicts (NaN-safe)
    fraud_df = df[fraud_mask].copy()
    fraud_records = (
        fraud_df
        .replace({np.nan: None, np.inf: None, -np.inf: None})
        .to_dict(orient="records")
    )

    # Ensure all values are JSON-serialisable
    fraud_records = _sanitize_records(fraud_records)

    result = {
        "raw_transactions": raw_transactions,
        "processed_transactions": total_transactions,
        "num_frauds":         num_frauds,
        "fraud_percentage":   fraud_pct,
        **metrics,
        "fraud_transactions": fraud_records,
    }

    RESULTS_STORE[session_id] = result

    summary = {
        "total_transactions": total_transactions,
        "num_frauds":         num_frauds,
        "fraud_percentage":   fraud_pct,
        **metrics,
    }
    return summary


# ===========================================================================
# HELPER UTILITIES
# ===========================================================================

def _find_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    """Return the first column name (case-insensitive) that matches a candidate."""
    lower_cols = {c.lower(): c for c in df.columns}
    for name in candidates:
        if name.lower() in lower_cols:
            return lower_cols[name.lower()]
    return None


def _find_column_dtype(df: pd.DataFrame, dtype_kind: str) -> str | None:
    """Return the first column matching a dtype kind ('datetime', 'numeric', etc.)."""
    for col in df.columns:
        if dtype_kind == "datetime" and pd.api.types.is_datetime64_any_dtype(df[col]):
            return col
        if dtype_kind == "numeric" and pd.api.types.is_numeric_dtype(df[col]):
            return col
    return None


def _sanitize_records(records: list[dict]) -> list[dict]:
    """Recursively convert non-JSON-serialisable types to Python builtins."""
    clean = []
    for rec in records:
        clean_rec = {}
        for k, v in rec.items():
            if isinstance(v, (np.integer,)):
                v = int(v)
            elif isinstance(v, (np.floating,)):
                v = float(v) if np.isfinite(v) else None
            elif isinstance(v, (np.bool_,)):
                v = bool(v)
            elif isinstance(v, pd.Timestamp):
                v = v.isoformat()
            clean_rec[k] = v
        clean.append(clean_rec)
    return clean
