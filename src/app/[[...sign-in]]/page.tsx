"use client";

import * as Clerk from '@clerk/elements/common'
import * as SignIn from '@clerk/elements/sign-in'
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const LoginPage = () => {
    
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();

    useEffect(() => {
        const role = user?.publicMetadata.role;
        if (role){
            router.push(`/${role}`);
        }
    }, [user, router]);

  return (
    <div className="h-screen flex">

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-lamaSky flex-col justify-between p-12 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white opacity-10" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-lamaPurple opacity-20" />
        <div className="absolute -bottom-16 left-1/4 w-64 h-64 rounded-full bg-lamaYellow opacity-20" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
            <Image src="/logo.png" alt="" width={24} height={24} />
          </div>
          <span className="text-slate-900 text-2xl font-bold tracking-tight">SkoolX</span>
        </div>

        {/* Center text */}
        <div className="relative">
          <p className="text-slate-700 text-sm uppercase tracking-widest mb-3 font-medium">School Management</p>
          <h2 className="text-slate-900 text-4xl font-bold leading-snug">
            Everything your <br />school needs,<br />
            <span className="text-indigo-900">in one place.</span>
          </h2>
          <p className="text-slate-800 mt-4 text-sm leading-relaxed max-w-xs">
            Manage students, teachers, parents, schedules, and results — all from a single dashboard.
          </p>
        </div>

        {/* Spacer */}
        <div />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-lamaSkyLight px-6">
        <SignIn.Root>
          <SignIn.Step
            name="start"
            className="bg-white w-full max-w-md rounded-2xl shadow-xl px-10 py-12 flex flex-col gap-6"
          >
            {/* Mobile logo (hidden on lg) */}
            <div className="flex lg:hidden items-center gap-2 mb-2">
              <Image src="/logo.png" alt="" width={22} height={22} />
              <span className="font-bold text-lg text-gray-800 tracking-tight">SkoolX</span>
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Welcome back</h1>
              <h2 className="text-sm text-gray-400">Sign in to your account to continue</h2>
            </div>

            <Clerk.GlobalError className="text-sm text-red-400 bg-red-50 px-3 py-2 rounded-lg" />

            {/* Fields */}
            <div className="flex flex-col gap-4">
              <Clerk.Field name="identifier" className="flex flex-col gap-1.5">
                <Clerk.Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Username
                </Clerk.Label>
                <Clerk.Input
                  type="text"
                  required
                  className="p-2.5 rounded-lg ring-[1.5px] ring-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:ring-lamaSky focus:outline-none transition-all"
                />
                <Clerk.FieldError className="text-xs text-red-400" />
              </Clerk.Field>

              <Clerk.Field name="password" className="flex flex-col gap-1.5">
                <Clerk.Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Password
                </Clerk.Label>
                <Clerk.Input
                  type="password"
                  required
                  className="p-2.5 rounded-lg ring-[1.5px] ring-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:ring-lamaSky focus:outline-none transition-all"
                />
                <Clerk.FieldError className="text-xs text-red-400" />
              </Clerk.Field>
            </div>

            {/* Submit */}
            <SignIn.Action
              submit
              className="w-full bg-lamaSky hover:bg-sky-400 transition-colors text-white font-semibold rounded-lg py-2.5 text-sm tracking-wide"
            >
              Sign In
            </SignIn.Action>

            <p className="text-center text-xs text-gray-400">
              Contact your administrator if you need access.
            </p>
          </SignIn.Step>
        </SignIn.Root>
      </div>
    </div>
  );
}

export default LoginPage;