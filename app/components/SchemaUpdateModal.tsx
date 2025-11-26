import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Schema } from '../../src/utils/api';

interface SchemaUpdateModalProps {
  visible: boolean;
  schema: Schema | null;
  onClose: () => void;
  onSave: (updateData: any) => Promise<void>;
}

type EditMode = 'json' | 'form';
type FormTab = 'basic' | 'fields' | 'fieldMapping' | 'viewConfig';

const SchemaUpdateModal: React.FC<SchemaUpdateModalProps> = ({
  visible,
  schema,
  onClose,
  onSave,
}) => {
  const [editMode, setEditMode] = useState<EditMode>('form');
  const [formTab, setFormTab] = useState<FormTab>('basic');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [localSchema, setLocalSchema] = useState<any>(null);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [widgetPermissions, setWidgetPermissions] = useState<any>({});
  const [viewConfig, setViewConfig] = useState<any>({
    viewType: 'form',
    formLayout: 'column',
    sections: [],
    actions: [{ id: 'save', label: 'Save', type: 'submit' }],
  });

  // Field editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingFieldData, setEditingFieldData] = useState<any>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState({
    name: '',
    type: 'string' as 'string' | 'number' | 'integer' | 'boolean',
    description: '',
    required: false,
  });

  // View config section editing
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [newSection, setNewSection] = useState({ title: '', description: '', fields: [] as string[] });
  const [showAddSection, setShowAddSection] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (schema && visible) {
      setDisplayName(schema.displayName || '');
      setDescription(schema.description || '');
      setLocalSchema(schema.jsonSchema);
      setFieldMappings(schema.fieldMapping || {});
      setWidgetPermissions(schema.widgetPermissions || {});
      setViewConfig(schema.viewConfig || {
        viewType: 'form',
        formLayout: 'column',
        sections: [],
        actions: [{ id: 'save', label: 'Save', type: 'submit' }],
      });
      setJsonText(JSON.stringify(schema.jsonSchema, null, 2));
      setFormTab('basic');
      setShowAddField(false);
      setNewField({ name: '', type: 'string', description: '', required: false });
      setShowAddSection(false);
      setNewSection({ title: '', description: '', fields: [] });
      setEditingSection(null);
    }
  }, [schema, visible]);

  const handleSave = async () => {
    try {
      const updateData: any = {
        displayName,
        description,
        jsonSchema: localSchema,
      };

      // Only include optional fields if they have content
      if (Object.keys(fieldMappings).length > 0) {
        updateData.fieldMapping = fieldMappings;
      }
      if (viewConfig && viewConfig.sections && viewConfig.sections.length > 0) {
        updateData.viewConfig = viewConfig;
      }

      await onSave(updateData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update schema');
    }
  };

  const handleValidateJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setLocalSchema(parsed);
      setJsonError(null);
      Alert.alert('Success', 'JSON is valid!');
    } catch (error: any) {
      setJsonError(error.message);
      Alert.alert('Error', 'Invalid JSON: ' + error.message);
    }
  };

  const addField = () => {
    if (!newField.name.trim()) {
      Alert.alert('Error', 'Field name is required');
      return;
    }

    if (!localSchema) {
      Alert.alert('Error', 'Schema not loaded');
      return;
    }

    if (localSchema.properties && localSchema.properties[newField.name]) {
      Alert.alert('Error', 'Field already exists');
      return;
    }

    const fieldDef: any = {
      type: newField.type,
      description: newField.description || '',
    };

    if (newField.type === 'number' || newField.type === 'integer') {
      fieldDef.minimum = 0;
    }

    const updatedSchema = {
      ...localSchema,
      properties: {
        ...(localSchema.properties || {}),
        [newField.name]: fieldDef,
      },
      required: newField.required
        ? [...(localSchema.required || []), newField.name]
        : (localSchema.required || []),
    };

    setLocalSchema(updatedSchema);
    setJsonText(JSON.stringify(updatedSchema, null, 2));
    setShowAddField(false);
    setNewField({ name: '', type: 'string', description: '', required: false });
    Alert.alert('Success', `Field "${newField.name}" added successfully!`);
  };

  const updateField = (fieldName: string, updatedData: any) => {
    if (!localSchema) return;

    const { required, ...fieldDef } = updatedData;
    let updatedRequired = [...(localSchema.required || [])];

    if (required && !updatedRequired.includes(fieldName)) {
      updatedRequired.push(fieldName);
    } else if (!required && updatedRequired.includes(fieldName)) {
      updatedRequired = updatedRequired.filter((f: string) => f !== fieldName);
    }

    const updatedSchema = {
      ...localSchema,
      properties: {
        ...localSchema.properties,
        [fieldName]: fieldDef,
      },
      required: updatedRequired,
    };

    setLocalSchema(updatedSchema);
    setJsonText(JSON.stringify(updatedSchema, null, 2));
    setEditingField(null);
    setEditingFieldData(null);
  };

  const deleteField = (fieldName: string) => {
    Alert.alert(
      'Delete Field',
      `Are you sure you want to delete "${fieldName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (!localSchema) return;

            const { [fieldName]: removed, ...remainingProps } = localSchema.properties;
            const updatedRequired = (localSchema.required || []).filter(
              (f: string) => f !== fieldName
            );

            const updatedSchema = {
              ...localSchema,
              properties: remainingProps,
              required: updatedRequired,
            };

            setLocalSchema(updatedSchema);
            setJsonText(JSON.stringify(updatedSchema, null, 2));

            // Remove from field mappings if exists
            if (fieldMappings[fieldName]) {
              const { [fieldName]: removed, ...rest } = fieldMappings;
              setFieldMappings(rest);
            }
          },
        },
      ]
    );
  };

  const getFieldTypeColor = (type: string) => {
    switch (type) {
      case 'string': return '#60A5FA';
      case 'number': return '#34D399';
      case 'integer': return '#34D399';
      case 'boolean': return '#FBBF24';
      default: return '#9CA3AF';
    }
  };

  const renderBasicTab = () => (
    <View>
      <Text className="text-white text-lg font-bold mb-4">Basic Information</Text>

      <View className="mb-4">
        <Text className="text-gray-200 font-semibold mb-2 text-sm">Display Name *</Text>
        <TextInput
          className="bg-gray-800/60 rounded-xl px-4 py-3 text-white border border-gray-600/50 text-sm"
          placeholder="Enter display name"
          placeholderTextColor="#9CA3AF"
          value={displayName}
          onChangeText={setDisplayName}
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-200 font-semibold mb-2 text-sm">Description</Text>
        <TextInput
          className="bg-gray-800/60 rounded-xl px-4 py-3 text-white border border-gray-600/50 text-sm"
          placeholder="Enter description"
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View className="bg-indigo-900/30 rounded-xl p-4 border border-indigo-500/30">
        <View className="flex-row items-center mb-2">
          <Ionicons name="information-circle" size={18} color="#818CF8" />
          <Text className="text-indigo-300 font-semibold ml-2 text-sm">Schema Information</Text>
        </View>
        <Text className="text-gray-300 text-xs mb-1.5">
          Schema Name: <Text className="text-white font-semibold">{schema?.name}</Text>
        </Text>
        <Text className="text-gray-300 text-xs mb-1.5">
          Collection: <Text className="text-white font-semibold">{schema?.collectionName}</Text>
        </Text>
        <Text className="text-gray-300 text-xs">
          Version: <Text className="text-white font-semibold">{schema?.version}</Text>
        </Text>
      </View>
    </View>
  );

  const renderFieldsTab = () => (
    <View>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-lg font-bold">Schema Fields</Text>
        <TouchableOpacity
          onPress={() => setShowAddField(true)}
          className="bg-indigo-600 px-3 py-1.5 rounded-lg"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-xs">Add Field</Text>
        </TouchableOpacity>
      </View>

      {localSchema?.properties && Object.entries(localSchema.properties).map(([fieldName, fieldDef]: [string, any]) => (
        <View key={fieldName} className="bg-gray-800/60 rounded-2xl p-5 mb-4 border border-gray-600/50">
          {editingField === fieldName ? (
            <View>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white font-semibold text-lg">Edit: {fieldName}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditingField(null);
                    setEditingFieldData(null);
                  }}
                  className="bg-gray-600/80 px-3 py-2 rounded-xl"
                >
                  <Text className="text-gray-200 text-sm">Cancel</Text>
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-gray-200 font-medium mb-2">Field Type</Text>
                <View className="bg-gray-700/50 rounded-xl p-1 flex-row">
                  {['string', 'number', 'integer', 'boolean'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      className={`flex-1 py-2.5 rounded-lg ${editingFieldData?.type === type ? 'bg-indigo-600' : ''}`}
                      onPress={() => setEditingFieldData({ ...editingFieldData, type })}
                    >
                      <Text className={`text-center text-xs ${editingFieldData?.type === type ? 'text-white font-semibold' : 'text-gray-300'}`}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-gray-200 font-medium mb-2">Description</Text>
                <TextInput
                  className="bg-gray-700/50 rounded-xl px-4 py-3 text-white border border-gray-600/50"
                  placeholder="Enter description"
                  placeholderTextColor="#9CA3AF"
                  value={editingFieldData?.description || ''}
                  onChangeText={(text) => setEditingFieldData({ ...editingFieldData, description: text })}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                className={`flex-row items-center p-3 rounded-xl mb-4 border ${editingFieldData?.required ? 'bg-indigo-600/20 border-indigo-500' : 'bg-gray-700/50 border-gray-600/50'}`}
                onPress={() => setEditingFieldData({ ...editingFieldData, required: !editingFieldData?.required })}
              >
                <Ionicons
                  name={editingFieldData?.required ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={editingFieldData?.required ? '#6366F1' : '#9CA3AF'}
                />
                <Text className="text-white font-medium ml-3">Required Field</Text>
              </TouchableOpacity>

              <View className="flex-row" style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => updateField(fieldName, editingFieldData)}
                  className="flex-1 bg-emerald-600 rounded-xl py-3"
                >
                  <Text className="text-white font-semibold text-center">Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteField(fieldName)}
                  className="flex-1 bg-rose-600 rounded-xl py-3"
                >
                  <Text className="text-white font-semibold text-center">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-white text-lg font-semibold mr-3">{fieldName}</Text>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: getFieldTypeColor(fieldDef.type) + '25' }}
                    >
                      <Text style={{ color: getFieldTypeColor(fieldDef.type), fontSize: 12, fontWeight: '600' }}>
                        {fieldDef.type}
                      </Text>
                    </View>
                  </View>
                  {fieldDef.description && (
                    <Text className="text-gray-300 text-sm mb-2">{fieldDef.description}</Text>
                  )}
                  <View className="flex-row items-center">
                    <Ionicons
                      name={localSchema?.required?.includes(fieldName) ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={localSchema?.required?.includes(fieldName) ? '#10B981' : '#6B7280'}
                    />
                    <Text className="text-gray-300 text-sm ml-2">
                      {localSchema?.required?.includes(fieldName) ? 'Required' : 'Optional'}
                    </Text>
                  </View>
                </View>
                <View className="flex-row" style={{ gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingField(fieldName);
                      setEditingFieldData({
                        type: fieldDef.type,
                        description: fieldDef.description || '',
                        required: localSchema?.required?.includes(fieldName) || false,
                      });
                    }}
                    className="p-2"
                  >
                    <Ionicons name="create-outline" size={20} color="#60A5FA" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteField(fieldName)} className="p-2">
                    <Ionicons name="trash-outline" size={20} color="#F87171" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      ))}

      {showAddField && (
        <View className="bg-indigo-900/30 rounded-2xl p-5 mb-4 border border-indigo-500/30">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-bold text-lg">New Field</Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddField(false);
                setNewField({ name: '', type: 'string', description: '', required: false });
              }}
              className="bg-gray-600/80 px-3 py-2 rounded-xl"
            >
              <Text className="text-gray-200 text-sm">Cancel</Text>
            </TouchableOpacity>
          </View>

          <View className="mb-3">
            <Text className="text-gray-200 font-semibold mb-2">Field Name *</Text>
            <TextInput
              className="bg-gray-800/60 rounded-2xl px-5 py-4 text-white border border-gray-600/50"
              placeholder="e.g., customerName"
              placeholderTextColor="#9CA3AF"
              value={newField.name}
              onChangeText={(text) => setNewField({ ...newField, name: text })}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <View className="mb-3">
            <Text className="text-gray-200 font-semibold mb-2">Field Type *</Text>
            <View className="bg-gray-800/60 rounded-2xl p-1 flex-row border border-gray-600/50">
              {(['string', 'number', 'integer', 'boolean'] as const).map((type) => (
                <Pressable
                  key={type}
                  className={`flex-1 py-2.5 rounded-xl ${newField.type === type ? 'bg-indigo-600' : ''}`}
                  onPress={() => setNewField({ ...newField, type })}
                >
                  <Text className={`text-center text-xs font-semibold ${newField.type === type ? 'text-white' : 'text-gray-300'}`}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mb-3">
            <Text className="text-gray-200 font-semibold mb-2">Description</Text>
            <TextInput
              className="bg-gray-800/60 rounded-2xl px-5 py-4 text-white border border-gray-600/50"
              placeholder="Field description"
              placeholderTextColor="#9CA3AF"
              value={newField.description}
              onChangeText={(text) => setNewField({ ...newField, description: text })}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            className={`flex-row items-center p-3 rounded-xl mb-3 border ${newField.required ? 'bg-indigo-600/20 border-indigo-500' : 'bg-gray-800/60 border-gray-600/50'}`}
            onPress={() => setNewField({ ...newField, required: !newField.required })}
            activeOpacity={0.7}
          >
            <Ionicons
              name={newField.required ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={newField.required ? '#6366F1' : '#9CA3AF'}
            />
            <Text className="text-white font-medium ml-2.5">Required Field</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={addField} className="bg-emerald-600 rounded-xl py-2.5" activeOpacity={0.8}>
            <Text className="text-white font-semibold text-center text-sm">Add Field</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFieldMappingTab = () => (
    <View>
      <Text className="text-white text-lg font-bold mb-3">Field Mapping</Text>
      <Text className="text-gray-400 text-xs mb-4">
        Map fields to widget types for automatic validation and actions (Send Email, Call, View Map)
      </Text>

      {localSchema?.properties && Object.keys(localSchema.properties).map((fieldName) => {
        const currentMapping = fieldMappings[fieldName] || 'none';
        
        return (
          <View key={fieldName} className="bg-gray-800/60 rounded-xl p-3 mb-3 border border-gray-600/50">
            <Text className="text-white font-semibold mb-2 text-sm">{fieldName}</Text>
            <View className="bg-gray-700/50 rounded-lg p-1">
              {['none', 'email_field', 'phone_field', 'location_field'].map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`py-2 px-3 rounded-lg mb-1 ${currentMapping === type ? 'bg-indigo-600' : ''}`}
                  onPress={() => {
                    if (type === 'none') {
                      const { [fieldName]: removed, ...rest } = fieldMappings;
                      setFieldMappings(rest);
                    } else {
                      setFieldMappings({ ...fieldMappings, [fieldName]: type });
                    }
                  }}
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
                      color={currentMapping === type ? '#FFFFFF' : '#9CA3AF'}
                    />
                    <Text className={`ml-2.5 text-xs ${currentMapping === type ? 'text-white font-semibold' : 'text-gray-300'}`}>
                      {type === 'none' ? 'No Mapping' :
                       type === 'email_field' ? 'Email Field' :
                       type === 'phone_field' ? 'Phone Field' : 'Location Field'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      {(!localSchema?.properties || Object.keys(localSchema.properties).length === 0) && (
        <View className="bg-gray-800/60 rounded-xl p-6 items-center">
          <Ionicons name="layers-outline" size={40} color="#6B7280" />
          <Text className="text-gray-400 text-center mt-3 text-xs">
            No fields defined yet. Add fields in the Fields tab first.
          </Text>
        </View>
      )}
    </View>
  );

  // Widget permissions removed - managed by super admin

  const renderViewConfigTab = () => {
    const availableFields = localSchema?.properties ? Object.keys(localSchema.properties) : [];

    const addSection = () => {
      if (!newSection.title.trim()) {
        Alert.alert('Error', 'Section title is required');
        return;
      }

      const updatedSections = [...(viewConfig.sections || []), newSection];
      setViewConfig({ ...viewConfig, sections: updatedSections });
      setNewSection({ title: '', description: '', fields: [] });
      setShowAddSection(false);
      Alert.alert('Success', 'Section added successfully!');
    };

    const removeSection = (index: number) => {
      Alert.alert(
        'Delete Section',
        'Are you sure you want to delete this section?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              const updatedSections = viewConfig.sections.filter((_: any, i: number) => i !== index);
              setViewConfig({ ...viewConfig, sections: updatedSections });
            },
          },
        ]
      );
    };

    const addFieldToSection = (sectionIndex: number, fieldName: string) => {
      const updatedSections = [...viewConfig.sections];
      if (!updatedSections[sectionIndex].fields.includes(fieldName)) {
        updatedSections[sectionIndex].fields.push(fieldName);
        setViewConfig({ ...viewConfig, sections: updatedSections });
      }
    };

    const removeFieldFromSection = (sectionIndex: number, fieldName: string) => {
      const updatedSections = [...viewConfig.sections];
      updatedSections[sectionIndex].fields = updatedSections[sectionIndex].fields.filter(
        (f: string) => f !== fieldName
      );
      setViewConfig({ ...viewConfig, sections: updatedSections });
    };

    return (
      <View>
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">View Configuration</Text>
            <Text className="text-gray-400 text-xs mt-1">Organize fields into sections (Optional)</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddSection(true)}
            className="bg-indigo-600 px-3 py-2 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-xs">Add Section</Text>
          </TouchableOpacity>
        </View>

        {/* Layout Options */}
        <View className="bg-gray-800/60 rounded-2xl p-4 mb-4 border border-gray-600/50">
          <Text className="text-gray-200 font-semibold mb-3 text-sm">Form Layout</Text>
          <View className="bg-gray-700/50 rounded-xl p-1 flex-row">
            {['column', 'row'].map((layout) => (
              <TouchableOpacity
                key={layout}
                className={`flex-1 py-2 rounded-lg ${viewConfig.formLayout === layout ? 'bg-indigo-600' : ''}`}
                onPress={() => setViewConfig({ ...viewConfig, formLayout: layout })}
                activeOpacity={0.8}
              >
                <Text className={`text-center text-xs font-semibold ${viewConfig.formLayout === layout ? 'text-white' : 'text-gray-300'}`}>
                  {layout.charAt(0).toUpperCase() + layout.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sections List */}
        {viewConfig.sections && viewConfig.sections.length > 0 ? (
          viewConfig.sections.map((section: any, index: number) => (
            <View key={index} className="bg-gray-800/60 rounded-2xl p-4 mb-3 border border-gray-600/50">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-2">
                  <Text className="text-white font-semibold text-base">{section.title}</Text>
                  {section.description && (
                    <Text className="text-gray-400 text-xs mt-1">{section.description}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => removeSection(index)}
                  className="p-1.5"
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color="#F87171" />
                </TouchableOpacity>
              </View>

              {/* Fields in Section */}
              <View className="mb-3">
                <Text className="text-gray-300 text-xs font-medium mb-2">Fields in this section:</Text>
                <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                  {section.fields && section.fields.length > 0 ? (
                    section.fields.map((field: string) => (
                      <View key={field} className="bg-indigo-600/20 border border-indigo-500/30 rounded-lg px-2.5 py-1.5 flex-row items-center">
                        <Text className="text-indigo-300 text-xs mr-1.5">{field}</Text>
                        <TouchableOpacity
                          onPress={() => removeFieldFromSection(index, field)}
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

              {/* Add Field Dropdown */}
              <View>
                <Text className="text-gray-300 text-xs font-medium mb-2">Add field to section:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row" style={{ gap: 6 }}>
                    {availableFields
                      .filter(f => !section.fields.includes(f))
                      .map((field) => (
                        <TouchableOpacity
                          key={field}
                          onPress={() => addFieldToSection(index, field)}
                          className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-2.5 py-1.5"
                          activeOpacity={0.7}
                        >
                          <Text className="text-gray-300 text-xs">{field}</Text>
                        </TouchableOpacity>
                      ))}
                    {availableFields.filter(f => !section.fields.includes(f)).length === 0 && (
                      <Text className="text-gray-500 text-xs italic">All fields added</Text>
                    )}
                  </View>
                </ScrollView>
              </View>
            </View>
          ))
        ) : (
          <View className="bg-gray-800/60 rounded-2xl p-8 mb-4 border border-gray-600/50 items-center">
            <Ionicons name="albums-outline" size={40} color="#6B7280" />
            <Text className="text-gray-400 text-center mt-3 text-sm">
              No sections configured yet. Add sections to organize your form fields.
            </Text>
          </View>
        )}

        {/* Add Section Form */}
        {showAddSection && (
          <View className="bg-indigo-900/30 rounded-2xl p-4 mb-4 border border-indigo-500/30">
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
                placeholder="Brief description of this section"
                placeholderTextColor="#9CA3AF"
                value={newSection.description}
                onChangeText={(text) => setNewSection({ ...newSection, description: text })}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              onPress={addSection}
              className="bg-emerald-600 rounded-xl py-2.5"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-center text-sm">Add Section</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Card */}
        <View className="bg-blue-900/20 rounded-2xl p-4 border border-blue-500/30">
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

  const renderJsonView = () => (
    <View>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-xl font-bold">JSON Editor</Text>
        <TouchableOpacity onPress={handleValidateJson} className="bg-emerald-600 px-4 py-2 rounded-xl">
          <Text className="text-white font-semibold">Validate</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-gray-900 rounded-xl border border-gray-700 mb-4">
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-700">
          <Text className="text-white text-sm font-medium">JSON Schema</Text>
          <View className="flex-row items-center">
            <Text className="text-gray-400 text-xs mr-2">Lines: {jsonText.split('\n').length}</Text>
            <Ionicons name="code-outline" size={16} color="#6B7280" />
          </View>
        </View>

        <ScrollView className="max-h-96">
          <TextInput
            className="text-white font-mono text-sm px-4 py-4"
            value={jsonText}
            onChangeText={setJsonText}
            multiline
            numberOfLines={20}
            style={{ minHeight: 400, textAlignVertical: 'top' }}
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
          />
        </ScrollView>

        <View className="px-4 py-3 border-t border-gray-700 bg-gray-800 rounded-b-xl">
          <Text className="text-gray-400 text-xs">
            💡 Advanced users can edit JSON directly. Use Validate button to check syntax.
          </Text>
        </View>
      </View>

      {jsonError && (
        <View className="bg-red-900/30 border border-red-500/50 rounded-xl p-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text className="text-red-400 font-bold ml-2">Validation Error</Text>
          </View>
          <Text className="text-red-200 text-sm">{jsonError}</Text>
        </View>
      )}
    </View>
  );

  const TabButton = ({ id, title, icon }: { id: FormTab; title: string; icon: string }) => (
    <TouchableOpacity
      onPress={() => setFormTab(id)}
      className={`flex-row items-center px-3 py-1.5 rounded-lg border ${
        formTab === id 
          ? 'bg-indigo-600 border-indigo-500' 
          : 'bg-gray-800/40 border-gray-600/30'
      }`}
      activeOpacity={0.7}
      style={{ minHeight: 32 }}
    >
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={formTab === id ? '#FFFFFF' : '#9CA3AF'} 
      />
      <Text className={`ml-1.5 text-xs ${formTab === id ? 'text-white font-semibold' : 'text-gray-400 font-medium'}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (!schema) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#1F2937' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-14 pb-3 border-b border-gray-700/50">
          <TouchableOpacity onPress={onClose} className="bg-gray-700/50 px-3 py-1.5 rounded-xl" activeOpacity={0.7}>
            <Text className="text-gray-300 text-sm font-medium">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Update Schema</Text>
          <TouchableOpacity onPress={handleSave} className="bg-emerald-600 px-4 py-1.5 rounded-xl" activeOpacity={0.8}>
            <Text className="text-white text-sm font-semibold">Save</Text>
          </TouchableOpacity>
        </View>

        {/* Mode Toggle */}
        <View className="px-6 py-3">
          <View className="bg-gray-800/60 rounded-2xl p-1 flex-row border border-gray-600/50">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-xl ${editMode === 'form' ? 'bg-indigo-600' : ''}`}
              onPress={() => setEditMode('form')}
              activeOpacity={0.7}
            >
              <Text className={`text-center font-semibold text-sm ${editMode === 'form' ? 'text-white' : 'text-gray-300'}`}>
                Form View
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-xl ${editMode === 'json' ? 'bg-indigo-600' : ''}`}
              onPress={() => setEditMode('json')}
              activeOpacity={0.7}
            >
              <Text className={`text-center font-semibold text-sm ${editMode === 'json' ? 'text-white' : 'text-gray-300'}`}>
                JSON View
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Tabs */}
        {editMode === 'form' && (
          <View className="px-6 mb-4">
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              <TabButton id="basic" title="Basic" icon="information-circle" />
              <TabButton id="fields" title="Fields" icon="list" />
              <TabButton id="fieldMapping" title="Mapping" icon="link" />
              <TabButton id="viewConfig" title="Sections" icon="albums" />
            </View>
          </View>
        )}

        {/* Content */}
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {editMode === 'json' ? (
            renderJsonView()
          ) : (
            <>
              {formTab === 'basic' && renderBasicTab()}
              {formTab === 'fields' && renderFieldsTab()}
              {formTab === 'fieldMapping' && renderFieldMappingTab()}
              {formTab === 'viewConfig' && renderViewConfigTab()}
            </>
          )}
          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SchemaUpdateModal;

