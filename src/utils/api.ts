import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Get the configured backend URL
const backendPort = process.env.EXPO_PUBLIC_BACKEND_PORT || '3000';
const explicitEnv = (process.env.EXPO_PUBLIC_API_BASE || '').trim();
const extraApiBase = (((Constants.expoConfig as any)?.extra?.apiBase as string | undefined) || '').trim();

// Store backend URL
export async function setBackendURL(url: string) {
  try {
    const urlObj = new URL(url);
    await SecureStore.setItemAsync('backend_ip', urlObj.hostname);
    await SecureStore.setItemAsync('backend_port', urlObj.port || '3000');
    console.log('✅ Backend URL stored:', url);
  } catch (error) {
    console.error('Failed to store backend URL:', error);
  }
}

function getBackendURL(): string {
  console.log('🔧 Loading API config:', { explicitEnv, extraApiBase, backendPort, Platform: Platform.OS });
  
  // Priority 1: Explicit environment variable (EXPO_PUBLIC_API_BASE from .env file)
  if (explicitEnv) {
    console.log('🔧 Using EXPO_PUBLIC_API_BASE from env:', explicitEnv);
    return explicitEnv;
  }
  
  // Priority 2: Extra config from app.json (fallback)
  if (extraApiBase) {
    console.log('🔧 Using app.json apiBase:', extraApiBase);
    return extraApiBase;
  }
  
  // Priority 3: Platform-specific detection (only if no config)
  if (Platform.OS === 'android') {
    // Android emulator uses special IP to access host machine
    const androidURL = `http://10.0.2.2:${backendPort}`;
    console.log('🔧 Using Android emulator IP:', androidURL);
    return androidURL;
  }
  
  // Platform fallbacks
  if (Platform.OS === 'web') {
    return `http://localhost:${backendPort}`;
  }
  
  // Fallback
  return `http://localhost:${backendPort}`;
}

function normalizeBase(raw: string): string {
  let base = (raw || '').trim();
  // Remove accidental characters
  base = base.replace(/["'`<>\s]+$/g, '');
  // Fix common typos
  base = base.replace(/^http\/\//i, 'http://').replace(/^https\/\//i, 'https://');
  // Prepend http if missing scheme
  if (base && !/^https?:\/\//i.test(base)) {
    base = `http://${base}`;
  }
  // Remove trailing slash
  base = base.replace(/\/$/, '');
  try {
    new URL(base || '');
    return base;
  } catch {
    // If normalization fails, just use what we have
    return base || getBackendURL();
  }
}

// Get the final API base URL - env variable has priority, then app.json
// BUT: Override with localhost if running on web (avoids firewall issues)
let configuredURL = explicitEnv || extraApiBase;

// For web platform, always use localhost to avoid firewall issues
if (Platform.OS === 'web') {
  console.log('🌐 Running on WEB - using localhost to avoid firewall');
  configuredURL = `http://localhost:${backendPort}`;
} else if (!configuredURL) {
  configuredURL = getBackendURL();
}

export const API_BASE_URL = normalizeBase(configuredURL || `http://localhost:${backendPort}`);

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);
console.log('🔧 Config check:', { explicitEnv, extraApiBase, backendPort });


type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  token?: string;
  headers?: Record<string, string>;
};

export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, token, headers = {} } = opts;
  
  // Validate API_BASE_URL is properly formatted
  if (!API_BASE_URL || typeof API_BASE_URL !== 'string') {
    console.error('❌ API_BASE_URL is invalid:', API_BASE_URL);
    throw new Error('API base URL is not configured. Check your .env file or app.json');
  }
  
  // Ensure URL is properly formatted
  const baseUrl = API_BASE_URL.trim();
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    console.error('❌ API_BASE_URL missing protocol:', baseUrl);
    throw new Error(`Invalid API base URL: ${baseUrl}. Must start with http:// or https://`);
  }
  
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  
  console.log(`🌐 API Request: ${method} ${url}`);
  console.log('📦 Request body:', body);
  console.log('🔧 API_BASE_URL:', API_BASE_URL);
  
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    console.log(`📡 Response status: ${res.status}`);
    
    let json;
    try {
      const text = await res.text();
      json = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('❌ Failed to parse response:', parseError);
      throw new Error(`Server returned invalid JSON. Status: ${res.status}`);
    }
    
    if (!res.ok) {
      const message = (json && (json.message || json.error)) || `Request failed: ${res.status}`;
      console.error(`❌ API Error: ${message}`);
      throw new Error(message);
    }
    
    console.log('✅ API Success');
    return json as T;
  } catch (error: any) {
    console.error('❌ Network Error:', error);
    
    // More helpful error messages
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Make sure:
1. Backend is running on port 3000
2. Backend is listening on 0.0.0.0 (not localhost)
3. Phone and computer are on same WiFi network
4. Firewall allows connections on port 3000`);
    }
    
    throw error;
  }
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
  login: (identifier: string, password: string, tenantId: string) =>
    apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { identifier, password, tenantId },
    }),

  loginSuperAdmin: (identifier: string, password: string) =>
    apiFetch<LoginResponse>('/api/auth/login-super-admin', {
      method: 'POST',
      body: { identifier, password },
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

export type WidgetPermissions = {
  email?: {
    sendAllowed?: boolean;
    requiresVerification?: boolean;
    logInAudit?: boolean;
  };
  phone?: {
    callAllowed?: boolean;
    smsAllowed?: boolean;
    whatsappAllowed?: boolean;
  };
  location?: {
    viewAllowed?: boolean;
    showCurrentLocation?: boolean;
    showDistance?: boolean;
  };
};

export type ViewConfig = {
  viewType?: 'object' | 'form' | 'list' | 'detail' | 'wizard';
  formLayout?: 'column' | 'row' | 'grid';
  sections?: Array<{
    title: string;
    description?: string;
    fields: string[];
  }>;
  actions?: Array<{
    id: string;
    label: string;
    type?: 'submit' | 'cancel' | 'primary' | 'secondary';
  }>;
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
  fieldMapping?: Record<string, string>;
  widgetPermissions?: WidgetPermissions;
  viewConfig?: ViewConfig;
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

export type ViewDefinition = {
  id: string;
  title: string;
  layout?: 'column' | 'row' | 'grid';
  roleVisibility?: string[];
  widgets: any[];
  options?: {
    showFieldHints?: boolean;
  };
  defaultEndpoint?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ViewResponse = {
  success: boolean;
  message: string;
  data: ViewDefinition;
  timestamp: string;
};

export type ViewsResponse = {
  success: boolean;
  message: string;
  data: ViewDefinition[];
  timestamp: string;
};

export const ViewApi = {
  getView: (viewId: string) => 
    authenticatedFetch<ViewResponse>(`/api/views/${viewId}`, { method: 'GET' }),
  
  getAllViews: () => 
    authenticatedFetch<ViewsResponse>('/api/views', { method: 'GET' }),
  
  createView: (viewData: ViewDefinition) => 
    authenticatedFetch<ViewResponse>('/api/views', { method: 'POST', body: viewData }),
  
  updateView: (viewId: string, viewData: Partial<ViewDefinition>) => 
    authenticatedFetch<ViewResponse>(`/api/views/${viewId}`, { method: 'PUT', body: viewData }),
  
  deleteView: (viewId: string) => 
    authenticatedFetch<{ success: boolean; message: string; data: null; timestamp: string }>(`/api/views/${viewId}`, { method: 'DELETE' }),
};


