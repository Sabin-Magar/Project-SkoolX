// // src/components/RecentActivity.tsx
// import prisma from "@/lib/prisma";
// import Image from "next/image";

// const RecentActivity = async () => {
//   // Fetch last 2 of each key entity and tag them
//   const [students, teachers, results, announcements, exams] = await Promise.all([
//     prisma.student.findMany({
//       take: 2,
//       orderBy: { createdAt: "desc" },
//       select: { name: true, surname: true, createdAt: true, class: { select: { name: true } } },
//     }),
//     prisma.teacher.findMany({
//       take: 2,
//       orderBy: { createdAt: "desc" },
//       select: { name: true, surname: true, createdAt: true },
//     }),
//     prisma.result.findMany({
//       take: 2,
//       orderBy: { id: "desc" },
//       select: {
//         score: true,
//         student: { select: { name: true, surname: true } },
//         exam: { select: { title: true } },
//         assignment: { select: { title: true } },
//       },
//     }),
//     prisma.announcement.findMany({
//       take: 2,
//       orderBy: { date: "desc" },
//       select: { title: true, date: true },
//     }),
//     prisma.exam.findMany({
//       take: 2,
//       orderBy: { id: "desc" },
//       select: {
//         title: true,
//         startTime: true,
//         lesson: { select: { subject: { select: { name: true } } } },
//       },
//     }),
//   ]);

//   type ActivityItem = {
//     label: string;
//     detail: string;
//     time: Date;
//     type: "student" | "teacher" | "result" | "announcement" | "exam";
//   };

//   const items: ActivityItem[] = [
//     ...students.map((s) => ({
//       label: `${s.name} ${s.surname} enrolled`,
//       detail: s.class?.name ?? "Student",
//       time: s.createdAt,
//       type: "student" as const,
//     })),
//     ...teachers.map((t) => ({
//       label: `${t.name} ${t.surname} joined`,
//       detail: "New teacher",
//       time: t.createdAt,
//       type: "teacher" as const,
//     })),
//     ...results.map((r) => ({
//       label: `${r.student.name} ${r.student.surname} scored ${r.score}`,
//       detail: r.exam?.title ?? r.assignment?.title ?? "Result",
//       time: new Date(),
//       type: "result" as const,
//     })),
//     ...announcements.map((a) => ({
//       label: a.title,
//       detail: "Announcement published",
//       time: a.date,
//       type: "announcement" as const,
//     })),
//     ...exams.map((e) => ({
//       label: e.title,
//       detail: e.lesson?.subject?.name ?? "Exam scheduled",
//       time: e.startTime,
//       type: "exam" as const,
//     })),
//   ];

//   // Sort by time descending, take top 5
//   const sorted = items
//     .sort((a, b) => b.time.getTime() - a.time.getTime())
//     .slice(0, 5);

//   const typeConfig: Record<
//     ActivityItem["type"],
//     { dot: string; bg: string }
//   > = {
//     student:      { dot: "bg-lamaSky",    bg: "bg-lamaSkyLight"    },
//     teacher:      { dot: "bg-lamaPurple", bg: "bg-lamaPurpleLight" },
//     result:       { dot: "bg-green-400",  bg: "bg-green-50"        },
//     announcement: { dot: "bg-lamaYellow", bg: "bg-lamaYellowLight" },
//     exam:         { dot: "bg-pink-400",   bg: "bg-pink-50"         },
//   };

//   const formatTime = (d: Date) => {
//     const diff = Date.now() - d.getTime();
//     const mins  = Math.floor(diff / 60000);
//     const hours = Math.floor(diff / 3600000);
//     const days  = Math.floor(diff / 86400000);
//     if (mins < 1)    return "just now";
//     if (mins < 60)   return `${mins}m ago`;
//     if (hours < 24)  return `${hours}h ago`;
//     if (days < 7)    return `${days}d ago`;
//     return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(d);
//   };

//   return (
//     <div className="bg-white p-4 rounded-xl">
//       <div className="flex items-center justify-between mb-4">
//         <h1 className="text-lg font-semibold">Recent Activity</h1>
//         <Image src="/moreDark.png" alt="" width={20} height={20} />
//       </div>

//       {sorted.length === 0 ? (
//         <p className="text-gray-400 text-sm text-center py-4">No recent activity</p>
//       ) : (
//         <div className="flex flex-col gap-3">
//           {sorted.map((item, i) => {
//             const cfg = typeConfig[item.type];
//             return (
//               <div key={i} className="flex items-center gap-3">
//                 {/* Dot */}
//                 <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />

//                 {/* Info */}
//                 <div className={`flex-1 flex items-center justify-between rounded-lg px-3 py-2 ${cfg.bg}`}>
//                   <div className="min-w-0">
//                     <p className="text-sm font-medium text-gray-700 truncate">{item.label}</p>
//                     <p className="text-xs text-gray-400 truncate">{item.detail}</p>
//                   </div>
//                   <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
//                     {formatTime(item.time)}
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// export default RecentActivity;


// src/components/RecentActivity.tsx
import prisma from "@/lib/prisma";
import Image from "next/image";

const RecentActivity = async () => {

  // Fetch recent records — results excluded from time-based sort
  // since Result has no createdAt; we handle it separately
  const [students, teachers, announcements, exams, assignments] = await Promise.all([
    prisma.student.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        surname: true,
        createdAt: true,
        class: { select: { name: true } },
      },
    }),
    prisma.teacher.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { name: true, surname: true, createdAt: true },
    }),
    prisma.announcement.findMany({
      take: 3,
      // Use the actual creation/publish date
      orderBy: { date: "desc" },
      select: { title: true, date: true, class: { select: { name: true } } },
    }),
    prisma.exam.findMany({
      take: 3,
      orderBy: { id: "desc" },
      select: {
        title: true,
        startTime: true,
        lesson: { select: { subject: { select: { name: true } }, class: { select: { name: true } } } },
      },
    }),
    prisma.assignment.findMany({
      take: 3,
      orderBy: { id: "desc" },
      select: {
        title: true,
        startDate: true,
        lesson: { select: { subject: { select: { name: true } }, class: { select: { name: true } } } },
      },
    }),
  ]);

  type ActivityItem = {
    label:  string;
    detail: string;
    time:   Date;
    type:   "student" | "teacher" | "announcement" | "exam" | "assignment";
  };

  const items: ActivityItem[] = [
    ...students.map((s) => ({
      label:  `${s.name} ${s.surname} enrolled`,
      detail: s.class?.name ? `Class ${s.class.name}` : "New student",
      time:   s.createdAt,
      type:   "student" as const,
    })),
    ...teachers.map((t) => ({
      label:  `${t.name} ${t.surname} added`,
      detail: "New teacher",
      time:   t.createdAt,
      type:   "teacher" as const,
    })),
    ...announcements.map((a) => ({
      label:  a.title,
      detail: a.class ? `Class ${a.class.name}` : "School-wide announcement",
      time:   a.date,
      type:   "announcement" as const,
    })),
    ...exams.map((e) => ({
      label:  e.title,
      detail: `${e.lesson?.subject?.name ?? "Exam"} · ${e.lesson?.class?.name ?? ""}`,
      time:   e.startTime,
      type:   "exam" as const,
    })),
    ...assignments.map((a) => ({
      label:  a.title,
      detail: `${a.lesson?.subject?.name ?? "Assignment"} · ${a.lesson?.class?.name ?? ""}`,
      time:   a.startDate,
      type:   "assignment" as const,
    })),
  ];

  // Sort all by time descending, take top 6
  const sorted = items
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 6);

  const typeConfig: Record<ActivityItem["type"], { dot: string; bg: string; tag: string }> = {
    student:      { dot: "bg-lamaSky",    bg: "bg-lamaSkyLight",    tag: "Student"      },
    teacher:      { dot: "bg-lamaPurple", bg: "bg-lamaPurpleLight", tag: "Teacher"      },
    announcement: { dot: "bg-lamaYellow", bg: "bg-lamaYellowLight", tag: "Announcement" },
    exam:         { dot: "bg-pink-400",   bg: "bg-pink-50",         tag: "Exam"         },
    assignment:   { dot: "bg-green-400",  bg: "bg-green-50",        tag: "Assignment"   },
  };

  const formatTime = (d: Date) => {
    const diff  = Date.now() - d.getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (diff < 0)     return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(d);
    if (mins < 1)     return "just now";
    if (mins < 60)    return `${mins}m ago`;
    if (hours < 24)   return `${hours}h ago`;
    if (days < 7)     return `${days}d ago`;
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(d);
  };

  return (
    <div className="bg-white p-4 rounded-xl h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Recent Activity</h1>
      </div>

      {sorted.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">No recent activity</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((item, i) => {
            const cfg = typeConfig[item.type];
            return (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <div className={`flex-1 flex items-center justify-between rounded-lg px-3 py-2.5 ${cfg.bg}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-700 truncate">{item.label}</p>
                      <span className="text-xs text-gray-400 bg-white/60 px-1.5 py-0.5 rounded flex-shrink-0">
                        {cfg.tag}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{item.detail}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-3">
                    {formatTime(item.time)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;