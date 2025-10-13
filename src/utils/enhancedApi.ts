import { getTypedApiClient } from './swaggerClient';
import { apiFetch } from './api';

// ============================================
// ENHANCED API CLIENT
// ============================================

/**
 * Enhanced API client that combines dynamic discovery with existing functionality
 * This maintains backward compatibility while adding dynamic endpoint discovery
 */
export class EnhancedApiClient {
  private dynamicClient: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      this.dynamicClient = await getTypedApiClient();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize enhanced API client:', error);
      // Fallback to basic functionality
    }
  }

  // ============================================
  // DYNAMIC API METHODS
  // ============================================

  /**
   * Get all available endpoints dynamically
   */
  getAvailableEndpoints(): string[] {
    if (!this.isInitialized || !this.dynamicClient) return [];
    return this.dynamicClient.getAvailableEndpoints();
  }

  /**
   * Get endpoints by tag (e.g., 'Authentication', 'Schemas', 'Dynamic')
   */
  getEndpointsByTag(tag: string): any[] {
    if (!this.isInitialized || !this.dynamicClient) return [];
    return this.dynamicClient.getEndpointsByTag(tag);
  }

  /**
   * Check if an endpoint exists
   */
  hasEndpoint(path: string, method: string): boolean {
    if (!this.isInitialized || !this.dynamicClient) return false;
    const endpoints = this.getAvailableEndpoints();
    return endpoints.some(endpoint => 
      endpoint.includes(method.toUpperCase()) && endpoint.includes(path)
    );
  }

  /**
   * Get API documentation
   */
  getApiDocumentation(): any {
    if (!this.isInitialized || !this.dynamicClient) return null;
    return {
      totalEndpoints: this.getAvailableEndpoints().length,
      endpointsByTag: {
        Authentication: this.getEndpointsByTag('Authentication'),
        Schemas: this.getEndpointsByTag('Schemas'),
        Dynamic: this.getEndpointsByTag('Dynamic'),
        System: this.getEndpointsByTag('System'),
        Audit: this.getEndpointsByTag('Audit'),
        Tenants: this.getEndpointsByTag('Tenants'),
      },
    };
  }

  // ============================================
  // TYPED API METHODS (Generated from Swagger)
  // ============================================

  /**
   * Authentication API methods
   */
  get auth() {
    if (!this.isInitialized) return null;
    
    return {
      login: (credentials: { identifier: string; password: string; tenantId: string }) =>
        this.makeApiCall('/api/auth/login', 'POST', {}, credentials),
      
      register: (userData: {
        username: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role?: string;
        tenantId: string;
      }) => this.makeApiCall('/api/auth/register', 'POST', {}, userData),
      
      getProfile: () => this.makeApiCall('/api/auth/profile', 'GET'),
      
      updateProfile: (data: { firstName?: string; lastName?: string; email?: string }) =>
        this.makeApiCall('/api/auth/profile', 'PUT', {}, data),
      
      changePassword: (data: { currentPassword: string; newPassword: string }) =>
        this.makeApiCall('/api/auth/change-password', 'POST', {}, data),
    };
  }

  /**
   * Schema API methods
   */
  get schemas() {
    if (!this.isInitialized) return null;
    
    return {
      getAll: (params: { active?: boolean } = {}) =>
        this.makeApiCall('/api/schemas', 'GET', params),
      
      getByName: (name: string) =>
        this.makeApiCall(`/api/schemas/${name}`, 'GET'),
      
      create: (data: {
        name: string;
        displayName: string;
        description?: string;
        jsonSchema: any;
      }) => this.makeApiCall('/api/schemas', 'POST', {}, data),
      
      update: (name: string, data: {
        displayName?: string;
        description?: string;
        jsonSchema?: any;
      }) => this.makeApiCall(`/api/schemas/${name}`, 'PUT', {}, data),
      
      delete: (name: string) =>
        this.makeApiCall(`/api/schemas/${name}`, 'DELETE'),
      
      getStats: (name: string) =>
        this.makeApiCall(`/api/schemas/${name}/stats`, 'GET'),
      
      validate: (jsonSchema: any) =>
        this.makeApiCall('/api/schemas/validate', 'POST', {}, { jsonSchema }),
    };
  }

  /**
   * Dynamic Data API methods
   */
  get data() {
    if (!this.isInitialized) return null;
    
    return {
      getRecords: (schemaName: string, params: {
        page?: number;
        limit?: number;
        sort?: string;
        includeAudit?: boolean;
      } = {}) => this.makeApiCall(`/api/data/${schemaName}`, 'GET', params),
      
      getRecord: (schemaName: string, recordId: string, params: {
        populate?: string;
      } = {}) => this.makeApiCall(`/api/data/${schemaName}/${recordId}`, 'GET', params),
      
      createRecord: (schemaName: string, data: any) =>
        this.makeApiCall(`/api/data/${schemaName}`, 'POST', {}, data),
      
      updateRecord: (schemaName: string, recordId: string, data: any) =>
        this.makeApiCall(`/api/data/${schemaName}/${recordId}`, 'PUT', {}, data),
      
      deleteRecord: (schemaName: string, recordId: string) =>
        this.makeApiCall(`/api/data/${schemaName}/${recordId}`, 'DELETE'),
      
      getCount: (schemaName: string) =>
        this.makeApiCall(`/api/data/${schemaName}/count`, 'GET'),
      
      search: (schemaName: string, params: {
        page?: number;
        limit?: number;
        sort?: string;
      } = {}) => this.makeApiCall(`/api/data/${schemaName}/search`, 'GET', params),
      
      bulkCreate: (schemaName: string, records: any[]) =>
        this.makeApiCall(`/api/data/${schemaName}/bulk`, 'POST', {}, records),
    };
  }

  /**
   * System API methods
   */
  get system() {
    if (!this.isInitialized) return null;
    
    return {
      getHealth: () => this.makeApiCall('/api/system/health', 'GET'),
      getInfo: () => this.makeApiCall('/api/system/info', 'GET'),
      getDatabaseStats: () => this.makeApiCall('/api/system/stats/database', 'GET'),
      getApiStats: () => this.makeApiCall('/api/system/stats/api', 'GET'),
      initialize: () => this.makeApiCall('/api/system/init', 'POST'),
      getLogs: () => this.makeApiCall('/api/system/logs', 'GET'),
    };
  }

  /**
   * Audit API methods
   */
  get audit() {
    if (!this.isInitialized) return null;
    
    return {
      getSchemaHistory: (schemaName: string, params: {
        page?: number;
        limit?: number;
      } = {}) => this.makeApiCall(`/api/audit/${schemaName}/history`, 'GET', params),
      
      getSchemaStats: (schemaName: string) =>
        this.makeApiCall(`/api/audit/${schemaName}/stats`, 'GET'),
      
      getRecordHistory: (schemaName: string, recordId: string, params: {
        page?: number;
        limit?: number;
      } = {}) => this.makeApiCall(`/api/audit/${schemaName}/${recordId}/history`, 'GET', params),
      
      revertRecord: (schemaName: string, recordId: string, version: number) =>
        this.makeApiCall(`/api/audit/${schemaName}/${recordId}/revert/${version}`, 'POST'),
    };
  }

  /**
   * Tenant API methods
   */
  get tenants() {
    if (!this.isInitialized) return null;
    
    return {
      getAll: (params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        plan?: string;
        sortBy?: string;
        sortOrder?: string;
      } = {}) => this.makeApiCall('/api/tenants', 'GET', params),
      
      getById: (tenantId: string) =>
        this.makeApiCall(`/api/tenants/${tenantId}`, 'GET'),
      
      create: (data: {
        tenantId: string;
        name: string;
        displayName: string;
        description?: string;
        contactEmail?: string;
        contactPhone?: string;
        settings?: any;
        subscriptionPlan?: string;
      }) => this.makeApiCall('/api/tenants', 'POST', {}, data),
      
      update: (tenantId: string, data: any) =>
        this.makeApiCall(`/api/tenants/${tenantId}`, 'PUT', {}, data),
      
      delete: (tenantId: string) =>
        this.makeApiCall(`/api/tenants/${tenantId}`, 'DELETE'),
      
      updateStatus: (tenantId: string, isActive: boolean) =>
        this.makeApiCall(`/api/tenants/${tenantId}/status`, 'PATCH', {}, { isActive }),
      
      getStats: (tenantId: string) =>
        this.makeApiCall(`/api/tenants/${tenantId}/stats`, 'GET'),
      
      getSummary: () => this.makeApiCall('/api/tenants/summary', 'GET'),
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Make an API call with automatic endpoint discovery
   */
  private async makeApiCall(
    path: string,
    method: string,
    params: any = {},
    body: any = null
  ): Promise<any> {
    // Check if endpoint exists dynamically
    if (this.isInitialized && !this.hasEndpoint(path, method)) {
      console.warn(`Endpoint ${method} ${path} not found in API specification`);
    }

    // Make the actual API call
    return apiFetch(path, {
      method: method as any,
      body,
      ...params,
    });
  }

  /**
   * Get initialization status
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let enhancedApiClient: EnhancedApiClient | null = null;

export async function getEnhancedApiClient(): Promise<EnhancedApiClient> {
  if (!enhancedApiClient) {
    enhancedApiClient = new EnhancedApiClient();
    await enhancedApiClient.initialize();
  }
  return enhancedApiClient;
}

// Export for direct access
export { EnhancedApiClient };
