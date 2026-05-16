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
import { createEvent, updateEvent } from "@/lib/actions";
import { getPriorityLabel } from "@/lib/eventScheduler";
import { eventSchema, EventSchema } from "@/lib/formValidationSchemas";



// ─── Priority selector ────────────────────────────────────────────────────────

const PrioritySelector = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  const { label, color, bg } = getPriorityLabel(value);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Priority level
        </label>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${bg} ${color}`}>
          {value} — {label}
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right,
            ${value >= 9 ? "#fca5a5" : value >= 7 ? "#fdba74" : value >= 5 ? "#fde047" : value >= 3 ? "#93c5fd" : "#d1d5db"}
            ${(value - 1) / 9 * 100}%,
            #e5e7eb ${(value - 1) / 9 * 100}%)`,
        }}
      />

      {/* Scale labels */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>1 Minimal</span>
        <span>5 Medium</span>
        <span>10 Critical</span>
      </div>

      {/* Priority guide */}
      <div className="grid grid-cols-5 gap-1 mt-1">
        {[
          { range: "1–2", label: "Minimal", bg: "bg-gray-100",   text: "text-gray-600"   },
          { range: "3–4", label: "Low",     bg: "bg-blue-100",   text: "text-blue-700"   },
          { range: "5–6", label: "Medium",  bg: "bg-yellow-100", text: "text-yellow-700" },
          { range: "7–8", label: "High",    bg: "bg-orange-100", text: "text-orange-700" },
          { range: "9–10",label: "Critical",bg: "bg-red-100",    text: "text-red-700"    },
        ].map((p) => (
          <div key={p.range} className={`rounded px-1.5 py-1 text-center ${p.bg}`}>
            <p className={`text-xs font-semibold ${p.text}`}>{p.label}</p>
            <p className={`text-xs opacity-70 ${p.text}`}>{p.range}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const EventForm = ({
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
  const classes: any[] = Array.isArray(relatedData?.classes)
    ? relatedData.classes
    : [];

  const [priority, setPriority] = useState<number>(data?.priority ?? 5);
  const [targetRole, setTargetRole] = useState<string>(data?.targetRole ?? "ALL");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      id:          data?.id,
      title:       data?.title       ?? "",
      description: data?.description ?? "",
      priority:    data?.priority    ?? 5,
      targetRole:  data?.targetRole  ?? "ALL",
      classId:     data?.classId     ?? undefined,
    },
  });

  useEffect(() => { setValue("priority",   priority);               }, [priority,    setValue]);
  useEffect(() => { setValue("targetRole", targetRole as any);      }, [targetRole,  setValue]);

  const [state, formAction] = useActionState(
    type === "create" ? createEvent : updateEvent,
    { success: false, error: false }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Event has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) toast.error("Something went wrong!");
  }, [state, router, type, setOpen]);

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => { formAction(formData); });
  });

  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const targetRoles = [
    { value: "ALL",     label: "Everyone",       desc: "All school members",   icon: "🏫" },
    { value: "ADMIN",   label: "Admin only",     desc: "Administrators",        icon: "👔" },
    { value: "TEACHER", label: "Teachers only",  desc: "Teaching staff",        icon: "📚" },
    { value: "STUDENT", label: "Students only",  desc: "All students",          icon: "🎒" },
    { value: "PARENT",  label: "Parents only",   desc: "Parents & guardians",   icon: "👨‍👩‍👧" },
  ];

  return (
    <form
      className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto px-1 pb-1"
      onSubmit={onSubmit}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white pt-1 pb-3 pr-6 border-b border-gray-100 z-10">
        <h1 className="text-xl font-semibold text-gray-800">
          {type === "create" ? "Create new event" : "Update event"}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {type === "create"
            ? "Schedule an event."
            : "Edit event details below."}
        </p>
      </div>

      {/* Hidden id */}
      {data?.id && (
        <InputField label="Id" name="id" defaultValue={data.id} register={register} error={errors?.id} hidden />
      )}

      {/* ── Title ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Event title</label>
        <input
          type="text"
          placeholder="e.g. Annual Sports Day"
          className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm focus:ring-lamaSky focus:outline-none"
          {...register("title")}
          defaultValue={data?.title}
        />
        {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
      </div>

      {/* ── Description ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
        <textarea
          rows={3}
          placeholder="Describe the event details, agenda, or instructions..."
          className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm focus:ring-lamaSky focus:outline-none resize-none"
          {...register("description")}
          defaultValue={data?.description}
        />
        {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
      </div>

      {/* ── Date & Time ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start date & time</label>
          <input
            type="datetime-local"
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm focus:ring-lamaSky focus:outline-none"
            {...register("startTime")}
            defaultValue={formatDateTime(data?.startTime)}
          />
          {errors.startTime && <p className="text-xs text-red-400">{errors.startTime.message?.toString()}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">End date & time</label>
          <input
            type="datetime-local"
            className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm focus:ring-lamaSky focus:outline-none"
            {...register("endTime")}
            defaultValue={formatDateTime(data?.endTime)}
          />
          {errors.endTime && <p className="text-xs text-red-400">{errors.endTime.message?.toString()}</p>}
        </div>
      </div>

      {/* ── Priority selector ── */}
      <div className="bg-gray-50 rounded-xl p-4">
        <PrioritySelector value={priority} onChange={setPriority} />
        <input type="hidden" {...register("priority")} value={priority} />
        {errors.priority && <p className="text-xs text-red-400 mt-1">{errors.priority.message?.toString()}</p>}
      </div>

      {/* ── Target audience ── */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Target audience</label>
        <div className="grid grid-cols-1 gap-2">
          {targetRoles.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setTargetRole(r.value)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                targetRole === r.value
                  ? "border-lamaSky bg-lamaSkyLight"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <span className="text-lg">{r.icon}</span>
              <div>
                <p className={`text-sm font-medium ${targetRole === r.value ? "text-gray-800" : "text-gray-600"}`}>
                  {r.label}
                </p>
                <p className="text-xs text-gray-400">{r.desc}</p>
              </div>
              {targetRole === r.value && (
                <span className="ml-auto text-lamaSky text-sm font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
        <input type="hidden" {...register("targetRole")} value={targetRole} />
        {errors.targetRole && <p className="text-xs text-red-400">{errors.targetRole.message?.toString()}</p>}
      </div>

      {/* ── Target class (optional) ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Target class <span className="normal-case font-normal text-gray-400">(optional — leave blank for all classes)</span>
        </label>
        <select
          className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm bg-white focus:ring-lamaSky focus:outline-none"
          {...register("classId")}
          defaultValue={data?.classId ?? ""}
        >
          <option value="">— All classes</option>
          {classes.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.classId && <p className="text-xs text-red-400">{errors.classId.message?.toString()}</p>}
      </div>

      {state.error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3 border border-red-200">
          Something went wrong! Please check all fields.
        </p>
      )}

      <button
        type="submit"
        className="bg-lamaSky text-white py-2.5 px-4 rounded-lg font-medium hover:bg-sky-400 transition-colors"
      >
        {type === "create" ? "Create event" : "Update event"}
      </button>
    </form>
  );
};

export default EventForm;