#!/usr/bin/env python3
"""
EduCare AI - ML prediction script.
Reads JSON from stdin, loads joblib model, returns JSON on stdout.

Single input:
{"features": {"StudyHours": 20, "Attendance": 85, ...}}

Batch input (legacy):
{"batch": [{"studentCode": "SV001", "features": {...}}, ...]}

Batch input (preferred):
{"records": [{"studentCode": "SV001", "features": {...}}, ...]}
"""
import json
import sys
import traceback
from pathlib import Path

import joblib
import pandas as pd

from preprocessing import FEATURE_COLUMNS, normalize_features

MODEL_PATH = Path(__file__).resolve().parent / "student_examscore_model.joblib"


def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")
    return joblib.load(MODEL_PATH)


def predict_single(model, features: dict) -> float:
    normalized = normalize_features(features)
    row = [[normalized[col] for col in FEATURE_COLUMNS]]
    df = pd.DataFrame(row, columns=FEATURE_COLUMNS)
    score = float(model.predict(df)[0])
    return round(max(40.0, min(100.0, score)), 2)


def predict_batch(model, items: list) -> list:
    predictions = []
    for item in items:
        student_code = item.get("studentCode")
        features = item.get("features", item)
        score = predict_single(model, features)
        entry = {"predictedScore": score}
        if student_code:
            entry["studentCode"] = student_code
        if item.get("studentId"):
            entry["studentId"] = item["studentId"]
        predictions.append(entry)
    return predictions


def main():
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            print(json.dumps({"success": False, "message": "Empty input"}))
            sys.exit(1)

        payload = json.loads(raw)
        model = load_model()

        if "records" in payload:
            predictions = predict_batch(model, payload["records"])
            print(json.dumps({"success": True, "predictions": predictions}))
            return

        if "batch" in payload:
            predictions = predict_batch(model, payload["batch"])
            print(json.dumps({"success": True, "predictions": predictions}))
            return

        features = payload.get("features", payload)
        score = predict_single(model, features)
        print(json.dumps({"success": True, "predictedScore": score}))

    except ValueError as exc:
        print(json.dumps({"success": False, "message": str(exc)}))
        sys.exit(1)
    except Exception as exc:
        print(json.dumps({
            "success": False,
            "message": str(exc),
            "trace": traceback.format_exc(),
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
