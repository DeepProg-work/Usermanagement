import "next-auth";

declare module "next-auth" {
   interface User extends NextAuthUser {
    id: string;
  }

  interface Session {
    user: {
      id: string;     // Add 'id' to the Session user
      role?: string;   // Keep your existing 'role' property
    } & DefaultSession['user']; // Merge with default user properties (name, email, image)
  }

 
  interface JWT {
    user?: User;
    role?: string | null; // Explicitly define role as string or undefined
  }
}