'use client'


// pages/admin/users.tsx
import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { FaPlus, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa'; // Example icons
import { trpc } from '@/utils/trpc';

// Assuming you have your trpco client setup like this
// import { trpco } from '../utils/trpco'; // Adjust path as needed

// --- Placeholder for trpco types ---
// You should replace these with your actual types from your trpco router

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: "guest"|"admin"|"moderator"; // Example field
 
}
interface CreateUserInput {
  name: string;
  email: string;
  role: "guest"|"admin"|"moderator";
  // Add other fields as necessary
}

interface UpdateUserInput extends Partial<CreateUserInput> {
  id: string;
}
// --- End Placeholder for trpco types ---


// --- Placeholder for trpco hooks (replace with your actual trpco hooks) ---
const trpco = {
  user: {

   
    update: {
      useMutation: ({ onSuccess, onError }: { onSuccess?: (data: User) => void, onError?: (error: Error) => void } = {}) => {
        // This is a mock implementation. Replace with your actual trpco hook.
        const [isLoading, setIsLoading] = useState(false);
        const mutate = async (input: UpdateUserInput) => {
          setIsLoading(true);
          console.log('Updating user:', input);
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          const updatedUser: User = { ...input, name: input.name || "Updated Name", email: input.email || "updated@example.com", role: input.role || "guest",  };
          setIsLoading(false);
          if (Math.random() > 0.1) { // Simulate success
            onSuccess?.(updatedUser);
            return updatedUser;
          } else { // Simulate error
            const err = new Error("Failed to update user");
            onError?.(err);
            throw err;
          }
        };
        return { mutate, isLoading };
      }
    },
    delete: {
      useMutation: ({ onSuccess, onError }: { onSuccess?: (data: { id: string }) => void, onError?: (error: Error) => void } = {}) => {
        // This is a mock implementation. Replace with your actual trpco hook.
        const [isLoading, setIsLoading] = useState(false);
        const mutate = async (id: string) => {
          setIsLoading(true);
          console.log('Deleting user:', id);
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          setIsLoading(false);
          if (Math.random() > 0.1) { // Simulate success
            onSuccess?.({ id });
            return { id };
          } else { // Simulate error
            const err = new Error("Failed to delete user");
            onError?.(err);
            throw err;
          }
        };
        return { mutate, isLoading };
      }
    }
  }
};
// --- End Placeholder for trpco hooks ---


// Define the type for the form data
type UserFormData = {
  name: string;
  email: string;
  role: "guest"|"admin"|"moderator";  // Adjust based on your roles
  // Add other fields as necessary
};

const UserManagementPage: NextPage = () => {
  // NextAuth.js session
  const { data: session, status } = useSession();

  // State for managing modals and selected user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({ name: '', email: '', role:"guest"});

  // trpco queries and mutations
  // Replace with your actual trpco hooks
  const { data: userso, isLoading: isLoadingUsers, error: usersError, refetch: refetchUsers } = trpc.user.getAllUsers.useQuery();

  const createUserMutation = trpc.user.addNewUser.useMutation({
    onSuccess: () => {
      refetchUsers();
      setIsModalOpen(false);
      // Add toast notification for success
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
      // Add toast notification for error
    },
  });

  const updateUserMutation = trpco.user.update.useMutation({
    onSuccess: () => {
      refetchUsers();
      setIsModalOpen(false);
      setEditingUser(null);
      // Add toast notification for success
    },
    onError: (error) => {
      console.error('Failed to update user:', error);
      // Add toast notification for error
    },
  });

  const deleteUserMutation = trpco.user.delete.useMutation({
    onSuccess: () => {
      refetchUsers();
      // Add toast notification for success
    },
    onError: (error) => {
      console.error('Failed to delete user:', error);
      // Add toast notification for error
    },
  });

  // Effect to populate form when editingUser changes
  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || '',
        email: editingUser.email || '',
        role: editingUser.role || 'guest', // Default to 'guest' if role is not set
      });
    } else {
      setFormData({ name: '', email: '', role:"guest"}); // Reset for new user
    }
  }, [editingUser]);

  // Handle opening modal for creating a new user
  const handleAddNewUser = () => {
    setEditingUser(null); // Ensure no user is being edited
    setFormData({ name: '', email: '', role: "guest" }); // Reset form
    setIsModalOpen(true);
  };

  // Handle opening modal for editing an existing user
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  // Handle deleting a user
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUserMutation.mutate(userId);
      } catch (error) {
        // Error is handled by onError in useMutation
      }
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      // Update user
      await updateUserMutation.mutate({ id: editingUser.id, ...formData });
    } else {
      // Create user
      createUserMutation.mutate(formData);
    }
  };

  // Authentication check
  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen"><FaSpinner className="animate-spin text-4xl text-blue-500" /> <p className="ml-2">Loading session...</p></div>;
  }

  if (!session || session.user?.role !== 'moderator') { // Example: Restrict to Admin role
    return <div className="text-center py-10">Access Denied. You must be an Admin to manage users.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">User Management</h1>
        <p className="text-gray-600 mt-1">Manage all users in the system.</p>
      </header>

      {/* Add User Button */}
      <div className="mb-6 text-right">
        <button
          onClick={handleAddNewUser}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center ml-auto"
        >
          <FaPlus className="mr-2" /> Add New User
        </button>
      </div>

      {/* User Table */}
      {isLoadingUsers && (
        <div className="flex justify-center items-center py-10">
          <FaSpinner className="animate-spin text-3xl text-blue-500" />
          <p className="ml-3 text-gray-600">Loading users...</p>
        </div>
      )}
      {usersError && <div className="text-red-500 bg-red-100 p-4 rounded-lg">Error loading users: {usersError.message}</div>}
      
      {!isLoadingUsers && !usersError && userso && (
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {userso.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">No users found.</td>
                </tr>
              )}
              {userso.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{user.name || 'N/A'}</p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{user.email || 'N/A'}</p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                    <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' : 
                        user.role === 'moderator' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">
                    </p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-800 transition duration-150 p-1 rounded-md hover:bg-blue-100"
                        aria-label="Edit user"
                      >
                        <FaEdit size={18}/>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={deleteUserMutation.isLoading && editingUser?.id === user.id} // Disable if this user is being deleted
                        className="text-red-600 hover:text-red-800 transition duration-150 p-1 rounded-md hover:bg-red-100 disabled:opacity-50"
                        aria-label="Delete user"
                      >
                        {deleteUserMutation.isLoading && editingUser?.id === user.id ? <FaSpinner className="animate-spin"/> : <FaTrash size={18}/>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Form Fields */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  id="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="guest">guest</option>
                  <option value="moderator">moderator</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ updateUserMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 disabled:opacity-70 flex items-center"
                >
                  {( updateUserMutation.isLoading) && <FaSpinner className="animate-spin mr-2" />}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// You might want to protect this page, e.g., by requiring authentication
// UserManagementPage.auth = true; // Example if you have a per-page auth setup
// Or handle it within the component using useSession

export default UserManagementPage;

