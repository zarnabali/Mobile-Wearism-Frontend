import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  useSchemas,
  useSchema,
  useCreateSchema,
  useUpdateSchema,
  useDeleteSchema,
  usePrefetchSchemas,
} from '../hooks/useSchemas';

/**
 * Complete example showing all React Query features in action
 * This demonstrates:
 * 1. Data fetching with caching
 * 2. Optimistic updates
 * 3. Background refetching
 * 4. Error handling and retries
 * 5. Prefetching for performance
 */
export function ReactQueryUsageExample() {
  // ============================================
  // QUERY HOOKS (Data Fetching)
  // ============================================
  
  // Fetch all schemas with automatic caching and background updates
  const {
    data: schemas,
    isLoading: schemasLoading,
    error: schemasError,
    refetch: refetchSchemas,
    isFetching: schemasFetching,
    isStale: schemasStale,
  } = useSchemas();

  // Fetch a specific schema (only runs when schemaName is provided)
  const {
    data: specificSchema,
    isLoading: schemaLoading,
    error: schemaError,
  } = useSchema('test'); // Replace with actual schema name

  // ============================================
  // MUTATION HOOKS (Data Modifying)
  // ============================================

  // Create schema with optimistic updates
  const createSchemaMutation = useCreateSchema();

  // Update schema with optimistic updates
  const updateSchemaMutation = useUpdateSchema();

  // Delete schema with optimistic updates
  const deleteSchemaMutation = useDeleteSchema();

  // ============================================
  // UTILITY HOOKS
  // ============================================

  // Prefetch schemas for better performance
  const prefetchSchemas = usePrefetchSchemas();

  // ============================================
  // HANDLERS
  // ============================================

  const handleCreateSchema = async () => {
    try {
      await createSchemaMutation.mutateAsync({
        name: 'example-schema',
        displayName: 'Example Schema',
        description: 'Created with React Query',
        jsonSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
          },
          required: ['name'],
        },
      });

      Alert.alert('Success', 'Schema created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create schema');
    }
  };

  const handleUpdateSchema = async () => {
    try {
      await updateSchemaMutation.mutateAsync({
        name: 'test',
        data: {
          description: 'Updated with React Query',
        },
      });

      Alert.alert('Success', 'Schema updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update schema');
    }
  };

  const handleDeleteSchema = async () => {
    try {
      await deleteSchemaMutation.mutateAsync('example-schema');
      Alert.alert('Success', 'Schema deleted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete schema');
    }
  };

  const handlePrefetch = () => {
    prefetchSchemas();
    Alert.alert('Info', 'Schemas prefetched for better performance!');
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>React Query Features Demo</Text>

      {/* Query Status Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Query Status</Text>
        <Text style={styles.statusText}>
          Loading: {schemasLoading ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>
          Fetching: {schemasFetching ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>
          Stale: {schemasStale ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>
          Error: {schemasError?.message || 'None'}
        </Text>
        <Text style={styles.statusText}>
          Data Count: {schemas?.length || 0}
        </Text>
      </View>

      {/* Mutation Status Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔄 Mutation Status</Text>
        <Text style={styles.statusText}>
          Create Loading: {createSchemaMutation.isLoading ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>
          Update Loading: {updateSchemaMutation.isLoading ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>
          Delete Loading: {deleteSchemaMutation.isLoading ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>
          Create Error: {createSchemaMutation.error?.message || 'None'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Actions</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={handlePrefetch}
        >
          <Text style={styles.buttonText}>Prefetch Schemas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => refetchSchemas()}
        >
          <Text style={styles.buttonText}>Refetch Schemas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.createButton]}
          onPress={handleCreateSchema}
          disabled={createSchemaMutation.isLoading}
        >
          <Text style={styles.buttonText}>
            {createSchemaMutation.isLoading ? 'Creating...' : 'Create Schema'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.updateButton]}
          onPress={handleUpdateSchema}
          disabled={updateSchemaMutation.isLoading}
        >
          <Text style={styles.buttonText}>
            {updateSchemaMutation.isLoading ? 'Updating...' : 'Update Schema'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDeleteSchema}
          disabled={deleteSchemaMutation.isLoading}
        >
          <Text style={styles.buttonText}>
            {deleteSchemaMutation.isLoading ? 'Deleting...' : 'Delete Schema'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Data Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Schemas Data</Text>
        {schemasLoading ? (
          <Text style={styles.loadingText}>Loading schemas...</Text>
        ) : schemasError ? (
          <Text style={styles.errorText}>
            Error: {schemasError.message}
          </Text>
        ) : (
          <View>
            <Text style={styles.dataText}>
              Found {schemas?.length || 0} schemas
            </Text>
            {schemas?.slice(0, 3).map((schema, index) => (
              <View key={schema._id} style={styles.schemaItem}>
                <Text style={styles.schemaName}>{schema.name}</Text>
                <Text style={styles.schemaDescription}>
                  {schema.description || 'No description'}
                </Text>
              </View>
            ))}
            {schemas && schemas.length > 3 && (
              <Text style={styles.moreText}>... and {schemas.length - 3} more</Text>
            )}
          </View>
        )}
      </View>

      {/* React Query Benefits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✨ React Query Benefits</Text>
        <Text style={styles.benefitText}>
          • Automatic caching - No redundant API calls
        </Text>
        <Text style={styles.benefitText}>
          • Background updates - Data stays fresh
        </Text>
        <Text style={styles.benefitText}>
          • Optimistic updates - UI responds instantly
        </Text>
        <Text style={styles.benefitText}>
          • Automatic retries - Handles network failures
        </Text>
        <Text style={styles.benefitText}>
          • Offline support - Works without internet
        </Text>
        <Text style={styles.benefitText}>
          • DevTools - Debug queries and mutations
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
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: '#34C759',
  },
  updateButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#FF9500',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
  },
  dataText: {
    color: '#34C759',
    fontSize: 16,
    marginBottom: 10,
  },
  schemaItem: {
    backgroundColor: '#3a3a3a',
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  schemaName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  schemaDescription: {
    color: '#cccccc',
    fontSize: 14,
    marginTop: 2,
  },
  moreText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  benefitText: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 5,
    marginLeft: 10,
  },
});
