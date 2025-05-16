// server/routers/user.ts

import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { router, publicProcedure, protectedProcedure } from "../trpc/trpc";
import { z } from "zod";


export const userRouter = router({
   getById: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const user= await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, input),
      });
      return user 
    }),
 
    getAllUsers: publicProcedure
    .query(async ({ ctx }) => {
      const users = await ctx.db.query.users.findMany({
        });
      return users;
    }
  ),
 
  addNewUser: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email(),

      role: z.enum(["admin", "moderator", "guest"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { name, email, role } = input;
      const newUser = await ctx.db.insert(users).values({
        name,
        email,
    
        role,
      });
      return newUser;
    }
  ),
 
    getSecretData: protectedProcedure.query(({ ctx }) => {
    return { message: `Hello, ${ctx.user.name}! This is protected.` };
  }),

   updateRole: protectedProcedure
      .input(z.object({ userId: z.string(), newRole: z.enum(["admin", "moderator", "guest"]) }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.update(users)
      .set({ role: input.newRole })
      .where(eq(users.id, input.userId));
  }),
 getSession: publicProcedure
  .query(async ({ ctx }) => {
    // 1. Get the basic session
    const session = await ctx.auth();
    
    if (!session?.user?.email) {
      return session; // Return original session if no user
    }

    // 2. Fetch complete user data from database
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.email, session!.user!.email),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        // Add other fields you need
      }
    });

    if (!user) {
      return session; // Return original session if no user found
    }

    // 3. Merge session with database user data
    return {
      ...session,
      user: {
        ...session.user,
        id: user.id,
        name: user.name,
        role: user.role,
        // Add other fields from your database
      }
    };
  }),
});