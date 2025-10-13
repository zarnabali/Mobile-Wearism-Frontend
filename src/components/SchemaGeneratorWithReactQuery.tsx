import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useCreateSchema } from '../hooks/useSchemas';
import { CreateSchemaData } from '../utils/api';

/**
 * Example component showing how to use React Query hooks
 * This replaces the manual API calls with optimized React Query hooks
 */
export function SchemaGeneratorWithReactQuery() {
  const [jsonText, setJsonText] = useState('');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');

  // React Query mutation hook with optimistic updates
  const createSchemaMutation = useCreateSchema();

  // Handle JSON schema creation
  const handleCreateFromJson = useCallback(async () => {
    try {
      const parsedData = JSON.parse(jsonText);
      
      const schemaData: CreateSchemaData = {
        name: parsedData.name,
        displayName: parsedData.displayName,
        description: parsedData.description,
        jsonSchema: parsedData.jsonSchema,
      };

      // This will automatically handle:
      // 1. Optimistic updates (UI updates immediately)
      // 2. Background API call
      // 3. Rollback on error
      // 4. Cache invalidation
      await createSchemaMutation.mutateAsync(schemaData);

      // Show success message
      Alert.alert(
        'Success',
        'Schema created successfully!',
        [
          {
            text: 'Create Another',
            onPress: () => {
              setJsonText('');
              setName('');
              setDisplayName('');
              setDescription('');
            },
          },
          {
            text: 'View Schema',
            onPress: () => {
              // Navigate to schema detail
              console.log('Navigate to schema detail');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create schema:', error);
      // Error handling is automatically done by React Query
      Alert.alert('Error', 'Failed to create schema. Please try again.');
    }
  }, [jsonText, createSchemaMutation]);

  // Handle form schema creation
  const handleCreateFromForm = useCallback(async () => {
    try {
      const schemaData: CreateSchemaData = {
        name,
        displayName,
        description,
        jsonSchema: {
          type: 'object',
          properties: {
            // Basic schema structure
            id: { type: 'string' },
            createdAt: { type: 'string' },
          },
          required: ['id'],
        },
      };

      await createSchemaMutation.mutateAsync(schemaData);

      Alert.alert('Success', 'Schema created successfully!');
    } catch (error) {
      console.error('Failed to create schema:', error);
      Alert.alert('Error', 'Failed to create schema. Please try again.');
    }
  }, [name, displayName, description, createSchemaMutation]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>JSON Schema Creator</Text>
        
        <TextInput
          style={styles.jsonInput}
          value={jsonText}
          onChangeText={setJsonText}
          placeholder="Enter your JSON schema here..."
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.createButton,
            createSchemaMutation.isPending && styles.createButtonDisabled,
          ]}
          onPress={handleCreateFromJson}
          disabled={createSchemaMutation.isPending}
        >
          {createSchemaMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.createButtonText}>Create Schema</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Form Schema Creator</Text>
        
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Schema Name"
        />
        
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display Name"
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.createButton,
            createSchemaMutation.isPending && styles.createButtonDisabled,
          ]}
          onPress={handleCreateFromForm}
          disabled={createSchemaMutation.isPending}
        >
          {createSchemaMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.createButtonText}>Create Schema</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* React Query DevTools Info */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugTitle}>React Query Debug Info:</Text>
          <Text style={styles.debugText}>
            Status: {createSchemaMutation.status}
          </Text>
          <Text style={styles.debugText}>
            Error: {createSchemaMutation.error?.message || 'None'}
          </Text>
          <Text style={styles.debugText}>
            Is Loading: {createSchemaMutation.isPending ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.debugText}>
            Is Success: {createSchemaMutation.isSuccess ? 'Yes' : 'No'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  jsonInput: {
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 150,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    minHeight: 80,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonDisabled: {
    backgroundColor: '#666',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugInfo: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  debugTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugText: {
    color: '#cccccc',
    fontSize: 12,
    marginBottom: 5,
  },
});
