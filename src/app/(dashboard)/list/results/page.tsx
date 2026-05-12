import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────────────────────

type ResultList = {
  id: number;
  title: string;
  studentName: string;
  studentSurname: string;
  studentImg: string | null;
  teacherName: string;
  teacherSurname: string;
  score: number;
  className: string;
  startTime: Date;
  type: "exam" | "assignment";

  studentId: string;
  examId: number | null;
  assignmentId: number | null;
};

// ─── Grade helper ────────────────────────────────────────────────────────────

const getGrade = (score: number) => {
  if (score >= 90) return { label: "A+", color: "bg-emerald-100 text-emerald-700" };
  if (score >= 80) return { label: "A",  color: "bg-green-100 text-green-700" };
  if (score >= 70) return { label: "B+", color: "bg-blue-100 text-blue-700" };
  if (score >= 60) return { label: "B",  color: "bg-indigo-100 text-indigo-700" };
  if (score >= 50) return { label: "C",  color: "bg-yellow-100 text-yellow-700" };
  if (score >= 40) return { label: "D",  color: "bg-orange-100 text-orange-700" };
  return { label: "F", color: "bg-red-100 text-red-700" };
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-yellow-600";
  return "text-red-500";
};

const getBarColor = (score: number) => {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-blue-400";
  if (score >= 40) return "bg-yellow-400";
  return "bg-red-400";
};

// ─── Result Row Card ─────────────────────────────────────────────────────────

const ResultCard = ({
  item,
  role,
}: {
  item: ResultList;
  role: string | undefined;
}) => {
  const grade = getGrade(item.score);
  const scoreColor = getScoreColor(item.score);
  const barColor = getBarColor(item.score);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        {/* Left — student info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lamaSky to-lamaPurple flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {item.studentName[0]}{item.studentSurname[0]}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-800 text-sm truncate">
              {item.studentName} {item.studentSurname}
            </p>
            <p className="text-xs text-gray-400 truncate">{item.title}</p>
          </div>
        </div>

        {/* Right — score + grade */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-2xl font-bold ${scoreColor}`}>{item.score}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${grade.color}`}>
            {grade.label}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-3 mb-2">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={`${barColor} h-1.5 rounded-full transition-all duration-500`}
            style={{ width: `${item.score}%` }}
          />
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${item.type === "exam" ? "bg-purple-400" : "bg-sky-400"}`} />
            {item.type === "exam" ? "Exam" : "Assignment"}
          </span>
          <span>{item.className}</span>
          <span>{item.teacherName} {item.teacherSurname}</span>
        </div>
        <span>{new Intl.DateTimeFormat("en-US").format(item.startTime)}</span>
      </div>

      {/* Actions */}
      {(role === "admin" || role === "teacher") && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
          <FormContainer table="result" type="update" data={item} />
          <FormContainer table="result" type="delete" id={item.id} />
        </div>
      )}
    </div>
  );
};

// ─── Stats Card ───────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) => (
  <div className={`rounded-xl p-4 ${color}`}>
    <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
    {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ResultListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const resolvedParams = await searchParams;
  const { page, tab, ...queryParams } = resolvedParams;
  const p = page ? parseInt(page) : 1;
  const activeTab = tab || "all";

  // ── Query ──────────────────────────────────────────────────────────────────

  const query: Prisma.ResultWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "studentId":
            query.studentId = value;
            break;
          case "search":
            query.OR = [
              { exam: { title: { contains: value, mode: "insensitive" } } },
              { assignment: { title: { contains: value, mode: "insensitive" } } },
              { student: { name: { contains: value, mode: "insensitive" } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.OR = [
        { exam: { lesson: { teacherId: currentUserId! } } },
        { assignment: { lesson: { teacherId: currentUserId! } } },
      ];
      break;
    case "student":
      query.studentId = currentUserId!;
      break;
    case "parent":
      query.student = { parentId: currentUserId! };
      break;
  }

  // exam-only or assignment-only filter
  const examQuery: Prisma.ResultWhereInput = {
    ...query,
    examId: { not: null },
    assignmentId: null,
  };
  const assignmentQuery: Prisma.ResultWhereInput = {
    ...query,
    assignmentId: { not: null },
    examId: null,
  };

  const activeQuery =
    activeTab === "exams"
      ? examQuery
      : activeTab === "assignments"
      ? assignmentQuery
      : query;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const include = {
    student: { select: { name: true, surname: true, img: true } },
    exam: {
      include: {
        lesson: {
          select: {
            class: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
          },
        },
      },
    },
    assignment: {
      include: {
        lesson: {
          select: {
            class: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
          },
        },
      },
    },
  };

  const [dataRes, count, allResults] = await prisma.$transaction([
    prisma.result.findMany({
      where: activeQuery,
      include,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { id: "desc" },
    }),
    prisma.result.count({ where: activeQuery }),
    prisma.result.findMany({ where: query, select: { score: true } }),
  ]);

  // ── Map data ───────────────────────────────────────────────────────────────

  const data: ResultList[] = dataRes
    .map((item) => {
      const assessment = item.exam || item.assignment;
      if (!assessment) return null;
      const isExam = "startTime" in assessment;
      return {
        id: item.id,
        title: assessment.title,
        studentName: item.student.name,
        studentSurname: item.student.surname,
        studentImg: item.student.img,
        teacherName: assessment.lesson.teacher.name,
        teacherSurname: assessment.lesson.teacher.surname,
        score: item.score,
        className: assessment.lesson.class.name,
        startTime: isExam ? assessment.startTime : assessment.startDate,
        type: isExam ? ("exam" as const) : ("assignment" as const),

        studentId: item.studentId,
        examId: item.examId ?? null,
        assignmentId: item.assignmentId ?? null,
      };
    })
    .filter(Boolean) as ResultList[];

  // ── Stats ──────────────────────────────────────────────────────────────────

  const scores = allResults.map((r) => r.score);
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const highest = scores.length ? Math.max(...scores) : 0;
  const lowest = scores.length ? Math.min(...scores) : 0;
  const passing = scores.filter((s) => s >= 40).length;
  const passRate = scores.length
    ? Math.round((passing / scores.length) * 100)
    : 0;

  // ── Grade distribution ─────────────────────────────────────────────────────

  const gradeDist = [
    { label: "A+/A", min: 80, color: "bg-emerald-400" },
    { label: "B+/B", min: 60, color: "bg-blue-400" },
    { label: "C",    min: 50, color: "bg-yellow-400" },
    { label: "D",    min: 40, color: "bg-orange-400" },
    { label: "F",    min: 0,  color: "bg-red-400" },
  ].map((g, i, arr) => {
    const max = i === 0 ? 101 : arr[i - 1].min;
    const count = scores.filter((s) => s >= g.min && s < max).length;
    return { ...g, count, pct: scores.length ? Math.round((count / scores.length) * 100) : 0 };
  });

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 flex flex-col gap-4 flex-1 m-4 mt-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Results</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {count} {activeTab === "all" ? "total" : activeTab} result{count !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TableSearch />
          {/* <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
            <Image src="/filter.png" alt="filter" width={14} height={14} />
          </button> */}
          {(role === "admin" || role === "teacher") && (
            <FormContainer table="result" type="create" />
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      {scores.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Average score"
            value={avgScore}
            sub={`out of 100`}
            color="bg-lamaSkyLight text-gray-700"
          />
          <StatCard
            label="Pass rate"
            value={`${passRate}%`}
            sub={`${passing} of ${scores.length} passed`}
            color="bg-lamaYellowLight text-gray-700"
          />
          <StatCard
            label="Highest score"
            value={highest}
            sub={getGrade(highest).label}
            color="bg-green-50 text-gray-700"
          />
          <StatCard
            label="Lowest score"
            value={lowest}
            sub={getGrade(lowest).label}
            color="bg-red-50 text-gray-700"
          />
        </div>
      )}

      {/* ── Grade distribution bar ── */}
      {scores.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Grade distribution</p>
          <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
            {gradeDist.map((g) =>
              g.pct > 0 ? (
                <div
                  key={g.label}
                  className={`${g.color} flex items-center justify-center text-white text-xs font-medium transition-all`}
                  style={{ width: `${g.pct}%` }}
                  title={`${g.label}: ${g.count} (${g.pct}%)`}
                >
                  {g.pct >= 10 ? g.label : ""}
                </div>
              ) : null
            )}
          </div>
          <div className="flex gap-4 mt-2 flex-wrap">
            {gradeDist.map((g) => (
              <span key={g.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2.5 h-2.5 rounded-sm ${g.color}`} />
                {g.label} — {g.count} ({g.pct}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "all", label: "All results" },
          { key: "exams", label: "Exams" },
          { key: "assignments", label: "Assignments" },
        ].map((t) => (
          <a
            key={t.key}
            href={`?tab=${t.key}&page=1`}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* ── Results grid ── */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Image src="/result.png" alt="" width={28} height={28} />
          </div>
          <p className="text-gray-500 font-medium">No results found</p>
          <p className="text-gray-400 text-sm mt-1">
            {activeTab === "exams"
              ? "No exam results yet"
              : activeTab === "assignments"
              ? "No assignment results yet"
              : "No results available"}
          </p>
        </div>
      ) : (
        <>
          {/* Exam section */}
          {(activeTab === "all" || activeTab === "exams") && (
            <div>
              {activeTab === "all" && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <h2 className="text-sm font-semibold text-gray-700">Exams</h2>
                  <span className="text-xs text-gray-400">
                    ({data.filter((d) => d.type === "exam").length})
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {data
                  .filter((d) => activeTab === "exams" || d.type === "exam")
                  .map((item) => (
                    <ResultCard key={`exam-${item.id}`} item={item} role={role} />
                  ))}
              </div>
            </div>
          )}

          {/* Assignment section */}
          {(activeTab === "all" || activeTab === "assignments") && (
            <div className={activeTab === "all" ? "mt-2" : ""}>
              {activeTab === "all" && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <h2 className="text-sm font-semibold text-gray-700">Assignments</h2>
                  <span className="text-xs text-gray-400">
                    ({data.filter((d) => d.type === "assignment").length})
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {data
                  .filter(
                    (d) => activeTab === "assignments" || d.type === "assignment"
                  )
                  .map((item) => (
                    <ResultCard key={`asgn-${item.id}`} item={item} role={role} />
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Pagination ── */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ResultListPage;