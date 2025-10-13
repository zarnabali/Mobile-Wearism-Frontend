import Constants from 'expo-constants';

// Prefer explicit environment variable for stability across devices
// 1) EXPO_PUBLIC_API_BASE (from your environment)
// 2) app.json -> expo.extra.apiBase
// 3) fallback to localhost:5000
const explicitEnv = (process.env.EXPO_PUBLIC_API_BASE || '').trim();
const extraApiBase = (((Constants.expoConfig as any)?.extra?.apiBase as string | undefined) || '').trim();

function normalizeBase(raw: string): string {
  let base = (raw || '').trim();
  // Remove accidental characters like '>' and quotes
  base = base.replace(/["'`<>\s]+$/g, '');
  // Fix common scheme typos like http// or https// (missing colon)
  base = base.replace(/^http\/\//i, 'http://').replace(/^https\/\//i, 'https://');
  // Prepend http if missing scheme
  if (base && !/^https?:\/\//i.test(base)) {
    base = `http://${base}`;
  }
  // Remove trailing slash
  base = base.replace(/\/$/, '');
  try {
    // Validate URL
    // eslint-disable-next-line no-new
    new URL(base || '');
    return base;
  } catch {
    return 'http://localhost:3000';
  }
}

export const API_BASE_URL = normalizeBase(explicitEnv || extraApiBase || 'http://localhost:3000');


type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  token?: string;
  headers?: Record<string, string>;
};

export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, token, headers = {} } = opts;
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    const message = (json && (json.message || json.error)) || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  
  return json as T;
}

export type LoginResponse = {
  success: boolean;
  message?: string;
  data: {
    user: {
      _id: string;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      tenantId?: string;
    };
    token: string;
  };
};

export type RegisterResponse = LoginResponse;

export type UserProfile = {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  permissions: Record<string, any>;
  lastLogin?: string;
  createdAt: string;
};

export type ProfileResponse = {
  success: boolean;
  message: string;
  data: UserProfile;
  timestamp: string;
};

export type ProfileUpdateData = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  success: boolean;
  message: string;
  data: null;
  timestamp: string;
};

export type TenantInfo = {
  _id: string;
  tenantId: string;
  name: string;
  displayName: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  settings: {
    maxUsers: number;
    maxSchemas: number;
    maxStorageGB: number;
    features: {
      auditTrail: boolean;
      changeStreams: boolean;
      offlineSync: boolean;
      apiRateLimit: boolean;
    };
  };
  subscriptionPlan: string;
  subscriptionStatus: string;
  isActive: boolean;
  isTrial: boolean;
  usage: {
    userCount: number;
    schemaCount: number;
    storageUsedGB: number;
    apiCallsThisMonth: number;
    lastUsageUpdate: string;
  };
  createdAt: string;
};

export type TenantResponse = {
  success: boolean;
  message: string;
  data: TenantInfo;
  timestamp: string;
};

export type TenantStatsResponse = {
  success: boolean;
  message: string;
  data: {
    tenantId: string;
    name: string;
    displayName: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
    isActive: boolean;
    usage: {
      userCount: number;
      schemaCount: number;
      storageUsedGB: number;
      apiCallsThisMonth: number;
    };
    limits: {
      maxUsers: number;
      maxSchemas: number;
      maxStorageGB: number;
    };
    availability: {
      canCreateUser: boolean;
      canCreateSchema: boolean;
      hasStorageAvailable: boolean;
    };
    features: Record<string, boolean>;
  };
  timestamp: string;
};

// Helper function to get auth token from secure store
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const { getItemAsync } = await import('expo-secure-store');
    return await getItemAsync('auth_token');
  } catch {
    return null;
  }
};

// Helper function to get auth token and make authenticated requests
const authenticatedFetch = async <T>(path: string, opts: FetchOptions = {}): Promise<T> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  return apiFetch<T>(path, { ...opts, token });
};

export const AuthApi = {
  login: (identifier: string, password: string, tenantId?: string) =>
    apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: tenantId ? { identifier, password, tenantId } : { identifier, password },
    }),

  register: (payload: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'customer' | 'technician' | 'office';
    tenantId: string;
  }) => apiFetch<RegisterResponse>('/api/auth/register', { method: 'POST', body: payload }),

  getProfile: () => authenticatedFetch<ProfileResponse>('/api/auth/profile', { method: 'GET' }),

  updateProfile: (data: ProfileUpdateData) => 
    authenticatedFetch<ProfileResponse>('/api/auth/profile', { method: 'PUT', body: data }),

  changePassword: (data: ChangePasswordData) => 
    authenticatedFetch<ChangePasswordResponse>('/api/auth/change-password', { method: 'POST', body: data }),

  getTenantInfo: () => authenticatedFetch<TenantResponse>('/api/auth/tenant', { method: 'GET' }),
};

export const TenantApi = {
  getTenantStats: (tenantId: string) => 
    authenticatedFetch<TenantStatsResponse>(`/api/tenants/${tenantId}/stats`, { method: 'GET' }),
};

export type Schema = {
  _id: string;
  tenantId: string;
  name: string;
  displayName: string;
  description: string;
  jsonSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean;
  };
  version: string;
  isActive: boolean;
  relationships: any[];
  createdAt: string;
  updatedAt: string;
  collectionName: string;
  __v: number;
};

export type SchemasResponse = {
  success: boolean;
  message: string;
  data: Schema[];
  timestamp: string;
};

export type SchemaDetailResponse = {
  success: boolean;
  message: string;
  data: Schema;
  timestamp: string;
};

export type SchemaStats = {
  name: string;
  displayName: string;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  collectionName: string;
  tenantId: string;
};

export type SchemaStatsResponse = {
  success: boolean;
  message: string;
  data: SchemaStats;
  timestamp: string;
};

export type SchemaVersion = {
  _id: string;
  schemaName: string;
  version: string;
  jsonSchema: any;
  changes: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  createdBy: string;
  createdAt: string;
  isActive: boolean;
};

export type SchemaVersionsResponse = {
  success: boolean;
  message: string;
  data: SchemaVersion[];
  timestamp: string;
};

export type CreateSchemaData = {
  name: string;
  displayName: string;
  description: string;
  jsonSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean;
  };
};

export type CreateSchemaResponse = {
  success: boolean;
  message: string;
  data: Schema;
  timestamp: string;
};

export const SchemaApi = {
  getAllSchemas: () => authenticatedFetch<SchemasResponse>('/api/schemas', { method: 'GET' }),
  getSchemaByName: (schemaName: string) => authenticatedFetch<SchemaDetailResponse>(`/api/schemas/${schemaName}`, { method: 'GET' }),
  getSchemaStats: (schemaName: string) => authenticatedFetch<SchemaStatsResponse>(`/api/schemas/${schemaName}/stats`, { method: 'GET' }),
  getSchemaVersions: (schemaName: string) => authenticatedFetch<SchemaVersionsResponse>(`/api/schemas/${schemaName}/versions`, { method: 'GET' }),
  createSchema: (data: CreateSchemaData) => 
    authenticatedFetch<CreateSchemaResponse>('/api/schemas', { method: 'POST', body: data }),
  updateSchema: (schemaName: string, data: { displayName?: string; description?: string; jsonSchema?: any }) => 
    authenticatedFetch<SchemaDetailResponse>(`/api/schemas/${schemaName}`, { method: 'PUT', body: data }),
  deleteSchema: (schemaName: string) => 
    authenticatedFetch<{ success: boolean; message: string; data: null; timestamp: string }>(`/api/schemas/${schemaName}`, { method: 'DELETE' }),
};

export type SchemaRecord = {
  _id: string;
  _schemaName: string;
  [key: string]: any;
  createdAt: string;
  updatedAt: string;
};

export type SchemaRecordsResponse = {
  success: boolean;
  message: string;
  data: {
    records: SchemaRecord[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      limit: number;
    };
  };
  timestamp: string;
};

export type SingleRecordResponse = {
  success: boolean;
  message: string;
  data: SchemaRecord;
  timestamp: string;
};

export type CreateRecordResponse = {
  success: boolean;
  message: string;
  data: SchemaRecord;
  meta: {
    schemaName: string;
    recordId: string;
    createdAt: string;
    processingTime: string;
    auditLogged: boolean;
  };
  timestamp: string;
};

export const DynamicDataApi = {
  getRecords: (schemaName: string, page = 1, limit = 10, filter = {}) => 
    authenticatedFetch<SchemaRecordsResponse>(`/api/data/${schemaName}?page=${page}&limit=${limit}`, { method: 'GET' }),
  
  getRecordById: (schemaName: string, recordId: string) => 
    authenticatedFetch<SingleRecordResponse>(`/api/data/${schemaName}/${recordId}`, { method: 'GET' }),
  
  createRecord: (schemaName: string, data: Record<string, any>) => 
    authenticatedFetch<CreateRecordResponse>(`/api/data/${schemaName}`, { method: 'POST', body: data }),
  
  updateRecord: (schemaName: string, recordId: string, data: Record<string, any>) => 
    authenticatedFetch<SingleRecordResponse>(`/api/data/${schemaName}/${recordId}`, { method: 'PUT', body: data }),
  
  deleteRecord: (schemaName: string, recordId: string) => 
    authenticatedFetch<{ success: boolean; message: string; data: null; timestamp: string }>(`/api/data/${schemaName}/${recordId}`, { method: 'DELETE' }),
  
  getRecordCount: (schemaName: string) => 
    authenticatedFetch<{ success: boolean; message: string; data: { count: number }; timestamp: string }>(`/api/data/${schemaName}/count`, { method: 'GET' }),
};


