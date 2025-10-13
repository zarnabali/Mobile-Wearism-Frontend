import yaml from 'js-yaml';
import { API_BASE_URL, apiFetch } from './api';

// ============================================
// SWAGGER/OPENAPI TYPES
// ============================================

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{
    url: string;
    description: string;
    variables?: Record<string, any>;
  }>;
  paths: Record<string, {
    [method: string]: OpenAPIPath;
  }>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

export interface OpenAPIPath {
  tags?: string[];
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required?: boolean;
    schema: any;
    description?: string;
  }>;
  requestBody?: {
    required?: boolean;
    content: Record<string, any>;
  };
  responses: Record<string, {
    description: string;
    content?: Record<string, any>;
  }>;
  security?: Array<Record<string, string[]>>;
}

export interface DiscoveredEndpoint {
  path: string;
  method: string;
  tags: string[];
  summary: string;
  description: string;
  parameters: Array<{
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required: boolean;
    type: string;
    description: string;
  }>;
  requestBody?: {
    required: boolean;
    contentType: string;
    schema: any;
  };
  responses: Record<string, {
    description: string;
    contentType?: string;
    schema?: any;
  }>;
  security: string[];
}

// ============================================
// SWAGGER PARSER
// ============================================

export class SwaggerParser {
  private spec: OpenAPISpec | null = null;
  private endpoints: DiscoveredEndpoint[] = [];

  async loadFromFile(filePath: string): Promise<void> {
    try {
      // In a real implementation, you would fetch this from your backend
      // For now, we'll use the static YAML content
      const swaggerYaml = `
openapi: 3.1.0
info:
  title: Toolvio Backend API - RBAC & Dynamic Schema System
  version: 1.0.0
  description: Comprehensive API documentation for Toolvio Backend
servers:
  - url: http://localhost:3000
    description: Local server
paths:
  /api/auth/login:
    post:
      tags: [Authentication]
      summary: User login
      description: Authenticate user with username/email and password
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [identifier, password, tenantId]
              properties:
                identifier: { type: string, example: "admin" }
                password: { type: string, example: "admin123456" }
                tenantId: { type: string, example: "test-tenant" }
      responses:
        '200':
          description: Login successful
        '401':
          description: Authentication failed
  /api/auth/register:
    post:
      tags: [Authentication]
      summary: User registration
      description: Create a new user account
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [username, email, password, firstName, lastName, tenantId]
              properties:
                username: { type: string, example: "john.doe" }
                email: { type: string, format: email, example: "john.doe@example.com" }
                password: { type: string, minLength: 8, example: "securePassword123" }
                firstName: { type: string, example: "John" }
                lastName: { type: string, example: "Doe" }
                role: { type: string, enum: [admin, office, technician, customer], default: customer }
                tenantId: { type: string, example: "test-tenant" }
      responses:
        '201':
          description: User registered successfully
        '400':
          description: Invalid request data
  /api/auth/profile:
    get:
      tags: [Authentication]
      summary: Get user profile
      description: Retrieve current user's profile information
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Profile retrieved successfully
        '401':
          description: Authentication required
    put:
      tags: [Authentication]
      summary: Update user profile
      description: Update current user's profile information
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                firstName: { type: string }
                lastName: { type: string }
                email: { type: string, format: email }
      responses:
        '200':
          description: Profile updated successfully
  /api/auth/change-password:
    post:
      tags: [Authentication]
      summary: Change user password
      description: Change current user's password
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [currentPassword, newPassword]
              properties:
                currentPassword: { type: string }
                newPassword: { type: string, minLength: 8 }
      responses:
        '200':
          description: Password changed successfully
  /api/schemas:
    get:
      tags: [Schemas]
      summary: Get all schemas
      description: Retrieve all schemas (requires schema read permission)
      security:
        - BearerAuth: []
      parameters:
        - in: query
          name: active
          schema: { type: boolean }
          description: Only active schemas when true
      responses:
        '200':
          description: List of schemas
        '401':
          description: Authentication required
        '403':
          description: Insufficient permissions
    post:
      tags: [Schemas]
      summary: Create new schema
      description: Create a new schema (requires schema write permission)
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, displayName, jsonSchema]
              properties:
                name: { type: string }
                displayName: { type: string }
                description: { type: string }
                jsonSchema: { type: object }
      responses:
        '201':
          description: Schema created
        '401':
          description: Authentication required
  /api/schemas/{name}:
    get:
      tags: [Schemas]
      summary: Get schema by name
      description: Retrieve a specific schema
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: name
          required: true
          schema: { type: string }
          description: Schema name
      responses:
        '200':
          description: Schema details
        '404':
          description: Schema not found
    put:
      tags: [Schemas]
      summary: Update schema
      description: Update a schema
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: name
          required: true
          schema: { type: string }
          description: Schema name
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                displayName: { type: string }
                description: { type: string }
                jsonSchema: { type: object }
      responses:
        '200':
          description: Updated schema
    delete:
      tags: [Schemas]
      summary: Delete schema
      description: Delete a schema
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: name
          required: true
          schema: { type: string }
          description: Schema name
      responses:
        '200':
          description: Schema deleted
  /api/schemas/{name}/stats:
    get:
      tags: [Schemas]
      summary: Get schema stats
      description: Get statistics for a schema
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: name
          required: true
          schema: { type: string }
          description: Schema name
      responses:
        '200':
          description: Schema statistics
  /api/data/{schemaName}:
    get:
      tags: [Dynamic]
      summary: Get records for schema
      description: Retrieve records for a schema
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: schemaName
          required: true
          schema: { type: string }
          description: Schema name
        - in: query
          name: page
          schema: { type: integer, default: 1 }
        - in: query
          name: limit
          schema: { type: integer, default: 10 }
      responses:
        '200':
          description: Paginated records
    post:
      tags: [Dynamic]
      summary: Create record
      description: Create a new record
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: schemaName
          required: true
          schema: { type: string }
          description: Schema name
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              additionalProperties: true
      responses:
        '201':
          description: Record created
  /api/data/{schemaName}/{recordId}:
    get:
      tags: [Dynamic]
      summary: Get record by ID
      description: Retrieve a specific record
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: schemaName
          required: true
          schema: { type: string }
        - in: path
          name: recordId
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Record details
    put:
      tags: [Dynamic]
      summary: Update record by ID
      description: Update a record
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: schemaName
          required: true
          schema: { type: string }
        - in: path
          name: recordId
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              additionalProperties: true
      responses:
        '200':
          description: Record updated
    delete:
      tags: [Dynamic]
      summary: Delete record by ID
      description: Delete a record
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: schemaName
          required: true
          schema: { type: string }
        - in: path
          name: recordId
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Record deleted
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      `;

      this.spec = yaml.load(swaggerYaml) as OpenAPISpec;
      this.parseEndpoints();
    } catch (error) {
      console.error('Failed to load Swagger spec:', error);
      throw new Error('Failed to load API specification');
    }
  }

  private parseEndpoints(): void {
    if (!this.spec) return;

    this.endpoints = [];

    Object.entries(this.spec.paths).forEach(([path, pathObj]) => {
      Object.entries(pathObj).forEach(([method, pathConfig]) => {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          const endpoint: DiscoveredEndpoint = {
            path,
            method: method.toUpperCase(),
            tags: pathConfig.tags || [],
            summary: pathConfig.summary || '',
            description: pathConfig.description || '',
            parameters: (pathConfig.parameters || []).map(param => ({
              name: param.name,
              in: param.in,
              required: param.required || false,
              type: param.schema?.type || 'string',
              description: param.description || '',
            })),
            requestBody: pathConfig.requestBody ? {
              required: pathConfig.requestBody.required || false,
              contentType: Object.keys(pathConfig.requestBody.content)[0] || 'application/json',
              schema: Object.values(pathConfig.requestBody.content)[0]?.schema,
            } : undefined,
            responses: Object.fromEntries(
              Object.entries(pathConfig.responses).map(([code, response]) => [
                code,
                {
                  description: response.description,
                  contentType: response.content ? Object.keys(response.content)[0] : undefined,
                  schema: response.content ? Object.values(response.content)[0]?.schema : undefined,
                }
              ])
            ),
            security: (pathConfig.security || []).flatMap(s => Object.keys(s)),
          };

          this.endpoints.push(endpoint);
        }
      });
    });
  }

  getEndpoints(): DiscoveredEndpoint[] {
    return this.endpoints;
  }

  getEndpointsByTag(tag: string): DiscoveredEndpoint[] {
    return this.endpoints.filter(endpoint => endpoint.tags.includes(tag));
  }

  getEndpoint(path: string, method: string): DiscoveredEndpoint | undefined {
    return this.endpoints.find(
      endpoint => endpoint.path === path && endpoint.method.toUpperCase() === method.toUpperCase()
    );
  }

  getSpec(): OpenAPISpec | null {
    return this.spec;
  }
}

// ============================================
// TYPED API CLIENT GENERATOR
// ============================================

export class TypedApiClient {
  private parser: SwaggerParser;
  private endpoints: DiscoveredEndpoint[] = [];

  constructor() {
    this.parser = new SwaggerParser();
  }

  async initialize(): Promise<void> {
    await this.parser.loadFromFile('openapi.yaml');
    this.endpoints = this.parser.getEndpoints();
  }

  // Generate typed API methods dynamically
  generateApiMethods(): Record<string, any> {
    const methods: Record<string, any> = {};

    // Group endpoints by tag
    const endpointsByTag = this.endpoints.reduce((acc, endpoint) => {
      endpoint.tags.forEach(tag => {
        if (!acc[tag]) acc[tag] = [];
        acc[tag].push(endpoint);
      });
      return acc;
    }, {} as Record<string, DiscoveredEndpoint[]>);

    // Generate methods for each tag
    Object.entries(endpointsByTag).forEach(([tag, tagEndpoints]) => {
      methods[tag.toLowerCase()] = this.generateTagMethods(tagEndpoints);
    });

    return methods;
  }

  private generateTagMethods(endpoints: DiscoveredEndpoint[]): Record<string, any> {
    const methods: Record<string, any> = {};

    endpoints.forEach(endpoint => {
      const methodName = this.generateMethodName(endpoint);
      methods[methodName] = this.createApiMethod(endpoint);
    });

    return methods;
  }

  private generateMethodName(endpoint: DiscoveredEndpoint): string {
    // Convert path to method name
    // /api/auth/login POST -> login
    // /api/schemas/{name} GET -> getSchema
    // /api/data/{schemaName} POST -> createRecord

    const pathParts = endpoint.path.split('/').filter(Boolean);
    const resource = pathParts[pathParts.length - 1];
    
    let methodName = '';
    
    switch (endpoint.method.toLowerCase()) {
      case 'get':
        if (pathParts.includes('{name}') || pathParts.includes('{recordId}')) {
          methodName = `get${this.capitalize(resource)}`;
        } else if (pathParts.includes('stats')) {
          methodName = `get${this.capitalize(pathParts[pathParts.length - 2])}Stats`;
        } else {
          methodName = `get${this.capitalize(resource)}`;
        }
        break;
      case 'post':
        if (resource === 'login') methodName = 'login';
        else if (resource === 'register') methodName = 'register';
        else methodName = `create${this.capitalize(resource)}`;
        break;
      case 'put':
        methodName = `update${this.capitalize(resource)}`;
        break;
      case 'delete':
        methodName = `delete${this.capitalize(resource)}`;
        break;
      default:
        methodName = resource;
    }

    return methodName;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private createApiMethod(endpoint: DiscoveredEndpoint) {
    return async (params: any = {}, body: any = null): Promise<any> => {
      let url = endpoint.path;
      
      // Replace path parameters
      endpoint.parameters
        .filter(param => param.in === 'path')
        .forEach(param => {
          if (params[param.name]) {
            url = url.replace(`{${param.name}}`, encodeURIComponent(params[param.name]));
          }
        });

      // Add query parameters
      const queryParams = endpoint.parameters
        .filter(param => param.in === 'query' && params[param.name] !== undefined)
        .map(param => `${param.name}=${encodeURIComponent(params[param.name])}`)
        .join('&');

      if (queryParams) {
        url += `?${queryParams}`;
      }

      // Make the API call
      return apiFetch(url, {
        method: endpoint.method as any,
        body: body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method) ? body : undefined,
      });
    };
  }

  // Get all available endpoints
  getAvailableEndpoints(): string[] {
    return this.endpoints.map(endpoint => `${endpoint.method} ${endpoint.path}`);
  }

  // Get endpoints by tag
  getEndpointsByTag(tag: string): DiscoveredEndpoint[] {
    return this.endpoints.filter(endpoint => endpoint.tags.includes(tag));
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let apiClient: TypedApiClient | null = null;

export async function getTypedApiClient(): Promise<TypedApiClient> {
  if (!apiClient) {
    apiClient = new TypedApiClient();
    await apiClient.initialize();
  }
  return apiClient;
}

// Export the parser for direct access if needed
export const swaggerParser = new SwaggerParser();
