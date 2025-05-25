import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";
import GoogleProvider from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { users, userRoles, roles } from "@/server/db/schema";

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, trigger, user }) {
      // Called during sign-in or token refresh

      if (trigger === "update" || trigger === "signIn" || trigger === "signUp") {
      if (user?.id) {
        token.id = user.id;
      }
        if (token?.email) {
          // Query database to get all role names for the user
          const dbUserRoles = await db
            .select({
              roleName: roles.name,
            })
            .from(users)
            .innerJoin(userRoles, eq(users.id, userRoles.userId))
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(users.email, token.email));

          // Extract role names and join them into a comma-separated string
          const roleNames = dbUserRoles.map((r) => r.roleName).join(",");


          // Store roles in JWT or fallback to "guest" if no roles
          token.roles = roleNames || "GUEST";
        }
      }
console.log("JWT Callback - Token:", token);
      return token;
    },

    async session({ session, token }) {
      // Called for every session check (e.g., useSession)
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      if (token.roles) {
        (session.user as { role?: string }).role = token.roles as string; // Read roles from JWT as string
      }
    console.log("Session Callback - Session:", session);
      return session;
    },
  },
  // Ensure JWT strategy is enabled (default in NextAuth)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});