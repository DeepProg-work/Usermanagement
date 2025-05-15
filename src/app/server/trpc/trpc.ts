// server/trpc.ts
import { initTRPC } from "@trpc/server";
import { db } from "@/server/db";
import { auth } from "@/api/auth/[...nextauth]/route";

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