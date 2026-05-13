"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { z } from "zod";
import {
  Dispatch,
  SetStateAction,
  startTransition,
  useActionState,
  useEffect,
} from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createLesson, updateLesson } from "@/lib/actions";
import { lessonSchema } from "@/lib/formValidationSchemas";

// ─── Component ────────────────────────────────────────────────────────────────

const LessonForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {

  // ── Extract related data ──────────────────────────────────────────────────
  const subjects: any[] = Array.isArray(relatedData?.subjects) ? relatedData.subjects : [];
  const classes: any[]  = Array.isArray(relatedData?.classes)  ? relatedData.classes  : [];
  const teachers: any[] = Array.isArray(relatedData?.teachers) ? relatedData.teachers : [];

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LessonSchema>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      id:        data?.id,
      name:      data?.name      ?? "",
      day:       data?.day       ?? undefined,
      subjectId: data?.subjectId ?? undefined,
      classId:   data?.classId   ?? undefined,
      teacherId: data?.teacherId ?? "",
    },
  });

  // ── Action ────────────────────────────────────────────────────────────────
  const [state, formAction] = useActionState(
    type === "create" ? createLesson : updateLesson,
    { success: false, error: false }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Lesson has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) toast.error("Something went wrong!");
  }, [state, router, type, setOpen]);

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => { formAction(formData); });
  });

  // ── Format datetime ───────────────────────────────────────────────────────
  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const days = [
    { value: "SUNDAY",    label: "Sunday" },
    { value: "MONDAY",    label: "Monday" },
    { value: "TUESDAY",   label: "Tuesday" },
    { value: "WEDNESDAY", label: "Wednesday" },
    { value: "THURSDAY",  label: "Thursday" },
    { value: "FRIDAY",    label: "Friday" },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          {type === "create" ? "Create new lesson" : "Update lesson"}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {type === "create"
            ? "Schedule a lesson for a class."
            : "Edit the lesson details below."}
        </p>
      </div>

      {/* Hidden id */}
      {data?.id && (
        <InputField
          label="Id"
          name="id"
          defaultValue={data.id}
          register={register}
          error={errors?.id}
          hidden
        />
      )}

      {/* ── Lesson name ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Lesson name
        </label>
        <input
          type="text"
          placeholder="e.g. Introduction to Algebra"
          className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
          {...register("name")}
          defaultValue={data?.name}
        />
        {errors.name && (
          <p className="text-xs text-red-400">{errors.name.message}</p>
        )}
      </div>

      {/* ── Subject + Class row ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Subject
          </label>
          <select
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none bg-white"
            {...register("subjectId")}
            defaultValue={data?.subjectId}
          >
            <option value="">Select subject...</option>
            {subjects.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.subjectId && (
            <p className="text-xs text-red-400">{errors.subjectId.message?.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Class
          </label>
          <select
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none bg-white"
            {...register("classId")}
            defaultValue={data?.classId}
          >
            <option value="">Select class...</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.classId && (
            <p className="text-xs text-red-400">{errors.classId.message?.toString()}</p>
          )}
        </div>
      </div>

      {/* ── Teacher ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Teacher
        </label>
        <select
          className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none bg-white"
          {...register("teacherId")}
          defaultValue={data?.teacherId}
        >
          <option value="">Select teacher...</option>
          {teachers.map((t: any) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.surname}
            </option>
          ))}
        </select>
        {errors.teacherId && (
          <p className="text-xs text-red-400">{errors.teacherId.message}</p>
        )}
      </div>

      {/* ── Day ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Day
        </label>
        <div className="grid grid-cols-3 gap-2">
          {days.map((d) => (
            <label
              key={d.value}
              className="flex items-center gap-2 ring-[1.5px] ring-gray-200 p-2.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                value={d.value}
                {...register("day")}
                defaultChecked={data?.day === d.value}
                className="accent-lamaSky"
              />
              <span className="text-sm text-gray-700">{d.label}</span>
            </label>
          ))}
        </div>
        {errors.day && (
          <p className="text-xs text-red-400">{errors.day.message}</p>
        )}
      </div>

      {/* ── Start & End time ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Start time
          </label>
          <input
            type="datetime-local"
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
            {...register("startTime")}
            defaultValue={formatDateTime(data?.startTime)}
          />
          {errors.startTime && (
            <p className="text-xs text-red-400">{errors.startTime.message?.toString()}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            End time
          </label>
          <input
            type="datetime-local"
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
            {...register("endTime")}
            defaultValue={formatDateTime(data?.endTime)}
          />
          {errors.endTime && (
            <p className="text-xs text-red-400">{errors.endTime.message?.toString()}</p>
          )}
        </div>
      </div>

      {/* ── Info ── */}
      <div className="bg-lamaSkyLight rounded-lg p-3 flex gap-2 items-start">
        <span className="mt-0.5">ℹ</span>
        <p className="text-xs text-gray-500 leading-relaxed">
          The lesson will appear in the teacher's and students' schedules.
          Make sure start and end times don't overlap with other lessons for
          the same class or teacher.
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3 border border-red-200">
          Something went wrong! Please check all fields and try again.
        </p>
      )}

      <button
        type="submit"
        className="bg-lamaSky text-white py-2.5 px-4 rounded-lg font-medium hover:bg-sky-400 transition-colors"
      >
        {type === "create" ? "Create lesson" : "Update lesson"}
      </button>
    </form>
  );
};

export default LessonForm;