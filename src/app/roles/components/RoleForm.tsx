// src/app/(admin)/roles/_components/RoleForm.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { trpc } from '@/utils/trpc';
import React from 'react';
import { toast } from 'sonner';

// Zod schema for role input
const roleInputSchema = z.object({
  id: z.number().optional(), // Role ID is a number, optional for creation
  name: z.string().trim().min(1, "Role name is required").max(100, "Role name must be 100 characters or less"),
  // MODIFIED: Description schema simplified to align with resolver typing
  description: z.string().trim().nullable().optional(),
});

// RoleFormValues will now have description as: string | null | undefined
type RoleFormValues = z.infer<typeof roleInputSchema>;

// Data structure expected for initialData (when editing a role)
interface RoleDataForForm {
  id: number | string; // Depending on your backend, this could be a string or number
  name: string;
  description: string | null; // This remains the same, as backend/DB stores it as string | null
}

interface RoleFormProps {
  initialData?: RoleDataForForm;
  onFormSubmit: () => void; // Callback to close the form/modal and refetch list
}

export function RoleForm({ initialData, onFormSubmit }: RoleFormProps) {
  const utils = trpc.useUtils();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleInputSchema), // This should now align
    defaultValues: initialData
      ? {
          name: initialData.name || '',
          description: initialData.description || '', // textarea handles null/undefined as empty string
        }
      : {
          name: '',
          description: '', // Empty string is fine for string | null | undefined
        },
  });

  React.useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        description: initialData.description || '',
      });
    } else {
      reset({
        name: '',
        description: '', // Explicitly reset description
      });
    }
  }, [initialData, reset]);

  const createRoleMutation = trpc.user.createRole.useMutation({
    onSuccess: () => {
      utils.user.getAllRoles.invalidate();
      onFormSubmit();
      toast.success('Role created successfully');
    },
    onError: (error: { message: any }) =>
      toast.error(`Error creating role: ${error.message}`),
  });

  const updateRoleMutation = trpc.user.updateRole.useMutation({
    onSuccess: async () => {
      utils.user.getAllRoles.invalidate();
      if (initialData?.id) {
        utils.user.getRoleById.invalidate({ id: String(initialData.id) });
      }
      onFormSubmit();
      toast.success('Role updated successfully');
    },
    onError: (error: { message: any }) =>
      toast.error(`Error updating role: ${error.message}`),
  });

  const onSubmit = (data: RoleFormValues) => {
    // Handle description: undefined, null, or empty/whitespace-only string should become null for the backend.
    // Non-empty strings are kept.
    const finalDescription = (data.description && data.description.trim() !== '') ? data.description.trim() : null;

    const submissionData = {
      name: data.name.trim(), // Ensure name is also trimmed
      description: finalDescription,
    };

    if (initialData?.id) {
      updateRoleMutation.mutate({
        ...submissionData,
        id: typeof initialData.id === 'string' ? Number(initialData.id) : initialData.id
      });
    } else {
      // For create, pass data that matches the backend's create input type
      // Assuming backend expects name (string) and description (string | null)
      createRoleMutation.mutate(submissionData as { name: string; description: string | null });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6 bg-white">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Role Name <span className="text-red-500">*</span>
        </label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              id="name"
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="e.g., Administrator, Editor"
            />
          )}
        />
        {errors.name && (
          <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              // Handle field.value being string | null | undefined for the textarea
              value={field.value ?? ''}
              id="description"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Optional: A brief description of the role's purpose or permissions."
            />
          )}
        />
        {errors.description && (
          <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onFormSubmit}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {isSubmitting
            ? 'Saving...'
            : initialData?.id
            ? 'Update Role'
            : 'Create Role'}
        </button>
      </div>
    </form>
  );
}