import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

const TeacherPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [keys: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const { userId } = await auth();

  // Fetch teacher with all related data 
  const teacher = await prisma.teacher.findUnique({
    where: { id: userId! },
    include: {
      subjects: { select: { id: true, name: true } },
      lessons: {
        include: {
          class:   { select: { id: true, name: true, _count: { select: { students: true } } } },
          subject: { select: { name: true } },
        },
      },
    },
  });

  // Derived stats 
  // Unique classes
  const classMap = new Map<number, { name: string; studentCount: number }>();
  teacher?.lessons.forEach((l) => {
    if (!classMap.has(l.class.id)) {
      classMap.set(l.class.id, {
        name:         l.class.name,
        studentCount: l.class._count.students,
      });
    }
  });
  const uniqueClasses  = Array.from(classMap.values());
  const totalClasses   = uniqueClasses.length;
  const totalStudents  = uniqueClasses.reduce((s, c) => s + c.studentCount, 0);
  const totalLessons   = teacher?.lessons.length ?? 0;
  const subjectNames   = teacher?.subjects.map((s) => s.name) ?? [];

  // Recent exams this teacher is involved in
  const recentExams = await prisma.exam.findMany({
    where: { lesson: { teacherId: userId! } },
    include: { lesson: { include: { subject: { select: { name: true } }, class: { select: { name: true } } } } },
    orderBy: { startTime: "asc" },
    take: 4,
  });

  // Upcoming assignments
  const upcomingAssignments = await prisma.assignment.findMany({
    where: {
      lesson: { teacherId: userId! },
      dueDate: { gte: new Date() },
    },
    include: { lesson: { include: { subject: { select: { name: true } }, class: { select: { name: true } } } } },
    orderBy: { dueDate: "asc" },
    take: 4,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);

  const getDaysLeft = (d: Date) => {
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff < 0)  return "Overdue";
    return `${diff}d left`;
  };

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">

      {/* LEFT PORTION */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">

        {/* ── Greeting card ── */}
        <div className="bg-gradient-to-r from-lamaPurple via-lamaSky to-lamaPurple rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-10 right-20 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

          {/* Avatar */}
          <div className="flex-shrink-0 relative z-10">
            <Image
              src={teacher?.img || "/noAvatar.png"}
              alt="avatar"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-4 border-white/40 shadow-md"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 relative z-10">
            <p className="text-purple-900 text-sm font-medium">{greeting()},</p>
            <h1 className="text-2xl font-bold text-purple-950 truncate">
              {teacher?.name} {teacher?.surname} 
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {subjectNames.slice(0, 3).map((s) => (
                <span key={s} className="bg-purple-900/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {s}
                </span>
              ))}
              {subjectNames.length > 3 && (
                <span className="bg-purple-900/50 text-white text-xs px-2 py-1 rounded-full">
                  +{subjectNames.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Classes stat */}
          <div className="hidden md:flex flex-col items-center flex-shrink-0 relative z-10 bg-purple-900/20 rounded-xl px-5 py-3 text-center">
            <p className="text-2xl font-bold text-purple-950">{totalClasses}</p>
            <p className="text-purple-900 text-xs mt-0.5">
              {totalClasses === 1 ? "Class" : "Classes"}
            </p>
          </div>
        </div>

        {/* ── Profile info card ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Profile</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Full name",    value: `${teacher?.name ?? ""} ${teacher?.surname ?? ""}`,            icon: "/teacher.png"         },
              { label: "Email",        value: teacher?.email       ?? "Not provided",                          icon: "/mail.png"            },
              { label: "Phone",        value: teacher?.phone       ?? "Not provided",                          icon: "/phone.png"           },
              { label: "Blood type",   value: teacher?.bloodType   ?? "—",                                     icon: "/blood.png"           },
              { label: "Address",      value: teacher?.address     ?? "—",                                     icon: "/singleClass.png"     },
              { label: "Subjects",     value: subjectNames.join(", ") || "—",                                  icon: "/subject.png"         },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-lamaSkyLight flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Image src={item.icon} alt="" width={14} height={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm font-medium text-gray-700 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-lamaSkyLight flex items-center justify-center flex-shrink-0">
              <Image src="/singleClass.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{totalClasses}</p>
              <p className="text-xs text-gray-400">Classes</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-lamaYellowLight flex items-center justify-center flex-shrink-0">
              <Image src="/student.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{totalStudents}</p>
              <p className="text-xs text-gray-400">Students</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-lamaPurpleLight flex items-center justify-center flex-shrink-0">
              <Image src="/lesson.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{totalLessons}</p>
              <p className="text-xs text-gray-400">Lessons</p>
            </div>
          </div>
        </div>

        {/* ── Assigned classes ── */}
        {uniqueClasses.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Assigned classes</h2>
              <span className="text-xs text-gray-400">{totalClasses} total</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {uniqueClasses.map((c) => (
                <div key={c.name} className="flex items-center gap-2.5 bg-lamaSkyLight rounded-lg px-3 py-2.5">
                  <div className="w-7 h-7 rounded-full bg-lamaSky flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.studentCount} students</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Exams + Assignments row ── */}
        <div className="flex gap-4 flex-col md:flex-row">

          {/* Upcoming exams */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Exams</h2>
              <Link href="/list/exams" className="text-xs text-lamaSky hover:underline">View all →</Link>
            </div>
            {recentExams.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No exams scheduled</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentExams.map((exam) => {
                  const isPast = exam.startTime < new Date();
                  return (
                    <div key={exam.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-pink-50">
                      <div className="w-1.5 h-8 rounded-full bg-pink-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{exam.title}</p>
                        <p className="text-xs text-gray-400">
                          {exam.lesson.subject.name} · {exam.lesson.class.name}
                        </p>
                      </div>
                      <span className={`text-xs font-medium flex-shrink-0 ${isPast ? "text-gray-400" : "text-pink-600"}`}>
                        {isPast ? "Done" : fmtDate(exam.startTime).split(",")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming assignments */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Assignments</h2>
              <Link href="/list/assignments" className="text-xs text-lamaSky hover:underline">View all →</Link>
            </div>
            {upcomingAssignments.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No upcoming assignments</p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingAssignments.map((asgn) => {
                  const daysLabel = getDaysLeft(asgn.dueDate);
                  const isUrgent  = asgn.dueDate.getTime() - Date.now() < 86400000 * 2;
                  return (
                    <div key={asgn.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-lamaYellowLight">
                      <div className="w-1.5 h-8 rounded-full bg-lamaYellow flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{asgn.title}</p>
                        <p className="text-xs text-gray-400">
                          {asgn.lesson.subject.name} · {asgn.lesson.class.name}
                        </p>
                      </div>
                      <span className={`text-xs font-medium flex-shrink-0 ${isUrgent ? "text-red-500" : "text-gray-500"}`}>
                        {daysLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Schedule ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 min-h-[600px]">
          <h2 className="text-base font-semibold text-gray-800 mb-3">My Schedule</h2>
          <BigCalendarContainer type="teacherId" id={userId!} />
        </div>
      </div>

      {/* RIGHT PORTION  */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={resolvedSearchParams} />
        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;