import numpy as np
import joblib
import os

# ============================================================
# ALGORITHM 1: LINEAR REGRESSION

class LinearRegression:
    
    def __init__(self):
        self.weights = None      # learned coefficients
        self.intercept = None    # bias term
    
    def fit(self, X, y):
  
        X = np.array(X, dtype=float)
        y = np.array(y, dtype=float)
        
        n_samples = X.shape[0]
        X_bias = np.column_stack([np.ones(n_samples), X])
        
        try:
            XtX = X_bias.T @ X_bias
            Xty = X_bias.T @ y
            
            w = np.linalg.pinv(XtX) @ Xty
            
            self.intercept = w[0]
            self.weights = w[1:]
        except Exception as e:
            self.intercept = np.mean(y)
            self.weights = np.zeros(X.shape[1])
        
        return self
    
    def predict(self, X):
        """
        Predict scores for new data
        """
        X = np.array(X, dtype=float)
        return self.intercept + X @ self.weights
    
    def score(self, X, y):

        X = np.array(X, dtype=float)
        y = np.array(y, dtype=float)
        
        y_pred = self.predict(X)
        
        ss_residual = np.sum((y - y_pred) ** 2)
        ss_total = np.sum((y - np.mean(y)) ** 2)
        
        if ss_total == 0:
            return 1.0
        
        return 1 - (ss_residual / ss_total)
    
    def save(self, path):
        joblib.dump({"weights": self.weights, "intercept": self.intercept}, path)
    
    def load(self, path):
        data = joblib.load(path)
        self.weights = data["weights"]
        self.intercept = data["intercept"]
        return self


# ============================================================
# ALGORITHM 2: POLYNOMIAL REGRESSION

class PolynomialFeatures:
    
    def __init__(self, degree=2):
        self.degree = degree
        self.n_features = None
    
    def _get_combinations(self, n_features, degree):

        from itertools import combinations_with_replacement
        combos = []
        for d in range(1, degree + 1):
            combos.extend(combinations_with_replacement(range(n_features), d))
        return combos
    
    def fit_transform(self, X):

        X = np.array(X, dtype=float)
        if X.ndim == 1:
            X = X.reshape(-1, 1)
        
        self.n_features = X.shape[1]
        self.combinations = self._get_combinations(self.n_features, self.degree)
        
        return self.transform(X)
    
    def transform(self, X):

        X = np.array(X, dtype=float)
        if X.ndim == 1:
            X = X.reshape(-1, 1)
        
        n_samples = X.shape[0]
        poly_features = [np.ones((n_samples, 1))]
        
        for combo in self.combinations:
            feature = np.ones(n_samples)
            for idx in combo:
                feature *= X[:, idx]
            poly_features.append(feature.reshape(-1, 1))
        
        return np.hstack(poly_features)
    
    def save(self, path):
        joblib.dump({
            "degree": self.degree,
            "n_features": self.n_features,
            "combinations": self.combinations
        }, path)
    
    def load(self, path):
        data = joblib.load(path)
        self.degree = data["degree"]
        self.n_features = data["n_features"]
        self.combinations = data["combinations"]
        return self


class PolynomialRegression:
    
    def __init__(self, degree=2):
        self.degree = degree
        self.poly = PolynomialFeatures(degree)
        self.linear = LinearRegression()
    
    def fit(self, X, y):
        X_poly = self.poly.fit_transform(X)
        self.linear.fit(X_poly, y)
        return self
    
    def predict(self, X):
        X_poly = self.poly.transform(X)
        return self.linear.predict(X_poly)
    
    def score(self, X, y):
        X_poly = self.poly.transform(X)
        return self.linear.score(X_poly, y)
    
    def save(self, path_model, path_poly):
        self.linear.save(path_model)
        self.poly.save(path_poly)
    
    def load(self, path_model, path_poly):
        self.linear.load(path_model)
        self.poly.load(path_poly)
        return self


# ============================================================
# ALGORITHM 3: K-MEANS CLUSTERING

class KMeansClustering:
    
    def __init__(self, n_clusters=3, max_iters=100, random_state=42):
        self.n_clusters = n_clusters
        self.max_iters = max_iters
        self.random_state = random_state
        self.centroids = None
        self.labels = None
        self.cluster_names = {}
    
    def _euclidean_distance(self, a, b):
        return np.sqrt(np.sum((a - b) ** 2))
    
    def _assign_clusters(self, X):
        labels = []
        for point in X:
            distances = [self._euclidean_distance(point, c) for c in self.centroids]
            labels.append(np.argmin(distances))
        return np.array(labels)
    
    def _update_centroids(self, X, labels):
        new_centroids = []
        for k in range(self.n_clusters):
            cluster_points = X[labels == k]
            if len(cluster_points) > 0:
                new_centroids.append(np.mean(cluster_points, axis=0))
            else:
                new_centroids.append(self.centroids[k])
        return np.array(new_centroids)
    
    def fit(self, X):
        X = np.array(X, dtype=float)
        np.random.seed(self.random_state)
        
        idx = np.random.choice(len(X), self.n_clusters, replace=False)
        self.centroids = X[idx].copy()
        
        for _ in range(self.max_iters):
            old_centroids = self.centroids.copy()
            
            self.labels = self._assign_clusters(X)
            
            self.centroids = self._update_centroids(X, self.labels)
            
            if np.allclose(old_centroids, self.centroids, atol=1e-6):
                break

        for k in range(self.n_clusters):
            cluster_points = X[self.labels == k]
            if len(cluster_points) > 0:
                avg = np.mean(cluster_points[:, 0])
                if avg >= 75:
                    self.cluster_names[k] = "High Performer"
                elif avg >= 55:
                    self.cluster_names[k] = "Average Performer"
                else:
                    self.cluster_names[k] = "At Risk"
            else:
                self.cluster_names[k] = "Average Performer"
        
        return self
    
    def predict(self, X):
        X = np.array(X, dtype=float)
        if X.ndim == 1:
            X = X.reshape(1, -1)
        return self._assign_clusters(X)
    
    def get_cluster_name(self, cluster_id):
        return self.cluster_names.get(int(cluster_id), "Average Performer")
    
    def save(self, path):
        joblib.dump({
            "centroids": self.centroids,
            "cluster_names": self.cluster_names,
            "n_clusters": self.n_clusters
        }, path)
    
    def load(self, path):
        data = joblib.load(path)
        self.centroids = data["centroids"]
        self.cluster_names = data["cluster_names"]
        self.n_clusters = data["n_clusters"]
        return self


# ============================================================
# ALGORITHM 4: RANDOM FOREST

class DecisionNode:
    def __init__(self, feature=None, threshold=None, left=None, right=None, value=None):
        self.feature = feature      # which feature to split on
        self.threshold = threshold  # split threshold value
        self.left = left            # left subtree (feature <= threshold)
        self.right = right          # right subtree (feature > threshold)
        self.value = value          # leaf value (prediction)


class DecisionTree:
    
    def __init__(self, max_depth=5, min_samples_split=2):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.root = None
    
    def _mse(self, y):
        if len(y) == 0:
            return 0
        return np.var(y) * len(y)
    
    def _best_split(self, X, y):
        best_mse = float('inf')
        best_feature = None
        best_threshold = None
        
        n_features = X.shape[1]
        
        for feature in range(n_features):
            thresholds = np.unique(X[:, feature])
            
            for threshold in thresholds:
                left_mask = X[:, feature] <= threshold
                right_mask = ~left_mask
                
                if left_mask.sum() < self.min_samples_split or right_mask.sum() < self.min_samples_split:
                    continue
                
                mse = self._mse(y[left_mask]) + self._mse(y[right_mask])
                
                if mse < best_mse:
                    best_mse = mse
                    best_feature = feature
                    best_threshold = threshold
        
        return best_feature, best_threshold
    
    def _build_tree(self, X, y, depth=0):

        # stopping conditions
        if depth >= self.max_depth or len(y) < self.min_samples_split:
            return DecisionNode(value=np.mean(y))
        
        # find best split
        feature, threshold = self._best_split(X, y)
        
        if feature is None:
            return DecisionNode(value=np.mean(y))
        
        # split data
        left_mask = X[:, feature] <= threshold
        right_mask = ~left_mask
        
        # recursively build subtrees
        left = self._build_tree(X[left_mask], y[left_mask], depth + 1)
        right = self._build_tree(X[right_mask], y[right_mask], depth + 1)
        
        return DecisionNode(feature=feature, threshold=threshold, left=left, right=right)
    
    def fit(self, X, y):
        X = np.array(X, dtype=float)
        y = np.array(y, dtype=float)
        self.root = self._build_tree(X, y)
        return self
    
    def _predict_single(self, x, node):

        if node.value is not None:
            return node.value
        
        if x[node.feature] <= node.threshold:
            return self._predict_single(x, node.left)
        else:
            return self._predict_single(x, node.right)
    
    def predict(self, X):
        X = np.array(X, dtype=float)
        return np.array([self._predict_single(x, self.root) for x in X])


class RandomForest:
    
    def __init__(self, n_trees=10, max_depth=5, min_samples_split=2,
                 max_features=None, random_state=42):
        self.n_trees = n_trees
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.random_state = random_state
        self.trees = []
        self.feature_indices = []
    
    def _bootstrap_sample(self, X, y, seed):

        np.random.seed(seed)
        n = len(X)
        idx = np.random.choice(n, n, replace=True)
        return X[idx], y[idx]
    
    def fit(self, X, y):
        X = np.array(X, dtype=float)
        y = np.array(y, dtype=float)
        
        n_features = X.shape[1]
        if self.max_features is None:
            # use sqrt(n_features) by default
            self.max_features = max(1, int(np.sqrt(n_features)))
        
        self.trees = []
        self.feature_indices = []
        
        for i in range(self.n_trees):
            # bootstrap sample
            X_sample, y_sample = self._bootstrap_sample(X, y, self.random_state + i)
            
            # random feature subset
            np.random.seed(self.random_state + i)
            feat_idx = np.random.choice(n_features, self.max_features, replace=False)
            self.feature_indices.append(feat_idx)
            
            # train tree on feature subset
            tree = DecisionTree(
                max_depth=self.max_depth,
                min_samples_split=self.min_samples_split
            )
            tree.fit(X_sample[:, feat_idx], y_sample)
            self.trees.append(tree)
        
        return self
    
    def predict(self, X):
        X = np.array(X, dtype=float)
        
        predictions = []
        for tree, feat_idx in zip(self.trees, self.feature_indices):
            pred = tree.predict(X[:, feat_idx])
            predictions.append(pred)
        
        return np.mean(predictions, axis=0)
    
    def score(self, X, y):

        X = np.array(X, dtype=float)
        y = np.array(y, dtype=float)
        
        y_pred = self.predict(X)
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        
        if ss_tot == 0:
            return 1.0
        return 1 - ss_res / ss_tot
    
    def save(self, path):
        joblib.dump({
            "trees": self.trees,
            "feature_indices": self.feature_indices,
            "n_trees": self.n_trees,
            "max_features": self.max_features
        }, path)
    
    def load(self, path):
        data = joblib.load(path)
        self.trees = data["trees"]
        self.feature_indices = data["feature_indices"]
        self.n_trees = data["n_trees"]
        self.max_features = data["max_features"]
        return self


# ============================================================
# FEATURE ENGINEERING

class StandardScaler:
    
    def __init__(self):
        self.mean = None
        self.std = None
    
    def fit_transform(self, X):
        X = np.array(X, dtype=float)
        self.mean = np.mean(X, axis=0)
        self.std = np.std(X, axis=0)
        self.std[self.std == 0] = 1  # avoid division by zero
        return (X - self.mean) / self.std
    
    def transform(self, X):
        X = np.array(X, dtype=float)
        return (X - self.mean) / self.std
    
    def save(self, path):
        joblib.dump({"mean": self.mean, "std": self.std}, path)
    
    def load(self, path):
        data = joblib.load(path)
        self.mean = data["mean"]
        self.std = data["std"]
        return self


def prepare_features(scores, attendance_rate, cluster_label=0):

    if not scores:
        return None
    
    scores_arr = np.array(scores, dtype=float)
    
    avg_score = np.mean(scores_arr)
    trend = float(scores_arr[-1] - scores_arr[0]) if len(scores_arr) >= 2 else 0.0
    recent_avg = float(np.mean(scores_arr[-3:])) if len(scores_arr) >= 3 else float(scores_arr[-1])
    consistency = float(np.std(scores_arr)) if len(scores_arr) > 1 else 0.0
    max_score = float(np.max(scores_arr))
    min_score = float(np.min(scores_arr))
    exam_count = float(len(scores_arr))
    
    return np.array([
        avg_score,
        attendance_rate,
        trend,
        recent_avg,
        consistency,
        max_score,
        min_score,
        exam_count,
        float(cluster_label)
    ]).reshape(1, -1)


def get_grade(score):

    if score >= 90: return "A+"
    if score >= 80: return "A"
    if score >= 70: return "B+"
    if score >= 60: return "B"
    if score >= 50: return "C"
    if score >= 40: return "D"
    return "F"


def clamp(value, min_val=0, max_val=100):

    return int(min(max_val, max(min_val, round(float(value)))))