// server/routers/user.ts

import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { router, publicProcedure, protectedProcedure } from "../trpc/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: "Guest"|"Admin"|"Moderator"; // Example field
 
}
interface CreateUserInput {
  name: string;
  email: string;
  role: "Guest"|"Admin"|"Moderator";
  // Add other fields as necessary
}

interface UpdateUserInput extends Partial<CreateUserInput> {
  id: string;
}
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

      role: z.enum(["Admin", "Moderator", "Guest"]),
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
 
       updateUser: publicProcedure // Use protectedProcedure if only authenticated users can update
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
         id:z.string(),
      role: z.enum(["Admin", "Moderator", "Guest"])}))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Construct the data to set, only including fields that were provided
      const dataToSet: Partial<Omit<User, 'id' | 'updatedAt'>> = {};
      if (updateData.name !== undefined) {
        dataToSet.name = updateData.name;
      }
      if (updateData.email !== undefined) {
        dataToSet.email = updateData.email;
      }
      if (updateData.role !== undefined) {
        dataToSet.role = updateData.role;
      }

      // If no actual data fields are provided to update (besides id),
      // you might want to return early or throw an error.
      if (Object.keys(dataToSet).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No fields provided to update.',
        });
      }

      try {
        // Example with Drizzle ORM:
        // const updatedUsers = await ctx.db.update(users) // 'users' is your Drizzle schema table
        //   .set({
        //     ...dataToSet,
        //     updatedAt: new Date(), // Optionally update a timestamp
        //   })
        //   .where(eq(users.id, id)) // 'eq' is from Drizzle, 'users.id' is schema field
        //   .returning(); // Returns an array of updated rows

        // Using the mock DB for this example:
        const updatedUsers = await ctx.db.update(users) // Pass mock schema
          .set({
            ...dataToSet,
            // updatedAt is handled by the mock .set().where()
          })
          .where(eq(users.id, id)); // Mock 'eq' and schema field access


        if (updatedUsers.rowsAffected === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `User with ID '${id}' not found.`,
          });
        }

        // .returning() gives an array, usually we expect one user to be updated by ID
        return updatedUsers;

      } catch (error) {
        // Log the error for server-side debugging
        console.error("Failed to update user:", error);

        // If it's already a TRPCError, rethrow it
        if (error instanceof TRPCError) {
          throw error;
        }

        // For other errors, throw a generic internal server error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while updating the user.',
          // Optionally, you can chain the original error if your logging/error reporting setup uses it
          // cause: error,
        });
      }
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