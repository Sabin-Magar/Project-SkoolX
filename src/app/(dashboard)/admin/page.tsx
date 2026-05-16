// import UserCard from "@/components/UserCard"
// import FinanceChart from "@/components/FinanceChart"
// import Announcements from "@/components/Announcements"
// import CountChartContainer from "@/components/CountChartContainer"
// import AttendanceChartContainer from "@/components/AttendanceChartContainer"
// import EventCalendarContainer from "@/components/EventCalendarContainer"

// const AdminPage = async ({
//   searchParams,
// }: {
//   searchParams: Promise<{ [keys: string]: string | undefined }>;
// }) => {
//   const resolvedSearchParams = await searchParams;
//   return (
//     <div className="p-4 flex gap-4 flex-col md:flex-row">

//       {/* left portion */}
//       <div className="w-full lg:w-2/3 flex flex-col gap-8">

//         {/* User Cards */}
//         <div className="flex gap-4 justify-between flex-wrap">
//           <UserCard type="admin"/>
//           <UserCard type="teacher"/>
//           <UserCard type="student"/>
//           <UserCard type="parent"/>
//         </div>


//         {/* Middle Charts */}
//         <div className="flex gap-4 flex-col lg:flex-row">
//           {/* Count Charts */}
//           <div className="w-full lg:w-1/3 h-[450px]">
//             <CountChartContainer />
//           </div>

//           {/* Attendance Charts */}
//           <div className="w-full lg:w-2/3 h-[450px]">
//             <AttendanceChartContainer />
//           </div>
//         </div>


//         {/* Bottom Charts */}
//         <div className="w-full h-[500px]">
//           <FinanceChart/>
//         </div>
//       </div>

//       {/* right portion */}
//       <div className="w-full lg:w-1/3 flex flex-col gap-8">
//         <EventCalendarContainer searchParams={resolvedSearchParams}/>
//         <Announcements />
//       </div>
//     </div>
//   )
// }

// export default AdminPage


// src/app/(dashboard)/admin/page.tsx

import UserCard from "@/components/UserCard"
import Announcements from "@/components/Announcements"
import CountChartContainer from "@/components/CountChartContainer"
import AttendanceChartContainer from "@/components/AttendanceChartContainer"
import EventCalendarContainer from "@/components/EventCalendarContainer"
import RecentActivity from "@/components/RecentActivity"


const AdminPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [keys: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">

      {/* ── Left portion ── */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">

        {/* User Cards — dynamic counts from DB */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="admin"   />
          <UserCard type="teacher" />
          <UserCard type="student" />
          <UserCard type="parent"  />
        </div>

        {/* Middle Charts */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Count Chart — boys vs girls */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChartContainer />
          </div>
          {/* Attendance Chart — current week Sun–Fri */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChartContainer />
          </div>
        </div>

        {/* Bottom — Academic Performance (replaces Finance Chart) */}
        <div className="w-full h-[500px]">
          <RecentActivity />
        </div>
        
      </div>

      {/* ── Right portion ── */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={resolvedSearchParams} />
        <Announcements />
      </div>
    </div>
  );
};

export default AdminPage;