import Announcements from "@/components/Announcements";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

const ParentPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [keys: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const { userId } = await auth();

  //  Fetch parent with all children 
  const parent = await prisma.parent.findUnique({
    where: { id: userId! },
    include: {
      students: {
        include: {
          class: {
            include: {
              grade:   { select: { level: true } },
              lessons: {
                include: {
                  teacher: { select: { name: true, surname: true, email: true } },
                  subject: { select: { name: true } },
                },
              },
            },
          },
          attendances: { select: { present: true } },
          results:     { select: { score: true }, take: 10, orderBy: { id: "desc" } },
        },
      },
    },
  });

  const children = parent?.students ?? [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const getGrade = (score: number) => {
    if (score >= 90) return { label: "A+", color: "text-emerald-600" };
    if (score >= 80) return { label: "A",  color: "text-green-600"   };
    if (score >= 70) return { label: "B+", color: "text-blue-600"    };
    if (score >= 60) return { label: "B",  color: "text-indigo-600"  };
    if (score >= 50) return { label: "C",  color: "text-yellow-600"  };
    if (score >= 40) return { label: "D",  color: "text-orange-600"  };
    return { label: "F", color: "text-red-500" };
  };

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">

      {/* Left portion  */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">

        {/* ── Greeting card ── */}
        <div className="bg-gradient-to-r from-lamaYellow to-lamaSky rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-10 right-20 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

          <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0 relative z-10">
            <Image src="/parent.png" alt="" width={36} height={36} />
          </div>

          <div className="relative z-10 flex-1 min-w-0">
            <p className="text-yellow-900 text-sm font-medium">{greeting()},</p>
            <h1 className="text-2xl font-bold text-yellow-950 truncate">
              {parent?.name} {parent?.surname} 
            </h1>
            <p className="text-yellow-800/70 text-xs mt-1">
              You have {children.length} child{children.length !== 1 ? "ren" : ""} enrolled at SkoolX
            </p>
          </div>

          <div className="hidden md:flex flex-col items-center flex-shrink-0 relative z-10 bg-yellow-900/20 rounded-xl px-5 py-3 text-center">
            <p className="text-2xl font-bold text-yellow-950">{children.length}</p>
            <p className="text-yellow-900 text-xs mt-0.5">
              {children.length === 1 ? "Child" : "Children"}
            </p>
          </div>
        </div>

        {/* ── Children profiles ── */}
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-gray-800">
            {children.length === 1 ? "Child Profile" : "Children Profiles"}
          </h2>

          {children.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm">
              No children enrolled yet
            </div>
          ) : (
            children.map((child) => {
              const totalAtt   = child.attendances.length;
              const presentAtt = child.attendances.filter((a) => a.present).length;
              const attRate    = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : null;
              const scores     = child.results.map((r) => r.score);
              const avgScore   = scores.length > 0
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : null;
              const grade      = avgScore !== null ? getGrade(avgScore) : null;

              return (
                <div key={child.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {/* Child header */}
                  <div className="flex items-center gap-4 p-4 border-b border-gray-50">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lamaSky to-lamaPurple flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {child.img ? (
                        <Image
                          src={child.img}
                          alt=""
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        child.name[0]
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">
                        {child.name} {child.surname}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs bg-lamaSkyLight text-gray-600 px-2 py-0.5 rounded-full">
                          Grade {child.class?.grade?.level ?? "—"}
                        </span>
                        <span className="text-xs bg-lamaPurpleLight text-gray-600 px-2 py-0.5 rounded-full">
                          Section {child.class?.name ?? "—"}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/list/students/${child.id}`}
                      className="text-xs text-lamaSky hover:underline flex-shrink-0"
                    >
                      View profile →
                    </Link>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 divide-x divide-gray-50">
                    <div className="p-3 text-center">
                      <p className={`text-lg font-bold ${
                        attRate !== null
                          ? attRate >= 75 ? "text-green-600" : "text-red-500"
                          : "text-gray-400"
                      }`}>
                        {attRate !== null ? `${attRate}%` : "N/A"}
                      </p>
                      <p className="text-xs text-gray-400">Attendance</p>
                    </div>
                    <div className="p-3 text-center">
                      <p className={`text-lg font-bold ${grade?.color ?? "text-gray-400"}`}>
                        {avgScore !== null ? grade?.label : "N/A"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {avgScore !== null ? `Avg ${avgScore}/100` : "No results"}
                      </p>
                    </div>
                    <div className="p-3 text-center">
                      <p className="text-lg font-bold text-gray-700">
                        {child.class?.lessons?.length ?? 0}
                      </p>
                      <p className="text-xs text-gray-400">Lessons</p>
                    </div>
                  </div>

                  {/* Quick links for this child */}
                  <div className="flex gap-2 px-4 pb-4 pt-2 flex-wrap">
                    {[
                      { label: "Results",    href: `/list/results?studentId=${child.id}`,    color: "bg-lamaYellowLight" },
                      { label: "Attendance", href: `/list/attendance`,                        color: "bg-lamaSkyLight"   },
                      { label: "Exams",      href: `/list/exams`,                             color: "bg-pink-50"        },
                      { label: "Assignments",href: `/list/assignments`,                       color: "bg-lamaPurpleLight"},
                    ].map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className={`text-xs px-3 py-1.5 rounded-lg ${l.color} text-gray-600 hover:opacity-80 transition-opacity font-medium`}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Teacher contacts ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Teacher Contacts</h2>

          {children.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No teachers to show</p>
          ) : (
            <div className="flex flex-col gap-3">
              {children.map((child) => {
                // Deduplicate teachers by id
                const teacherMap = new Map<string, {
                  name: string; surname: string;
                  email: string | null; subjects: string[];
                }>();

                child.class?.lessons?.forEach((lesson) => {
                  const t = lesson.teacher;
                  const key = `${t.name}-${t.surname}`;
                  if (!teacherMap.has(key)) {
                    teacherMap.set(key, {
                      name:    t.name,
                      surname: t.surname,
                      email:   (t as any).email ?? null,
                      subjects: [],
                    });
                  }
                  teacherMap.get(key)!.subjects.push(lesson.subject.name);
                });

                const teachers = Array.from(teacherMap.values());

                if (teachers.length === 0) return null;

                return (
                  <div key={child.id}>
                    {/* Child label if multiple children */}
                    {children.length > 1 && (
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {child.name}&apos;s teachers
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {teachers.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-lamaSkyLight transition-colors"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lamaYellow to-lamaPurple flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {t.name[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {t.name} {t.surname}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {t.subjects.slice(0, 2).join(", ")}
                              {t.subjects.length > 2 ? ` +${t.subjects.length - 2}` : ""}
                            </p>
                            {t.email && (
                              <a
                                href={`mailto:${t.email}`}
                                className="text-xs text-purple-900  hover:underline truncate block"
                              >
                                {t.email}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right portion */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={resolvedSearchParams} />
        <Announcements />
      </div>
    </div>
  );
};

export default ParentPage;