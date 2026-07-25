import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import {
  scheduleEvents,
  sortByEDF,
  getPriorityLabel,
  type SchedulableEvent,
  type ScheduledEvent,
} from "@/lib/eventScheduler";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getDuration = (start: Date, end: Date) => {
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const getTimeUntil = (date: Date, now: Date) => {
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
};

const getTimeAgo = (date: Date, now: Date) => {
  const diff = now.getTime() - date.getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "just now";
};

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);

const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);

// ── Page ──────────────────────────────────────────────────────────────────────

const EventListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { userId, sessionClaims } = await auth();
  const role          = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const resolvedParams  = await searchParams;
  const { page, search, tab, priority: pFilter } = resolvedParams;
  const p              = page ? parseInt(page) : 1;
  const activeTab      = tab  || "scheduled";
  const activePriority = pFilter || "all";

  // ── Role-based query ──────────────────────────────────────────────────────
  // Events visible to this user:
  // 1. targetRole = "ALL"  → visible to everyone
  // 2. targetRole = role   → visible to matching role
  // 3. classId filter for class-specific events
  const roleConditions: Record<string, any> = {
    teacher: { lessons: { some: { teacherId: currentUserId! } } },
    student: { students: { some: { id: currentUserId! } } },
    parent:  { students: { some: { parentId: currentUserId! } } },
  };

  const baseWhere: Prisma.EventWhereInput = {
    AND: [
      {
        OR: [
          { targetRole: "ALL" },
          { targetRole: role?.toUpperCase() },
        ],
      },
      {
        OR: [
          { classId: null },
          { class: role && roleConditions[role] ? roleConditions[role] : {} },
        ],
      },
      ...(search
        ? [{
            OR: [
              { title:       { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }]
        : []),
    ],
  };

  // ── Fetch all matching events (for scheduling algorithm)─────────────────────────────────────────────────────────────────
  const raw = await prisma.event.findMany({
    where: baseWhere,
    include: { class: { select: { name: true } } },
  });

  const now = new Date();

  const allEvents: SchedulableEvent[] = raw.map((e) => ({
    ...e,
    priority:   (e as any).priority   ?? 5,
    targetRole: (e as any).targetRole ?? "ALL",
  }));

  // ── ALGORITHM: Priority + EDF scheduling ──────────────────────────────────
    // scheduleEvents() sorts events by:
  //   combined_score = priority_score * 0.6 + urgency_score * 0.4
  // This is the main scheduled view — most important events first.
  const scheduledAll: ScheduledEvent[] = scheduleEvents(allEvents, now);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const upcomingCount  = allEvents.filter((e) => now < e.startTime).length;
  const ongoingCount   = allEvents.filter((e) => now >= e.startTime && now <= e.endTime).length;
  const completedCount = allEvents.filter((e) => now > e.endTime).length;
  const criticalCount  = allEvents.filter((e) => e.priority >= 9).length;
  const highCount      = allEvents.filter((e) => e.priority >= 7 && e.priority < 9).length;
  const mediumCount    = allEvents.filter((e) => e.priority >= 5 && e.priority < 7).length;
  const lowCount       = allEvents.filter((e) => e.priority < 5).length;

  // ── Status filter ─────────────────────────────────────────────────────────
  let statusFiltered: ScheduledEvent[] =
    activeTab === "upcoming"
      ? scheduledAll.filter((e) => e.status === "upcoming")
      : activeTab === "ongoing"
      ? scheduledAll.filter((e) => e.status === "ongoing")
      : activeTab === "completed"
      ? scheduledAll.filter((e) => e.status === "completed")
      : activeTab === "edf"
      ? (sortByEDF(allEvents) as any[]).map((e) => ({
          ...e,
          scheduledScore: 0,
          urgencyScore:   0,
          priorityScore:  0,
          status:
            now < e.startTime ? "upcoming"
            : now <= e.endTime ? "ongoing"
            : "completed",
        }))
      : scheduledAll;

  // ── Priority filter ───────────────────────────────────────────────────────
  const finalEvents: ScheduledEvent[] =
    activePriority === "critical" ? statusFiltered.filter((e) => e.priority >= 9)
    : activePriority === "high"   ? statusFiltered.filter((e) => e.priority >= 7 && e.priority < 9)
    : activePriority === "medium" ? statusFiltered.filter((e) => e.priority >= 5 && e.priority < 7)
    : activePriority === "low"    ? statusFiltered.filter((e) => e.priority < 5)
    : statusFiltered;

  const totalCount = finalEvents.length;
  const pageEvents = finalEvents.slice(ITEM_PER_PAGE * (p - 1), ITEM_PER_PAGE * p);

  // ── URL builder ───────────────────────────────────────────────────────────
  const buildUrl = (params: Record<string, string>) => {
    const base = new URLSearchParams();
    base.set("tab",      activeTab);
    base.set("priority", activePriority);
    base.set("page",     "1");
    Object.entries(params).forEach(([k, v]) => base.set(k, v));
    return `?${base.toString()}`;
  };

  const tabDefs = [
    { key: "scheduled", label: "Scheduled",    count: scheduledAll.length  },
    { key: "ongoing",   label: "Ongoing",      count: ongoingCount          },
    { key: "upcoming",  label: "Upcoming",     count: upcomingCount         },
    { key: "edf",       label: "Ending soon",  count: scheduledAll.length  },
    { key: "completed", label: "Completed",    count: completedCount        },
  ];

  const priorityDefs = [
    { key: "all",      label: "All",      count: allEvents.length, dot: "bg-gray-400"   },
    { key: "critical", label: "Critical", count: criticalCount,    dot: "bg-red-500"    },
    { key: "high",     label: "High",     count: highCount,        dot: "bg-orange-400" },
    { key: "medium",   label: "Medium",   count: mediumCount,      dot: "bg-yellow-400" },
    { key: "low",      label: "Low",      count: lowCount,         dot: "bg-blue-400"   },
  ];

  const targetRoleLabel: Record<string, string> = {
    ALL:     "All",
    ADMIN:   "Admin",
    TEACHER: "Teachers",
    STUDENT: "Students",
    PARENT:  "Parents",
  };

  return (
    <div className="p-4 flex flex-col gap-4 flex-1 m-4 mt-0">

      {/* ── Header  ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Event Scheduler</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Scheduled events : {totalCount} event{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TableSearch />
          {role === "admin" && (
            <FormContainer table="event" type="create" />
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      {allEvents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-50 text-green-700 rounded-xl p-4">
            <p className="text-2xl font-bold">{ongoingCount}</p>
            <p className="text-xs font-medium opacity-70 mt-0.5">Ongoing now</p>
          </div>
          <div className="bg-lamaSkyLight text-gray-700 rounded-xl p-4">
            <p className="text-2xl font-bold">{upcomingCount}</p>
            <p className="text-xs font-medium opacity-70 mt-0.5">Upcoming</p>
          </div>
          <div className="bg-red-50 text-red-700 rounded-xl p-4">
            <p className="text-2xl font-bold">{criticalCount}</p>
            <p className="text-xs font-medium opacity-70 mt-0.5">Critical priority</p>
          </div>
          <div className="bg-gray-50 text-gray-600 rounded-xl p-4">
            <p className="text-2xl font-bold">{completedCount}</p>
            <p className="text-xs font-medium opacity-70 mt-0.5">Completed</p>
          </div>
        </div>
      )}

      {/* ── Status tabs ── */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {tabDefs.map((t) => (
          <a
            key={t.key}
            href={buildUrl({ tab: t.key })}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
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

      {/* ── Priority filter pills ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 font-medium">Priority:</span>
        {priorityDefs.map((pd) => (
          <a
            key={pd.key}
            href={buildUrl({ priority: pd.key })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              activePriority === pd.key
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${pd.dot}`} />
            {pd.label}
            <span className={`px-1.5 py-0.5 rounded-full ${
              activePriority === pd.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {pd.count}
            </span>
          </a>
        ))}
      </div>

      {/* ── Algorithm note ── */}
      <p className="text-xs text-gray-400">
        {activeTab === "edf"
          ? "Sorted by Earliest Deadline First — events ending soonest appear first"
          : "Sorted by hybrid score: Priority (60%) + EDF deadline urgency (40%)"}
      </p>

      {/* ── Schedule queue ── */}
      {pageEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500 font-medium">No events in queue</p>
          <p className="text-gray-400 text-sm mt-1">
            {activePriority !== "all"
              ? `No ${activePriority} priority events for this filter`
              : "No events match the current filter"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">

          {/* Table header */}
          <div className="grid grid-cols-[2rem_1fr_7rem_7rem_6rem_5rem] gap-3 items-center px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <span className="text-center">#</span>
            <span>Event</span>
            <span className="hidden md:block text-center">Start</span>
            <span className="hidden md:block text-center">End</span>
            <span className="text-center">Status</span>
            {role === "admin" && <span className="text-center">Actions</span>}
          </div>

          {/* Event rows */}
          <div className="divide-y divide-gray-50">
            {pageEvents.map((event, index) => {
              const rank     = ITEM_PER_PAGE * (p - 1) + index + 1;
              const pr       = getPriorityLabel(event.priority);
              const score    = event.scheduledScore;
              const duration = getDuration(event.startTime, event.endTime);

              const timeLabel =
                event.status === "upcoming"
                  ? getTimeUntil(event.startTime, now)
                  : event.status === "ongoing"
                  ? "Live now"
                  : getTimeAgo(event.endTime, now);

              // Left border by priority
              const leftBorder =
                event.priority >= 9 ? "border-l-4 border-l-red-400"
                : event.priority >= 7 ? "border-l-4 border-l-orange-400"
                : event.priority >= 5 ? "border-l-4 border-l-yellow-300"
                : "border-l-4 border-l-blue-300";

              const rankBg =
                rank === 1 ? "bg-yellow-400 text-yellow-900"
                : rank === 2 ? "bg-gray-200 text-gray-600"
                : rank === 3 ? "bg-amber-400/80 text-amber-900"
                : "bg-gray-100 text-gray-500";

              return (
                <div
                  key={event.id}
                  className={`grid grid-cols-[2rem_1fr_7rem_7rem_6rem_5rem] gap-3 items-center px-5 py-4 hover:bg-gray-50 transition-colors ${leftBorder}`}
                >
                  {/* Rank */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankBg}`}>
                    {rank}
                  </div>

                  {/* Event info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {event.title}
                      </p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pr.bg} ${pr.color}`}>
                        P{event.priority} · {pr.label}
                      </span>
                      {event.class && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {event.class.name}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {targetRoleLabel[event.targetRole] ?? "All"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-1.5">
                      {event.description}
                    </p>
                    {/* Schedule score bar */}
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${
                            score >= 0.7 ? "bg-red-400"
                            : score >= 0.5 ? "bg-orange-400"
                            : score >= 0.3 ? "bg-yellow-400"
                            : "bg-blue-400"
                          }`}
                          style={{ width: `${Math.max(score * 100, 4)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        score {Math.round(score * 100)}%
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{duration} long</span>
                    </div>
                  </div>

                  {/* Start date/time */}
                  <div className="hidden md:flex flex-col items-center text-center flex-shrink-0">
                    <p className="text-xs font-medium text-gray-700">{fmtDate(event.startTime)}</p>
                    <p className="text-xs text-gray-400">{fmtTime(event.startTime)}</p>
                    {timeLabel && event.status === "upcoming" && (
                      <span className="text-xs text-blue-500 font-medium mt-0.5">{timeLabel}</span>
                    )}
                    {event.status === "ongoing" && (
                      <span className="text-xs text-green-600 font-medium mt-0.5">Live now</span>
                    )}
                  </div>

                  {/* End date/time */}
                  <div className="hidden md:flex flex-col items-center text-center flex-shrink-0">
                    <p className="text-xs font-medium text-gray-700">{fmtDate(event.endTime)}</p>
                    <p className="text-xs text-gray-400">{fmtTime(event.endTime)}</p>
                    {event.status === "completed" && (
                      <span className="text-xs text-gray-400 mt-0.5">{timeLabel}</span>
                    )}
                    {event.status === "upcoming" && (
                      <span className="text-xs text-gray-400 mt-0.5">deadline</span>
                    )}
                  </div>

                  {/* Status chip */}
                  <div className="flex justify-center flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      event.status === "ongoing"
                        ? "bg-green-100 text-green-700"
                        : event.status === "upcoming"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {event.status === "ongoing"  ? "Ongoing"
                      : event.status === "upcoming" ? "Upcoming"
                      : "Completed"}
                    </span>
                  </div>

                  {/* Admin actions */}
                  {role === "admin" && (
                    <div className="flex items-center gap-1.5 justify-center flex-shrink-0">
                      <FormContainer table="event" type="update" data={event} />
                      <FormContainer table="event" type="delete"  id={event.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Pagination page={p} count={totalCount} />
    </div>
  );
};

export default EventListPage;