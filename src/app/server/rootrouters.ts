// server/rootRouter.ts
import { router } from "./trpc/trpc";
import { usersRouter } from "./routers/user";

export const appRouter = router({
  user: usersRouter,
});

export type AppRouter = typeof appRouter;