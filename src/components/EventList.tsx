// import prisma from "@/lib/prisma";

// const EventList = async ({ dateParam }: { dateParam: string | undefined }) => {
//   const date = dateParam ? new Date(dateParam) : new Date();

//   const start = new Date(
//     Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
//   );
//   const end = new Date(
//     Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
//   );


//   console.log("Querying events between:", start, "and", end); // debug

//   const data = await prisma.event.findMany({
//     where: {
//       startTime: {
//         gte: start,
//         lte: end,
//       },
//     },
//   });

//   if (data.length === 0) {
//     return (
//       <p className="text-gray-400 text-sm text-center py-4">
//         No events for this day.
//       </p>
//     );
//   }

//   return data.map((event) => (
//     <div
//       className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
//       key={event.id}
//     >
//       <div className="flex items-center justify-between">
//         <h1 className="font-semibold text-gray-600">{event.title}</h1>
//         <span className="text-gray-300 text-xs">
//           {event.startTime.toLocaleTimeString("en-US", {
//             hour: "2-digit",
//             minute: "2-digit",
//             hour12: false,
//           })}  
//         </span>
//       </div>
//       <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
//     </div>
//   ));
// };

// export default EventList;




// src/components/EventList.tsx
// Sidebar mini-list — uses Priority Scheduling (sortByPriority) to show
// most important events for the selected day first.

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { sortByPriority, getPriorityLabel, type SchedulableEvent } from "@/lib/eventScheduler"; // ← ALGORITHM: Priority sort

const EventList = async ({ dateParam }: { dateParam: string | undefined }) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const date  = dateParam ? new Date(dateParam) : new Date();
  const start = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
  const end   = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999));

  // Role-based filter
  const roleConditions: Record<string, any> = {
    teacher: { lessons: { some: { teacherId: userId! } } },
    student: { students: { some: { id: userId! } } },
    parent:  { students: { some: { parentId: userId! } } },
  };

  const raw = await prisma.event.findMany({
    where: {
      startTime: { gte: start, lte: end },
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

  // ── ALGORITHM: Priority Scheduling sort for sidebar ────────────────────
  // sortByPriority() orders by priority desc, EDF tie-break
  const sorted = sortByPriority(events);

  if (sorted.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-4">No events for this day.</p>
    );
  }

  return (
    <>
      {sorted.map((event) => {
        const pr = getPriorityLabel(event.priority);
        return (
          <div
            key={event.id}
            className="p-4 rounded-xl border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple mb-3"
          >
            <div className="flex items-center justify-between mb-1">
              <h1 className="font-semibold text-gray-700 text-sm truncate">{event.title}</h1>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${pr.bg} ${pr.color}`}>
                P{event.priority}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>
                {event.startTime.toLocaleTimeString("en-US", {
                  hour: "2-digit", minute: "2-digit", hour12: false,
                })} — {event.endTime.toLocaleTimeString("en-US", {
                  hour: "2-digit", minute: "2-digit", hour12: false,
                })}
              </span>
              {event.class && (
                <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  {event.class.name}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          </div>
        );
      })}
    </>
  );
};

export default EventList;