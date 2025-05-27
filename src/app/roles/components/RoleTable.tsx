// src/app/(admin)/roles/_components/RoleTable.tsx
'use client';

import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { toast } from 'sonner'; 
// Define the structure for a Role item in the list
// This should match the data structure returned by your trpc.role.getAll query
interface RoleFromList {
  id: number; // Role ID is typically a number
  name: string;
  description: string | null;
  createdAt: Date | string | number; // Allow for various date representations
  // updatedAt?: Date | string | number; // Optional: if you want to display it
}

interface RoleTableProps {
  roles: RoleFromList[];
  onEdit: (roleId: number) => void;
  onDelete: (roleId: number) => void;
}

export function RoleTable({ roles, onEdit, onDelete }: RoleTableProps) {
  if (!roles || roles.length === 0) {
    return <p className="text-gray-500 py-4 text-center">No roles found.</p>;
  }

  const formatDate = (dateInput: Date | string | number | null | undefined) => {
    if (!dateInput) return 'N/A';
    try {
      // Attempt to create a Date object. If it's already a Date, this is fine.
      // If it's a string or number timestamp, it will try to parse it.
      const date = new Date(dateInput);
      // Check if the date is valid after parsing
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString(); // Or use toLocaleString() for date and time
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created At
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {roles.map((role) => (
            <tr key={role.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {role.name}
              </td>
              <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 break-words">
                {role.description || <span className="italic text-gray-400">No description</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(role.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button
                  onClick={() => onEdit(role.id)}
                  // Using purple to match the "Add New Role" button from RolesPage
                  className="text-purple-600 hover:text-purple-900"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
                      onDelete(role.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-900"
                >
                                    <TrashIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}