import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { sortByPriority, getPriorityLabel, type SchedulableEvent } from "@/lib/eventScheduler";

const EventList = async ({ dateParam }: { dateParam: string | undefined }) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const date = dateParam ? new Date(dateParam) : new Date();

  const start = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  );
  const end = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
  );

  // Role-based conditions
  const roleConditions: Record<string, any> = {
    teacher: { lessons: { some: { teacherId: userId! } } },
    student: { students: { some: { id: userId! } } },
    parent:  { students: { some: { parentId: userId! } } },
  };

  const raw = await prisma.event.findMany({
    where: {
      // ✅ Event overlaps the selected date (started before end of day AND ends after start of day)
      AND: [
        { startTime: { lte: end   } },
        { endTime:   { gte: start } },
        // Role-based visibility
        {
          OR: [
            { targetRole: "ALL" },
            { targetRole: role?.toUpperCase() },
          ],
        },
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
    },
    include: { class: { select: { name: true } } },
  });

  const events: SchedulableEvent[] = raw.map((e) => ({
    ...e,
    priority:   (e as any).priority   ?? 5,
    targetRole: (e as any).targetRole ?? "ALL",
  }));

  // Sort by priority descending (Priority Scheduling for sidebar)
  const sorted = sortByPriority(events);

  if (sorted.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-4">No events for this day.</p>
    );
  }

  const now = new Date();

  return (
    <>
      {sorted.map((event) => {
        const pr = getPriorityLabel(event.priority);

        // Is this event currently ongoing?
        const isOngoing  = now >= event.startTime && now <= event.endTime;
        const isUpcoming = now < event.startTime;

        return (
          <div
            key={event.id}
            className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
          >
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-gray-600 truncate flex-1">{event.title}</h1>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                {/* Priority badge */}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pr.bg} ${pr.color}`}>
                  P{event.priority}
                </span>
                {/* Status badge */}
                {isOngoing && (
                  <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                )}
              </div>
            </div>

            {/* Time range */}
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
              <span>
                {event.startTime.toLocaleTimeString("en-US", {
                  hour: "2-digit", minute: "2-digit", hour12: false,
                })}
              </span>
              <span>→</span>
              <span>
                {event.endTime.toLocaleTimeString("en-US", {
                  hour: "2-digit", minute: "2-digit", hour12: false,
                })}
              </span>
              {/* Show end date if event ends on a different day */}
              {event.endTime.toDateString() !== event.startTime.toDateString() && (
                <span className="text-gray-300">
                  ({new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(event.endTime)})
                </span>
              )}
              {event.class && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>{event.class.name}</span>
                </>
              )}
            </div>

            <p className="mt-2 text-gray-400 text-sm line-clamp-2">{event.description}</p>
          </div>
        );
      })}
    </>
  );
};

export default EventList;