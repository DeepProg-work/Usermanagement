// app/layout.tsx
import { TRPCProvider } from "@/providers/trpc-providers";

import Navbar from "./components/navbar/page";
import './globals.css';
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
         <TRPCProvider><Navbar></Navbar>{children}     <Toaster richColors position="bottom-right" closeButton /></TRPCProvider>             
    
      </body>
    </html>
  );
}