import { UserButton } from "@clerk/nextjs"
import { currentUser, auth } from "@clerk/nextjs/server";
import Image from "next/image"
import prisma from "@/lib/prisma";
import Link from "next/link";

const Navbar = async () => {
  const user = await currentUser();
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  // ── Build role-based query (same as announcement list page) ──
  const roleConditions: Record<string, any> = {
    teacher: { lessons: { some: { teacherId: currentUserId! } } },
    student: { students: { some: { id: currentUserId! } } },
    parent:  { students: { some: { parentId: currentUserId! } } },
  };

  // count announcements visible to this user
  const announcementCount = await prisma.announcement.count({
    where: {
      OR: [
        { classId: null },
        {
          class: roleConditions[role as string] || {},
        },
      ],
    },
  });

  return (
    <div className="flex items-center justify-between p-4">
      {/* Icons and user */}
      <div className="flex items-center gap-6 justify-end w-full">
        <Link href="/list/announcements">
          <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
            <Image src="/announcement.png" alt="" width={20} height={20} />
            {announcementCount > 0 && (
              <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">
                {announcementCount > 99 ? "99+" : announcementCount}
              </div>
            )}
          </div>
        </Link>

        <div className="flex flex-col">
          <span className="text-xs leading-3 font-medium">
            {user?.firstName} {user?.lastName || user?.username}
          </span>
          <span className="text-[10px] text-gray-500 text-right">
            {user?.publicMetadata?.role as string}
          </span>
        </div>

        <UserButton />
      </div>
    </div>
  );
};

export default Navbar;