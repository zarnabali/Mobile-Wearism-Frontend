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
        "fields": ["name"]
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

type FieldType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
type WidgetType = 'none' | 'email_field' | 'phone_field' | 'location_field';
type BuilderTab = 'basic' | 'fields' | 'fieldMapping' | 'sections';

type BuilderField = {
  id: string;
  name: string;
  type: FieldType;
  description: string;
  required: boolean;
  min?: string;
  max?: string;
  widgetType: WidgetType;
};

type Section = {
  id: string;
  title: string;
  description: string;
  fields: string[];
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
  builderTab: BuilderTab;
  onTabChange: (tab: BuilderTab) => void;
  name: string;
  onNameChange: (text: string) => void;
  displayName: string;
  onDisplayNameChange: (text: string) => void;
  description: string;
  onDescriptionChange: (text: string) => void;
  fields: BuilderField[];
  onAddField: () => void;
  onUpdateField: (id: string, updates: Partial<BuilderField>) => void;
  onRemoveField: (id: string) => void;
  sections: Section[];
  onAddSection: () => void;
  onRemoveSection: (id: string) => void;
  onAddFieldToSection: (sectionId: string, fieldName: string) => void;
  onRemoveFieldFromSection: (sectionId: string, fieldName: string) => void;
  showAddSection: boolean;
  setShowAddSection: (show: boolean) => void;
  newSection: { title: string; description: string };
  setNewSection: (section: { title: string; description: string }) => void;
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
  builderTab,
  onTabChange,
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
  sections,
  onAddSection,
  onRemoveSection,
  onAddFieldToSection,
  onRemoveFieldFromSection,
  showAddSection,
  setShowAddSection,
  newSection,
  setNewSection,
  builderError,
  isCreating,
  onGenerateJson,
  onCreateSchema
}) => {
  const TabButton = ({ id, title, icon }: { id: BuilderTab; title: string; icon: string }) => (
    <TouchableOpacity
      onPress={() => onTabChange(id)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        minHeight: 32,
        backgroundColor: builderTab === id ? '#6366F1' : 'rgba(31, 41, 55, 0.4)',
        borderColor: builderTab === id ? '#818CF8' : 'rgba(75, 85, 99, 0.3)',
      }}
    >
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={builderTab === id ? '#FFFFFF' : '#9CA3AF'} 
      />
      <Text style={{
        marginLeft: 6,
        fontSize: 12,
        fontWeight: builderTab === id ? '600' : '500',
        color: builderTab === id ? '#FFFFFF' : '#9CA3AF'
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderBasicTab = () => (
    <View>
      <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
        Basic Information
      </Text>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#D1D5DB', fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
          Schema Name *
        </Text>
        <TextInput
          style={{
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: '#ffffff',
            fontSize: 14,
            borderWidth: 1,
            borderColor: 'rgba(75, 85, 99, 0.5)'
          }}
          placeholder="e.g., customer (lowercase, no spaces)"
          placeholderTextColor="#6B7280"
          value={name}
          onChangeText={onNameChange}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#D1D5DB', fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
          Display Name *
        </Text>
        <TextInput
          style={{
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: '#ffffff',
            fontSize: 14,
            borderWidth: 1,
            borderColor: 'rgba(75, 85, 99, 0.5)'
          }}
          placeholder="e.g., Customer"
          placeholderTextColor="#6B7280"
          value={displayName}
          onChangeText={onDisplayNameChange}
        />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#D1D5DB', fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
          Description
        </Text>
        <TextInput
          style={{
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: '#ffffff',
            fontSize: 14,
            borderWidth: 1,
            borderColor: 'rgba(75, 85, 99, 0.5)'
          }}
          placeholder="Brief description of this schema"
          placeholderTextColor="#6B7280"
          value={description}
          onChangeText={onDescriptionChange}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={{
        backgroundColor: 'rgba(29, 78, 216, 0.2)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(96, 165, 250, 0.3)'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="information-circle" size={18} color="#60A5FA" />
          <Text style={{ color: '#93C5FD', fontWeight: '600', marginLeft: 8, fontSize: 14 }}>
            Quick Start
          </Text>
        </View>
        <Text style={{ color: '#D1D5DB', fontSize: 12, lineHeight: 18 }}>
          Start by defining your schema name and display name. Then add fields in the Fields tab.
        </Text>
      </View>
    </View>
  );

  const renderFieldsTab = () => (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700' }}>Schema Fields</Text>
        <TouchableOpacity
          onPress={onAddField}
          style={{
            backgroundColor: '#6366F1',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 12 }}>Add Field</Text>
        </TouchableOpacity>
      </View>

      {fields.map((field) => (
        <View
          key={field.id}
          style={{
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: 'rgba(75, 85, 99, 0.5)'
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ color: '#D1D5DB', fontWeight: '600', marginBottom: 6, fontSize: 14 }}>
                Field Name *
              </Text>
              <TextInput
                style={{
                  backgroundColor: 'rgba(17, 24, 39, 0.5)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  color: '#ffffff',
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(75, 85, 99, 0.5)'
                }}
                placeholder="e.g., email"
                placeholderTextColor="#6B7280"
                value={field.name}
                onChangeText={(text) => onUpdateField(field.id, { name: text })}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              onPress={() => onRemoveField(field.id)}
              style={{ padding: 6, marginTop: 24 }}
            >
              <Ionicons name="trash-outline" size={18} color="#F87171" />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: '#9CA3AF', fontWeight: '500', marginBottom: 6, fontSize: 12 }}>
              Description
            </Text>
            <TextInput
              style={{
                backgroundColor: 'rgba(17, 24, 39, 0.5)',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                color: '#ffffff',
                fontSize: 12,
                borderWidth: 1,
                borderColor: 'rgba(75, 85, 99, 0.5)'
              }}
              placeholder="Field description"
              placeholderTextColor="#6B7280"
              value={field.description}
              onChangeText={(text) => onUpdateField(field.id, { description: text })}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: '#9CA3AF', fontWeight: '500', marginBottom: 6, fontSize: 12 }}>
              Field Type
            </Text>
            <View style={{
              backgroundColor: 'rgba(17, 24, 39, 0.5)',
              borderRadius: 8,
              padding: 4,
              flexDirection: 'row',
              borderWidth: 1,
              borderColor: 'rgba(75, 85, 99, 0.5)'
            }}>
              {(['string', 'number', 'integer', 'boolean'] as FieldType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 6,
                    backgroundColor: field.type === type ? '#6366F1' : 'transparent'
                  }}
                  onPress={() => onUpdateField(field.id, { type })}
                >
                  <Text style={{
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: field.type === type ? '600' : '500',
                    color: field.type === type ? '#ffffff' : '#9CA3AF'
                  }}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {(field.type === 'number' || field.type === 'integer') && (
            <View style={{ flexDirection: 'row', marginBottom: 12, gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#9CA3AF', fontWeight: '500', marginBottom: 6, fontSize: 12 }}>Min</Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(17, 24, 39, 0.5)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#ffffff',
                    fontSize: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(75, 85, 99, 0.5)'
                  }}
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={field.min}
                  onChangeText={(text) => onUpdateField(field.id, { min: text })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#9CA3AF', fontWeight: '500', marginBottom: 6, fontSize: 12 }}>Max</Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(17, 24, 39, 0.5)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: '#ffffff',
                    fontSize: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(75, 85, 99, 0.5)'
                  }}
                  placeholder="9999"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={field.max}
                  onChangeText={(text) => onUpdateField(field.id, { max: text })}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              backgroundColor: field.required ? 'rgba(99, 102, 241, 0.2)' : 'rgba(17, 24, 39, 0.5)',
              borderColor: field.required ? '#818CF8' : 'rgba(75, 85, 99, 0.5)'
            }}
            onPress={() => onUpdateField(field.id, { required: !field.required })}
          >
            <Ionicons
              name={field.required ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={field.required ? '#6366F1' : '#9CA3AF'}
            />
            <Text style={{ color: '#ffffff', fontWeight: '500', marginLeft: 8, fontSize: 12 }}>
              Required Field
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {fields.length === 0 && (
        <View style={{
          backgroundColor: 'rgba(31, 41, 55, 0.6)',
          borderRadius: 12,
          padding: 24,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(75, 85, 99, 0.5)'
        }}>
          <Ionicons name="list-outline" size={40} color="#6B7280" />
          <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 12, fontSize: 12 }}>
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
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
          Field Mapping
        </Text>
        <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 16 }}>
          Map fields to widget types for automatic validation and actions
        </Text>

        {availableFields.map((field) => (
          <View
            key={field.id}
            style={{
              backgroundColor: 'rgba(31, 41, 55, 0.6)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: 'rgba(75, 85, 99, 0.5)'
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
              {field.name}
            </Text>
            <View style={{
              backgroundColor: 'rgba(17, 24, 39, 0.5)',
              borderRadius: 8,
              padding: 4
            }}>
              {(['none', 'email_field', 'phone_field', 'location_field'] as WidgetType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    marginBottom: 4,
                    backgroundColor: field.widgetType === type ? '#6366F1' : 'transparent'
                  }}
                  onPress={() => onUpdateField(field.id, { widgetType: type })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name={
                        type === 'email_field' ? 'mail' :
                        type === 'phone_field' ? 'call' :
                        type === 'location_field' ? 'location' : 'close-circle'
                      }
                      size={16}
                      color={field.widgetType === type ? '#FFFFFF' : '#9CA3AF'}
                    />
                    <Text style={{
                      marginLeft: 10,
                      fontSize: 12,
                      fontWeight: field.widgetType === type ? '600' : '500',
                      color: field.widgetType === type ? '#FFFFFF' : '#9CA3AF'
                    }}>
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
          <View style={{
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            borderRadius: 12,
            padding: 24,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(75, 85, 99, 0.5)'
          }}>
            <Ionicons name="link-outline" size={40} color="#6B7280" />
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 12, fontSize: 12 }}>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700' }}>View Sections</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
              Organize fields into sections (Optional)
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddSection(true)}
            style={{
              backgroundColor: '#6366F1',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 12 }}>Add Section</Text>
          </TouchableOpacity>
        </View>

        {sections.map((section) => (
          <View
            key={section.id}
            style={{
              backgroundColor: 'rgba(31, 41, 55, 0.6)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: 'rgba(75, 85, 99, 0.5)'
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 16 }}>{section.title}</Text>
                {section.description && (
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>{section.description}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => onRemoveSection(section.id)}
                style={{ padding: 6 }}
              >
                <Ionicons name="trash-outline" size={18} color="#F87171" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#9CA3AF', fontWeight: '500', marginBottom: 8, fontSize: 12 }}>
                Fields in this section:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {section.fields.length > 0 ? (
                  section.fields.map((fieldName) => (
                    <View
                      key={fieldName}
                      style={{
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        borderWidth: 1,
                        borderColor: 'rgba(129, 140, 248, 0.3)',
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: '#A5B4FC', fontSize: 12, marginRight: 6 }}>{fieldName}</Text>
                      <TouchableOpacity
                        onPress={() => onRemoveFieldFromSection(section.id, fieldName)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={14} color="#818CF8" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#6B7280', fontSize: 12, fontStyle: 'italic' }}>No fields added yet</Text>
                )}
              </View>
            </View>

            <View>
              <Text style={{ color: '#9CA3AF', fontWeight: '500', marginBottom: 8, fontSize: 12 }}>
                Add field to section:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {availableFields
                    .filter(f => !section.fields.includes(f))
                    .map((fieldName) => (
                      <TouchableOpacity
                        key={fieldName}
                        onPress={() => onAddFieldToSection(section.id, fieldName)}
                        style={{
                          backgroundColor: 'rgba(17, 24, 39, 0.5)',
                          borderWidth: 1,
                          borderColor: 'rgba(75, 85, 99, 0.5)',
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 6
                        }}
                      >
                        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{fieldName}</Text>
                      </TouchableOpacity>
                    ))}
                  {availableFields.filter(f => !section.fields.includes(f)).length === 0 && (
                    <Text style={{ color: '#6B7280', fontSize: 12, fontStyle: 'italic' }}>All fields added</Text>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        ))}

        {sections.length === 0 && !showAddSection && (
          <View style={{
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            borderRadius: 12,
            padding: 32,
            alignItems: 'center',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(75, 85, 99, 0.5)'
          }}>
            <Ionicons name="albums-outline" size={40} color="#6B7280" />
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 12, fontSize: 14 }}>
              No sections configured yet. Sections are optional.
            </Text>
          </View>
        )}

        {/* Add Section Form */}
        {showAddSection && (
          <View style={{
            backgroundColor: 'rgba(79, 70, 229, 0.2)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(129, 140, 248, 0.3)'
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>New Section</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddSection(false);
                  setNewSection({ title: '', description: '' });
                }}
                style={{
                  backgroundColor: 'rgba(75, 85, 99, 0.8)',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8
                }}
              >
                <Text style={{ color: '#D1D5DB', fontSize: 12 }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#D1D5DB', fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
                Section Title *
              </Text>
              <TextInput
                style={{
                  backgroundColor: 'rgba(31, 41, 55, 0.6)',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  color: '#ffffff',
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(75, 85, 99, 0.5)'
                }}
                placeholder="e.g., Contact Information"
                placeholderTextColor="#6B7280"
                value={newSection.title}
                onChangeText={(text) => setNewSection({ ...newSection, title: text })}
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#D1D5DB', fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
                Description (Optional)
              </Text>
              <TextInput
                style={{
                  backgroundColor: 'rgba(31, 41, 55, 0.6)',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  color: '#ffffff',
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(75, 85, 99, 0.5)'
                }}
                placeholder="Brief description"
                placeholderTextColor="#6B7280"
                value={newSection.description}
                onChangeText={(text) => setNewSection({ ...newSection, description: text })}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              onPress={onAddSection}
              style={{
                backgroundColor: '#10B981',
                borderRadius: 12,
                paddingVertical: 10
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center', fontSize: 14 }}>
                Add Section
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{
          backgroundColor: 'rgba(29, 78, 216, 0.2)',
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(96, 165, 250, 0.3)'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="information-circle" size={18} color="#60A5FA" />
            <Text style={{ color: '#93C5FD', fontWeight: '600', marginLeft: 8, fontSize: 14 }}>
              Optional Feature
            </Text>
          </View>
          <Text style={{ color: '#D1D5DB', fontSize: 12, lineHeight: 18 }}>
            Sections help organize your form fields into logical groups. If you don't configure sections,
            the system will display all fields in a single form.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View>
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

      {/* Tabs */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <TouchableOpacity 
          onPress={onGenerateJson} 
          style={{
            flex: 1,
            backgroundColor: '#6366F1',
            borderRadius: 12,
            alignItems: 'center',
            paddingVertical: 14,
            flexDirection: 'row',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="code-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>Generate JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={onCreateSchema} 
          style={{
            flex: 1,
            borderRadius: 12,
            alignItems: 'center',
            paddingVertical: 14,
            backgroundColor: isCreating ? '#4B5563' : '#10B981',
            flexDirection: 'row',
            justifyContent: 'center'
          }}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>Create Schema</Text>
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
  const [builderTab, setBuilderTab] = useState<BuilderTab>('basic');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<BuilderField[]>([{
    id: 'f1',
    name: 'name',
    type: 'string',
    description: 'Customer name',
    required: true,
    widgetType: 'none',
  }]);
  const [sections, setSections] = useState<Section[]>([]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSection, setNewSection] = useState({ title: '', description: '' });
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
      description: '',
      required: false,
      widgetType: 'none',
    }]);
  }, [fields.length]);
  
  const handleUpdateField = useCallback((id: string, updates: Partial<BuilderField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);
  
  const handleRemoveField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    // Remove field from sections
    setSections(prev => prev.map(s => ({
      ...s,
      fields: s.fields.filter(fn => fn !== fields.find(f => f.id === id)?.name)
    })));
  }, [fields]);

  const handleAddSection = useCallback(() => {
    if (!newSection.title.trim()) {
      Alert.alert('Error', 'Section title is required');
      return;
    }
    const nextIndex = sections.length + 1;
    setSections(prev => [...prev, {
      id: `s${nextIndex}`,
      title: newSection.title,
      description: newSection.description,
      fields: []
    }]);
    setNewSection({ title: '', description: '' });
    setShowAddSection(false);
    Alert.alert('Success', 'Section added successfully!');
  }, [newSection, sections.length]);

  const handleRemoveSection = useCallback((id: string) => {
    Alert.alert(
      'Delete Section',
      'Are you sure you want to delete this section?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setSections(prev => prev.filter(s => s.id !== id))
        }
      ]
    );
  }, []);

  const handleAddFieldToSection = useCallback((sectionId: string, fieldName: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId && !s.fields.includes(fieldName)
        ? { ...s, fields: [...s.fields, fieldName] }
        : s
    ));
  }, []);

  const handleRemoveFieldFromSection = useCallback((sectionId: string, fieldName: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId
        ? { ...s, fields: s.fields.filter(f => f !== fieldName) }
        : s
    ));
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
    const validFields = fields.filter(f => f.name.trim());
    if (validFields.length === 0) {
      setBuilderError('Please add at least one field.');
      return;
    }
    const duplicate = validFields
      .map(f => f.name.trim())
      .reduce<{ [k: string]: number }>((acc, cur) => (acc[cur] = (acc[cur] || 0) + 1, acc), {});
    const dupKey = Object.keys(duplicate).find(k => duplicate[k] > 1);
    if (dupKey) {
      setBuilderError(`Duplicate field name: ${dupKey}`);
      return;
    }

    // Build properties
    const properties: any = {};
    const required: string[] = [];
    const fieldMapping: Record<string, string> = {};
    
    validFields.forEach(f => {
      const trimmed = f.name.trim();
      const schema: any = { 
        type: f.type,
        description: f.description || ''
      };
      if ((f.type === 'number' || f.type === 'integer') && f.min) schema.minimum = Number(f.min);
      if ((f.type === 'number' || f.type === 'integer') && f.max) schema.maximum = Number(f.max);
      properties[trimmed] = schema;
      if (f.required) required.push(trimmed);
      if (f.widgetType !== 'none') fieldMapping[trimmed] = f.widgetType;
    });

    // Build output with all optional features
    const output: any = {
      name: name.trim(),
      displayName: displayName.trim(),
      description: description.trim(),
      jsonSchema: {
        type: 'object',
        properties,
        required,
      },
    };

    // Add optional field mapping
    if (Object.keys(fieldMapping).length > 0) {
      output.fieldMapping = fieldMapping;
    }

    // Add optional view config with sections
    if (sections.length > 0) {
      output.viewConfig = {
        viewType: 'form',
        formLayout: 'column',
        sections: sections.map(s => ({
          title: s.title,
          description: s.description,
          fields: s.fields
        })),
        actions: [{ id: 'save', label: 'Save', type: 'submit' }]
      };
    }

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
      const fieldMapping: Record<string, string> = {};
      
      validFields.forEach(f => {
        const trimmed = f.name.trim();
        const schema: any = { 
          type: f.type,
          description: f.description || ''
        };
        if ((f.type === 'number' || f.type === 'integer') && f.min) schema.minimum = Number(f.min);
        if ((f.type === 'number' || f.type === 'integer') && f.max) schema.maximum = Number(f.max);
        properties[trimmed] = schema;
        if (f.required) required.push(trimmed);
        if (f.widgetType !== 'none') fieldMapping[trimmed] = f.widgetType;
      });

      const schemaData: any = {
        name: name.trim(),
        displayName: displayName.trim(),
        description: description.trim(),
        jsonSchema: {
          type: 'object',
          properties,
          required,
        }
      };

      // Add optional field mapping
      if (Object.keys(fieldMapping).length > 0) {
        schemaData.fieldMapping = fieldMapping;
      }

      // Add optional view config with sections
      if (sections.length > 0) {
        schemaData.viewConfig = {
          viewType: 'form',
          formLayout: 'column',
          sections: sections.map(s => ({
            title: s.title,
            description: s.description,
            fields: s.fields
          })),
          actions: [{ id: 'save', label: 'Save', type: 'submit' }]
        };
      }

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
                description: 'Customer name',
                required: true,
                widgetType: 'none',
              }]);
              setSections([]);
              setBuilderTab('basic');
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
      <View className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="bg-gray-900 rounded-2xl w-full border border-gray-800" style={{ maxWidth: 480, maxHeight: '90%' }}>
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
              A complete schema includes basic info, JSON schema, field mapping, and optional view configuration.
            </Text>

            {/* Required Fields */}
            <View className="mb-4">
              <Text className="text-white font-semibold mb-2 text-sm">✅ Required Fields:</Text>
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
              <Text className="text-white font-semibold mb-2 text-sm">🔗 Field Mapping (Optional):</Text>
              <View className="bg-gray-800 rounded-lg p-3 mb-2">
                <Text className="text-gray-300 text-xs" style={{ fontFamily: 'monospace' }}>
                  "fieldMapping": {'{'}{ '\n'}
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
              <Text className="text-white font-semibold mb-2 text-sm">📋 View Config (Optional):</Text>
              <View className="bg-gray-800 rounded-lg p-3 mb-2">
                <Text className="text-gray-300 text-xs" style={{ fontFamily: 'monospace' }}>
                  "viewConfig": {'{'}{ '\n'}
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

            {/* Example */}
            <View className="mb-4">
              <Text className="text-white font-semibold mb-2 text-sm">📝 Complete Example:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="bg-gray-800 rounded-lg p-3">
                  <Text className="text-gray-300 text-xs" style={{ fontFamily: 'monospace' }}>
                    {INITIAL_JSON_TEMPLATE}
                  </Text>
                </View>
              </ScrollView>
            </View>

            <View className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/30 mb-2">
              <Text className="text-blue-300 text-xs font-semibold mb-1">💡 Pro Tips:</Text>
              <Text className="text-gray-300 text-xs">
                • Use Form Builder for quick setup{'\n'}
                • Map email/phone/address for widget actions{'\n'}
                • No trailing commas in JSON{'\n'}
                • Field names: lowercase, no spaces
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowGuide(false)}
              className="bg-indigo-600 rounded-lg py-3"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-center">Got it!</Text>
            </TouchableOpacity>
          </ScrollView>
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
              builderTab={builderTab}
              onTabChange={setBuilderTab}
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
              sections={sections}
              onAddSection={handleAddSection}
              onRemoveSection={handleRemoveSection}
              onAddFieldToSection={handleAddFieldToSection}
              onRemoveFieldFromSection={handleRemoveFieldFromSection}
              showAddSection={showAddSection}
              setShowAddSection={setShowAddSection}
              newSection={newSection}
              setNewSection={setNewSection}
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


