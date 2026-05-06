# train.py
# Run this script ONCE to train all 4 ML models
# Command: python train.py
#
# This script:
# 1. Fetches all student data from PostgreSQL
# 2. Trains Linear Regression model
# 3. Trains Polynomial Regression model
# 4. Trains K-Means Clustering model
# 5. Trains Random Forest model
# 6. Saves all models to data/ folder

import numpy as np
import os
import joblib
from database import fetch_all_students_data
from algorithms import (
    LinearRegression,
    PolynomialRegression,
    KMeansClustering,
    RandomForest,
    StandardScaler,
    prepare_features
)

def build_training_data(all_students):
    """
    Converts student data into X (features) and y (targets)
    
    Strategy:
    For each student with N scores:
    - Use scores[0..i] to predict scores[i+1]
    - This creates multiple training samples per student
    """
    X = []
    y = []
    clustering_features = []
    
    for student in all_students:
        scores = student["scores"]
        attendance = student["attendance_rate"]
        
        if len(scores) < 2:
            continue
        
        # clustering features (use all scores summary)
        avg = np.mean(scores)
        trend = scores[-1] - scores[0]
        consistency = np.std(scores) if len(scores) > 1 else 0
        clustering_features.append([avg, attendance, trend, consistency])
        
        # build training pairs
        for i in range(1, len(scores)):
            past = scores[:i]
            target = scores[i]
            
            features = prepare_features(past, attendance, cluster_label=0)
            if features is not None:
                X.append(features[0])
                y.append(target)
    
    return (
        np.array(X) if X else None,
        np.array(y) if y else None,
        np.array(clustering_features) if clustering_features else None
    )


def train_kmeans(clustering_features):
    """
    Train K-Means Clustering
    Groups students into 3 clusters:
    - High Performer
    - Average Performer
    - At Risk
    """
    print("\n--- Training K-Means Clustering ---")
    
    kmeans = KMeansClustering(n_clusters=3, max_iters=100, random_state=42)
    kmeans.fit(clustering_features)
    
    # show cluster distribution
    labels = kmeans.predict(clustering_features)
    for k in range(3):
        count = np.sum(labels == k)
        name = kmeans.get_cluster_name(k)
        print(f"  Cluster {k} ({name}): {count} students")
    
    kmeans.save("data/kmeans_model.pkl")
    print("K-Means saved!")
    return kmeans


def get_cluster_labels(kmeans, all_students):
    """
    Get cluster label for each student
    Used to add cluster as feature for other models
    """
    cluster_map = {}
    for student in all_students:
        scores = student["scores"]
        attendance = student["attendance_rate"]
        if not scores:
            cluster_map[student["student_id"]] = 0
            continue
        
        avg = np.mean(scores)
        trend = scores[-1] - scores[0] if len(scores) >= 2 else 0
        consistency = np.std(scores) if len(scores) > 1 else 0
        features = np.array([[avg, attendance, trend, consistency]])
        label = kmeans.predict(features)[0]
        cluster_map[student["student_id"]] = int(label)
    
    return cluster_map


def train_linear(X_scaled, y):
    """
    Train Linear Regression model
    Predicts score based on straight-line trend
    """
    print("\n--- Training Linear Regression ---")
    
    split = int(0.8 * len(X_scaled))
    X_train, X_test = X_scaled[:split], X_scaled[split:]
    y_train, y_test = y[:split], y[split:]
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    r2 = model.score(X_test, y_test)
    print(f"  R² Score: {r2:.3f}")
    
    model.save("data/linear_model.pkl")
    print("Linear Regression saved!")
    return model, r2


def train_polynomial(X, y):
    """
    Train Polynomial Regression model
    Captures curved improvement patterns
    """
    print("\n--- Training Polynomial Regression ---")
    
    split = int(0.8 * len(X))
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    
    model = PolynomialRegression(degree=2)
    model.fit(X_train, y_train)
    
    r2 = model.score(X_test, y_test)
    print(f"  R² Score: {r2:.3f}")
    
    model.save("data/poly_model.pkl", "data/poly_features.pkl")
    print("Polynomial Regression saved!")
    return model, r2


def train_random_forest(X, y):
    """
    Train Random Forest model
    Main prediction algorithm - most accurate
    """
    print("\n--- Training Random Forest ---")
    
    split = int(0.8 * len(X))
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    
    model = RandomForest(
        n_trees=10,
        max_depth=5,
        min_samples_split=2,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    r2 = model.score(X_test, y_test)
    print(f"  R² Score: {r2:.3f}")
    
    model.save("data/rf_model.pkl")
    print("Random Forest saved!")
    return model, r2


def main():
    print("=" * 50)
    print("SkoolX ML Training Pipeline")
    print("=" * 50)
    
    # create data directory
    os.makedirs("data", exist_ok=True)
    
    # fetch data
    print("\nFetching student data from PostgreSQL...")
    all_students = fetch_all_students_data()
    print(f"Found {len(all_students)} students")
    
    if len(all_students) == 0:
        print("No student data found! Make sure database has results.")
        return
    
    # build training data
    print("\nBuilding training dataset...")
    X, y, clustering_features = build_training_data(all_students)
    
    if X is None or len(X) < 5:
        print(f"Not enough training samples (found {len(X) if X is not None else 0})")
        print("Need at least 5 samples. Add more results to database.")
        return
    
    print(f"Training samples: {len(X)}")
    
    # train K-Means first (cluster labels used in other models)
    kmeans = train_kmeans(clustering_features)
    cluster_map = get_cluster_labels(kmeans, all_students)
    
    # update X with correct cluster labels
    for i, student in enumerate(all_students):
        sid = student["student_id"]
        cluster_label = cluster_map.get(sid, 0)
        # update cluster column (last column) in X
        student_samples_start = 0
        for s in all_students[:i]:
            if len(s["scores"]) >= 2:
                student_samples_start += len(s["scores"]) - 1
        for j in range(len(student["scores"]) - 1):
            if student_samples_start + j < len(X):
                X[student_samples_start + j][-1] = cluster_label
    
    # scale features
    print("\nScaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    scaler.save("data/scaler.pkl")
    
    # train all models
    linear_model, linear_r2 = train_linear(X_scaled, y)
    poly_model, poly_r2 = train_polynomial(X_scaled, y)
    rf_model, rf_r2 = train_random_forest(X, y)
    
    # save metrics
    metrics = {
        "linear_r2": float(linear_r2),
        "poly_r2": float(poly_r2),
        "rf_r2": float(rf_r2),
        "n_samples": len(X),
        "n_students": len(all_students)
    }
    joblib.dump(metrics, "data/metrics.pkl")
    
    print("\n" + "=" * 50)
    print("TRAINING COMPLETE!")
    print(f"Linear Regression R²:    {linear_r2:.3f}")
    print(f"Polynomial Regression R²: {poly_r2:.3f}")
    print(f"Random Forest R²:         {rf_r2:.3f}")
    print("=" * 50)


if __name__ == "__main__":
    main()