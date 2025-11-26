import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

interface FileUploadWidgetProps {
  label?: string;
  required?: boolean;
  error?: string;
  value: string | string[]; // Can be single file URL or array of URLs
  onChangeText: (text: string | string[]) => void;
  placeholder?: string;
  accept?: string[]; // e.g., ['.pdf', '.jpg', '.png']
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
}

const FileUploadWidget: React.FC<FileUploadWidgetProps> = ({
  label,
  required,
  error,
  value,
  onChangeText,
  placeholder = 'Select file(s)',
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
}) => {
  const [uploading, setUploading] = useState(false);
  const files = Array.isArray(value) ? value : value ? [value] : [];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (uri: string): string => {
    const ext = uri.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image-outline';
    if (['pdf'].includes(ext || '')) return 'document-text-outline';
    if (['doc', 'docx'].includes(ext || '')) return 'document-outline';
    if (['xls', 'xlsx'].includes(ext || '')) return 'grid-outline';
    return 'attach-outline';
  };

  const handlePickImage = async () => {
    if (!ImagePicker) {
      Alert.alert('Not Available', 'Please install expo-image-picker: npx expo install expo-image-picker');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: multiple,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset) => asset.uri);
        const updatedFiles = multiple ? [...files, ...newFiles].slice(0, maxFiles) : newFiles[0];
        onChangeText(multiple ? updatedFiles : updatedFiles);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to pick image');
    }
  };

  const handlePickDocument = async () => {
    if (!DocumentPicker) {
      Alert.alert('Not Available', 'Please install expo-document-picker: npx expo install expo-document-picker');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: accept ? accept.join(',') : '*/*',
        multiple,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset) => asset.uri);
        const updatedFiles = multiple ? [...files, ...newFiles].slice(0, maxFiles) : newFiles[0];
        onChangeText(multiple ? updatedFiles : updatedFiles);
      }
    } catch (err: any) {
      if (err.code !== 'DOCUMENT_PICKER_CANCELED') {
        Alert.alert('Error', err.message || 'Failed to pick document');
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    if (multiple) {
      const newFiles = [...files];
      newFiles.splice(index, 1);
      onChangeText(newFiles);
    } else {
      onChangeText('');
    }
  };

  const handleFileSelect = () => {
    Alert.alert('Select File Type', 'Choose how to select files', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Image/Photo', onPress: handlePickImage },
      { text: 'Document', onPress: handlePickDocument },
    ]);
  };

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-white text-sm font-medium mb-2">
          {label}
          {required && <Text className="text-red-500"> *</Text>}
        </Text>
      )}

      {/* Upload Button */}
      <TouchableOpacity
        onPress={handleFileSelect}
        className={`flex-row items-center justify-center bg-white/10 rounded-xl px-4 py-4 ${
          error ? 'border border-red-500' : ''
        }`}
        disabled={uploading || (multiple && files.length >= maxFiles)}
      >
        {uploading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white">
              {multiple
                ? `${files.length}/${maxFiles} files${files.length > 0 ? ' selected' : ''}`
                : files.length > 0
                ? 'Change file'
                : placeholder}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* File List */}
      {files.length > 0 && (
        <View className="mt-3 gap-2">
          {files.map((file, index) => {
            const fileName = file.split('/').pop() || `File ${index + 1}`;
            const isImage = file.startsWith('file://') || file.startsWith('http') 
              ? ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => fileName.toLowerCase().includes(ext))
              : false;

            return (
              <View
                key={index}
                className="bg-black/30 backdrop-blur-sm rounded-xl p-3 flex-row items-center"
              >
                {/* Preview/Icon */}
                <View className="w-12 h-12 items-center justify-center bg-white/10 rounded-lg mr-3">
                  {isImage ? (
                    <Image source={{ uri: file }} className="w-12 h-12 rounded-lg" />
                  ) : (
                    <Ionicons name={getFileIcon(fileName) as any} size={24} color="white" />
                  )}
                </View>

                {/* File Info */}
                <View className="flex-1 mr-2">
                  <Text className="text-white text-sm font-medium" numberOfLines={1}>
                    {fileName}
                  </Text>
                  <Text className="text-white/60 text-xs mt-1">
                    {file.length > 50 ? 'File selected' : file.substring(0, 50)}
                  </Text>
                </View>

                {/* Remove Button */}
                <TouchableOpacity
                  onPress={() => handleRemoveFile(index)}
                  className="w-8 h-8 items-center justify-center"
                >
                  <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Helper Text */}
      {accept && (
        <Text className="text-white/60 text-xs mt-2">
          Accepted formats: {accept.join(', ')}
        </Text>
      )}
      {maxSize && (
        <Text className="text-white/60 text-xs mt-1">
          Max size: {formatFileSize(maxSize)} {multiple && `| Max files: ${maxFiles}`}
        </Text>
      )}

      {error && <Text className="text-red-400 text-xs mt-1">{error}</Text>}
    </View>
  );
};

export default FileUploadWidget;

