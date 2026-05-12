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
  useState,
} from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createAssignment, updateAssignment } from "@/lib/actions";
import { assignmentSchema, AssignmentSchema } from "@/lib/formValidationSchemas";

// ─── Component ────────────────────────────────────────────────────────────────

const AssignmentForm = ({
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

  // ── Extract related data FIRST ────────────────────────────────────────────
  const allLessons: any[]  = Array.isArray(relatedData?.lessons)  ? relatedData.lessons  : [];
  const allSubjects: any[] = Array.isArray(relatedData?.subjects) ? relatedData.subjects : [];

  // ── Subject filter state ──────────────────────────────────────────────────
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    data?.lessonId
      ? String(allLessons.find((l: any) => l.id === data.lessonId)?.subjectId ?? "")
      : ""
  );

  // Lessons filtered by selected subject
  const filteredLessons = selectedSubjectId
    ? allLessons.filter((l: any) => String(l.subjectId) === selectedSubjectId)
    : allLessons;

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      id: data?.id,
      title: data?.title ?? "",
      lessonId: data?.lessonId ?? undefined,
    },
  });

  // Reset lessonId when subject changes
  useEffect(() => {
    setValue("lessonId", undefined as any);
  }, [selectedSubjectId, setValue]);

  // ── Action ────────────────────────────────────────────────────────────────
  const [state, formAction] = useActionState(
    type === "create" ? createAssignment : updateAssignment,
    { success: false, error: false }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Assignment has been ${type === "create" ? "created" : "updated"}!`);
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          {type === "create" ? "Create new assignment" : "Update assignment"}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {type === "create"
            ? "Assign work for students in a lesson."
            : "Edit the assignment details below."}
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

      {/* ── Title ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Assignment title
        </label>
        <input
          type="text"
          placeholder="e.g. Chapter 3 Practice Problems"
          className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
          {...register("title")}
          defaultValue={data?.title}
        />
        {errors.title && (
          <p className="text-xs text-red-400">{errors.title.message}</p>
        )}
      </div>

      {/* ── Subject filter ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Subject{" "}
          <span className="normal-case font-normal text-gray-400">
            (filters available lessons)
          </span>
        </label>
        {allSubjects.length === 0 ? (
          <p className="text-sm text-amber-500 p-2.5 ring-[1.5px] ring-amber-200 rounded-lg bg-amber-50">
            No subjects loaded
          </p>
        ) : (
          <select
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none bg-white"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value="">— All subjects ({allLessons.length} lessons)</option>
            {allSubjects.map((s: any) => {
              const cnt = allLessons.filter(
                (l: any) => String(l.subjectId) === String(s.id)
              ).length;
              return (
                <option key={s.id} value={s.id}>
                  {s.name} ({cnt} lesson{cnt !== 1 ? "s" : ""})
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* ── Lesson ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Lesson{" "}
          <span className="normal-case font-normal text-gray-400">
            ({filteredLessons.length} available)
          </span>
        </label>
        {allLessons.length === 0 ? (
          <p className="text-sm text-amber-500 p-2.5 ring-[1.5px] ring-amber-200 rounded-lg bg-amber-50">
            No lessons loaded
          </p>
        ) : (
          <select
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none bg-white"
            {...register("lessonId")}
            defaultValue={data?.lessonId}
          >
            <option value="">
              {selectedSubjectId
                ? "Select a lesson for this subject..."
                : "Select a lesson..."}
            </option>
            {filteredLessons.map((lesson: any) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
                {lesson.className ? ` — ${lesson.className}` : ""}
              </option>
            ))}
          </select>
        )}
        {errors.lessonId && (
          <p className="text-xs text-red-400">{errors.lessonId.message?.toString()}</p>
        )}
      </div>

      {/* ── Dates ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Start date & time
          </label>
          <input
            type="datetime-local"
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
            {...register("startDate")}
            defaultValue={formatDateTime(data?.startDate)}
          />
          {errors.startDate && (
            <p className="text-xs text-red-400">{errors.startDate.message?.toString()}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Due date & time
          </label>
          <input
            type="datetime-local"
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
            {...register("dueDate")}
            defaultValue={formatDateTime(data?.dueDate)}
          />
          {errors.dueDate && (
            <p className="text-xs text-red-400">{errors.dueDate.message?.toString()}</p>
          )}
        </div>
      </div>

      {/* ── Info box ── */}
      <div className="bg-lamaYellowLight rounded-lg p-3 flex gap-2 items-start">
        <span className="mt-0.5">📋</span>
        <p className="text-xs text-gray-500 leading-relaxed">
          This assignment will be visible to all students in the selected
          lesson's class. The due date must be after the start date.
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3 border border-red-200">
          Something went wrong! Please check all fields and try again.
        </p>
      )}

      <button
        type="submit"
        className="bg-lamaYellow text-white py-2.5 px-4 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
      >
        {type === "create" ? "Create assignment" : "Update assignment"}
      </button>
    </form>
  );
};

export default AssignmentForm;