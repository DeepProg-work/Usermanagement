import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string | null | undefined; // Explicitly define role as string or undefined
  }

  interface Session {
    user?: User;
  }
 
  interface JWT {
    user?: User;
    role?: string | null; // Explicitly define role as string or undefined
  }
}