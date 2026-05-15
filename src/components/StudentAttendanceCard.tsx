import prisma from "@/lib/prisma";

const StudentAttendanceCard = async ({ id }: { id: string }) => {
  const rows = await prisma.attendance.findMany({
    where: { studentId: id },
    select: { present: true },
  });

  const total   = rows.length;
  const present = rows.filter((r) => r.present).length;
  const rate    = total > 0 ? Math.round((present / total) * 100) : null;

  return (
    <div className="flex flex-col justify-between">
      <h1 className="text-xl font-semibold">
        {rate !== null ? `${rate}%` : "N/A"}
      </h1>
      <span className="text-sm text-gray-400">Attendance</span>
      {rate !== null && (
        <div className="mt-1 w-full bg-gray-100 rounded-full h-1">
          <div
            className={`h-1 rounded-full ${
              rate >= 85 ? "bg-green-400"
              : rate >= 75 ? "bg-yellow-400"
              : "bg-red-400"
            }`}
            style={{ width: `${rate}%` }}
          />
        </div>
      )}
      {total > 0 && (
        <p className="text-xs text-gray-400 mt-0.5">
          {present}/{total} days
        </p>
      )}
    </div>
  );
};

export default StudentAttendanceCard;