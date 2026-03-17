export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="h-screen flex">
        {/* left contents */}
        <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4">left</div>

        {/* right content */}
        <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">right</div>
      </div>
  );
}