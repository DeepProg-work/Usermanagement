// src/app/(admin)/users/_components/UserTable.tsx
'use client';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { useState } from 'react';
import ConfirmationDialog from '@/components/modals/ConfirmationModal';
interface UserFromList { // As returned by getAllWithRoles
  id: string;
  name: string | null;
  email: string | null;
  roles: { id: number; name: string }[];
}

interface UserTableProps {
  users: UserFromList[];
  onEdit: (userId: string) => void; // Pass ID to fetch full user data for form
  onDelete: (userId: string) => void;
}

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
 
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
   const [userToProcess, setUserToProcess] = useState<UserFromList | null>(null);
 
   const openDeleteDialog = (role: UserFromList) => {
     setUserToProcess(role);
     setIsDeleteDialogOpen(true);
   };
 
   const closeDeleteDialog = () => {
     setIsDeleteDialogOpen(false);
     setUserToProcess(null); // Clear the role after closing
   };
 
   const handleConfirmDelete = () => {
     if (userToProcess) {
       onDelete(userToProcess.id); // Call the original onDelete prop
     }
     closeDeleteDialog(); // Close the dialog after action
   };
 
 
 
  if (!users || users.length === 0) {
    return <p className="text-gray-500 py-4">No users found.</p>;
  }

  return (<>
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.roles.length > 0 ? user.roles.map(role => role.name).join(', ') : 'No roles'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button onClick={() => onEdit(user.id)} className="text-indigo-600 hover:text-indigo-900"> <PencilSquareIcon className="h-5 w-5" /></button>
                <button
                    onClick={() => openDeleteDialog(user)} // <--- MODIFIED HERE
                    className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                    title="Delete Role"
                    aria-label="Delete Role"
                  >
                   <TrashIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {/* Confirmation Dialog for Deleting a Role */}
        {userToProcess && (
          <ConfirmationDialog
            isOpen={isDeleteDialogOpen}
            onClose={closeDeleteDialog}
            onConfirm={handleConfirmDelete}
            title="Confirm User Deletion"
            message={
              <>
                Are you sure you want to delete the User "<strong>{userToProcess.name}</strong>"?
                <br />
                This action cannot be undone.
              </>
            }
            confirmButtonText="Delete User"
            confirmButtonColor="red"
          />
        )}
      
  
  
  
  </>
    );
}