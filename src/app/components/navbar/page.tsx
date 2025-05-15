'use client';
import { useState } from 'react';
import Link from 'next/link';
import ProfileDropdown from '../ProfileDropdown/page';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="  bg-blue-400 text-white sticky top-0 left-0  z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 ">
          {/* Logo */}
          <div className="flex-shrink-0 ml-8">
            <Link href="/" className="text-2xl font-bold ">
              Logo
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-4  flex items-baseline gap-8">
              <Link href="/" className="px-8 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                Home
              </Link>
              <Link href="/about" className="px-8 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                About
              </Link>
              <Link href="/services" className="px-8 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                Services
              </Link>
              <Link href="/contact" className="px-8 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                Contact
              </Link>
               <ProfileDropdown />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
              onClick={toggleMenu}
            >
              About
            </Link>
            <Link
              href="/services"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
              onClick={toggleMenu}
            >
              Services
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
              onClick={toggleMenu}
            >
              Contact
            </Link>
             <ProfileDropdown />
          </div>
        </div>
      )}
    </nav>
  );
}