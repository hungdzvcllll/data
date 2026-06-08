#!/usr/bin/env python3
"""
Evaluate the deployed student_examscore_model.joblib on held-out test data.

Usage (from backend/ml):
  python evaluate.py
  python evaluate.py --csv ../../../student_performance.csv
  python evaluate.py --output-dir ../../../metrics_plots
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    mean_absolute_error,
    mean_squared_error,
    precision_recall_fscore_support,
    r2_score,
)
from sklearn.model_selection import train_test_split

from preprocessing import FEATURE_COLUMNS

ML_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL = ML_DIR / "student_examscore_model.joblib"
DEFAULT_CSV = ML_DIR / "../../../student_performance.csv"
DEFAULT_OUTPUT = ML_DIR / "../../../metrics_plots"

GRADE_LABELS = {
    0: "Excellent (>=85)",
    1: "Stable (70-84)",
    2: "At risk (55-69)",
    3: "High risk (<55)",
}


def score_to_grade(score: float) -> int:
    if score >= 85:
        return 0
    if score >= 70:
        return 1
    if score >= 55:
        return 2
    return 3


def load_dataset(csv_path: Path) -> tuple[pd.DataFrame, pd.Series]:
    df = pd.read_csv(csv_path).dropna()
    missing = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"CSV missing columns: {', '.join(missing)}")
    if "ExamScore" not in df.columns:
        raise ValueError("CSV must contain ExamScore column")

    x = df[FEATURE_COLUMNS]
    y = df["ExamScore"]
    return x, y


def evaluate(model, x_test, y_test) -> dict:
    y_pred = model.predict(x_test)

    mae = float(mean_absolute_error(y_test, y_pred))
    mse = float(mean_squared_error(y_test, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test, y_pred))

    pred_grade = np.array([score_to_grade(x) for x in y_pred])
    true_grade = np.array([score_to_grade(x) for x in y_test])
    grade_acc = float(accuracy_score(true_grade, pred_grade))

    precision, recall, f1, support = precision_recall_fscore_support(
        true_grade,
        pred_grade,
        labels=[0, 1, 2, 3],
        zero_division=0,
    )

    by_grade = {}
    for idx, label in GRADE_LABELS.items():
        by_grade[str(idx)] = {
            "label": GRADE_LABELS[idx],
            "precision": round(float(precision[idx]), 4),
            "recall": round(float(recall[idx]), 4),
            "f1": round(float(f1[idx]), 4),
            "support": int(support[idx]),
        }

    return {
        "testSamples": int(len(y_test)),
        "regression": {
            "mae": round(mae, 4),
            "mse": round(mse, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
        },
        "gradeClassification": {
            "accuracy": round(grade_acc, 4),
            "byGrade": by_grade,
        },
        "predictions": {
            "meanActual": round(float(np.mean(y_test)), 2),
            "meanPredicted": round(float(np.mean(y_pred)), 2),
            "minPredicted": round(float(np.min(y_pred)), 2),
            "maxPredicted": round(float(np.max(y_pred)), 2),
        },
    }


def save_plot(metrics: dict, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    by_grade = metrics["gradeClassification"]["byGrade"]
    labels = list(by_grade.keys())
    precision = [by_grade[k]["precision"] for k in labels]
    recall = [by_grade[k]["recall"] for k in labels]

    x = np.arange(len(labels))
    width = 0.35
    plt.figure(figsize=(8, 5))
    plt.bar(x - width / 2, precision, width, label="Precision")
    plt.bar(x + width / 2, recall, width, label="Recall")
    plt.xticks(x, labels)
    plt.xlabel("FinalGrade bucket")
    plt.ylabel("Score")
    plt.title("Precision and Recall by Grade (current model)")
    plt.ylim(0, 1)
    plt.legend()

    plot_path = output_dir / "precision_recall_by_grade.png"
    plt.savefig(plot_path, bbox_inches="tight")
    plt.close()
    return plot_path


def print_report(metrics: dict) -> None:
    reg = metrics["regression"]
    cls = metrics["gradeClassification"]

    print("\n=== Model evaluation (held-out 20% test set) ===")
    print(f"Test samples: {metrics['testSamples']}")
    print("\n-- Regression (ExamScore) --")
    print(f"  MAE  : {reg['mae']:.4f}  (sai so trung binh, diem)")
    print(f"  RMSE : {reg['rmse']:.4f}")
    print(f"  R2   : {reg['r2']:.4f}  (cang gan 1 cang tot)")

    print("\n-- Grade buckets (tu diem du doan) --")
    print(f"  Accuracy: {cls['accuracy']:.4f}")
    print("\n  Grade | Precision | Recall | F1    | Support")
    for key, row in cls["byGrade"].items():
        print(
            f"  {key:5} | {row['precision']:9.4f} | "
            f"{row['recall']:6.4f} | {row['f1']:5.4f} | {row['support']}"
        )

    pred = metrics["predictions"]
    print("\n-- Prediction range on test set --")
    print(f"  Mean actual   : {pred['meanActual']}")
    print(f"  Mean predicted: {pred['meanPredicted']}")
    print(f"  Min / Max pred: {pred['minPredicted']} / {pred['maxPredicted']}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate student_examscore_model.joblib")
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--test-size", type=float, default=0.2)
    args = parser.parse_args()

    model_path = args.model.resolve()
    csv_path = args.csv.resolve()
    output_dir = args.output_dir.resolve()

    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset not found: {csv_path}")

    model = joblib.load(model_path)
    x, y = load_dataset(csv_path)
    _, x_test, _, y_test = train_test_split(
        x,
        y,
        test_size=args.test_size,
        random_state=args.random_state,
    )

    metrics = evaluate(model, x_test, y_test)
    metrics["meta"] = {
        "modelPath": str(model_path),
        "csvPath": str(csv_path),
        "randomState": args.random_state,
        "testSize": args.test_size,
    }

    print_report(metrics)

    plot_path = save_plot(metrics, output_dir)
    json_path = output_dir / "evaluation_metrics.json"
    json_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print(f"\nSaved plot : {plot_path}")
    print(f"Saved JSON : {json_path}")


if __name__ == "__main__":
    main()
