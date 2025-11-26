import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EntryListView from './EntryListView';
import EntryObjectView from './EntryObjectView';
import EntryFormView from './EntryFormView';
import { DynamicDataApi } from '../../src/utils/api';

interface SchemaEntriesViewProps {
  schema: any;
  entries: any[];
  onRefresh: () => void;
  schemaName: string;
}

type ViewMode = 'list' | 'object' | 'form';
type FormMode = 'create' | 'edit';

const SchemaEntriesView: React.FC<SchemaEntriesViewProps> = ({
  schema,
  entries,
  onRefresh,
  schemaName,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'object'>('list');
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showObjectModal, setShowObjectModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingEntry, setEditingEntry] = useState<any>(null);

  const layout = schema?.viewConfig?.formLayout || 'column';

  // Handle entry press - show object view
  const handleEntryPress = (entry: any) => {
    setSelectedEntry(entry);
    setShowObjectModal(true);
  };

  // Handle create new entry
  const handleCreateEntry = () => {
    setFormMode('create');
    setEditingEntry(null);
    setShowFormModal(true);
  };

  // Handle edit entry
  const handleEditEntry = (entry: any) => {
    setFormMode('edit');
    setEditingEntry(entry);
    setShowFormModal(true);
    setShowObjectModal(false);
  };

  // Handle delete entry
  const handleDeleteEntry = async (entry: any) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DynamicDataApi.deleteRecord(schemaName, entry._id);
              Alert.alert('Success', 'Entry deleted successfully');
              setShowObjectModal(false);
              onRefresh();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  // Handle save entry (create or update)
  const handleSaveEntry = async (data: any) => {
    try {
      if (formMode === 'create') {
        await DynamicDataApi.createRecord(schemaName, data);
        Alert.alert('Success', 'Entry created successfully');
      } else {
        await DynamicDataApi.updateRecord(schemaName, editingEntry._id, data);
        Alert.alert('Success', 'Entry updated successfully');
      }
      setShowFormModal(false);
      setEditingEntry(null);
      onRefresh();
    } catch (error: any) {
      throw error; // Let the form component handle the error
    }
  };

  return (
    <View className="flex-1">
      {/* Use EntryListView with built-in header (search, download, view toggle) */}
      <EntryListView
        entries={entries}
        schema={schema}
        layout={layout as 'column' | 'row' | 'grid'}
        onEntryPress={handleEntryPress}
        onEditEntry={handleEditEntry}
        onDeleteEntry={handleDeleteEntry}
        onAddNew={handleCreateEntry}
      />

      {/* Object View Modal */}
      <Modal
        visible={showObjectModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowObjectModal(false)}
      >
        {selectedEntry && (
          <EntryObjectView
            entry={selectedEntry}
            schema={schema}
            onEdit={() => handleEditEntry(selectedEntry)}
            onDelete={() => handleDeleteEntry(selectedEntry)}
            onClose={() => setShowObjectModal(false)}
          />
        )}
      </Modal>

      {/* Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFormModal(false)}
      >
        <EntryFormView
          schema={schema}
          initialData={editingEntry || {}}
          onSave={handleSaveEntry}
          onCancel={() => {
            setShowFormModal(false);
            setEditingEntry(null);
          }}
          mode={formMode}
        />
      </Modal>
    </View>
  );
};

export default SchemaEntriesView;

