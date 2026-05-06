import { config } from "dotenv";
config({ path: ".env" });

import { Day, PrismaClient, UserSex } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error"],
  adapter: null,
} as any);

async function main() {
  // ADMIN
  await prisma.admin.create({
    data: {
      id: "admin1",
      username: "admin1",
    },
  });
  await prisma.admin.create({
    data: {
      id: "admin2",
      username: "admin2",
    },
  });

  // GRADE
  for (let i = 1; i <= 6; i++) {
    await prisma.grade.create({
      data: {
        level: i,
      },
    });
  }

  // CLASS
  for (let i = 1; i <= 6; i++) {
    await prisma.class.create({
      data: {
        name: `${i}A`, 
        gradeId: i, 
        capacity: Math.floor(Math.random() * (20 - 15 + 1)) + 15,
      },
    });
  }

  // SUBJECT
  const subjectData = [
    { name: "Mathematics" },
    { name: "Science" },
    { name: "English" },
    { name: "History" },
    { name: "Geography" },
    { name: "Physics" },
    { name: "Chemistry" },
    { name: "Biology" },
    { name: "Computer Science" },
    { name: "Art" },
  ];

  for (const subject of subjectData) {
    await prisma.subject.create({ data: subject });
  }

  // TEACHER
  for (let i = 1; i <= 15; i++) {
    await prisma.teacher.create({
      data: {
        id: `teacher${i}`, // Unique ID for the teacher
        username: `teacher${i}`,
        name: `TName${i}`,
        surname: `TSurname${i}`,
        email: `teacher${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
        bloodType: "A+",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        subjects: { connect: [{ id: (i % 10) + 1 }] }, 
        classes: { connect: [{ id: (i % 6) + 1 }] }, 
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 30)),
      },
    });
  }

// LESSON
const days = Object.values(Day);

const dayMap: { [key: string]: number } = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
};

for (let i = 1; i <= 30; i++) {
  const randomDay = days[Math.floor(Math.random() * days.length)];

  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = dayMap[randomDay];
  const diff = targetDay - currentDay;

  const lessonDate = new Date(today);
  lessonDate.setDate(today.getDate() + diff);

  const startTime = new Date(lessonDate);
  startTime.setHours(8 + (i % 8), 0, 0, 0); // spread between 8AM-4PM

  const endTime = new Date(lessonDate);
  endTime.setHours(9 + (i % 8), 0, 0, 0); // 1 hour lessons

  await prisma.lesson.create({
    data: {
      name: `Lesson${i}`,
      day: randomDay,
      startTime,
      endTime,
      subjectId: (i % 10) + 1,
      classId: (i % 6) + 1,
      teacherId: `teacher${(i % 15) + 1}`,
    },
  });
}

  // PARENT
  for (let i = 1; i <= 25; i++) {
    await prisma.parent.create({
      data: {
        id: `parentId${i}`,
        username: `parentId${i}`,
        name: `PName ${i}`,
        surname: `PSurname ${i}`,
        email: `parent${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
      },
    });
  }

  // STUDENT
  for (let i = 1; i <= 50; i++) {
    await prisma.student.create({
      data: {
        id: `student${i}`, 
        username: `student${i}`, 
        name: `SName${i}`,
        surname: `SSurname ${i}`,
        email: `student${i}@example.com`,
        phone: `987-654-321${i}`,
        address: `Address${i}`,
        bloodType: "O-",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        parentId: `parentId${Math.ceil(i / 2) % 25 || 25}`, 
        gradeId: (i % 6) + 1, 
        classId: (i % 6) + 1, 
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 10)),
      },
    });
  }

  // EXAM
  for (let i = 1; i <= 10; i++) {
    await prisma.exam.create({
      data: {
        title: `Exam ${i}`, 
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)), 
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)), 
        lessonId: (i % 30) + 1, 
      },
    });
  }

  // ASSIGNMENT
  for (let i = 1; i <= 10; i++) {
    await prisma.assignment.create({
      data: {
        title: `Assignment ${i}`, 
        startDate: new Date(new Date().setHours(new Date().getHours() + 1)), 
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), 
        lessonId: (i % 30) + 1, 
      },
    });
  }

  // RESULT - give each student multiple scores across different exams
for (let i = 1; i <= 50; i++) {
  // each student gets 3 results
  for (let j = 1; j <= 3; j++) {
    await prisma.result.create({
      data: {
        score: Math.floor(Math.random() * 40) + 55, // scores between 55-95
        studentId: `student${i}`,
        examId: ((i + j) % 10) + 1,
      },
    });
  }
}

  // ATTENDANCE
for (let i = 1; i <= 10; i++) {
  await prisma.attendance.create({
    data: {
      date: new Date(new Date().setDate(new Date().getDate() - (i % 6))), // spread across week
      present: i % 2 === 0, // alternate present/absent
      studentId: `student${i}`,
      lessonId: (i % 30) + 1,
    },
  });
}

// EVENT
for (let i = 1; i <= 5; i++) {
  const today = new Date();

  const eventStart = new Date(
    Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      8 + i, 0, 0, 0 // 9AM, 10AM, 11AM, 12PM, 1PM
    )
  );
  const eventEnd = new Date(
    Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      9 + i, 0, 0, 0
    )
  );

  await prisma.event.create({
    data: {
      title: `Event ${i}`,
      description: `Description for Event ${i}`,
      startTime: eventStart,
      endTime: eventEnd,
      classId: (i % 5) + 1,
    },
  });
}

  // ANNOUNCEMENT
  for (let i = 1; i <= 5; i++) {
    await prisma.announcement.create({
      data: {
        title: `Announcement ${i}`, 
        description: `Description for Announcement ${i}`, 
        date: new Date(), 
        classId: (i % 5) + 1, 
      },
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
