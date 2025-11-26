/**
 * Maps JSON Schema properties to Widget definitions
 * This is the bridge between backend schemas and frontend widgets
 */

import { Widget, ViewJSON } from '../components/DynamicViewRenderer';

export interface SchemaProperty {
  type: string;
  format?: string;
  enum?: any[];
  items?: any;
  properties?: Record<string, SchemaProperty>;
  description?: string;
  title?: string;
  default?: any;
}

export interface JsonSchema {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

/**
 * Map JSON Schema property type to Widget type
 */
export function mapSchemaTypeToWidgetType(
  propertyName: string,
  property: SchemaProperty,
  schema: JsonSchema
): string {
  const type = property.type;
  const format = property.format;

  // Check field name patterns
  const lowerName = propertyName.toLowerCase();
  if (lowerName.includes('email')) return 'EmailInput';
  if (lowerName.includes('phone') || lowerName.includes('tel')) return 'PhoneInput';
  if (lowerName.includes('address') || lowerName.includes('location')) return 'AddressInput';
  if (lowerName.includes('date') || lowerName.includes('time')) return 'DatePicker';
  if (lowerName.includes('file') || lowerName.includes('document') || lowerName.includes('attachment')) return 'FileUpload';
  if (lowerName.includes('description') || lowerName.includes('notes') || lowerName.includes('comment')) return 'TextArea';

  // Check format
  if (format === 'email') return 'EmailInput';
  if (format === 'uri' || format === 'url') return 'TextInput';
  if (format === 'date' || format === 'date-time') return 'DatePicker';

  // Check enum (dropdown)
  if (property.enum && property.enum.length > 0) {
    return 'Dropdown';
  }

  // Check type
  if (type === 'string') {
    // Long strings -> TextArea
    if (property.description?.toLowerCase().includes('long') || 
        property.description?.toLowerCase().includes('multiple') ||
        lowerName.includes('description') ||
        lowerName.includes('notes')) {
      return 'TextArea';
    }
    return 'TextInput';
  }
  
  if (type === 'number' || type === 'integer') {
    return 'NumberInput';
  }
  
  if (type === 'boolean') {
    return 'Dropdown'; // Use dropdown for boolean (Yes/No)
  }

  if (type === 'array') {
    return 'FileUpload'; // Arrays often used for file uploads
  }

  if (type === 'object') {
    return 'TextInput'; // Complex objects as JSON strings
  }

  return 'TextInput'; // Default fallback
}

/**
 * Convert JSON Schema to ViewJSON with widgets
 */
export function convertSchemaToView(
  schemaName: string,
  schema: JsonSchema,
  options?: {
    title?: string;
    autoActions?: {
      email?: string[]; // Field names that should have email action
      call?: string[];  // Field names that should have call action
      map?: string[];   // Field names that should have map action
    };
    viewType?: 'form' | 'list' | 'detail' | 'wizard';
  }
): ViewJSON {
  const widgets: Widget[] = [];
  const required = schema.required || [];
  let order = 1;

  Object.entries(schema.properties || {}).forEach(([fieldName, property]) => {
    const widgetType = mapSchemaTypeToWidgetType(fieldName, property, schema);
    const isRequired = required.includes(fieldName);

    // Determine autoActions based on field name and options
    const autoActions: any = {};
    
    if (options?.autoActions) {
      if (options.autoActions.email?.includes(fieldName)) {
        autoActions.email = true;
      }
      if (options.autoActions.call?.includes(fieldName)) {
        autoActions.call = true;
      }
      if (options.autoActions.map?.includes(fieldName)) {
        autoActions.map = true;
      }
    } else {
      // Auto-detect based on field name
      const lowerName = fieldName.toLowerCase();
      if (lowerName.includes('email')) autoActions.email = true;
      if (lowerName.includes('phone') || lowerName.includes('tel')) {
        autoActions.call = true;
        autoActions.sms = true;
      }
      if (lowerName.includes('address') || lowerName.includes('location')) autoActions.map = true;
    }

    const widget: Widget = {
      key: fieldName,
      type: widgetType,
      label: property.title || fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
      required: isRequired,
      placeholder: property.description || `Enter ${fieldName}`,
      order: order++,
      autoActions: Object.keys(autoActions).length > 0 ? autoActions : undefined,
    };

    // Add options for dropdown
    if (widgetType === 'Dropdown' && property.enum) {
      widget.options = property.enum.map((value, index) => ({
        label: String(value),
        value: String(value),
      }));
    }

    // Add boolean options
    if (widgetType === 'Dropdown' && property.type === 'boolean') {
      widget.options = [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ];
    }

    widgets.push(widget);
  });

  return {
    id: `${schemaName}_form`,
    title: options?.title || `${schemaName.charAt(0).toUpperCase() + schemaName.slice(1)} Form`,
    type: options?.viewType || 'form',
    layout: 'column',
    widgets,
    defaultEndpoint: `/api/data/${schemaName}`,
  };
}

/**
 * Convert schema to List View
 */
export function convertSchemaToListView(
  schemaName: string,
  schema: JsonSchema,
  options?: {
    title?: string;
    columns?: string[]; // Fields to show in list
    actions?: string[]; // Fields that should have actions
  }
): ViewJSON {
  const columns = options?.columns || Object.keys(schema.properties || {}).slice(0, 5);
  
  const widgets = columns.map((fieldName) => {
    const property = schema.properties?.[fieldName];
    const lowerName = fieldName.toLowerCase();
    
    const autoActions: any = {};
    if (options?.actions?.includes(fieldName)) {
      if (lowerName.includes('email')) autoActions.email = true;
      if (lowerName.includes('phone')) {
        autoActions.call = true;
        autoActions.sms = true;
      }
      if (lowerName.includes('address')) autoActions.map = true;
    }

    return {
      key: fieldName,
      type: mapSchemaTypeToWidgetType(fieldName, property || { type: 'string' }, schema),
      label: property?.title || fieldName,
      autoActions: Object.keys(autoActions).length > 0 ? autoActions : undefined,
    };
  });

  return {
    id: `${schemaName}_list`,
    title: options?.title || `${schemaName.charAt(0).toUpperCase() + schemaName.slice(1)} List`,
    type: 'list',
    widgets,
    meta: {
      columns: columns.map((name) => ({
        name,
        label: schema.properties?.[name]?.title || name,
        actions: widgets.find(w => w.key === name)?.autoActions
          ? Object.keys(widgets.find(w => w.key === name)?.autoActions || {})
              .map(action => {
                if (action === 'email') return 'send_mail';
                if (action === 'call') return 'call';
                if (action === 'map') return 'view_map';
                return action;
              })
          : [],
      })),
      pagination: { pageSize: 20 },
      rowActions: [
        { id: 'edit', label: 'Edit', type: 'edit' },
        { id: 'delete', label: 'Delete', type: 'delete' },
      ],
    },
  };
}

/**
 * Convert schema to Detail View
 */
export function convertSchemaToDetailView(
  schemaName: string,
  schema: JsonSchema,
  options?: {
    title?: string;
  }
): ViewJSON {
  const widgets: Widget[] = Object.keys(schema.properties || {}).map((fieldName) => {
    const property = schema.properties?.[fieldName];
    const lowerName = fieldName.toLowerCase();

    const autoActions: any = {};
    if (lowerName.includes('email')) autoActions.email = true;
    if (lowerName.includes('phone')) {
      autoActions.call = true;
      autoActions.sms = true;
    }
    if (lowerName.includes('address')) autoActions.map = true;

    return {
      key: fieldName,
      type: mapSchemaTypeToWidgetType(fieldName, property || { type: 'string' }, schema),
      label: property?.title || fieldName,
      autoActions: Object.keys(autoActions).length > 0 ? autoActions : undefined,
    };
  });

  return {
    id: `${schemaName}_detail`,
    title: options?.title || `${schemaName.charAt(0).toUpperCase() + schemaName.slice(1)} Details`,
    type: 'detail',
    widgets,
    meta: {
      actions: [
        { id: 'edit', label: 'Edit', type: 'primary' },
      ],
    },
  };
}

