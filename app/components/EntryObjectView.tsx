import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WidgetActionButtons from './WidgetActionButtons';

interface EntryObjectViewProps {
  entry: any;
  schema: any;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const capitalize = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

const EntryObjectView: React.FC<EntryObjectViewProps> = ({
  entry,
  schema,
  onEdit,
  onDelete,
  onClose,
}) => {
  const properties = schema?.jsonSchema?.properties || {};
  const fieldMapping = schema?.fieldMapping || {};
  const widgetPermissions = schema?.widgetPermissions || {};
  const sections = schema?.viewConfig?.sections || [];

  const getFieldValue = (fieldName: string) => {
    const value = entry[fieldName];
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getWidgetType = (fieldName: string): 'email_field' | 'phone_field' | 'location_field' | null => {
    const mapping = fieldMapping[fieldName];
    if (mapping === 'email_field' || mapping === 'phone_field' || mapping === 'location_field') {
      return mapping;
    }
    return null;
  };

  const getFieldTypeColor = (type: string) => {
    switch (type) {
      case 'string': return '#60A5FA';
      case 'number': return '#34D399';
      case 'integer': return '#34D399';
      case 'boolean': return '#FBBF24';
      case 'array': return '#A78BFA';
      case 'object': return '#FB7185';
      default: return '#9CA3AF';
    }
  };

  const renderField = (fieldName: string) => {
    if (['_id', '_schemaName', 'createdAt', 'updatedAt', '__v'].includes(fieldName)) return null;

    const property = properties[fieldName];
    const value = getFieldValue(fieldName);
    const widgetType = getWidgetType(fieldName);
    const isRequired = schema?.jsonSchema?.required?.includes(fieldName);

    return (
      <View key={fieldName} className="bg-gray-900/50 rounded-xl p-4 mb-3 border border-gray-700/30">
        {/* Field Header */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center mb-1 flex-wrap">
              <Text className="text-white text-base font-semibold mr-2" numberOfLines={1}>
                rrr
              </Text>
              {isRequired && (
                <View className="bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                  <Text className="text-red-400 text-xs font-bold">Required</Text>
                </View>
              )}
            </View>
            {property?.description && (
              <Text className="text-gray-400 text-xs mb-2" numberOfLines={2}>
                {property.description}
              </Text>
            )}
          </View>
          {property?.type && (
            <View className="bg-gray-700/50 px-2 py-1 rounded border border-gray-600/50">
              <Text className="text-xs font-semibold" style={{ color: getFieldTypeColor(property.type) }} numberOfLines={1}>
                {property.type}
              </Text>
            </View>
          )}
        </View>

        {/* Field Value */}
        <View className="bg-gray-800/50 rounded-lg p-3 mb-2">
          <Text className="text-gray-200 text-sm" selectable>
            {value}
          </Text>
        </View>

        {/* Widget Actions */}
        {widgetType && value !== '-' && (
          <View className="flex-row items-center flex-wrap">
            <Text className="text-gray-500 text-xs mr-2">Actions:</Text>
            <WidgetActionButtons
              fieldName={fieldName}
              fieldValue={value}
              widgetType={widgetType}
              widgetPermissions={widgetPermissions}
            />
          </View>
        )}
      </View>
    );
  };

  // If sections are defined, group fields by sections
  if (sections.length > 0) {
    return (
      <ScrollView className="flex-1 bg-gray-900/90 p-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-1 mr-4">
            <Text className="text-white text-2xl font-bold mb-1">Entry Details</Text>
            <Text className="text-gray-400 text-sm">{schema?.displayName || 'Record'}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
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
            {section.fields.map((fieldName: string) => renderField(fieldName))}
          </View>
        ))}

        {/* Action Buttons */}
        <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-700/50">
          <TouchableOpacity
            onPress={onDelete}
            className="bg-red-500/20 px-6 py-3 rounded-xl border border-red-500/30 flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="#F87171" />
            <Text className="text-red-400 text-sm font-semibold ml-2">Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onEdit}
            className="bg-blue-600 px-6 py-3 rounded-xl flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text className="text-white text-sm font-semibold ml-2">Edit Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Metadata */}
        <View className="bg-gray-800/50 rounded-xl p-4 mt-6 border border-gray-700/30">
          <Text className="text-gray-300 text-sm font-semibold mb-3">Metadata</Text>
          <View className="space-y-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 text-xs">Entry ID:</Text>
              <Text className="text-gray-300 text-xs font-mono">{entry._id?.slice(-8) || 'N/A'}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 text-xs">Created:</Text>
              <Text className="text-gray-300 text-xs">
                {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'N/A'}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 text-xs">Last Updated:</Text>
              <Text className="text-gray-300 text-xs">
                {entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // No sections - display all fields
  return (
    <ScrollView className="flex-1 bg-gray-900/90 p-6" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-1 mr-4">
          <Text className="text-white text-2xl font-bold mb-1">Entry Details</Text>
          <Text className="text-gray-400 text-sm">{schema?.displayName || 'Record'}</Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          className="bg-gray-700/50 p-2 rounded-lg border border-gray-600/50"
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* All Fields */}
      {Object.keys(properties).map((fieldName) => renderField(fieldName))}

      {/* Action Buttons */}
      <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-700/50">
        <TouchableOpacity
          onPress={onDelete}
          className="bg-red-500/20 px-6 py-3 rounded-xl border border-red-500/30 flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color="#F87171" />
          <Text className="text-red-400 text-sm font-semibold ml-2">Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onEdit}
          className="bg-blue-600 px-6 py-3 rounded-xl flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          <Text className="text-white text-sm font-semibold ml-2">Edit Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Metadata */}
      <View className="bg-gray-800/50 rounded-xl p-4 mt-6 border border-gray-700/30">
        <Text className="text-gray-300 text-sm font-semibold mb-3">Metadata</Text>
        <View className="space-y-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-400 text-xs">Entry ID:</Text>
            <Text className="text-gray-300 text-xs font-mono">{entry._id?.slice(-8) || 'N/A'}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-400 text-xs">Created:</Text>
            <Text className="text-gray-300 text-xs">
              {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'N/A'}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-400 text-xs">Last Updated:</Text>
            <Text className="text-gray-300 text-xs">
              {entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default EntryObjectView;

