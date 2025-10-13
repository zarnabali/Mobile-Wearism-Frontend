import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {
  useDynamicApi,
  useAuth,
  useSchemas,
  useDynamicData,
  useApiDocumentation,
} from '../hooks/useDynamicApi';

/**
 * Example component demonstrating dynamic API discovery and usage
 * This shows how the frontend automatically discovers and uses backend endpoints
 */
export function DynamicApiExample() {
  const [selectedSchema, setSelectedSchema] = useState('');
  const [testData, setTestData] = useState('{"name": "Test Item", "price": 99.99}');

  // ============================================
  // DYNAMIC API HOOKS
  // ============================================

  // Discover available endpoints
  const { api, endpoints, isInitialized } = useDynamicApi();

  // API documentation
  const { documentation, totalEndpoints } = useApiDocumentation();

  // Specific API hooks (automatically generated from Swagger)
  const auth = useAuth();
  const schemas = useSchemas();
  const dynamicData = useDynamicData();

  // ============================================
  // HANDLERS
  // ============================================

  const handleTestLogin = async () => {
    try {
      await auth.login.mutateAsync({
        params: {},
        body: {
          identifier: 'admin',
          password: 'admin123456',
          tenantId: 'test-tenant',
        },
      });
      Alert.alert('Success', 'Login test completed!');
    } catch (error) {
      Alert.alert('Error', `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFetchSchemas = async () => {
    try {
      const result = await schemas.getAllSchemas.refetch();
      Alert.alert('Success', `Found ${result.data?.length || 0} schemas!`);
    } catch (error) {
      Alert.alert('Error', `Failed to fetch schemas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCreateTestRecord = async () => {
    if (!selectedSchema) {
      Alert.alert('Error', 'Please select a schema first');
      return;
    }

    try {
      const data = JSON.parse(testData);
      await dynamicData.createRecord.mutateAsync({
        params: { schemaName: selectedSchema },
        body: data,
      });
      Alert.alert('Success', 'Record created successfully!');
    } catch (error) {
      Alert.alert('Error', `Failed to create record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFetchRecords = async () => {
    if (!selectedSchema) {
      Alert.alert('Error', 'Please select a schema first');
      return;
    }

    try {
      const result = await dynamicData.getRecords.refetch();
      Alert.alert('Success', `Found ${result.data?.length || 0} records!`);
    } catch (error) {
      Alert.alert('Error', `Failed to fetch records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Discovering API endpoints...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🚀 Dynamic API Discovery Demo</Text>

      {/* API Discovery Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📡 API Discovery Status</Text>
        <Text style={styles.statusText}>
          ✅ {totalEndpoints} endpoints discovered
        </Text>
        <Text style={styles.statusText}>
          🔗 API Client: {api ? 'Initialized' : 'Not Available'}
        </Text>
        <Text style={styles.statusText}>
          📚 Documentation: {documentation ? 'Loaded' : 'Loading...'}
        </Text>
      </View>

      {/* Discovered Endpoints */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Discovered Endpoints</Text>
        {documentation?.endpointsByTag && Object.entries(documentation.endpointsByTag).map(([tag, tagEndpoints]: [string, any]) => (
          <View key={tag} style={styles.endpointGroup}>
            <Text style={styles.tagTitle}>{tag} ({tagEndpoints.length})</Text>
            {tagEndpoints.slice(0, 3).map((endpoint: any, index: number) => (
              <Text key={index} style={styles.endpointText}>
                {endpoint.method} {endpoint.path}
              </Text>
            ))}
            {tagEndpoints.length > 3 && (
              <Text style={styles.moreText}>... and {tagEndpoints.length - 3} more</Text>
            )}
          </View>
        ))}
      </View>

      {/* Authentication Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Authentication Tests</Text>
        
        <TouchableOpacity
          style={[styles.button, auth.login.isPending && styles.buttonDisabled]}
          onPress={handleTestLogin}
          disabled={auth.login.isPending}
        >
          {auth.login.isPending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Test Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => auth.getProfile.refetch()}
          disabled={auth.getProfile.isLoading}
        >
          <Text style={styles.buttonText}>
            {auth.getProfile.isLoading ? 'Loading...' : 'Get Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Schema Management Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Schema Management Tests</Text>
        
        <TouchableOpacity
          style={[styles.button, schemas.getAllSchemas.isLoading && styles.buttonDisabled]}
          onPress={handleFetchSchemas}
          disabled={schemas.getAllSchemas.isLoading}
        >
          {schemas.getAllSchemas.isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Fetch All Schemas</Text>
          )}
        </TouchableOpacity>

        {/* Schema Selection */}
        {schemas.getAllSchemas.data && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Schema:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {schemas.getAllSchemas.data.map((schema: any) => (
                <TouchableOpacity
                  key={schema.name}
                  style={[
                    styles.schemaButton,
                    selectedSchema === schema.name && styles.schemaButtonSelected,
                  ]}
                  onPress={() => setSelectedSchema(schema.name)}
                >
                  <Text style={[
                    styles.schemaButtonText,
                    selectedSchema === schema.name && styles.schemaButtonTextSelected,
                  ]}>
                    {schema.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Dynamic Data Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💾 Dynamic Data Tests</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Test Data (JSON):</Text>
          <TextInput
            style={styles.textInput}
            value={testData}
            onChangeText={setTestData}
            multiline
            numberOfLines={3}
            placeholder="Enter JSON data for the record"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, dynamicData.createRecord.isPending && styles.buttonDisabled]}
          onPress={handleCreateTestRecord}
          disabled={dynamicData.createRecord.isPending || !selectedSchema}
        >
          {dynamicData.createRecord.isPending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Create Test Record</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleFetchRecords}
          disabled={!selectedSchema}
        >
          <Text style={styles.buttonText}>Fetch Records</Text>
        </TouchableOpacity>
      </View>

      {/* API Features Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✨ Dynamic API Features</Text>
        <Text style={styles.featureText}>
          • 🔍 Automatic endpoint discovery from Swagger docs
        </Text>
        <Text style={styles.featureText}>
          • 🎯 Type-safe API calls with TypeScript
        </Text>
        <Text style={styles.featureText}>
          • ⚡ React Query caching and background updates
        </Text>
        <Text style={styles.featureText}>
          • 🚀 Optimistic updates for instant UI feedback
        </Text>
        <Text style={styles.featureText}>
          • 🔄 Automatic retries on network failures
        </Text>
        <Text style={styles.featureText}>
          • 📊 Smart error handling and recovery
        </Text>
        <Text style={styles.featureText}>
          • 🎨 No hardcoded endpoints - all dynamic!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  statusText: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 5,
  },
  endpointGroup: {
    marginBottom: 15,
  },
  tagTitle: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  endpointText: {
    color: '#cccccc',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  moreText: {
    color: '#888888',
    fontSize: 12,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#3a3a3a',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
  },
  schemaButton: {
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#555',
  },
  schemaButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  schemaButtonText: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  schemaButtonTextSelected: {
    color: '#ffffff',
  },
  featureText: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 5,
    marginLeft: 10,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});
