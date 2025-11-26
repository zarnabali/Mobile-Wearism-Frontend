# 📘 Schema Update Guide - Complete Documentation

## Overview

The Schema Update system has been completely redesigned to support all modern schema features including field mapping, widget permissions, and view configuration. The new `SchemaUpdateModal` component provides a comprehensive interface for managing all aspects of your schemas.

## 🎯 Features

### 1. Dual Edit Modes
- **Form View**: User-friendly tabbed interface for editing all schema aspects
- **JSON View**: Advanced direct JSON editing with validation

### 2. Five Configuration Tabs

#### Tab 1: Basic Information
- **Display Name**: Human-readable name for the schema
- **Description**: Detailed schema description
- **Schema Info**: View-only system information (name, collection, version)

#### Tab 2: Fields
- **Add Fields**: Create new fields with type, description, and required flag
- **Edit Fields**: Modify existing field properties
- **Delete Fields**: Remove fields (with confirmation)
- **Field Types Supported**: string, number, integer, boolean
- **Visual Indicators**: Color-coded type badges, required/optional status

#### Tab 3: Field Mapping
- **Widget Assignment**: Map fields to widget types
  - `email_field` - Email widgets with send/history features
  - `phone_field` - Phone widgets with call/SMS/WhatsApp
  - `location_field` - Location widgets with map/directions
- **No Mapping Option**: Fields can remain unmapped for standard display

#### Tab 4: Widget Permissions
Configure permissions for each widget type:

**Email Widget**:
- Send Email - Allow sending emails
- Require Verification - Require email verification before sending
- Log in Audit Trail - Log all email activities

**Phone Widget**:
- Allow Calls - Enable phone call action
- Allow SMS - Enable SMS messaging
- Allow WhatsApp - Enable WhatsApp messaging

**Location Widget**:
- View on Map - Allow viewing location on map
- Show Current Location - Display user's current location
- Show Distance - Calculate and display distance

#### Tab 5: View Configuration (Advanced)
- **View Type**: form, wizard, table
- **Form Layout**: column, row, grid
- **Note**: This is an advanced feature; the system auto-generates suitable layouts if not configured

## 🎨 UI Design

### Color Scheme
- **Primary**: Indigo (#4F46E5, #6366F1)
- **Success**: Emerald (#10B981, #34D399)
- **Info**: Blue (#60A5FA)
- **Accent**: Purple (#A78BFA)
- **Background**: Gray-900 with opacity overlays

### Component Style
- **Rounded corners**: 2xl (rounded-2xl)
- **Borders**: Gray with 50% opacity
- **Padding**: Consistent 4-6 units
- **Icons**: Ionicons with contextual colors
- **Typography**: Clear hierarchy with semibold headings

### Interactive Elements
- **Buttons**: Color-coded by action type
  - Primary (Save): Emerald green
  - Secondary (Cancel): Gray
  - Destructive (Delete): Rose red
  - Info (Validate): Emerald
- **Toggle Switches**: Visual checkmarks for enabled/disabled states
- **Active States**: Indigo background with white text

## 📝 Usage Examples

### Example 1: Creating a Complete Customer Schema

```typescript
// Basic Info Tab
displayName: "Customer Profile"
description: "Complete customer information with all contact methods"

// Fields Tab
fields: {
  firstName: { type: 'string', required: true },
  lastName: { type: 'string', required: true },
  email: { type: 'string', required: true },
  workEmail: { type: 'string', required: false },
  phone: { type: 'string', required: false },
  mobilePhone: { type: 'string', required: false },
  homeAddress: { type: 'string', required: false },
  workAddress: { type: 'string', required: false },
}

// Field Mapping Tab
fieldMapping: {
  email: 'email_field',
  workEmail: 'email_field',
  phone: 'phone_field',
  mobilePhone: 'phone_field',
  homeAddress: 'location_field',
  workAddress: 'location_field',
}

// Widget Permissions Tab
widgetPermissions: {
  email: {
    sendAllowed: true,
    requiresVerification: false,
    logInAudit: true
  },
  phone: {
    callAllowed: true,
    smsAllowed: true,
    whatsappAllowed: true
  },
  location: {
    viewAllowed: true,
    showCurrentLocation: true,
    showDistance: true
  }
}
```

### Example 2: Simple Product Schema (No Mapping)

```typescript
// Basic Info Tab
displayName: "Product Catalog"
description: "Product inventory items"

// Fields Tab
fields: {
  name: { type: 'string', required: true },
  price: { type: 'number', required: true },
  description: { type: 'string', required: false },
  inStock: { type: 'boolean', required: false },
}

// Field Mapping Tab
// Leave all fields as "No Mapping"

// Widget Permissions Tab
// Not applicable - no mapped fields
```

### Example 3: Support Ticket with Restricted Permissions

```typescript
// Basic Info Tab
displayName: "Support Ticket"
description: "Customer support ticket management"

// Fields Tab
fields: {
  ticketNumber: { type: 'string', required: true },
  customerName: { type: 'string', required: true },
  contactEmail: { type: 'string', required: true },
  contactPhone: { type: 'string', required: true },
  issue: { type: 'string', required: true },
  status: { type: 'string', required: false },
}

// Field Mapping Tab
fieldMapping: {
  contactEmail: 'email_field',
  contactPhone: 'phone_field',
}

// Widget Permissions Tab
widgetPermissions: {
  email: {
    sendAllowed: true,
    requiresVerification: true, // Require verification for support
    logInAudit: true
  },
  phone: {
    callAllowed: true,
    smsAllowed: false, // Disable SMS for support tickets
    whatsappAllowed: false // Disable WhatsApp
  }
}
```

## 🔄 Workflow

### Creating/Editing a Schema

1. **Open Update Modal**
   - Click the "Update Schema" button in schema details

2. **Choose Edit Mode**
   - **Form View** (Recommended): Tab through categories
   - **JSON View** (Advanced): Direct JSON editing

3. **Configure Basic Info**
   - Set display name and description
   - Review schema metadata

4. **Manage Fields**
   - Add new fields with appropriate types
   - Edit existing fields
   - Delete unwanted fields
   - Mark fields as required/optional

5. **Set Field Mapping**
   - Identify email, phone, and location fields
   - Map them to appropriate widget types
   - Leave other fields unmapped

6. **Configure Permissions**
   - Enable/disable widget actions
   - Set verification requirements
   - Configure audit logging

7. **Optional: View Configuration**
   - Set advanced layout options
   - Or skip for auto-generated layout

8. **Save Changes**
   - Click "Save" button
   - Confirm success message
   - Schema refreshes automatically

## 🎯 Best Practices

### 1. Field Naming
- Use camelCase: `customerEmail`, `homeAddress`
- Be descriptive: `workPhone` not `phone2`
- Avoid special characters

### 2. Field Mapping
- **Always map**: email, phone, and location fields
- **Benefits**: Automatic validation, widget actions, better UX
- **Multiple mappings**: OK to have multiple fields of same type

### 3. Widget Permissions
- **Email logging**: Enable for important communications
- **Phone restrictions**: Disable SMS/WhatsApp if not needed
- **Location features**: Enable distance calculation for relevant schemas

### 4. Required Fields
- Mark fields required only if truly necessary
- Too many required fields reduce UX
- Consider making contact fields required for important schemas

### 5. Descriptions
- Always add field descriptions
- Helps users understand field purpose
- Improves form clarity

## 🚀 Advanced Features

### JSON View
For advanced users who prefer direct JSON editing:
- Complete schema definition in JSON format
- Validation button to check syntax
- Sample schema button for reference
- Error messages with specific line information

### Field Type Colors
Visual indicators for field types:
- **String**: Blue (#60A5FA)
- **Number/Integer**: Green (#34D399)
- **Boolean**: Yellow (#FBBF24)

### Real-time Validation
- Field names must be unique
- Required fields validation before save
- JSON syntax validation
- Schema structure validation

## 📱 Mobile Optimization

The component is fully optimized for mobile devices:
- Responsive layout with horizontal scrolling for tabs
- Touch-friendly button sizes
- Keyboard-aware scrolling
- Native keyboard handling
- Pull-to-refresh support

## 🔧 Technical Details

### Component Structure
```
SchemaUpdateModal/
├── Header (Cancel, Title, Save)
├── Mode Toggle (Form/JSON)
├── Tab Navigation (Basic, Fields, Mapping, Permissions, Layout)
├── Content Area
│   ├── Basic Tab
│   ├── Fields Tab
│   ├── Field Mapping Tab
│   ├── Widget Permissions Tab
│   └── View Config Tab
└── Modal Container
```

### State Management
- Local state for form data
- Controlled inputs for all fields
- Automatic synchronization between Form and JSON views
- Optimistic UI updates

### API Integration
- Uses `SchemaApi.updateSchema()`
- Handles errors gracefully
- Success/error alerts
- Automatic data refresh after save

## 🐛 Troubleshooting

### Common Issues

**Issue**: Changes not saving
- **Solution**: Check for validation errors, ensure required fields are filled

**Issue**: Field mapping not working
- **Solution**: Ensure field exists in schema before mapping, rebuild app if needed

**Issue**: JSON view showing errors
- **Solution**: Use Validate button, check JSON syntax, refer to sample schema

**Issue**: Permissions not applying
- **Solution**: Save schema changes, check that field mapping is correct

## 📚 Related Documentation

- **Schema Creation Guide**: `SCHEMA_CREATION_GUIDE.md`
- **Schema Format Guide**: `SCHEMA_FORMAT_GUIDE.md`
- **Widget Documentation**: Check individual widget files in `src/components/widgets/`
- **API Documentation**: Swagger UI at `/api-docs`

## 🎉 Summary

The new Schema Update system provides:
- ✅ Complete schema management in one place
- ✅ User-friendly tabbed interface
- ✅ Support for all modern features (mapping, permissions, layout)
- ✅ Advanced JSON editing option
- ✅ Real-time validation
- ✅ Mobile-optimized UI
- ✅ Beautiful dark theme design

---

**Last Updated**: 2025-11-15  
**Version**: 2.0.0  
**Component**: SchemaUpdateModal.tsx

