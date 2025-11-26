# 🚀 Toolvio Quick Start Guide

## Overview

This guide provides a quick introduction to creating schemas, managing data, and understanding the dynamic UI system in Toolvio.

---

## 📘 Part 1: Schema Structure Basics

### What is a Schema?

A schema defines the structure of your data. Think of it like creating a database table but with more flexibility.

**Basic Schema Structure:**
```json
{
  "name": "customer",
  "displayName": "Customer",
  "description": "Customer information",
  "jsonSchema": { /* field definitions */ },
  "fieldMapping": { /* optional - for widgets */ },
  "widgetPermissions": { /* optional - control actions */ },
  "viewConfig": { /* optional - UI layout */ }
}
```

### Simple Example: Product Schema

```json
{
  "name": "product",
  "displayName": "Product",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "price": { "type": "number", "minimum": 0 },
      "inStock": { "type": "boolean" },
      "category": { 
        "type": "string",
        "enum": ["electronics", "clothing", "food"]
      }
    },
    "required": ["name", "price"]
  }
}
```

---

## 🎯 Part 2: Field Mapping & Smart Widgets

### What is Field Mapping?

Field mapping tells the system which fields are emails, phones, or addresses. This enables:
- ✅ Automatic validation
- ✅ Action buttons (Send Email, Call, View Map)
- ✅ Smart widget selection

### Three Widget Types:

1. **`email_field`** → Email validation + Send Email button
2. **`phone_field`** → Phone validation + Call/SMS buttons
3. **`location_field`** → Address validation + Map buttons

### Example: Customer with Contact Info

```json
{
  "name": "customer",
  "displayName": "Customer",
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
  },
  "widgetPermissions": {
    "email": { "sendAllowed": true, "logInAudit": true },
    "phone": { "callAllowed": true, "smsAllowed": true },
    "location": { "viewAllowed": true }
  }
}
```

**What happens?**
- Email field shows "Send Email" button
- Phone field shows "Call" and "SMS" buttons
- Address field shows "View Map" button

---

## 📝 Part 3: View Configuration

### Organizing Forms with Sections

View config lets you organize fields into sections (like Google Forms).

```json
{
  "viewConfig": {
    "formLayout": "column",
    "sections": [
      {
        "title": "Personal Information",
        "description": "Basic details",
        "fields": ["name", "email"]
      },
      {
        "title": "Contact Details",
        "description": "How to reach you",
        "fields": ["phone", "address"]
      }
    ],
    "actions": [
      { "id": "save", "label": "Save", "type": "submit" },
      { "id": "cancel", "label": "Cancel", "type": "cancel" }
    ]
  }
}
```

### Layout Options:

- **`column`** → Fields stacked vertically
- **`row`** → Fields displayed horizontally
- **`grid`** → Table-like view

---

## 🔧 Part 4: Creating Schemas & Adding Data

### Step 1: Create a Schema

```bash
POST /api/schemas
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "customer",
  "displayName": "Customer",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "email": { "type": "string" }
    },
    "required": ["name", "email"]
  },
  "fieldMapping": {
    "email": "email_field"
  }
}
```

### Step 2: Add a Record

```bash
POST /api/data/customer
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Field Validation Rules:

**Email Fields:**
- Format: `user@example.com`
- Max: 254 characters
- ❌ Invalid: `not-email`, `user@`, `@example.com`

**Phone Fields:**
- 7-15 digits (formatting ignored)
- ✅ Valid: `+1-555-1234`, `(555) 123-4567`
- ❌ Invalid: `123` (too short), `abc-123` (letters)

**Location Fields:**
- 3-500 characters
- ✅ Valid: `123 Main St, New York, NY`
- ❌ Invalid: `AB` (too short)

---

## 🎨 Part 5: Frontend UI System

### Three Display Modes:

#### 1. **Form View** (Create/Edit)
When adding or editing entries, shows a sectioned form.

```
┌─────────────────────────────────┐
│ Create New Customer             │
├─────────────────────────────────┤
│ PERSONAL INFORMATION            │
│ ─────────────────────────────── │
│ Name: [___________]             │
│ Email: [___________]            │
│                                 │
│ CONTACT DETAILS                 │
│ ─────────────────────────────── │
│ Phone: [___________]            │
│ Address: [___________]          │
│                                 │
│ [Cancel]         [Save]         │
└─────────────────────────────────┘
```

#### 2. **List View** (Multiple Entries)
Shows all entries in column/row/grid layout.

**Column Layout:**
```
┌────────────────────────────────────┐
│ Entry #1                [Edit][Delete]│
│ Name: John Doe                     │
│ Email: john@ex.com [📧 Send]      │
│ Phone: 555-1234 [📞 Call][💬 SMS] │
│ Address: 123 Main [🗺️ Map]        │
└────────────────────────────────────┘
```

**Grid Layout:**
```
┌──────────┬────────────────┬───────────┐
│ Name     │ Email          │ Actions   │
├──────────┼────────────────┼───────────┤
│ John Doe │ john@ex.com 📧 │ [Edit][Del]│
└──────────┴────────────────┴───────────┘
```

#### 3. **Object View** (Single Entry Details)
Click an entry to see full details in a modal.

```
┌─────────────────────────────────┐
│ CUSTOMER: John Doe         [X]  │
├─────────────────────────────────┤
│                                 │
│ Email:                          │
│ john@example.com [📧 Send]     │
│                                 │
│ Phone:                          │
│ +1-555-1234 [📞 Call][💬 SMS]  │
│                                 │
│ Address:                        │
│ 123 Main St [🗺️ Map]           │
│                                 │
│ [Delete]            [Edit]      │
└─────────────────────────────────┘
```

---

## 🔄 Part 6: How Components Work

### Component Structure:

```
SchemaEntriesView (Main Container)
  ├── EntryListView (Shows multiple entries)
  │   └── WidgetActionButtons (Email/Phone/Map buttons)
  ├── EntryObjectView (Shows single entry - modal)
  │   └── WidgetActionButtons
  └── EntryFormView (Create/Edit form - modal)
      └── EmailInputWidget
      └── PhoneInputWidget
      └── AddressInputWidget
      └── TextInputWidget
      └── etc...
```

### Widget Selection Logic:

The system automatically picks the right widget:

```typescript
// Email field → EmailInputWidget
if (fieldMapping["email"] === "email_field") {
  return <EmailInputWidget />;
}

// Phone field → PhoneInputWidget
if (fieldMapping["phone"] === "phone_field") {
  return <PhoneInputWidget />;
}

// Number field → NumberInputWidget
if (property.type === "number") {
  return <NumberInputWidget />;
}

// Enum field → DropdownWidget
if (property.enum) {
  return <DropdownWidget options={property.enum} />;
}

// Default → TextInputWidget
return <TextInputWidget />;
```

---

## 📊 Part 7: Complete Example

### Full Schema: Employee Management

```json
{
  "name": "employee",
  "displayName": "Employee",
  "description": "Employee management system",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "firstName": { "type": "string" },
      "lastName": { "type": "string" },
      "workEmail": { "type": "string" },
      "personalEmail": { "type": "string" },
      "workPhone": { "type": "string" },
      "mobilePhone": { "type": "string" },
      "department": {
        "type": "string",
        "enum": ["Engineering", "Sales", "Marketing", "HR"]
      },
      "salary": { "type": "number", "minimum": 0 },
      "hireDate": { "type": "string", "format": "date" },
      "active": { "type": "boolean", "default": true },
      "homeAddress": { "type": "string" }
    },
    "required": ["firstName", "lastName", "workEmail", "department"]
  },
  "fieldMapping": {
    "workEmail": "email_field",
    "personalEmail": "email_field",
    "workPhone": "phone_field",
    "mobilePhone": "phone_field",
    "homeAddress": "location_field"
  },
  "widgetPermissions": {
    "email": { "sendAllowed": true, "logInAudit": true },
    "phone": { "callAllowed": true, "smsAllowed": true },
    "location": { "viewAllowed": true, "showDistance": true }
  },
  "viewConfig": {
    "formLayout": "column",
    "sections": [
      {
        "title": "Personal Information",
        "description": "Basic employee details",
        "fields": ["firstName", "lastName"]
      },
      {
        "title": "Contact Information",
        "description": "Email and phone contacts",
        "fields": ["workEmail", "personalEmail", "workPhone", "mobilePhone"]
      },
      {
        "title": "Work Details",
        "description": "Employment information",
        "fields": ["department", "salary", "hireDate", "active"]
      },
      {
        "title": "Address",
        "description": "Home address",
        "fields": ["homeAddress"]
      }
    ],
    "actions": [
      { "id": "save", "label": "Save Employee", "type": "submit" },
      { "id": "cancel", "label": "Cancel", "type": "cancel" }
    ]
  }
}
```

### Creating an Employee:

```json
{
  "firstName": "Alice",
  "lastName": "Johnson",
  "workEmail": "alice.johnson@company.com",
  "personalEmail": "alice@gmail.com",
  "workPhone": "+1-555-9876",
  "mobilePhone": "555-5432",
  "department": "Engineering",
  "salary": 85000,
  "hireDate": "2024-01-15",
  "active": true,
  "homeAddress": "456 Oak Avenue, Boston, MA 02101"
}
```

---

## 🎯 Part 8: Quick Reference

### Common Field Types:

```json
{
  "string_field": { "type": "string" },
  "number_field": { "type": "number", "minimum": 0 },
  "integer_field": { "type": "integer", "minimum": 0 },
  "boolean_field": { "type": "boolean", "default": true },
  "date_field": { "type": "string", "format": "date" },
  "datetime_field": { "type": "string", "format": "date-time" },
  "enum_field": { "type": "string", "enum": ["option1", "option2"] }
}
```

### Widget Mapping:

| Field Type | Widget Used |
|------------|-------------|
| `email_field` mapping | EmailInputWidget |
| `phone_field` mapping | PhoneInputWidget |
| `location_field` mapping | AddressInputWidget |
| `type: "number"` | NumberInputWidget |
| `enum: [...]` | DropdownWidget |
| `type: "boolean"` | DropdownWidget (Yes/No) |
| `format: "date"` | DatePickerWidget |
| Long text (description/notes) | TextAreaWidget |
| Default | TextInputWidget |

---

## 🚀 Part 9: User Workflow

### Creating an Entry:

1. Navigate to schema detail page
2. Click **Entries** tab
3. Click **Create** button
4. Fill form (organized by sections)
5. Click **Save**
6. Entry appears in list

### Viewing Entries:

1. Switch between **List** and **Cards** view
2. See entries in configured layout (column/row/grid)
3. Click widget action buttons (📧 📞 🗺️)
4. Click entry to see full details

### Editing an Entry:

1. Click **Edit** button
2. Modify fields in form
3. Click **Save Changes**
4. Changes reflected immediately

### Deleting an Entry:

1. Click **Delete** button
2. Confirm deletion
3. Entry removed from list

---

## 💡 Key Concepts

### 1. **Dynamic UI = No Hardcoded Forms**
- Frontend automatically generates forms from schema
- Add new fields → Form updates automatically
- No code changes needed

### 2. **Field Mapping = Smart Widgets**
- Map fields to widget types
- Get validation + action buttons for free
- Email logging happens automatically

### 3. **View Config = Better UX**
- Organize fields into logical sections
- Control layout (column/row/grid)
- Users see clean, organized forms

### 4. **Widget Permissions = Control**
- Enable/disable specific actions
- Control who can send emails, make calls
- Configure per-schema

---

## 📝 Best Practices

1. **Always use field mapping** for email/phone/location fields
2. **Organize fields into sections** for better UX
3. **Mark only essential fields as required**
4. **Use descriptive display names** and descriptions
5. **Enable audit logging** for important communications
6. **Test validation rules** before deploying

---

## 🔍 Troubleshooting

### Schema validation fails?
- Check field names (lowercase, no spaces)
- Verify field mapping keys exist in properties

### Widget buttons not showing?
- Check fieldMapping is correct
- Verify widgetPermissions are enabled

### Form validation errors?
- Email: Must be valid format (`user@example.com`)
- Phone: 7-15 digits
- Address: 3-500 characters

---

## 📚 Summary

**Toolvio gives you:**
- ✅ Dynamic forms that generate automatically
- ✅ Smart widgets with action buttons
- ✅ Multiple view layouts (column/row/grid)
- ✅ Automatic validation
- ✅ Audit logging for communications
- ✅ Flexible permissions

**You provide:**
- Schema definition (fields and types)
- Field mapping (optional but recommended)
- View configuration (optional but improves UX)

**Result:**
- Beautiful, functional UI without writing frontend code
- Users can CRUD data immediately
- Action buttons work out of the box

---

**Next Steps:**
1. Create your first schema
2. Add field mapping for contact fields
3. Create some records
4. Test the UI in the Entries tab
5. Customize view config for better layout

🎉 **That's it! You're ready to use Toolvio!**
