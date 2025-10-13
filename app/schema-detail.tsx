import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SchemaApi, Schema, DynamicDataApi, SchemaRecord, SchemaStats } from '../src/utils/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Custom JSON Editor Component
const JSONEditor = React.memo(({ value, onChange, placeholder }: {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}) => {
  const [showKeyboard, setShowKeyboard] = useState(false);
  
  const lines = value.split('\n');
  const lineNumbers = lines.map((_, index) => index + 1);
  
  return (
    <View className="bg-gray-900 rounded-xl border border-gray-700">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-2 border-b border-gray-700">
        <Text className="text-white text-sm font-medium">JSON Schema Editor</Text>
        <View className="flex-row items-center">
          <Text className="text-gray-400 text-xs mr-2">Lines: {lines.length}</Text>
          <Ionicons name="code-outline" size={16} color="#6B7280" />
        </View>
      </View>
      
      {/* Editor */}
      <View className="flex-row">
        {/* Line Numbers */}
        <View className="bg-gray-800 px-3 py-4 border-r border-gray-700">
          {lineNumbers.map((lineNum) => (
            <Text key={lineNum} className="text-gray-500 text-xs font-mono leading-5">
              {lineNum.toString().padStart(2, ' ')}
            </Text>
          ))}
        </View>
        
        {/* Code Area */}
        <View className="flex-1">
          <TextInput
            className="text-white font-mono text-sm px-4 py-4 leading-5"
            placeholder={placeholder}
            placeholderTextColor="#6B7280"
            value={value}
            onChangeText={onChange}
            multiline
            numberOfLines={lines.length || 15}
            style={{ 
              minHeight: 300,
              textAlignVertical: 'top',
              lineHeight: 20
            }}
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            onFocus={() => setShowKeyboard(true)}
            onBlur={() => setShowKeyboard(false)}
          />
        </View>
      </View>
      
      {/* Footer */}
      <View className="px-4 py-2 border-t border-gray-700 bg-gray-800 rounded-b-xl">
        <Text className="text-gray-400 text-xs">
          💡 Tip: Use proper JSON formatting with quotes, commas, and brackets
        </Text>
      </View>
    </View>
  );
});

// Draft field row - isolated, memoized to prevent focus loss on parent re-render
type DraftField = {
  id: string;
  fieldName: string;
  fieldType: 'string' | 'number' | 'integer' | 'boolean' | '';
  fieldDescription: string;
  isRequired: boolean;
};

const DraftFieldItem = React.memo(({ draft, onUpdate, onRemove, onSubmit }: {
  draft: DraftField;
  onUpdate: (id: string, patch: Partial<DraftField>) => void;
  onRemove: (id: string) => void;
  onSubmit: (id: string) => void;
}) => (
  <View className="bg-indigo-900/30 rounded-2xl p-5 mb-4 border border-indigo-500/30">
    <View className="flex-row justify-between items-center mb-4">
     
      <View className="flex-row space-x-2">
        <TouchableOpacity onPress={() => onRemove(draft.id)} className="bg-gray-600/80 px-3 py-2 rounded-xl">
          <Text className="text-gray-200 text-sm font-medium">Remove</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSubmit(draft.id)} className="bg-emerald-600 ml-1 px-3 py-2 rounded-xl">
          <Text className="text-white text-sm font-medium">Add</Text>
        </TouchableOpacity>
      </View>
    </View>

    <View className="mb-3">
      <Text className="text-gray-200 font-semibold mb-2">Field Name *</Text>
      <TextInput
        className="bg-gray-800/60 rounded-2xl px-5 py-4 text-white border border-gray-600/50 text-base"
        placeholder="Enter field name"
        placeholderTextColor="#9CA3AF"
        value={draft.fieldName}
        onChangeText={(text) => onUpdate(draft.id, { fieldName: text })}
        autoCorrect={false}
        autoCapitalize="none"
        underlineColorAndroid="transparent"
      />
    </View>

    <View className="mb-3">
      <Text className="text-gray-200 font-semibold mb-2">Field Type *</Text>
      <View className="bg-gray-800/60 rounded-2xl p-2 flex-row border border-gray-600/50">
        {(['string','number','integer','boolean'] as const).map(type => (
          <Pressable key={type} className={`flex-1 py-3 rounded-xl ${draft.fieldType === type ? 'bg-indigo-600' : 'bg-transparent'}`} onPress={() => onUpdate(draft.id, { fieldType: type })} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <Text className={`text-center text-sm font-semibold ${draft.fieldType === type ? 'text-white' : 'text-gray-300'}`}>{type}</Text>
          </Pressable>
        ))}
      </View>
    </View>

    <View className="mb-3">
      <Text className="text-gray-200 font-semibold mb-2">Description</Text>
      <TextInput
        className="bg-gray-800/60 rounded-2xl px-5 py-4 text-white border border-gray-600/50 text-base"
        placeholder="Enter field description"
        placeholderTextColor="#9CA3AF"
        value={draft.fieldDescription}
        onChangeText={(text) => onUpdate(draft.id, { fieldDescription: text })}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        autoCorrect={false}
        underlineColorAndroid="transparent"
      />
    </View>

    <View className="mb-1">
      <TouchableOpacity className={`flex-row items-center p-4 rounded-xl border ${draft.isRequired ? 'bg-indigo-600/20 border-indigo-500' : 'bg-gray-800/60 border-gray-600/50'}`} onPress={() => onUpdate(draft.id, { isRequired: !draft.isRequired })} activeOpacity={0.7}>
        <Ionicons name={draft.isRequired ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={draft.isRequired ? '#6366F1' : '#9CA3AF'} />
        <View className="ml-3">
          <Text className="text-white font-semibold text-base">Required Field</Text>
          <Text className="text-gray-300 text-sm">This field must be provided when creating entries</Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
), (prev, next) => (
  prev.draft.id === next.draft.id &&
  prev.draft.fieldName === next.draft.fieldName &&
  prev.draft.fieldType === next.draft.fieldType &&
  prev.draft.fieldDescription === next.draft.fieldDescription &&
  prev.draft.isRequired === next.draft.isRequired
));



// Separate field component to prevent re-rendering
const CreateEntryField = React.memo(({ field, value, onValueChange, error }: {
  field: { key: string; type: string; required: boolean; description: string };
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
}) => (
  <View>
    <Text className="text-white font-medium mb-2">
      {field.key} {field.required && <Text className="text-red-400">*</Text>}
    </Text>
    <TextInput
      className="bg-gray-800 rounded-xl px-4 py-3 text-white"
      placeholder={`Enter ${field.key}${field.description ? ` (${field.description})` : ''}`}
      placeholderTextColor="#6B7280"
      value={value}
      onChangeText={onValueChange}
      multiline={field.type === 'string' && field.description?.includes('description')}
      numberOfLines={field.type === 'string' && field.description?.includes('description') ? 3 : 1}
      keyboardType={
        field.type === 'number' || field.type === 'integer' ? 'numeric' : 'default'
      }
    />
    {error && (
      <Text className="text-red-400 text-sm mt-1">{error}</Text>
    )}
  </View>
));

const SchemaDetailScreen = () => {
  const router = useRouter();
  const { schemaName } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState(0);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [entries, setEntries] = useState<SchemaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpdateSchemaModal, setShowUpdateSchemaModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SchemaRecord | null>(null);
  const [createForm, setCreateForm] = useState<Record<string, any>>({});
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [updateSchemaForm, setUpdateSchemaForm] = useState<Record<string, any>>({});
  const [newFieldForm, setNewFieldForm] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [schemaEditMode, setSchemaEditMode] = useState<'json' | 'form'>('json');
  const [jsonSchemaText, setJsonSchemaText] = useState('');
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingFieldData, setEditingFieldData] = useState<any>(null);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [localSchemaChanges, setLocalSchemaChanges] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAddFieldForm, setShowAddFieldForm] = useState(false);
  const [draftFields, setDraftFields] = useState<DraftField[]>([]);
  const [schemaStats, setSchemaStats] = useState<SchemaStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Fetch schema data from API
  useEffect(() => {
    if (schemaName) {
      fetchSchemaDetails();
    }
  }, [schemaName]);

  // (removed) debug for add-field form visibility; form is always visible now

  const fetchSchemaDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await SchemaApi.getSchemaByName(schemaName as string);
      setSchema(response.data);
      
      // Fetch actual entries from the schema's collection
      await fetchSchemaEntries();
    } catch (err: any) {
      console.error('Failed to fetch schema details:', err);
      setError(err.message || 'Failed to load schema details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchemaEntries = async () => {
    if (!schemaName) return;
    
    try {
      setEntriesLoading(true);
      setEntriesError(null);
      const response = await DynamicDataApi.getRecords(schemaName as string, 1, 50);
      setEntries(response.data.records);
    } catch (err: any) {
      console.error('Failed to fetch schema entries:', err);
      setEntriesError(err.message || 'Failed to load schema entries');
    } finally {
      setEntriesLoading(false);
    }
  };

  const fetchSchemaStats = async () => {
    if (!schemaName) return;
    
    try {
      setStatsLoading(true);
      setStatsError(null);
      const response = await SchemaApi.getSchemaStats(schemaName as string);
      setSchemaStats(response.data);
    } catch (err: any) {
      console.error('Failed to fetch schema statistics:', err);
      setStatsError(err.message || 'Failed to load schema statistics');
    } finally {
      setStatsLoading(false);
    }
  };


  const handleRefresh = () => {
    fetchSchemaDetails();
  };

  // Force refresh form builder after field operations
  const refreshFormBuilder = () => {
    setForceRefresh(prev => prev + 1);
    fetchSchemaDetails();
  };

  const handleUpdate = () => {
    if (schema) {
      setUpdateSchemaForm({
        displayName: schema.displayName,
        description: schema.description,
        jsonSchema: schema.jsonSchema
      });
      setJsonSchemaText(JSON.stringify(schema.jsonSchema, null, 2));
      setSchemaEditMode('form'); // Default to form view for better UX
      setJsonValidationError(null);
      setLocalSchemaChanges(schema.jsonSchema);
      setHasUnsavedChanges(false);
      setShowUpdateSchemaModal(true);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Schema",
      "Are you sure you want to delete this schema? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await SchemaApi.deleteSchema(schemaName as string);
              Alert.alert("Success", "Schema deleted successfully!");
          router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete schema");
            }
          }
        }
      ]
    );
  };

  const handleViewStats = () => {
    setActiveTab(2); // Switch to Statistics tab
    if (!schemaStats) {
      fetchSchemaStats();
    }
  };

  const handleViewAudit = () => {
    Alert.alert("Audit", "Audit trail will be shown here");
  };

  const handleViewVersions = () => {
    Alert.alert("Versions", "Schema versions will be shown here");
  };

  // Local field management functions (no API calls)
  const addFieldLocally = (source?: { fieldName?: string; fieldType?: string; fieldDescription?: string; isRequired?: boolean }) => {
    const { fieldName, fieldType, fieldDescription, isRequired } = source ?? newFieldForm;
    
    if (!fieldName || !fieldType) {
      Alert.alert("Error", "Field name and type are required");
      return;
    }
    
    if (!localSchemaChanges) return;
    
    // Check if field already exists
    if (localSchemaChanges.properties[fieldName]) {
      Alert.alert("Error", "Field with this name already exists");
      return;
    }
    
    // Create new field definition
    const newField: any = {
      type: fieldType,
      description: fieldDescription || ''
    };
    
    if (fieldType === 'number' || fieldType === 'integer') {
      newField.minimum = 0;
    }
    
    // Update local schema with new field
    const updatedJsonSchema = {
      ...localSchemaChanges,
      properties: {
        ...localSchemaChanges.properties,
        [fieldName]: newField
      },
      required: isRequired 
        ? [...(localSchemaChanges.required || []), fieldName]
        : localSchemaChanges.required || []
    };
    
    console.log('Adding field locally:', fieldName, 'Updated schema:', updatedJsonSchema);
    
    setLocalSchemaChanges(updatedJsonSchema);
    setJsonSchemaText(JSON.stringify(updatedJsonSchema, null, 2));
    setHasUnsavedChanges(true);
    setNewFieldForm({});
    
    // Force re-render of form builder
    setForceRefresh(prev => prev + 1);
    
    console.log('Field added successfully, form should re-render');
  };

  // Stable handlers for AddFieldForm to prevent re-renders and value resets
  const addEmptyDraft = React.useCallback(() => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setDraftFields(prev => ([
      ...prev,
      { id, fieldName: '', fieldType: '', fieldDescription: '', isRequired: false }
    ]));
  }, []);

  const updateDraft = React.useCallback((id: string, patch: Partial<DraftField>) => {
    setDraftFields(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }, []);

  const removeDraft = React.useCallback((id: string) => {
    setDraftFields(prev => prev.filter(d => d.id !== id));
  }, []);

  const submitDraft = React.useCallback((id: string) => {
    const d = draftFields.find(x => x.id === id);
    if (!d) return;
    addFieldLocally({
      fieldName: d.fieldName,
      fieldType: d.fieldType as any,
      fieldDescription: d.fieldDescription,
      isRequired: d.isRequired,
    });
    removeDraft(id);
    setShowAddFieldForm(false);
  }, [draftFields, removeDraft]);

  // Update field handler (local)
  const handleUpdateField = (fieldName: string, updatedFieldData: any) => {
    if (!localSchemaChanges) return;
    
    // Prepare the field definition without the 'required' property
    const { required, ...fieldDefinition } = updatedFieldData;
    
    // Update required fields array
    let updatedRequired = [...(localSchemaChanges.required || [])];
    if (required && !updatedRequired.includes(fieldName)) {
      updatedRequired.push(fieldName);
      } else if (!required && updatedRequired.includes(fieldName)) {
        updatedRequired = updatedRequired.filter((req: string) => req !== fieldName);
    }
    
    const updatedJsonSchema = {
      ...localSchemaChanges,
      properties: {
        ...localSchemaChanges.properties,
        [fieldName]: fieldDefinition
      },
      required: updatedRequired
    };
    
    setLocalSchemaChanges(updatedJsonSchema);
    setJsonSchemaText(JSON.stringify(updatedJsonSchema, null, 2));
    setHasUnsavedChanges(true);
    setEditingField(null);
    setEditingFieldData(null);
    
    // Force re-render of form builder
    setForceRefresh(prev => prev + 1);
  };

  // Delete field handler (local)
  const handleDeleteField = (fieldName: string) => {
    if (!localSchemaChanges) return;
    
    Alert.alert(
      "Delete Field",
      `Are you sure you want to delete the field "${fieldName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            const { [fieldName]: removed, ...remainingProperties } = localSchemaChanges.properties;
            const updatedRequired = (localSchemaChanges.required || []).filter((req: string) => req !== fieldName);
            
            const updatedJsonSchema = {
              ...localSchemaChanges,
              properties: remainingProperties,
              required: updatedRequired
            };
            
            setLocalSchemaChanges(updatedJsonSchema);
            setJsonSchemaText(JSON.stringify(updatedJsonSchema, null, 2));
            setHasUnsavedChanges(true);
            
            // Force re-render of form builder
            setForceRefresh(prev => prev + 1);
          }
        }
      ]
    );
  };

  // Validate JSON Schema
  const handleValidateSchema = async () => {
    try {
      const parsedJson = JSON.parse(jsonSchemaText);
      const validationData = { jsonSchema: parsedJson };
      
      // Call the validation API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:3000'}/api/schemas/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await import('expo-secure-store').then(m => m.getItemAsync('auth_token'))}`
        },
        body: JSON.stringify(validationData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setJsonValidationError(null);
        Alert.alert("Validation Success", "JSON Schema is valid!");
      } else {
        setJsonValidationError(result.error || "Invalid JSON Schema");
        Alert.alert("Validation Failed", result.error || "Invalid JSON Schema");
      }
    } catch (error: any) {
      setJsonValidationError(error.message);
      Alert.alert("Validation Error", error.message || "Failed to validate schema");
    }
  };

  // Save changes function
  const saveChanges = async () => {
    if (!schemaName || !hasUnsavedChanges) {
      Alert.alert("No Changes", "No changes to save.");
      return;
    }
    
    try {
      const updateData = {
        displayName: updateSchemaForm.displayName || schema?.displayName,
        description: updateSchemaForm.description || schema?.description,
        jsonSchema: localSchemaChanges
      };
      
      await SchemaApi.updateSchema(schemaName as string, updateData);
      Alert.alert("Success", "Schema updated successfully!");
      setShowUpdateSchemaModal(false);
      setUpdateSchemaForm({});
      setJsonSchemaText('');
      setLocalSchemaChanges(null);
      setHasUnsavedChanges(false);
      await fetchSchemaDetails();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update schema");
    }
  };

  // Update schema handler (now just calls save changes)
  const handleUpdateSchema = async () => {
    await saveChanges();
  };

  // Helper function to convert form data to proper types
  const convertFormDataToTypes = (data: Record<string, any>, schema: Schema, isUpdate = false) => {
    const converted: Record<string, any> = {};
    
    if (!schema?.jsonSchema?.properties) return data;
    
    Object.entries(data).forEach(([key, value]) => {
      // Skip system fields for updates
      if (isUpdate && ['_id', '_schemaName', 'createdAt', 'updatedAt', '__v'].includes(key)) {
        return;
      }
      
      const fieldDef = schema.jsonSchema.properties[key];
      if (!fieldDef) {
        // Only include fields that exist in schema
        if (schema.jsonSchema.properties[key] !== undefined) {
          converted[key] = value;
        }
        return;
      }
      
      // Convert based on field type
      switch (fieldDef.type) {
        case 'number':
          if (value === '' || value === null || value === undefined) {
            converted[key] = fieldDef.required ? 0 : undefined;
          } else {
            const numValue = Number(value);
            converted[key] = isNaN(numValue) ? (fieldDef.required ? 0 : undefined) : numValue;
          }
          break;
        case 'boolean':
          if (typeof value === 'string') {
            converted[key] = value === 'true';
          } else {
            converted[key] = Boolean(value);
          }
          break;
        case 'integer':
          if (value === '' || value === null || value === undefined) {
            converted[key] = fieldDef.required ? 0 : undefined;
          } else {
            const intValue = parseInt(value, 10);
            converted[key] = isNaN(intValue) ? (fieldDef.required ? 0 : undefined) : intValue;
          }
          break;
        default:
          // For strings, ensure we don't send empty strings for non-required fields
          if (value === '' && !fieldDef.required) {
            converted[key] = undefined;
          } else {
            converted[key] = value;
          }
      }
    });
    
    return converted;
  };

  // Entry CRUD operations
  const handleCreateEntry = async () => {
    if (!schemaName || !schema) return;
    
    try {
      setFormErrors({});
      
      // Convert form data to proper types
      const convertedData = convertFormDataToTypes(createForm, schema);
      
      await DynamicDataApi.createRecord(schemaName as string, convertedData);
      Alert.alert("Success", "Entry created successfully!");
      setCreateForm({});
      setShowCreateModal(false);
      await fetchSchemaEntries();
    } catch (error: any) {
      console.error('Create entry error:', error);
      Alert.alert("Error", error.message || "Failed to create entry");
    }
  };

  const handleEditEntry = (record: SchemaRecord) => {
    setEditingRecord(record);
    
    // Only include schema fields in the edit form, exclude system fields
    const schemaFields: Record<string, any> = {};
    if (schema?.jsonSchema?.properties) {
      Object.keys(schema.jsonSchema.properties).forEach(key => {
        if (record[key] !== undefined) {
          schemaFields[key] = record[key];
        }
      });
    }
    
    setEditForm(schemaFields);
    setShowEditModal(true);
  };

  const handleUpdateEntry = async () => {
    if (!schemaName || !editingRecord || !schema) return;
    
    try {
      setFormErrors({});
      
      // Convert form data to proper types, excluding system fields for updates
      const convertedData = convertFormDataToTypes(editForm, schema, true);
      
      console.log('Update data being sent:', convertedData);
      console.log('Original editForm:', editForm);
      console.log('Schema properties:', schema.jsonSchema.properties);
      console.log('Schema required fields:', schema.jsonSchema.required);
      
      // Check if all required fields are present
      const requiredFields = schema.jsonSchema.required || [];
      const missingFields = requiredFields.filter(field => 
        convertedData[field] === undefined || convertedData[field] === '' || convertedData[field] === null
      );
      
      if (missingFields.length > 0) {
        Alert.alert("Validation Error", `Missing required fields: ${missingFields.join(', ')}`);
        return;
      }
      
      await DynamicDataApi.updateRecord(schemaName as string, editingRecord._id, convertedData);
      Alert.alert("Success", "Entry updated successfully!");
      setShowEditModal(false);
      setEditingRecord(null);
      setEditForm({});
      await fetchSchemaEntries();
    } catch (error: any) {
      console.error('Update entry error:', error);
      console.error('Update data that failed:', convertFormDataToTypes(editForm, schema, true));
      
      // Try to extract more specific error information
      let errorMessage = error.message || "Failed to update entry";
      if (error.message && error.message.includes("Data validation failed")) {
        errorMessage = "Data validation failed. Please check that all fields are filled correctly and match the expected format.";
      }
      
      Alert.alert("Error", errorMessage);
    }
  };

  const handleDeleteEntry = async (record: SchemaRecord) => {
    if (!schemaName) return;
    
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this entry?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await DynamicDataApi.deleteRecord(schemaName as string, record._id);
              Alert.alert("Success", "Entry deleted successfully!");
              await fetchSchemaEntries();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete entry");
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFieldTypeColor = (type: string) => {
    switch (type) {
      case 'string': return '#60A5FA';
      case 'number': return '#34D399';
      case 'boolean': return '#FBBF24';
      case 'array': return '#A78BFA';
      case 'object': return '#FB7185';
      default: return '#9CA3AF';
    }
  };

  const SchemaInfoCard = () => (
    <View>
      <TouchableOpacity
        activeOpacity={0.9}
        className="mr-4"
        style={{ width: screenWidth - 48 }}
      >
        {/* Gradient Shadow */}
        <LinearGradient
          colors={['#4F46E580', '#7C3AED30'] as any}
          style={{
            position: 'absolute',
            top: 8,
            left: 4,
            right: 4,
            bottom: -8,
            borderRadius: 20,
            opacity: 0.3,
          }}
        />
        
        {/* Main Card */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED'] as any}
          style={{
            borderRadius: 20,
            padding: 20,
            minHeight: 220,
          }}
        >
          {/* Header Section */}
          <View className="flex-row justify-between items-start mb-5">
            <View className="flex-1 mr-3">
              <Text className="text-white text-xl font-bold mb-2" numberOfLines={1}>
                {schema?.displayName}
              </Text>
              <Text className="text-white/70 text-sm mb-2" numberOfLines={2}>
                {schema?.description}
              </Text>
              <View className="space-y-1">
                <Text className="text-white/60 text-xs" numberOfLines={1}>
                  Schema ID: {schema?.name}
                </Text>
                <Text className="text-white/60 text-xs" numberOfLines={1}>
                  Tenant: {schema?.tenantId}
                </Text>
                <Text className="text-white/60 text-xs" numberOfLines={1}>
                  Collection: {schema?.collectionName}
                </Text>
              </View>
            </View>
            <View className={`px-3 py-1 rounded-full ${schema?.isActive ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
              <Text className={`text-xs font-medium ${schema?.isActive ? 'text-green-200' : 'text-red-200'}`}>
                {schema?.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Stats Section */}
          <View className="bg-white/10 rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Ionicons name="layers-outline" size={16} color="#ffffff" />
                <Text className="text-white/80 text-sm font-medium ml-2">Version</Text>
              </View>
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-white font-semibold text-sm">{schema?.version}</Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="grid-outline" size={16} color="#ffffff" />
                <Text className="text-white/80 text-sm font-medium ml-2">Fields</Text>
              </View>
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-white font-semibold text-sm">
                  {schema?.jsonSchema?.properties ? Object.keys(schema.jsonSchema.properties).length : 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Timestamps Section */}
          <View className="bg-white/10 rounded-xl p-4">
            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-2">
                  <Ionicons name="time-outline" size={14} color="#ffffff80" />
                  <Text className="text-white/70 text-xs ml-2">Created</Text>
                </View>
                <Text className="text-white/80 text-xs text-right flex-1" numberOfLines={1}>
                  {schema ? formatDate(schema.createdAt) : ''}
                </Text>
              </View>
              
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-2">
                  <Ionicons name="refresh-outline" size={14} color="#ffffff80" />
                  <Text className="text-white/70 text-xs ml-2">Updated</Text>
                </View>
                <Text className="text-white/80 text-xs text-right flex-1" numberOfLines={1}>
                  {schema ? formatDate(schema.updatedAt) : ''}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const FieldItem = ({ fieldName, fieldDef }: { fieldName: string; fieldDef: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      className="bg-gray-800/50 rounded-2xl p-4 mb-3 border border-gray-700/50"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-gray-400 text-sm mb-1">Field</Text>
          <Text className="text-white text-base font-medium mb-1">
            {fieldName}
          </Text>
          {fieldDef.description && (
            <Text className="text-gray-500 text-sm">
              {fieldDef.description}
            </Text>
          )}
        </View>
        <View className={`px-2 py-1 rounded-full`} style={{ backgroundColor: getFieldTypeColor(fieldDef.type) + '20' }}>
          <Text className={`text-xs font-medium`} style={{ color: getFieldTypeColor(fieldDef.type) }}>
            {fieldDef.type}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle-outline" size={16} color="#6B7280" />
          <Text className="text-gray-400 text-sm ml-2">
            {schema?.jsonSchema?.required?.includes(fieldName) ? 'Required' : 'Optional'}
          </Text>
        </View>
        <View className="flex-row">
          {fieldDef.minimum !== undefined && (
            <View className="flex-row items-center mr-3">
              <Ionicons name="trending-up-outline" size={16} color="#6B7280" />
              <Text className="text-gray-400 text-sm ml-1">min: {fieldDef.minimum}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const SchemaFieldsTable = () => (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-lg font-semibold">Schema Fields</Text>
        {/* Add Field button removed; inline form is always visible below */}
      </View>

      {schema?.jsonSchema?.properties && Object.entries(schema.jsonSchema.properties).map(([fieldName, fieldDef]: [string, any]) => (
        <FieldItem key={fieldName} fieldName={fieldName} fieldDef={fieldDef} />
      ))}
    </View>
  );

  const ActionButton = ({ onPress, icon, title, color, bgColor, textColor }: { 
    onPress: () => void; 
    icon: string; 
    title: string; 
    color: string; 
    bgColor: string; 
    textColor: string; 
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`${bgColor} rounded-2xl p-4 mb-3 border border-gray-700/50`}
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mr-3">
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View className="flex-1 mt-1">
          <Text className="text-gray-400 text-sm mb-1">Schema Action</Text>
          <Text className={`${textColor} text-base font-medium`}>
            {title}
          </Text>
        </View>
        <TouchableOpacity className="w-6 h-6 rounded-full bg-gray-700/50 items-center justify-center">
          <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const ActionButtons = () => (
    <View className="mb-6">
      <Text className="text-white text-lg font-semibold mb-4">Schema Actions</Text>
      
      <ActionButton
        onPress={handleRefresh}
        icon="refresh"
        title="Refresh Schema"
        color="#60A5FA"
        bgColor="bg-blue-500/10"
        textColor="text-blue-300"
      />

      <ActionButton
        onPress={handleUpdate}
        icon="create-outline"
        title="Update Schema"
        color="#34D399"
        bgColor="bg-green-500/10"
        textColor="text-green-300"
      />

      <ActionButton
        onPress={handleViewStats}
        icon="bar-chart-outline"
        title="View Statistics"
        color="#A78BFA"
        bgColor="bg-purple-500/10"
        textColor="text-purple-300"
      />

      <ActionButton
        onPress={handleViewAudit}
        icon="time-outline"
        title="Audit Trail"
        color="#FB923C"
        bgColor="bg-orange-500/10"
        textColor="text-orange-300"
      />

     

      <ActionButton
        onPress={handleDelete}
        icon="trash-outline"
        title="Delete Schema"
        color="#F87171"
        bgColor="bg-red-500/10"
        textColor="text-red-300"
      />
    </View>
  );

  const EntryItem = ({ item }: { item: SchemaRecord }) => {
    // Get the first few fields to display dynamically
    const getDisplayFields = () => {
      const fields = Object.keys(item).filter(key => 
        !['_id', '_schemaName', 'createdAt', 'updatedAt', '__v'].includes(key)
      );
      
      return fields.slice(0, 3).map(field => ({
        key: field,
        value: item[field],
        type: typeof item[field]
      }));
    };

    const displayFields = getDisplayFields();

    return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="bg-gray-800/50 rounded-2xl p-4 mb-3 border border-gray-700/50"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
            <Text className="text-gray-400 text-sm mb-1">Entry #{item._id.slice(-6)}</Text>
            {displayFields.map((field, index) => (
              <Text key={index} className="text-white text-base font-medium mb-1">
                {field.key}: {field.type === 'object' ? JSON.stringify(field.value) : String(field.value)}
          </Text>
            ))}
          <Text className="text-gray-500 text-sm">
              Created: {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text className="text-gray-400 text-sm ml-2">
              {formatDate(item.updatedAt)}
            </Text>
        </View>
        <View className="flex-row">
            <TouchableOpacity 
              className="mr-3"
              onPress={() => handleEditEntry(item)}
            >
            <Ionicons name="create-outline" size={16} color="#60A5FA" />
          </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteEntry(item)}>
            <Ionicons name="trash-outline" size={16} color="#F87171" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
  };

  const SchemaStatistics = () => (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-lg font-semibold">Schema Statistics</Text>
        <TouchableOpacity onPress={fetchSchemaStats} className="bg-blue-600 px-4 py-2 rounded-xl">
          <Text className="text-white text-sm font-medium">Refresh</Text>
        </TouchableOpacity>
      </View>

      {statsLoading ? (
        <View className="bg-gray-800/50 rounded-2xl p-8 items-center">
          <Text className="text-white text-lg mb-2">Loading statistics...</Text>
          <Text className="text-gray-400 text-sm">Fetching schema statistics</Text>
        </View>
      ) : statsError ? (
        <View className="bg-gray-800/50 rounded-2xl p-8 items-center">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-red-400 text-lg mb-2 mt-4">Failed to load statistics</Text>
          <Text className="text-gray-400 text-sm text-center mb-4">{statsError}</Text>
          <TouchableOpacity 
            onPress={fetchSchemaStats}
            className="bg-blue-600 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : schemaStats ? (
        <View className="space-y-4">
          {/* Schema Info Card */}
          <View className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-2xl p-5 border border-indigo-500/30">
            {/* Header Section */}
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 mr-3">
                <Text className="text-white text-lg font-bold mb-1" numberOfLines={1}>
                  {schemaStats.displayName}
                </Text>
                <Text className="text-indigo-300 text-xs mb-1" numberOfLines={1}>
                  Schema: {schemaStats.name}
                </Text>
                <Text className="text-indigo-300 text-xs mb-1" numberOfLines={1}>
                  Collection: {schemaStats.collectionName}
                </Text>
                <Text className="text-indigo-300 text-xs" numberOfLines={1}>
                  Tenant: {schemaStats.tenantId}
                </Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${schemaStats.isActive ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                <Text className={`text-xs font-medium ${schemaStats.isActive ? 'text-green-200' : 'text-red-200'}`}>
                  {schemaStats.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            
            {/* Version Section */}
            <View className="bg-indigo-500/10 rounded-xl p-3 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="layers-outline" size={16} color="#a78bfa" />
                  <Text className="text-indigo-200 text-sm font-medium ml-2">Version</Text>
                </View>
                <Text className="text-white font-semibold text-base">{schemaStats.version}</Text>
              </View>
            </View>
            
            {/* Timestamps Section */}
            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-2">
                  <Ionicons name="time-outline" size={14} color="#a78bfa" />
                  <Text className="text-indigo-200 text-xs ml-2">Created</Text>
                </View>
                <Text className="text-indigo-300 text-xs text-right flex-1" numberOfLines={1}>
                  {formatDate(schemaStats.createdAt)}
                </Text>
              </View>
              
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-2">
                  <Ionicons name="refresh-outline" size={14} color="#a78bfa" />
                  <Text className="text-indigo-200 text-xs ml-2">Updated</Text>
                </View>
                <Text className="text-indigo-300 text-xs text-right flex-1" numberOfLines={1}>
                  {formatDate(schemaStats.updatedAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Field Statistics */}
          <View className="bg-gray-800/50 rounded-2xl p-5">
            <View className="flex-row items-center mb-4">
              <Ionicons name="list-outline" size={20} color="#60A5FA" />
              <Text className="text-white text-lg font-semibold ml-2">Field Information</Text>
            </View>
            
            <View className="space-y-3">
              <View className="bg-gray-700/30 rounded-xl p-3 my-1">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Ionicons name="grid-outline" size={16} color="#9CA3AF" />
                    <Text className="text-gray-300 text-sm font-medium ml-2">Total Fields</Text>
                  </View>
                  <View className="bg-blue-500/20 px-3 py-1 rounded-full">
                    <Text className="text-blue-300 font-semibold text-sm">
                      {schema?.jsonSchema?.properties ? Object.keys(schema.jsonSchema.properties).length : 0}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View className="bg-gray-700/30 rounded-xl p-3 my-1">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                    <Text className="text-gray-300 text-sm font-medium ml-2">Required Fields</Text>
                  </View>
                  <View className="bg-green-500/20 px-3 py-1 rounded-full">
                    <Text className="text-green-300 font-semibold text-sm">
                      {schema?.jsonSchema?.required ? schema.jsonSchema.required.length : 0}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View className="bg-gray-700/30 rounded-xl p-3 my-1">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Ionicons name="ellipse-outline" size={16} color="#F59E0B" />
                    <Text className="text-gray-300 text-sm font-medium ml-2">Optional Fields</Text>
                  </View>
                  <View className="bg-yellow-500/20 px-3 py-1 rounded-full">
                    <Text className="text-yellow-300 font-semibold text-sm">
                      {schema?.jsonSchema?.properties && schema?.jsonSchema?.required 
                        ? Object.keys(schema.jsonSchema.properties).length - schema.jsonSchema.required.length 
                        : 0}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Entry Statistics */}
          <View className="bg-gray-800/50 rounded-2xl p-5">
            <View className="flex-row items-center mb-4">
              <Ionicons name="document-text-outline" size={20} color="#34D399" />
              <Text className="text-white text-lg font-semibold ml-2">Data Statistics</Text>
            </View>
            
            <View className="space-y-3">
              <View className="bg-gray-700/30 rounded-xl p-3 my-1">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Ionicons name="layers-outline" size={16} color="#9CA3AF" />
                    <Text className="text-gray-300 text-sm font-medium ml-2">Total Entries</Text>
                  </View>
                  <View className="bg-emerald-500/20 px-3 py-1 rounded-full">
                    <Text className="text-emerald-300 font-semibold text-sm">{entries.length}</Text>
                  </View>
                </View>
              </View>
              
              <View className="bg-gray-700/30 rounded-xl p-3 my-1">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                    <Text className="text-gray-300 text-sm font-medium ml-2">Last Updated</Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-400 text-xs text-right" numberOfLines={1}>
                      {entries.length > 0 ? formatDate(entries[0].updatedAt) : 'No entries'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View className="bg-gray-800/50 rounded-2xl p-8 items-center">
          <Ionicons name="bar-chart-outline" size={48} color="#6B7280" />
          <Text className="text-gray-400 text-lg font-medium mt-4">No statistics available</Text>
          <Text className="text-gray-500 text-sm text-center mt-2">
            Statistics will appear here once data is available
          </Text>
        </View>
      )}
    </View>
  );


  const SchemaEntries = () => (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-lg font-semibold">Schema Entries</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Text className="text-blue-500 text-sm">+ Add Entry</Text>
        </TouchableOpacity>
      </View>

      {entriesLoading ? (
        <View className="bg-gray-800/50 rounded-2xl p-8 items-center">
          <Text className="text-white text-lg mb-2">Loading entries...</Text>
          <Text className="text-gray-400 text-sm">Fetching schema data</Text>
        </View>
      ) : entriesError ? (
        <View className="bg-gray-800/50 rounded-2xl p-8 items-center">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-red-400 text-lg mb-2 mt-4">Failed to load entries</Text>
          <Text className="text-gray-400 text-sm text-center mb-4">{entriesError}</Text>
          <TouchableOpacity 
            onPress={fetchSchemaEntries}
            className="bg-blue-600 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : entries.length === 0 ? (
        <View className="bg-gray-800/50 rounded-2xl p-8 items-center">
          <Ionicons name="document-outline" size={48} color="#6B7280" />
          <Text className="text-gray-400 text-lg font-medium mt-4">No entries found</Text>
          <Text className="text-gray-500 text-sm text-center mt-2">
            Create your first entry to get started
          </Text>
          <TouchableOpacity 
            onPress={() => setShowCreateModal(true)}
            className="bg-blue-600 px-6 py-3 rounded-full mt-4"
          >
            <Text className="text-white font-semibold">Create Entry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        entries.map((item) => (
        <EntryItem key={item._id} item={item} />
        ))
      )}
    </View>
  );

  const TabButton = ({ title, index, icon }: { title: string; index: number; icon: string }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(index)}
      className="flex-1 items-center py-3"
    >
      <View className="items-center">
        <Ionicons 
          name={icon as any} 
          size={24} 
          color={activeTab === index ? "#4F46E5" : "#6B7280"} 
        />
        
        {activeTab === index && (
          <View className="w-1 h-1 bg-blue-600 rounded-full mt-1" />
        )}
      </View>
      <Text className={`mt-1 text-xs font-medium ${
        activeTab === index ? 'text-blue-400' : 'text-gray-400'
      }`}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Create Entry Modal Component
  const CreateEntryModal = React.useMemo(() => {
    if (!schema?.jsonSchema?.properties) return null;

    const getSchemaFields = () => {
      return Object.entries(schema.jsonSchema.properties).map(([key, value]: [string, any]) => ({
        key,
        type: value.type,
        required: schema.jsonSchema.required?.includes(key) || false,
        description: value.description || ''
      }));
    };

    const schemaFields = getSchemaFields();

    return (
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: '#1F2937' }}>
          <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
            <TouchableOpacity onPress={() => {
              setShowCreateModal(false);
              setCreateForm({});
            }}>
              <Text className="text-blue-500 text-lg">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">Create Entry</Text>
            <TouchableOpacity onPress={handleCreateEntry}>
              <Text className="text-blue-500 text-lg font-semibold">Save</Text>
            </TouchableOpacity>
        </View>

          <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
            <View className="space-y-6">
              {schemaFields.map((field) => (
                <CreateEntryField
                  key={field.key}
                  field={field}
                  value={createForm[field.key] || ''}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, [field.key]: value }))}
                  error={formErrors[field.key]}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }, [showCreateModal, schema, createForm, formErrors]);

  // Edit Entry Modal Component
  const EditEntryModal = React.useMemo(() => {
    if (!schema?.jsonSchema?.properties) return null;

    const getSchemaFields = () => {
      return Object.entries(schema.jsonSchema.properties).map(([key, value]: [string, any]) => ({
        key,
        type: value.type,
        required: schema.jsonSchema.required?.includes(key) || false,
        description: value.description || ''
      }));
    };

    const schemaFields = getSchemaFields();

    return (
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: '#1F2937' }}>
          <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
            <TouchableOpacity onPress={() => {
              setShowEditModal(false);
              setEditingRecord(null);
              setEditForm({});
            }}>
              <Text className="text-blue-500 text-lg">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">Edit Entry</Text>
            <TouchableOpacity onPress={handleUpdateEntry}>
              <Text className="text-blue-500 text-lg font-semibold">Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
            <View className="space-y-6">
              {schemaFields.map((field) => (
                <CreateEntryField
                  key={field.key}
                  field={field}
                  value={editForm[field.key] || ''}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, [field.key]: value }))}
                  error={formErrors[field.key]}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }, [showEditModal, schema, editForm, formErrors]);

  // Update Schema Modal Component
  const UpdateSchemaModal = React.useMemo(() => {
    return (
      <Modal
        visible={showUpdateSchemaModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView 
          style={{ flex: 1, backgroundColor: '#1F2937' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View className="flex-row justify-between items-center px-6 pt-14 pb-6 border-b border-gray-700/50">
            <TouchableOpacity 
              onPress={() => {
                setShowUpdateSchemaModal(false);
                setUpdateSchemaForm({});
                setJsonSchemaText('');
                setJsonValidationError(null);
              }}
              className="bg-gray-700/50 px-4 py-2 rounded-xl"
            >
              <Text className="text-gray-300 text-lg font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Update Schema</Text>
            <TouchableOpacity 
              onPress={handleUpdateSchema}
              className="bg-indigo-600 px-6 py-2 rounded-xl"
            >
              <Text className="text-white text-lg font-semibold">Save</Text>
            </TouchableOpacity>
          </View>

          {/* Mode Toggle */}
          <View className="px-6 mb-6">
            <View className="bg-gray-800/60 rounded-2xl p-2 flex-row border border-gray-600/50">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl ${schemaEditMode === 'json' ? 'bg-indigo-600' : 'bg-transparent'}`}
                onPress={() => setSchemaEditMode('json')}
              >
                <Text className={`text-center font-semibold ${schemaEditMode === 'json' ? 'text-white' : 'text-gray-300'}`}>
                  JSON View
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl ${schemaEditMode === 'form' ? 'bg-indigo-600' : 'bg-transparent'}`}
                onPress={() => setSchemaEditMode('form')}
              >
                <Text className={`text-center font-semibold ${schemaEditMode === 'form' ? 'text-white' : 'text-gray-300'}`}>
                  Form View
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-6">
            {/* Basic Info Fields */}
            <View className="space-y-6 mb-6">
              <View>
                <Text className="text-gray-200 font-semibold mb-3 text-lg">Display Name</Text>
                <TextInput
                  className="bg-gray-800/60 rounded-2xl px-5 py-4 text-white border border-gray-600/50 text-lg"
                  placeholder="Enter display name"
                  placeholderTextColor="#9CA3AF"
                  value={updateSchemaForm.displayName || ''}
                  onChangeText={(text) => setUpdateSchemaForm(prev => ({ ...prev, displayName: text }))}
                />
              </View>

              <View>
                <Text className="text-gray-200 font-semibold mb-3 text-lg">Description</Text>
                <TextInput
                  className="bg-gray-800/60 rounded-2xl px-5 py-4 text-white border border-gray-600/50"
                  placeholder="Enter description"
                  placeholderTextColor="#9CA3AF"
                  value={updateSchemaForm.description || ''}
                  onChangeText={(text) => setUpdateSchemaForm(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            {/* JSON View */}
            {schemaEditMode === 'json' && (
              <View>
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-gray-200 font-bold text-xl">JSON Schema Editor</Text>
                  <View className="flex-row space-x-3">
                    <TouchableOpacity 
                      onPress={handleValidateSchema}
                      className="bg-emerald-600 px-5 py-3 rounded-xl shadow-lg"
                    >
                      <Text className="text-white text-sm font-semibold">Validate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => {
                        const sampleSchema = {
                          "type": "object",
                          "properties": {
                            "name": {
                              "type": "string",
                              "description": "Item name"
                            },
                            "price": {
                              "type": "number",
                              "minimum": 0,
                              "description": "Item price"
                            },
                            "description": {
                              "type": "string",
                              "description": "Optional description"
                            }
                          },
                          "required": ["name", "price"],
                          "additionalProperties": false
                        };
                        setJsonSchemaText(JSON.stringify(sampleSchema, null, 2));
                      }}
                      className="bg-indigo-600 px-5 py-3 rounded-xl shadow-lg"
                    >
                      <Text className="text-white text-sm font-semibold">Sample</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <JSONEditor
                  value={jsonSchemaText}
                  onChange={setJsonSchemaText}
                  placeholder="Enter your JSON schema here..."
                />
                
                {jsonValidationError && (
                  <View className="bg-red-900/30 border border-red-500/50 rounded-2xl p-4 mt-4">
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="alert-circle" size={20} color="#EF4444" />
                      <Text className="text-red-400 font-bold ml-3 text-lg">Validation Error</Text>
                    </View>
                    <Text className="text-red-200 text-sm leading-relaxed">{jsonValidationError}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Form View */}
            {schemaEditMode === 'form' && (
              <View>
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-gray-200 font-bold text-xl">Schema Fields</Text>
                  <View className="bg-indigo-600/20 px-4 py-2 rounded-xl border border-indigo-500/30">
                    <Text className="text-indigo-300 text-sm font-semibold">
                      {localSchemaChanges?.properties ? Object.keys(localSchemaChanges.properties).length : 0} fields
                    </Text>
                  </View>
                </View>
                
                {localSchemaChanges?.properties && Object.entries(localSchemaChanges.properties).map(([fieldName, fieldDef]: [string, any]) => (
                  <View key={fieldName} className="bg-gray-800/60 rounded-2xl p-5 mb-4 border border-gray-600/50 shadow-lg">
                    {editingField === fieldName ? (
                      // Edit Field Mode
                      <View>
                        <View className="flex-row justify-between items-center mb-4">
                          <Text className="text-white font-semibold text-lg">Edit Field: {fieldName}</Text>
                          <TouchableOpacity 
                            onPress={() => {
                              setEditingField(null);
                              setEditingFieldData(null);
                            }}
                            className="bg-gray-600/80 px-4 py-2 rounded-xl"
                          >
                            <Text className="text-gray-200 text-sm font-medium">Cancel</Text>
                          </TouchableOpacity>
                        </View>
                        
                        <View className="space-y-5">
                          <View>
                            <Text className="text-gray-200 font-medium mb-3">Field Type</Text>
                            <View className="bg-gray-700/50 rounded-xl p-1 flex-row">
                              {['string', 'number', 'integer', 'boolean'].map((type) => (
                                <TouchableOpacity
                                  key={type}
                                  className={`flex-1 py-3 rounded-lg ${editingFieldData?.type === type ? 'bg-indigo-600' : 'bg-transparent'}`}
                                  onPress={() => setEditingFieldData((prev: any) => ({ ...prev, type }))}
                                >
                                  <Text className={`text-center text-sm font-medium ${editingFieldData?.type === type ? 'text-white' : 'text-gray-300'}`}>
                                    {type}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                          
                          <View>
                            <Text className="text-gray-200 font-medium mb-3">Description</Text>
                            <TextInput
                              className="bg-gray-700/50 rounded-xl px-4 py-3 text-white border border-gray-600/50"
                              placeholder="Enter field description"
                              placeholderTextColor="#9CA3AF"
                              value={editingFieldData?.description || ''}
                              onChangeText={(text) => setEditingFieldData((prev: any) => ({ ...prev, description: text }))}
                              multiline
                              numberOfLines={3}
                            />
                          </View>
                          
                          <View>
                            <TouchableOpacity
                              className={`flex-row items-center p-4 rounded-xl border ${editingFieldData?.required ? 'bg-indigo-600/20 border-indigo-500' : 'bg-gray-700/50 border-gray-600/50'}`}
                              onPress={() => setEditingFieldData((prev: any) => ({ ...prev, required: !prev.required }))}
                            >
                              <Ionicons 
                                name={editingFieldData?.required ? "checkmark-circle" : "ellipse-outline"} 
                                size={22} 
                                color={editingFieldData?.required ? "#6366F1" : "#9CA3AF"} 
                              />
                              <Text className="text-white font-medium ml-3">Required Field</Text>
                            </TouchableOpacity>
                          </View>
                          
                          <View className="flex-row space-x-3 pt-2">
                            <TouchableOpacity 
                              onPress={() => handleUpdateField(fieldName, editingFieldData)}
                              className="flex-1 bg-emerald-600 rounded-xl py-4 items-center shadow-lg"
                            >
                              <Text className="text-white font-semibold">Save Changes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handleDeleteField(fieldName)}
                              className="flex-1 bg-rose-600 rounded-xl py-4 items-center shadow-lg"
                            >
                              <Text className="text-white font-semibold">Delete Field</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ) : (
                      // Display Mode
                      <View>
                        <View className="flex-row justify-between items-start">
                          <View className="flex-1">
                            <View className="flex-row items-center mb-2">
                              <Text className="text-white text-lg font-semibold mr-3">{fieldName}</Text>
                              <View className={`px-3 py-1 rounded-full`} style={{ backgroundColor: getFieldTypeColor(fieldDef.type) + '25' }}>
                                <Text className={`text-xs font-semibold`} style={{ color: getFieldTypeColor(fieldDef.type) }}>
                                  {fieldDef.type}
                                </Text>
                              </View>
                            </View>
                            {fieldDef.description && (
                              <Text className="text-gray-300 text-sm mb-3 leading-relaxed">{fieldDef.description}</Text>
                            )}
                            <View className="flex-row items-center">
                              <Ionicons 
                                name={localSchemaChanges?.required?.includes(fieldName) ? "checkmark-circle" : "ellipse-outline"} 
                                size={18} 
                                color={localSchemaChanges?.required?.includes(fieldName) ? "#10B981" : "#6B7280"} 
                              />
                              <Text className="text-gray-300 text-sm ml-2 font-medium">
                                {localSchemaChanges?.required?.includes(fieldName) ? 'Required' : 'Optional'}
                              </Text>
                            </View>
                          </View>
                          <View className="flex-row space-x-3">
                            <TouchableOpacity 
                              onPress={() => {
                                setEditingField(fieldName);
                                setEditingFieldData({ 
                                  type: fieldDef.type,
                                  description: fieldDef.description || '',
                                  required: localSchemaChanges?.required?.includes(fieldName) || false
                                });
                              }}
                              className="px-3 py-2"
                              activeOpacity={0.7}
                            >
                              <Ionicons name="create-outline" size={20} color="#60A5FA" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handleDeleteField(fieldName)}
                              className="px-3 py-2"
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash-outline" size={20} color="#F87171" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
                
                {!showAddFieldForm ? (
                  <TouchableOpacity 
                    onPress={() => { setShowAddFieldForm(true); if (draftFields.length === 0) addEmptyDraft(); }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 items-center border-2 border-dashed border-indigo-400/50 shadow-lg"
                    activeOpacity={0.8}
                  >
                    <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mb-3">
                      <Ionicons name="add-outline" size={28} color="#fff" />
                    </View>
                    <Text className="text-white font-bold text-lg mb-1">Add New Field</Text>
                    <Text className="text-indigo-200 text-sm text-center">Click to add a new field to your schema</Text>
                  </TouchableOpacity>
                ) : (
                  <View>
                    {draftFields.map(d => (
                      <View key={d.id} className="bg-indigo-900/30 rounded-2xl p-5 mb-4 border border-indigo-500/30">
                        <View className="flex-row justify-between items-center mb-4">
                          <Text className="text-white font-bold text-lg">New Field</Text>
                          <View className="flex-row space-x-2">
                            <TouchableOpacity onPress={() => removeDraft(d.id)} className="bg-gray-600/80 px-3 py-2 rounded-xl">
                              <Text className="text-gray-200 text-sm font-medium">Remove</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => submitDraft(d.id)} className="bg-emerald-600 px-3 py-2 rounded-xl">
                              <Text className="text-white text-sm font-medium">Add</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View className="mb-3">
                          <Text className="text-gray-200 font-semibold mb-2">Field Name *</Text>
                          <TextInput
                            className="bg-gray-800/60 rounded-2xl px-5 py-4 text-white border border-gray-600/50 text-base"
                            placeholder="Enter field name"
                            placeholderTextColor="#9CA3AF"
                            value={d.fieldName}
                            onChangeText={(text) => updateDraft(d.id, { fieldName: text })}
                            autoCorrect={false}
                            autoCapitalize="none"
                            underlineColorAndroid="transparent"
                          />
                        </View>

                        <View className="mb-3">
                          <Text className="text-gray-200 font-semibold mb-2">Field Type *</Text>
                          <View className="bg-gray-800/60 rounded-2xl p-2 flex-row border border-gray-600/50">
                            {(['string','number','integer','boolean'] as const).map(type => (
                              <Pressable key={type} className={`flex-1 py-3 rounded-xl ${d.fieldType === type ? 'bg-indigo-600' : 'bg-transparent'}`} onPress={() => updateDraft(d.id, { fieldType: type })} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                                <Text className={`text-center text-sm font-semibold ${d.fieldType === type ? 'text-white' : 'text-gray-300'}`}>{type}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>

                        <View className="mb-3">
                          <Text className="text-gray-200 font-semibold mb-2">Description</Text>
                          <TextInput
                            className="bg-gray-800/60 rounded-2xl px-5 py-4 text-white border border-gray-600/50 text-base"
                            placeholder="Enter field description"
                            placeholderTextColor="#9CA3AF"
                            value={d.fieldDescription}
                            onChangeText={(text) => updateDraft(d.id, { fieldDescription: text })}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            autoCorrect={false}
                            underlineColorAndroid="transparent"
                          />
                        </View>

                        <View className="mb-1">
                          <TouchableOpacity className={`flex-row items-center p-4 rounded-xl border ${d.isRequired ? 'bg-indigo-600/20 border-indigo-500' : 'bg-gray-800/60 border-gray-600/50'}`} onPress={() => updateDraft(d.id, { isRequired: !d.isRequired })} activeOpacity={0.7}>
                            <Ionicons name={d.isRequired ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={d.isRequired ? '#6366F1' : '#9CA3AF'} />
                            <View className="ml-3">
                              <Text className="text-white font-semibold text-base">Required Field</Text>
                              <Text className="text-gray-300 text-sm">This field must be provided when creating entries</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    <TouchableOpacity onPress={addEmptyDraft} className="bg-indigo-600/20 rounded-2xl p-4 items-center border border-indigo-500/40" activeOpacity={0.8}>
                      <Text className="text-indigo-300 font-semibold">+ Add another field</Text>
                    </TouchableOpacity>

                    <View className="mt-4">
                      <TouchableOpacity onPress={() => setShowAddFieldForm(false)} className="rounded-2xl p-4 items-center bg-gray-600" activeOpacity={0.8}>
                        <Text className="text-white font-semibold">Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
                {/* Save Changes Button */}
                <View className="mt-6 pt-4 border-t border-gray-600/50">
                  <TouchableOpacity 
                    onPress={saveChanges}
                    className={`rounded-2xl p-4 items-center shadow-lg ${hasUnsavedChanges ? 'bg-emerald-600' : 'bg-gray-600'}`}
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-bold text-lg">
                      {hasUnsavedChanges ? 'Save Changes' : 'No Changes to Save'}
                    </Text>
                    {hasUnsavedChanges && (
                      <Text className="text-emerald-200 text-sm mt-1">
                        Click to save your changes to the schema
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  }, [showUpdateSchemaModal, updateSchemaForm, schemaEditMode, jsonSchemaText, jsonValidationError, forceRefresh, editingField, editingFieldData, localSchemaChanges, hasUnsavedChanges, showAddFieldForm, draftFields]);



  return (
    <ImageBackground
      source={require('../assets/background/img5.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text className="text-white text-lg font-semibold">Schema Details</Text>
          
          <TouchableOpacity 
            onPress={() => {
              console.log('Test button pressed - opening update schema modal');
              handleUpdate();
            }}
            className="w-10 h-10 rounded-full bg-green-600 items-center justify-center"
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchSchemaDetails}
              tintColor="#4F46E5"
              colors={['#4F46E5']}
            />
          }
        >
          {loading ? (
            <View className="bg-gray-800/50 rounded-2xl p-8 items-center mt-6">
              <Text className="text-white text-lg mb-2">Loading schema details...</Text>
              <Text className="text-gray-400 text-sm">Fetching schema information</Text>
            </View>
          ) : error ? (
            <View className="bg-gray-800/50 rounded-2xl p-8 items-center mt-6">
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text className="text-red-400 text-lg mb-2 mt-4">Failed to load schema</Text>
              <Text className="text-gray-400 text-sm text-center mb-4">{error}</Text>
              <TouchableOpacity 
                onPress={fetchSchemaDetails}
                className="bg-blue-600 px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : schema ? (
            <>
          <SchemaInfoCard />
          <ActionButtons />

          {/* Tabs */}
          <View className="mb-6">
            <View
              style={{
                borderRadius: 25,
                overflow: 'hidden',
              }}
            >
              <View className="bg-gray-900/70 rounded-3xl px-6 py-2 backdrop-blur-xl border border-gray-800/50">
                <View className="flex-row items-center">
                  <TabButton title="Fields" index={0} icon="list-outline" />
                  <TabButton title="Entries" index={1} icon="document-outline" />
                  <TabButton title="Stats" index={2} icon="bar-chart-outline" />
                </View>
              </View>
            </View>
          </View>

          {/* Tab Content */}
          {activeTab === 0 && <SchemaFieldsTable />}
          {activeTab === 1 && <SchemaEntries />}
          {activeTab === 2 && <SchemaStatistics />}
            </>
          ) : (
            <View className="bg-gray-800/50 rounded-2xl p-8 items-center mt-6">
              <Ionicons name="document-outline" size={48} color="#6B7280" />
              <Text className="text-gray-400 text-lg font-medium mt-4">Schema not found</Text>
              <Text className="text-gray-500 text-sm text-center mt-2">
                The requested schema could not be found or may have been deleted
              </Text>
              <TouchableOpacity 
                onPress={() => router.back()}
                className="bg-blue-600 px-6 py-3 rounded-full mt-4"
              >
                <Text className="text-white font-semibold">Go Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Floating Action Button */}
        {schema && (
        <View className="absolute bottom-8 right-8">
          <TouchableOpacity
            activeOpacity={0.8}
              onPress={() => setShowCreateModal(true)}
            className="w-14 h-14 rounded-full bg-blue-600 items-center justify-center shadow-lg"
            style={{
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Ionicons name="add-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        )}

        {/* Modals */}
        {CreateEntryModal}
        {EditEntryModal}
        {UpdateSchemaModal}
      </View>
    </ImageBackground>
  );
};

export default SchemaDetailScreen; 