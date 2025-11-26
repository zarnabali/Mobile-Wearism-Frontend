import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { WidgetRegistry } from './widgetRegistry';
import { DynamicDataApi } from '../utils/api';

export interface Widget {
  key: string;
  type: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  autoActions?: {
    email?: boolean;
    call?: boolean;
    map?: boolean;
  };
  order?: number;
  meta?: any;
}

export interface ViewJSON {
  id: string;
  title: string;
  type?: 'form' | 'list' | 'detail' | 'wizard';
  layout?: 'column' | 'row' | 'grid';
  roleVisibility?: string[];
  widgets: Widget[];
  options?: {
    showFieldHints?: boolean;
  };
  defaultEndpoint?: string;
  meta?: any; // For list columns, wizard steps, detail actions, etc.
}

interface DynamicViewRendererProps {
  viewJson: ViewJSON;
  schemaJson?: any;
  userRole?: string;
  context?: Record<string, any>;
  onSubmit?: (data: Record<string, any>) => void;
}

const DynamicViewRenderer: React.FC<DynamicViewRendererProps> = ({
  viewJson,
  schemaJson,
  userRole,
  context = {},
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Sort widgets by order
  const sortedWidgets = [...viewJson.widgets].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Check role visibility
  const isVisible = (widget: Widget): boolean => {
    if (!viewJson.roleVisibility || viewJson.roleVisibility.length === 0) {
      return true;
    }
    if (!userRole) return false;
    return viewJson.roleVisibility.includes(userRole);
  };

  const handleWidgetChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user types
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    sortedWidgets.forEach(widget => {
      if (!isVisible(widget)) return;
      
      if (widget.required && !formData[widget.key]) {
        newErrors[widget.key] = `${widget.label || widget.key} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
      return;
    }

    // Default submission to backend
    if (!viewJson.defaultEndpoint) {
      Alert.alert('Error', 'No submission endpoint configured');
      return;
    }

    setLoading(true);
    try {
      const schemaName = viewJson.id.split('_')[0]; // Extract schema name from view ID
      await DynamicDataApi.createRecord(schemaName, formData);
      Alert.alert('Success', 'Form submitted successfully');
      // Reset form
      setFormData({});
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  const renderWidget = (widget: Widget) => {
    if (!isVisible(widget)) return null;

    const WidgetComponent = WidgetRegistry[widget.type];
    if (!WidgetComponent) {
      return (
        <View key={widget.key} className="bg-red-500/10 rounded-xl p-4 mb-4">
          <Text className="text-red-400">
            Unknown widget type: {widget.type}
          </Text>
        </View>
      );
    }

    const commonProps = {
      label: widget.label,
      required: widget.required,
      error: errors[widget.key],
      value: formData[widget.key] || '',
      onChangeText: (text: string) => handleWidgetChange(widget.key, text),
    };

    // Add type-specific props
    const widgetProps: any = { ...commonProps };
    
    if (widget.placeholder) widgetProps.placeholder = widget.placeholder;
    if (widget.autoActions) widgetProps.autoActions = widget.autoActions;
    if (widget.options) widgetProps.options = widget.options;

    return (
      <WidgetComponent
        key={widget.key}
        {...widgetProps}
      />
    );
  };

  return (
    <ScrollView className="flex-1">
      <View className="px-6 py-8">
        {/* Title */}
        <Text className="text-white text-2xl font-bold mb-6">
          {viewJson.title}
        </Text>

        {/* Widgets */}
        <View>
          {sortedWidgets.map(widget => renderWidget(widget))}
        </View>
      </View>
    </ScrollView>
  );
};

export default DynamicViewRenderer;

// Export Enhanced version as well
export { default as EnhancedDynamicViewRenderer } from './DynamicViewRenderer/EnhancedDynamicViewRenderer';

