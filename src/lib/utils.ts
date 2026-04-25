const currentWorkWeek = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  const startOfWeek = new Date(today);

  if (dayOfWeek === 6) {
    // If Saturday, go back to last Sunday
    startOfWeek.setDate(today.getDate() - 6);
  } else {
    // Otherwise go back to this week's Sunday
    startOfWeek.setDate(today.getDate() - dayOfWeek);
  }
  startOfWeek.setHours(0, 0, 0, 0);

  // const endOfWeek = new Date(startOfWeek);
  // endOfWeek.setDate(startOfWeek.getDate() + 5); // Sun + 5 = Fri
  // endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek };
};

export const adjustScheduleToCurrentWeek = (
  lessons: { title: string; start: Date; end: Date }[]
): { title: string; start: Date; end: Date }[] => {
  const { startOfWeek } = currentWorkWeek(); // startOfWeek = Sunday

  return lessons.map((lesson) => {
    const lessonDayOfWeek = lesson.start.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri

    // daysFromSunday: 0=Sun, 1=Mon, ..., 5=Fri
    const daysFromSunday = lessonDayOfWeek;

    const adjustedStartDate = new Date(startOfWeek);
    adjustedStartDate.setDate(startOfWeek.getDate() + daysFromSunday);
    adjustedStartDate.setHours(
      lesson.start.getHours(),
      lesson.start.getMinutes(),
      lesson.start.getSeconds()
    );

    const adjustedEndDate = new Date(adjustedStartDate);
    adjustedEndDate.setHours(
      lesson.end.getHours(),
      lesson.end.getMinutes(),
      lesson.end.getSeconds()
    );

    return {
      title: lesson.title,
      start: adjustedStartDate,
      end: adjustedEndDate,
    };
  });
};