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
import { createResult, updateResult } from "@/lib/actions";

const resultSchema = z.object({
  id: z.coerce.number().optional(),
  score: z.coerce
    .number()
    .min(0, { message: "Score must be at least 0" })
    .max(100, { message: "Score must be at most 100" }),
  examId: z.coerce.number().optional(),
  assignmentId: z.coerce.number().optional(),
  studentId: z.string().min(1, { message: "Student is required" }),
});

type ResultSchema = z.infer<typeof resultSchema>;

const ResultForm = ({
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

  // ── Extract data FIRST (needed before useEffect) ──────────────────────────
  const allStudents: any[]    = Array.isArray(relatedData?.students)    ? relatedData.students    : [];
  const allExams: any[]       = Array.isArray(relatedData?.exams)       ? relatedData.exams       : [];
  const allAssignments: any[] = Array.isArray(relatedData?.assignments) ? relatedData.assignments : [];
  const allClasses: any[]     = Array.isArray(relatedData?.classes)     ? relatedData.classes     : [];

  // ── State ─────────────────────────────────────────────────────────────────
  const [assessmentType, setAssessmentType] = useState<"exam" | "assignment">(
    data?.examId ? "exam" : "assignment"
  );
  const [selectedClass, setSelectedClass] = useState<string>("");

  // ── Auto-fill class on update ─────────────────────────────────────────────
  useEffect(() => {
    if (type === "update" && data?.studentId && allStudents.length > 0) {
      const student = allStudents.find((s: any) => s.id === data.studentId);
      if (student) setSelectedClass(student.className);
    }
  }, [allStudents, data?.studentId, type]);

  // ── Filter by selected class ──────────────────────────────────────────────
  const students    = selectedClass
    ? allStudents.filter((s) => s.className === selectedClass)
    : allStudents;
  const exams       = selectedClass
    ? allExams.filter((e) => e.lesson?.class?.name === selectedClass)
    : allExams;
  const assignments = selectedClass
    ? allAssignments.filter((a) => a.lesson?.class?.name === selectedClass)
    : allAssignments;

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResultSchema>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      id: data?.id,
      score: data?.score || 0,
      studentId: data?.studentId || "",
      examId: data?.examId || undefined,
      assignmentId: data?.assignmentId || undefined,
    },
  });

  const [state, formAction] = useActionState(
    type === "create" ? createResult : updateResult,
    { success: false, error: false }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Result has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) {
      toast.error("Something went wrong!");
    }
  }, [state, router, type, setOpen]);

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => {
      formAction(formData);
    });
  });

  const scoreValue = watch("score") || 0;

  const getGradeLabel = (score: number) => {
    if (score >= 90) return { label: "A+", color: "text-emerald-600 bg-emerald-50" };
    if (score >= 80) return { label: "A",  color: "text-green-600 bg-green-50" };
    if (score >= 70) return { label: "B+", color: "text-blue-600 bg-blue-50" };
    if (score >= 60) return { label: "B",  color: "text-indigo-600 bg-indigo-50" };
    if (score >= 50) return { label: "C",  color: "text-yellow-600 bg-yellow-50" };
    if (score >= 40) return { label: "D",  color: "text-orange-600 bg-orange-50" };
    return { label: "F", color: "text-red-600 bg-red-50" };
  };

  const grade = getGradeLabel(Number(scoreValue));

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-800">
        {type === "create" ? "Add new result" : "Update result"}
      </h1>
      <p className="text-sm text-gray-400">
        {type === "create"
          ? "Record an exam or assignment score for a student."
          : "Edit the score or details of this result."}
      </p>

      {/* Hidden id */}
      {data && (
        <InputField
          label="Id"
          name="id"
          defaultValue={data?.id}
          register={register}
          error={errors?.id}
          hidden
        />
      )}

      {/* ── Class filter ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Class <span className="normal-case text-gray-400 font-normal">(filter students, exams &amp; assignments)</span>
        </label>
        <select
          className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">— All classes</option>
          {allClasses.map((c: any) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Student selector ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Student <span className="normal-case text-gray-400 font-normal">({students.length} available)</span>
        </label>
        <select
          className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
          {...register("studentId")}
          defaultValue={data?.studentId}
        >
          <option value="">Select a student...</option>
          {students.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.surname} — {s.className}
            </option>
          ))}
        </select>
        {errors.studentId && (
          <p className="text-xs text-red-400">{errors.studentId.message}</p>
        )}
      </div>

      {/* ── Assessment type toggle ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Assessment type
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAssessmentType("exam")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
              assessmentType === "exam"
                ? "bg-lamaPurple text-white border-lamaPurple"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            Exam
          </button>
          <button
            type="button"
            onClick={() => setAssessmentType("assignment")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
              assessmentType === "assignment"
                ? "bg-lamaSky text-white border-lamaSky"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            Assignment
          </button>
        </div>
      </div>

      {/* ── Exam or Assignment selector ── */}
      {assessmentType === "exam" ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Exam <span className="normal-case text-gray-400 font-normal">({exams.length} available)</span>
          </label>
          <select
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
            {...register("examId")}
            defaultValue={data?.examId}
          >
            <option value="">Select an exam...</option>
            {exams.map((e: any) => (
              <option key={e.id} value={e.id}>
                {e.title} — {e.lesson?.subject?.name} ({e.lesson?.class?.name})
              </option>
            ))}
          </select>
          {errors.examId && (
            <p className="text-xs text-red-400">{errors.examId.message}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Assignment <span className="normal-case text-gray-400 font-normal">({assignments.length} available)</span>
          </label>
          <select
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
            {...register("assignmentId")}
            defaultValue={data?.assignmentId}
          >
            <option value="">Select an assignment...</option>
            {assignments.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.title} — {a.lesson?.subject?.name} ({a.lesson?.class?.name})
              </option>
            ))}
          </select>
          {errors.assignmentId && (
            <p className="text-xs text-red-400">{errors.assignmentId.message}</p>
          )}
        </div>
      )}

      {/* ── Score input with live grade preview ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Score (0 — 100)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={100}
            className="flex-1 ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm focus:ring-lamaSky focus:outline-none"
            {...register("score")}
            defaultValue={data?.score}
          />
          <div className={`px-4 py-2 rounded-lg text-sm font-bold ${grade.color}`}>
            {grade.label}
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              Number(scoreValue) >= 80
                ? "bg-emerald-400"
                : Number(scoreValue) >= 60
                ? "bg-blue-400"
                : Number(scoreValue) >= 40
                ? "bg-yellow-400"
                : "bg-red-400"
            }`}
            style={{ width: `${Math.min(Number(scoreValue), 100)}%` }}
          />
        </div>
        {errors.score && (
          <p className="text-xs text-red-400">{errors.score.message}</p>
        )}
      </div>

      {/* ── Grade reference ── */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-2 font-medium">Grade reference</p>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "A+", range: "90–100", color: "bg-emerald-100 text-emerald-700" },
            { label: "A",  range: "80–89",  color: "bg-green-100 text-green-700" },
            { label: "B+", range: "70–79",  color: "bg-blue-100 text-blue-700" },
            { label: "B",  range: "60–69",  color: "bg-indigo-100 text-indigo-700" },
            { label: "C",  range: "50–59",  color: "bg-yellow-100 text-yellow-700" },
            { label: "D",  range: "40–49",  color: "bg-orange-100 text-orange-700" },
            { label: "F",  range: "0–39",   color: "bg-red-100 text-red-700" },
          ].map((g) => (
            <div key={g.label} className={`rounded px-2 py-1 text-center ${g.color}`}>
              <p className="text-xs font-bold">{g.label}</p>
              <p className="text-xs opacity-70">{g.range}</p>
            </div>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">
          Something went wrong! Please check all fields and try again.
        </p>
      )}

      <button
        type="submit"
        className="bg-lamaSky text-white py-2.5 px-4 rounded-lg font-medium hover:bg-sky-400 transition-colors"
      >
        {type === "create" ? "Add result" : "Update result"}
      </button>
    </form>
  );
};

export default ResultForm;