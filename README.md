# 🚀 Toolvio Frontend - Enhanced Dynamic API System

A modern React Native application with **automatic backend endpoint discovery**, **typed API client generation**, and **advanced React Query integration** for optimal performance and developer experience.

## ✨ Key Features

### 🔍 **Dynamic API Discovery**
- **Automatic endpoint discovery** from OpenAPI/Swagger documentation
- **Zero hardcoded endpoints** - all APIs are discovered dynamically
- **Type-safe API calls** with full TypeScript support
- **Real-time endpoint documentation** and status monitoring

### ⚡ **React Query Integration**
- **Smart caching** with configurable stale time and garbage collection
- **Optimistic updates** for instant UI feedback
- **Automatic retries** with exponential backoff
- **Background refetching** for always-fresh data
- **Error handling** with automatic recovery

### 🎯 **Advanced Features**
- **Authentication** with JWT token management
- **Schema management** with dynamic form generation
- **Data management** with CRUD operations
- **Audit trails** and system monitoring
- **Multi-tenant support** with role-based permissions

---

## 🏗️ Architecture Overview

```
Toolvio-Frontend/
├── 📱 app/                          # Expo Router pages
│   ├── _layout.tsx                  # Root layout with QueryProvider
│   ├── index.tsx                    # Home/Dashboard
│   ├── login.tsx                    # Authentication
│   ├── menu.tsx                     # Navigation menu
│   ├── schema-management.tsx        # Schema listing
│   ├── schema-generator.tsx         # Schema creation
│   ├── schema-detail.tsx            # Schema details & data
│   ├── data-management.tsx          # Data operations
│   ├── audit-trail.tsx              # Audit logs
│   ├── queue-monitoring.tsx         # Queue status
│   ├── system-health.tsx            # System monitoring
│   └── tenant-management.tsx        # Tenant administration
├── 🔧 src/
│   ├── hooks/                       # Custom React Query hooks
│   │   ├── useSchemas.ts            # Schema operations
│   │   └── useDynamicApi.ts         # Dynamic API hooks
│   ├── providers/                   # Context providers
│   │   └── QueryProvider.tsx        # React Query setup
│   ├── components/                  # Reusable components
│   │   ├── DynamicApiExample.tsx    # API discovery demo
│   │   ├── SchemaGeneratorWithDynamicApi.tsx
│   │   └── SchemaGeneratorWithReactQuery.tsx
│   ├── utils/                       # Utility functions
│   │   ├── api.ts                   # Legacy API client
│   │   ├── swaggerClient.ts         # Dynamic API client
│   │   └── enhancedApi.ts           # Enhanced API interface
│   └── types/                       # TypeScript definitions
└── 📚 Documentation/
    ├── DYNAMIC_API_GUIDE.md         # Dynamic API guide
    └── REACT_QUERY_EXAMPLES.md      # React Query examples
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator
- Backend running on `http://localhost:3000`

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Toolvio-Frontend

# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

---

## 🔧 Dynamic API System

### **How It Works**

The frontend automatically discovers all backend endpoints by reading the OpenAPI specification:

```typescript
// 1. Loads Swagger/OpenAPI spec from backend
const spec = await fetchSwaggerSpec('http://localhost:3000/openapi.yaml');

// 2. Dynamically generates API client
const apiClient = createDynamicClient(spec);

// 3. Creates typed hooks for each endpoint
const { endpoints, isInitialized } = useDynamicApi();
```

### **Example Usage**

```typescript
import { useAuth, useSchemas, useDynamicData } from '../hooks/useDynamicApi';

function MyComponent() {
  // Auto-generated hooks from Swagger spec
  const auth = useAuth();
  const schemas = useSchemas();
  const dynamicData = useDynamicData();

  // Type-safe API calls
  const handleLogin = async () => {
    await auth.login.mutateAsync({
      params: {},
      body: { identifier: 'admin', password: 'admin123', tenantId: 'test-tenant' }
    });
  };

  const handleCreateSchema = async () => {
    await schemas.createSchema.mutateAsync({
      params: {},
      body: { name: 'product', displayName: 'Product', description: 'Product schema' }
    });
  };

  return (
    <View>
      <Button onPress={handleLogin} title="Login" />
      <Button onPress={handleCreateSchema} title="Create Schema" />
    </View>
  );
}
```

---

## ⚡ React Query Integration

### **Configuration**

```typescript
// QueryProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // Cache for 5 minutes
      gcTime: 10 * 60 * 1000,          // Keep unused data for 10 minutes
      retry: 3,                         // Retry failed requests 3 times
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,      // Don't refetch on window focus
      refetchInterval: 30 * 1000,       // Background refetch every 30 seconds
    },
    mutations: {
      retry: 1,                         // Retry mutations once
    },
  },
});
```

### **Custom Hooks**

```typescript
// useSchemas.ts
export function useSchemas() {
  return useQuery({
    queryKey: schemaKeys.all,
    queryFn: SchemaApi.getAllSchemas,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSchema() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: SchemaApi.createSchema,
    onSuccess: (newSchema) => {
      // Optimistic update
      queryClient.setQueryData(schemaKeys.all, (old) => [...(old || []), newSchema]);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: schemaKeys.all });
    },
    onError: (error) => {
      console.error('Failed to create schema:', error);
    },
  });
}
```

---

## 📱 Core Pages

### **🏠 Dashboard (index.tsx)**
- System overview and statistics
- Quick access to main features
- Real-time status indicators

### **🔐 Authentication (login.tsx, signup.tsx)**
- JWT-based authentication
- Secure token storage with Expo SecureStore
- Role-based access control (admin, customer, employee)

### **📋 Schema Management**
- **schema-management.tsx**: List and search schemas
- **schema-generator.tsx**: Create schemas via JSON or form builder
- **schema-detail.tsx**: View schema details, manage data entries

### **💾 Data Management (data-management.tsx)**
- CRUD operations on dynamic data
- Bulk operations and data export
- Real-time data synchronization

### **📊 System Monitoring**
- **audit-trail.tsx**: Audit logs and change tracking
- **queue-monitoring.tsx**: Background job monitoring
- **system-health.tsx**: System performance metrics

---

## 🎨 UI Components

### **Dynamic API Example Component**
```typescript
import { DynamicApiExample } from '../components/DynamicApiExample';

// Shows all discovered endpoints and allows testing
<DynamicApiExample />
```

**Features:**
- 🔍 Endpoint discovery status
- 📚 Documentation viewer
- 🧪 Interactive API testing
- 📊 Real-time status monitoring

### **Enhanced Schema Generator**
```typescript
import { SchemaGeneratorWithDynamicApi } from '../components/SchemaGeneratorWithDynamicApi';

// Production-ready schema generator with dynamic API
<SchemaGeneratorWithDynamicApi />
```

**Features:**
- 📝 JSON editor with syntax highlighting
- 🏗️ Visual form builder
- ⚡ Optimistic updates
- 🎯 Type-safe API calls

---

## 🔧 Configuration

### **Environment Variables**

Create a `.env` file:

```env
# Backend Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_API_TIMEOUT=30000

# Development
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_ENABLE_LOGGING=true
```

### **API Configuration**

```typescript
// src/utils/api.ts
const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};
```

---

## 🧪 Testing

### **Component Testing**

```typescript
// Example test for DynamicApiExample
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DynamicApiExample } from '../components/DynamicApiExample';

test('should display API discovery status', async () => {
  const { getByText } = render(<DynamicApiExample />);
  
  await waitFor(() => {
    expect(getByText(/endpoints discovered/)).toBeTruthy();
  });
});
```

### **API Testing**

```typescript
// Example API test
test('should create schema successfully', async () => {
  const schemaData = {
    name: 'test-schema',
    displayName: 'Test Schema',
    description: 'Test description',
    jsonSchema: { type: 'object', properties: {} }
  };
  
  const result = await SchemaApi.createSchema(schemaData);
  expect(result.success).toBe(true);
});
```

---

## 📊 Performance Features

### **Caching Strategy**
- **Query Caching**: 5-minute stale time for API responses
- **Garbage Collection**: Automatic cleanup after 10 minutes
- **Background Updates**: Periodic refetching for fresh data

### **Optimistic Updates**
- **Instant UI Feedback**: UI updates immediately on user actions
- **Automatic Rollback**: Reverts changes if API calls fail
- **Conflict Resolution**: Handles concurrent modifications gracefully

### **Error Handling**
- **Automatic Retries**: Exponential backoff for failed requests
- **User-Friendly Messages**: Clear error messages for users
- **Fallback Strategies**: Graceful degradation when services are unavailable

---

## 🔐 Security Features

### **Authentication**
- **JWT Tokens**: Secure token-based authentication
- **Secure Storage**: Tokens stored using Expo SecureStore
- **Automatic Refresh**: Token renewal before expiration

### **Authorization**
- **Role-Based Access**: Admin, customer, employee roles
- **Permission Checks**: Granular permission validation
- **Multi-Tenant Support**: Tenant isolation and security

---

## 🚀 Deployment

### **Development Build**
```bash
# Install Expo CLI
npm install -g @expo/cli

# Start development server
expo start

# Run on specific platform
expo start --ios
expo start --android
```

### **Production Build**
```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Build for web
expo build:web
```

---

## 🛠️ Development Tools

### **Debugging**
- **React Query DevTools**: Available in development (web only)
- **Console Logging**: Comprehensive logging for React Native
- **Flipper Integration**: Advanced debugging with Flipper

### **Code Quality**
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks

---

## 📚 Additional Resources

### **Documentation**
- [Dynamic API Guide](./DYNAMIC_API_GUIDE.md) - Complete guide to the dynamic API system
- [React Query Examples](./REACT_QUERY_EXAMPLES.md) - Usage examples and patterns
- [API Reference](./API_REFERENCE.md) - Complete API documentation

### **Examples**
- [DynamicApiExample.tsx](./src/components/DynamicApiExample.tsx) - API discovery demo
- [SchemaGeneratorWithDynamicApi.tsx](./src/components/SchemaGeneratorWithDynamicApi.tsx) - Enhanced schema generator
- [SchemaGeneratorWithReactQuery.tsx](./src/components/SchemaGeneratorWithReactQuery.tsx) - React Query patterns

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for new features
- Ensure all linting checks pass

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### **Common Issues**

**Q: React Query DevTools not working?**
A: DevTools are web-only. Use console logging or Flipper for React Native debugging.

**Q: Dynamic API not discovering endpoints?**
A: Ensure the backend is running and the OpenAPI spec is accessible at `/openapi.yaml`.

**Q: Authentication failing?**
A: Check that JWT tokens are being stored correctly and backend authentication is working.

### **Getting Help**
- 📧 Email: support@toolvio.com
- 💬 Discord: [Join our community](https://discord.gg/toolvio)
- 📖 Documentation: [Full docs](https://docs.toolvio.com)
- 🐛 Issues: [GitHub Issues](https://github.com/toolvio/frontend/issues)

---

## 🎉 Acknowledgments

- **React Query** for powerful data fetching and caching
- **Expo** for seamless React Native development
- **TypeScript** for type safety and developer experience
- **OpenAPI/Swagger** for API documentation and discovery

---

**Built with ❤️ by the Toolvio Team**

---

## 🎉 Latest Updates

- ✅ **Repository successfully initialized** and pushed to GitHub
- ✅ **Git configuration** set up with username: `zarnabali`
- ✅ **All enhanced features** committed and ready for development
- ✅ **Dynamic API Discovery** system fully operational
- ✅ **React Query integration** with caching and optimistic updates

*Last updated: $(date)*