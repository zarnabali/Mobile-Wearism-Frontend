import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ViewJSON, Widget } from '../DynamicViewRenderer';
import { WidgetRegistry } from '../widgetRegistry';
import { DynamicDataApi } from '../../utils/api';
import BackgroundImage from '../../../app/components/BackgroundImage';
import { ActionHandler } from '../../services/ActionHandler';

interface DynamicFormProps {
  viewJson: ViewJSON;
  initialData?: Record<string, any>;
  onSubmit?: (data: Record<string, any>) => void;
  onAction?: (action: { actionId: string; fieldName?: string; value?: any; rowId?: string }) => void;
  userRole?: string;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  viewJson,
  initialData = {},
  onSubmit,
  onAction,
  userRole = 'customer',
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
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
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error when user types
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    sortedWidgets.forEach((widget) => {
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
      const schemaName = viewJson.id.split('_')[0];
      await DynamicDataApi.createRecord(schemaName, formData);
      Alert.alert('Success', 'Form submitted successfully');
      setFormData({});
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldAction = async (
    actionId: string,
    fieldName: string,
    value: any
  ) => {
    try {
      await ActionHandler.handleFieldAction(
        {
          actionId,
          fieldName,
          value,
        },
        userRole
      );
      if (onAction) {
        onAction({ actionId, fieldName, value });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Action failed');
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
      autoActions: widget.autoActions,
      recordId: formData.id || formData._id,
    };

    // Add type-specific props
    const widgetProps: any = { ...commonProps };

    if (widget.placeholder) widgetProps.placeholder = widget.placeholder;
    if (widget.options) widgetProps.options = widget.options;
    if (widget.meta?.endpoint) widgetProps.endpoint = widget.meta.endpoint;
    if (widget.meta?.displayField) widgetProps.displayField = widget.meta.displayField;
    if (widget.meta?.valueField) widgetProps.valueField = widget.meta.valueField;

    return (
      <WidgetComponent key={widget.key} {...widgetProps} />
    );
  };

  return (
    <BackgroundImage>
      <ScrollView className="flex-1">
        <View className="px-6 py-8">
          {/* Title */}
          {viewJson.title && (
            <Text className="text-white text-2xl font-bold mb-6">
              {viewJson.title}
            </Text>
          )}

          {/* Widgets */}
          <View>
            {sortedWidgets.map((widget) => renderWidget(widget))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-blue-600 rounded-xl py-4 items-center mt-6"
            disabled={loading}
          >
            <Text className="text-white font-semibold text-lg">
              {loading ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BackgroundImage>
  );
};

export default DynamicForm;

