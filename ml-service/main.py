# main.py
# FastAPI server - entry point for ML API
# Run with: uvicorn main:app --reload --port 8000

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import PredictionResponse
from database import fetch_single_student_data
from algorithms import (
    LinearRegression,
    PolynomialRegression,
    KMeansClustering,
    RandomForest,
    StandardScaler,
    prepare_features,
    get_grade,
    clamp
)
import numpy as np
import joblib
import os

app = FastAPI(title="SkoolX ML Prediction API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# load models at startup
linear_model = None
poly_model = None
rf_model = None
kmeans_model = None
scaler = None
metrics = {}

@app.on_event("startup")
def load_models():
    global linear_model, poly_model, rf_model, kmeans_model, scaler, metrics
    
    try:
        linear_model = LinearRegression().load("data/linear_model.pkl")
        poly_model = PolynomialRegression(degree=2)
        poly_model.load("data/poly_model.pkl", "data/poly_features.pkl")
        rf_model = RandomForest().load("data/rf_model.pkl")
        kmeans_model = KMeansClustering().load("data/kmeans_model.pkl")
        scaler = StandardScaler().load("data/scaler.pkl")
        metrics = joblib.load("data/metrics.pkl")
        print("All models loaded successfully!")
    except Exception as e:
        print(f"Models not loaded: {e}")
        print("Please run: python train.py")


def get_confidence_label(r2: float) -> str:
    if r2 >= 0.85: return "Excellent"
    if r2 >= 0.70: return "Good"
    if r2 >= 0.50: return "Moderate"
    return "Low — needs more data"


@app.get("/")
def root():
    return {"message": "SkoolX ML API", "status": "running"}


@app.get("/health")
def health():
    models_ready = all([linear_model, poly_model, rf_model, kmeans_model, scaler])
    return {
        "status": "ok",
        "models_ready": models_ready,
        "metrics": metrics
    }


@app.get("/predict/{student_id}", response_model=PredictionResponse)
def predict(student_id: str):
    """
    Main prediction endpoint
    Runs all 4 algorithms and returns combined results
    """
    # check models loaded
    if not all([linear_model, poly_model, rf_model, kmeans_model, scaler]):
        raise HTTPException(
            status_code=503,
            detail="Models not trained yet. Run: python train.py"
        )
    
    # fetch student data
    scores, attendance_rate, grade_id = fetch_single_student_data(student_id)
    
    if not scores:
        raise HTTPException(
            status_code=404,
            detail="No results found for this student"
        )
    
    # get K-Means cluster label
    avg = float(np.mean(scores))
    trend_val = float(scores[-1] - scores[0]) if len(scores) >= 2 else 0.0
    consistency = float(np.std(scores)) if len(scores) > 1 else 0.0
    cluster_features = np.array([[avg, attendance_rate, trend_val, consistency]])
    cluster_label = int(kmeans_model.predict(cluster_features)[0])
    cluster_name = kmeans_model.get_cluster_name(cluster_label)
    
    # prepare features
    features = prepare_features(scores, attendance_rate, cluster_label)
    if features is None:
        raise HTTPException(status_code=400, detail="Could not prepare features")
    
    # scale for linear and polynomial
    features_scaled = scaler.transform(features)
    
    # run all 4 algorithms
    linear_pred = clamp(linear_model.predict(features_scaled)[0])
    poly_pred = clamp(poly_model.predict(features_scaled)[0])
    rf_pred = clamp(rf_model.predict(features)[0])
    
    # ensemble: weighted average (RF gets highest weight)
    final_pred = clamp(
        linear_pred * 0.2 +
        poly_pred * 0.2 +
        rf_pred * 0.6
    )
    
    # trend
    trend_val = float(scores[-1] - scores[0]) if len(scores) >= 2 else 0.0
    if trend_val > 5:
        trend = "Improving"
    elif trend_val < -5:
        trend = "Declining"
    else:
        trend = "Stable"
    
    # confidence
    rf_r2 = metrics.get("rf_r2", 0.5)
    linear_r2 = metrics.get("linear_r2", 0.5)
    poly_r2 = metrics.get("poly_r2", 0.5)
    
    return PredictionResponse(
        student_id=student_id,
        predicted_score=final_pred,
        linear_predicted=linear_pred,
        poly_predicted=poly_pred,
        rf_predicted=rf_pred,
        average_score=round(avg, 1),
        attendance_rate=round(attendance_rate, 1),
        total_exams=len(scores),
        highest_score=int(max(scores)),
        lowest_score=int(min(scores)),
        grade=get_grade(final_pred),
        trend=trend,
        trend_value=round(trend_val, 1),
        cluster=cluster_name,
        is_at_risk=cluster_name == "At Risk",
        rf_confidence=round(rf_r2, 2),
        linear_confidence=round(linear_r2, 2),
        poly_confidence=round(poly_r2, 2),
        confidence_label=get_confidence_label(rf_r2),
        past_scores=[int(s) for s in scores],
    )