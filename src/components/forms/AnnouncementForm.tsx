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
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";
import { announcementSchema, AnnouncementSchema } from "@/lib/formValidationSchemas";

// ─── Component ────────────────────────────────────────────────────────────────

const AnnouncementForm = ({
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
  const classes: any[] = Array.isArray(relatedData?.classes)
    ? relatedData.classes
    : [];

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      id:          data?.id,
      title:       data?.title       ?? "",
      description: data?.description ?? "",
      classId:     data?.classId     ?? undefined,
      date:        data?.date        ?? undefined,
    },
  });

  // ── Action ────────────────────────────────────────────────────────────────
  const [state, formAction] = useActionState(
    type === "create" ? createAnnouncement : updateAnnouncement,
    { success: false, error: false }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Announcement has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) toast.error("Something went wrong!");
  }, [state, router, type, setOpen]);

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => { formAction(formData); });
  });

  // ── Format date ───────────────────────────────────────────────────────────
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          {type === "create" ? "Create announcement" : "Update announcement"}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {type === "create"
            ? "Publish an announcement for a class or the whole school."
            : "Edit the announcement details below."}
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
          Title
        </label>
        <input
          type="text"
          placeholder="e.g. School Holiday Notice"
          className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
          {...register("title")}
          defaultValue={data?.title}
        />
        {errors.title && (
          <p className="text-xs text-red-400">{errors.title.message}</p>
        )}
      </div>

      {/* ── Description ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Description
        </label>
        <textarea
          rows={4}
          placeholder="Write the announcement content here..."
          className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none resize-none"
          {...register("description")}
          defaultValue={data?.description}
        />
        {errors.description && (
          <p className="text-xs text-red-400">{errors.description.message}</p>
        )}
      </div>

      {/* ── Date + Class row ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Date
          </label>
          <input
            type="date"
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none"
            {...register("date")}
            defaultValue={formatDate(data?.date)}
          />
          {errors.date && (
            <p className="text-xs text-red-400">{errors.date.message?.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Target class{" "}
            <span className="normal-case font-normal text-gray-400">(optional)</span>
          </label>
          <select
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm w-full focus:ring-lamaSky focus:outline-none bg-white"
            {...register("classId")}
            defaultValue={data?.classId ?? ""}
          >
            <option value="">— All classes (school-wide)</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.classId && (
            <p className="text-xs text-red-400">{errors.classId.message?.toString()}</p>
          )}
        </div>
      </div>

      {/* ── Info ── */}
      <div className="bg-lamaPurpleLight rounded-lg p-3 flex gap-2 items-start">
        <span className="mt-0.5">📢</span>
        <p className="text-xs text-gray-500 leading-relaxed">
          If no class is selected, the announcement will be visible to
          everyone in the school. Select a specific class to target only
          that class's students, parents, and teachers.
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3 border border-red-200">
          Something went wrong! Please check all fields and try again.
        </p>
      )}

      <button
        type="submit"
        className="bg-lamaPurple text-white py-2.5 px-4 rounded-lg font-medium hover:bg-purple-500 transition-colors"
      >
        {type === "create" ? "Publish announcement" : "Update announcement"}
      </button>
    </form>
  );
};

export default AnnouncementForm;