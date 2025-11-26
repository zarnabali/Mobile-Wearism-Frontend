import React, { useState, useCallback, memo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SchemaApi, CreateSchemaData } from '../src/utils/api';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// Complete template with all new features
const COMPLETE_TEMPLATE = `{
  "name": "customer",
  "displayName": "Customer",
  "description": "Customer information with contact details",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Customer name"
      },
      "email": {
        "type": "string",
        "description": "Primary email address"
      },
      "phone": {
        "type": "string",
        "description": "Primary phone number"
      },
      "address": {
        "type": "string",
        "description": "Full address"
      },
      "company": {
        "type": "string",
        "description": "Company name"
      }
    },
    "required": ["name", "email"]
  },
  "fieldMapping": {
    "email": "email_field",
    "phone": "phone_field",
    "address": "location_field"
  },
  "viewConfig": {
    "viewType": "form",
    "formLayout": "column",
    "sections": [
      {
        "title": "Basic Information",
        "description": "Customer basic details",
        "fields": ["name", "company"]
      },
      {
        "title": "Contact Information",
        "description": "Email, phone, and address",
        "fields": ["email", "phone", "address"]
      }
    ],
    "actions": [
      {
        "id": "save",
        "label": "Save",
        "type": "submit"
      }
    ]
  }
}`;

type FieldType = 'string' | 'number' | 'integer' | 'boolean';
type WidgetType = 'none' | 'email_field' | 'phone_field' | 'location_field';
type FormTab = 'basic' | 'fields' | 'fieldMapping' | 'sections';

interface BuilderField {
  id: string;
  name: string;
  type: FieldType;
  description: string;
  required: boolean;
  min?: string;
  max?: string;
  widgetType: WidgetType;
}

interface Section {
  id: string;
  title: string;
  description: string;
  fields: string[];
}

const SchemaGeneratorV2 = () => {
  const router = useRouter();
  const scrollRef = useRef<KeyboardAwareScrollView | null>(null);

  // Mode state
  const [mode, setMode] = useState<'json' | 'builder'>('builder');
  const [builderTab, setBuilderTab] = useState<FormTab>('basic');

  // JSON editor state
  const [jsonText, setJsonText] = useState(COMPLETE_TEMPLATE);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Builder state - Basic Info
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');

  // Builder state - Fields
  const [fields, setFields] = useState<BuilderField[]>([
    {
      id: 'f1',
      name: 'name',
      type: 'string',
      description: 'Customer name',
      required: true,
      widgetType: 'none',
    },
  ]);

  // Builder state - Sections
  const [sections, setSections] = useState<Section[]>([]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSection, setNewSection] = useState({ title: '', description: '', fields: [] as string[] });

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [builderError, setBuilderError] = useState<string | null>(null);

  // ============================================
  // FIELD MANAGEMENT
  // ============================================

  const handleAddField = useCallback(() => {
    const nextIndex = fields.length + 1;
    setFields(prev => [...prev, {
      id: `f${Date.now()}`,
      name: '',
      type: 'string',
      description: '',
      required: false,
      widgetType: 'none',
    }]);
  }, [fields.length]);

  const handleUpdateField = useCallback((id: string, updates: Partial<BuilderField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const handleRemoveField = useCallback((id: string) => {
    const field = fields.find(f => f.id === id);
    if (field) {
      // Remove from sections too
      setSections(prev => prev.map(s => ({
        ...s,
        fields: s.fields.filter(fname => fname !== field.name)
      })));
    }
    setFields(prev => prev.filter(f => f.id !== id));
  }, [fields]);

  // ============================================
  // SECTION MANAGEMENT
  // ============================================

  const handleAddSection = () => {
    if (!newSection.title.trim()) {
      Alert.alert('Error', 'Section title is required');
      return;
    }
    setSections(prev => [...prev, { ...newSection, id: `s${Date.now()}` }]);
    setNewSection({ title: '', description: '', fields: [] });
    setShowAddSection(false);
  };

  const handleRemoveSection = (id: string) => {
    Alert.alert(
      'Delete Section',
      'Are you sure you want to delete this section?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setSections(prev => prev.filter(s => s.id !== id)),
        },
      ]
    );
  };

  const handleAddFieldToSection = (sectionId: string, fieldName: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId && !s.fields.includes(fieldName)) {
        return { ...s, fields: [...s.fields, fieldName] };
      }
      return s;
    }));
  };

  const handleRemoveFieldFromSection = (sectionId: string, fieldName: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        return { ...s, fields: s.fields.filter(f => f !== fieldName) };
      }
      return s;
    }));
  };

  // ============================================
  // JSON GENERATION
  // ============================================

  const buildJsonFromBuilder = () => {
    // Validate
    if (!name.trim() || !displayName.trim()) {
      setBuilderError('Name and display name are required');
      return null;
    }

    const validFields = fields.filter(f => f.name.trim());
    if (validFields.length === 0) {
      setBuilderError('At least one field is required');
      return null;
    }

    // Build properties
    const properties: any = {};
    const required: string[] = [];
    const fieldMapping: any = {};

    validFields.forEach(f => {
      const fieldName = f.name.trim();
      const fieldDef: any = {
        type: f.type,
        description: f.description || ''
      };

      if ((f.type === 'number' || f.type === 'integer') && f.min) {
        fieldDef.minimum = Number(f.min);
      }
      if ((f.type === 'number' || f.type === 'integer') && f.max) {
        fieldDef.maximum = Number(f.max);
      }

      properties[fieldName] = fieldDef;
      if (f.required) required.push(fieldName);
      if (f.widgetType !== 'none') fieldMapping[fieldName] = f.widgetType;
    });

    // Build schema object
    const schemaData: any = {
      name: name.trim(),
      displayName: displayName.trim(),
      description: description.trim() || '',
      jsonSchema: {
        type: 'object',
        properties,
        required,
      },
    };

    // Add field mapping if any
    if (Object.keys(fieldMapping).length > 0) {
      schemaData.fieldMapping = fieldMapping;
    }

    // Add view config if sections exist
    if (sections.length > 0) {
      schemaData.viewConfig = {
        viewType: 'form',
        formLayout: 'column',
        sections: sections.map(s => ({
          title: s.title,
          description: s.description,
          fields: s.fields,
        })),
        actions: [
          { id: 'save', label: 'Save', type: 'submit' }
        ],
      };
    }

    setBuilderError(null);
    return schemaData;
  };

  const handleGenerateJson = () => {
    const schemaData = buildJsonFromBuilder();
    if (schemaData) {
      setJsonText(JSON.stringify(schemaData, null, 2));
      setMode('json');
      Alert.alert('Success', 'Schema JSON generated! Review in JSON editor.');
    }
  };

  // ============================================
  // SCHEMA CREATION
  // ============================================

  const handleCreateFromJson = async () => {
    try {
      const parsed = JSON.parse(jsonText);

      if (!parsed.name || !parsed.displayName || !parsed.jsonSchema) {
        setJsonError('Required fields: name, displayName, jsonSchema');
        return;
      }

      setIsCreating(true);
      setJsonError(null);

      await SchemaApi.createSchema(parsed);

      Alert.alert(
        'Success!',
        `Schema "${parsed.displayName}" created successfully!`,
        [
          {
            text: 'View Schema',
            onPress: () => router.push(`/schema-detail?schemaName=${parsed.name}`)
          },
          {
            text: 'Create Another',
            onPress: () => {
              setJsonText(COMPLETE_TEMPLATE);
              setJsonError(null);
            }
          }
        ]
      );
    } catch (error: any) {
      setJsonError(error.message || 'Failed to create schema');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateFromBuilder = async () => {
    try {
      const schemaData = buildJsonFromBuilder();
      if (!schemaData) return;

      setIsCreating(true);

      await SchemaApi.createSchema(schemaData);

      Alert.alert(
        'Success!',
        `Schema "${schemaData.displayName}" created successfully!`,
        [
          {
            text: 'View Schema',
            onPress: () => router.push(`/schema-detail?schemaName=${schemaData.name}`)
          },
          {
            text: 'Create Another',
            onPress: () => {
              setName('');
              setDisplayName('');
              setDescription('');
              setFields([{
                id: 'f1',
                name: '',
                type: 'string',
                description: '',
                required: false,
                widgetType: 'none',
              }]);
              setSections([]);
              setBuilderError(null);
            }
          }
        ]
      );
    } catch (error: any) {
      setBuilderError(error.message || 'Failed to create schema');
    } finally {
      setIsCreating(false);
    }
  };

  const handleValidateJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.name || !parsed.displayName || !parsed.jsonSchema) {
        setJsonError('Required: name, displayName, jsonSchema');
        return;
      }
      setJsonError(null);
      Alert.alert('Valid!', 'Your schema JSON is valid.');
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON');
    }
  };

  // ============================================
  // RENDER COMPONENTS
  // ============================================

  const TabButton = ({ id, title, icon }: { id: FormTab; title: string; icon: string }) => (
    <TouchableOpacity
      onPress={() => setBuilderTab(id)}
      className={`flex-row items-center px-3 py-1.5 rounded-lg border ${
        builderTab === id
          ? 'bg-indigo-600 border-indigo-500'
          : 'bg-gray-800/40 border-gray-600/30'
      }`}
      activeOpacity={0.7}
      style={{ minHeight: 32 }}
    >
      <Ionicons
        name={icon as any}
        size={16}
        color={builderTab === id ? '#FFFFFF' : '#9CA3AF'}
      />
      <Text className={`ml-1.5 text-xs ${builderTab === id ? 'text-white font-semibold' : 'text-gray-400 font-medium'}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderBasicTab = () => (
    <View>
      <Text className="text-white text-lg font-bold mb-4">Basic Information</Text>

      <View className="mb-4">
        <Text className="text-gray-200 font-semibold mb-2 text-sm">Schema Name *</Text>
        <TextInput
          className="bg-gray-800/60 rounded-xl px-4 py-3 text-white border border-gray-600/50 text-sm"
          placeholder="e.g., customer (lowercase, no spaces)"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-200 font-semibold mb-2 text-sm">Display Name *</Text>
        <TextInput
          className="bg-gray-800/60 rounded-xl px-4 py-3 text-white border border-gray-600/50 text-sm"
          placeholder="e.g., Customer"
          placeholderTextColor="#9CA3AF"
          value={displayName}
          onChangeText={setDisplayName}
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-200 font-semibold mb-2 text-sm">Description</Text>
        <TextInput
          className="bg-gray-800/60 rounded-xl px-4 py-3 text-white border border-gray-600/50 text-sm"
          placeholder="Brief description of this schema"
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30">
        <View className="flex-row items-center mb-2">
          <Ionicons name="information-circle" size={18} color="#60A5FA" />
          <Text className="text-blue-300 font-semibold ml-2 text-sm">Quick Start</Text>
        </View>
        <Text className="text-gray-300 text-xs leading-relaxed">
          Start by defining your schema name and display name. Then add fields in the Fields tab.
        </Text>
      </View>
    </View>
  );

  const renderFieldsTab = () => (
    <View>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-lg font-bold">Schema Fields</Text>
        <TouchableOpacity
          onPress={handleAddField}
          className="bg-indigo-600 px-3 py-1.5 rounded-lg"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-xs">Add Field</Text>
        </TouchableOpacity>
      </View>

      {fields.map((field) => (
        <View key={field.id} className="bg-gray-800/60 rounded-xl p-4 mb-3 border border-gray-600/50">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 mr-2">
              <Text className="text-white font-semibold text-sm mb-2">Field Name *</Text>
              <TextInput
                className="bg-gray-700/50 rounded-lg px-3 py-2 text-white border border-gray-600/50 text-sm"
                placeholder="e.g., email"
                placeholderTextColor="#9CA3AF"
                value={field.name}
                onChangeText={(text) => handleUpdateField(field.id, { name: text })}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveField(field.id)}
              className="p-1.5 mt-6"
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color="#F87171" />
            </TouchableOpacity>
          </View>

          <View className="mb-3">
            <Text className="text-gray-300 text-xs font-medium mb-2">Description</Text>
            <TextInput
              className="bg-gray-700/50 rounded-lg px-3 py-2 text-white border border-gray-600/50 text-xs"
              placeholder="Field description"
              placeholderTextColor="#9CA3AF"
              value={field.description}
              onChangeText={(text) => handleUpdateField(field.id, { description: text })}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          <View className="mb-3">
            <Text className="text-gray-300 text-xs font-medium mb-2">Field Type</Text>
            <View className="bg-gray-700/50 rounded-lg p-1 flex-row">
              {(['string', 'number', 'integer', 'boolean'] as FieldType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`flex-1 py-2 rounded-lg ${field.type === type ? 'bg-indigo-600' : ''}`}
                  onPress={() => handleUpdateField(field.id, { type })}
                  activeOpacity={0.7}
                >
                  <Text className={`text-center text-xs ${field.type === type ? 'text-white font-semibold' : 'text-gray-300'}`}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {(field.type === 'number' || field.type === 'integer') && (
            <View className="flex-row mb-3" style={{ gap: 8 }}>
              <View className="flex-1">
                <Text className="text-gray-300 text-xs font-medium mb-2">Min</Text>
                <TextInput
                  className="bg-gray-700/50 rounded-lg px-3 py-2 text-white border border-gray-600/50 text-xs"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={field.min}
                  onChangeText={(text) => handleUpdateField(field.id, { min: text })}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-300 text-xs font-medium mb-2">Max</Text>
                <TextInput
                  className="bg-gray-700/50 rounded-lg px-3 py-2 text-white border border-gray-600/50 text-xs"
                  placeholder="9999"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={field.max}
                  onChangeText={(text) => handleUpdateField(field.id, { max: text })}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            className={`flex-row items-center p-3 rounded-lg border ${field.required ? 'bg-indigo-600/20 border-indigo-500' : 'bg-gray-700/50 border-gray-600/50'}`}
            onPress={() => handleUpdateField(field.id, { required: !field.required })}
            activeOpacity={0.7}
          >
            <Ionicons
              name={field.required ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={field.required ? '#6366F1' : '#9CA3AF'}
            />
            <Text className="text-white font-medium ml-2 text-xs">Required Field</Text>
          </TouchableOpacity>
        </View>
      ))}

      {fields.length === 0 && (
        <View className="bg-gray-800/60 rounded-xl p-6 items-center">
          <Ionicons name="list-outline" size={40} color="#6B7280" />
          <Text className="text-gray-400 text-center mt-3 text-xs">
            No fields yet. Add your first field to get started.
          </Text>
        </View>
      )}
    </View>
  );

  const renderFieldMappingTab = () => {
    const availableFields = fields.filter(f => f.name.trim());

    return (
      <View>
        <Text className="text-white text-lg font-bold mb-3">Field Mapping</Text>
        <Text className="text-gray-400 text-xs mb-4">
          Map fields to widget types for automatic validation and actions
        </Text>

        {availableFields.map((field) => (
          <View key={field.id} className="bg-gray-800/60 rounded-xl p-3 mb-3 border border-gray-600/50">
            <Text className="text-white font-semibold mb-2 text-sm">{field.name}</Text>
            <View className="bg-gray-700/50 rounded-lg p-1">
              {(['none', 'email_field', 'phone_field', 'location_field'] as WidgetType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`py-2 px-3 rounded-lg mb-1 ${field.widgetType === type ? 'bg-indigo-600' : ''}`}
                  onPress={() => handleUpdateField(field.id, { widgetType: type })}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name={
                        type === 'email_field' ? 'mail' :
                        type === 'phone_field' ? 'call' :
                        type === 'location_field' ? 'location' : 'close-circle'
                      }
                      size={16}
                      color={field.widgetType === type ? '#FFFFFF' : '#9CA3AF'}
                    />
                    <Text className={`ml-2.5 text-xs ${field.widgetType === type ? 'text-white font-semibold' : 'text-gray-300'}`}>
                      {type === 'none' ? 'No Mapping' :
                       type === 'email_field' ? 'Email Field' :
                       type === 'phone_field' ? 'Phone Field' : 'Location Field'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {availableFields.length === 0 && (
          <View className="bg-gray-800/60 rounded-xl p-6 items-center">
            <Ionicons name="link-outline" size={40} color="#6B7280" />
            <Text className="text-gray-400 text-center mt-3 text-xs">
              Add fields first in the Fields tab, then map them here.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSectionsTab = () => {
    const availableFields = fields.filter(f => f.name.trim()).map(f => f.name.trim());

    return (
      <View>
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">View Sections</Text>
            <Text className="text-gray-400 text-xs mt-1">Organize fields into sections (Optional)</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddSection(true)}
            className="bg-indigo-600 px-3 py-1.5 rounded-lg"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-xs">Add Section</Text>
          </TouchableOpacity>
        </View>

        {sections.map((section) => (
          <View key={section.id} className="bg-gray-800/60 rounded-xl p-4 mb-3 border border-gray-600/50">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 mr-2">
                <Text className="text-white font-semibold text-base">{section.title}</Text>
                {section.description && (
                  <Text className="text-gray-400 text-xs mt-1">{section.description}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveSection(section.id)}
                className="p-1.5"
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#F87171" />
              </TouchableOpacity>
            </View>

            <View className="mb-3">
              <Text className="text-gray-300 text-xs font-medium mb-2">Fields in this section:</Text>
              <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                {section.fields.length > 0 ? (
                  section.fields.map((fieldName) => (
                    <View key={fieldName} className="bg-indigo-600/20 border border-indigo-500/30 rounded-lg px-2.5 py-1.5 flex-row items-center">
                      <Text className="text-indigo-300 text-xs mr-1.5">{fieldName}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveFieldFromSection(section.id, fieldName)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={14} color="#818CF8" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-500 text-xs italic">No fields added yet</Text>
                )}
              </View>
            </View>

            <View>
              <Text className="text-gray-300 text-xs font-medium mb-2">Add field to section:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row" style={{ gap: 6 }}>
                  {availableFields
                    .filter(f => !section.fields.includes(f))
                    .map((fieldName) => (
                      <TouchableOpacity
                        key={fieldName}
                        onPress={() => handleAddFieldToSection(section.id, fieldName)}
                        className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-2.5 py-1.5"
                        activeOpacity={0.7}
                      >
                        <Text className="text-gray-300 text-xs">{fieldName}</Text>
                      </TouchableOpacity>
                    ))}
                  {availableFields.filter(f => !section.fields.includes(f)).length === 0 && (
                    <Text className="text-gray-500 text-xs italic">All fields added</Text>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        ))}

        {sections.length === 0 && (
          <View className="bg-gray-800/60 rounded-xl p-8 mb-4 border border-gray-600/50 items-center">
            <Ionicons name="albums-outline" size={40} color="#6B7280" />
            <Text className="text-gray-400 text-center mt-3 text-sm">
              No sections configured yet. Sections are optional.
            </Text>
          </View>
        )}

        {/* Add Section Modal */}
        {showAddSection && (
          <View className="bg-indigo-900/30 rounded-xl p-4 mb-4 border border-indigo-500/30">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-bold text-base">New Section</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddSection(false);
                  setNewSection({ title: '', description: '', fields: [] });
                }}
                className="bg-gray-600/80 px-2.5 py-1.5 rounded-lg"
                activeOpacity={0.7}
              >
                <Text className="text-gray-200 text-xs">Cancel</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-3">
              <Text className="text-gray-200 font-medium mb-2 text-sm">Section Title *</Text>
              <TextInput
                className="bg-gray-800/60 rounded-xl px-4 py-2.5 text-white border border-gray-600/50 text-sm"
                placeholder="e.g., Contact Information"
                placeholderTextColor="#9CA3AF"
                value={newSection.title}
                onChangeText={(text) => setNewSection({ ...newSection, title: text })}
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-200 font-medium mb-2 text-sm">Description (Optional)</Text>
              <TextInput
                className="bg-gray-800/60 rounded-xl px-4 py-2.5 text-white border border-gray-600/50 text-sm"
                placeholder="Brief description"
                placeholderTextColor="#9CA3AF"
                value={newSection.description}
                onChangeText={(text) => setNewSection({ ...newSection, description: text })}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              onPress={handleAddSection}
              className="bg-emerald-600 rounded-xl py-2.5"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-center text-sm">Add Section</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={18} color="#60A5FA" />
            <Text className="text-blue-300 font-semibold ml-2 text-sm">Optional Feature</Text>
          </View>
          <Text className="text-gray-300 text-xs leading-relaxed">
            Sections help organize your form fields into logical groups. If you don't configure sections,
            the system will display all fields in a single form.
          </Text>
        </View>
      </View>
    );
  };

  const renderBuilder = () => (
    <View>
      {builderError && (
        <View className="bg-red-900/30 rounded-xl p-3 mb-4 border border-red-500/50">
          <View className="flex-row items-center">
            <Ionicons name="alert-circle" size={18} color="#F87171" />
            <Text className="text-red-300 ml-2 text-sm">{builderError}</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View className="mb-4">
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          <TabButton id="basic" title="Basic Info" icon="information-circle" />
          <TabButton id="fields" title="Fields" icon="list" />
          <TabButton id="fieldMapping" title="Mapping" icon="link" />
          <TabButton id="sections" title="Sections" icon="albums" />
        </View>
      </View>

      {/* Tab Content */}
      {builderTab === 'basic' && renderBasicTab()}
      {builderTab === 'fields' && renderFieldsTab()}
      {builderTab === 'fieldMapping' && renderFieldMappingTab()}
      {builderTab === 'sections' && renderSectionsTab()}

      {/* Actions */}
      <View className="flex-row mt-6" style={{ gap: 8 }}>
        <TouchableOpacity
          onPress={handleGenerateJson}
          className="flex-1 bg-indigo-600 rounded-xl py-2.5"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-center text-sm">Generate JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCreateFromBuilder}
          className="flex-1 bg-emerald-600 rounded-xl py-2.5 flex-row items-center justify-center"
          activeOpacity={0.8}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text className="text-white font-semibold text-sm">Create Schema</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderJsonEditor = () => {
    const lineNumbers = jsonText.split('\n').length;
    const lineNumberArray = Array.from({ length: lineNumbers }, (_, i) => `${i + 1}`);

    return (
      <View>
        {jsonError && (
          <View className="bg-red-900/30 rounded-xl p-3 mb-4 border border-red-500/50">
            <View className="flex-row items-center">
              <Ionicons name="alert-circle" size={18} color="#F87171" />
              <Text className="text-red-300 ml-2 text-sm">{jsonError}</Text>
            </View>
          </View>
        )}

        <View className="flex-row mb-4" style={{ gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowGuide(true)}
            className="flex-1 bg-gray-700/50 rounded-lg py-2 flex-row items-center justify-center border border-gray-600/50"
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle-outline" size={16} color="#60A5FA" style={{ marginRight: 6 }} />
            <Text className="text-blue-400 text-xs font-medium">Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleValidateJson}
            className="flex-1 bg-gray-700/50 rounded-lg py-2 flex-row items-center justify-center border border-gray-600/50"
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" style={{ marginRight: 6 }} />
            <Text className="text-white text-xs font-medium">Validate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCreateFromJson}
            className="flex-1 bg-emerald-600 rounded-lg py-2 flex-row items-center justify-center"
            activeOpacity={0.8}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text className="text-white text-xs font-semibold">Create</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden flex-row">
          <View className="bg-gray-900/80 px-2 py-3 items-end" style={{ width: 44 }}>
            {lineNumberArray.map(n => (
              <Text key={n} className="text-gray-500 text-xs" style={{ fontFamily: 'monospace', lineHeight: 20 }}>
                {n}
              </Text>
            ))}
          </View>
          <TextInput
            className="flex-1 text-white px-3 py-3 text-xs"
            value={jsonText}
            onChangeText={setJsonText}
            multiline
            style={{
              fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
              lineHeight: 20,
              minHeight: 400,
              textAlignVertical: 'top',
            }}
            placeholder="Enter your JSON schema here..."
            placeholderTextColor="#6B7280"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
          />
        </View>
      </View>
    );
  };

  // Guide Modal with comprehensive examples
  const GuideModal = () => (
    <Modal visible={showGuide} animationType="fade" transparent>
      <View className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="bg-gray-900 rounded-2xl w-full max-w-lg border border-gray-800" style={{ maxHeight: '90%' }}>
          <View className="flex-row justify-between items-center p-5 border-b border-gray-800">
            <Text className="text-white text-lg font-bold">Schema Format Guide</Text>
            <TouchableOpacity
              onPress={() => setShowGuide(false)}
              className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center"
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
            <Text className="text-gray-300 mb-4 text-sm">
              A complete schema includes basic info, fields, field mapping, and optional sections.
            </Text>

            {/* Basic Structure */}
            <View className="mb-4">
              <Text className="text-white font-semibold mb-2">Required Fields:</Text>
              <View className="bg-gray-800 rounded-lg p-3 mb-2">
                <Text className="text-gray-300 text-xs" style={{ fontFamily: 'monospace' }}>
                  • name (lowercase, no spaces){'\n'}
                  • displayName (human-readable){'\n'}
                  • jsonSchema (field definitions)
                </Text>
              </View>
            </View>

            {/* Field Mapping */}
            <View className="mb-4">
              <Text className="text-white font-semibold mb-2">Field Mapping:</Text>
              <View className="bg-gray-800 rounded-lg p-3 mb-2">
                <Text className="text-gray-300 text-xs" style={{ fontFamily: 'monospace' }}>
                  fieldMapping: {'{'}{ '\n'}
                  {'  '}"email": "email_field",{'\n'}
                  {'  '}"phone": "phone_field",{'\n'}
                  {'  '}"address": "location_field"{'\n'}
                  {'}'}
                </Text>
              </View>
              <Text className="text-gray-400 text-xs">
                Enables validation and widget actions (Send Email, Call, View Map)
              </Text>
            </View>

            {/* View Config */}
            <View className="mb-4">
              <Text className="text-white font-semibold mb-2">View Config (Optional):</Text>
              <View className="bg-gray-800 rounded-lg p-3 mb-2">
                <Text className="text-gray-300 text-xs" style={{ fontFamily: 'monospace' }}>
                  viewConfig: {'{'}{ '\n'}
                  {'  '}viewType: "form",{'\n'}
                  {'  '}formLayout: "column",{'\n'}
                  {'  '}sections: [{'\n'}
                  {'    '}{'{'}title: "Contact", fields: [...]{'}'}{ '\n'}
                  {'  '}]{'\n'}
                  {'}'}
                </Text>
              </View>
              <Text className="text-gray-400 text-xs">
                Organizes fields into sections for better UX
              </Text>
            </View>

            {/* Complete Example */}
            <View className="mb-4">
              <Text className="text-white font-semibold mb-2">Complete Example:</Text>
              <View className="bg-gray-800 rounded-lg p-3">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text className="text-gray-300 text-xs" style={{ fontFamily: 'monospace' }}>
                    {COMPLETE_TEMPLATE}
                  </Text>
                </ScrollView>
              </View>
            </View>

            <View className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/30 mb-4">
              <Text className="text-blue-300 text-xs font-semibold mb-1">💡 Pro Tips:</Text>
              <Text className="text-gray-300 text-xs">
                • Use Form Builder for quick setup{'\n'}
                • Map email/phone/address fields for widget actions{'\n'}
                • Add sections for organized forms{'\n'}
                • Generate JSON to see the complete structure
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowGuide(false)}
              className="bg-indigo-600 rounded-lg py-3 mb-2"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-center">Got it!</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <ImageBackground
      source={require('../assets/background/img5.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-14 pb-4 border-b border-gray-700/50">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-800/80 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <Text className="text-white text-lg font-bold">Schema Generator</Text>

          <View style={{ width: 40 }} />
        </View>

        <KeyboardAwareScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 40}
          keyboardOpeningTime={0}
        >
          {/* Mode Toggle */}
          <View className="bg-gray-800/60 rounded-2xl p-1 flex-row border border-gray-600/50 mb-4 mt-4">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-xl ${mode === 'builder' ? 'bg-indigo-600' : ''}`}
              onPress={() => setMode('builder')}
              activeOpacity={0.7}
            >
              <Text className={`text-center font-semibold text-sm ${mode === 'builder' ? 'text-white' : 'text-gray-300'}`}>
                Form Builder
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-xl ${mode === 'json' ? 'bg-indigo-600' : ''}`}
              onPress={() => setMode('json')}
              activeOpacity={0.7}
            >
              <Text className={`text-center font-semibold text-sm ${mode === 'json' ? 'text-white' : 'text-gray-300'}`}>
                JSON Editor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {mode === 'builder' ? renderBuilder() : renderJsonEditor()}
        </KeyboardAwareScrollView>

        <GuideModal />
      </View>
    </ImageBackground>
  );
};

export default SchemaGeneratorV2;

