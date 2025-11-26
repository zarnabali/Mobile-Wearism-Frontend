# Dynamic Views Implementation - Milestone 2 & 6

## Overview

This document describes the implementation of Dynamic View Renderer system and Widget Library as specified in Milestone 2 & 6.

## What Was Implemented

### 1. Super Admin Login Feature
- **Location**: `app/login.tsx`
- **Features**:
  - Toggle between "Regular User" and "Super Admin" login modes
  - Super Admin login doesn't require tenant ID
  - Regular user login still requires tenant ID

### 2. Widget Library (Milestone 6)
- **Location**: `src/components/widgets/`
- **Components Created**:
  - `TextInputWidget.tsx` - Basic text input
  - `EmailInputWidget.tsx` - Email input with email validation
  - `PhoneInputWidget.tsx` - Phone number input with formatting
  - `AddressInputWidget.tsx` - Address input with multiline support
  - `NumberInputWidget.tsx` - Numeric input with keyboard type
  - `DropdownWidget.tsx` - Dropdown selection with modal
  - `ButtonWidget.tsx` - Action button with variants
  - `AutoActionButtons.tsx` - Handles email/call/map actions

### 3. Auto-Action Buttons
- **Location**: `src/components/widgets/AutoActionButtons.tsx`
- **Features**:
  - **Email Action**: Opens default email client with mailto: link
  - **Call Action**: Opens phone dialer with tel: link
  - **Map Action**: Opens native maps with coordinates or address search
  - Platform-aware (iOS/Android compatible)
  - Controlled by Super Admin via `autoActions` flag in view JSON

### 4. Widget Registry
- **Location**: `src/components/widgetRegistry.ts`
- **Features**:
  - Maps widget type names to React components
  - Extensible system for registering new widgets
  - Type-safe widget lookup

### 5. Dynamic View Renderer (Milestone 2)
- **Location**: `src/components/DynamicViewRenderer.tsx`
- **Features**:
  - Renders forms dynamically from JSON view definitions
  - Role-based visibility (shows/hides widgets based on user role)
  - Widget ordering support
  - Form validation with inline error display
  - Form submission to backend API
  - Handles auto-action buttons based on Super Admin configuration

### 6. Form Generator
- **Location**: `src/components/FormGenerator.tsx`
- **Features**:
  - Generates forms from JSON Schema
  - Maps schema properties to appropriate widget types
  - Validates against JSON Schema rules (min/max, pattern, etc.)
  - Shows inline validation errors

### 7. View Management Screen (Super Admin Only)
- **Location**: `app/view-management.tsx`
- **Features**:
  - List all available dynamic views
  - Run/view a dynamic view
  - Edit view configurations (Super Admin only)
  - Delete views (Super Admin only)
  - Role-based access control
  - Modern UI matching existing design

### 8. Dynamic View Screen
- **Location**: `app/dynamic-view.tsx`
- **Features**:
  - Displays dynamic form based on view JSON
  - Handles form submission
  - Shows loading and error states
  - Modern card-based layout matching app design

### 9. API Integration
- **Location**: `src/utils/api.ts`
- **Added**:
  - `ViewApi` - Complete CRUD operations for views
  - `ViewDefinition` type
  - `ViewResponse` and `ViewsResponse` types

## View JSON Structure

```typescript
interface ViewJSON {
  id: string;                    // Unique identifier
  title: string;                 // Display title
  layout?: 'column' | 'row' | 'grid';
  roleVisibility?: string[];     // Which roles can see this view
  widgets: Widget[];             // Array of widget definitions
  options?: {
    showFieldHints?: boolean;
  };
  defaultEndpoint?: string;      // Where to submit form data
}

interface Widget {
  key: string;                   // Unique key for the field
  type: string;                  // Widget type (TextInput, EmailInput, etc.)
  label?: string;                 // Display label
  required?: boolean;             // Is field required?
  placeholder?: string;           // Placeholder text
  options?: Array<{ label: string; value: string }>; // For dropdowns
  autoActions?: {                // Super Admin controlled
    email?: boolean;
    call?: boolean;
    map?: boolean;
  };
  order?: number;                // Display order
  meta?: any;                    // Extra metadata
}
```

## Example View JSON

```json
{
  "id": "customer_form_v1",
  "title": "Customer Information",
  "layout": "column",
  "roleVisibility": ["office", "admin"],
  "widgets": [
    {
      "key": "firstName",
      "type": "TextInput",
      "label": "First Name",
      "required": true,
      "order": 1
    },
    {
      "key": "email",
      "type": "EmailInput",
      "label": "Email Address",
      "required": true,
      "order": 2,
      "autoActions": { "email": true }
    },
    {
      "key": "phone",
      "type": "PhoneInput",
      "label": "Phone",
      "order": 3,
      "autoActions": { "call": true }
    },
    {
      "key": "address",
      "type": "AddressInput",
      "label": "Address",
      "order": 4,
      "autoActions": { "map": true }
    },
    {
      "key": "submit",
      "type": "Button",
      "label": "Save",
      "order": 99
    }
  ],
  "defaultEndpoint": "/api/data/customer"
}
```

## How Super Admin Controls Auto-Actions

1. **In Backend** (to be implemented):
   - Super Admin creates/edits a view
   - For each widget, can toggle:
     - [ ] Show Send Mail button
     - [ ] Show Call button
     - [ ] Show Map button
   - Settings are saved as `autoActions` object in widget definition

2. **In Frontend**:
   - Widget receives `autoActions` prop from view JSON
   - AutoActionButtons component shows/hides buttons based on flags
   - No redeploy needed - changes reflect after refresh

## Navigation Flow

1. **Super Admin** logs in using the toggle on login screen
2. **Menu** → Select "View Management" to see all dynamic views
3. **View Management** → 
   - Super Admin can: Create, Edit, Delete, Run views
   - Regular users can: Run views
4. **Dynamic View** → Form is rendered based on view JSON

## UI Design

All screens follow the existing app design pattern:
- Background image with overlay
- Card-based layouts with glass morphism
- Modern rounded corners
- Consistent color scheme (blues, grays)
- StatusBar with light content
- Ionicons for visual elements

## Widget Types Supported

1. **TextInput** - Basic text input
2. **EmailInput** - Email with validation
3. **PhoneInput** - Phone number with formatting
4. **AddressInput** - Multiline address input
5. **NumberInput** - Numeric input
6. **Dropdown** - Selection dropdown
7. **Button** - Action button

## Next Steps (Backend)

To fully integrate, the backend needs:
1. View storage model (database schema)
2. `GET /api/views` - List all views
3. `GET /api/views/:id` - Get specific view
4. `POST /api/views` - Create view
5. `PUT /api/views/:id` - Update view
6. `DELETE /api/views/:id` - Delete view
7. Super Admin UI for editing view configurations

## Testing

To test the implementation:

1. **Login as Super Admin**:
   - Toggle to "Super Admin"
   - Use super admin credentials
   - No tenant ID needed

2. **View Management**:
   - Navigate to "View Management" from menu
   - See mock view listed
   - Click to run the view

3. **Dynamic Form**:
   - Form renders with all widget types
   - Auto-action buttons appear based on configuration
   - Try clicking email/call/map buttons (they'll open respective apps)
   - Fill out form and submit

4. **Auto-Actions**:
   - Email widget shows mail icon - opens mailto
   - Phone widget shows call icon - opens dialer
   - Address widget shows map icon - opens maps

## Files Created

```
Toolvio-Frontend/
├── src/
│   └── components/
│       ├── widgets/
│       │   ├── AutoActionButtons.tsx
│       │   ├── TextInputWidget.tsx
│       │   ├── EmailInputWidget.tsx
│       │   ├── PhoneInputWidget.tsx
│       │   ├── AddressInputWidget.tsx
│       │   ├── NumberInputWidget.tsx
│       │   ├── DropdownWidget.tsx
│       │   ├── ButtonWidget.tsx
│       │   └── index.ts
│       ├── widgetRegistry.ts
│       ├── DynamicViewRenderer.tsx
│       └── FormGenerator.tsx
├── app/
│   ├── view-management.tsx (NEW)
│   └── dynamic-view.tsx (NEW)
└── login.tsx (UPDATED)
```

## Summary

✅ **Milestone 2 (Dynamic View Renderer)** - Complete
- DynamicViewRenderer component
- Widget library with 7 widget types
- Role-based visibility
- Form validation
- Auto-action integration

✅ **Milestone 6 (Widget Library + Auto-Actions)** - Complete
- 7 reusable widget components
- AutoActionButtons for email/call/map
- Super Admin controlled actions
- Modern UI matching existing design

✅ **Super Admin Login** - Complete
- Login mode toggle
- Separate login flow for super admins

✅ **View Management** - Complete
- View listing and management screen
- Dynamic view rendering screen
- Navigation integrated into menu

The implementation is ready for backend integration. Once the backend API endpoints are added, the system will be fully functional.

