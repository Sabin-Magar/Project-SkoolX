// "use client";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import InputField from "../InputField";
// import { z } from "zod";
// import {
//   Dispatch,
//   SetStateAction,
//   startTransition,
//   useActionState,
//   useEffect,
//   useState,
// } from "react";
// import { toast } from "react-toastify";
// import { useRouter } from "next/navigation";
// import { createParent, updateParent } from "@/lib/actions";
// import { parentSchema, ParentSchema } from "@/lib/formValidationSchemas";

// // ─── Component ────────────────────────────────────────────────────────────────

// const ParentForm = ({
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

//   // ── Extract students ──────────────────────────────────────────────────────
//   const allStudents: any[] = Array.isArray(relatedData?.students)
//     ? relatedData.students
//     : [];

//   // ── Selected student ids ──────────────────────────────────────────────────
//   const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
//     data?.students?.map((s: any) => s.id) ?? []
//   );
//   const [studentSearch, setStudentSearch] = useState("");

//   const filteredStudents = allStudents.filter((s) =>
//     `${s.name} ${s.surname} ${s.className}`
//       .toLowerCase()
//       .includes(studentSearch.toLowerCase())
//   );

//   const toggleStudent = (id: string) => {
//     setSelectedStudentIds((prev) =>
//       prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
//     );
//   };

//   // ── Form ──────────────────────────────────────────────────────────────────
//   const {
//     register,
//     handleSubmit,
//     setValue,
//     formState: { errors },
//   } = useForm<ParentSchema>({
//     resolver: zodResolver(parentSchema),
//     defaultValues: {
//       id:         data?.id         ?? undefined,
//       username:   data?.username   ?? "",
//       name:       data?.name       ?? "",
//       surname:    data?.surname    ?? "",
//       email:      data?.email      ?? "",
//       phone:      data?.phone      ?? "",
//       address:    data?.address    ?? "",
//       studentIds: data?.students?.map((s: any) => s.id) ?? [],
//     },
//   });

//   // Sync selected students → RHF
//   useEffect(() => {
//     setValue("studentIds", selectedStudentIds);
//   }, [selectedStudentIds, setValue]);

//   // ── Action ────────────────────────────────────────────────────────────────
//   const [state, formAction] = useActionState(
//     type === "create" ? createParent : updateParent,
//     { success: false, error: false }
//   );

//   const router = useRouter();

//   useEffect(() => {
//     if (state.success) {
//       toast(`Parent has been ${type === "create" ? "created" : "updated"}!`);
//       setOpen(false);
//       router.refresh();
//     }
//     if (state.error) toast.error("Something went wrong!");
//   }, [state, router, type, setOpen]);

//   const onSubmit = handleSubmit((formData) => {
//     startTransition(() => { formAction(formData); });
//   });

//   // ─── Render ───────────────────────────────────────────────────────────────
//   return (
//     <form
//       className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto px-1 pb-1"
//       onSubmit={onSubmit}
//     >
//       {/* Header */}
//       <div className="sticky top-0 bg-white pt-1 pb-2 border-b border-gray-100 z-10">
//         <h1 className="text-xl font-semibold text-gray-800">
//           {type === "create" ? "Add new parent" : "Update parent"}
//         </h1>
//         <p className="text-sm text-gray-400 mt-0.5">
//           {type === "create"
//             ? "Register a parent and link their children."
//             : "Edit parent details and assigned students."}
//         </p>
//       </div>

//       {/* Hidden id */}
//       {data?.id && (
//         <InputField
//           label="Id"
//           name="id"
//           defaultValue={data.id}
//           register={register}
//           error={errors?.id}
//           hidden
//         />
//       )}

//       {/* ── Authentication ── */}
//       <div className="rounded-xl border border-gray-100 overflow-hidden">
//         <div className="flex items-center gap-2 px-4 py-2.5 bg-lamaSkyLight border-b border-gray-100">
//           <span className="w-5 h-5 rounded-full bg-lamaSky text-white text-xs flex items-center justify-center font-bold">1</span>
//           <p className="text-sm font-medium text-gray-700">Login credentials</p>
//         </div>
//         <div className="p-4 grid grid-cols-2 gap-3">
//           <div className="flex flex-col gap-1.5">
//             <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Username</label>
//             <input
//               type="text"
//               placeholder="e.g. john_parent"
//               className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm focus:ring-lamaSky focus:outline-none"
//               {...register("username")}
//               defaultValue={data?.username}
//             />
//             {errors.username && <p className="text-xs text-red-400">{errors.username.message}</p>}
//           </div>
//           <div className="flex flex-col gap-1.5">
//             <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
//               Password {type === "update" && <span className="normal-case font-normal text-gray-400">(leave blank to keep)</span>}
//             </label>
//             <input
//               type="password"
//               placeholder={type === "update" ? "Leave blank to keep current" : "Min 8 characters"}
//               className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm focus:ring-lamaSky focus:outline-none"
//               {...register("password")}
//             />
//             {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
//           </div>
//         </div>
//       </div>

//       {/* ── Personal info ── */}
//       <div className="rounded-xl border border-gray-100 overflow-hidden">
//         <div className="flex items-center gap-2 px-4 py-2.5 bg-lamaPurpleLight border-b border-gray-100">
//           <span className="w-5 h-5 rounded-full bg-lamaPurple text-white text-xs flex items-center justify-center font-bold">2</span>
//           <p className="text-sm font-medium text-gray-700">Personal information</p>
//         </div>
//         <div className="p-4 flex flex-col gap-3">
//           {/* Name row */}
//           <div className="grid grid-cols-2 gap-3">
//             <div className="flex flex-col gap-1.5">
//               <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">First name</label>
//               <input
//                 type="text"
//                 placeholder="John"
//                 className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm focus:ring-lamaSky focus:outline-none"
//                 {...register("name")}
//                 defaultValue={data?.name}
//               />
//               {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
//             </div>
//             <div className="flex flex-col gap-1.5">
//               <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last name</label>
//               <input
//                 type="text"
//                 placeholder="Doe"
//                 className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm focus:ring-lamaSky focus:outline-none"
//                 {...register("surname")}
//                 defaultValue={data?.surname}
//               />
//               {errors.surname && <p className="text-xs text-red-400">{errors.surname.message}</p>}
//             </div>
//           </div>

//           {/* Email */}
//           <div className="flex flex-col gap-1.5">
//             <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
//               Email <span className="normal-case font-normal text-gray-400">(optional)</span>
//             </label>
//             <input
//               type="email"
//               placeholder="john@example.com"
//               className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm focus:ring-lamaSky focus:outline-none"
//               {...register("email")}
//               defaultValue={data?.email}
//             />
//             {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
//           </div>

//           {/* Phone */}
//           <div className="flex flex-col gap-1.5">
//             <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone number</label>
//             <input
//               type="text"
//               placeholder="+977-98XXXXXXXX"
//               className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm focus:ring-lamaSky focus:outline-none"
//               {...register("phone")}
//               defaultValue={data?.phone}
//             />
//             {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
//           </div>

//           {/* Address */}
//           <div className="flex flex-col gap-1.5">
//             <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</label>
//             <input
//               type="text"
//               placeholder="current address"
//               className="ring-[1.5px] ring-gray-200 p-2.5 rounded-lg text-sm focus:ring-lamaSky focus:outline-none"
//               {...register("address")}
//               defaultValue={data?.address}
//             />
//             {errors.address && <p className="text-xs text-red-400">{errors.address.message}</p>}
//           </div>
//         </div>
//       </div>

//       {/* ── Students ── */}
//       <div className="rounded-xl border border-gray-100 overflow-hidden">
//         <div className="flex items-center gap-2 px-4 py-2.5 bg-lamaYellowLight border-b border-gray-100">
//           <span className="w-5 h-5 rounded-full bg-lamaYellow text-white text-xs flex items-center justify-center font-bold">3</span>
//           <p className="text-sm font-medium text-gray-700">Assign children</p>
//           <span className="text-xs text-gray-400">
//             ({selectedStudentIds.length} selected)
//           </span>
//         </div>
//         <div className="p-4 flex flex-col gap-3">
//           {/* Selected chips */}
//           {selectedStudentIds.length > 0 && (
//             <div className="flex flex-wrap gap-1.5">
//               {selectedStudentIds.map((id) => {
//                 const s = allStudents.find((st) => st.id === id);
//                 if (!s) return null;
//                 return (
//                   <div
//                     key={id}
//                     className="flex items-center gap-1.5 bg-lamaSkyLight text-gray-700 text-xs px-2.5 py-1 rounded-full"
//                   >
//                     <span>{s.name} {s.surname}</span>
//                     <button
//                       type="button"
//                       onClick={() => toggleStudent(id)}
//                       className="text-gray-400 hover:text-red-500 transition-colors"
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 );
//               })}
//             </div>
//           )}

//           {/* Search */}
//           <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
//             <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//             </svg>
//             <input
//               type="text"
//               placeholder="Search student by name or class..."
//               value={studentSearch}
//               onChange={(e) => setStudentSearch(e.target.value)}
//               className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400"
//             />
//           </div>

//           {/* Student list */}
//           <div className="max-h-44 overflow-y-auto flex flex-col gap-1">
//             {allStudents.length === 0 ? (
//               <p className="text-sm text-amber-500 text-center py-3">No students loaded</p>
//             ) : filteredStudents.length === 0 ? (
//               <p className="text-sm text-gray-400 text-center py-3">No students match your search</p>
//             ) : (
//               filteredStudents.map((s: any) => {
//                 const isSelected = selectedStudentIds.includes(s.id);
//                 return (
//                   <button
//                     key={s.id}
//                     type="button"
//                     onClick={() => toggleStudent(s.id)}
//                     className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
//                       isSelected
//                         ? "bg-lamaSkyLight text-gray-800 font-medium"
//                         : "hover:bg-gray-50 text-gray-700"
//                     }`}
//                   >
//                     <div className="flex items-center gap-2">
//                       <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lamaSky to-lamaPurple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
//                         {s.name[0]}
//                       </div>
//                       <div>
//                         <span className="font-medium">{s.name} {s.surname}</span>
//                         <span className="text-xs text-gray-400 ml-2">— {s.className}</span>
//                       </div>
//                     </div>
//                     {isSelected && (
//                       <span className="text-lamaSky text-xs font-semibold">✓ Selected</span>
//                     )}
//                   </button>
//                 );
//               })
//             )}
//           </div>

//           {errors.studentIds && (
//             <p className="text-xs text-red-400">{errors.studentIds.message}</p>
//           )}
//         </div>
//       </div>

//       {state.error && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//           <p className="text-sm text-red-600">Something went wrong! Check all fields and try again.</p>
//         </div>
//       )}

//       <button
//         type="submit"
//         className="bg-lamaSky text-white py-2.5 px-4 rounded-lg font-medium hover:bg-sky-400 transition-colors text-sm"
//       >
//         {type === "create" ? "Create parent" : "Update parent"}
//       </button>
//     </form>
//   );
// };

// export default ParentForm;

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
import { createParent, updateParent } from "@/lib/actions";
import { parentSchema, ParentSchema } from "@/lib/formValidationSchemas";

const ParentForm = ({
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

  // ── Extract students ──────────────────────────────────────────────────────
  const allStudents: any[] = Array.isArray(relatedData?.students)
    ? relatedData.students
    : [];

  // ── Selected student ids ──────────────────────────────────────────────────
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    data?.students?.map((s: any) => s.id) ?? []
  );
  const [studentSearch, setStudentSearch] = useState("");

  const filteredStudents = allStudents.filter((s) =>
    `${s.name} ${s.surname} ${s.className}`
      .toLowerCase()
      .includes(studentSearch.toLowerCase())
  );

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      id:         data?.id         ?? undefined,
      username:   data?.username   ?? "",
      name:       data?.name       ?? "",
      surname:    data?.surname    ?? "",
      email:      data?.email      ?? "",
      phone:      data?.phone      ?? "",
      address:    data?.address    ?? "",
      studentIds: data?.students?.map((s: any) => s.id) ?? [],
    },
  });

  // Sync selected students → RHF
  useEffect(() => {
    setValue("studentIds", selectedStudentIds);
  }, [selectedStudentIds, setValue]);

  // ── Action ────────────────────────────────────────────────────────────────
  const [state, formAction] = useActionState(
    type === "create" ? createParent : updateParent,
    { success: false, error: false }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Parent has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
    if (state.error) toast.error("Something went wrong!");
  }, [state, router, type, setOpen]);

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => { formAction(formData); });
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Add new parent" : "Update parent"}
      </h1>

      {/* ── Authentication ── */}
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Username</label>
          <input
            type="text"
            placeholder="e.g. john_parent"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("username")}
            defaultValue={data?.username}
          />
          {errors.username && (
            <p className="text-xs text-red-400">{errors.username.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Password{" "}
            {type === "update" && (
              <span className="font-normal text-gray-400">(leave blank to keep)</span>
            )}
          </label>
          <input
            type="password"
            placeholder={type === "update" ? "Leave blank to keep current" : "Min 8 characters"}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors.email}
        />
      </div>

      {/* ── Personal info ── */}
      <span className="text-xs text-gray-400 font-medium">
        Personal Information
      </span>
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
      </div>

      {/* ── Students ── */}
      <span className="text-xs text-gray-400 font-medium">
        Assign Children{" "}
        <span className="font-normal">({selectedStudentIds.length} selected)</span>
      </span>
      <div className="flex flex-col gap-4">
        {/* Selected chips */}
        {selectedStudentIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedStudentIds.map((id) => {
              const s = allStudents.find((st) => st.id === id);
              if (!s) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-1.5 bg-lamaSkyLight text-gray-700 text-xs px-2.5 py-1 rounded-full"
                >
                  <span>{s.name} {s.surname}</span>
                  <button
                    type="button"
                    onClick={() => toggleStudent(id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-2 ring-[1.5px] ring-gray-300 rounded-md px-3 py-2">
          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search student by name or class..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Student list */}
        <div className="max-h-44 overflow-y-auto flex flex-col gap-1 ring-[1.5px] ring-gray-300 rounded-md p-2">
          {allStudents.length === 0 ? (
            <p className="text-sm text-amber-500 text-center py-3">No students loaded</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">No students match your search</p>
          ) : (
            filteredStudents.map((s: any) => {
              const isSelected = selectedStudentIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleStudent(s.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left ${
                    isSelected
                      ? "bg-lamaSkyLight text-gray-800 font-medium"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lamaSky to-lamaPurple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {s.name[0]}
                    </div>
                    <div>
                      <span className="font-medium">{s.name} {s.surname}</span>
                      <span className="text-xs text-gray-400 ml-2">— {s.className}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-lamaSky text-xs font-semibold">✓ Selected</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {errors.studentIds && (
          <p className="text-xs text-red-400">{errors.studentIds.message}</p>
        )}
      </div>

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}

      <button
        type="submit"
        className="bg-blue-400 text-white p-2 rounded-md"
      >
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ParentForm;