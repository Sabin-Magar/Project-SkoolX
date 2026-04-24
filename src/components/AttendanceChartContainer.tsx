import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import prisma from "@/lib/prisma";

const AttendanceChartContainer = async () => {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const lastSunday = new Date(today);

  lastSunday.setDate(today.getDate() - dayOfWeek);

  const resData = await prisma.attendance.findMany({
    where: {
      date: {
        gte: lastSunday,
      },
    },
    select: {
      date: true,
      present: true,
    },
  });

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

  const attendanceMap: { [key: string]: { present: number; absent: number } } =
    {
        Sun: { present: 0, absent: 0 },
        Mon: { present: 0, absent: 0 },
        Tue: { present: 0, absent: 0 },
        Wed: { present: 0, absent: 0 },
        Thu: { present: 0, absent: 0 },
        Fri: { present: 0, absent: 0 },
    };

  resData.forEach((item) => {
    const itemDate = new Date(item.date);
    const dayOfWeek = itemDate.getDay();
    
    if (dayOfWeek >= 0 && dayOfWeek <= 5) {
      const dayName = daysOfWeek[dayOfWeek];

      if (item.present) {
        attendanceMap[dayName].present += 1;  
      } else {
        attendanceMap[dayName].absent += 1;
      }
    }
  });

//   console.log(attendanceMap);


  const data = daysOfWeek.map((day) => ({
    name: day,
    present: attendanceMap[day].present,
    absent: attendanceMap[day].absent,
  }));

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Attendance</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <AttendanceChart data={data}/>
    </div>
  );
};

export default AttendanceChartContainer;
