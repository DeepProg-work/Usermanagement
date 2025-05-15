// app/layout.tsx
import { TRPCProvider } from "@/providers/trpc-providers";
import { SessionProvider } from "next-auth/react";
import Navbar from "./components/navbar/page";
import './globals.css';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider refetchOnWindowFocus={false} refetchInterval={15 * 60}>
          <TRPCProvider><Navbar></Navbar>{children}</TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  );
}