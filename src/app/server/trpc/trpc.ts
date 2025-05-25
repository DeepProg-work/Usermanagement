// server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { auth } from "@/api/auth/[...nextauth]/route";
import { roles, userRoles, users } from "../db/schema";
import { eq } from "drizzle-orm";

export const createContext = async () => {
  const session = await auth();
  return {
    db,
    auth,
    user: session?.user,
  };
};
const t = initTRPC.context<{ db: typeof db; auth: typeof auth }>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = publicProcedure.use(async (opts) => {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return opts.next({ ...opts, ctx: { user: session.user } });
});

export const adminProtectedProcedure = publicProcedure.use(async (opts) => {
  const session = await auth();

  if (!session?.user?.email) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action.',
    });
  }

  const userId = session.user.id;

  // 2. Fetch the user and their roles from the database
  // The 'with' clause below needs to match your Drizzle relation names.
  // Based on the provided schema and common practice, we assume:
  // - A relation from 'users' to 'userRoles' named 'assignedRoles'.
  // - A relation from 'userRoles' to 'roles' named 'role'.

  const userWithRolesData = await db.query.users.findFirst({
                where: eq(users.id, userId),
         });
   
         if (!userWithRolesData) {
           throw new Error('User not found');
         }
      
       // Fetch roles with names
         const assignedRoles = await db
           .select({
             id: roles.id,
             name: roles.name,
           })
           .from(userRoles)
           .innerJoin(roles, eq(userRoles.roleId, roles.id))
           .where(eq(userRoles.userId, userId));
   
        
  
        
  if (!userWithRolesData) {
    console.error(`Admin check failed: User with ID ${userId} not found in database.`);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'User not found.',
    });
  }

  // Extract role names
  // 'userWithRolesData.assignedRoles' will be an array of userRoles entries
  // Each entry will have a 'role' object (if the relation is set up correctly and data exists)
 
  const userRoleNames = assignedRoles
    .map((userRoleEntry) => userRoleEntry.name)
    .filter((name): name is string => typeof name === 'string');

  // 3. Check if the user has the "admin" role (case-insensitive)
  const isAdmin = userRoleNames.some(
    (roleName) => roleName.toLowerCase() === 'admin'
  );

  if (!isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to perform this action. Administrator access required.',
    });
  }

  // 4. If all checks pass, proceed with the original options,
  // adding the authenticated user and an isAdmin flag to the context.
  return opts.next({
    ...opts,
    ctx: {
      ...opts.ctx, // Preserve any existing context
      user: session.user, // The authenticated user object
      isAdmin: true,      // Flag indicating admin status
    },
  });
});

