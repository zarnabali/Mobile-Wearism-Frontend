import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ViewJSON, Widget } from '../DynamicViewRenderer';
import DynamicForm from './DynamicForm';
import DynamicList from './DynamicList';
import DynamicDetail from './DynamicDetail';
import DynamicWizard, { WizardStep } from './DynamicWizard';
import BackgroundImage from '../../../app/components/BackgroundImage';

export interface EnhancedDynamicViewRendererProps {
  viewJson: ViewJSON;
  schemaJson?: any;
  userRole?: string;
  context?: Record<string, any>;
  onSubmit?: (data: Record<string, any>) => void;
  onAction?: (action: { actionId: string; fieldName?: string; value?: any; rowId?: string }) => void;
  data?: Record<string, any> | Record<string, any>[]; // For list/detail views
  viewType?: 'form' | 'list' | 'detail' | 'wizard'; // Explicit view type override
}

const EnhancedDynamicViewRenderer: React.FC<EnhancedDynamicViewRendererProps> = ({
  viewJson,
  schemaJson,
  userRole,
  context = {},
  onSubmit,
  onAction,
  data,
  viewType,
}) => {
  const [loading, setLoading] = useState(false);

  // Determine view type from viewJson or prop
  const detectedViewType = viewType || viewJson.type || 'form';

  // Check if view is a wizard (has steps in metadata)
  const isWizard = viewJson.meta?.mode === 'wizard' || viewJson.meta?.steps || detectedViewType === 'wizard';

  // Extract wizard steps if available
  const wizardSteps: WizardStep[] = viewJson.meta?.steps || (isWizard ? [
    {
      id: 'step1',
      title: 'Step 1',
      fields: viewJson.widgets.map(w => w.key),
    },
  ] : []);

  // Render appropriate view based on type
  const renderView = () => {
    switch (detectedViewType) {
      case 'list':
        // Extract columns from widgets or use provided structure
        const columns = viewJson.meta?.columns || viewJson.widgets.map((widget) => ({
          name: widget.key,
          label: widget.label || widget.key,
          actions: widget.autoActions
            ? Object.entries(widget.autoActions)
                .filter(([_, enabled]) => enabled)
                .map(([action]) => {
                  if (action === 'email') return 'send_mail';
                  if (action === 'call') return 'call';
                  if (action === 'map') return 'view_map';
                  return action;
                })
            : [],
        }));

        return (
          <DynamicList
            title={viewJson.title}
            columns={columns}
            data={Array.isArray(data) ? data : []}
            rowActions={viewJson.meta?.rowActions || []}
            onRowAction={(actionId, rowId, rowData) => {
              onAction?.({ actionId, rowId });
            }}
            onFieldAction={(actionId, rowId, fieldName, value) => {
              onAction?.({ actionId, fieldName, value, rowId });
            }}
            pagination={viewJson.meta?.pagination}
            userRole={userRole}
          />
        );

      case 'detail':
        const fields = viewJson.widgets.map((widget) => ({
          name: widget.key,
          label: widget.label || widget.key,
          type: widget.type,
          actions: widget.autoActions
            ? Object.entries(widget.autoActions)
                .filter(([_, enabled]) => enabled)
                .map(([action]) => {
                  if (action === 'email') return 'send_mail';
                  if (action === 'call') return 'call';
                  if (action === 'map') return 'view_map';
                  return action;
                })
            : [],
        }));

        return (
          <DynamicDetail
            title={viewJson.title}
            fields={fields}
            data={data && !Array.isArray(data) ? data : {}}
            actions={viewJson.meta?.actions || []}
            onAction={(actionId, data) => {
              onAction?.({ actionId });
            }}
            onFieldAction={(actionId, fieldName, value) => {
              onAction?.({ actionId, fieldName, value });
            }}
            userRole={userRole}
          />
        );

      case 'wizard':
      default:
        if (isWizard) {
          return (
            <DynamicWizard
              viewJson={viewJson}
              steps={wizardSteps}
              initialData={context}
              onSubmit={onSubmit}
              userRole={userRole}
            />
          );
        }
        // Fall through to form
        return (
          <DynamicForm
            viewJson={viewJson}
            initialData={context}
            onSubmit={onSubmit}
            onAction={onAction}
            userRole={userRole}
          />
        );
    }
  };

  if (loading) {
    return (
      <BackgroundImage>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-4">Loading view...</Text>
        </View>
      </BackgroundImage>
    );
  }

  return <>{renderView()}</>;
};

export default EnhancedDynamicViewRenderer;

