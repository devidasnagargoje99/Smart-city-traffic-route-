import numpy as np
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

class TrafficPredictionService:
    def __init__(self):
        self.model = None
        self.is_trained = False
        self.metrics: Dict[str, Any] = {}
        self.baseline_metrics: Dict[str, Any] = {}
        self.training_timestamp: Optional[datetime] = None
        self._train_initial_model()

    def _generate_synthetic_historical_data(self) -> pd.DataFrame:
        """
        Generate 30 days of hourly observations representing Pune Hinjawadi commute patterns.
        Morning peak: 08:30 - 11:30 (hours 8, 9, 10, 11)
        Evening peak: 17:30 - 21:00 (hours 17, 18, 19, 20)
        """
        np.random.seed(42)
        n_days = 30
        records = []

        categories = {
            "expressway": {"base_speed": 70.0, "code": 1, "dist_range": (1500, 3000)},
            "arterial": {"base_speed": 45.0, "code": 2, "dist_range": (800, 2000)},
            "sub_arterial": {"base_speed": 40.0, "code": 3, "dist_range": (600, 1500)},
            "local": {"base_speed": 30.0, "code": 4, "dist_range": (300, 800)}
        }

        for day in range(n_days):
            day_of_week = day % 7
            is_weekend = 1 if day_of_week in [5, 6] else 0

            for hour in range(24):
                # Congestion curve
                if is_weekend:
                    rush_factor = 0.85 if 12 <= hour <= 20 else 1.0
                else:
                    if 8 <= hour <= 11:
                        # Morning rush (inbound to Phase 1/2/3)
                        rush_factor = 0.40 + 0.15 * np.random.uniform(0, 1)
                    elif 17 <= hour <= 20:
                        # Evening rush (outbound from Hinjawadi)
                        rush_factor = 0.35 + 0.15 * np.random.uniform(0, 1)
                    elif 12 <= hour <= 16:
                        rush_factor = 0.75 + 0.10 * np.random.uniform(0, 1)
                    else:
                        rush_factor = 0.95 + 0.05 * np.random.uniform(0, 1)

                for cat_name, cat_props in categories.items():
                    speed = max(10.0, cat_props["base_speed"] * rush_factor + np.random.normal(0, 2.5))
                    dist = np.random.uniform(cat_props["dist_range"][0], cat_props["dist_range"][1])
                    travel_time_sec = dist / (speed * 1000.0 / 3600.0)

                    records.append({
                        "day": day,
                        "hour": hour,
                        "day_of_week": day_of_week,
                        "is_weekend": is_weekend,
                        "category_code": cat_props["code"],
                        "distance_m": dist,
                        "speed_kmh": speed,
                        "travel_time_sec": travel_time_sec
                    })

        df = pd.DataFrame(records)
        df["prev_hour_speed"] = df.groupby(["category_code"])["speed_kmh"].shift(1).bfill()
        return df

    def _train_initial_model(self):
        """Train model chronologically to avoid temporal leakage."""
        df = self._generate_synthetic_historical_data()

        # Chronological split: first 22 days train, last 8 days test
        train_df = df[df["day"] < 22]
        test_df = df[df["day"] >= 22]

        feature_cols = ["hour", "day_of_week", "is_weekend", "category_code", "distance_m", "prev_hour_speed"]
        X_train = train_df[feature_cols]
        y_train = train_df["travel_time_sec"]

        X_test = test_df[feature_cols]
        y_test = test_df["travel_time_sec"]

        # Baseline: Historical Mean by (hour, category_code)
        grouped_means = train_df.groupby(["hour", "category_code"])["travel_time_sec"].mean().to_dict()
        baseline_preds = test_df.apply(
            lambda row: grouped_means.get((row["hour"], row["category_code"]), train_df["travel_time_sec"].mean()),
            axis=1
        )

        base_mae = mean_absolute_error(y_test, baseline_preds)
        base_rmse = root_mean_squared_error(y_test, baseline_preds)

        # Scikit-learn Ridge Regression Model
        model = Ridge(alpha=1.0)
        model.fit(X_train, y_train)
        preds = model.predict(X_test)

        ml_mae = mean_absolute_error(y_test, preds)
        ml_rmse = root_mean_squared_error(y_test, preds)

        self.model = model
        self.is_trained = True
        self.training_timestamp = datetime.now(timezone.utc)
        self.feature_names = feature_cols

        self.baseline_metrics = {
            "model_type": "Historical Hour-Category Average Baseline",
            "test_sample_count": len(test_df),
            "mae_seconds": round(float(base_mae), 2),
            "rmse_seconds": round(float(base_rmse), 2)
        }

        self.metrics = {
            "model_type": "Scikit-Learn Ridge Traffic Predictor",
            "features_used": feature_cols,
            "training_samples": len(train_df),
            "test_samples": len(test_df),
            "mae_seconds": round(float(ml_mae), 2),
            "rmse_seconds": round(float(ml_rmse), 2),
            "mae_improvement_pct": round(float((base_mae - ml_mae) / base_mae * 100.0), 1),
            "training_time": self.training_timestamp.isoformat()
        }

    def predict_travel_time(self, hour: int, day_of_week: int, distance_m: float, road_category: str = "arterial", current_speed_kmh: float = 40.0) -> Dict[str, Any]:
        cat_map = {"expressway": 1, "arterial": 2, "sub_arterial": 3, "local": 4}
        cat_code = cat_map.get(road_category, 2)
        is_weekend = 1 if day_of_week in [5, 6] else 0

        features = np.array([[hour, day_of_week, is_weekend, cat_code, distance_m, current_speed_kmh]])
        pred_time_sec = float(self.model.predict(features)[0])
        pred_time_sec = max(distance_m / (80.0 * 1000 / 3600), pred_time_sec)

        return {
            "predicted_travel_time_sec": round(pred_time_sec, 1),
            "predicted_travel_time_min": round(pred_time_sec / 60.0, 1),
            "hour": hour,
            "road_category": road_category,
            "distance_m": distance_m,
            "model_confidence_rmse_sec": self.metrics["rmse_seconds"]
        }

    def get_evaluation_report(self) -> Dict[str, Any]:
        return {
            "is_trained": self.is_trained,
            "trained_at": self.training_timestamp.isoformat() if self.training_timestamp else None,
            "baseline_model": self.baseline_metrics,
            "ml_model": self.metrics,
            "area": "Hinjawadi IT Park, Pune"
        }

prediction_service = TrafficPredictionService()
