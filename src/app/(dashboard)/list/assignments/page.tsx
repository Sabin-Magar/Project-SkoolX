// import FormModal from "@/components/FormModal";
// import Pagination from "@/components/Pagination";
// import Table from "@/components/Table";
// import TableSearch from "@/components/TableSearch";
// import prisma from "@/lib/prisma";
// import { ITEM_PER_PAGE } from "@/lib/settings";
// import { auth } from "@clerk/nextjs/server";
// import { Assignment, Class, Prisma, Subject, Teacher } from "@prisma/client";
// import Image from "next/image";

// type AssignmentList = Assignment & {
//   lesson: {
//     subject: Subject;
//     class: Class;
//     teacher: Teacher;
//   };
// };

// const AssignmentListPage = async ({
//   searchParams,
// }: {
//   // searchParams: { [key: string]: string  | undefined};
//   searchParams: Promise<{ [key: string]: string  | undefined}>;
// }) => {
  
//   const { userId, sessionClaims } = await auth();
//   const role = (sessionClaims?.metadata as { role?: string })?.role;
//   const currentUserId = userId;
  
  
//   const columns = [
//     {
//       header: "Subject Name",
//       accessor: "name",
//     },
//     {
//       header: "Class",
//       accessor: "class",
//     },
//     {
//       header: "Teacher",
//       accessor: "teacher",
//       className: "hidden md:table-cell",
//     },
//     {
//       header: "Due Date",
//        accessor: "dueDate",
//        className: "hidden md:table-cell",
//       },
//       ...(role === "admin" || role === "teacher"
//         ? [
//           {
//             header: "Actions",
//             accessor: "action",
//           },
//         ]
//         : []),
//       ];
      
      
//       const renderRow = (item:AssignmentList) => (
//         <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
//             <td className="flex items-center gap-4 p-4">{item.lesson.subject.name}</td>
//             <td>{item.lesson.class.name}</td>
//             <td className="hidden md:table-cell">{item.lesson.teacher.name + " " + item.lesson.teacher.surname}</td>
//             <td className="hidden md:table-cell">{new Intl.DateTimeFormat("en-US").format(item.dueDate)}</td>
      
//             <td>
//               <div className="flex items-center gap-2">
//                 {(role === "admin" || role === "teacher") && (
//                   <>
//                     <FormModal table="assignment" type="update" data={item}/>
//                     <FormModal table="assignment" type="delete" id={item.id}/>
//                   </>
//                 )}
//               </div>
//             </td>
//           </tr>
//       );


//   const resolvedParams = await searchParams;
//   // ---------------- use resolvedParams instead of searchParams to avoid hydration issue ----------------
//   // const { page, ...queryParams } = searchParams;
//   const { page, ...queryParams } = resolvedParams;

//   const p = page ? parseInt(page) : 1;

//   // URL Params conditions

//   const query: Prisma.AssignmentWhereInput = {};

//   query.lesson = {};

//   if (queryParams) {
//     for (const [key, value] of Object.entries(queryParams)) {
//       if (value !== undefined) {
//         switch (key) {
//           case "classId":
//             query.lesson.classId = parseInt(value);
//             break;
//           case "teacherId":
//             query.lesson.teacherId = value;
//             break;
//           case "search":
//             query.lesson.subject = {
//               name: { contains: value, mode: "insensitive" },
//             };
//             break;
//           default:
//             break;
//         }
//       }
//     }
//   }

//   // ROLE CONDITIONS

//   switch (role) {
//     case "admin":
//       break;
//     case "teacher":
//       query.lesson.teacherId = currentUserId!; 
//       break;
//     case "student":
//       query.lesson.class = {
//         students: {
//           some: {
//             id: currentUserId!,
//           },
//         },
//       };
//       break;
//     case "parent":
//       query.lesson.class = {
//         students: {
//           some: {
//             parentId: currentUserId!,
//           },
//         },
//       };
//       break;
//     default:
//       break;
//   }

//   const [data, count] = await prisma.$transaction([
//     prisma.assignment.findMany({
//       where: query,
//       include: {
//         lesson: {
//           select: {
//             subject: { select: { name: true } },
//             teacher: { select: { name: true, surname: true } },
//             class: { select: { name: true } },
//           },
//         },
//       },
//       take: ITEM_PER_PAGE,
//       skip: ITEM_PER_PAGE * (p - 1),
//     }),
//     prisma.assignment.count({ where: query }),
//   ]);

//   return (
//     <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
//       {/* Top section */}
//       <div className="flex items-center justify-between">
//         <h1 className="hidden md:block text-lg font-semibold">All Assignments</h1>
//         <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
//           <TableSearch />
//           <div className="flex items-center gap-4 self-end">
//             <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
//               <Image src="/filter.png" alt="" width={14} height={14} />
//             </button>
//             <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
//               <Image src="/sort.png" alt="" width={14} height={14} />
//             </button>
//             {(role === "admin" || role === "teacher") && (
//               <FormModal table="assignment" type="create"/>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* List Section */}
//       <Table columns={columns} renderRow={renderRow} data={data}/>

//       {/* Pagination Section */}
//       <Pagination page={p} count={count} />
//     </div>
//   )
// }

// export default AssignmentListPage;



import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Assignment, Class, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";

type AssignmentList = Assignment & {
  lesson: {
    subject: Subject;
    class: Class;
    teacher: Teacher;
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getAssignmentStatus = (startDate: Date, dueDate: Date) => {
  const now = new Date();
  if (now < startDate) return { label: "Not started", color: "bg-blue-100 text-blue-700" };
  if (now >= startDate && now <= dueDate) return { label: "Active", color: "bg-green-100 text-green-700" };
  return { label: "Overdue", color: "bg-red-100 text-red-600" };
};

const getDaysLeft = (dueDate: Date) => {
  const now = new Date();
  const diff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, color: "text-red-500" };
  if (diff === 0) return { text: "Due today", color: "text-orange-500" };
  if (diff === 1) return { text: "Due tomorrow", color: "text-yellow-600" };
  return { text: `${diff}d left`, color: "text-gray-500" };
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

// ── Assignment Card ───────────────────────────────────────────────────────────

const AssignmentCard = ({
  item,
  role,
}: {
  item: AssignmentList;
  role: string | undefined;
}) => {
  const status    = getAssignmentStatus(item.startDate, item.dueDate);
  const daysLeft  = getDaysLeft(item.dueDate);
  const subColor  = subjectColors[item.lesson.subject.name] ?? "bg-lamaSkyLight text-gray-700";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col gap-3">

      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-800 text-sm leading-snug truncate">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${subColor}`}>
              {item.lesson.subject.name}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-medium text-gray-500">{item.lesson.class.name}</p>
          <p className={`text-xs font-medium mt-0.5 ${daysLeft.color}`}>{daysLeft.text}</p>
        </div>
      </div>

      {/* Date details */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-xs text-gray-400 mb-0.5">Assigned</p>
          <p className="text-xs font-medium text-gray-700">
            {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(item.startDate)}
          </p>
          <p className="text-xs text-gray-500">
            {new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(item.startDate)}
          </p>
        </div>
        <div className={`rounded-lg p-2.5 ${
          getDaysLeft(item.dueDate).color === "text-red-500" ? "bg-red-50" : "bg-gray-50"
        }`}>
          <p className="text-xs text-gray-400 mb-0.5">Due</p>
          <p className="text-xs font-medium text-gray-700">
            {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(item.dueDate)}
          </p>
          <p className="text-xs text-gray-500">
            {new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(item.dueDate)}
          </p>
        </div>
      </div>

      {/* Teacher + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lamaYellow to-lamaPurple flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {item.lesson.teacher.name[0]}
          </div>
          <span className="text-xs text-gray-500 truncate">
            {item.lesson.teacher.name} {item.lesson.teacher.surname}
          </span>
        </div>
        {(role === "admin" || role === "teacher") && (
          <div className="flex items-center gap-1.5">
            <FormContainer table="assignment" type="update" data={item} />
            <FormContainer table="assignment" type="delete" id={item.id} />
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

const AssignmentListPage = async ({
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
  const baseQuery: Prisma.AssignmentWhereInput = { lesson: {} };

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
  const activeQuery: Prisma.AssignmentWhereInput =
    activeTab === "active"
      ? { ...baseQuery, startDate: { lte: now }, dueDate: { gte: now } }
      : activeTab === "upcoming"
      ? { ...baseQuery, startDate: { gt: now } }
      : activeTab === "overdue"
      ? { ...baseQuery, dueDate: { lt: now } }
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

  const [data, count, allAssignments] = await prisma.$transaction([
    prisma.assignment.findMany({
      where: activeQuery,
      include,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { dueDate: "asc" },
    }),
    prisma.assignment.count({ where: activeQuery }),
    prisma.assignment.findMany({
      where: baseQuery,
      select: { startDate: true, dueDate: true },
    }),
  ]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalCount    = allAssignments.length;
  const activeCount   = allAssignments.filter((a) => a.startDate <= now && a.dueDate >= now).length;
  const upcomingCount = allAssignments.filter((a) => a.startDate > now).length;
  const overdueCount  = allAssignments.filter((a) => a.dueDate < now).length;

  const assignments = data as unknown as AssignmentList[];

  // split for "all" tab sections
  const activeAssignments   = assignments.filter((a) => a.startDate <= now && a.dueDate >= now);
  const upcomingAssignments = assignments.filter((a) => a.startDate > now);
  const overdueAssignments  = assignments.filter((a) => a.dueDate < now);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const tabs = [
    { key: "all",      label: "All",      count: totalCount },
    { key: "active",   label: "Active",   count: activeCount },
    { key: "upcoming", label: "Upcoming", count: upcomingCount },
    { key: "overdue",  label: "Overdue",  count: overdueCount },
  ];

  return (
    <div className="p-4 flex flex-col gap-4 flex-1 m-4 mt-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Assignments</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {count} {activeTab === "all" ? "total" : activeTab} assignment{count !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TableSearch />
          {(role === "admin" || role === "teacher") && (
            <FormContainer table="assignment" type="create" />
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      {totalCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total"    value={totalCount}    color="bg-lamaSkyLight text-gray-700" />
          <StatCard label="Active"   value={activeCount}   sub="in progress"  color="bg-green-50 text-green-700" />
          <StatCard label="Upcoming" value={upcomingCount} sub="not started"  color="bg-blue-50 text-blue-700" />
          <StatCard label="Overdue"  value={overdueCount}  sub="past due date" color="bg-red-50 text-red-600" />
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
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === t.key ? "bg-gray-100 text-gray-600" : "bg-gray-200 text-gray-500"
            }`}>
              {t.count}
            </span>
          </a>
        ))}
      </div>

      {/* ── Content ── */}
      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Image src="/assignment.png" alt="" width={28} height={28} />
          </div>
          <p className="text-gray-500 font-medium">
            No {activeTab === "all" ? "" : activeTab} assignments found
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {role === "admin" || role === "teacher"
              ? "Create your first assignment using the button above."
              : "No assignments available yet."}
          </p>
        </div>
      ) : activeTab === "all" ? (
        <div className="flex flex-col gap-6">

          {/* Active */}
          {activeAssignments.length > 0 && (
            <div>
              <SectionHeading dot="bg-green-400" title="Active" count={activeAssignments.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {activeAssignments.map((item) => (
                  <AssignmentCard key={item.id} item={item} role={role} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingAssignments.length > 0 && (
            <div>
              <SectionHeading dot="bg-blue-400" title="Upcoming" count={upcomingAssignments.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {upcomingAssignments.map((item) => (
                  <AssignmentCard key={item.id} item={item} role={role} />
                ))}
              </div>
            </div>
          )}

          {/* Overdue */}
          {overdueAssignments.length > 0 && (
            <div>
              <SectionHeading dot="bg-red-400" title="Overdue" count={overdueAssignments.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {overdueAssignments.map((item) => (
                  <AssignmentCard key={item.id} item={item} role={role} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {assignments.map((item) => (
            <AssignmentCard key={item.id} item={item} role={role} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AssignmentListPage;