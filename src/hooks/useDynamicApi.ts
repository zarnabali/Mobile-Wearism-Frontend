import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTypedApiClient, DiscoveredEndpoint } from '../utils/swaggerClient';
import { useState, useEffect } from 'react';

// ============================================
// DYNAMIC API DISCOVERY HOOK
// ============================================

/**
 * Hook to discover and use backend endpoints dynamically
 * Automatically generates typed API methods from Swagger docs
 */
export function useDynamicApi() {
  const [apiClient, setApiClient] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<DiscoveredEndpoint[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApi = async () => {
      try {
        const client = await getTypedApiClient();
        const generatedMethods = client.generateApiMethods();
        
        setApiClient(generatedMethods);
        setEndpoints(client.getAvailableEndpoints().map(endpointString => {
          const [method, path] = endpointString.split(' ');
          return { method, path } as DiscoveredEndpoint;
        }));
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize dynamic API client:', error);
      }
    };

    initializeApi();
  }, []);

  return {
    api: apiClient,
    endpoints,
    isInitialized,
    // Helper methods
    getEndpointsByTag: (tag: string) => endpoints.filter(ep => ep.tags?.includes(tag)),
    hasEndpoint: (path: string, method: string) => 
      endpoints.some(ep => ep.path === path && ep.method.toUpperCase() === method.toUpperCase()),
  };
}

// ============================================
// DYNAMIC QUERY HOOKS
// ============================================

/**
 * Generic hook for making dynamic API queries
 * Automatically handles caching, retries, and error handling
 */
export function useDynamicQuery<T = any>(
  endpoint: string,
  method: string = 'GET',
  params: any = {},
  options: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    retry?: number;
  } = {}
) {
  const { api, isInitialized } = useDynamicApi();

  return useQuery({
    queryKey: ['dynamic-api', endpoint, method, params],
    queryFn: async (): Promise<T> => {
      if (!api || !isInitialized) {
        throw new Error('API client not initialized');
      }

      // Find the appropriate method based on endpoint and method
      const methodName = findMethodName(endpoint, method, api);
      
      if (!methodName) {
        throw new Error(`No API method found for ${method} ${endpoint}`);
      }

      return api[methodName](params);
    },
    enabled: options.enabled !== false && isInitialized,
    staleTime: options.staleTime || 5 * 60 * 1000, // 5 minutes
    gcTime: options.cacheTime || 10 * 60 * 1000, // 10 minutes
    retry: options.retry || 3,
  });
}

/**
 * Generic hook for making dynamic API mutations
 * Automatically handles optimistic updates, retries, and error handling
 */
export function useDynamicMutation<T = any, TVariables = any>(
  endpoint: string,
  method: string = 'POST',
  options: {
    onSuccess?: (data: T, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    optimisticUpdate?: boolean;
    invalidateQueries?: string[];
  } = {}
) {
  const { api, isInitialized } = useDynamicApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables): Promise<T> => {
      if (!api || !isInitialized) {
        throw new Error('API client not initialized');
      }

      const methodName = findMethodName(endpoint, method, api);
      
      if (!methodName) {
        throw new Error(`No API method found for ${method} ${endpoint}`);
      }

      // Handle different variable structures
      const { params = {}, body = null } = variables as any;
      return api[methodName](params, body);
    },
    onMutate: options.optimisticUpdate ? async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['dynamic-api'] });

      // Snapshot previous values for rollback
      const previousData = queryClient.getQueryData(['dynamic-api', endpoint, method]);

      // Optimistically update cache if this is a GET endpoint mutation
      if (method === 'GET' && options.optimisticUpdate) {
        queryClient.setQueryData(['dynamic-api', endpoint, method], variables);
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousData && options.optimisticUpdate) {
        queryClient.setQueryData(['dynamic-api', endpoint, method], context.previousData);
      }
      
      options.onError?.(error, variables);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
      
      options.onSuccess?.(data, variables);
    },
  });
}

// ============================================
// SPECIFIC API HOOKS (Generated from Swagger)
// ============================================

/**
 * Authentication hooks
 */
export function useAuth() {
  const { api, isInitialized } = useDynamicApi();

  const login = useDynamicMutation('/api/auth/login', 'POST', {
    onSuccess: (data) => {
      // Store auth token
      console.log('Login successful:', data);
    },
  });

  const register = useDynamicMutation('/api/auth/register', 'POST');

  const getProfile = useDynamicQuery('/api/auth/profile', 'GET', {}, {
    enabled: isInitialized,
  });

  const updateProfile = useDynamicMutation('/api/auth/profile', 'PUT', {
    invalidateQueries: ['dynamic-api', '/api/auth/profile', 'GET'],
  });

  const changePassword = useDynamicMutation('/api/auth/change-password', 'POST');

  return {
    login,
    register,
    getProfile,
    updateProfile,
    changePassword,
    isInitialized,
  };
}

/**
 * Schema management hooks
 */
export function useSchemas() {
  const getAllSchemas = useDynamicQuery('/api/schemas', 'GET', {}, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getSchema = useDynamicQuery('/api/schemas/{name}', 'GET', {}, {
    enabled: false, // Only run when explicitly called
  });

  const createSchema = useDynamicMutation('/api/schemas', 'POST', {
    invalidateQueries: ['dynamic-api', '/api/schemas', 'GET'],
    optimisticUpdate: true,
  });

  const updateSchema = useDynamicMutation('/api/schemas/{name}', 'PUT', {
    invalidateQueries: ['dynamic-api', '/api/schemas', 'GET'],
    optimisticUpdate: true,
  });

  const deleteSchema = useDynamicMutation('/api/schemas/{name}', 'DELETE', {
    invalidateQueries: ['dynamic-api', '/api/schemas', 'GET'],
    optimisticUpdate: true,
  });

  const getSchemaStats = useDynamicQuery('/api/schemas/{name}/stats', 'GET', {}, {
    enabled: false, // Only run when explicitly called
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    getAllSchemas,
    getSchema,
    createSchema,
    updateSchema,
    deleteSchema,
    getSchemaStats,
  };
}

/**
 * Dynamic data management hooks
 */
export function useDynamicData() {
  const getRecords = useDynamicQuery('/api/data/{schemaName}', 'GET', {}, {
    enabled: false, // Only run when explicitly called
  });

  const getRecord = useDynamicQuery('/api/data/{schemaName}/{recordId}', 'GET', {}, {
    enabled: false, // Only run when explicitly called
  });

  const createRecord = useDynamicMutation('/api/data/{schemaName}', 'POST', {
    invalidateQueries: ['dynamic-api', '/api/data/{schemaName}', 'GET'],
    optimisticUpdate: true,
  });

  const updateRecord = useDynamicMutation('/api/data/{schemaName}/{recordId}', 'PUT', {
    invalidateQueries: ['dynamic-api', '/api/data/{schemaName}', 'GET'],
    optimisticUpdate: true,
  });

  const deleteRecord = useDynamicMutation('/api/data/{schemaName}/{recordId}', 'DELETE', {
    invalidateQueries: ['dynamic-api', '/api/data/{schemaName}', 'GET'],
    optimisticUpdate: true,
  });

  return {
    getRecords,
    getRecord,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Find the appropriate method name from the API client
 */
function findMethodName(endpoint: string, method: string, api: any): string | null {
  // This is a simplified mapping - in a real implementation,
  // you'd have more sophisticated endpoint-to-method mapping
  
  const pathParts = endpoint.split('/').filter(Boolean);
  const resource = pathParts[pathParts.length - 1];
  
  // Try to find a matching method based on common patterns
  const possibleMethods = [
    // Direct mapping
    resource,
    `${method.toLowerCase()}${resource.charAt(0).toUpperCase() + resource.slice(1)}`,
    // Common patterns
    ...(resource.includes('{') ? [] : [resource]),
    ...(pathParts.includes('auth') ? ['login', 'register'] : []),
    ...(pathParts.includes('schemas') ? ['getAllSchemas', 'createSchema'] : []),
    ...(pathParts.includes('data') ? ['getRecords', 'createRecord'] : []),
  ];

  for (const possibleMethod of possibleMethods) {
    if (api[possibleMethod]) {
      return possibleMethod;
    }
  }

  return null;
}

/**
 * Hook to get API documentation and available endpoints
 */
export function useApiDocumentation() {
  const { endpoints, isInitialized } = useDynamicApi();
  const [documentation, setDocumentation] = useState<any>(null);

  useEffect(() => {
    if (isInitialized && endpoints.length > 0) {
      // Group endpoints by tag for better organization
      const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
        const tags = endpoint.tags || ['Other'];
        tags.forEach(tag => {
          if (!acc[tag]) acc[tag] = [];
          acc[tag].push(endpoint);
        });
        return acc;
      }, {} as Record<string, DiscoveredEndpoint[]>);

      setDocumentation({
        totalEndpoints: endpoints.length,
        endpointsByTag: groupedEndpoints,
        allEndpoints: endpoints,
      });
    }
  }, [endpoints, isInitialized]);

  return {
    documentation,
    isInitialized,
    totalEndpoints: endpoints.length,
  };
}
