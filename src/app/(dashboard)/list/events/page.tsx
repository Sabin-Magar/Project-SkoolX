import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import {
  scheduleEvents,          // ← ALGORITHM: Priority + EDF hybrid scheduler
  sortByEDF,               // ← ALGORITHM: Earliest Deadline First sort
  getPriorityLabel,
  type SchedulableEvent,
  type ScheduledEvent,
} from "@/lib/eventScheduler";

// ── Page ──────────────────────────────────────────────────────────────────────

const EventListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { userId, sessionClaims } = await auth();
  const role        = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const resolvedParams = await searchParams;
  const { page, search, tab } = resolvedParams;
  const p          = page ? parseInt(page) : 1;
  const activeTab  = tab || "scheduled";

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

  const baseQuery: Prisma.EventWhereInput = {
    AND: [
      // Role filter
      {
        OR: [
          { targetRole: "ALL" },
          { targetRole: role?.toUpperCase() },
        ],
      },
      // Class filter (null = school-wide, else match class)
      {
        OR: [
          { classId: null },
          {
            class:
              role && roleConditions[role]
                ? roleConditions[role]
                : {},
          },
        ],
      },
    ],
  };

  if (search) {
    (baseQuery.AND as any[]).push({
      OR: [
        { title:       { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  // ── Fetch ALL matching events (for scheduling algorithms) ─────────────────
  const allRaw = await prisma.event.findMany({
    where: baseQuery,
    include: { class: { select: { name: true } } },
    orderBy: { startTime: "asc" },
  });

  const allEvents: SchedulableEvent[] = allRaw.map((e) => ({
    ...e,
    priority:   (e as any).priority   ?? 5,
    targetRole: (e as any).targetRole ?? "ALL",
  }));

  const now = new Date();

  // ── ALGORITHM: Priority + EDF Hybrid Scheduling ───────────────────────────
  // scheduleEvents() sorts events by:
  //   combined_score = priority_score * 0.6 + urgency_score * 0.4
  // This is the main scheduled view — most important events first.
  const scheduledEvents: ScheduledEvent[] = scheduleEvents(allEvents, now);

  // ── ALGORITHM: EDF-only sort for "ending soon" view ───────────────────────
  // sortByEDF() orders purely by deadline proximity (endTime ascending)
  const edfSortedEvents = sortByEDF(allEvents);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const upcomingCount  = allEvents.filter((e) => now < e.startTime).length;
  const ongoingCount   = allEvents.filter((e) => now >= e.startTime && now <= e.endTime).length;
  const completedCount = allEvents.filter((e) => now > e.endTime).length;
  const criticalCount  = allEvents.filter((e) => e.priority >= 9 && now < e.endTime).length;

  // ── Paginate the active view ──────────────────────────────────────────────
  const viewEvents =
    activeTab === "edf"
      ? edfSortedEvents
      : activeTab === "upcoming"
      ? scheduledEvents.filter((e) => e.status === "upcoming")
      : activeTab === "ongoing"
      ? scheduledEvents.filter((e) => e.status === "ongoing")
      : activeTab === "completed"
      ? scheduledEvents.filter((e) => e.status === "completed")
      : scheduledEvents; // default: scheduled (Priority + EDF)

  const totalCount = viewEvents.length;
  const pageEvents = viewEvents.slice(ITEM_PER_PAGE * (p - 1), ITEM_PER_PAGE * p);

  const tabs = [
    { key: "scheduled", label: "Scheduled",  count: scheduledEvents.length   },
    { key: "ongoing",   label: "Ongoing",    count: ongoingCount              },
    { key: "upcoming",  label: "Upcoming",   count: upcomingCount             },
    { key: "edf",       label: "Ending soon", count: edfSortedEvents.length  },
    { key: "completed", label: "Completed",  count: completedCount            },
  ];

  return (
    <div className="p-4 flex flex-col gap-4 flex-1 m-4 mt-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Events</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Scheduled events : {totalCount} event{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TableSearch />
          {role === "admin" && <FormContainer table="event" type="create" />}
        </div>
      </div>

      {/* ── Algorithm info banner ── */}
      <div className="bg-lamaSkyLight border border-lamaSky/20 rounded-xl p-4 flex items-start gap-3">
        <span className="text-lamaSky text-xl mt-0.5">⚡</span>
        <div>
          <p className="text-sm font-semibold text-gray-700">
            Priority Scheduling + EDF Algorithm active
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Events are ordered by <strong>combined score = priority (60%) + deadline urgency (40%)</strong>.
            The &quot;Ending soon&quot; tab uses pure <strong>Earliest Deadline First</strong> ordering.
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-50 text-green-700 rounded-xl p-4">
          <p className="text-2xl font-bold">{ongoingCount}</p>
          <p className="text-xs font-medium opacity-70">Ongoing now</p>
        </div>
        <div className="bg-blue-50 text-blue-700 rounded-xl p-4">
          <p className="text-2xl font-bold">{upcomingCount}</p>
          <p className="text-xs font-medium opacity-70">Upcoming</p>
        </div>
        <div className="bg-red-50 text-red-700 rounded-xl p-4">
          <p className="text-2xl font-bold">{criticalCount}</p>
          <p className="text-xs font-medium opacity-70">Critical priority</p>
        </div>
        <div className="bg-gray-50 text-gray-600 rounded-xl p-4">
          <p className="text-2xl font-bold">{completedCount}</p>
          <p className="text-xs font-medium opacity-70">Completed</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`?tab=${t.key}&page=1`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === t.key
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === t.key ? "bg-gray-100 text-gray-600" : "bg-gray-200 text-gray-500"
            }`}>{t.count}</span>
          </a>
        ))}
      </div>

      {/* ── Algorithm label ── */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">
          {activeTab === "edf"
            ? "🎯 Sorted by: Earliest Deadline First (EDF)"
            : activeTab === "scheduled"
            ? "⚡ Sorted by: Priority (60%) + EDF urgency (40%)"
            : `Filtered: ${activeTab}`}
        </span>
      </div>

      {/* ── Event cards ── */}
      {pageEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400 text-sm">No events found</p>
          {role === "admin" && (
            <p className="text-gray-300 text-xs mt-1">Create your first event using the button above</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {pageEvents.map((event) => {
            const pr = getPriorityLabel(event.priority);
            const isScheduled = "scheduledScore" in event;
            const score = isScheduled ? (event as ScheduledEvent).scheduledScore : 0;
            const status = isScheduled
              ? (event as ScheduledEvent).status
              : now < event.startTime
              ? "upcoming"
              : now <= event.endTime
              ? "ongoing"
              : "completed";

            const statusStyle = {
              upcoming:  "bg-blue-100 text-blue-700",
              ongoing:   "bg-green-100 text-green-700",
              completed: "bg-gray-100 text-gray-500",
            }[status];

            const targetRoleIcon: Record<string, string> = {
              ALL:     "🏫",
              ADMIN:   "👔",
              TEACHER: "📚",
              STUDENT: "🎒",
              PARENT:  "👨‍👩‍👧",
            };

            return (
              <div
                key={event.id}
                className={`bg-white border rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-all ${
                  event.priority >= 9
                    ? "border-red-200"
                    : event.priority >= 7
                    ? "border-orange-200"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug truncate">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pr.bg} ${pr.color}`}>
                        P{event.priority} · {pr.label}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg">{targetRoleIcon[event.targetRole] ?? "🏫"}</span>
                    {event.class && (
                      <p className="text-xs text-gray-400 mt-0.5">{event.class.name}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>

                {/* Times */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-400 mb-0.5">Start</p>
                    <p className="text-xs font-medium text-gray-700">
                      {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(event.startTime)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(event.startTime)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-400 mb-0.5">End</p>
                    <p className="text-xs font-medium text-gray-700">
                      {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(event.endTime)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(event.endTime)}
                    </p>
                  </div>
                </div>

                {/* Scheduling score bar (Priority + EDF) */}
                {isScheduled && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Schedule score</span>
                      <span>{Math.round(score * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          score >= 0.7 ? "bg-red-400"
                          : score >= 0.5 ? "bg-orange-400"
                          : score >= 0.3 ? "bg-yellow-400"
                          : "bg-blue-400"
                        }`}
                        style={{ width: `${score * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Admin actions */}
                {role === "admin" && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
                    <FormContainer table="event" type="update" data={event} />
                    <FormContainer table="event" type="delete" id={event.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={p} count={totalCount} />
    </div>
  );
};

export default EventListPage;