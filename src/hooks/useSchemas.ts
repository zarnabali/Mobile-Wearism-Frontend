import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SchemaApi, type Schema, type CreateSchemaData } from '../utils/api';

// Query Keys - Centralized for consistency
export const schemaKeys = {
  all: ['schemas'] as const,
  lists: () => [...schemaKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...schemaKeys.lists(), filters] as const,
  details: () => [...schemaKeys.all, 'detail'] as const,
  detail: (id: string) => [...schemaKeys.details(), id] as const,
  stats: (name: string) => [...schemaKeys.all, 'stats', name] as const,
};

// ============================================
// QUERY HOOKS (Data Fetching)
// ============================================

/**
 * Fetch all schemas with caching and background updates
 */
export function useSchemas() {
  return useQuery({
    queryKey: schemaKeys.lists(),
    queryFn: SchemaApi.getAllSchemas,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch a specific schema by name
 */
export function useSchema(name: string) {
  return useQuery({
    queryKey: schemaKeys.detail(name),
    queryFn: () => SchemaApi.getSchemaByName(name),
    enabled: !!name, // Only run if name is provided
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch schema statistics
 */
export function useSchemaStats(name: string) {
  return useQuery({
    queryKey: schemaKeys.stats(name),
    queryFn: () => SchemaApi.getSchemaStats(name),
    enabled: !!name,
    staleTime: 2 * 60 * 1000, // 2 minutes (stats change more frequently)
  });
}

// ============================================
// MUTATION HOOKS (Data Modifying)
// ============================================

/**
 * Create a new schema with optimistic updates
 */
export function useCreateSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSchemaData) => SchemaApi.createSchema(data),
    
    // Optimistic update - update UI immediately
    onMutate: async (newSchema) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: schemaKeys.lists() });

      // Snapshot the previous value
      const previousSchemas = queryClient.getQueryData<Schema[]>(schemaKeys.lists());

      // Optimistically update to the new value
      if (previousSchemas) {
        const optimisticSchema: Schema = {
          _id: `temp-${Date.now()}`,
          name: newSchema.name,
          displayName: newSchema.displayName,
          description: newSchema.description,
          jsonSchema: newSchema.jsonSchema,
          version: '1.0.0',
          isActive: true,
          relationships: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          collectionName: `dynamic_${newSchema.name}`,
          tenantId: 'current-tenant', // You might want to get this from auth context
          __v: 0,
        };
        
        queryClient.setQueryData<Schema[]>(schemaKeys.lists(), [
          ...previousSchemas,
          optimisticSchema,
        ]);
      }

      // Return a context object with the snapshotted value
      return { previousSchemas };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newSchema, context) => {
      if (context?.previousSchemas) {
        queryClient.setQueryData(schemaKeys.lists(), context.previousSchemas);
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: schemaKeys.lists() });
    },

    // Success callback
    onSuccess: (data) => {
      // Invalidate and refetch schemas list
      queryClient.invalidateQueries({ queryKey: schemaKeys.lists() });
      
      // Optionally invalidate specific schema if it exists
      if (data?.data?.name) {
        queryClient.invalidateQueries({ queryKey: schemaKeys.detail(data.data.name) });
      }
    },
  });
}

/**
 * Update an existing schema
 */
export function useUpdateSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: Partial<Schema> }) => 
      SchemaApi.updateSchema(name, data),
    
    onMutate: async ({ name, data }) => {
      await queryClient.cancelQueries({ queryKey: schemaKeys.detail(name) });
      
      const previousSchema = queryClient.getQueryData<Schema>(schemaKeys.detail(name));
      
      if (previousSchema) {
        queryClient.setQueryData<Schema>(schemaKeys.detail(name), {
          ...previousSchema,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousSchema };
    },

    onError: (err, { name }, context) => {
      if (context?.previousSchema) {
        queryClient.setQueryData(schemaKeys.detail(name), context.previousSchema);
      }
    },

    onSettled: (data, error, { name }) => {
      queryClient.invalidateQueries({ queryKey: schemaKeys.detail(name) });
      queryClient.invalidateQueries({ queryKey: schemaKeys.lists() });
    },
  });
}

/**
 * Delete a schema
 */
export function useDeleteSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => SchemaApi.deleteSchema(name),
    
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: schemaKeys.lists() });
      
      const previousSchemas = queryClient.getQueryData<Schema[]>(schemaKeys.lists());
      
      if (previousSchemas) {
        queryClient.setQueryData<Schema[]>(
          schemaKeys.lists(),
          previousSchemas.filter(schema => schema.name !== name)
        );
      }

      return { previousSchemas };
    },

    onError: (err, name, context) => {
      if (context?.previousSchemas) {
        queryClient.setQueryData(schemaKeys.lists(), context.previousSchemas);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: schemaKeys.lists() });
    },
  });
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Prefetch schemas for better performance
 */
export function usePrefetchSchemas() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: schemaKeys.lists(),
      queryFn: SchemaApi.getAllSchemas,
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Invalidate all schema-related queries
 */
export function useInvalidateSchemas() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: schemaKeys.all });
  };
}
