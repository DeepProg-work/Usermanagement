// app/signin/page.tsx
"use client";

import { signOut } from "next-auth/react";

export default function SignOutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-96 text-center">
       
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 flex items-center justify-center gap-2"
        >
                    Sign Out
        </button>
      </div>
    </div>
  );
}