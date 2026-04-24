import prisma from "@/lib/prisma";

const EventList = async ({ dateParam }: { dateParam: string | undefined }) => {
  const date = dateParam ? new Date(dateParam) : new Date();

  const start = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  );
  const end = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
  );


  console.log("Querying events between:", start, "and", end); // debug

  const data = await prisma.event.findMany({
    where: {
      startTime: {
        gte: start,
        lte: end,
      },
    },
  });

  if (data.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-4">
        No events for this day.
      </p>
    );
  }

  return data.map((event) => (
    <div
      className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
      key={event.id}
    >
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-gray-600">{event.title}</h1>
        <span className="text-gray-300 text-xs">
          {event.startTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}  
        </span>
      </div>
      <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
    </div>
  ));
};

export default EventList;
  