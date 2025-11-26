# 🎨 Schema Generator - Comprehensive Improvements

## Overview

The Schema Generator has been significantly improved to support the new schema format with field mapping, view configuration, and comprehensive documentation.

---

## 🆕 What's New

### 1. **Complete Template with All Features**

**Old Template:**
```json
{
  "name": "",
  "displayName": "",
  "description": "",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "price": { "type": "number", "minimum": 0 }
    },
    "required": ["name", "price"]
  }
}
```

**New Template:**
```json
{
  "name": "customer",
  "displayName": "Customer",
  "description": "Customer information with contact details",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Customer name" },
      "email": { "type": "string", "description": "Primary email address" },
      "phone": { "type": "string", "description": "Primary phone number" },
      "address": { "type": "string", "description": "Full address" }
    },
    "required": ["name", "email"]
  },
  "fieldMapping": {
    "email": "email_field",
    "phone": "phone_field",
    "address": "location_field"
  },
  "viewConfig": {
    "viewType": "form",
    "formLayout": "column",
    "sections": [
      {
        "title": "Basic Information",
        "description": "Customer basic details",
        "fields": ["name"]
      },
      {
        "title": "Contact Information",
        "description": "Email, phone, and address",
        "fields": ["email", "phone", "address"]
      }
    ],
    "actions": [
      { "id": "save", "label": "Save", "type": "submit" }
    ]
  }
}
```

### 2. **Enhanced Guide Modal**

The guide modal now includes:

#### ✅ Required Fields
- Clear explanation of name, displayName, and jsonSchema
- Naming conventions (lowercase, no spaces)

#### 🔗 Field Mapping (Optional)
- Maps fields to widget types
- Enables automatic validation
- Enables widget actions:
  - `email_field` → Send Email action
  - `phone_field` → Call, SMS, WhatsApp actions
  - `location_field` → View Map action

#### 📋 View Config (Optional)
- Organizes fields into sections
- Provides better UX
- Supports:
  - `viewType`: form, wizard, table
  - `formLayout`: column, row, grid
  - `sections`: Array of section objects
  - `actions`: Form action buttons

#### 📝 Complete Example
- Full working example with all features
- Scrollable for easy viewing
- Uses the actual template

#### 💡 Pro Tips
- Use Form Builder for quick setup
- Map email/phone/address for widget actions
- No trailing commas in JSON
- Field names: lowercase, no spaces

---

## 📚 Features Explained

### Field Mapping

Field mapping tells the system which fields need special handling:

```json
"fieldMapping": {
  "customerEmail": "email_field",      // Validates email, enables Send Email
  "contactPhone": "phone_field",        // Validates phone, enables Call/SMS
  "officeAddress": "location_field"     // Validates address, enables View Map
}
```

**Benefits:**
- ✅ Automatic format validation
- ✅ Widget-specific actions appear in UI
- ✅ Email communications logged in audit trail
- ✅ Frontend automatically renders correct widgets

**Widget Types:**
| Widget Type | Validates | Actions Available | Logged? |
|-------------|-----------|-------------------|---------|
| `email_field` | Email format | Send Email | ✅ Yes |
| `phone_field` | Phone format | Call, SMS, WhatsApp | ❌ No |
| `location_field` | Address format | View Map, Directions | ❌ No |

### View Configuration

View configuration organizes your form into logical sections:

```json
"viewConfig": {
  "viewType": "form",
  "formLayout": "column",
  "sections": [
    {
      "title": "Personal Information",
      "description": "Basic customer details",
      "fields": ["firstName", "lastName", "dateOfBirth"]
    },
    {
      "title": "Contact Details",
      "description": "Email and phone contact information",
      "fields": ["email", "phone", "alternatePhone"]
    },
    {
      "title": "Address",
      "description": "Physical address information",
      "fields": ["street", "city", "state", "zipCode"]
    }
  ],
  "actions": [
    { "id": "save", "label": "Save Customer", "type": "submit" },
    { "id": "cancel", "label": "Cancel", "type": "cancel" }
  ]
}
```

**Options:**
- **viewType**: 
  - `form` - Standard form view
  - `wizard` - Multi-step form
  - `table` - Table/grid view

- **formLayout**: 
  - `column` - Vertical layout (default)
  - `row` - Horizontal layout
  - `grid` - Grid layout

- **sections**: Array of section objects
  - `title`: Section header
  - `description`: Section description
  - `fields`: Array of field names

- **actions**: Form action buttons
  - `id`: Unique button ID
  - `label`: Button text
  - `type`: Button type (submit, cancel, primary, secondary)

---

## 🎯 Use Cases

### Use Case 1: Simple Schema (No Extras)

**Scenario**: Basic product catalog with no special fields.

```json
{
  "name": "product",
  "displayName": "Product",
  "description": "Product catalog items",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "price": { "type": "number", "minimum": 0 },
      "inStock": { "type": "boolean" }
    },
    "required": ["name", "price"]
  }
}
```

**No fieldMapping or viewConfig needed.**

### Use Case 2: Customer with Contact Fields

**Scenario**: Customer management with email, phone, and address.

```json
{
  "name": "customer",
  "displayName": "Customer",
  "description": "Customer information",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "email": { "type": "string" },
      "phone": { "type": "string" },
      "address": { "type": "string" }
    },
    "required": ["name", "email"]
  },
  "fieldMapping": {
    "email": "email_field",
    "phone": "phone_field",
    "address": "location_field"
  }
}
```

**Enables widget actions: Send Email, Call, View Map.**

### Use Case 3: Employee with Organized Sections

**Scenario**: Complex employee form with multiple sections.

```json
{
  "name": "employee",
  "displayName": "Employee",
  "description": "Employee information",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "firstName": { "type": "string" },
      "lastName": { "type": "string" },
      "workEmail": { "type": "string" },
      "workPhone": { "type": "string" },
      "department": { "type": "string" },
      "position": { "type": "string" },
      "salary": { "type": "number" },
      "homeAddress": { "type": "string" }
    },
    "required": ["firstName", "lastName", "workEmail"]
  },
  "fieldMapping": {
    "workEmail": "email_field",
    "workPhone": "phone_field",
    "homeAddress": "location_field"
  },
  "viewConfig": {
    "viewType": "form",
    "formLayout": "column",
    "sections": [
      {
        "title": "Personal Information",
        "fields": ["firstName", "lastName"]
      },
      {
        "title": "Contact Information",
        "fields": ["workEmail", "workPhone"]
      },
      {
        "title": "Work Details",
        "fields": ["department", "position", "salary"]
      },
      {
        "title": "Address",
        "fields": ["homeAddress"]
      }
    ]
  }
}
```

**Combines field mapping + organized sections for best UX.**

---

## 🔄 Migration from Old Format

### If You Have Existing Schemas

Your existing schemas will continue to work! The new fields are **optional**.

**Old Schema (Still Works):**
```json
{
  "name": "customer",
  "displayName": "Customer",
  "jsonSchema": { ... }
}
```

**Enhanced Schema (Recommended):**
```json
{
  "name": "customer",
  "displayName": "Customer",
  "jsonSchema": { ... },
  "fieldMapping": { ... },        // Add this for widget actions
  "viewConfig": { ... }            // Add this for organized forms
}
```

### Adding Field Mapping to Existing Schema

1. Identify email, phone, and address fields in your schema
2. Add `fieldMapping` object at the root level:

```json
"fieldMapping": {
  "customerEmail": "email_field",
  "mainPhone": "phone_field",
  "officeLocation": "location_field"
}
```

### Adding View Config to Existing Schema

1. Group your fields into logical sections
2. Add `viewConfig` object at the root level:

```json
"viewConfig": {
  "viewType": "form",
  "formLayout": "column",
  "sections": [
    {
      "title": "Section 1",
      "fields": ["field1", "field2"]
    }
  ]
}
```

---

## 💡 Best Practices

### 1. Naming Conventions

**Schema Names:**
- ✅ Lowercase only
- ✅ Use underscores for spaces
- ✅ Start with a letter
- ❌ No spaces, hyphens, or special characters

**Examples:**
- ✅ `customer`, `order_item`, `employee123`
- ❌ `Customer`, `order-item`, `123order`

**Field Names:**
- ✅ camelCase recommended
- ✅ Descriptive and clear
- ❌ Avoid abbreviations unless common

**Examples:**
- ✅ `firstName`, `emailAddress`, `phoneNumber`
- ❌ `fn`, `email_addr`, `ph_num`

### 2. Field Mapping

**Always map these field types:**
- Email fields → `email_field`
- Phone fields → `phone_field`
- Address fields → `location_field`

**Why?**
- Automatic validation
- Widget actions enabled
- Better user experience
- Email communications logged

### 3. View Configuration

**Use sections when:**
- You have more than 5-6 fields
- Fields naturally group into categories
- You want to improve form organization
- You need a multi-step wizard

**Don't use sections when:**
- You have only 2-3 fields
- Fields don't have logical grouping
- You prefer a simple single-page form

### 4. Descriptions

**Always add descriptions:**
```json
{
  "name": {
    "type": "string",
    "description": "Customer's full name"  // ← Add this!
  }
}
```

**Why?**
- Helps users understand fields
- Shows as placeholder text
- Improves form usability

---

## 🎨 UI Improvements

### Guide Modal
- ✅ Comprehensive documentation
- ✅ Section-by-section breakdown
- ✅ Complete example included
- ✅ Pro tips section
- ✅ Scrollable content
- ✅ Professional dark theme

### Template
- ✅ Complete working example
- ✅ Includes all optional features
- ✅ Demonstrates best practices
- ✅ Ready to customize

### Form Builder
- Already has good UI
- Next enhancement: Add field mapping and sections to Form Builder
- Next enhancement: Visual section organizer

---

## 🚀 Future Enhancements

### Planned Features
1. **Form Builder Enhancements**
   - Add field mapping UI
   - Add section management UI
   - Visual drag-and-drop field organizer

2. **Template Library**
   - Pre-built templates for common use cases
   - Customer Management template
   - Product Catalog template
   - Employee Directory template
   - Order Management template

3. **Schema Validation**
   - Real-time validation as you type
   - Syntax highlighting
   - Error highlighting

4. **Import/Export**
   - Import existing schemas
   - Export to file
   - Share templates

---

## 📖 Related Documentation

- **Schema Format Guide**: `Toolvio_Backend/documentation/SCHEMA_FORMAT_GUIDE.md`
- **Schema Creation Guide**: `Toolvio_Backend/documentation/SCHEMA_CREATION_GUIDE.md`
- **API Documentation**: Swagger UI at `/api-docs`

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: "Field mapping validation failed"
**Solution**: Ensure all field mapping keys exist in `jsonSchema.properties`

**Issue**: "Invalid JSON"
**Solution**: Check for trailing commas, missing quotes, or syntax errors

**Issue**: Widget actions not appearing
**Solution**: Verify field mapping is correct and field exists in schema

---

## 📝 Summary

The Schema Generator now supports:
- ✅ Complete schema format with all features
- ✅ Field mapping for widget actions
- ✅ View configuration for organized forms
- ✅ Comprehensive documentation and examples
- ✅ Professional UI and UX
- ✅ Pro tips and best practices

**Use the Form Builder for quick setup or JSON Editor for advanced control!**

---

**Last Updated**: 2025-11-15
**Version**: 2.0.0

