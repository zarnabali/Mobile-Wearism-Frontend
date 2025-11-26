# Form Builder - Quick Reference Guide

## Tab Navigation

### 📋 Basic Info Tab
**Required fields to start your schema:**
```
✓ Schema Name (lowercase, no spaces)
✓ Display Name (human-readable)
✓ Description (brief summary)
```

**Example:**
- Schema Name: `product_catalog`
- Display Name: `Product Catalog`
- Description: `Manage product inventory and details`

---

### 📝 Fields Tab
**Add and configure your schema fields:**

| Property | Description | Example |
|----------|-------------|---------|
| Name | Field identifier | `price`, `customer_email` |
| Description | Field purpose | `"Product price in USD"` |
| Type | Data type | `string`, `number`, `integer`, `boolean` |
| Min/Max | Numeric range | Min: `0`, Max: `9999` |
| Required | Is field mandatory? | ✓ Yes / ✗ No |

**Field Types:**
- `string`: Text data (names, descriptions)
- `number`: Decimal numbers (price, ratings)
- `integer`: Whole numbers (quantity, age)
- `boolean`: True/false values (active, verified)

---

### 🔗 Mapping Tab
**Enable special widget features:**

| Widget Type | Use For | Enables |
|-------------|---------|---------|
| **Email Field** | Email addresses | Email validation, Send Email button |
| **Phone Field** | Phone numbers | Phone validation, Call/SMS/WhatsApp buttons |
| **Location Field** | Addresses | Address validation, View Map, Get Directions |
| **No Mapping** | Regular fields | Standard text input |

**When to use mapping:**
- ✅ Map `email` field → Email Field
- ✅ Map `phone` field → Phone Field
- ✅ Map `address` field → Location Field
- ❌ Don't map `name` or `description`

---

### 📂 Sections Tab (Optional)
**Organize fields into logical groups:**

**Example Sections:**
```
Section 1: "Basic Information"
  └─ Fields: name, description, category

Section 2: "Pricing & Inventory"
  └─ Fields: price, quantity, sku

Section 3: "Contact Details"
  └─ Fields: email, phone, address
```

**Benefits of Sections:**
- Improves form readability
- Groups related fields
- Creates step-by-step feel
- Optional - system works without them

---

## Common Workflows

### 🚀 Quick Schema (2 minutes)
1. **Basic Info**: Enter name, display name, description
2. **Fields**: Add 2-3 fields with types
3. **Click "Create Schema"** ✓

### 📋 Standard Schema (5 minutes)
1. **Basic Info**: Complete all required fields
2. **Fields**: Add all fields with descriptions
3. **Mapping**: Map email/phone/location fields
4. **Click "Create Schema"** ✓

### 🎯 Advanced Schema (10 minutes)
1. **Basic Info**: Complete all required fields
2. **Fields**: Add all fields with full configuration
3. **Mapping**: Map special fields
4. **Sections**: Create 2-4 sections and organize fields
5. **Click "Generate JSON"** → Review
6. **Click "Create"** ✓

---

## Buttons & Actions

### Generate JSON
**Purpose:** Preview the complete schema JSON before creating
**When to use:** When you want to review or manually edit JSON
**Result:** Switches to JSON Editor tab with generated code

### Create Schema
**Purpose:** Directly create schema from form
**When to use:** When you're confident with your form configuration
**Result:** Creates schema and redirects to schema detail page

---

## Validation & Errors

### Common Errors

**❌ "Please fill out name, displayName, and description"**
- **Fix:** Complete all fields in Basic Info tab

**❌ "Please add at least one field"**
- **Fix:** Add at least 1 field in Fields tab

**❌ "Duplicate field name: email"**
- **Fix:** Rename or remove duplicate field

**❌ "Section title is required"**
- **Fix:** Enter a title before adding section

---

## Tips & Best Practices

### Naming Conventions
✅ **Good:**
- `customer_name` (lowercase, underscore)
- `email` (simple, clear)
- `price_usd` (descriptive)

❌ **Bad:**
- `Customer Name` (spaces, capitals)
- `e` (too short)
- `field1` (not descriptive)

### Field Descriptions
✅ **Good:**
- "Customer's full legal name"
- "Product price in USD"
- "Primary contact email address"

❌ **Bad:**
- "Name" (redundant)
- "" (empty)
- "Field for entering data" (too vague)

### Section Organization
✅ **Good:**
- Group related fields together
- 2-5 sections max
- Clear section titles

❌ **Bad:**
- Too many sections (>5)
- Single field per section
- Unclear titles

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move to next input |
| Shift + Tab | Move to previous input |
| Enter | Confirm/Submit |
| Escape | Cancel (in modals) |

---

## Examples

### E-commerce Product Schema
```
Basic Info:
  name: product
  displayName: Product
  description: E-commerce product catalog

Fields:
  ✓ name (string, required) - "Product name"
  ✓ description (string) - "Product description"
  ✓ price (number, required) - "Price in USD"
  ✓ quantity (integer) - "Stock quantity"

Mapping:
  (none needed)

Sections:
  ✗ Not using sections
```

### Customer Management Schema
```
Basic Info:
  name: customer
  displayName: Customer
  description: Customer contact information

Fields:
  ✓ name (string, required) - "Customer name"
  ✓ email (string, required) - "Email address"
  ✓ phone (string) - "Phone number"
  ✓ address (string) - "Mailing address"

Mapping:
  email → Email Field
  phone → Phone Field
  address → Location Field

Sections:
  Section 1: "Basic Information"
    └─ name
  Section 2: "Contact Information"
    └─ email, phone, address
```

---

## Need Help?

1. **Hover over icons** for quick tooltips
2. **Check the Guide button** in JSON Editor
3. **Review example schemas** in the guide modal
4. **Use "Generate JSON"** to preview before creating

---

## Quick Checklist

Before clicking "Create Schema":
- [ ] Schema name is lowercase, no spaces
- [ ] Display name is user-friendly
- [ ] Description is clear
- [ ] At least one field is added
- [ ] No duplicate field names
- [ ] Email/phone/address fields are mapped
- [ ] Sections are organized (if using)

---

**Ready to create your schema?** Follow the workflow above and click "Create Schema" when done! 🎉

