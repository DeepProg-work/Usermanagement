'use client'; // Required if used in App Router client components

import { useSession, SessionContextValue } from 'next-auth/react';
import { useMemo } from 'react';

interface ExtendedSessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string; // Assuming this is your comma-separated roles string
  // Add other custom user properties from your session if any
}

interface ExtendedSession extends Omit<SessionContextValue, 'data'> {
  data: {
    user?: ExtendedSessionUser;
    expires: string;
  } | null;
  checkRole: (roleToCheck: string) => boolean;
  userRoles: Set<string>; // Exposing the parsed roles as a Set
}

/**
 * Custom hook to extend NextAuth's useSession with role checking capabilities.
 * Assumes session.user.role is a comma-separated string of roles.
 */
export function useAuthWithRoles(): ExtendedSession {
  const { data: session, status, update } = useSession();

  // Memoize the parsed roles to avoid re-calculating on every render
  // unless the session.user.role string changes.
  const userRolesSet = useMemo(() => {
    if (session?.user?.role && typeof session.user.role === 'string') {
      return new Set<string>(
        session.user.role
          .split(',')
          .map((role: string) => role.trim().toLowerCase()) // Normalize roles: trim and lowercase
          .filter((role: string) => role !== '') // Filter out empty strings if any
      );
    }
    return new Set<string>(); // Return an empty set if no roles or user
  }, [session?.user?.role]);

  /**
   * Checks if the current user has a specific role.
   * @param roleToCheck The role name to check for (case-insensitive).
   * @returns True if the user has the role, false otherwise.
   */
  const checkRole = (roleToCheck: string): boolean => {
    if (!roleToCheck) return false;
    return userRolesSet.has(roleToCheck.trim().toLowerCase());
  };

  return {
    data: session as ExtendedSession['data'], // Cast to include our extended user type
    status,
    update,
    checkRole,
    userRoles: userRolesSet,
  };
}