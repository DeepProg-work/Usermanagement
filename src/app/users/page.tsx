
'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import { UserForm } from './components/UserForm';
import { UserTable } from './components/UserTable';
import { useSession } from 'next-auth/react';
import { useAuthWithRoles } from '@/hooks/useAuthWithRoles'
interface UserDataForForm { // Data structure if fetching a single user for edit
    id: string;
    name: string | null;
    email: string | null;
    roleIds: number[];
}


export default function UsersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);



  const { data: usersList, isLoading: isLoadingUsers, error: usersError, refetch: refetchUsers } =
    trpc.user.getAllWithRoles.useQuery();

  const { data: allRoles, isLoading: isLoadingRoles, error: rolesError } =
    trpc.user.getAllRoles.useQuery();

  // Fetch data for the user being edited
  
  const { data: userToEditData, isLoading: isLoadingUserToEdit, refetch: refetchUserToEdit } =
    trpc.user.getById.useQuery(
      { id: editingUserId! },
      { enabled: !!editingUserId && isFormOpen }
    );

  const deleteUserMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      refetchUsers();
      alert('User deleted successfully');
    },
    onError: (error: { message: any }) => alert(`Error deleting user: ${error.message}`),
  });

  const handleOpenFormForCreate = () => {
    setEditingUserId(null);
    setIsFormOpen(true);
  };

  const handleOpenFormForEdit = (userId: string) => {
    setEditingUserId(userId);
    console.log ('Editing user ID:', userId);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUserId(null);
  };

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate({ id: userId });
  };

  // Transform userToEditData to match UserDataForForm
  const formInitialData: UserDataForForm | undefined =
    isFormOpen && editingUserId && userToEditData
      ? {
          id: userToEditData.id,
          name: userToEditData.name , // Handle null
          email: userToEditData.email  , // Handle null
         roleIds: userToEditData.role.map((r) => r.id)
        }
      : undefined;

  const isLoading = isLoadingUsers || isLoadingRoles || (isFormOpen && editingUserId && isLoadingUserToEdit);
  const error = usersError || rolesError;

  if (isLoading && !usersList && !allRoles) {
    return <div className="p-6 text-center">Loading page data...</div>;
  }
  if (error) {
    return <div className="p-6 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">User Management</h1>
        <button
          onClick={handleOpenFormForCreate}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Add New User
        </button>
      </header>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white p-1 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">{editingUserId ? 'Edit User' : 'Create New User'}</h2>
              <button onClick={handleCloseForm} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>
            {isLoadingRoles || (editingUserId && isLoadingUserToEdit) ? (
              <div className="p-6 text-center">Loading form data...</div>
            ) : (
              <UserForm
                initialData={formInitialData}
                onFormSubmit={() => {
                  handleCloseForm();
                  refetchUsers();
                }}
                allRoles={allRoles || []}
              />
            )}
          </div>
        </div>
      )}

      <main>
        {isLoadingUsers && !usersList ? (
          <p className="text-center text-gray-500">Loading users...</p>
        ) : usersList && usersList.length > 0 ? (
          <UserTable users={usersList} onEdit={handleOpenFormForEdit} onDelete={handleDeleteUser} />
        ) : (
          <p className="text-center text-gray-500">No users yet. Click "Add New User" to get started.</p>
        )}
      </main>
    </div>
  );
}