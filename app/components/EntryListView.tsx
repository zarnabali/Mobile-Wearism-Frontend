import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WidgetActionButtons from './WidgetActionButtons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface EntryListViewProps {
  entries: any[];
  schema: any;
  layout?: 'column' | 'row' | 'grid';
  onEntryPress: (entry: any) => void;
  onEditEntry: (entry: any) => void;
  onDeleteEntry: (entry: any) => void;
  onBack?: () => void;
  onAddNew?: () => void;
}

const capitalize = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

const EntryListView: React.FC<EntryListViewProps> = ({
  entries,
  schema,
  layout = 'column',
  onEntryPress,
  onEditEntry,
  onDeleteEntry,
  onBack,
  onAddNew,
}) => {
  const [viewMode, setViewMode] = useState<'column' | 'row' | 'card'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadOption, setDownloadOption] = useState<'all' | 'filtered' | 'selected'>('all');
  const [downloadFormat, setDownloadFormat] = useState<'column' | 'row'>('column');

  const properties = schema?.jsonSchema?.properties || {};
  const fieldMapping = schema?.fieldMapping || {};
  const widgetPermissions = schema?.widgetPermissions || {};
  const schemaName = schema?.displayName || schema?.name || 'Data';

  // Filter entries based on search
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    
    const query = searchQuery.toLowerCase();
    return entries.filter((entry) => {
      return Object.keys(properties).some((fieldName) => {
        const value = entry[fieldName];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [entries, searchQuery, properties]);

  // Get visible field names (exclude system fields)
  const visibleFields = useMemo(() => {
    return Object.keys(properties).filter(
      (fieldName) => !['_id', '_schemaName', 'createdAt', 'updatedAt', '__v'].includes(fieldName)
    );
  }, [properties]);

  const getFieldValue = (entry: any, fieldName: string) => {
    const value = entry[fieldName];
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getWidgetType = (fieldName: string): 'email_field' | 'phone_field' | 'location_field' | null => {
    const mapping = fieldMapping[fieldName];
    if (mapping === 'email_field' || mapping === 'phone_field' || mapping === 'location_field') {
      return mapping;
    }
    return null;
  };

  const renderCellContent = (entry: any, fieldName: string) => {
    const value = getFieldValue(entry, fieldName);
    const widgetType = getWidgetType(fieldName);

    return (
      <View className="flex-1 px-1 py-1">
        <Text className="text-gray-300 text-xs mb-1" numberOfLines={1}>
          {value}
        </Text>
        {widgetType && value !== '-' && (
          <View className="mt-1">
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

  // Excel Download Function
  const handleDownloadExcel = async () => {
    try {
      const dataToExport = downloadOption === 'filtered' ? filteredEntries : entries;
      
      if (dataToExport.length === 0) {
        Alert.alert('No Data', 'No data available to export');
        return;
      }

      // Generate CSV content (simplified Excel format)
      let csvContent = '';
      
      if (downloadFormat === 'column') {
        // Column View: Headers are field names
        const headers = visibleFields.map(capitalize).join(',');
        csvContent += headers + '\n';
        
        // Rows are entries
        dataToExport.forEach((entry) => {
          const row = visibleFields.map((field) => {
            const val = getFieldValue(entry, field);
            return `"${val.replace(/"/g, '""')}"`;
          }).join(',');
          csvContent += row + '\n';
        });
      } else {
        // Row View: Transposed - first column is field names
        csvContent += 'Fields,' + dataToExport.map((_, idx) => `Item ${idx + 1}`).join(',') + '\n';
        
        visibleFields.forEach((fieldName) => {
          const row = [capitalize(fieldName)];
          dataToExport.forEach((entry) => {
            const val = getFieldValue(entry, fieldName);
            row.push(`"${val.replace(/"/g, '""')}"`);
          });
          csvContent += row.join(',') + '\n';
        });
      }

      // Save file using expo-file-system and expo-sharing
      const fileName = `${schemaName}_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Try to get document directory or use cache directory as fallback
      let fileUri: string;
      try {
        // Access FileSystem properties with type assertion
        const fs = FileSystem as any;
        const docDir = fs.documentDirectory || fs.cacheDirectory;
        
        if (!docDir) {
          throw new Error('No file system directory available');
        }
        fileUri = docDir + fileName;
        
        // Write file
        await fs.writeAsStringAsync(fileUri, csvContent, {
          encoding: fs.EncodingType?.UTF8 || 'utf8',
        });

        console.log('File saved to:', fileUri);

        // Share file
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: `Export ${schemaName}`,
            UTI: 'public.comma-separated-values-text',
          });
          
          Alert.alert(
            'Success!',
            `✅ File exported successfully!\n\nFile: ${fileName}\nRows: ${dataToExport.length}`,
            [{ text: 'OK', onPress: () => setShowDownloadModal(false) }]
          );
        } else {
          // Sharing not available - file saved but can't share
          Alert.alert(
            'File Saved',
            `File saved to:\n${fileUri}\n\nSharing not available on this device. You can access the file from the app's document directory.`,
            [{ text: 'OK', onPress: () => setShowDownloadModal(false) }]
          );
        }
      } catch (fsError: any) {
        console.error('File system error:', fsError);
        // Fallback: Try to share the CSV content directly as text
        try {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            // Create a temporary file in cache
            const fs = FileSystem as any;
            const cacheDir = fs.cacheDirectory;
            if (cacheDir) {
              const tempUri = cacheDir + fileName;
              await fs.writeAsStringAsync(tempUri, csvContent, {
                encoding: fs.EncodingType?.UTF8 || 'utf8',
              });
              await Sharing.shareAsync(tempUri, {
                mimeType: 'text/csv',
                dialogTitle: `Export ${schemaName}`,
              });
              Alert.alert(
                'Success!',
                `✅ File exported successfully!\n\nFile: ${fileName}\nRows: ${dataToExport.length}`,
                [{ text: 'OK', onPress: () => setShowDownloadModal(false) }]
              );
              return;
            }
          }
        } catch (shareError: any) {
          console.error('Share error:', shareError);
        }
        
        // Last resort: Show preview
        Alert.alert(
          'Export Error',
          `File system error: ${fsError.message}\n\nShowing preview instead. Please ensure expo-file-system is properly installed and the app has been rebuilt.\n\nError details: ${fsError.toString()}`,
          [
            { text: 'OK', onPress: () => setShowDownloadModal(false) },
            {
              text: 'Preview',
              onPress: () => {
                Alert.alert('CSV Preview', csvContent.split('\n').slice(0, 10).join('\n') + '\n...');
              },
            },
          ]
        );
      }
      
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert(
        'Export Error',
        `Failed to export file:\n${error.message}\n\nPlease ensure expo-file-system and expo-sharing are installed:\n\nnpx expo install expo-file-system expo-sharing`,
        [{ text: 'OK', onPress: () => setShowDownloadModal(false) }]
      );
    }
  };

  // Render Column View (Excel-like table)
  const renderColumnView = () => (
    <View className="flex-1">
      {/* Use nestedScrollEnabled for smooth scrolling */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true} 
        className="flex-1"
        nestedScrollEnabled={true}
      >
        <View>
          {/* Table Header */}
          <View className="flex-row bg-gray-900/90 border-b-2 border-gray-700/50">
            {/* Fixed header columns */}
            {visibleFields.map((fieldName) => (
              <View key={fieldName} className="px-4 py-4 border-r border-gray-700/50" style={{ width: 180 }}>
                <Text className="text-gray-200 text-sm font-bold" numberOfLines={1}>
                  {capitalize(fieldName)}
                </Text>
              </View>
            ))}
            <View className="px-4 py-4" style={{ width: 120 }}>
              <Text className="text-gray-200 text-sm font-bold text-center">Actions</Text>
            </View>
          </View>

          {/* Table Rows - Use FlatList for better performance and smooth scrolling */}
          <ScrollView 
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
          >
            {filteredEntries.map((entry, rowIndex) => (
              <View
                key={entry._id || rowIndex}
                className={`flex-row ${rowIndex % 2 === 0 ? 'bg-gray-800/60' : 'bg-gray-800/40'} border-b border-gray-700/30`}
                style={{ minHeight: 60 }}
              >
                {/* Data cells */}
                {visibleFields.map((fieldName) => (
                  <TouchableOpacity
                    key={fieldName}
                    onPress={() => onEntryPress(entry)}
                    className="border-r border-gray-700/30 justify-center"
                    style={{ width: 180 }}
                    activeOpacity={0.7}
                  >
                    <View className="px-3 py-2">
                      {renderCellContent(entry, fieldName)}
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Action buttons cell */}
                <View className="justify-center items-center" style={{ width: 120 }}>
                  <View className="flex-row" style={{ gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => onEditEntry(entry)}
                      className="bg-blue-500/20 p-2.5 rounded-lg border border-blue-500/30"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={16} color="#60A5FA" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onDeleteEntry(entry)}
                      className="bg-red-500/20 p-2.5 rounded-lg border border-red-500/30"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Empty state */}
      {filteredEntries.length === 0 && (
        <View className="flex-1 items-center justify-center py-12">
          <Ionicons name="document-text-outline" size={64} color="#6B7280" />
          <Text className="text-gray-400 text-lg font-medium mt-4">No entries found</Text>
          <Text className="text-gray-500 text-sm text-center mt-2 px-6">
            {searchQuery ? `No results for "${searchQuery}"` : 'No data available'}
          </Text>
        </View>
      )}
    </View>
  );

  // Render Row View (Transposed table)
  const renderRowView = () => (
    <View className="flex-1">
      {/* Use nestedScrollEnabled for smooth scrolling */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true} 
        className="flex-1"
        nestedScrollEnabled={true}
      >
        <View>
          {/* Table Header */}
          <View className="flex-row bg-gray-900/90 border-b-2 border-gray-700/50">
            {/* First column: "Fields" header */}
            <View className="px-4 py-4 border-r border-gray-700/50 bg-gray-900" style={{ width: 160 }}>
              <Text className="text-gray-200 text-sm font-bold">Fields</Text>
            </View>
            {/* Remaining columns: Entry numbers */}
            {filteredEntries.map((entry, index) => (
              <View key={entry._id || index} className="px-4 py-4 border-r border-gray-700/50" style={{ width: 180 }}>
                <Text className="text-gray-200 text-sm font-bold" numberOfLines={1}>
                  Item {index + 1}
                </Text>
              </View>
            ))}
          </View>

          {/* Table Rows (each row is a field) - Use nestedScrollEnabled for smooth scrolling */}
          <ScrollView 
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
          >
            {visibleFields.map((fieldName, fieldIndex) => (
              <View
                key={fieldName}
                className={`flex-row ${fieldIndex % 2 === 0 ? 'bg-gray-800/60' : 'bg-gray-800/40'} border-b border-gray-700/30`}
                style={{ minHeight: 60 }}
              >
                {/* First cell: Field name */}
                <View className="px-4 py-3 border-r border-gray-700/50 bg-gray-900/50 justify-center" style={{ width: 160 }}>
                  <Text className="text-gray-300 text-sm font-semibold" numberOfLines={1}>
                    {capitalize(fieldName)}
                  </Text>
                </View>

                {/* Remaining cells: Field values for each entry */}
                {filteredEntries.map((entry) => (
                  <TouchableOpacity
                    key={entry._id || entry.name}
                    onPress={() => onEntryPress(entry)}
                    className="border-r border-gray-700/30 justify-center"
                    style={{ width: 180 }}
                    activeOpacity={0.7}
                  >
                    <View className="px-3 py-2">
                      {renderCellContent(entry, fieldName)}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Actions Row */}
            <View className="flex-row bg-gray-900/70 border-t-2 border-gray-700/50" style={{ minHeight: 60 }}>
              <View className="px-4 py-3 border-r border-gray-700/50 justify-center" style={{ width: 160 }}>
                <Text className="text-gray-300 text-sm font-semibold">Actions</Text>
              </View>
              {filteredEntries.map((entry) => (
                <View
                  key={entry._id}
                  className="border-r border-gray-700/30 justify-center items-center"
                  style={{ width: 180 }}
                >
                  <View className="flex-row" style={{ gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => onEditEntry(entry)}
                      className="bg-blue-500/20 p-2.5 rounded-lg border border-blue-500/30"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={16} color="#60A5FA" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onDeleteEntry(entry)}
                      className="bg-red-500/20 p-2.5 rounded-lg border border-red-500/30"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Empty state */}
      {filteredEntries.length === 0 && (
        <View className="flex-1 items-center justify-center py-12">
          <Ionicons name="document-text-outline" size={64} color="#6B7280" />
          <Text className="text-gray-400 text-lg font-medium mt-4">No entries found</Text>
          <Text className="text-gray-500 text-sm text-center mt-2 px-6">
            {searchQuery ? `No results for "${searchQuery}"` : 'No data available'}
          </Text>
        </View>
      )}
    </View>
  );

  // Render Card View (Original UI)
  const renderCardView = () => (
    <ScrollView className="flex-1 px-4 pt-2" showsVerticalScrollIndicator={false}>
      {filteredEntries.map((entry, index) => (
        <TouchableOpacity
          key={entry._id || index}
          onPress={() => onEntryPress(entry)}
          activeOpacity={0.8}
          className="bg-gray-800/60 rounded-2xl p-5 mb-4 border border-gray-700/50"
        >
          {/* Entry Header */}
          <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-gray-700/50">
            <Text className="text-white text-base font-semibold" numberOfLines={1}>
              Entry #{index + 1}
            </Text>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onEditEntry(entry);
                }}
                className="bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30"
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={16} color="#60A5FA" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onDeleteEntry(entry);
                }}
                className="bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/30"
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#F87171" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Fields - Vertical */}
          {visibleFields.map((fieldName) => {
            const value = getFieldValue(entry, fieldName);
            const widgetType = getWidgetType(fieldName);

            return (
              <View key={fieldName} className="mb-3">
                <Text className="text-gray-400 text-xs mb-1 font-medium" numberOfLines={1}>
                  {capitalize(fieldName)}
                </Text>
                <View className="flex-row items-center flex-wrap">
                  <Text className="text-gray-300 text-sm flex-shrink" numberOfLines={2}>
                    {value}
                  </Text>
                  {widgetType && value !== '-' && (
                    <WidgetActionButtons
                      fieldName={fieldName}
                      fieldValue={value}
                      widgetType={widgetType}
                      widgetPermissions={widgetPermissions}
                    />
                  )}
                </View>
              </View>
            );
          })}

          {/* Metadata */}
          {entry.createdAt && (
            <View className="mt-3 pt-3 border-t border-gray-700/50">
              <Text className="text-gray-500 text-xs">
                Created: {new Date(entry.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Empty state for card view */}
      {filteredEntries.length === 0 && (
        <View className="flex-1 items-center justify-center py-12">
          <Ionicons name="document-text-outline" size={64} color="#6B7280" />
          <Text className="text-gray-400 text-lg font-medium mt-4">No entries found</Text>
          <Text className="text-gray-500 text-sm text-center mt-2 px-6">
            {searchQuery ? `No results for "${searchQuery}"` : 'No data available'}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // Main Render
  return (
    <View className="flex-1 bg-gray-900 rounded-3xl overflow-hidden">
      {/* Header Section */}
      <View className="bg-gray-900/95 border-b border-gray-800 pb-4">
        {/* Top Row: Back, Title, View Toggle */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-3">
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              className="mr-3 bg-gray-800/60 p-2 rounded-lg border border-gray-700/50"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          <View className="flex-1">
            <Text className="text-white text-xl font-bold" numberOfLines={1}>
              {schemaName}
            </Text>
            <Text className="text-gray-400 text-sm mt-0.5">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'item' : 'items'}
              {searchQuery && ` (filtered from ${entries.length})`}
            </Text>
          </View>
          {/* View Toggle - 3 options */}
          <View className="flex-row bg-gray-800/60 rounded-lg border border-gray-700/50" style={{ gap: 0 }}>
            <TouchableOpacity
              onPress={() => setViewMode('card')}
              className={`px-3 py-2 ${viewMode === 'card' ? 'bg-blue-600' : ''} rounded-l-lg`}
              activeOpacity={0.7}
            >
              <Ionicons name="albums-outline" size={18} color={viewMode === 'card' ? '#FFFFFF' : '#9CA3AF'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('column')}
              className={`px-3 py-2 ${viewMode === 'column' ? 'bg-blue-600' : ''} border-l border-gray-700/50`}
              activeOpacity={0.7}
            >
              <Ionicons name="grid-outline" size={18} color={viewMode === 'column' ? '#FFFFFF' : '#9CA3AF'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('row')}
              className={`px-3 py-2 ${viewMode === 'row' ? 'bg-blue-600' : ''} rounded-r-lg border-l border-gray-700/50`}
              activeOpacity={0.7}
            >
              <Ionicons name="list-outline" size={18} color={viewMode === 'row' ? '#FFFFFF' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Row: Search, Download, Add */}
        <View className="flex-row items-center px-6" style={{ gap: 8 }}>
          {/* Search */}
          <View className="flex-1 flex-row items-center bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/50">
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-white text-sm"
              placeholder="Search..."
              placeholderTextColor="rgba(156, 163, 175, 0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Download Excel */}
          <TouchableOpacity
            onPress={() => setShowDownloadModal(true)}
            className="bg-emerald-600/20 px-3 py-2 rounded-xl border border-emerald-600/30"
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={18} color="#10B981" />
          </TouchableOpacity>

          {/* Add New */}
          {onAddNew && (
            <TouchableOpacity
              onPress={onAddNew}
              className="bg-blue-600 px-3 py-2 rounded-xl"
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Table/Card View */}
      {viewMode === 'card' ? renderCardView() : viewMode === 'column' ? renderColumnView() : renderRowView()}

      {/* Download Modal */}
      <Modal
        visible={showDownloadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDownloadModal(false)}
      >
        <View className="flex-1 bg-black/70 items-center justify-center px-6">
          <View className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700/50">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center px-6 pt-6 pb-4 border-b border-gray-800">
              <Text className="text-white text-xl font-bold">Download Options</Text>
              <TouchableOpacity onPress={() => setShowDownloadModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <View className="px-6 py-4">
              {/* Data Selection */}
              <Text className="text-gray-300 text-sm font-semibold mb-3">Data to Export:</Text>
              <View className="mb-4">
                <TouchableOpacity
                  onPress={() => setDownloadOption('all')}
                  className={`flex-row items-center px-4 py-3 rounded-xl mb-2 border ${
                    downloadOption === 'all' ? 'bg-blue-600/20 border-blue-500/50' : 'bg-gray-800/50 border-gray-700/50'
                  }`}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={downloadOption === 'all' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={downloadOption === 'all' ? '#60A5FA' : '#6B7280'}
                  />
                  <Text className={`ml-3 ${downloadOption === 'all' ? 'text-blue-400' : 'text-gray-300'}`}>
                    All Records ({entries.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDownloadOption('filtered')}
                  className={`flex-row items-center px-4 py-3 rounded-xl border ${
                    downloadOption === 'filtered' ? 'bg-blue-600/20 border-blue-500/50' : 'bg-gray-800/50 border-gray-700/50'
                  }`}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={downloadOption === 'filtered' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={downloadOption === 'filtered' ? '#60A5FA' : '#6B7280'}
                  />
                  <Text className={`ml-3 ${downloadOption === 'filtered' ? 'text-blue-400' : 'text-gray-300'}`}>
                    Filtered Results ({filteredEntries.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Format Selection */}
              <Text className="text-gray-300 text-sm font-semibold mb-3 mt-2">Format:</Text>
              <View className="mb-4">
                <TouchableOpacity
                  onPress={() => setDownloadFormat('column')}
                  className={`flex-row items-center px-4 py-3 rounded-xl mb-2 border ${
                    downloadFormat === 'column' ? 'bg-blue-600/20 border-blue-500/50' : 'bg-gray-800/50 border-gray-700/50'
                  }`}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={downloadFormat === 'column' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={downloadFormat === 'column' ? '#60A5FA' : '#6B7280'}
                  />
                  <Text className={`ml-3 ${downloadFormat === 'column' ? 'text-blue-400' : 'text-gray-300'}`}>
                    Column View (.csv)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDownloadFormat('row')}
                  className={`flex-row items-center px-4 py-3 rounded-xl border ${
                    downloadFormat === 'row' ? 'bg-blue-600/20 border-blue-500/50' : 'bg-gray-800/50 border-gray-700/50'
                  }`}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={downloadFormat === 'row' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={downloadFormat === 'row' ? '#60A5FA' : '#6B7280'}
                  />
                  <Text className={`ml-3 ${downloadFormat === 'row' ? 'text-blue-400' : 'text-gray-300'}`}>
                    Row View (.csv)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Actions */}
            <View className="flex-row px-6 py-4 border-t border-gray-800" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowDownloadModal(false)}
                className="flex-1 bg-gray-800 py-3 rounded-xl border border-gray-700"
                activeOpacity={0.7}
              >
                <Text className="text-gray-300 text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDownloadExcel}
                className="flex-1 bg-emerald-600 py-3 rounded-xl"
                activeOpacity={0.7}
              >
                <Text className="text-white text-center font-semibold">Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EntryListView;

