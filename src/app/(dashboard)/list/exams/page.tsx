import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Class, Exam, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";

type ExamList = Exam & {
  lesson: {
    subject: Subject;
    class: Class;
    teacher: Teacher;
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getExamStatus = (startTime: Date, endTime: Date) => {
  const now = new Date();
  if (now < startTime) return { label: "Upcoming", color: "bg-blue-100 text-blue-700" };
  if (now >= startTime && now <= endTime) return { label: "Ongoing", color: "bg-green-100 text-green-700" };
  return { label: "Completed", color: "bg-gray-100 text-gray-500" };
};

const getDuration = (start: Date, end: Date) => {
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const subjectColors: Record<string, string> = {
  Mathematics:      "bg-blue-50 text-blue-700",
  Science:          "bg-green-50 text-green-700",
  English:          "bg-purple-50 text-purple-700",
  History:          "bg-amber-50 text-amber-700",
  Geography:        "bg-teal-50 text-teal-700",
  Physics:          "bg-indigo-50 text-indigo-700",
  Chemistry:        "bg-pink-50 text-pink-700",
  Biology:          "bg-emerald-50 text-emerald-700",
  "Computer Science": "bg-cyan-50 text-cyan-700",
  Art:              "bg-rose-50 text-rose-700",
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub?: string;
  color: string;
}) => (
  <div className={`rounded-xl p-4 ${color}`}>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs font-medium opacity-70 mt-0.5">{label}</p>
    {sub && <p className="text-xs opacity-50 mt-0.5">{sub}</p>}
  </div>
);

// ── Exam Card ─────────────────────────────────────────────────────────────────

const ExamCard = ({
  item,
  role,
}: {
  item: ExamList;
  role: string | undefined;
}) => {
  const status = getExamStatus(item.startTime, item.endTime);
  const duration = getDuration(item.startTime, item.endTime);
  const subjectColor =
    subjectColors[item.lesson.subject.name] ?? "bg-lamaSkyLight text-gray-700";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col gap-3">

      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-800 text-sm leading-snug truncate">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${subjectColor}`}>
              {item.lesson.subject.name}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-medium text-gray-500">{item.lesson.class.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{duration}</p>
        </div>
      </div>

      {/* Time details */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-xs text-gray-400 mb-0.5">Start</p>
          <p className="text-xs font-medium text-gray-700">
            {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(item.startTime)}
          </p>
          <p className="text-xs text-gray-500">
            {new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(item.startTime)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-xs text-gray-400 mb-0.5">End</p>
          <p className="text-xs font-medium text-gray-700">
            {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(item.endTime)}
          </p>
          <p className="text-xs text-gray-500">
            {new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(item.endTime)}
          </p>
        </div>
      </div>

      {/* Teacher + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lamaSky to-lamaPurple flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {item.lesson.teacher.name[0]}
          </div>
          <span className="text-xs text-gray-500 truncate">
            {item.lesson.teacher.name} {item.lesson.teacher.surname}
          </span>
        </div>
        {(role === "admin" || role === "teacher") && (
          <div className="flex items-center gap-1.5">
            <FormContainer table="exam" type="update" data={item} />
            <FormContainer table="exam" type="delete" id={item.id} />
          </div>
        )}
      </div>
    </div>
  );
};

// ── Section heading ───────────────────────────────────────────────────────────

const SectionHeading = ({
  dot,
  title,
  count,
}: {
  dot: string;
  title: string;
  count: number;
}) => (
  <div className="flex items-center gap-2 mb-3">
    <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
    <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
    <span className="text-xs text-gray-400">({count})</span>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const ExamListPage = async ({
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

  // ── Base query ────────────────────────────────────────────────────────────
  const baseQuery: Prisma.ExamWhereInput = { lesson: {} };

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            (baseQuery.lesson as any).classId = parseInt(value);
            break;
          case "teacherId":
            (baseQuery.lesson as any).teacherId = value;
            break;
          case "search":
            baseQuery.OR = [
              { title: { contains: value, mode: "insensitive" } },
              { lesson: { subject: { name: { contains: value, mode: "insensitive" } } } },
            ];
            break;
        }
      }
    }
  }

  switch (role) {
    case "admin": break;
    case "teacher":
      (baseQuery.lesson as any).teacherId = currentUserId!;
      break;
    case "student":
      (baseQuery.lesson as any).class = { students: { some: { id: currentUserId! } } };
      break;
    case "parent":
      (baseQuery.lesson as any).class = { students: { some: { parentId: currentUserId! } } };
      break;
  }

  // ── Tab filter ────────────────────────────────────────────────────────────
  const now = new Date();
  const activeQuery: Prisma.ExamWhereInput =
    activeTab === "upcoming"
      ? { ...baseQuery, startTime: { gt: now } }
      : activeTab === "ongoing"
      ? { ...baseQuery, startTime: { lte: now }, endTime: { gte: now } }
      : activeTab === "completed"
      ? { ...baseQuery, endTime: { lt: now } }
      : baseQuery;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const include = {
    lesson: {
      select: {
        subject: { select: { name: true } },
        teacher: { select: { name: true, surname: true } },
        class: { select: { name: true } },
      },
    },
  };

  const [data, count, allExams] = await prisma.$transaction([
    prisma.exam.findMany({
      where: activeQuery,
      include,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { startTime: "asc" },
    }),
    prisma.exam.count({ where: activeQuery }),
    prisma.exam.findMany({
      where: baseQuery,
      select: { startTime: true, endTime: true },
    }),
  ]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const upcomingCount  = allExams.filter((e) => e.startTime > now).length;
  const ongoingCount   = allExams.filter((e) => e.startTime <= now && e.endTime >= now).length;
  const completedCount = allExams.filter((e) => e.endTime < now).length;
  const totalCount     = allExams.length;

  const exams = data as unknown as ExamList[];

  // split "all" tab into sections
  const upcomingExams  = exams.filter((e) => e.startTime > now);
  const ongoingExams   = exams.filter((e) => e.startTime <= now && e.endTime >= now);
  const completedExams = exams.filter((e) => e.endTime < now);

  // ── Tabs config ───────────────────────────────────────────────────────────
  const tabs = [
    { key: "all",       label: "All exams",  count: totalCount },
    { key: "upcoming",  label: "Upcoming",   count: upcomingCount },
    { key: "ongoing",   label: "Ongoing",    count: ongoingCount },
    { key: "completed", label: "Completed",  count: completedCount },
  ];

  return (
    <div className="p-4 flex flex-col gap-4 flex-1 m-4 mt-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Exams</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {count} {activeTab === "all" ? "total" : activeTab} exam{count !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TableSearch />
          {/* <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
            <Image src="/filter.png" alt="filter" width={14} height={14} />
          </button> */}
          {(role === "admin" || role === "teacher") && (
            <FormContainer table="exam" type="create" />
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      {totalCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total exams"
            value={totalCount}
            color="bg-lamaSkyLight text-gray-700"
          />
          <StatCard
            label="Upcoming"
            value={upcomingCount}
            sub="not started yet"
            color="bg-blue-50 text-blue-700"
          />
          <StatCard
            label="Ongoing"
            value={ongoingCount}
            sub="in progress"
            color="bg-green-50 text-green-700"
          />
          <StatCard
            label="Completed"
            value={completedCount}
            sub="finished"
            color="bg-gray-50 text-gray-600"
          />
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`?tab=${t.key}&page=1`}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === t.key
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === t.key ? "bg-gray-100 text-gray-600" : "bg-gray-200 text-gray-500"
              }`}
            >
              {t.count}
            </span>
          </a>
        ))}
      </div>

      {/* ── Content ── */}
      {exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Image src="/exam.png" alt="" width={28} height={28} />
          </div>
          <p className="text-gray-500 font-medium">No {activeTab === "all" ? "" : activeTab} exams found</p>
          <p className="text-gray-400 text-sm mt-1">
            {role === "admin" || role === "teacher"
              ? "Create your first exam using the button above."
              : "No exams scheduled yet."}
          </p>
        </div>
      ) : activeTab === "all" ? (
        // ── All tab — split into sections ─────────────────────────────────
        <div className="flex flex-col gap-6">

          {/* Ongoing section */}
          {ongoingExams.length > 0 && (
            <div>
              <SectionHeading dot="bg-green-400" title="Ongoing" count={ongoingExams.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {ongoingExams.map((item) => (
                  <ExamCard key={item.id} item={item} role={role} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming section */}
          {upcomingExams.length > 0 && (
            <div>
              <SectionHeading dot="bg-blue-400" title="Upcoming" count={upcomingExams.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {upcomingExams.map((item) => (
                  <ExamCard key={item.id} item={item} role={role} />
                ))}
              </div>
            </div>
          )}

          {/* Completed section */}
          {completedExams.length > 0 && (
            <div>
              <SectionHeading dot="bg-gray-400" title="Completed" count={completedExams.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {completedExams.map((item) => (
                  <ExamCard key={item.id} item={item} role={role} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // ── Single tab — flat grid ─────────────────────────────────────────
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {exams.map((item) => (
            <ExamCard key={item.id} item={item} role={role} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ExamListPage;