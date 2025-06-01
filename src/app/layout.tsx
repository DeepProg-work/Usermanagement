// app/layout.tsx
'use client'; // RootLayout needs to be a client component for useState and useEffect

import { useState, useEffect, useCallback } from 'react';
import { TRPCProvider } from "@/providers/trpc-providers";
import Navbar from "./components/navbar/page"; // Your Navbar component
import './globals.css';
import { Toaster } from 'sonner';

const NAVBAR_HEIGHT_REM = 4; // Assuming Navbar is h-16 (4rem). Adjust if different.
const SCROLL_HIDE_THRESHOLD = NAVBAR_HEIGHT_REM * 16 / 2; // Start hiding after scrolling half navbar height
const SCROLL_SHOW_THRESHOLD = 50; // Show navbar if scrolling up significantly or near top

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const controlNavbar = useCallback(() => {
    const currentScrollY = window.scrollY;

    if (currentScrollY < SCROLL_SHOW_THRESHOLD) { // Always show if near the top
        setShowNav(true);
    } else if (currentScrollY > lastScrollY && currentScrollY > SCROLL_HIDE_THRESHOLD) {
      // Scrolling Down and past the initial threshold
      setShowNav(false);
    } else if (currentScrollY < lastScrollY) {
      // Scrolling Up
      setShowNav(true);
    }
    setLastScrollY(currentScrollY <= 0 ? 0 : currentScrollY); // For Mobile or negative scrolling
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [controlNavbar]);

  return (
    <html lang="en">
      <body>
        <TRPCProvider>
          {/* The Navbar component itself should have:
            className="... w-full h-16 (or your navbar's height) bg-your-color ..."
            The div below controls its fixed positioning and animation.
          */}
          <div
            className={`
              fixed top-0 left-0 right-0 z-50
              transition-transform duration-300 ease-in-out
              ${showNav ? 'translate-y-0' : '-translate-y-full'}
            `}
          >
            <Navbar /> {/* Ensure Navbar has its own background and height */}
          </div>

          {/* Add padding to the top of the children to prevent content 
            from being obscured by the fixed Navbar.
            This padding should be equal to the Navbar's height.
          */}
          <div style={{ paddingTop: `${NAVBAR_HEIGHT_REM}rem` }}>
            {children}
          </div>
          <Toaster richColors position="bottom-right" closeButton />
        </TRPCProvider>
      </body>
    </html>
  );
}
