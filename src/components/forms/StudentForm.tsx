"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, startTransition, useActionState, useEffect, useState } from "react";
import {
  studentSchema,
  StudentSchema,
} from "@/lib/formValidationSchemas";
import {
  createStudent,
  updateStudent,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

const StudentForm = ({
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
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
  });

  const [img, setImg] = useState<any>();

  // ── Parent picker state ──────────────────────────────────────────────────
  const allParents: { id: string; name: string; surname: string }[] =
    Array.isArray(relatedData?.parents) ? relatedData.parents : [];

  const [selectedParentId, setSelectedParentId] = useState<string>(
    data?.parentId ?? ""
  );
  const [parentSearch, setParentSearch] = useState("");
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false);

  const filteredParents = allParents.filter((p) =>
    `${p.name} ${p.surname}`.toLowerCase().includes(parentSearch.toLowerCase())
  );

  const selectedParent = allParents.find((p) => p.id === selectedParentId);

  // Sync selected parent → RHF
  useEffect(() => {
    setValue("parentId", selectedParentId);
  }, [selectedParentId, setValue]);

  const [state, formAction] = useActionState(
    type === "create" ? createStudent : updateStudent,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    startTransition(() => {
      formAction({ ...data, img: img?.secure_url });
    });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Student has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { grades, classes } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new student" : "Update the student"}
      </h1>

      {/* ── Authentication ── */}
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          defaultValue={data?.password}
          register={register}
          error={errors?.password}
        />
      </div>

      {/* ── Personal Info ── */}
      <span className="text-xs text-gray-400 font-medium">
        Personal Information
      </span>
      <CldUploadWidget
        uploadPreset="school"
        onSuccess={(result, { widget }) => {
          setImg(result.info);
          widget.close();
        }}
      >
        {({ open }) => {
          return (
            <div
              className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
              onClick={() => open()}
            >
              <Image src="/upload.png" alt="" width={28} height={28} />
              <span>Upload a photo</span>
            </div>
          );
        }}
      </CldUploadWidget>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        <InputField
          label="Last Name"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors.surname}
        />
        <InputField
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
        />
        <InputField
          label="Blood Type"
          name="bloodType"
          defaultValue={data?.bloodType}
          register={register}
          error={errors.bloodType}
        />
        <InputField
          label="Birthday"
          name="birthday"
          defaultValue={data?.birthday.toISOString().split("T")[0]}
          register={register}
          error={errors.birthday}
          type="date"
        />
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

        {/* Sex */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sex</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("sex")}
            defaultValue={data?.sex}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">{errors.sex.message.toString()}</p>
          )}
        </div>

        {/* Grade */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Grade</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("gradeId")}
            defaultValue={data?.gradeId}
          >
            {grades.map((grade: { id: number; level: number }) => (
              <option value={grade.id} key={grade.id}>
                {grade.level}
              </option>
            ))}
          </select>
          {errors.gradeId?.message && (
            <p className="text-xs text-red-400">{errors.gradeId.message.toString()}</p>
          )}
        </div>

        {/* Class */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Class</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("classId")}
            defaultValue={data?.classId}
          >
            {classes.map(
              (classItem: {
                id: number;
                name: string;
                capacity: number;
                _count: { students: number };
              }) => (
                <option value={classItem.id} key={classItem.id}>
                  {classItem.name} — {classItem._count.students}/{classItem.capacity} Capacity
                </option>
              )
            )}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">{errors.classId.message.toString()}</p>
          )}
        </div>

        {/* ── Parent picker ── */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Parent{" "}
            {/* <span className="font-normal text-gray-400">(optional)</span> */}
          </label>

          {/* Hidden RHF field */}
          <input type="hidden" {...register("parentId")} value={selectedParentId} />

          {/* Selected badge or placeholder */}
          <div
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full flex items-center justify-between cursor-pointer"
            onClick={() => setParentDropdownOpen((v) => !v)}
          >
            {selectedParent ? (
              <span className="text-gray-700">
                {selectedParent.name} {selectedParent.surname}
              </span>
            ) : (
              <span className="text-gray-400">Select a parent...</span>
            )}
            <span className="text-gray-400 text-xs ml-2">▾</span>
          </div>

          {/* Dropdown */}
          {parentDropdownOpen && (
            <div className="border border-gray-200 rounded-md bg-white shadow-sm z-10">
              {/* Search */}
              <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-100">
                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search parent..."
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  className="text-xs outline-none flex-1 text-gray-700 placeholder-gray-400"
                  autoFocus
                />
              </div>

              {/* Options */}
              <div className="max-h-36 overflow-y-auto">
                {/* None option */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedParentId("");
                    setParentDropdownOpen(false);
                    setParentSearch("");
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 italic"
                >
                  — No parent assigned
                </button>

                {allParents.length === 0 ? (
                  <p className="text-xs text-amber-500 text-center py-3">
                    No parents registered yet
                  </p>
                ) : filteredParents.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">
                    No parents match your search
                  </p>
                ) : (
                  filteredParents.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedParentId(p.id);
                        setParentDropdownOpen(false);
                        setParentSearch("");
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                        selectedParentId === p.id
                          ? "bg-lamaSkyLight text-gray-800 font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span>{p.name} {p.surname}</span>
                      {selectedParentId === p.id && (
                        <span className="text-lamaSky font-semibold">✓</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {errors.parentId?.message && (
            <p className="text-xs text-red-400">{errors.parentId.message.toString()}</p>
          )}
        </div>
      </div>

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button type="submit" className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default StudentForm;