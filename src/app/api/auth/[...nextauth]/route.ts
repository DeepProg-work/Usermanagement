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
          columns: { roleId: true },
        });
        console.log("DB User: ", dbUser?.roleId); // Debugging line
        // Check if user exists in the database
        if (dbUser) {
          token.role = dbUser.roleId; // Store role in JWT
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
          columns: {
    // Select the columns you need from the 'users' table
    id: true,
    name: true,
    email: true,
    roleId: true, // You can still select roleId if needed
    
  },
  with: {
    role: { // 'role' here must match the name of the relation in your Drizzle schema
            // (e.g., in usersRelations, it might be: role: one(roles, ...))
      columns: {
        name: true, // This will fetch the 'name' column from the related 'roles' table
        // id: true, // Optionally, if you also need the role's ID from the roles table
      }
    }
                  }          });
          
          if (dbUser) {
            token.role = dbUser.role?.name; // Store role in JWT
          } else {
            token.role = "Guest"; // Fallback role
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