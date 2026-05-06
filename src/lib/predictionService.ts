// predictionService.ts
// Fetches prediction data from Python ML API

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";

export type PredictionData = {
  student_id: string;
  predicted_score: number;
  linear_predicted: number;
  poly_predicted: number;
  rf_predicted: number;
  average_score: number;
  attendance_rate: number;
  total_exams: number;
  highest_score: number;
  lowest_score: number;
  grade: string;
  trend: string;
  trend_value: number;
  cluster: string;
  is_at_risk: boolean;
  rf_confidence: number;
  linear_confidence: number;
  poly_confidence: number;
  confidence_label: string;
  past_scores: number[];
};

export const getStudentPrediction = async (
  studentId: string
): Promise<PredictionData | null> => {
  try {
    const res = await fetch(`${ML_API_URL}/predict/${studentId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};