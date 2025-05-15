// components/ProfileDropdown.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function ProfileDropdown() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session) {
    return (
      <Link
        href="/api/auth/signin"
        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >

    
       {session.user?.name && (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">
              {session.user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="hidden md:inline-block text-sm font-medium">
          {session.user?.name}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Your Profile
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}