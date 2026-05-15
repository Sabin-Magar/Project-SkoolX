import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin" && role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const date    = searchParams.get("date");

  if (!classId || !date) {
    return NextResponse.json({ error: "Missing classId or date" }, { status: 400 });
  }

  // Teacher can only access their own classes
  if (role === "teacher") {
    const lesson = await prisma.lesson.findFirst({
      where: { classId: parseInt(classId), teacherId: userId! },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end   = new Date(date); end.setHours(23, 59, 59, 999);

  const [students, existing] = await Promise.all([
    prisma.student.findMany({
      where: { classId: parseInt(classId) },
      select: { id: true, name: true, surname: true },
      orderBy: { name: "asc" },
    }),
    prisma.attendance.findMany({
      where: {
        classId: parseInt(classId),
        date: { gte: start, lte: end },
      },
      select: { studentId: true, present: true },
    }),
  ]);

  const existingMap: Record<string, boolean> = {};
  existing.forEach((r) => { existingMap[r.studentId] = r.present; });

  return NextResponse.json({
    students,
    existingMap,
    alreadyMarked: existing.length > 0,
  });
}