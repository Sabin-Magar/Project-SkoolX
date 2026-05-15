"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { markAttendance } from "@/lib/actions";

type Student = { id: string; name: string; surname: string };

type Props = {
  classes: { id: number; name: string }[];
};

const AttendanceMarkForm = ({ classes }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── TODAY ONLY — no date picker, locked to current date ──────────────────
  const today = new Date().toISOString().split("T")[0];
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).format(new Date());

  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents]               = useState<Student[]>([]);
  const [attendance, setAttendance]           = useState<Record<string, boolean>>({});
  const [loading, setLoading]                 = useState(false);
  const [alreadyMarked, setAlreadyMarked]     = useState(false);

  // Fetch students + existing records for TODAY when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setAttendance({});
      return;
    }
    setLoading(true);
    fetch(`/api/attendance?classId=${selectedClassId}&date=${today}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        setStudents(res.students ?? []);
        setAlreadyMarked(res.alreadyMarked ?? false);
        const init: Record<string, boolean> = {};
        (res.students ?? []).forEach((s: Student) => {
          init[s.id] = res.existingMap?.[s.id] !== undefined
            ? res.existingMap[s.id]
            : true; // default: present
        });
        setAttendance(init);
      })
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoading(false));
  }, [selectedClassId, today]);

  const toggle  = (id: string) => setAttendance((p) => ({ ...p, [id]: !p[id] }));
  const markAll = (present: boolean) => {
    const updated: Record<string, boolean> = {};
    students.forEach((s) => { updated[s.id] = present; });
    setAttendance(updated);
  };

  const handleSubmit = () => {
    if (!selectedClassId || !students.length) {
      toast.error("Select a class first.");
      return;
    }
    const formData = new FormData();
    formData.append("classId", selectedClassId);
    formData.append("date",    today);
    formData.append("records", JSON.stringify(
      students.map((s) => ({ studentId: s.id, present: attendance[s.id] ?? true }))
    ));

    startTransition(async () => {
      const res = await markAttendance({ success: false, error: false }, formData);
      if (res.success) {
        toast.success("Attendance saved!");
        setAlreadyMarked(true);
        router.refresh();
      } else {
        toast.error(res.message ?? "Failed to save attendance.");
      }
    });
  };

  const presentCount = students.filter((s) => attendance[s.id]).length;
  const absentCount  = students.length - presentCount;

  return (
    <div className="bg-white rounded-xl border border-gray-100">

      {/* ── Header ── */}
      <div className="p-5 border-b border-gray-100">
        {/* Date display — locked to today */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Marking attendance for
            </p>
            <p className="text-base font-semibold text-gray-800">{todayLabel}</p>
          </div>
          <div className="bg-lamaSkyLight text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full">
            Today only
          </div>
        </div>

        {/* Class selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Class
          </label>
          <select
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm bg-white focus:ring-lamaSky focus:outline-none"
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setStudents([]);
              setAttendance({});
            }}
          >
            <option value="">Select a class...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Student list ── */}
      {loading ? (
        <div className="p-10 text-center text-gray-400 text-sm">Loading students...</div>
      ) : students.length > 0 ? (
        <>
          {/* Bulk controls + stats */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-sm">
              {alreadyMarked && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium border border-amber-200">
                  ✏ Editing today&apos;s attendance
                </span>
              )}
              <span className="flex items-center gap-1.5 text-green-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                {presentCount} present
              </span>
              <span className="flex items-center gap-1.5 text-red-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                {absentCount} absent
              </span>
              <span className="text-gray-400 text-xs">{students.length} total</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => markAll(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-medium hover:bg-green-200 transition-colors">
                All present
              </button>
              <button type="button" onClick={() => markAll(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-600 font-medium hover:bg-red-200 transition-colors">
                All absent
              </button>
            </div>
          </div>

          {/* Student rows */}
          <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
            {students.map((s, i) => {
              const isPresent = attendance[s.id] ?? true;
              return (
                <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lamaSky to-lamaPurple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {s.name[0]}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{s.name} {s.surname}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isPresent
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isPresent ? "bg-green-500" : "bg-red-500"}`} />
                    {isPresent ? "Present" : "Absent"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Submit */}
          <div className="p-5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full bg-lamaSky text-white py-2.5 rounded-xl font-medium hover:bg-sky-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {isPending ? "Saving..." : alreadyMarked
                ? `Update today's attendance for ${students.length} students`
                : `Save attendance for ${students.length} students`}
            </button>
          </div>
        </>
      ) : selectedClassId ? (
        <div className="p-10 text-center text-gray-400 text-sm">No students in this class</div>
      ) : (
        <div className="p-10 text-center text-gray-400 text-sm">
          Select a class to begin marking attendance for today
        </div>
      )}
    </div>
  );
};

export default AttendanceMarkForm;