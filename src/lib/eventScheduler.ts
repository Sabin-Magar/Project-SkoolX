export type SchedulableEvent = {
  id: number;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  priority: number;         // 1 (lowest) – 10 (highest)
  targetRole: string;       // ALL | ADMIN | TEACHER | STUDENT | PARENT
  classId: number | null;
  class: { name: string } | null;
};

export type ScheduledEvent = SchedulableEvent & {
  scheduledScore: number;   // combined Priority + EDF score (0–1)
  urgencyScore: number;     // EDF component (0–1)
  priorityScore: number;    // Priority component (0–1)
  status: "upcoming" | "ongoing" | "completed";
};

// ── Constants ────────────────────────────────────────────────────────────────
const PRIORITY_WEIGHT = 0.6;  // weight for Priority Scheduling component
const EDF_WEIGHT      = 0.4;  // weight for EDF component
const MAX_WINDOW_MS   = 7 * 24 * 60 * 60 * 1000; // 7 days as urgency window

// ── Clamp helper ─────────────────────────────────────────────────────────────
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

// ── Status classifier ─────────────────────────────────────────────────────────
function classifyStatus(
  startTime: Date,
  endTime: Date,
  now: Date
): "upcoming" | "ongoing" | "completed" {
  if (now < startTime) return "upcoming";
  if (now >= startTime && now <= endTime) return "ongoing";
  return "completed";
}

// ── COMBINED PRIORITY + EDF SCHEDULER ────────────────────────────────────────
export function scheduleEvents(
  events: SchedulableEvent[],
  now: Date = new Date()
): ScheduledEvent[] {
  return events
    .map((event) => {
      // Normalise priority from 1–10 to 0–1
      const priorityScore = (event.priority - 1) / 9;

      // Time remaining until deadline (endTime)
      const msUntilEnd   = event.endTime.getTime() - now.getTime();
      // Urgency: 1 = deadline passed/now, 0 = far in future
      const urgencyScore = 1 - clamp(msUntilEnd / MAX_WINDOW_MS, 0, 1);

      // ── Combined score (Priority 60% + EDF 40%) ───────────────────────
      const scheduledScore =
        priorityScore * PRIORITY_WEIGHT + urgencyScore * EDF_WEIGHT;

      return {
        ...event,
        scheduledScore,
        urgencyScore,
        priorityScore,
        status: classifyStatus(event.startTime, event.endTime, now),
      };
    })

    .sort((a, b) => {
      const diff = b.scheduledScore - a.scheduledScore;
      if (Math.abs(diff) > 0.0001) return diff;
      return a.endTime.getTime() - b.endTime.getTime(); // pure EDF tie-break
    });
}

// ── PRIORITY-ONLY SORT ────────────────────────────────────────────────────────
export function sortByPriority(events: SchedulableEvent[]): SchedulableEvent[] {
  return [...events].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    // EDF tie-break
    return a.endTime.getTime() - b.endTime.getTime();
  });
}

// ── EDF-ONLY SORT ─────────────────────────────────────────────────────────────
export function sortByEDF(events: SchedulableEvent[]): SchedulableEvent[] {
  return [...events].sort((a, b) => {
    const diff = a.endTime.getTime() - b.endTime.getTime();
    if (diff !== 0) return diff;
    return b.priority - a.priority; // priority tie-break
  });
}

// ── ROLE FILTER ───────────────────────────────────────────────────────────────
export function filterEventsByRole(
  events: SchedulableEvent[],
  role: string,
  userId: string
): SchedulableEvent[] {
  return events.filter((event) => {
    if (event.targetRole === "ALL") return true;
    if (event.targetRole === role.toUpperCase()) return true;
    return false;
  });
}

// ── PRIORITY LABEL ────────────────────────────────────────────────────────────
export function getPriorityLabel(priority: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (priority >= 9) return { label: "Critical",  color: "text-red-700",    bg: "bg-red-100"    };
  if (priority >= 7) return { label: "High",      color: "text-orange-700", bg: "bg-orange-100" };
  if (priority >= 5) return { label: "Medium",    color: "text-yellow-700", bg: "bg-yellow-100" };
  if (priority >= 3) return { label: "Low",       color: "text-blue-700",   bg: "bg-blue-100"   };
  return               { label: "Minimal",   color: "text-gray-600",   bg: "bg-gray-100"   };
}