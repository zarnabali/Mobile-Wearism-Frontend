import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackgroundImage from '../../../app/components/BackgroundImage';
import { ActionHandler } from '../../services/ActionHandler';

export interface ColumnDefinition {
  name: string;
  label: string;
  width?: string;
  actions?: string[];
  type?: string;
}

export interface ListRowAction {
  id: string;
  label: string;
  type?: 'edit' | 'delete' | 'view' | 'custom';
}

export interface DynamicListProps {
  title?: string;
  columns: ColumnDefinition[];
  data: Record<string, any>[];
  rowActions?: ListRowAction[];
  onRowAction?: (actionId: string, rowId: string, rowData: Record<string, any>) => void;
  onFieldAction?: (actionId: string, rowId: string, fieldName: string, value: any) => void;
  pagination?: {
    pageSize?: number;
  };
  userRole?: string;
}

const DynamicList: React.FC<DynamicListProps> = ({
  title,
  columns,
  data,
  rowActions = [],
  onRowAction,
  onFieldAction,
  pagination = { pageSize: 20 },
  userRole = 'customer',
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = pagination.pageSize || 20;

  const paginatedData = useMemo(() => {
    return data.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  }, [data, currentPage, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);

  const handleFieldAction = async (
    actionId: string,
    rowId: string,
    fieldName: string,
    value: any
  ) => {
    try {
      await ActionHandler.handleFieldAction(
        {
          actionId,
          fieldName,
          value,
          recordId: rowId,
        },
        userRole
      );
      if (onFieldAction) {
        onFieldAction(actionId, rowId, fieldName, value);
      }
    } catch (err: any) {
      // Error is handled by ActionHandler
      console.error('Field action error:', err);
    }
  };

  const renderFieldActionButtons = (column: ColumnDefinition, value: any, rowId: string) => {
    if (!column.actions || column.actions.length === 0) return null;

    return (
      <View className="flex-row gap-2 ml-2">
        {column.actions.includes('send_mail') && (
          <TouchableOpacity
            onPress={() => handleFieldAction('send_mail', rowId, column.name, value)}
            className="w-8 h-8 items-center justify-center"
          >
            <Ionicons name="mail" size={16} color="#60A5FA" />
          </TouchableOpacity>
        )}
        {column.actions.includes('call') && (
          <TouchableOpacity
            onPress={() => handleFieldAction('call', rowId, column.name, value)}
            className="w-8 h-8 items-center justify-center"
          >
            <Ionicons name="call" size={16} color="#10B981" />
          </TouchableOpacity>
        )}
        {column.actions.includes('sms') && (
          <TouchableOpacity
            onPress={() => handleFieldAction('sms', rowId, column.name, value)}
            className="w-8 h-8 items-center justify-center"
          >
            <Ionicons name="chatbubble-outline" size={16} color="#2196F3" />
          </TouchableOpacity>
        )}
        {column.actions.includes('whatsapp') && (
          <TouchableOpacity
            onPress={() => handleFieldAction('whatsapp', rowId, column.name, value)}
            className="w-8 h-8 items-center justify-center"
          >
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
          </TouchableOpacity>
        )}
        {column.actions.includes('view_map') && (
          <TouchableOpacity
            onPress={() => handleFieldAction('view_map', rowId, column.name, value)}
            className="w-8 h-8 items-center justify-center"
          >
            <Ionicons name="map" size={16} color="#FF9800" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderRow = ({ item }: { item: Record<string, any> }) => {
    const rowId = item.id || item._id || String(item[columns[0]?.name] || '');

    return (
      <View className="bg-black/30 backdrop-blur-sm rounded-xl p-4 mb-3 flex-row items-center">
        {/* Columns */}
        {columns.map((column) => (
          <View key={column.name} className="flex-1 flex-row items-center">
            <Text className="text-white text-sm flex-1" numberOfLines={1}>
              {item[column.name] || '-'}
            </Text>
            {renderFieldActionButtons(column, item[column.name], rowId)}
          </View>
        ))}

        {/* Row Actions */}
        {rowActions.length > 0 && (
          <View className="flex-row gap-2 ml-4">
            {rowActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => onRowAction?.(action.id, rowId, item)}
                className="w-8 h-8 items-center justify-center"
              >
                <Ionicons
                  name={
                    action.type === 'edit'
                      ? 'create-outline'
                      : action.type === 'delete'
                      ? 'trash-outline'
                      : action.type === 'view'
                      ? 'eye-outline'
                      : 'ellipsis-horizontal'
                  }
                  size={18}
                  color={
                    action.type === 'delete' ? '#FF6B6B' : action.type === 'edit' ? '#60A5FA' : '#fff'
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <BackgroundImage>
      <View className="flex-1">
        {title && (
          <View className="px-6 pt-8 pb-4">
            <Text className="text-white text-2xl font-bold">{title}</Text>
          </View>
        )}

        {/* Header */}
        <View className="px-6 pb-4">
          <View className="bg-black/30 backdrop-blur-sm rounded-xl p-4 flex-row items-center">
            {columns.map((column) => (
              <Text key={column.name} className="text-white/80 text-xs font-semibold flex-1">
                {column.label}
              </Text>
            ))}
            {rowActions.length > 0 && <View className="w-20" />}
          </View>
        </View>

        {/* List */}
        <FlatList
          data={paginatedData}
          renderItem={renderRow}
          keyExtractor={(item, index) => item.id || item._id || String(index)}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="bg-black/30 backdrop-blur-sm rounded-xl p-8 items-center mt-4">
              <Ionicons name="list-outline" size={48} color="rgba(255,255,255,0.5)" />
              <Text className="text-white/60 text-center mt-4">No items found</Text>
            </View>
          }
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <View className="bg-black/30 backdrop-blur-sm px-6 py-4 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className={`px-4 py-2 rounded-lg ${
                currentPage === 0 ? 'bg-white/10' : 'bg-blue-600'
              }`}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentPage === 0 ? 'rgba(255,255,255,0.5)' : 'white'}
              />
            </TouchableOpacity>

            <Text className="text-white text-sm">
              Page {currentPage + 1} of {totalPages}
            </Text>

            <TouchableOpacity
              onPress={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className={`px-4 py-2 rounded-lg ${
                currentPage >= totalPages - 1 ? 'bg-white/10' : 'bg-blue-600'
              }`}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentPage >= totalPages - 1 ? 'rgba(255,255,255,0.5)' : 'white'}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </BackgroundImage>
  );
};

export default DynamicList;

