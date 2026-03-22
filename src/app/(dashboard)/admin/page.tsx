import CountChart from "@/components/CountChart"
import UserCard from "@/components/UserCard"
import AttendanceChart from "@/components/AttendanceChart"
import FinanceChart from "@/components/FinanceChart"
import EventCalendar from "@/components/EventCalendar"
import Announcements from "@/components/Announcements"

const AdminPage = () => {
  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">

      {/* left portion */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">

        {/* User Cards */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="student"/>
          <UserCard type="teacher"/>
          <UserCard type="parent"/>
          <UserCard type="staff"/>
        </div>


        {/* Middle Charts */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Count Charts */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChart />
          </div>

          {/* Attendance Charts */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChart />
          </div>
        </div>


        {/* Bottom Charts */}
        <div className="w-full h-[500px]">
          <FinanceChart/>
        </div>
      </div>

      {/* right portion */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  )
}

export default AdminPage