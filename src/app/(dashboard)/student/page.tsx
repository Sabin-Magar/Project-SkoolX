// import Announcements from "@/components/Announcements"
// import BigCalendarContainer from "@/components/BigCalendarContainer"
// import EventCalendarContainer from "@/components/EventCalendarContainer";
// import prisma from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// const StudentPage = async ({
//   searchParams,
// }: {
//   searchParams: Promise<{ [keys: string]: string | undefined }>;
// }) => {
//   const resolvedSearchParams = await searchParams;
//   const { userId } = await auth();

//   const classItem = await prisma.class.findMany({
//     where: {
//       students: { some: { id: userId! } },
//     },
//   });

//   console.log("classItem", classItem);
//   return (
//     <div className="p-4 flex gap-4 flex-col xl:flex-row">
//       {/* Left portion */}
//       <div className="w-full xl:w-2/3">
//         <div className="h-full bg-white p-4 rounded-md">
//           <h1 className="text-xl font-semibold">Schedule (4A)</h1>
//           {classItem[0] ? (
//             <BigCalendarContainer type="classId" id={classItem[0].id}/>
//           ) : (
//             <p className="text-gray-400 text-sm">No class assigned.</p>
//           )}
//         </div>
//       </div>

//       {/* right portion */}
//       <div className="w-full xl:w-1/3 flex flex-col gap-8">
//         <EventCalendarContainer searchParams={resolvedSearchParams} />
//         <Announcements />
//       </div>
//     </div>
//   )
// }

// export default StudentPage



// src/app/(dashboard)/student/page.tsx

import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

const StudentPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [keys: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const { userId } = await auth();

  // ── Fetch student with all needed data ────────────────────────────────────
  const student = await prisma.student.findUnique({
    where: { id: userId! },
    include: {
      class: {
        include: {
          grade:    { select: { level: true } },
          _count:   { select: { students: true, lessons: true } },
          students: {
            select: { id: true, name: true, surname: true, img: true },
            orderBy: { name: "asc" },
          },
        },
      },
      results: {
        select: { score: true },
        take: 10,
        orderBy: { id: "desc" },
      },
      attendances: {
        select: { present: true },
      },
    },
  });

  const classItem = student?.class ?? null;
  const classmates = classItem?.students.filter((s) => s.id !== userId) ?? [];

  // ── Quick stats ────────────────────────────────────────────────────────────
  const totalAtt    = student?.attendances.length ?? 0;
  const presentAtt  = student?.attendances.filter((a) => a.present).length ?? 0;
  const attRate     = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : null;

  const scores      = student?.results.map((r) => r.score) ?? [];
  const avgScore    = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const getGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B+";
    if (score >= 60) return "B";
    if (score >= 50) return "C";
    if (score >= 40) return "D";
    return "F";
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">

      {/* LEFT PORTION */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">

        {/* Profile card */}
        <div className="bg-gradient-to-r from-lamaPurple via-lamaSky to-lamaPurple rounded-2xl p-6 flex items-center gap-6 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-10 right-20 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

          {/* Avatar */}
          <div className="flex-shrink-0 relative z-10 p-1 bg-white/30 rounded-full">
            <Image
              src={student?.img || "/noAvatar.png"}
              alt="avatar"
              width={96}
              height={96}
              className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 relative z-10">
            <p className="text-purple-900 text-sm mb-0.5 font-medium">
              {greeting()},
            </p>
            <h1 className="text-2xl font-bold text-purple-950 truncate">
              {student?.name} {student?.surname} 👋
            </h1>

            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-purple-900 text-xs font-medium">Grade</span>
                <span className="bg-purple-900/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  Grade {classItem?.grade?.level ?? "—"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-900 text-xs font-medium">Section</span>
                <span className="bg-purple-900/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {classItem?.name ?? "—"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-900 text-xs font-medium">ID</span>
                <span className="bg-purple-900/80 text-white text-xs font-mono px-2.5 py-1 rounded-full">
                  {userId?.slice(5, 18)}…
                </span>
              </div>
            </div>
          </div>

          {/* Quick stat on right */}
          {attRate !== null && (
            <div className="hidden md:flex flex-col items-center flex-shrink-0 relative z-10 bg-purple-900/70 rounded-xl px-5 py-3 text-center">
              <p className="text-2xl font-bold text-white">{attRate}%</p>
              <p className="text-purple-200 text-xs mt-0.5">Attendance</p>
            </div>
          )}
        </div>

        {/* ── Quick stats row ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Attendance */}
          <div className="bg-white rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lamaSkyLight flex items-center justify-center flex-shrink-0">
              <Image src="/singleAttendance.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">
                {attRate !== null ? `${attRate}%` : "N/A"}
              </p>
              <p className="text-xs text-gray-400">Attendance</p>
            </div>
          </div>

          {/* Avg score */}
          <div className="bg-white rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lamaYellowLight flex items-center justify-center flex-shrink-0">
              <Image src="/result.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">
                {avgScore !== null ? `${avgScore}` : "N/A"}
              </p>
              <p className="text-xs text-gray-400">
                Avg score {avgScore !== null ? `(${getGrade(avgScore)})` : ""}
              </p>
            </div>
          </div>

          {/* Lessons */}
          <div className="bg-white rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lamaPurpleLight flex items-center justify-center flex-shrink-0">
              <Image src="/singleLesson.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">
                {classItem?._count.lessons ?? 0}
              </p>
              <p className="text-xs text-gray-400">Lessons</p>
            </div>
          </div>
        </div>

        {/* ── Classmates + Quick links row ── */}
        <div className="flex gap-4 flex-col md:flex-row">

          {/* Classmates list */}
          <div className="bg-white rounded-xl p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 text-sm">
                Classmates
              </h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {classmates.length} students
              </span>
            </div>
            {classmates.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No classmates</p>
            ) : (
              <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto pr-1">
                {classmates.map((cm, i) => (
                  <div key={cm.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lamaSky to-lamaPurple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {cm.name[0]}
                    </div>
                    <p className="text-sm text-gray-700 truncate flex-1">
                      {cm.name} {cm.surname}
                    </p>
                    <span className="text-xs text-gray-300">#{i + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-xl p-4 flex-1">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">Quick links</h2>
            <div className="flex flex-col gap-2">
              {[
                { label: "My Results",     href: `/list/results`,     color: "bg-lamaYellowLight", icon: "/result.png"     },
                { label: "My Attendance",  href: `/list/attendance`,  color: "bg-lamaSkyLight",    icon: "/attendance.png" },
                { label: "Assignments",    href: `/list/assignments`, color: "bg-lamaPurpleLight", icon: "/assignment.png" },
                { label: "Exams",          href: `/list/exams`,       color: "bg-pink-50",         icon: "/exam.png"       },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${link.color} hover:opacity-80 transition-opacity`}
                >
                  <Image src={link.icon} alt="" width={14} height={14} />
                  <span className="text-sm text-gray-700 font-medium">{link.label}</span>
                  <span className="ml-auto text-gray-400 text-xs">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Schedule ── */}
        <div className="bg-white rounded-xl p-4 min-h-[600px]">
          <h1 className="text-xl font-semibold text-gray-800 mb-3">
            Schedule
            {classItem && (
              <span className="text-gray-400 font-normal text-base ml-2">
                ({classItem.name})
              </span>
            )}
          </h1>
          {classItem ? (
            <BigCalendarContainer type="classId" id={classItem.id} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              No class assigned
            </div>
          )}
        </div>
      </div>

        {/* RIGHT PORTION */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={resolvedSearchParams} />
        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;