import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type JsonSchemaProperty = {
  type?: string;
  description?: string;
  format?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  [key: string]: any;
};

type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
};

type ViewConfigSection = {
  title: string;
  fields: string[];
  description?: string;
};

type ViewConfig = {
  viewType?: 'object' | 'form' | 'list' | 'detail' | 'wizard';
  formLayout?: 'column' | 'row' | 'grid';
  sections?: ViewConfigSection[];
  actions?: {
    id: string;
    label: string;
    type?: 'submit' | 'cancel' | 'primary' | 'secondary';
  }[];
};

export interface SchemaFormPreviewProps {
  jsonSchema?: JsonSchema | null;
  viewConfig?: ViewConfig | null;
  fieldMapping?: Record<string, string | undefined> | null;
  title?: string;
  description?: string;
}

const chipMeta: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  email_field: { label: 'Email', color: '#60A5FA', bgColor: 'rgba(96, 165, 250, 0.15)', icon: 'mail-outline' },
  phone_field: { label: 'Phone', color: '#34D399', bgColor: 'rgba(52, 211, 153, 0.15)', icon: 'call-outline' },
  location_field: { label: 'Location', color: '#A855F7', bgColor: 'rgba(168, 85, 247, 0.15)', icon: 'location-outline' },
};

const capitalize = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

const SchemaFormPreview: React.FC<SchemaFormPreviewProps> = ({
  jsonSchema,
  viewConfig,
  fieldMapping,
  title = 'Form Layout Preview',
  description = 'Preview of form sections and fields',
}) => {
  const properties = jsonSchema?.properties || {};
  const requiredFields = new Set(jsonSchema?.required || []);
  const mapping = fieldMapping || {};

  const sections = useMemo(() => {
    if (viewConfig?.sections && viewConfig.sections.length > 0) {
      return viewConfig.sections;
    }
    return [
      {
        title: 'Form Fields',
        description: 'All form fields',
        fields: Object.keys(properties),
      },
    ];
  }, [viewConfig?.sections, properties]);

  const renderFieldMeta = (fieldName: string) => {
    const property = properties[fieldName];
    if (!property) return null;

    const chips: React.ReactNode[] = [];
    const mappingKey = mapping[fieldName];

    if (mappingKey && chipMeta[mappingKey]) {
      const meta = chipMeta[mappingKey];
      chips.push(
        <View key={`${fieldName}-mapping`} className="flex-row items-center px-2 py-1 rounded-lg mr-2 mb-2" style={{ backgroundColor: meta.bgColor }}>
          <Ionicons name={meta.icon as any} size={12} color={meta.color} />
          <Text className="text-xs font-semibold ml-1 flex-shrink" style={{ color: meta.color }} numberOfLines={1}>
            {meta.label}
          </Text>
        </View>,
      );
    }

    if (property.enum) {
      chips.push(
        <View key={`${fieldName}-enum`} className="flex-row items-center px-2 py-1 rounded-lg mr-2 mb-2" style={{ backgroundColor: 'rgba(96, 165, 250, 0.15)' }}>
          <Ionicons name="list-circle-outline" size={12} color="#60A5FA" />
          <Text className="text-xs font-semibold ml-1 text-blue-400 flex-shrink" numberOfLines={1}>
            Options ({property.enum.length})
          </Text>
        </View>,
      );
    }

    return chips.length > 0 ? (
      <View className="flex-row flex-wrap mb-3">
        {chips}
      </View>
    ) : null;
  };

  return (
    <View className="bg-gray-800/50 rounded-2xl p-5 mb-6 border border-gray-700/50">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-6 pb-4 border-b border-gray-700/50">
        <View className="flex-1 mr-4">
          <Text className="text-white text-xl font-bold mb-1" numberOfLines={2}>
            {title}
          </Text>
          <Text className="text-gray-400 text-sm" numberOfLines={2}>
            {description}
          </Text>
        </View>
      </View>

      {/* Form Sections */}
      {sections.length > 0 ? (
        <View>
          {sections.map((section, sectionIndex) => (
            <View key={`section-${sectionIndex}`} className={sectionIndex < sections.length - 1 ? 'mb-6' : 'mb-0'}>
              {/* Section Header */}
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-lg bg-blue-500/20 items-center justify-center mr-3 border border-blue-500/30">
                  <Text className="text-blue-400 text-sm font-bold">{sectionIndex + 1}</Text>
                </View>
                <View className="flex-1 mr-2">
                  <Text className="text-white text-lg font-semibold mb-1" numberOfLines={1}>
                    {section.title}
                  </Text>
                  {section.description && (
                    <Text className="text-gray-400 text-xs" numberOfLines={2}>
                      {section.description}
                    </Text>
                  )}
                </View>
                <View className="bg-red-500/20 px-3 py-1 rounded-lg border border-red-500/30">
                  <Text className="text-red-400 text-xs font-semibold">{section.fields.length}</Text>
                </View>
              </View>

              {/* Fields List - Simple Vertical Layout */}
              <View>
                {section.fields.map((fieldName, fieldIndex) => {
                  const property = properties[fieldName];
                  if (!property) return null;

                  const isRequired = requiredFields.has(fieldName);
                  const isLastField = fieldIndex === section.fields.length - 1;

                  return (
                    <View key={fieldName} className={isLastField ? 'bg-gray-900/50 rounded-xl p-4 border border-gray-700/30' : 'bg-gray-900/50 rounded-xl p-4 border border-gray-700/30 mb-4'}>
                      {/* Field Header */}
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1 mr-2">
                          <View className="flex-row items-center mb-1 flex-wrap">
                            <Text className="text-white text-base font-semibold mr-2" numberOfLines={1}>
                              {capitalize(fieldName)}
                            </Text>
                            {isRequired && (
                              <View className="bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                                <Text className="text-red-400 text-xs font-bold">Required</Text>
                              </View>
                            )}
                          </View>
                          {property.description && (
                            <Text className="text-gray-400 text-sm mb-2" numberOfLines={3}>
                              {property.description}
                            </Text>
                          )}
                        </View>
                        {property.type && (
                          <View className="bg-gray-700/50 px-2 py-1 rounded border border-gray-600/50">
                            <Text className="text-gray-300 text-xs font-semibold" numberOfLines={1}>
                              {property.type}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Field Meta Chips */}
                      {renderFieldMeta(fieldName)}

                      {/* Input Mock */}
                      <View className="h-12 rounded-lg border border-gray-600/50 bg-gray-800/30 justify-center px-3 mb-3">
                        <View className="h-2 bg-gray-600/50 rounded" style={{ width: '75%' }} />
                      </View>

                      {/* Field Info */}
                      {(property.format || property.minimum !== undefined) && (
                        <View className="flex-row flex-wrap">
                          {property.format && (
                            <View className="flex-row items-center bg-gray-700/30 px-2 py-1 rounded border border-gray-600/30 mr-2 mb-2">
                              <Ionicons name="checkmark-circle-outline" size={10} color="#9CA3AF" />
                              <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
                                Format: {property.format}
                              </Text>
                            </View>
                          )}
                          {property.minimum !== undefined && (
                            <View className="flex-row items-center bg-gray-700/30 px-2 py-1 rounded border border-gray-600/30 mb-2">
                              <Ionicons name="stats-chart-outline" size={10} color="#9CA3AF" />
                              <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
                                Min: {property.minimum}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Actions Footer */}
          {viewConfig?.actions && viewConfig.actions.length > 0 && (
            <View className="mt-6 pt-4 border-t border-gray-700/50">
              <Text className="text-gray-300 text-sm font-semibold mb-4 uppercase">
                Form Actions
              </Text>
              <View className="flex-row flex-wrap">
                {viewConfig.actions.map((action) => {
                  const isPrimary = action.type === 'submit';
                  const isSecondary = action.type === 'cancel';

                  return (
                    <View
                      key={action.id}
                      className={`flex-row items-center justify-center px-4 py-3 rounded-lg border mr-3 mb-3 ${
                        isPrimary
                          ? 'bg-indigo-600 border-indigo-500/50'
                          : isSecondary
                          ? 'bg-gray-700/50 border-gray-600/50'
                          : 'bg-gray-700/30 border-gray-600/30'
                      }`}
                    >
                      <Ionicons
                        name={(isPrimary ? 'checkmark-circle' : 'close-circle') as any}
                        size={16}
                        color={isPrimary ? '#FFFFFF' : '#9CA3AF'}
                      />
                      <Text
                        className={`text-sm font-semibold ml-2 ${
                          isPrimary ? 'text-white' : isSecondary ? 'text-gray-200' : 'text-gray-400'
                        }`}
                        numberOfLines={1}
                      >
                        {action.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      ) : (
        <View className="items-center justify-center py-12">
          <Ionicons name="document-outline" size={48} color="#6B7280" />
          <Text className="text-gray-300 text-lg font-semibold mt-4">No sections defined</Text>
          <Text className="text-gray-500 text-sm text-center mt-2">
            Create sections in viewConfig to display fields
          </Text>
        </View>
      )}
    </View>
  );
};

export default SchemaFormPreview;
