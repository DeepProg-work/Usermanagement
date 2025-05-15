// server/rootRouter.ts
import { router } from "./trpc/trpc";
import { userRouter } from "./routers/user";

export const appRouter = router({
  user: userRouter,
});

export type AppRouter = typeof appRouter;