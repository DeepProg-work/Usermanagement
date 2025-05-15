// app/api/trpc/[trpc]/route.ts
import { createContext } from "@/server/trpc/trpc";
import { appRouter } from "@/server/rootrouters";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };