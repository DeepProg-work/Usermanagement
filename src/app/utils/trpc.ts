import { createTRPCReact } from "@trpc/react-query";
import { AppRouter } from "@/server/rootrouters";

export const trpc = createTRPCReact<AppRouter>();