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
import { useAuth, useSchemas } from '../hooks/useDynamicApi';

/**
 * Enhanced Schema Generator using Dynamic API Discovery
 * This demonstrates how to use the dynamic API client with React Query
 */
export function SchemaGeneratorWithDynamicApi() {
  const [jsonText, setJsonText] = useState('');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');

  // Dynamic API hooks (automatically generated from Swagger)
  const auth = useAuth();
  const schemas = useSchemas();

  // Handle JSON schema creation
  const handleCreateFromJson = useCallback(async () => {
    try {
      const parsedData = JSON.parse(jsonText);
      
      // Use dynamic API to create schema
      await schemas.createSchema.mutateAsync({
        params: {},
        body: {
          name: parsedData.name,
          displayName: parsedData.displayName,
          description: parsedData.description,
          jsonSchema: parsedData.jsonSchema,
        },
      });

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
      Alert.alert('Error', `Failed to create schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [jsonText, schemas.createSchema]);

  // Handle form schema creation
  const handleCreateFromForm = useCallback(async () => {
    try {
      // Use dynamic API to create schema
      await schemas.createSchema.mutateAsync({
        params: {},
        body: {
          name,
          displayName,
          description,
          jsonSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              createdAt: { type: 'string' },
            },
            required: ['id'],
          },
        },
      });

      Alert.alert('Success', 'Schema created successfully!');
    } catch (error) {
      console.error('Failed to create schema:', error);
      Alert.alert('Error', `Failed to create schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [name, displayName, description, schemas.createSchema]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 Dynamic API Schema Generator</Text>
        <Text style={styles.subtitle}>
          Powered by automatic endpoint discovery from Swagger docs
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>JSON Schema Creator</Text>
        
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
            schemas.createSchema.isPending && styles.createButtonDisabled,
          ]}
          onPress={handleCreateFromJson}
          disabled={schemas.createSchema.isPending}
        >
          {schemas.createSchema.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.createButtonText}>Create Schema</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Form Schema Creator</Text>
        
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
            schemas.createSchema.isPending && styles.createButtonDisabled,
          ]}
          onPress={handleCreateFromForm}
          disabled={schemas.createSchema.isPending}
        >
          {schemas.createSchema.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.createButtonText}>Create Schema</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Dynamic API Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✨ Dynamic API Features</Text>
        
        <View style={styles.featureGrid}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔍</Text>
            <Text style={styles.featureTitle}>Auto Discovery</Text>
            <Text style={styles.featureDescription}>
              Endpoints discovered from Swagger docs
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureTitle}>Type Safety</Text>
            <Text style={styles.featureDescription}>
              Full TypeScript support
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureTitle}>Caching</Text>
            <Text style={styles.featureDescription}>
              Smart React Query caching
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🚀</Text>
            <Text style={styles.featureTitle}>Optimistic</Text>
            <Text style={styles.featureDescription}>
              Instant UI updates
            </Text>
          </View>
        </View>
      </View>

      {/* API Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 API Status</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Auth Status:</Text>
          <Text style={[
            styles.statusValue,
            auth.isInitialized ? styles.statusSuccess : styles.statusWarning
          ]}>
            {auth.isInitialized ? 'Ready' : 'Initializing...'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Schemas Status:</Text>
          <Text style={[
            styles.statusValue,
            schemas.getAllSchemas.data ? styles.statusSuccess : styles.statusInfo
          ]}>
            {schemas.getAllSchemas.data ? 
              `${schemas.getAllSchemas.data.length} schemas` : 
              'No data loaded'
            }
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Create Schema:</Text>
          <Text style={[
            styles.statusValue,
            schemas.createSchema.isSuccess ? styles.statusSuccess :
            schemas.createSchema.isError ? styles.statusError :
            styles.statusInfo
          ]}>
            {schemas.createSchema.isSuccess ? 'Success' :
             schemas.createSchema.isError ? 'Error' :
             schemas.createSchema.isPending ? 'Creating...' :
             'Ready'}
          </Text>
        </View>
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
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#cccccc',
    textAlign: 'center',
    opacity: 0.8,
  },
  section: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  jsonInput: {
    backgroundColor: '#3a3a3a',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 150,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#3a3a3a',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#555',
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
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    backgroundColor: '#3a3a3a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDescription: {
    color: '#cccccc',
    fontSize: 12,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    color: '#cccccc',
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusSuccess: {
    color: '#34C759',
  },
  statusWarning: {
    color: '#FF9500',
  },
  statusError: {
    color: '#FF3B30',
  },
  statusInfo: {
    color: '#007AFF',
  },
});
