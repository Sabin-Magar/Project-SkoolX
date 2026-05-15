"use client";

type Props = {
  classes: { id: number; name: string }[];
  defaultValue?: number;
};

const AttendanceClassFilter = ({ classes, defaultValue }: Props) => {
  return (
    <select
      className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm bg-white focus:ring-lamaSky focus:outline-none"
      defaultValue={defaultValue ?? ""}
      onChange={(e) => {
        const url = new URL(window.location.href);
        if (e.target.value) url.searchParams.set("classId", e.target.value);
        else url.searchParams.delete("classId");
        url.searchParams.set("page", "1");
        window.location.href = url.toString();
      }}
    >
      <option value="">All classes</option>
      {classes.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
};

export default AttendanceClassFilter;