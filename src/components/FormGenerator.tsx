import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { WidgetRegistry } from './widgetRegistry';

interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

interface FormGeneratorProps {
  schemaJson: JSONSchema;
  viewJson?: any;
  initialValues?: Record<string, any>;
  onSubmit?: (data: Record<string, any>) => void;
}

const FormGenerator: React.FC<FormGeneratorProps> = ({
  schemaJson,
  viewJson,
  initialValues = {},
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Map JSON Schema to widget types
  const mapSchemaToWidget = (key: string, property: any): string => {
    // Check format first
    if (property.format === 'email') return 'EmailInput';
    if (property.format === 'phone' || key.toLowerCase().includes('phone')) return 'PhoneInput';
    if (property.format === 'address' || key.toLowerCase().includes('address')) return 'AddressInput';
    
    // Check type
    if (property.type === 'number' || property.type === 'integer') return 'NumberInput';
    if (property.enum) return 'Dropdown';
    
    // Default
    return 'TextInput';
  };

  const handleWidgetChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!schemaJson.properties) return true;

    const newErrors: Record<string, string> = {};
    const required = schemaJson.required || [];

    Object.keys(schemaJson.properties).forEach(key => {
      if (required.includes(key) && !formData[key]) {
        newErrors[key] = `${key} is required`;
      }

      const property = schemaJson.properties![key];
      
      // Type validation
      if (formData[key] !== undefined) {
        if (property.type === 'number' && isNaN(formData[key])) {
          newErrors[key] = `${key} must be a number`;
        }
        
        if (property.type === 'integer' && !Number.isInteger(formData[key])) {
          newErrors[key] = `${key} must be an integer`;
        }

        // Minimum/Maximum validation
        if (property.type === 'number' && property.minimum !== undefined) {
          if (formData[key] < property.minimum) {
            newErrors[key] = `${key} must be at least ${property.minimum}`;
          }
        }

        if (property.type === 'number' && property.maximum !== undefined) {
          if (formData[key] > property.maximum) {
            newErrors[key] = `${key} must be at most ${property.maximum}`;
          }
        }

        // MinLength/MaxLength validation
        if (property.type === 'string' && property.minLength !== undefined) {
          if (formData[key].length < property.minLength) {
            newErrors[key] = `${key} must be at least ${property.minLength} characters`;
          }
        }

        if (property.type === 'string' && property.maxLength !== undefined) {
          if (formData[key].length > property.maxLength) {
            newErrors[key] = `${key} must be at most ${property.maxLength} characters`;
          }
        }

        // Pattern validation
        if (property.type === 'string' && property.pattern) {
          const regex = new RegExp(property.pattern);
          if (!regex.test(formData[key])) {
            newErrors[key] = `${key} format is invalid`;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
    }
  };

  if (!schemaJson.properties) {
    return (
      <View className="p-6">
        <Text className="text-white">No form fields to display</Text>
      </View>
    );
  }

  const properties = schemaJson.properties;
  const required = schemaJson.required || [];

  return (
    <ScrollView className="flex-1">
      <View className="px-6 py-8">
        {Object.keys(properties).map(key => {
          const property = properties[key];
          const widgetType = mapSchemaToWidget(key, property);
          const WidgetComponent = WidgetRegistry[widgetType];

          if (!WidgetComponent) return null;

          const widgetProps: any = {
            label: key.charAt(0).toUpperCase() + key.slice(1),
            required: required.includes(key),
            error: errors[key],
            value: formData[key] || '',
            onChangeText: (text: string) => handleWidgetChange(key, text),
          };

          // Add type-specific props
          if (property.enum) {
            widgetProps.options = property.enum.map((val: string) => ({
              label: val,
              value: val,
            }));
          }

          if (property.placeholder) {
            widgetProps.placeholder = property.placeholder;
          }

          return (
            <WidgetComponent
              key={key}
              {...widgetProps}
            />
          );
        })}

        {/* Submit Button */}
        <View className="mt-6">
          {require('./widgets/ButtonWidget').default({
            label: 'Submit',
            onPress: handleSubmit,
          })}
        </View>
      </View>
    </ScrollView>
  );
};

export default FormGenerator;

