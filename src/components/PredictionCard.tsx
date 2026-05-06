// PredictionCard.tsx
// Displays ML prediction results with beautiful UI
// Used in: students/[id]/page.tsx

import { getStudentPrediction } from "@/lib/predictionService";

// const PredictionCard = async ({ studentId }: { studentId: string }) => {
//   const data = await getStudentPrediction(studentId);

//   if (!data) {
//     return (
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//         <h2 className="text-lg font-semibold text-gray-700 mb-2">
//           Result Prediction
//         </h2>
//         <div className="flex flex-col items-center justify-center py-8 text-center">
//           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
//             <span className="text-2xl">📊</span>
//           </div>
//           <p className="text-gray-400 text-sm">
//             Not enough data to generate prediction.
//           </p>
//           <p className="text-gray-300 text-xs mt-1">
//             Student needs at least 2 exam results.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // score color
//   const scoreColor =
//     data.predicted_score >= 80
//       ? "text-green-500"
//       : data.predicted_score >= 60
//       ? "text-yellow-500"
//       : "text-red-500";

//   // grade color
//   const gradeColor =
//     data.grade === "A+" || data.grade === "A"
//       ? "bg-green-100 text-green-700"
//       : data.grade === "B+" || data.grade === "B"
//       ? "bg-blue-100 text-blue-700"
//       : data.grade === "C"
//       ? "bg-yellow-100 text-yellow-700"
//       : "bg-red-100 text-red-700";

//   // trend
//   const trendIcon =
//     data.trend === "Improving" ? "↑" : data.trend === "Declining" ? "↓" : "→";
//   const trendColor =
//     data.trend === "Improving"
//       ? "text-green-600 bg-green-50"
//       : data.trend === "Declining"
//       ? "text-red-600 bg-red-50"
//       : "text-yellow-600 bg-yellow-50";

//   // cluster color
//   const clusterColor =
//     data.cluster === "High Performer"
//       ? "bg-purple-100 text-purple-700"
//       : data.cluster === "Average Performer"
//       ? "bg-blue-100 text-blue-700"
//       : "bg-red-100 text-red-700";

//   // confidence bar width
//   const confidenceWidth = Math.round(data.rf_confidence * 100);

//   // mini bar chart for past scores
//   const maxScore = Math.max(...data.past_scores, data.predicted_score);

//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
//       {/* header */}
//       <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100">
//         <div className="flex items-center justify-between">
//           <h2 className="text-lg font-semibold text-gray-700">
//             Result Prediction
//           </h2>
//           <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full border">
//             ML Powered
//           </span>
//         </div>
//       </div>

//       <div className="p-6 space-y-5">
//         {/* at risk warning */}
//         {data.is_at_risk && (
//           <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
//             <span className="text-red-500 text-lg">⚠️</span>
//             <div>
//               <p className="text-red-700 text-sm font-medium">
//                 At-Risk Student Detected
//               </p>
//               <p className="text-red-500 text-xs">
//                 This student may need additional support.
//               </p>
//             </div>
//           </div>
//         )}

//         {/* main predicted score */}
//         <div className="flex items-center justify-between">
//           <div>
//             <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
//               Predicted Next Score
//             </p>
//             <div className="flex items-end gap-2">
//               <span className={`text-5xl font-bold ${scoreColor}`}>
//                 {data.predicted_score}
//               </span>
//               <span className="text-gray-300 text-xl mb-1">/100</span>
//             </div>
//           </div>
//           <div className="flex flex-col items-end gap-2">
//             <span className={`text-sm font-semibold px-3 py-1 rounded-full ${gradeColor}`}>
//               Grade {data.grade}
//             </span>
//             <span className={`text-xs font-medium px-2 py-1 rounded-full ${trendColor}`}>
//               {trendIcon} {data.trend}
//             </span>
//             <span className={`text-xs px-2 py-1 rounded-full ${clusterColor}`}>
//               {data.cluster}
//             </span>
//           </div>
//         </div>

//         {/* stats grid */}
//         <div className="grid grid-cols-3 gap-3">
//           <div className="bg-gray-50 rounded-lg p-3 text-center">
//             <p className="text-lg font-bold text-gray-700">{data.average_score}</p>
//             <p className="text-xs text-gray-400">Avg Score</p>
//           </div>
//           <div className="bg-gray-50 rounded-lg p-3 text-center">
//             <p className="text-lg font-bold text-gray-700">{data.attendance_rate}%</p>
//             <p className="text-xs text-gray-400">Attendance</p>
//           </div>
//           <div className="bg-gray-50 rounded-lg p-3 text-center">
//             <p className="text-lg font-bold text-gray-700">{data.total_exams}</p>
//             <p className="text-xs text-gray-400">Exams</p>
//           </div>
//         </div>

//         {/* score history chart */}
//         <div>
//           <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
//             Score History + Prediction
//           </p>
//           <div className="flex items-end gap-1 h-20">
//             {data.past_scores.map((score, i) => (
//               <div
//                 key={i}
//                 className="flex-1 flex flex-col items-center gap-1"
//                 title={`Exam ${i + 1}: ${score}`}
//               >
//                 <div
//                   className="w-full bg-blue-400 rounded-t-sm transition-all"
//                   style={{ height: `${(score / maxScore) * 100}%` }}
//                 />
//               </div>
//             ))}
//             {/* predicted bar */}
//             <div className="flex-1 flex flex-col items-center gap-1" title={`Predicted: ${data.predicted_score}`}>
//               <div
//                 className="w-full bg-purple-400 rounded-t-sm border-2 border-dashed border-purple-500 transition-all"
//                 style={{ height: `${(data.predicted_score / maxScore) * 100}%` }}
//               />
//             </div>
//           </div>
//           <div className="flex justify-end gap-3 mt-1">
//             <div className="flex items-center gap-1">
//               <div className="w-3 h-3 bg-blue-400 rounded-sm" />
//               <span className="text-xs text-gray-400">Past</span>
//             </div>
//             <div className="flex items-center gap-1">
//               <div className="w-3 h-3 bg-purple-400 rounded-sm" />
//               <span className="text-xs text-gray-400">Predicted</span>
//             </div>
//           </div>
//         </div>

//         {/* algorithm predictions breakdown */}
//         <div>
//           <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
//             Algorithm Breakdown
//           </p>
//           <div className="space-y-2">
//             <div className="flex items-center justify-between text-sm">
//               <div className="flex items-center gap-2">
//                 <div className="w-2 h-2 bg-blue-400 rounded-full" />
//                 <span className="text-gray-500">Linear Regression</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-20 bg-gray-100 rounded-full h-1.5">
//                   <div
//                     className="bg-blue-400 h-1.5 rounded-full"
//                     style={{ width: `${data.linear_predicted}%` }}
//                   />
//                 </div>
//                 <span className="font-medium text-gray-700 w-6 text-right">
//                   {data.linear_predicted}
//                 </span>
//               </div>
//             </div>
//             <div className="flex items-center justify-between text-sm">
//               <div className="flex items-center gap-2">
//                 <div className="w-2 h-2 bg-green-400 rounded-full" />
//                 <span className="text-gray-500">Polynomial Regression</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-20 bg-gray-100 rounded-full h-1.5">
//                   <div
//                     className="bg-green-400 h-1.5 rounded-full"
//                     style={{ width: `${data.poly_predicted}%` }}
//                   />
//                 </div>
//                 <span className="font-medium text-gray-700 w-6 text-right">
//                   {data.poly_predicted}
//                 </span>
//               </div>
//             </div>
//             <div className="flex items-center justify-between text-sm">
//               <div className="flex items-center gap-2">
//                 <div className="w-2 h-2 bg-purple-400 rounded-full" />
//                 <span className="text-gray-500">Random Forest</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-20 bg-gray-100 rounded-full h-1.5">
//                   <div
//                     className="bg-purple-400 h-1.5 rounded-full"
//                     style={{ width: `${data.rf_predicted}%` }}
//                   />
//                 </div>
//                 <span className="font-medium text-gray-700 w-6 text-right">
//                   {data.rf_predicted}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* confidence */}
//         <div>
//           <div className="flex justify-between items-center mb-1">
//             <p className="text-xs text-gray-400 uppercase tracking-wide">
//               Model Confidence
//             </p>
//             <span className="text-xs font-medium text-gray-600">
//               {data.confidence_label} ({confidenceWidth}%)
//             </span>
//           </div>
//           <div className="w-full bg-gray-100 rounded-full h-2">
//             <div
//               className={`h-2 rounded-full transition-all ${
//                 confidenceWidth >= 85
//                   ? "bg-green-400"
//                   : confidenceWidth >= 70
//                   ? "bg-blue-400"
//                   : confidenceWidth >= 50
//                   ? "bg-yellow-400"
//                   : "bg-red-400"
//               }`}
//               style={{ width: `${confidenceWidth}%` }}
//             />
//           </div>
//         </div>

//         {/* high low */}
//         <div className="flex gap-3">
//           <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
//             <p className="text-green-600 font-bold text-lg">{data.highest_score}</p>
//             <p className="text-green-500 text-xs">Best Score</p>
//           </div>
//           <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
//             <p className="text-red-500 font-bold text-lg">{data.lowest_score}</p>
//             <p className="text-red-400 text-xs">Lowest Score</p>
//           </div>
//         </div>

//         {/* footer note */}
//         <p className="text-xs text-gray-300 text-center pt-2 border-t border-gray-50">
//           Prediction uses Linear Regression, Polynomial Regression,
//           K-Means Clustering & Random Forest algorithms
//         </p>
//       </div>
//     </div>
//   );
// };

// export default PredictionCard;

// src/components/PredictionCard.tsx

const PredictionCard = async ({ studentId }: { studentId: string }) => {
  const data = await getStudentPrediction(studentId);

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
           Result Prediction
       </h2>
        <div className="flex flex-col items-center py-8 text-center gap-2">
          <i className="ti ti-chart-bar text-3xl text-gray-300" />
          <p className="text-gray-400 text-sm">Not enough data to predict.</p>
          <p className="text-gray-300 text-xs">Student needs at least 2 exam results.</p>
        </div>
      </div>
    );
  }

  const gradeColor = data.grade === "A+" || data.grade === "A"
    ? "bg-green-50 text-green-800 border-green-200"
    : data.grade === "B+" || data.grade === "B"
    ? "bg-blue-50 text-blue-800 border-blue-200"
    : data.grade === "C"
    ? "bg-yellow-50 text-yellow-800 border-yellow-200"
    : "bg-red-50 text-red-800 border-red-200";

  const trendIcon = data.trend === "Improving" ? "ti-trending-up"
    : data.trend === "Declining" ? "ti-trending-down" : "ti-minus";

  const trendColor = data.trend === "Improving"
    ? "bg-green-50 text-green-800"
    : data.trend === "Declining"
    ? "bg-red-50 text-red-800"
    : "bg-yellow-50 text-yellow-800";

  const clusterColor = data.cluster === "High Performer"
    ? "bg-purple-50 text-purple-800 border-purple-300 border-2"
    : data.cluster === "Average Performer"
    ? "bg-gray-50 text-gray-600"
    : "bg-red-50 text-red-700";

  const confidenceWidth = Math.round(data.rf_confidence * 100);
  const confidenceColor = confidenceWidth >= 85 ? "bg-green-400"
    : confidenceWidth >= 70 ? "bg-blue-400"
    : confidenceWidth >= 50 ? "bg-yellow-400" : "bg-red-400";

  const maxScore = Math.max(...data.past_scores, data.predicted_score);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Result Prediction</h2>
            <p className="text-sm font-medium text-gray-700">Next exam score forecast</p>
          </div>
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
            <i className="ti ti-sparkles text-xs" /> AI powered
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">

        {/* At risk warning */}
        {data.is_at_risk && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <i className="ti ti-alert-triangle text-red-500 text-lg mt-0.5" />
            <div>
              <p className="text-red-700 text-sm font-medium">At-risk student detected</p>
              <p className="text-red-500 text-xs mt-0.5">This student may need additional academic support.</p>
            </div>
          </div>
        )}

        {/* Main score */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Predicted next score</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-medium ${
                data.predicted_score >= 80 ? "text-green-600"
                : data.predicted_score >= 60 ? "text-yellow-600"
                : "text-red-500"
              }`}>{data.predicted_score}</span>
              <span className="text-gray-300 text-xl">/100</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${gradeColor}`}>
              Grade {data.grade}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${trendColor}`}>
              <i className={`ti ${trendIcon} text-xs`} /> {data.trend}
            </span>
            <span className={`text-xs px-2 py-1 rounded-lg ${clusterColor}`}>
              {data.cluster}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Avg score", value: data.average_score },
            { label: "Attendance", value: `${data.attendance_rate}%` },
            { label: "Exams taken", value: data.total_exams },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-sm font-medium text-gray-700">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Score history chart */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Score history</p>
          <div className="flex items-end gap-1.5 h-20">
            {data.past_scores.map((score, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`Exam ${i + 1}: ${score}`}>
                <div
                  className="w-full bg-blue-400 rounded-t"
                  style={{ height: `${(score / maxScore) * 100}%` }}
                />
              </div>
            ))}
            <div className="flex-1 flex flex-col items-center" title={`Predicted: ${data.predicted_score}`}>
              <div
                className="w-full bg-green-400 rounded-t border-2 border-dashed border-green-500"
                style={{ height: `${(data.predicted_score / maxScore) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-3 h-3 bg-blue-400 rounded-sm inline-block" /> Past
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-3 h-3 bg-green-400 rounded-sm inline-block" /> Predicted
            </span>
          </div>
        </div>

        {/* Algorithm breakdown */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Algorithm breakdown</p>
          <div className="space-y-3">
            {[
              { label: "Linear regression", desc: "straight-line trend", value: data.linear_predicted, color: "bg-blue-400" },
              { label: "Polynomial regression", desc: "curved trend", value: data.poly_predicted, color: "bg-purple-400" },
              { label: "Random forest", desc: "ensemble prediction", value: data.rf_predicted, color: "bg-green-400" },
            ].map((algo, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${algo.color}`} />
                    <span className="text-sm text-gray-700">{algo.label}</span>
                    <span className="text-xs text-gray-400">{algo.desc}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{algo.value}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-1.5">
                  <div className={`${algo.color} h-1.5 rounded-full`} style={{ width: `${algo.value}%` }} />
                </div>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-gray-700">Final prediction</span>
                  <span className="text-xs text-gray-400">weighted average</span>
                </div>
                <span className="text-base font-medium text-amber-600">{data.predicted_score}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${data.predicted_score}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* K-Means clusters */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">K-means cluster analysis</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: "High performer", desc: "Avg > 75%", icon: "ti-award", active: data.cluster === "High Performer", activeClass: "bg-purple-50 border-purple-300 border-2" },
              { name: "Average performer", desc: "Score 55–75%", icon: "ti-user", active: data.cluster === "Average Performer", activeClass: "bg-blue-50 border-blue-300 border-2" },
              { name: "At risk", desc: "Score < 55%", icon: "ti-alert-triangle", active: data.cluster === "At Risk", activeClass: "bg-red-50 border-red-300 border-2" },
            ].map((c, i) => (
              <div key={i} className={`rounded-lg p-3 border ${c.active ? c.activeClass : "bg-gray-50 border-gray-100"}`}>
                <i className={`ti ${c.icon} text-sm ${c.active ? "text-purple-600" : "text-gray-400"}`} />
                <p className={`text-xs font-medium mt-1 ${c.active ? "text-purple-800" : "text-gray-500"}`}>{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Model confidence</p>
            <span className="text-xs font-medium text-gray-600">{data.confidence_label} ({confidenceWidth}%)</span>
          </div>
          <div className="bg-gray-100 rounded-full h-2">
            <div className={`${confidenceColor} h-2 rounded-full`} style={{ width: `${confidenceWidth}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-300">
            <span>Low</span><span>Moderate</span><span>Excellent</span>
          </div>
        </div>

        {/* Best / Worst */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-400">
            <p className="text-xs text-green-600 mb-1"><i className="ti ti-arrow-up" /> Best score</p>
            <p className="text-xl font-medium text-green-700">{data.highest_score}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-400">
            <p className="text-xs text-red-500 mb-1"><i className="ti ti-arrow-down" /> Lowest score</p>
            <p className="text-xl font-medium text-red-600">{data.lowest_score}</p>
          </div>
        </div>

        {/* Footer note */}
        <div className="bg-gray-50 rounded-lg p-3 border-l-3 border-purple-300">
          <p className="text-xs text-gray-500 leading-relaxed">
            <i className="ti ti-info-circle text-purple-400" /> Prediction uses <strong>linear regression</strong>, <strong>polynomial regression</strong>, <strong>K-means clustering</strong> and <strong>random forest</strong>. Accuracy improves with more exam data.
          </p>
        </div>

      </div>
    </div>
  );
};

export default PredictionCard;