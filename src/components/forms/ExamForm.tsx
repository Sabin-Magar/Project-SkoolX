// "use client";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import InputField from "../InputField";
// import {
//   examSchema,
//   ExamSchema,
// } from "@/lib/formValidationSchemas";
// import {
//   createExam,
//   updateExam,
// } from "@/lib/actions";
// import { Dispatch, SetStateAction, startTransition, useActionState, useEffect } from "react";
// import { toast } from "react-toastify";
// import { useRouter } from "next/navigation";

// const ExamForm = ({
//   type,
//   data,
//   setOpen,
//   relatedData,
// }: {
//   type: "create" | "update";
//   data?: any;
//   setOpen: Dispatch<SetStateAction<boolean>>;
//   relatedData?: any;
// }) => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<ExamSchema>({
//     resolver: zodResolver(examSchema),
//   });

//   // AFTER REACT 19 IT'LL BE USEACTIONSTATE

//   const [state, formAction] = useActionState(
//     type === "create" ? createExam : updateExam,
//     {
//       success: false,
//       error: false,
//     }
//   );

//   const onSubmit = handleSubmit((data) => {
//     console.log(data);
    
//     startTransition(() => {
//       formAction(data);
//   });
//   });

//   const router = useRouter();

//   useEffect(() => {
//     if (state.success) {
//       toast(`Exam has been ${type === "create" ? "created" : "updated"}!`);
//       setOpen(false);
//       router.refresh();
//     }
//   }, [state, router, type, setOpen]);

//   const { lessons } = relatedData;

//   return (
//     <form className="flex flex-col gap-8" onSubmit={onSubmit}>
//       <h1 className="text-xl font-semibold">
//         {type === "create" ? "Create a new exam" : "Update the exam"}
//       </h1>

//       <div className="flex justify-between flex-wrap gap-4">
//         <InputField
//           label="Exam title"
//           name="title"
//           defaultValue={data?.title}
//           register={register}
//           error={errors?.title}
//         />
//         <InputField
//           label="Start Date"
//           name="startTime"
//           defaultValue={data?.startTime}
//           register={register}
//           error={errors?.startTime}
//           type="datetime-local"
//         />
//         <InputField
//           label="End Date"
//           name="endTime"
//           defaultValue={data?.endTime}
//           register={register}
//           error={errors?.endTime}
//           type="datetime-local"
//         />
//         {data && (
//           <InputField
//             label="Id"
//             name="id"
//             defaultValue={data?.id}
//             register={register}
//             error={errors?.id}
//             hidden
//           />
//         )}
//         <div className="flex flex-col gap-2 w-full md:w-1/4">
//           <label className="text-xs text-gray-500">Lesson</label>
//           <select
//             className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
//             {...register("lessonId")}
//             defaultValue={data?.teachers}
//           >
//             {lessons.map((lesson: { id: number; name: string }) => (
//               <option value={lesson.id} key={lesson.id}>
//                 {lesson.name}
//               </option>
//             ))}
//           </select>
//           {errors.lessonId?.message && (
//             <p className="text-xs text-red-400">
//               {errors.lessonId.message.toString()}
//             </p>
//           )}
//         </div>
//       </div>
//       {state.error && (
//         <span className="text-red-500">Something went wrong!</span>
//       )}
//       <button className="bg-blue-400 text-white p-2 rounded-md">
//         {type === "create" ? "Create" : "Update"}
//       </button>
//     </form>
//   );
// };

// export default ExamForm;

//---------------------------------------------------------------
// "use client";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import InputField from "../InputField";
// import { examSchema, ExamSchema } from "@/lib/formValidationSchemas";
// import { createExam, updateExam } from "@/lib/actions";
// import { Dispatch, SetStateAction, startTransition, useActionState, useEffect } from "react";
// import { toast } from "react-toastify";
// import { useRouter } from "next/navigation";

// const ExamForm = ({
//   type,
//   data,
//   setOpen,
//   relatedData,
// }: {
//   type: "create" | "update";
//   data?: any;
//   setOpen: Dispatch<SetStateAction<boolean>>;
//   relatedData?: any;
// }) => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<ExamSchema>({
//     resolver: zodResolver(examSchema),
//   });

//   const [state, formAction] = useActionState(
//     type === "create" ? createExam : updateExam,
//     { success: false, error: false }
//   );

//   const onSubmit = handleSubmit((formData) => {
//     startTransition(() => { formAction(formData); });
//   });

//   const router = useRouter();

//   useEffect(() => {
//     if (state.success) {
//       toast(`Exam has been ${type === "create" ? "created" : "updated"}!`);
//       setOpen(false);
//       router.refresh();
//     }
//     if (state.error) {
//       toast.error("Something went wrong!");
//     }
//   }, [state, router, type, setOpen]);

//   const { lessons } = relatedData || { lessons: [] };

//   // format datetime for input
//   const formatDateTime = (date: Date | string | undefined) => {
//     if (!date) return "";
//     const d = new Date(date);
//     const pad = (n: number) => String(n).padStart(2, "0");
//     return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
//   };

//   return (
//     <form className="flex flex-col gap-5" onSubmit={onSubmit}>
//       <div>
//         <h1 className="text-xl font-semibold text-gray-800">
//           {type === "create" ? "Create new exam" : "Update exam"}
//         </h1>
//         <p className="text-sm text-gray-400 mt-0.5">
//           {type === "create"
//             ? "Schedule an exam for a lesson."
//             : "Edit the exam details below."}
//         </p>
//       </div>

//       {/* Hidden id */}
//       {data && (
//         <InputField label="Id" name="id" defaultValue={data?.id} register={register} error={errors?.id} hidden />
//       )}

//       {/* Exam title */}
//       <div className="flex flex-col gap-1.5">
//         <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Exam title</label>
//         <input
//           type="text"
//           placeholder="e.g. Mid-term Mathematics Exam"
//           className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
//           {...register("title")}
//           defaultValue={data?.title}
//         />
//         {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
//       </div>

//       {/* Lesson */}
//       <div className="flex flex-col gap-1.5">
//         <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
//           Lesson <span className="normal-case font-normal text-gray-400">({lessons.length} available)</span>
//         </label>
//         <select
//           className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none bg-white"
//           {...register("lessonId")}
//           defaultValue={data?.lessonId}
//         >
//           <option value="">Select a lesson...</option>
//           {lessons.map((lesson: { id: number; name: string }) => (
//             <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
//           ))}
//         </select>
//         {errors.lessonId && <p className="text-xs text-red-400">{errors.lessonId.message}</p>}
//       </div>

//       {/* Date & Time row */}
//       <div className="grid grid-cols-2 gap-3">
//         <div className="flex flex-col gap-1.5">
//           <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start date & time</label>
//           <input
//             type="datetime-local"
//             className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
//             {...register("startTime")}
//             defaultValue={formatDateTime(data?.startTime)}
//           />
//           {errors.startTime && <p className="text-xs text-red-400">{errors.startTime.message?.toString()}</p>}
//         </div>
//         <div className="flex flex-col gap-1.5">
//           <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">End date & time</label>
//           <input
//             type="datetime-local"
//             className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
//             {...register("endTime")}
//             defaultValue={formatDateTime(data?.endTime)}
//           />
//           {errors.endTime && <p className="text-xs text-red-400">{errors.endTime.message?.toString()}</p>}
//         </div>
//       </div>

//       {/* Info box */}
//       <div className="bg-lamaSkyLight rounded-lg p-3 flex gap-2">
//         <span className="text-lamaSky text-lg">ℹ</span>
//         <p className="text-xs text-gray-500 leading-relaxed">
//           The exam will be visible to all students enrolled in the selected lesson's class.
//           Make sure the start and end times do not overlap with other exams.
//         </p>
//       </div>

//       {state.error && (
//         <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">
//           Something went wrong! Please check all fields and try again.
//         </p>
//       )}

//       <button
//         type="submit"
//         className="bg-lamaSky text-white py-2.5 px-4 rounded-lg font-medium hover:bg-sky-400 transition-colors"
//       >
//         {type === "create" ? "Create exam" : "Update exam"}
//       </button>
//     </form>
//   );
// };

// export default ExamForm;

//------------------------------------------------------------------

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { examSchema, ExamSchema } from "@/lib/formValidationSchemas";
import { createExam, updateExam } from "@/lib/actions";
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

const ExamForm = ({
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

  // ── Extract related data ───────────────────────────────────────────────────
  const allLessons: any[] = Array.isArray(relatedData?.lessons) ? relatedData.lessons : [];
  const allSubjects: any[] = Array.isArray(relatedData?.subjects) ? relatedData.subjects : [];

  // ── State ─────────────────────────────────────────────────────────────────
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    // on update, detect subject from existing lesson
    data?.lessonId
      ? String(allLessons.find((l) => l.id === data.lessonId)?.subjectId ?? "")
      : ""
  );

  // Lessons filtered by selected subject
  const filteredLessons = selectedSubjectId
    ? allLessons.filter((l) => String(l.subjectId) === selectedSubjectId)
    : allLessons;

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      id: data?.id,
      title: data?.title ?? "",
      lessonId: data?.lessonId ?? undefined,
    },
  });

  // When subject changes, reset lessonId
  useEffect(() => {
    setValue("lessonId", undefined as any);
  }, [selectedSubjectId, setValue]);

  // ── Action ────────────────────────────────────────────────────────────────
  const [state, formAction] = useActionState(
    type === "create" ? createExam : updateExam,
    { success: false, error: false }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Exam has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) toast.error("Something went wrong!");
  }, [state, router, type, setOpen]);

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => { formAction(formData); });
  });

  // ── Format datetime for input ─────────────────────────────────────────────
  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          {type === "create" ? "Create new exam" : "Update exam"}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {type === "create"
            ? "Schedule an exam for a lesson."
            : "Edit the exam details below."}
        </p>
      </div>

      {/* Hidden id */}
      {data?.id && (
        <InputField label="Id" name="id" defaultValue={data.id} register={register} error={errors?.id} hidden />
      )}

      {/* ── Exam title ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Exam title
        </label>
        <input
          type="text"
          placeholder="e.g. Mid-term Mathematics Exam"
          className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
          {...register("title")}
          defaultValue={data?.title}
        />
        {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
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
              const cnt = allLessons.filter((l) => String(l.subjectId) === String(s.id)).length;
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
                ? `Select a lesson for this subject...`
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

      {/* ── Start & End time ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Start date & time
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
            End date & time
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
        <span className="text-lamaSky mt-0.5">ℹ</span>
        <p className="text-xs text-gray-500 leading-relaxed">
          The exam will be visible to all students enrolled in the selected
          lesson's class. Make sure start and end times don't overlap with
          other exams.
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
        {type === "create" ? "Create exam" : "Update exam"}
      </button>
    </form>
  );
};

export default ExamForm;