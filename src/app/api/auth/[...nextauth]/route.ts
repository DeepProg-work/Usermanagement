// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";
import GoogleProvider from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { users } from "@/server/db/schema";

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
   async jwt({ token,trigger, user }) {
      // Called during sign-in or token refresh
     if(trigger){
      if(trigger === "update" ) {
        if (token?.email) {

     
        // Query database to get role during sign-in
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, token.email),
          columns: { role: true },
        });
        console.log("DB User: ", dbUser?.role); // Debugging line
        // Check if user exists in the database
        if (dbUser) {
          token.role = dbUser.role; // Store role in JWT
        } else {
          token.role = "guest"; // Fallback role
        }
        }
      }
      if (trigger === "signIn") {
        // Called during sign-in
        // Check if user is signing in for the first time
        if (user.email) {
          // Check if user exists in the database
          const dbUser = await db.query.users.findFirst({
            where: eq(users.email, user.email),
            columns: { role: true },
          });
          
          if (dbUser) {
            token.role = dbUser.role; // Store role in JWT
          } else {
            token.role = "guest"; // Fallback role
          }
        }
      } 
      console.log("JWT Callback: ", token); // Debugging line
   }return token;   },

     async session({ session, token }) {
      // Called for every session check (e.g., useSession)
      if (token.role) {
        session.user.role = token.role.toString(); // Read role from JWT
      } else {
        session.user.role = "guest"; // Fallback
      }
      console.log("Session Callback: ", session); // Debugging line
      return session;
    },
  },
  // Ensure JWT strategy is enabled (default in NextAuth)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  
},);