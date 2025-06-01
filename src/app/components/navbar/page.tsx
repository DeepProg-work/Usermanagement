'use client';
import { useState } from 'react';
import Link from 'next/link';
import ProfileDropdown from '../ProfileDropdown/page';
import { useAuthWithRoles } from '@/hooks/useAuthWithRoles';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status, checkRole, userRoles } = useAuthWithRoles();
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

interface NavItem {
  href: string;
  label: string;
  /**
   * If undefined, the item is public.
   * If an empty array [], the item is for any authenticated user.
   * If an array of role strings (e.g., ['admin', 'editor']),
   * the user must have at least one of these roles.
   * Roles in this array should ideally be lowercase for consistent checking with checkRole.
   */
  allowedRoles?: string[];
}

// Define your navigation items based on your snippet
// (place this inside your Navbar component, or pass it as a prop)
const navLinkItems: NavItem[] = [
  { href: '/', label: 'Home' }, // Public
  { href: '/pages/sorting', label: 'Sorting' }, // Public
  { href: '/pages/searching', label: 'Searching' },
  { href: '/pages/users', label: 'Users',allowedRoles: ['admin'] },
  { href: '/pages/roles',label: 'Roles', allowedRoles: ['admin']},
  
];

// This function will render the links based on the navLinkItems and roles
// (place this function inside your Navbar component or make it a helper)
const renderDesktopNavLinks = () => {
  // Ensure 'status' and 'checkRole' are accessible here from useAuthWithRoles
  // This example assumes they are in the same scope (e.g., Navbar component scope)

  return navLinkItems.map((item) => {
    let canShowItem = false;

    if (item.allowedRoles === undefined) {
      // Public item, always show
      canShowItem = true;
    } else if (status === 'authenticated') { // 'status' from useAuthWithRoles
      if (item.allowedRoles.length === 0) {
        // Item requires authentication, but no specific roles
        canShowItem = true;
      } else {
        // Item requires one of the specified roles
        // 'checkRole' from useAuthWithRoles
        canShowItem = item.allowedRoles.some(role => checkRole(role));
      }
    }

    if (canShowItem) {
      return (
        <Link
          key={item.href}
          href={item.href}
          className="px-8 py-2 rounded-md text-sm font-medium hover:bg-gray-700" // Class from your snippet
        >
          {item.label}
        </Link>
      );
    }
    return null; // Don't render the item if conditions are not met
  });
};
  


  return (
    <nav className=" bg-gray-100 text-blue sticky top-0 left-0  z-50">
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
            {renderDesktopNavLinks()} 
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
           {navLinkItems.map((item: NavItem) => { // Added NavItem type for clarity
    let canShowItem = false;

    // Determine if the item should be shown based on roles and auth status
    if (item.allowedRoles === undefined) { // Public item
      canShowItem = true;
    } else if (status === 'authenticated') { // Check authentication status
      if (item.allowedRoles.length === 0) { // Authenticated users, no specific role needed
        canShowItem = true;
      } else { // Specific roles required
        canShowItem = item.allowedRoles.some(role => checkRole(role));
      }
    }

    // Render the link if conditions are met
    if (canShowItem) {
      return (
        <Link
          key={item.href}
          href={item.href}
          className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700" // Class from your mobile snippet
          onClick={toggleMenu} // Call toggleMenu when a mobile link is clicked
        >
          {item.label}
        </Link>
      );
    }
    return null; // Otherwise, don't render this menu item
  })}
  
              <ProfileDropdown />
          </div>
        </div>
      )}
    </nav>
  );
}