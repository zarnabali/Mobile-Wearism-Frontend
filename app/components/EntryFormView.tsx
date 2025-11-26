import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  TextInputWidget,
  EmailInputWidget,
  PhoneInputWidget,
  AddressInputWidget,
  NumberInputWidget,
  DropdownWidget,
  DatePickerWidget,
  TextAreaWidget,
} from '../../src/components/widgets';

interface EntryFormViewProps {
  schema: any;
  initialData?: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

const capitalize = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

const EntryFormView: React.FC<EntryFormViewProps> = ({
  schema,
  initialData = {},
  onSave,
  onCancel,
  mode,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const properties = schema?.jsonSchema?.properties || {};
  const required = schema?.jsonSchema?.required || [];
  const fieldMapping = schema?.fieldMapping || {};
  const widgetPermissions = schema?.widgetPermissions || {};
  const sections = schema?.viewConfig?.sections || [];
  const recordId = initialData?._id || initialData?.id;
  const schemaName = schema?.name;

  useEffect(() => {
    // Initialize form data
    const initialFormData: Record<string, any> = {};
    Object.keys(properties).forEach((fieldName) => {
      if (!['_id', '_schemaName', 'createdAt', 'updatedAt', '__v'].includes(fieldName)) {
        initialFormData[fieldName] = initialData[fieldName] || '';
      }
    });
    setFormData(initialFormData);
  }, [initialData, properties]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check required fields
    required.forEach((fieldName: string) => {
      const value = formData[fieldName];
      if (value === undefined || value === null || value === '') {
        newErrors[fieldName] = 'This field is required';
      }
    });

    // Validate field types based on fieldMapping
    Object.keys(formData).forEach((fieldName) => {
      const value = formData[fieldName];
      const mappingType = fieldMapping[fieldName];
      const property = properties[fieldName];

      if (value && mappingType === 'email_field') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[fieldName] = 'Invalid email format';
        }
      }

      if (value && mappingType === 'phone_field') {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(value)) {
          newErrors[fieldName] = 'Invalid phone number format';
        }
      }

      if (
        value !== '' &&
        value !== undefined &&
        value !== null &&
        property &&
        (property.type === 'number' || property.type === 'integer')
      ) {
        const numericValue = typeof value === 'number' ? value : Number(value);
        if (Number.isNaN(numericValue)) {
          newErrors[fieldName] = 'Must be a valid number';
        } else {
          if (property.type === 'integer' && !Number.isInteger(numericValue)) {
            newErrors[fieldName] = 'Must be an integer';
          }
          if (typeof property.minimum === 'number' && numericValue < property.minimum) {
            newErrors[fieldName] = `Must be greater than or equal to ${property.minimum}`;
          }
          if (typeof property.maximum === 'number' && numericValue > property.maximum) {
            newErrors[fieldName] = `Must be less than or equal to ${property.maximum}`;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (): Record<string, any> => {
    const payload: Record<string, any> = {};

    Object.keys(properties).forEach((fieldName) => {
      if (['_id', '_schemaName', 'createdAt', 'updatedAt', '__v'].includes(fieldName)) {
        return;
      }

      const property = properties[fieldName];
      let value = formData[fieldName];

      if (value === '' || value === undefined || value === null) {
        if (required.includes(fieldName)) {
          payload[fieldName] = value;
        }
        return;
      }

      if (property?.type === 'number' || property?.type === 'integer') {
        const numericValue = typeof value === 'number' ? value : Number(value);
        if (!Number.isNaN(numericValue)) {
          payload[fieldName] = property.type === 'integer' ? Math.trunc(numericValue) : numericValue;
        }
        return;
      }

      if (property?.type === 'boolean') {
        payload[fieldName] = typeof value === 'boolean' ? value : value === 'true';
        return;
      }

      payload[fieldName] = value;
    });

    return payload;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      await onSave(payload);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (fieldName: string) => {
    if (['_id', '_schemaName', 'createdAt', 'updatedAt', '__v'].includes(fieldName)) return null;

    const property = properties[fieldName];
    const mappingType = fieldMapping[fieldName];
    const isRequired = required.includes(fieldName);
    const value = formData[fieldName] || '';
    const error = errors[fieldName];

    const label = capitalize(fieldName);
    const placeholder = property?.description || `Enter ${label.toLowerCase()}`;

    // Email field
    if (mappingType === 'email_field') {
      const canSendEmail = widgetPermissions?.email?.sendAllowed === true;
      return (
        <EmailInputWidget
          key={fieldName}
          label={label}
          required={isRequired}
          error={error}
          value={value}
          onChangeText={(text) => handleFieldChange(fieldName, text)}
          placeholder={placeholder}
          description={property?.description}
          autoActions={canSendEmail}
          recordId={recordId}
          schemaName={schemaName}
        />
      );
    }

    // Phone field
    if (mappingType === 'phone_field') {
      const canCall = widgetPermissions?.phone?.callAllowed === true;
      return (
        <PhoneInputWidget
          key={fieldName}
          label={label}
          required={isRequired}
          error={error}
          value={value}
          onChangeText={(text) => handleFieldChange(fieldName, text)}
          placeholder={placeholder}
          description={property?.description}
          autoActions={canCall}
          recordId={recordId}
          schemaName={schemaName}
        />
      );
    }

    // Location field
    if (mappingType === 'location_field') {
      const canViewMap = widgetPermissions?.location?.viewAllowed === true;
      return (
        <AddressInputWidget
          key={fieldName}
          label={label}
          required={isRequired}
          error={error}
          value={value}
          onChangeText={(text) => handleFieldChange(fieldName, text)}
          placeholder={placeholder}
          description={property?.description}
          autoActions={canViewMap}
          recordId={recordId}
          schemaName={schemaName}
        />
      );
    }

    // Number/Integer field
    if (property?.type === 'number' || property?.type === 'integer') {
      return (
        <NumberInputWidget
          key={fieldName}
          label={label}
          required={isRequired}
          error={error}
          value={value}
          onChangeText={(text) => handleFieldChange(fieldName, text)}
          placeholder={placeholder}
          description={property?.description}
          isInteger={property?.type === 'integer'}
          min={property?.minimum}
          max={property?.maximum}
          step={property?.multipleOf || 1}
        />
      );
    }

    // Enum field (dropdown)
    if (property?.enum && Array.isArray(property.enum)) {
      return (
        <DropdownWidget
          key={fieldName}
          label={label}
          required={isRequired}
          error={error}
          value={value}
          onChangeText={(val) => handleFieldChange(fieldName, val)}
          options={property.enum.map((opt: string) => ({ label: capitalize(opt), value: opt }))}
          placeholder={placeholder}
          description={property?.description}
          searchable={property.enum.length > 5}
        />
      );
    }

    // Boolean field (dropdown with Yes/No)
    if (property?.type === 'boolean') {
      return (
        <DropdownWidget
          key={fieldName}
          label={label}
          required={isRequired}
          error={error}
          value={value === true ? 'true' : value === false ? 'false' : ''}
          onChangeText={(val) => handleFieldChange(fieldName, val === 'true')}
          options={[
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' },
          ]}
          placeholder={placeholder}
          description={property?.description}
        />
      );
    }

    // Date field
    if (property?.format === 'date' || property?.format === 'date-time') {
      return (
        <DatePickerWidget
          key={fieldName}
          label={label}
          required={isRequired}
          error={error}
          value={value}
          onChangeText={(date) => handleFieldChange(fieldName, date)}
          mode={property?.format === 'date-time' ? 'datetime' : 'date'}
        />
      );
    }

    // Text area for long strings
    if (property?.type === 'string' && (property?.maxLength > 200 || fieldName.includes('description') || fieldName.includes('notes') || fieldName.includes('comment'))) {
      return (
        <TextAreaWidget
          key={fieldName}
          label={label}
          required={isRequired}
          error={error}
          value={value}
          onChangeText={(text) => handleFieldChange(fieldName, text)}
          placeholder={placeholder}
          description={property?.description}
          rows={4}
          maxLength={property?.maxLength}
        />
      );
    }

    // Default: Text input
    return (
      <TextInputWidget
        key={fieldName}
        label={label}
        required={isRequired}
        error={error}
        value={value}
        onChangeText={(text) => handleFieldChange(fieldName, text)}
        placeholder={placeholder}
        description={property?.description}
        maxLength={property?.maxLength}
        icon={mappingType === 'email_field' ? 'mail-outline' : mappingType === 'phone_field' ? 'call-outline' : mappingType === 'location_field' ? 'location-outline' : 'create-outline'}
      />
    );
  };

  // If sections are defined, render form with sections
  if (sections.length > 0) {
    return (
      <ScrollView className="flex-1 bg-gray-900/90 p-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-1 mr-4">
            <Text className="text-white text-2xl font-bold mb-1">
              {mode === 'create' ? 'Create New Entry' : 'Edit Entry'}
            </Text>
            <Text className="text-gray-400 text-sm">{schema?.displayName || 'Record'}</Text>
          </View>
          <TouchableOpacity
            onPress={onCancel}
            className="bg-gray-700/50 p-2 rounded-lg border border-gray-600/50"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Sections */}
        {sections.map((section: any, sectionIndex: number) => (
          <View key={sectionIndex} className="mb-6">
            {/* Section Header */}
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-lg bg-blue-500/20 items-center justify-center mr-3 border border-blue-500/30">
                <Text className="text-blue-400 text-sm font-bold">{sectionIndex + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold mb-1" numberOfLines={1}>
                  {section.title}
                </Text>
                {section.description && (
                  <Text className="text-gray-400 text-xs" numberOfLines={2}>
                    {section.description}
                  </Text>
                )}
              </View>
            </View>

            {/* Section Fields */}
            <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/30">
              {section.fields.map((fieldName: string) => renderField(fieldName))}
            </View>
          </View>
        ))}

        {/* Action Buttons */}
        <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-700/50 mb-8">
          <TouchableOpacity
            onPress={onCancel}
            className="bg-gray-700/50 px-6 py-3 rounded-xl border border-gray-600/50 flex-row items-center"
            activeOpacity={0.7}
            disabled={saving}
          >
            <Ionicons name="close-circle-outline" size={18} color="#9CA3AF" />
            <Text className="text-gray-300 text-sm font-semibold ml-2">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            className="bg-blue-600 px-6 py-3 rounded-xl flex-row items-center"
            activeOpacity={0.7}
            disabled={saving}
          >
            {saving ? (
              <>
                <Ionicons name="hourglass-outline" size={18} color="#FFFFFF" />
                <Text className="text-white text-sm font-semibold ml-2">Saving...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text className="text-white text-sm font-semibold ml-2">
                  {mode === 'create' ? 'Create Entry' : 'Save Changes'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // No sections - render all fields in one form
  return (
    <ScrollView className="flex-1 bg-gray-900/90 p-6" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-1 mr-4">
          <Text className="text-white text-2xl font-bold mb-1">
            {mode === 'create' ? 'Create New Entry' : 'Edit Entry'}
          </Text>
          <Text className="text-gray-400 text-sm">{schema?.displayName || 'Record'}</Text>
        </View>
        <TouchableOpacity
          onPress={onCancel}
          className="bg-gray-700/50 p-2 rounded-lg border border-gray-600/50"
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* All Fields */}
      <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/30 mb-6">
        {Object.keys(properties).map((fieldName) => renderField(fieldName))}
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-700/50 mb-8">
        <TouchableOpacity
          onPress={onCancel}
          className="bg-gray-700/50 px-6 py-3 rounded-xl border border-gray-600/50 flex-row items-center"
          activeOpacity={0.7}
          disabled={saving}
        >
          <Ionicons name="close-circle-outline" size={18} color="#9CA3AF" />
          <Text className="text-gray-300 text-sm font-semibold ml-2">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          className="bg-blue-600 px-6 py-3 rounded-xl flex-row items-center"
          activeOpacity={0.7}
          disabled={saving}
        >
          {saving ? (
            <>
              <Ionicons name="hourglass-outline" size={18} color="#FFFFFF" />
              <Text className="text-white text-sm font-semibold ml-2">Saving...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text className="text-white text-sm font-semibold ml-2">
                {mode === 'create' ? 'Create Entry' : 'Save Changes'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default EntryFormView;

