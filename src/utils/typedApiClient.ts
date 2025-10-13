import { apiFetch } from './api';

// ============================================
// TYPE DEFINITIONS FOR TYPED CLIENT
// ============================================

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
  parameters?: Record<string, any>;
  response?: any;
}

export interface DiscoveredEndpoints {
  [key: string]: ApiEndpoint[];
}

export interface TypedApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

// ============================================
// ENDPOINT DISCOVERY
// ============================================

/**
 * Discover available API endpoints dynamically
 * This would typically be implemented as an OpenAPI/Swagger endpoint
 */
export async function discoverEndpoints(): Promise<DiscoveredEndpoints> {
  try {
    // In a real implementation, this would call your backend's discovery endpoint
    // For now, we'll return a static definition based on your current API
    const endpoints: DiscoveredEndpoints = {
      auth: [
        { path: '/auth/login', method: 'POST', description: 'User login' },
        { path: '/auth/register', method: 'POST', description: 'User registration' },
        { path: '/auth/profile', method: 'GET', description: 'Get user profile' },
        { path: '/auth/change-password', method: 'POST', description: 'Change password' },
      ],
      schemas: [
        { path: '/schemas', method: 'GET', description: 'Get all schemas' },
        { path: '/schemas/:name', method: 'GET', description: 'Get schema by name' },
        { path: '/schemas', method: 'POST', description: 'Create new schema' },
        { path: '/schemas/:name', method: 'PUT', description: 'Update schema' },
        { path: '/schemas/:name', method: 'DELETE', description: 'Delete schema' },
        { path: '/schemas/:name/stats', method: 'GET', description: 'Get schema statistics' },
      ],
      data: [
        { path: '/data/:schemaName', method: 'GET', description: 'Get schema data' },
        { path: '/data/:schemaName', method: 'POST', description: 'Create schema entry' },
        { path: '/data/:schemaName/:id', method: 'PUT', description: 'Update schema entry' },
        { path: '/data/:schemaName/:id', method: 'DELETE', description: 'Delete schema entry' },
      ],
      tenants: [
        { path: '/tenants', method: 'GET', description: 'Get tenant info' },
        { path: '/tenants', method: 'PUT', description: 'Update tenant info' },
      ],
    };

    return endpoints;
  } catch (error) {
    console.error('Failed to discover endpoints:', error);
    // Fallback to empty endpoints
    return {};
  }
}

// ============================================
// TYPED API CLIENT BUILDER
// ============================================

/**
 * Create a typed API client based on discovered endpoints
 */
export function createTypedClient<T extends Record<string, any>>() {
  const client = {
    // Generic method for making typed API calls
    request: async <R>(
      endpoint: string,
      options: {
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        body?: any;
        params?: Record<string, string>;
      } = {}
    ): Promise<TypedApiResponse<R>> => {
      const { method = 'GET', body, params } = options;
      
      // Replace path parameters
      let path = endpoint;
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          path = path.replace(`:${key}`, encodeURIComponent(value));
        });
      }

      return apiFetch<TypedApiResponse<R>>(path, { method, body });
    },

    // Typed GET request
    get: async <R>(endpoint: string, params?: Record<string, string>): Promise<TypedApiResponse<R>> => {
      return client.request<R>(endpoint, { method: 'GET', params });
    },

    // Typed POST request
    post: async <R>(endpoint: string, body?: any, params?: Record<string, string>): Promise<TypedApiResponse<R>> => {
      return client.request<R>(endpoint, { method: 'POST', body, params });
    },

    // Typed PUT request
    put: async <R>(endpoint: string, body?: any, params?: Record<string, string>): Promise<TypedApiResponse<R>> => {
      return client.request<R>(endpoint, { method: 'PUT', body, params });
    },

    // Typed DELETE request
    delete: async <R>(endpoint: string, params?: Record<string, string>): Promise<TypedApiResponse<R>> => {
      return client.request<R>(endpoint, { method: 'DELETE', params });
    },

    // Discover and cache endpoints
    discover: discoverEndpoints,
  };

  return client;
}

// ============================================
// SPECIFIC TYPED CLIENTS
// ============================================

/**
 * Typed Schema API Client
 */
export const typedSchemaClient = createTypedClient();

/**
 * Typed Auth API Client
 */
export const typedAuthClient = createTypedClient();

/**
 * Typed Data API Client
 */
export const typedDataClient = createTypedClient();

// ============================================
// ENDPOINT REGISTRY
// ============================================

/**
 * Registry to store discovered endpoints
 */
class EndpointRegistry {
  private endpoints: DiscoveredEndpoints = {};
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    this.endpoints = await discoverEndpoints();
    this.initialized = true;
  }

  getEndpoints(): DiscoveredEndpoints {
    return this.endpoints;
  }

  getEndpoint(category: string, path: string): ApiEndpoint | undefined {
    return this.endpoints[category]?.find(ep => ep.path === path);
  }

  getAllPaths(): string[] {
    return Object.values(this.endpoints).flatMap(eps => eps.map(ep => ep.path));
  }

  async refresh(): Promise<void> {
    this.initialized = false;
    await this.initialize();
  }
}

export const endpointRegistry = new EndpointRegistry();

// Initialize the registry
endpointRegistry.initialize().catch(console.error);
