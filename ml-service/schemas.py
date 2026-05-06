# schemas.py
# Defines the shape of API request and response data

from pydantic import BaseModel
from typing import List, Optional

class PredictionResponse(BaseModel):
    student_id: str
    
    # scores
    predicted_score: int
    linear_predicted: int
    poly_predicted: int
    rf_predicted: int
    
    # student info
    average_score: float
    attendance_rate: float
    total_exams: int
    highest_score: int
    lowest_score: int
    
    # classification
    grade: str
    trend: str
    trend_value: float
    cluster: str
    is_at_risk: bool
    
    # model accuracy
    rf_confidence: float
    linear_confidence: float
    poly_confidence: float
    confidence_label: str
    
    # past scores for chart
    past_scores: List[int]