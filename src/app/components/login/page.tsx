// app/signin/page.tsx
"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-96 text-center">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>
        <button
          onClick={() => signIn("google" , { callbackUrl: "/" })}
          className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.784-1.664-4.152-2.675-6.735-2.675-5.522 0-10 4.477-10 10s4.478 10 10 10c8.396 0 10-7.496 10-10 0-0.671-0.068-1.325-0.182-1.977h-9.818z" />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}