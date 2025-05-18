import { eq } from "drizzle-orm";
import { users } from "../db/schema"; // Assuming 'users' and 'roles' tables are defined in your schema
import { router, publicProcedure /*, protectedProcedure*/ } from "../trpc/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Define the possible role names. This should match the names in your 'roles' table.


// Interface for the Role object, assuming 'roles' table has 'id' and 'name'
interface RoleSchema {
  id: number;
  name: string; // Or string if role names are not strictly one of validRoleNames
}

// This interface should align with your Drizzle schema for the 'users' table
// and include the related role information.
interface UserSchema {
  id: number;
  name: string | null;
  email: string | null;
  roleId: number | null; // Foreign key to the roles table
  role: RoleSchema | null; // The related role object (or null if roleId is null)
  createdAt: Date;
  updatedAt: Date;
}

// Input for creating a user
interface CreateUserInput {
  name: string;
  email: string;
  roleId: number; // Expect roleId for linking
}

// Input for updating a user
interface UpdateUserInput {
  name?: string;
  roleId?: number; // Expect roleId for linking
}

export const userRouter = router({
  getById: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: (usersTable, { eq }) => eq(usersTable.id, input),
        with: {
          role: true, // Assuming the relation in Drizzle schema is named 'role'
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User with ID '${input}' not found.`,
        });
      }
      // Basic validation for the fetched role name
   
      return user as unknown as UserSchema;
    }),

  getAllUsers: publicProcedure
    .query(async ({ ctx }) => {
      const allUsers = await ctx.db.query.users.findMany({
        with: {
          role: true, // Fetch related role for all users
        },
      });
      return allUsers.map(user => {
       
                return user;
      }) as unknown as UserSchema[];
    }),

  addNewUser: publicProcedure
    .input(z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
      roleId: z.number().int().positive("RoleId must be a positive integer"), // Expecting ID of an existing role
    }))
    .mutation(async ({ ctx, input }) => {
      const { name, email, roleId } = input;

      // Optional: Check if the roleId corresponds to an existing role
      const roleExists = await ctx.db.query.roles.findFirst({
        where: (rolesTable, {eq}) => eq(rolesTable.id, roleId)
      });
      if (!roleExists) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Role with ID '${roleId}' does not exist.`,
        });
      }
     


      const existingUserByEmail = await ctx.db.query.users.findFirst({
        where: (usersTable, { eq }) => eq(usersTable.email, email),
      });

      if (existingUserByEmail) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists.',
        });
      }

      const newUserArray = await ctx.db.insert(users).values({
        name,
        email,
        roleId, // Store roleId
        // createdAt and updatedAt are often handled by DB defaults
      }).returning({
          id: users.id, // Specify columns to return
          name: users.name,
          email: users.email,
          roleId: users.roleId,
          
      });

      if (newUserArray.length === 0) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user.',
        });
      }
      
      // Fetch the newly created user with its role to match UserSchema
      const createdUserWithRole = await ctx.db.query.users.findFirst({
          where: eq(users.id, newUserArray[0].id),
          with: { role: true }
      });

      return createdUserWithRole as unknown as UserSchema;
    }),

  updateUser: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, "Name cannot be empty").optional(),
      roleId: z.number().int().positive("RoleId must be a positive integer").optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
       console.log("Update Data:", updateData);
      const dataToSet: Partial<Omit<UserSchema, 'id' | 'createdAt' | 'updatedAt' | 'email' | 'role'>> = {};

      if (updateData.name !== undefined) {
        dataToSet.name = updateData.name;
      }
      if (updateData.roleId !== undefined) {
        // Optional: Check if the new roleId is valid
        const roleExists = await ctx.db.query.roles.findFirst({
            where: (rolesTable, {eq}) => eq(rolesTable.id, updateData.roleId as number)
        });
        if (!roleExists) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Role with ID '${updateData.roleId}' does not exist.`,
            });
        }
       
        dataToSet.roleId = updateData.roleId;
      }

      if (Object.keys(dataToSet).length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No fields provided to update.',
        });
      }

      const finalDataToSet = {
        ...dataToSet,
        updatedAt: new Date(),
      };

      try {
        const updatedUserArray = await ctx.db.update(users)
          .set(finalDataToSet)
          .where(eq(users.id, String(id)))
          .returning({ // Specify columns to return
            id: users.id,
            name: users.name,
            email: users.email,
            roleId: users.roleId,
          
          });

        if (updatedUserArray.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `User with ID '${id}' not found or no changes made.`,
          });
        }
        
        // Fetch the updated user with its role to match UserSchema
        const updatedUserWithRole = await ctx.db.query.users.findFirst({
            where: eq(users.id, updatedUserArray[0].id),
            with: { role: true }
        });

        return updatedUserWithRole as unknown as UserSchema;

      } catch (error) {
        console.error("Failed to update user:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while updating the user.',
        });
      }
    }),
deleteUser: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const userId = input;  
      const deletedUserArray = await ctx.db.delete(users)
        .where(eq(users.id, userId))
       
    }),



    getRoles: publicProcedure
    .query(async ({ ctx }) => {  const allRoles = await ctx.db.query.roles.findMany({
        // Assuming you want to fetch all roles
              }); 
      return allRoles.map(role => {
        
        return role;
      }) as unknown as RoleSchema[];
    }),

  getSession: publicProcedure
    .query(async ({ ctx }) => {
      const session = await ctx.auth(); // Your auth method

      if (!session?.user?.email) {
        return null;
      }

      const dbUser = await ctx.db.query.users.findFirst({
        where: eq(users.email, session.user.email),
        with: {
          role: true, // Fetch the related role object
        },
        // No need for 'columns' when using 'with' for all top-level fields
      });

      if (!dbUser) {
        console.warn(`User with email ${session.user.email} found in session but not in DB.`);
        throw new TRPCError({ code: "NOT_FOUND", message: "User associated with session not found in database." });
      }
      
     

      return {
        ...session, // Original session properties
        user: {
          ...session.user, // Original session user properties (like tokens from provider)
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          roleId: dbUser.roleId,
          role: dbUser.role ? { id: dbUser.role.id, name: dbUser.role.name as string } : null,
         
        },
      } as unknown as { user: UserSchema & { /* any other session specific user fields */ }};
    }),
});
