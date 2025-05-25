// providers/trpc-provider.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import { SessionProvider } from "next-auth/react";


export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
        }),
      ],
    })
  );

  return (
       <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}><SessionProvider>{children}</SessionProvider></QueryClientProvider>
    </trpc.Provider>
  );
}