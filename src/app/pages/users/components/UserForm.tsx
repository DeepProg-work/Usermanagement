// src/app/(admin)/users/_components/UserForm.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { trpc } from '@/utils/trpc';
import React from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

 const userInputSchema = z.object({
  id: z.string().optional(), // Optional for creation
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  roleIds: z.array(z.number()).optional().default([]), // Array of role IDs
});

// Define Zod schema for the form
const formSchema = userInputSchema.extend({
  roleIds: z.array(z.number()),
});
type UserFormValues = z.infer<typeof formSchema>;

interface Role {
  id: number;
  name: string;
}

interface UserDataForForm { // Data structure if fetching a single user for edit
    id: string;
    name: string | null;
    email: string | null;
    roleIds: number[];
}

interface UserFormProps {
  initialData?: UserDataForForm;
  onFormSubmit: () => void;
  allRoles: Role[];
}

// Removed duplicate UserFormValues interface to avoid duplicate identifier error

export function UserForm({ initialData, onFormSubmit, allRoles }: UserFormProps) {
  const utils = trpc.useUtils();
console.log('UserForm initialData:', initialData);
  console.log('UserForm allRoles:', allRoles);
  // Initialize useForm with defaultValues from initialData
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name || '',
          email: initialData.email || '',
          roleIds: initialData.roleIds || [], // Ensure roleIds is an array
        }
      : {
          name: '',
          email: '',
          roleIds: [],
        },
  });

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        email: initialData.email || '',
        roleIds: initialData.roleIds || [],
      });
    }
  }, [initialData, reset]);

  const createUserMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      utils.user.getAllWithRoles.invalidate();
      onFormSubmit();
    },
    onError: (error: { message: any }) =>toast.error(`Error creating user: ${error.message}`),
  });
const { update } = useSession();
const updateUserMutation = trpc.user.update.useMutation({
    onSuccess: async () => {
      utils.user.getAllWithRoles.invalidate();
      if (initialData?.id) {
        utils.user.getById.invalidate({ id: initialData.id });
      }
      
     try {
      toast.success('User updated successfully');
      console.log("Calling update...");
      await update({ role: 'ghhhh' }); // This should trigger the jwt callback with "update"
      console.log("Update completed");
    } catch (error) {
      console.error("Update failed:", error);
    }
      onFormSubmit();
    },
    onError: (error: { message: any }) => toast.error(`Error updating user: ${error.message}`),
  });

  const onSubmit = (data: UserFormValues) => {
    if (initialData?.id) {
      updateUserMutation.mutate({ ...data, id: initialData.id })
    } else {
      createUserMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 bg-white shadow-md rounded-lg">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              id="name"
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          )}
        />
        {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              id="email"
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          )}
        />
        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Roles</label>
        <Controller
          name="roleIds"
          control={control}
          render={({ field }) => (
            <div className="mt-2 space-y-2">
              {allRoles.map((role) => (
                <label key={role.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    checked={field.value?.includes(role.id)}
                    onChange={(e) => {
                      const currentRoleIds = field.value || [];
                      if (e.target.checked) {
                        field.onChange([...currentRoleIds, role.id]);
                      } else {
                        field.onChange(currentRoleIds.filter((id) => id !== role.id));
                      }
                    }}
                  />
                  <span className="text-sm text-gray-700">{role.name}</span>
                </label>
              ))}
            </div>
          )}
        />
        {errors.roleIds && <p className="mt-2 text-sm text-red-600">{errors.roleIds.message}</p>}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onFormSubmit}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : initialData?.id ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
}