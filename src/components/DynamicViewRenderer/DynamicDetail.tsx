import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackgroundImage from '../../../app/components/BackgroundImage';
import { ActionHandler } from '../../services/ActionHandler';

export interface FieldDefinition {
  name: string;
  label: string;
  type?: string;
  actions?: string[];
}

export interface DetailAction {
  id: string;
  label: string;
  type?: 'primary' | 'secondary' | 'danger';
}

export interface DynamicDetailProps {
  title?: string;
  fields: FieldDefinition[];
  data: Record<string, any>;
  actions?: DetailAction[];
  onAction?: (actionId: string, data: Record<string, any>) => void;
  onFieldAction?: (actionId: string, fieldName: string, value: any) => void;
  userRole?: string;
}

const DynamicDetail: React.FC<DynamicDetailProps> = ({
  title,
  fields,
  data,
  actions = [],
  onAction,
  onFieldAction,
  userRole = 'customer',
}) => {
  const handleFieldAction = async (actionId: string, fieldName: string, value: any) => {
    try {
      await ActionHandler.handleFieldAction(
        {
          actionId,
          fieldName,
          value,
          recordId: data.id || data._id,
        },
        userRole
      );
      if (onFieldAction) {
        onFieldAction(actionId, fieldName, value);
      }
    } catch (err: any) {
      console.error('Field action error:', err);
    }
  };

  const renderFieldActions = (field: FieldDefinition, value: any) => {
    if (!field.actions || field.actions.length === 0) return null;

    return (
      <View className="flex-row gap-2 mt-2">
        {field.actions.includes('send_mail') && (
          <TouchableOpacity
            onPress={() => handleFieldAction('send_mail', field.name, value)}
            className="bg-blue-600/20 rounded-lg px-3 py-2 flex-row items-center gap-2"
          >
            <Ionicons name="mail" size={16} color="#60A5FA" />
            <Text className="text-blue-400 text-xs">Email</Text>
          </TouchableOpacity>
        )}
        {field.actions.includes('call') && (
          <TouchableOpacity
            onPress={() => handleFieldAction('call', field.name, value)}
            className="bg-green-600/20 rounded-lg px-3 py-2 flex-row items-center gap-2"
          >
            <Ionicons name="call" size={16} color="#10B981" />
            <Text className="text-green-400 text-xs">Call</Text>
          </TouchableOpacity>
        )}
        {field.actions.includes('sms') && (
          <TouchableOpacity
            onPress={() => handleFieldAction('sms', field.name, value)}
            className="bg-blue-500/20 rounded-lg px-3 py-2 flex-row items-center gap-2"
          >
            <Ionicons name="chatbubble-outline" size={16} color="#2196F3" />
            <Text className="text-blue-300 text-xs">SMS</Text>
          </TouchableOpacity>
        )}
        {field.actions.includes('whatsapp') && (
          <TouchableOpacity
            onPress={() => handleFieldAction('whatsapp', field.name, value)}
            className="bg-[#25D366]/20 rounded-lg px-3 py-2 flex-row items-center gap-2"
          >
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            <Text className="text-[#25D366] text-xs">WhatsApp</Text>
          </TouchableOpacity>
        )}
        {field.actions.includes('view_map') && (
          <TouchableOpacity
            onPress={() => handleFieldAction('view_map', field.name, value)}
            className="bg-orange-600/20 rounded-lg px-3 py-2 flex-row items-center gap-2"
          >
            <Ionicons name="map" size={16} color="#FF9800" />
            <Text className="text-orange-400 text-xs">Map</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <BackgroundImage>
      <ScrollView className="flex-1">
        <View className="px-6 py-8">
          {title && (
            <Text className="text-white text-2xl font-bold mb-6">{title}</Text>
          )}

          {fields.map((field) => {
            const value = data[field.name];
            return (
              <View
                key={field.name}
                className="bg-black/30 backdrop-blur-sm rounded-xl p-6 mb-4"
              >
                <Text className="text-white/60 text-xs font-medium mb-2 uppercase">
                  {field.label}
                </Text>
                <Text className="text-white text-base mb-2">{value || '-'}</Text>
                {renderFieldActions(field, value)}
              </View>
            );
          })}

          {/* Detail Actions */}
          {actions.length > 0 && (
            <View className="mt-6 gap-3">
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  onPress={() => onAction?.(action.id, data)}
                  className={`rounded-xl py-4 items-center ${
                    action.type === 'primary'
                      ? 'bg-blue-600'
                      : action.type === 'danger'
                      ? 'bg-red-600'
                      : 'bg-white/10'
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      action.type === 'primary' || action.type === 'danger'
                        ? 'text-white'
                        : 'text-white'
                    }`}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </BackgroundImage>
  );
};

export default DynamicDetail;

