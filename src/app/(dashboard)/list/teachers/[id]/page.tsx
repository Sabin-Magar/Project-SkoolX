import Announcements from "@/components/Announcements"
import BigCalendarContainer from "@/components/BigCalendarContainer"
import FormContainer from "@/components/FormContainer"
import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { Teacher } from "@prisma/client"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

const SingleTeacherPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const teacher:
    | (Teacher & {
        _count: { subjects: number; lessons: number; classes: number };
      })
    | null = await prisma.teacher.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          subjects: true,
          lessons: true,
          classes: true,
        },
      },
    },
  });

  if (!teacher) return notFound();

  // ── Additional data ───────────────────────────────────────────────────────
  const [subjects, recentExams, recentAssignments, classesList] = await Promise.all([
    prisma.subject.findMany({
      where: { teachers: { some: { id } } },
      select: { id: true, name: true },
    }),
    prisma.exam.findMany({
      where: { lesson: { teacherId: id } },
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            class:   { select: { name: true } },
          },
        },
      },
      orderBy: { startTime: "desc" },
      take: 5,
    }),
    prisma.assignment.findMany({
      where: { lesson: { teacherId: id } },
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            class:   { select: { name: true } },
          },
        },
      },
      orderBy: { dueDate: "desc" },
      take: 5,
    }),
    prisma.class.findMany({
      where: { lessons: { some: { teacherId: id } } },
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } },
        grade: { select: { level: true } },
      },
    }),
  ]);

  const totalStudents = classesList.reduce((s, c) => s + c._count.students, 0);

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);

  const getExamStatus = (start: Date, end: Date) => {
    const now = new Date();
    if (now < start) return { label: "Upcoming", color: "bg-blue-100 text-blue-700" };
    if (now >= start && now <= end) return { label: "Ongoing", color: "bg-green-100 text-green-700" };
    return { label: "Done", color: "bg-gray-100 text-gray-500" };
  };

  const getDaysLeft = (d: Date) => {
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (diff < 0)  return { label: "Overdue",  color: "text-red-500"   };
    if (diff === 0) return { label: "Today",   color: "text-orange-500" };
    if (diff === 1) return { label: "Tomorrow", color: "text-yellow-600" };
    return { label: `${diff}d left`, color: "text-gray-500" };
  };

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">

      {/* ── LEFT SECTION ── */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">

        {/* Top section — profile card + small stat cards */}
        <div className="flex flex-col lg:flex-row gap-4">

          {/* User information card */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src={teacher.img || "/noAvatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>

            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {teacher.name + " " + teacher.surname}
                </h1>
                {role === "admin" && (
                  <FormContainer table="teacher" type="update" data={teacher} />
                )}
              </div>

              {/* General text — replaces Lorem ipsum */}
              <p className="text-sm text-gray-500">
                A dedicated educator at SkoolX, shaping minds and inspiring
                students to reach their full potential.
              </p>

              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/blood.png" alt="" width={14} height={14} />
                  <span>{teacher.bloodType}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>{new Intl.DateTimeFormat("en-GB").format(teacher.birthday)}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{teacher.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{teacher.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Small stat cards — attendance replaced with total students */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* Total students — replaces attendance (no teacher attendance system) */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image src="/student.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{totalStudents}</h1>
                <span className="text-sm text-gray-400">Students</span>
              </div>
            </div>

            {/* Subjects */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image src="/singleBranch.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{teacher._count.subjects}</h1>
                <span className="text-sm text-gray-400">Subjects</span>
              </div>
            </div>

            {/* Lessons */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image src="/singleLesson.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{teacher._count.lessons}</h1>
                <span className="text-sm text-gray-400">Lessons</span>
              </div>
            </div>

            {/* Classes */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image src="/singleClass.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{teacher._count.classes}</h1>
                <span className="text-sm text-gray-400">Classes</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Subjects taught ── */}
        {subjects.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Subjects taught</h2>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <span
                  key={s.id}
                  className="text-sm font-medium bg-lamaSkyLight text-gray-700 px-3 py-1.5 rounded-full"
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Assigned classes ── */}
        {classesList.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Assigned classes</h2>
              <span className="text-xs text-gray-400">{classesList.length} classes · {totalStudents} students</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {classesList.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 bg-lamaSkyLight rounded-lg px-3 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-lamaSky flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">
                      Grade {c.grade?.level} · {c._count.students} students
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent exams + assignments — replaces calendar ── */}
        <div className="flex gap-4 flex-col md:flex-row">

          {/* Recent exams */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 text-sm">Recent exams</h2>
              <Link href={`/list/exams?teacherId=${teacher.id}`} className="text-xs text-lamaSky hover:underline">
                View all →
              </Link>
            </div>
            {recentExams.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No exams yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentExams.map((exam) => {
                  const st = getExamStatus(exam.startTime, exam.endTime);
                  return (
                    <div key={exam.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-pink-50">
                      <div className="w-1.5 h-8 rounded-full bg-pink-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{exam.title}</p>
                        <p className="text-xs text-gray-400">
                          {exam.lesson.subject.name} · {exam.lesson.class.name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                          {st.label}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(exam.startTime)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent assignments */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 text-sm">Recent assignments</h2>
              <Link href={`/list/assignments?teacherId=${teacher.id}`} className="text-xs text-lamaSky hover:underline">
                View all →
              </Link>
            </div>
            {recentAssignments.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No assignments yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentAssignments.map((asgn) => {
                  const dl = getDaysLeft(asgn.dueDate);
                  return (
                    <div key={asgn.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-lamaYellowLight">
                      <div className="w-1.5 h-8 rounded-full bg-lamaYellow flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{asgn.title}</p>
                        <p className="text-xs text-gray-400">
                          {asgn.lesson.subject.name} · {asgn.lesson.class.name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-medium ${dl.color}`}>{dl.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(asgn.dueDate)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">                 
            <h1>Teacher&apos;s Schedule</h1>
            <BigCalendarContainer type="teacherId" id={teacher.id} />
        </div>

      </div>

      {/* ── RIGHT SECTION ── */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">

        {/* Shortcuts — fixed with actual teacher.id */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link className="p-3 rounded-md bg-lamaSkyLight" href={`/list/classes?supervisorId=${teacher.id}`}>
              Teacher&apos;s Classes
            </Link>
            <Link className="p-3 rounded-md bg-lamaPurpleLight" href={`/list/students?teacherId=${teacher.id}`}>
              Teacher&apos;s Students
            </Link>
            <Link className="p-3 rounded-md bg-lamaYellowLight" href={`/list/lessons?teacherId=${teacher.id}`}>
              Teacher&apos;s Lessons
            </Link>
            <Link className="p-3 rounded-md bg-pink-50" href={`/list/exams?teacherId=${teacher.id}`}>
              Teacher&apos;s Exams
            </Link>
            <Link className="p-3 rounded-md bg-lamaSkyLight" href={`/list/assignments?teacherId=${teacher.id}`}>
              Teacher&apos;s Assignments
            </Link>
          </div>
        </div>

        {/* Teacher info summary — replaces Performance */}
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Teacher summary</h2>
          <div className="flex flex-col gap-3">
            {[
              { label: "Full name",  value: `${teacher.name} ${teacher.surname}`,     icon: "/teacher.png"     },
              { label: "Email",      value: teacher.email    ?? "Not provided",         icon: "/mail.png"        },
              { label: "Phone",      value: teacher.phone    ?? "Not provided",         icon: "/phone.png"       },
              { label: "Address",    value: teacher.address  ?? "—",                    icon: "/singleClass.png" },
              { label: "Blood type", value: teacher.bloodType,                          icon: "/blood.png"       },
              { label: "Birthday",   value: new Intl.DateTimeFormat("en-GB").format(teacher.birthday), icon: "/date.png" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-lamaSkyLight flex items-center justify-center flex-shrink-0">
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

        <Announcements />
      </div>

    </div>
  );
};

export default SingleTeacherPage;