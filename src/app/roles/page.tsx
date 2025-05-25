'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
// You'll need to create these components similar to UserForm and UserTable
import { RoleForm } from './components/RoleForm';
import { RoleTable } from './components/RoleTable';

// Define the structure for the data passed to the RoleForm, especially for editing.
interface RoleDataForForm {
  id: number | string; // Depending on your backend, this could be a string or number
  name: string;
  description: string | null;
}

// Define the expected structure of a Role object, primarily for RoleTable.
// Adjust this based on what trpc.role.getAll returns.
interface Role {
  id: string  | number; // Depending on your backend, this could be a string or number
  name: string;
  description: string | null;
  createdAt: Date | string; // Or number if timestamp
  updatedAt: Date | string; // Or number if timestamp
  // Add any other properties your RoleTable might need
}

export default function RolesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);

  const {
    data: rolesList,
    isLoading: isLoadingRolesList,
    error: rolesListError,
    refetch: refetchRolesList,
  } = trpc.user.getAllRoles.useQuery();

  // Fetch data for the role being edited
  const { data: roleToEditData, isLoading: isLoadingRoleToEdit } =
    trpc.user.getRoleById.useQuery(
      editingRoleId !== null
        ? { id: String(editingRoleId) }
        : ({} as any),
      { enabled: editingRoleId !== null && isFormOpen }
    );

  const deleteRoleMutation = trpc.user.deleteRole.useMutation({
    onSuccess: () => {
      refetchRolesList();
      alert('Role deleted successfully');
    },
    onError: (error: { message: any }) =>
      alert(`Error deleting role: ${error.message}`),
  });

  const handleOpenFormForCreate = () => {
    setEditingRoleId(null);
    setIsFormOpen(true);
  };

  const handleOpenFormForEdit = (roleId: number) => {
    setEditingRoleId(roleId);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRoleId(null);
  };

  const handleDeleteRole = (roleId: number) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      deleteRoleMutation.mutate({ id: roleId });
    }
  };

  // Transform roleToEditData to match RoleDataForForm
  const formInitialData: RoleDataForForm | undefined =
    isFormOpen && editingRoleId && roleToEditData
      ? {
          id: typeof roleToEditData.id === 'string' ? Number(roleToEditData.id) : roleToEditData.id,
          name: roleToEditData.name,
          description: roleToEditData.description,
        }
      : undefined;

  const isLoadingOverall = isLoadingRolesList || (isFormOpen && editingRoleId && isLoadingRoleToEdit);

  if (isLoadingRolesList && !rolesList) {
    return <div className="p-6 text-center">Loading page data...</div>;
  }

  if (rolesListError) {
    return <div className="p-6 text-red-500">Error: {rolesListError.message}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Role Management
        </h1>
        <button
          onClick={handleOpenFormForCreate}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Add New Role
        </button>
      </header>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white p-1 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">
                {editingRoleId ? 'Edit Role' : 'Create New Role'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times; {/* Using HTML entity for '×' for better readability */}
              </button>
            </div>
            {editingRoleId && isLoadingRoleToEdit ? (
              <div className="p-6 text-center">Loading form data...</div>
            ) : (
              <RoleForm // Assuming RoleForm handles its own loading/error for create/update
                initialData={formInitialData}
                onFormSubmit={() => {
                  handleCloseForm();
                  refetchRolesList();
                }}
              />
            )}
          </div>
        </div>
      )}

      <main>
        {isLoadingRolesList && !rolesList ? ( // Initial load for the table
          <p className="text-center text-gray-500">Loading roles...</p>
        ) : rolesList && rolesList.length > 0 ? (
          <RoleTable
            roles={
              rolesList.map((role) => ({
                ...role,
                id: typeof role.id === 'string' ? Number(role.id) : role.id,
              }))
            }
            onEdit={handleOpenFormForEdit}
            onDelete={handleDeleteRole}
          />
        ) : (
          <p className="text-center text-gray-500">
            No roles yet. Click "Add New Role" to get started.
          </p>
        )}
      </main>
    </div>
  );
}