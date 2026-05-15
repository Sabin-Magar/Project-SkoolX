import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  if (type !== "delete") {   
    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: subjectTeachers };
        break;

      case "class":
        const classGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const classTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;

      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = { subjects: teacherSubjects };
        break;

      case "student":
        const studentGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const studentClasses = await prisma.class.findMany({
          include: { _count: { select: { students: true } } },
        });
        // fetch parents so the student form can show a searchable parent picker
        const studentParents = await prisma.parent.findMany({
          select: { id: true, name: true, surname: true },
          orderBy: { name: "asc" },
        });

        relatedData = { classes: studentClasses, grades: studentGrades, parents: studentParents, };
        break;


      case "exam":
      const examLessons = await prisma.lesson.findMany({
        where: {
          ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
        },
        include: {
          class: { select: { name: true } }, // ← needed for className in dropdown
        },
      });
      const examSubjects = await prisma.subject.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
      relatedData = {
        lessons: examLessons.map((l) => ({
          id: l.id,
          name: l.name,
          subjectId: l.subjectId, // ← needed for subject filter
          className: l.class.name, // ← shown in lesson dropdown
        })),
        subjects: examSubjects, // ← needed for subject filter dropdown
      };
      break;

      case "result":
        const students = await prisma.student.findMany({
          include: { class: { select: { name: true } } },
          orderBy: { name: "asc" },
        });
        const exams = await prisma.exam.findMany({
          include: {
            lesson: {
              include: {
                class: { select: { name: true } },
                subject: { select: { name: true } },
              },
            },
          },
        });
        const assignments = await prisma.assignment.findMany({
          include: {
            lesson: {
              include: {
                class: { select: { name: true } },
                subject: { select: { name: true } },
              },
            },
          },
        });
        const classes = await prisma.class.findMany({
          orderBy: { name: "asc" },
        });
        relatedData = {
          students: students.map((s) => ({
            id: s.id,
            name: s.name,
            surname: s.surname,
            className: s.class.name,
          })),
          exams,
          assignments,
          classes,
        };
        break;


        case "assignment":
          const assignmentLessons = await prisma.lesson.findMany({
            where: {
              ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
            },
            include: {
              class:   { select: { name: true } },
              subject: { select: { id: true, name: true } },
            },
          });
          const assignmentSubjects = await prisma.subject.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          });
          relatedData = {
            lessons: assignmentLessons.map((l) => ({
              id:        l.id,
              name:      l.name,
              subjectId: l.subjectId,
              className: l.class.name,
            })),
            subjects: assignmentSubjects,
          };
          break;



        case "lesson":
          const lessonSubjects = await prisma.subject.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          });
          const lessonClasses = await prisma.class.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          });
          const lessonTeachers = await prisma.teacher.findMany({
            select: { id: true, name: true, surname: true },
            orderBy: { name: "asc" },
          });
          relatedData = {
            subjects: lessonSubjects,
            classes:  lessonClasses,
            teachers: lessonTeachers,
          };
          break;


      case "parent":
        const parentStudents = await prisma.student.findMany({
          include: {
            class: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        });
        relatedData = {
          students: parentStudents.map((s) => ({
            id:        s.id,
            name:      s.name,
            surname:   s.surname,
            className: s.class.name,
          })),
        };
        break;


      case "announcement":
        const announcementClasses = await prisma.class.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        relatedData = {
          classes: announcementClasses,
        };
        break;

      case "attendance":
        break;

      default:
        break;
    }
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
