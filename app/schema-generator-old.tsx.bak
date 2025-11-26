import React, { useMemo, useRef, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SchemaApi, CreateSchemaData } from '../src/utils/api';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width: screenWidth } = Dimensions.get('window');

const INITIAL_JSON_TEMPLATE = `{
  "name": "",
  "displayName": "",
  "description": "",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string"
      },
      "price": {
        "type": "number",
        "minimum": 0
      }
    },
    "required": [
      "name",
      "price"
    ]
  }
}`;

type FieldType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';

type BuilderField = {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  min?: string;
  max?: string;
};

type JsonEditorProps = {
  jsonText: string;
  onChangeText: (text: string) => void;
  jsonError: string | null;
  isCreating: boolean;
  onValidate: () => void;
  onCreate: () => void;
  onShowGuide: () => void;
};

type BuilderProps = {
  name: string;
  onNameChange: (text: string) => void;
  displayName: string;
  onDisplayNameChange: (text: string) => void;
  description: string;
  onDescriptionChange: (text: string) => void;
  fields: BuilderField[];
  onAddField: () => void;
  onUpdateField: (id: string, key: keyof BuilderField, value: any) => void;
  onRemoveField: (id: string) => void;
  builderError: string | null;
  isCreating: boolean;
  onGenerateJson: () => void;
  onCreateSchema: () => void;
};

// ============================================
// EXTRACTED COMPONENTS - DEFINED OUTSIDE MAIN COMPONENT
// ============================================

const JsonEditor = memo<JsonEditorProps>(({ 
  jsonText, 
  onChangeText, 
  jsonError,
  isCreating,
  onValidate,
  onCreate,
  onShowGuide
}) => {
  // Calculate line numbers inside this component to avoid parent re-renders
  const lineNumbers = useMemo(() => {
    const count = jsonText.split('\n').length;
    return Array.from({ length: count }, (_, i) => `${i + 1}`);
  }, [jsonText]);

  return (
    <View>
      {/* Header Section */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ 
          color: '#ffffff', 
          fontSize: 18, 
          fontWeight: '600', 
          marginBottom: 12 
        }}>
          JSON Editor
        </Text>
        
        {/* Action Buttons Row */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8
        }}>
          {/* Guide Button */}
          <TouchableOpacity 
            onPress={onShowGuide} 
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: '#1F2937',
              borderWidth: 1,
              borderColor: '#374151'
            }}
          >
            <Ionicons name="help-circle-outline" size={16} color="#60A5FA" style={{ marginRight: 6 }} />
            <Text style={{ color: '#60A5FA', fontSize: 14, fontWeight: '500' }}>Guide</Text>
          </TouchableOpacity>

          {/* Validate Button */}
          <TouchableOpacity 
            onPress={onValidate} 
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: '#374151',
              borderWidth: 1,
              borderColor: '#4B5563'
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>Validate</Text>
          </TouchableOpacity>

          {/* Create Button */}
          <TouchableOpacity 
            onPress={onCreate} 
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: isCreating ? '#4B5563' : '#059669',
              borderWidth: 1,
              borderColor: isCreating ? '#6B7280' : '#10B981'
            }}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>Creating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>Create</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {jsonError && (
        <View style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderWidth: 1,
          borderColor: 'rgba(239, 68, 68, 0.4)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 12
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={18} color="#f87171" />
            <Text style={{ color: '#fca5a5', marginLeft: 8, fontSize: 14 }}>{jsonError}</Text>
          </View>
        </View>
      )}

      <View style={{ 
        backgroundColor: '#111827', 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#374151',
        minHeight: 320, 
        width: '100%',
        flexDirection: 'row'
      }}>
        <View style={{ 
          width: 44, 
          backgroundColor: 'rgba(17, 24, 39, 0.8)', 
          paddingHorizontal: 8, 
          paddingVertical: 12,
          alignItems: 'flex-end'
        }}>
          {lineNumbers.map(n => (
            <Text 
              key={n} 
              style={{ 
                color: '#6B7280', 
                fontFamily: 'monospace', 
                lineHeight: 22,
                fontSize: 12
              }}
            >
              {n}
            </Text>
          ))}
        </View>
        <TextInput
          multiline
          value={jsonText}
          onChangeText={onChangeText}
          style={{
            flex: 1,
            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
            lineHeight: 22,
            minHeight: 320,
            color: '#ffffff',
            paddingHorizontal: 12,
            paddingVertical: 12,
            fontSize: 14,
            textAlignVertical: 'top',
            backgroundColor: 'transparent'
          }}
          placeholder="Enter your JSON schema here..."
          placeholderTextColor="#6B7280"
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          scrollEnabled={true}
          
          // CRITICAL PROPS FOR KEYBOARD HANDLING:
          textAlignVertical="top"
          returnKeyType="default"
          blurOnSubmit={false}
          underlineColorAndroid="transparent"
        />
      </View>
    </View>
  );
});

const Builder = memo<BuilderProps>(({ 
  name,
  onNameChange,
  displayName,
  onDisplayNameChange,
  description,
  onDescriptionChange,
  fields,
  onAddField,
  onUpdateField,
  onRemoveField,
  builderError,
  isCreating,
  onGenerateJson,
  onCreateSchema
}) => {
  return (
    <View>
      <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Form Builder</Text>

      {builderError && (
        <View style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderWidth: 1,
          borderColor: 'rgba(239, 68, 68, 0.4)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 12
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={18} color="#f87171" />
            <Text style={{ color: '#fca5a5', marginLeft: 8, fontSize: 14 }}>{builderError}</Text>
          </View>
        </View>
      )}

      <View style={{
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#374151'
      }}>
        <Text style={{ color: '#D1D5DB', marginBottom: 8, fontSize: 16, fontWeight: '500' }}>
          Schema Meta
        </Text>
        <TextInput
          style={{
            backgroundColor: '#1F2937',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: '#ffffff',
            fontSize: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#374151'
          }}
          placeholder="name (e.g., product)"
          placeholderTextColor="#6B7280"
          value={name}
          onChangeText={onNameChange}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          returnKeyType="next"
        />
        <TextInput
          style={{
            backgroundColor: '#1F2937',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: '#ffffff',
            fontSize: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#374151'
          }}
          placeholder="displayName (e.g., Product)"
          placeholderTextColor="#6B7280"
          value={displayName}
          onChangeText={onDisplayNameChange}
          autoCorrect={false}
          autoCapitalize="words"
          spellCheck={false}
          returnKeyType="next"
        />
        <TextInput
          style={{
            backgroundColor: '#1F2937',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: '#ffffff',
            fontSize: 16,
            borderWidth: 1,
            borderColor: '#374151'
          }}
          placeholder="description"
          placeholderTextColor="#6B7280"
          value={description}
          onChangeText={onDescriptionChange}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          autoCorrect={false}
          autoCapitalize="sentences"
          spellCheck={true}
          returnKeyType="default"
        />
      </View>

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
      }}>
        <Text style={{ color: '#D1D5DB', fontSize: 16 }}>Fields</Text>
        <TouchableOpacity 
          onPress={onAddField} 
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: '#2563EB'
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 14 }}>+ Add Field</Text>
        </TouchableOpacity>
      </View>

      <View>
        {fields.map((f) => (
          <View key={f.id} style={{
            backgroundColor: '#111827',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#374151'
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '500' }}>Field</Text>
              <TouchableOpacity 
                onPress={() => onRemoveField(f.id)} 
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#1F2937',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#9CA3AF', marginBottom: 4, fontSize: 14 }}>Name</Text>
              <TextInput
                style={{
                  backgroundColor: '#1F2937',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: '#ffffff',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#374151'
                }}
                placeholder="e.g., price"
                placeholderTextColor="#6B7280"
                value={f.name}
                onChangeText={(t) => onUpdateField(f.id, 'name', t)}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                blurOnSubmit={true}
                returnKeyType="next"
                scrollEnabled={false}
              />
            </View>
            <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
              <View style={{ flex: 1, marginHorizontal: 4 }}>
                <Text style={{ color: '#9CA3AF', marginBottom: 4, fontSize: 14 }}>Type</Text>
                <View style={{
                  backgroundColor: '#1F2937',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: '#374151'
                }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {(['string','number','integer','boolean','object','array'] as FieldType[]).map(t => (
                      <TouchableOpacity 
                        key={t} 
                        onPress={() => onUpdateField(f.id, 'type', t)} 
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 20,
                          marginRight: 8,
                          backgroundColor: f.type === t ? '#2563EB' : '#111827'
                        }}
                      >
                        <Text style={{
                          color: f.type === t ? '#ffffff' : '#9CA3AF',
                          fontSize: 14
                        }}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              <View style={{ width: 112, marginHorizontal: 4 }}>
                <Text style={{ color: '#9CA3AF', marginBottom: 4, fontSize: 14 }}>Required</Text>
                <TouchableOpacity 
                  onPress={() => onUpdateField(f.id, 'required', !f.required)} 
                  style={{
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    borderWidth: 1,
                    backgroundColor: f.required ? '#059669' : '#1F2937',
                    borderColor: f.required ? '#10B981' : '#374151'
                  }}
                >
                  <Text style={{
                    color: f.required ? '#ffffff' : '#D1D5DB',
                    textAlign: 'center',
                    fontSize: 14
                  }}>
                    {f.required ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {(f.type === 'number' || f.type === 'integer') && (
              <View style={{ flexDirection: 'row', marginHorizontal: -4, marginTop: 12 }}>
                <View style={{ flex: 1, marginHorizontal: 4 }}>
                  <Text style={{ color: '#9CA3AF', marginBottom: 4, fontSize: 14 }}>Minimum</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#1F2937',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      color: '#ffffff',
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#374151'
                    }}
                    placeholder="e.g., 0"
                    keyboardType="numeric"
                    placeholderTextColor="#6B7280"
                    value={f.min ?? ''}
                    onChangeText={(t) => onUpdateField(f.id, 'min', t)}
                    blurOnSubmit={true}
                    returnKeyType="next"
                    scrollEnabled={false}
                  />
                </View>
                <View style={{ flex: 1, marginHorizontal: 4 }}>
                  <Text style={{ color: '#9CA3AF', marginBottom: 4, fontSize: 14 }}>Maximum</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#1F2937',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      color: '#ffffff',
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#374151'
                    }}
                    placeholder="e.g., 9999"
                    keyboardType="numeric"
                    placeholderTextColor="#6B7280"
                    value={f.max ?? ''}
                    onChangeText={(t) => onUpdateField(f.id, 'max', t)}
                    blurOnSubmit={true}
                    returnKeyType="next"
                    scrollEnabled={false}
                  />
                </View>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <TouchableOpacity 
          onPress={onGenerateJson} 
          style={{
            flex: 1,
            backgroundColor: '#2563EB',
            borderRadius: 16,
            alignItems: 'center',
            paddingVertical: 16
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Generate JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={onCreateSchema} 
          style={{
            flex: 1,
            borderRadius: 16,
            alignItems: 'center',
            paddingVertical: 16,
            backgroundColor: isCreating ? '#4B5563' : '#059669',
            flexDirection: 'row',
            justifyContent: 'center'
          }}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Create Schema</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

const SchemaGeneratorScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'json' | 'builder'>('json');
  const [showGuide, setShowGuide] = useState(false);

  // JSON editor state
  const [jsonText, setJsonText] = useState(INITIAL_JSON_TEMPLATE);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Builder state
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<BuilderField[]>([{
    id: 'f1',
    name: 'name',
    type: 'string',
    required: true,
  }, {
    id: 'f2',
    name: 'price',
    type: 'number',
    required: true,
    min: '0',
  }]);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const scrollRef = useRef<KeyboardAwareScrollView | null>(null);

  // ============================================
  // STABLE CALLBACKS WITH useCallback
  // ============================================
  
  const handleJsonTextChange = useCallback((text: string) => {
    setJsonText(text);
  }, []);
  
  const handleNameChange = useCallback((text: string) => {
    setName(text);
  }, []);
  
  const handleDisplayNameChange = useCallback((text: string) => {
    setDisplayName(text);
  }, []);
  
  const handleDescriptionChange = useCallback((text: string) => {
    setDescription(text);
  }, []);
  
  const handleAddField = useCallback(() => {
    const nextIndex = fields.length + 1;
    setFields(prev => [...prev, {
      id: `f${nextIndex}`,
      name: '',
      type: 'string',
      required: false,
    }]);
    // Note: Auto-scroll will be handled by KeyboardAwareScrollView
  }, [fields.length]);
  
  const handleUpdateField = useCallback((id: string, key: keyof BuilderField, value: any) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  }, []);
  
  const handleRemoveField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleValidateJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      // Basic validations for required top-level keys
      if (!parsed.name || !parsed.displayName || !parsed.description) {
        setJsonError('Fields "name", "displayName", and "description" are required.');
        return;
      }
      if (!parsed.jsonSchema || parsed.jsonSchema.type !== 'object') {
        setJsonError('Property "jsonSchema" with type "object" is required.');
        return;
      }
      setJsonError(null);
      Alert.alert('Valid JSON', 'Your schema JSON looks valid.');
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON');
    }
  };

  const handleCreateSchemaFromJson = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      
      // Validate required fields
      if (!parsed.name || !parsed.displayName || !parsed.description) {
        setJsonError('Fields "name", "displayName", and "description" are required.');
        return;
      }
      if (!parsed.jsonSchema || parsed.jsonSchema.type !== 'object') {
        setJsonError('Property "jsonSchema" with type "object" is required.');
        return;
      }

      setIsCreating(true);
      setJsonError(null);

      const schemaData: CreateSchemaData = {
        name: parsed.name.trim(),
        displayName: parsed.displayName.trim(),
        description: parsed.description.trim(),
        jsonSchema: parsed.jsonSchema
      };

      await SchemaApi.createSchema(schemaData);
      
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
              setJsonText(INITIAL_JSON_TEMPLATE);
              setJsonError(null);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Schema creation error:', error);
      setJsonError(error.message || 'Failed to create schema');
    } finally {
      setIsCreating(false);
    }
  };


  const buildJsonFromForm = () => {
    // Validate required meta fields
    if (!name.trim() || !displayName.trim() || !description.trim()) {
      setBuilderError('Please fill out name, displayName, and description.');
      return;
    }
    // Validate fields
    const duplicate = fields
      .map(f => f.name.trim())
      .filter(n => n)
      .reduce<{ [k: string]: number }>((acc, cur) => (acc[cur] = (acc[cur] || 0) + 1, acc), {});
    const dupKey = Object.keys(duplicate).find(k => duplicate[k] > 1);
    if (dupKey) {
      setBuilderError(`Duplicate field name: ${dupKey}`);
      return;
    }
    const properties: any = {};
    const required: string[] = [];
    fields.forEach(f => {
      const trimmed = f.name.trim();
      if (!trimmed) return;
      const schema: any = { type: f.type };
      if ((f.type === 'number' || f.type === 'integer') && f.min) schema.minimum = Number(f.min);
      if ((f.type === 'number' || f.type === 'integer') && f.max) schema.maximum = Number(f.max);
      properties[trimmed] = schema;
      if (f.required) required.push(trimmed);
    });
    const output = {
      name: name.trim(),
      displayName: displayName.trim(),
      description: description.trim(),
      jsonSchema: {
        type: 'object',
        properties,
        required,
      },
    };
    setBuilderError(null);
    const pretty = JSON.stringify(output, null, 2);
    setJsonText(pretty);
    setActiveTab('json');
    Alert.alert('Schema JSON Generated', 'Review and validate in the JSON tab.');
  };

  const handleCreateSchemaFromForm = async () => {
    try {
      // Validate required meta fields
      if (!name.trim() || !displayName.trim() || !description.trim()) {
        setBuilderError('Please fill out name, displayName, and description.');
        return;
      }

      // Validate fields
      const validFields = fields.filter(f => f.name.trim());
      if (validFields.length === 0) {
        setBuilderError('Please add at least one field.');
        return;
      }

      // Check for duplicates
      const fieldNames = validFields.map(f => f.name.trim());
      const duplicate = fieldNames.reduce<{ [k: string]: number }>((acc, cur) => (acc[cur] = (acc[cur] || 0) + 1, acc), {});
      const dupKey = Object.keys(duplicate).find(k => duplicate[k] > 1);
      if (dupKey) {
        setBuilderError(`Duplicate field name: ${dupKey}`);
        return;
      }

      setIsCreating(true);
      setBuilderError(null);

      // Build JSON schema from form
      const properties: any = {};
      const required: string[] = [];
      
      validFields.forEach(f => {
        const trimmed = f.name.trim();
        const schema: any = { type: f.type };
        if ((f.type === 'number' || f.type === 'integer') && f.min) schema.minimum = Number(f.min);
        if ((f.type === 'number' || f.type === 'integer') && f.max) schema.maximum = Number(f.max);
        properties[trimmed] = schema;
        if (f.required) required.push(trimmed);
      });

      const schemaData: CreateSchemaData = {
        name: name.trim(),
        displayName: displayName.trim(),
        description: description.trim(),
        jsonSchema: {
          type: 'object',
          properties,
          required,
        }
      };

      await SchemaApi.createSchema(schemaData);
      
      Alert.alert(
        'Success!', 
        `Schema "${displayName.trim()}" created successfully!`,
        [
          {
            text: 'View Schema',
            onPress: () => router.push(`/schema-detail?schemaName=${name.trim()}`)
          },
          {
            text: 'Create Another',
            onPress: () => {
              setName('');
              setDisplayName('');
              setDescription('');
              setFields([{
                id: 'f1',
                name: 'name',
                type: 'string',
                required: true,
              }, {
                id: 'f2',
                name: 'price',
                type: 'number',
                required: true,
                min: '0',
              }]);
              setBuilderError(null);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Schema creation error:', error);
      setBuilderError(error.message || 'Failed to create schema');
    } finally {
      setIsCreating(false);
    }
  };


  const GuideModal = () => (
    <Modal visible={showGuide} animationType="fade" transparent>
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View className="bg-gray-900 rounded-2xl p-5 w-11/12 border border-gray-800">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white text-base font-semibold">JSON Format Guide</Text>
            <TouchableOpacity onPress={() => setShowGuide(false)} className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center">
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text className="text-gray-300 mb-3">Write valid JSON with these keys:</Text>
          <View className="bg-gray-800 rounded-xl p-3 mb-3 border border-gray-700">
            <Text className="text-gray-200" style={{ fontFamily: 'monospace' }}>{`{
  "name": "product",
  "displayName": "Product",
  "description": "Catalog product",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "price": { "type": "number", "minimum": 0 }
    },
    "required": ["name", "price"]
  }
}`}</Text>
          </View>
          <Text className="text-gray-400 mb-1">Tips</Text>
          <View className="mb-2">
            <Text className="text-gray-400">- Keys and strings must use double quotes.</Text>
            <Text className="text-gray-400">- No trailing commas.</Text>
            <Text className="text-gray-400">- Supported types: string, number, integer, boolean, object, array.</Text>
            <Text className="text-gray-400">- Use "minimum"/"maximum" for numeric constraints.</Text>
          </View>
          <TouchableOpacity onPress={() => setShowGuide(false)} className="bg-blue-600 rounded-xl items-center py-3 mt-2">
            <Text className="text-white font-semibold">Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );


  // Old Builder component removed - now using extracted memoized component

  return (
    <ImageBackground
      source={require('../assets/background/img5.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' }}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Header - FIXED OUTSIDE ScrollView */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingHorizontal: 24, 
          paddingTop: 56, 
          paddingBottom: 24 
        }}>
            <TouchableOpacity
              onPress={() => router.back()}
            style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 20, 
              backgroundColor: '#1F2937', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600' }}>
            Schema Generator
          </Text>

          <View style={{ width: 40 }} />
          </View>

        {/* KeyboardAwareScrollView - REPLACES KeyboardAvoidingView + ScrollView */}
        <KeyboardAwareScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 24, 
            paddingBottom: 60 
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 40}
          extraHeight={Platform.OS === 'ios' ? 120 : 140}
          keyboardOpeningTime={0}
        >
          {/* Tab Chips */}
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setActiveTab('json')}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                backgroundColor: activeTab === 'json' ? '#2563EB' : '#1F2937'
              }}
            >
              <Text style={{
                fontWeight: '500',
                color: activeTab === 'json' ? '#ffffff' : '#9CA3AF'
              }}>
                Write JSON
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('builder')}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                backgroundColor: activeTab === 'builder' ? '#2563EB' : '#1F2937'
              }}
            >
              <Text style={{
                fontWeight: '500',
                color: activeTab === 'builder' ? '#ffffff' : '#9CA3AF'
              }}>
                Form Builder
              </Text>
            </TouchableOpacity>
            </View>

          {/* Content */}
          {activeTab === 'json' ? (
            <JsonEditor
              jsonText={jsonText}
              onChangeText={handleJsonTextChange}
              jsonError={jsonError}
              isCreating={isCreating}
              onValidate={handleValidateJson}
              onCreate={handleCreateSchemaFromJson}
              onShowGuide={() => setShowGuide(true)}
            />
          ) : (
            <Builder
              name={name}
              onNameChange={handleNameChange}
              displayName={displayName}
              onDisplayNameChange={handleDisplayNameChange}
              description={description}
              onDescriptionChange={handleDescriptionChange}
              fields={fields}
              onAddField={handleAddField}
              onUpdateField={handleUpdateField}
              onRemoveField={handleRemoveField}
              builderError={builderError}
              isCreating={isCreating}
              onGenerateJson={buildJsonFromForm}
              onCreateSchema={handleCreateSchemaFromForm}
            />
          )}
        </KeyboardAwareScrollView>

        {/* Guide Modal */}
          <GuideModal />
        </View>
    </ImageBackground>
  );

};

export default SchemaGeneratorScreen;


