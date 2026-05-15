import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { ITEM_PER_PAGE } from "@/lib/settings";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import AttendanceMarkForm from "@/components/AttendanceMarkForm";
import Image from "next/image";
import AttendanceClassFilter from "@/components/AttendanceClassFilter";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Merge sort attendance logs by date descending
function mergeSortDesc<T extends { date: Date }>(arr: T[]): T[] {
  if (arr.length <= 1) return arr;
  const mid   = Math.floor(arr.length / 2);
  const left  = mergeSortDesc(arr.slice(0, mid));
  const right = mergeSortDesc(arr.slice(mid));
  const result: T[] = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    result.push(left[i].date >= right[j].date ? left[i++] : right[j++]);
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
}

// Group array by a string key
function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = keyFn(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  }).format(new Date(d));

// ── Page ──────────────────────────────────────────────────────────────────────

const AttendanceListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { userId, sessionClaims } = await auth();
  const role        = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const resolvedParams  = await searchParams;
  const { page, view, classId, search } = resolvedParams;
  const p           = page ? parseInt(page) : 1;
  const activeView  = view || (role === "student" ? "my" : "mark");
  const filterClass = classId ? parseInt(classId) : undefined;

  // ── Classes available to this user ───────────────────────────────────────
  const allClasses = await prisma.class.findMany({
    where:
      role === "teacher"
        ? { lessons: { some: { teacherId: currentUserId! } } }
        : undefined,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // ── Student's own stats ───────────────────────────────────────────────────
  let studentStats = { total: 0, present: 0, absent: 0, rate: 0 };
  if (role === "student") {
    const rows = await prisma.attendance.findMany({
      where: { studentId: currentUserId! },
      select: { present: true },
    });
    studentStats.total   = rows.length;
    studentStats.present = rows.filter((r) => r.present).length;
    studentStats.absent  = rows.length - studentStats.present;
    studentStats.rate    = rows.length > 0
      ? Math.round((studentStats.present / rows.length) * 100)
      : 0;
  }

  // ── Logs query (admin/teacher) ────────────────────────────────────────────
  type LogRow = {
    id: number;
    date: Date;
    present: boolean;
    student: { id: string; name: string; surname: string };
    class: { id: number; name: string } | null;
  };

  let logs: LogRow[]  = [];
  let logsTotal       = 0;

  if (activeView === "logs" && (role === "admin" || role === "teacher")) {
    const where: any = {};
    if (filterClass) where.classId = filterClass;
    if (role === "teacher") {
      where.class = { lessons: { some: { teacherId: currentUserId! } } };
    }
    if (search) {
      where.OR = [
        { student: { name:    { contains: search, mode: "insensitive" } } },
        { student: { surname: { contains: search, mode: "insensitive" } } },
      ];
    }
    const [rows, cnt] = await prisma.$transaction([
      prisma.attendance.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, surname: true } },
          class:   { select: { id: true, name: true } },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
        orderBy: { date: "desc" },
      }),
      prisma.attendance.count({ where }),
    ]);
    logs      = rows as any;
    logsTotal = cnt;
  }

  // Sort logs with merge sort and group by date
  const sortedLogs     = mergeSortDesc(logs);
  const groupedByDate  = groupBy(sortedLogs, (r) => fmtDate(r.date));

  // ── Class summary (admin/teacher) ─────────────────────────────────────────
  type ClassSummary = {
    classId: number;
    className: string;
    students: number;
    totalRecords: number;
    presentCount: number;
    rate: number;
  };

  let classSummary: ClassSummary[] = [];
  if (activeView === "summary" && (role === "admin" || role === "teacher")) {
    const classWhere =
      role === "teacher"
        ? { lessons: { some: { teacherId: currentUserId! } } }
        : undefined;

    const classes = await prisma.class.findMany({
      where: classWhere,
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } },
        attendances: { select: { present: true } },
      },
      orderBy: { name: "asc" },
    });

    classSummary = classes
      .map((c) => ({
        classId:      c.id,
        className:    c.name,
        students:     c._count.students,
        totalRecords: c.attendances.length,
        presentCount: c.attendances.filter((a) => a.present).length,
        rate:
          c.attendances.length > 0
            ? Math.round(
                (c.attendances.filter((a) => a.present).length /
                  c.attendances.length) *
                  100
              )
            : 0,
      }))
      // Sort by rate ascending (at-risk first) using insertion sort
      .sort((a, b) => a.rate - b.rate);
  }

  // ── Student's own attendance logs ─────────────────────────────────────────
  let studentLogs: LogRow[] = [];
  let studentLogsTotal      = 0;
  if (role === "student" && activeView === "my") {
    const [rows, cnt] = await prisma.$transaction([
      prisma.attendance.findMany({
        where: { studentId: currentUserId! },
        include: {
          student: { select: { id: true, name: true, surname: true } },
          class:   { select: { id: true, name: true } },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
        orderBy: { date: "desc" },
      }),
      prisma.attendance.count({ where: { studentId: currentUserId! } }),
    ]);
    studentLogs      = rows as any;
    studentLogsTotal = cnt;
  }

  const sortedStudentLogs   = mergeSortDesc(studentLogs);
  const groupedStudentLogs  = groupBy(sortedStudentLogs, (r) => fmtDate(r.date));

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const adminTabs = [
    { key: "mark",    label: "Mark attendance" },
    { key: "logs",    label: "Attendance logs"  },
    { key: "summary", label: "Class summary"    },
  ];

  return (
    <div className="p-4 flex flex-col gap-4 flex-1 m-4 mt-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Attendance</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {role === "student"
              ? "Your personal attendance record"
              : "Track and manage class attendance"}
          </p>
        </div>
        {activeView === "logs" && (role === "admin" || role === "teacher") && (
          <TableSearch />
        )}
      </div>

      {/* ── Student stats banner ── */}
      {role === "student" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total days",  value: studentStats.total,              color: "bg-lamaSkyLight text-gray-700" },
            { label: "Present",     value: studentStats.present,            color: "bg-green-50 text-green-700"    },
            { label: "Absent",      value: studentStats.absent,             color: "bg-red-50 text-red-600"        },
            { label: "Rate",        value: `${studentStats.rate}%`,         color: studentStats.rate >= 75 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium opacity-70 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Admin/Teacher tabs ── */}
      {(role === "admin" || role === "teacher") && (
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {adminTabs.map((t) => (
            <a
              key={t.key}
              href={`?view=${t.key}&page=1`}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeView === t.key
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </a>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MARK ATTENDANCE TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeView === "mark" && (role === "admin" || role === "teacher") && (
        <AttendanceMarkForm classes={allClasses} />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          LOGS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeView === "logs" && (role === "admin" || role === "teacher") && (
        <div className="flex flex-col gap-4">
          {/* Class filter */}
          <div className="flex items-center gap-3">
            {/* <select
              className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm bg-white focus:ring-lamaSky focus:outline-none"
              defaultValue={filterClass ?? ""}
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) url.searchParams.set("classId", e.target.value);
                else url.searchParams.delete("classId");
                url.searchParams.set("page", "1");
                window.location.href = url.toString();
              }}
            >
              <option value="">All classes</option>
              {allClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select> */}
            <AttendanceClassFilter classes={allClasses} defaultValue={filterClass} />


            <span className="text-sm text-gray-400">{logsTotal} records</span>
          </div>

          {/* Grouped logs */}
          {Object.keys(groupedByDate).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-400 text-sm">No attendance records found</p>
            </div>
          ) : (
            Object.entries(groupedByDate).map(([dateLabel, records]) => (
              <div key={dateLabel} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Date header */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">{dateLabel}</span>
                    <span className="text-xs text-gray-400">{records.length} records</span>
                    {records[0]?.class && (
                      <span className="text-xs bg-lamaSkyLight text-gray-600 px-2 py-0.5 rounded-full">
                        {records[0].class.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <span className="text-green-600">
                      {records.filter((r) => r.present).length} present
                    </span>
                    <span className="text-red-500">
                      {records.filter((r) => !r.present).length} absent
                    </span>
                  </div>
                </div>

                {/* Student rows */}
                <div className="divide-y divide-gray-50">
                  {records.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-lamaSky to-lamaPurple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {r.student.name[0]}
                        </div>
                        <p className="text-sm font-medium text-gray-800">
                          {r.student.name} {r.student.surname}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        r.present
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {r.present ? "Present" : "Absent"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          <Pagination page={p} count={logsTotal} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUMMARY TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeView === "summary" && (role === "admin" || role === "teacher") && (
        <div className="flex flex-col gap-4">
          {/* At-risk notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800">
              ⚠ Classes sorted by lowest attendance rate (at-risk first)
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Classes below 75% attendance need immediate attention.
            </p>
          </div>

          {classSummary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-400 text-sm">No attendance data recorded yet</p>
            </div>
          ) : (
            classSummary.map((c) => (
              <div key={c.classId} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800 text-base">{c.className}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.students} student{c.students !== 1 ? "s" : ""} · {c.totalRecords} attendance records
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${
                      c.rate >= 85 ? "text-green-600"
                      : c.rate >= 75 ? "text-yellow-600"
                      : "text-red-500"
                    }`}>
                      {c.rate}%
                    </p>
                    <p className="text-xs text-gray-400">attendance rate</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      c.rate >= 85 ? "bg-green-400"
                      : c.rate >= 75 ? "bg-yellow-400"
                      : "bg-red-400"
                    }`}
                    style={{ width: `${c.rate}%` }}
                  />
                </div>

                {/* Stats row */}
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span className="text-green-600 font-medium">{c.presentCount} present</span>
                  <span className="text-gray-400">
                    {c.rate < 75 && "🚨 Below threshold · "}
                    {c.totalRecords - c.presentCount} absent
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STUDENT OWN VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {role === "student" && activeView === "my" && (
        <div className="flex flex-col gap-3">
          {/* Status banner */}
          <div className={`rounded-xl p-4 border ${
            studentStats.rate >= 85
              ? "bg-green-50 border-green-200"
              : studentStats.rate >= 75
              ? "bg-amber-50 border-amber-200"
              : "bg-red-50 border-red-200"
          }`}>
            <p className={`text-sm font-semibold ${
              studentStats.rate >= 85 ? "text-green-700"
              : studentStats.rate >= 75 ? "text-amber-700"
              : "text-red-700"
            }`}>
              {studentStats.rate >= 85
                ? "✅ Excellent attendance! Keep it up."
                : studentStats.rate >= 75
                ? "⚠ Attendance is acceptable but try to improve."
                : "🚨 Attendance below 75%. Please attend regularly."}
            </p>
          </div>

          {/* Logs */}
          {Object.keys(groupedStudentLogs).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-400 text-sm">No attendance records yet</p>
            </div>
          ) : (
            Object.entries(groupedStudentLogs).map(([dateLabel, records]) => (
              <div key={dateLabel} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{dateLabel}</span>
                    {records[0]?.class && (
                      <span className="text-xs text-gray-400">· {records[0].class.name}</span>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    records[0]?.present
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {records[0]?.present ? "Present" : "Absent"}
                  </span>
                </div>
              </div>
            ))
          )}
          <Pagination page={p} count={studentLogsTotal} />
        </div>
      )}
    </div>
  );
};

export default AttendanceListPage;