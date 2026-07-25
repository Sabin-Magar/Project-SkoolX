import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Class, Lesson, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";

type LessonList = Lesson & { subject: Subject } & { class: Class } & {
  teacher: Teacher;
};

// ── Day badge ─────────────────────────────────────────────────────────────────

const dayColors: Record<string, string> = {
  SUNDAY:    "bg-purple-100 text-purple-700",
  MONDAY:    "bg-blue-100 text-blue-700",
  TUESDAY:   "bg-green-100 text-green-700",
  WEDNESDAY: "bg-yellow-100 text-yellow-700",
  THURSDAY:  "bg-orange-100 text-orange-700",
  FRIDAY:    "bg-pink-100 text-pink-700",
};

const dayLabels: Record<string, string> = {
  SUNDAY:    "Sun",
  MONDAY:    "Mon",
  TUESDAY:   "Tue",
  WEDNESDAY: "Wed",
  THURSDAY:  "Thu",
  FRIDAY:    "Fri",
};

const subjectColors: Record<string, string> = {
  Mathematics:        "bg-blue-50 text-blue-700",
  Science:            "bg-green-50 text-green-700",
  English:            "bg-purple-50 text-purple-700",
  History:            "bg-amber-50 text-amber-700",
  Geography:          "bg-teal-50 text-teal-700",
  Physics:            "bg-indigo-50 text-indigo-700",
  Chemistry:          "bg-pink-50 text-pink-700",
  Biology:            "bg-emerald-50 text-emerald-700",
  "Computer Science": "bg-cyan-50 text-cyan-700",
  Art:                "bg-rose-50 text-rose-700",
};

// ── Lesson Card ───────────────────────────────────────────────────────────────

const LessonCard = ({
  item,
  role,
}: {
  item: LessonList;
  role: string | undefined;
}) => {
  const dayColor     = dayColors[item.day]     ?? "bg-gray-100 text-gray-600";
  const subjectColor = subjectColors[item.subject.name] ?? "bg-lamaSkyLight text-gray-700";

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(date));

  return (
    <tr className="border-b border-gray-100 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight transition-colors">

      {/* Subject */}
      <td className="p-4">
        <span className={`font-medium px-2.5 py-1 `}>
          {item.subject.name}
        </span>
      </td>

      {/* Lesson name */}
      <td className="p-4">
        <p className="font-medium text-gray-800 truncate max-w-[180px]">{item.name}</p>
      </td>

      {/* Class */}
      <td className="p-4">
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
          {item.class.name}
        </span>
      </td>

      {/* Teacher */}
      <td className="p-4 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lamaSky to-lamaPurple flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {item.teacher.name[0]}
          </div>
          <span className="text-gray-600">
            {item.teacher.name} {item.teacher.surname}
          </span>
        </div>
      </td>

      {/* Day */}
      <td className="p-4 hidden lg:table-cell">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${dayColor}`}>
          {dayLabels[item.day] ?? item.day}
        </span>
      </td>

      {/* Time */}
      <td className="p-4 hidden lg:table-cell">
        <span className="text-xs text-gray-500">
          {formatTime(item.startTime)} — {formatTime(item.endTime)}
        </span>
      </td>

      {/* Actions */}
      <td className="p-4">
        {role === "admin" && (
          <div className="flex items-center gap-1.5">
            <FormContainer table="lesson" type="update" data={item} />
            <FormContainer table="lesson" type="delete" id={item.id} />
          </div>
        )}
      </td>
    </tr>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const LessonListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const resolvedParams = await searchParams;
  const { page, ...queryParams } = resolvedParams;
  const p = page ? parseInt(page) : 1;

  // ── Query ──────────────────────────────────────────────────────────────────
  const query: Prisma.LessonWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.classId = parseInt(value);
            break;
          case "teacherId":
            query.teacherId = value;
            break;
          case "search":
            query.OR = [
              { subject: { name: { contains: value, mode: "insensitive" } } },
              { teacher: { name: { contains: value, mode: "insensitive" } } },
              { name: { contains: value, mode: "insensitive" } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const [data, count] = await prisma.$transaction([
    prisma.lesson.findMany({
      where: query,
      include: {
        subject: { select: { name: true } },
        class:   { select: { name: true } },
        teacher: { select: { name: true, surname: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    }),
    prisma.lesson.count({ where: query }),
  ]);

  const columns = [
    { header: "Subject",  accessor: "subject" },
    { header: "Lesson",   accessor: "name" },
    { header: "Class",    accessor: "class" },
    { header: "Teacher",  accessor: "teacher",   className: "hidden md:table-cell" },
    { header: "Day",      accessor: "day",        className: "hidden lg:table-cell" },
    { header: "Time",     accessor: "time",       className: "hidden lg:table-cell" },
    ...(role === "admin"
      ? [{ header: "Actions", accessor: "action" }]
      : []),
  ];

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">All Lessons</h1>
          <p className="text-sm text-gray-400 mt-0.5">{count} lesson{count !== 1 ? "s" : ""} found</p>
        </div>
        <div className="flex items-center gap-3">
          <TableSearch />
          {role === "admin" && (
            <FormContainer table="lesson" type="create" />
          )}
        </div>
      </div>

      {/* ── Table ── */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Image src="/lesson.png" alt="" width={24} height={24} />
          </div>
          <p className="text-gray-500 font-medium">No lessons found</p>
          <p className="text-gray-400 text-sm mt-1">
            {role === "admin"
              ? "Create your first lesson using the button above."
              : "No lessons scheduled yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {columns.map((col) => (
                  <th
                    key={col.accessor}
                    className={`text-left text-xs font-medium text-gray-400 uppercase tracking-wide p-4 ${col.className ?? ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data as unknown as LessonList[]).map((item) => (
                <LessonCard key={item.id} item={item} role={role} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default LessonListPage;