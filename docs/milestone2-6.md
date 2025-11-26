# 🎯 MILESTONE 2 & 6: Dynamic UI Rendering & Widget Library
## Complete Implementation Guide with Backend Integration

---

## 📋 Table of Contents
1. [Milestone 2 Overview](#milestone-2-overview)
2. [Milestone 6 Overview](#milestone-6-overview)
3. [Real-World Scenarios](#real-world-scenarios)
4. [Backend Integration Flow](#backend-integration-flow)
5. [Implementation Checklist](#implementation-checklist)

---

# MILESTONE 2: Dynamic UI Rendering Engine (10 Days)

## 🎯 What is Milestone 2?

**Goal:** Build a system that takes JSON Schema definitions from your backend and automatically renders them as UI components—without hardcoding any forms.

**Key Principle:** 
```
Backend: "Here's a schema with email, phone, and address fields"
↓
Frontend: "I'll automatically create a form with these fields"
↓
User: "I see a beautiful form with action buttons for email/phone/map"
```

---

## 🔍 Detailed Breakdown: What Gets Built

### Component 1: DynamicViewRenderer
**Purpose:** Main entry point that decides WHAT to render

**How it works:**
1. Receives schema from backend via API
2. Examines schema properties
3. Decides: Is this a form? List? Detail view?
4. Routes to appropriate component

**Code Flow:**
```typescript
// Backend sends: GET /api/schemas/{schemaName}
// Response:
{
  "name": "customer",
  "displayName": "Customer",
  "jsonSchema": {
    "type": "object",
    "properties": { /* ... */ }
  },
  "viewConfig": { "type": "form" } // or "list" or "detail"
}

// Frontend does:
const DynamicViewRenderer = ({ schemaName }) => {
  const schema = await fetch(`/api/schemas/${schemaName}`);
  
  switch(schema.viewConfig.type) {
    case 'form': return <DynamicForm schema={schema} />;
    case 'list': return <DynamicList schema={schema} />;
    case 'detail': return <DynamicDetail schema={schema} />;
  }
}
```

**Scenario Example: Service Ticket Schema**
```
Backend says: "I have a service_ticket schema with a form view"
↓
DynamicViewRenderer says: "Got it, I'll render a form"
↓
Frontend shows: Customer service ticket form
```

---

### Component 2: DynamicForm
**Purpose:** Renders forms from schema with sections and fields

**What it does:**
1. Takes schema with field definitions
2. Looks at `viewConfig.sections` to organize fields
3. Renders form inputs organized by sections
4. Handles form submission

**Real Backend Integration:**
```
Your backend stores:
{
  "name": "service_ticket",
  "jsonSchema": {
    "properties": {
      "customer_email": { "type": "string" },
      "description": { "type": "string" },
      "priority": { "enum": ["low", "medium", "high"] }
    }
  },
  "viewConfig": {
    "sections": [
      { "title": "Customer Info", "fields": ["customer_email"] },
      { "title": "Ticket Details", "fields": ["description", "priority"] }
    ]
  }
}

Frontend does:
1. Fetch schema ✓
2. Parse sections ✓
3. For each section, render fields ✓
4. User fills form ✓
5. Click Submit → POST /api/data/service_ticket ✓
```

**User sees:**
```
┌─────────────────────────────────────┐
│ Create Service Ticket               │
├─────────────────────────────────────┤
│ CUSTOMER INFO                       │
│ ─────────────────────────────────── │
│ Email: [john@company.com]           │
│                                     │
│ TICKET DETAILS                      │
│ ─────────────────────────────────── │
│ Description: [________________]      │
│ Priority: [High ▼]                  │
│                                     │
│ [Cancel]              [Submit]      │
└─────────────────────────────────────┘
```

---

### Component 3: DynamicField
**Purpose:** Router that picks the RIGHT input component for each field

**Logic:**
```
"Is this an email field?" → Use EmailFieldComponent
"Is this a phone field?" → Use PhoneFieldComponent
"Is this an address field?" → Use AddressFieldComponent
"Is this a dropdown?" → Use SelectComponent
"Is this a number?" → Use NumberInputComponent
"Is this just text?" → Use TextInputComponent
```

**Implementation with Backend:**
```typescript
// Your backend returns fieldMapping
{
  "fieldMapping": {
    "customer_email": "email_field",
    "customer_phone": "phone_field",
    "service_address": "location_field"
  }
}

// Frontend DynamicField component:
const DynamicField = ({ fieldName, fieldSchema, fieldMapping }) => {
  const mappedType = fieldMapping[fieldName];
  
  if (mappedType === 'email_field') {
    return <EmailFieldComponent {...props} />;
  }
  if (mappedType === 'phone_field') {
    return <PhoneFieldComponent {...props} />;
  }
  if (mappedType === 'location_field') {
    return <AddressFieldComponent {...props} />;
  }
  
  // Fall back to type-based rendering
  if (fieldSchema.enum) {
    return <SelectComponent options={fieldSchema.enum} />;
  }
  if (fieldSchema.type === 'number') {
    return <NumberInputComponent />;
  }
  
  return <TextInputComponent />;
}
```

---

### Component 4: DynamicList
**Purpose:** Renders multiple records in a table/grid/card format

**Backend integration:**
```
Your backend provides:
GET /api/data/service_ticket → Returns array of records

Frontend does:
1. Fetch all records
2. Look at schema viewConfig for layout type
3. Render as table, grid, or cards
4. Show action buttons on each row
```

**Example: Service Tickets List**
```
┌─────────────────────────────────────────────────────────────┐
│ Service Tickets                                             │
├─────────────────────────────────────────────────────────────┤
│ ID    │ Customer        │ Phone      │ Status      │ Actions │
├───────┼─────────────────┼────────────┼─────────────┼─────────┤
│ TK-01 │ john@co.com 📧  │ 555-1234   │ New         │ [E][D]  │
│       │ [Send Email]    │ [Call][SMS]│            │         │
│ TK-02 │ jane@co.com 📧  │ 555-5678   │ In Progress │ [E][D]  │
│       │ [Send Email]    │ [Call][SMS]│            │         │
└─────────────────────────────────────────────────────────────┘
```

---

### Component 5: DynamicDetail
**Purpose:** Shows full record details in a modal/page

**Backend flow:**
```
GET /api/data/service_ticket/{id} → Full record with audit history
↓
Frontend renders detail view
↓
Shows all fields + action buttons
```

---

### Component 6-8: Special Field Components (THE MAGIC! ⭐)

These are the MOST IMPORTANT components for your use case.

#### **EmailFieldComponent** ✉️

**What it does:**
1. Renders email input field
2. Shows "Send Email" button
3. When clicked: Opens modal to compose email
4. Sends email and logs to backend

**Scenario: Support Ticket**

**Step 1: Backend Schema**
```json
{
  "name": "support_ticket",
  "jsonSchema": {
    "properties": {
      "customer_email": { "type": "string" },
      "issue": { "type": "string" }
    }
  },
  "fieldMapping": {
    "customer_email": "email_field"
  },
  "widgetPermissions": {
    "email": {
      "sendAllowed": true,
      "logInAudit": true
    }
  }
}
```

**Step 2: Frontend Renders**
```
┌─────────────────────────────────┐
│ Customer Email                  │
│ [user@example.com] [✉️ Send]   │
└─────────────────────────────────┘
```

**Step 3: User Clicks Send**
```
Modal opens:
┌──────────────────────────────┐
│ Send Email                   │
├──────────────────────────────┤
│ To: user@example.com         │
│ Subject: [_____________]     │
│ Message:                     │
│ [__________________]         │
│ [__________________]         │
│                              │
│ [Cancel]      [Send Email]   │
└──────────────────────────────┘
```

**Step 4: Backend Receives**
```
POST /api/communications/send-email
{
  "to": "user@example.com",
  "subject": "Your Support Ticket",
  "body": "We have received your ticket...",
  "entityType": "support_ticket",
  "entityId": "ticket-123"
}

Backend logs to audit trail:
✓ Email sent to user@example.com
✓ Time: 2025-01-15 10:30 AM
✓ By: tech_user_1
✓ Role: Technician
✓ Action: send_email
```

**Code Implementation Reference:**
```typescript
const EmailFieldComponent = ({ value, fieldName, entityId, entityType }) => {
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const handleSendEmail = async () => {
    // Check permissions first (backend middleware will verify)
    const response = await fetch('/api/communications/send-email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: value,
        subject,
        body: message,
        entityType,
        entityId,
        entityVersion: currentVersion // For audit trail
      })
    });
    
    if (response.ok) {
      Toast.show('✓ Email sent successfully');
      setShowModal(false);
    }
  };
  
  return (
    <>
      <View>
        <TextInput value={value} editable={false} />
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Text>✉️ Send Email</Text>
        </TouchableOpacity>
      </View>
      
      <Modal visible={showModal}>
        {/* Email composition form */}
      </Modal>
    </>
  );
};
```

---

#### **PhoneFieldComponent** ☎️

**What it does:**
1. Renders phone input
2. Shows 3 buttons: Call, SMS, WhatsApp
3. For Call: Opens dialer, logs call details after call ends
4. For SMS: Opens native SMS app
5. For WhatsApp: Opens WhatsApp

**Scenario: Field Technician Scheduling**

**Step 1: Backend Schema**
```json
{
  "name": "technician_job",
  "jsonSchema": {
    "properties": {
      "customer_name": { "type": "string" },
      "customer_phone": { "type": "string" }
    }
  },
  "fieldMapping": {
    "customer_phone": "phone_field"
  },
  "widgetPermissions": {
    "phone": {
      "callAllowed": true,
      "smsAllowed": true,
      "whatsappAllowed": true,
      "logInAudit": true
    }
  }
}
```

**Step 2: Frontend Renders**
```
┌──────────────────────────────────────┐
│ Customer Phone                       │
│ [+1-555-1234] [☎️] [💬] [💬]       │
│              Call SMS WhatsApp       │
└──────────────────────────────────────┘
```

**Step 3a: User Clicks CALL**
```
1. Native dialer opens with +1-555-1234
2. User makes call
3. After call ends, modal appears:

┌──────────────────────────────────┐
│ Call Details                     │
├──────────────────────────────────┤
│ Duration: 5 min 23 sec           │
│ Notes: [_________________]       │
│ [Customer wants appointment]     │
│                                  │
│ [Cancel]         [Save Call Log] │
└──────────────────────────────────┘

4. Backend receives:
POST /api/communications/calls
{
  "phone": "+1-555-1234",
  "duration": 323,
  "notes": "Customer wants appointment",
  "entityType": "technician_job",
  "entityId": "job-456"
}
```

**Step 3b: User Clicks SMS**
```
1. Native SMS app opens with +1-555-1234
2. User types message
3. Sent via native SMS (no logging needed)
```

**Step 3c: User Clicks WhatsApp**
```
1. WhatsApp app opens with contact
2. User sends message via WhatsApp
3. No backend logging (external app)
```

---

#### **AddressFieldComponent** 🗺️

**What it does:**
1. Renders address input
2. Shows "View Map" button
3. Opens full-screen map when clicked
4. Gets user's current location (with permission)
5. Shows address location with pin
6. Calculates distance
7. Logs location view to backend

**Scenario: Service Visit Dispatch**

**Step 1: Backend Schema**
```json
{
  "name": "service_visit",
  "jsonSchema": {
    "properties": {
      "service_address": { "type": "string" },
      "technician_name": { "type": "string" }
    }
  },
  "fieldMapping": {
    "service_address": "location_field"
  },
  "widgetPermissions": {
    "location": {
      "viewAllowed": true,
      "currentLocationDetection": true,
      "distanceCalculation": true,
      "logInAudit": true
    }
  }
}
```

**Step 2: Frontend Renders**
```
┌────────────────────────────────────────┐
│ Service Address                        │
│ [123 Main St, Boston MA] [🗺️ Map]    │
└────────────────────────────────────────┘
```

**Step 3: User Clicks Map**
```
Full-screen map opens:

┌────────────────────────────────────────┐
│ Service Location            [X Close]  │
├────────────────────────────────────────┤
│                                        │
│  [Your Location] 🔵                   │
│            \                           │
│             \ 2.3 km away              │
│              \                         │
│         📍 Service Address             │
│                                        │
│ ───────────────────────────────────── │
│ Distance: 2.3 km                       │
│ Estimated Time: 8 minutes              │
│                                        │
│ [Get Directions] [Call] [Share]       │
└────────────────────────────────────────┘

Backend receives:
POST /api/communications/location-views
{
  "address": "123 Main St, Boston MA",
  "userLatitude": 42.3601,
  "userLongitude": -71.0589,
  "distance": 2.3,
  "entityType": "service_visit",
  "entityId": "visit-789"
}
```

---

## 📊 Milestone 2 Components Tree

```
DynamicViewRenderer (Entry Point)
│
├─→ DynamicForm (Create/Edit)
│   ├─→ SectionLayout
│   │   └─→ DynamicField
│   │       ├─→ EmailFieldComponent ⭐
│   │       │   └─ Send Email Modal
│   │       ├─→ PhoneFieldComponent ⭐
│   │       │   └─ Call/SMS/WhatsApp Actions
│   │       ├─→ AddressFieldComponent ⭐
│   │       │   └─ Full-screen Map Modal
│   │       ├─→ SelectComponent
│   │       ├─→ TextInputComponent
│   │       ├─→ NumberInputComponent
│   │       └─→ DatePickerComponent
│   └─→ FormActionButtons (Submit/Cancel)
│
├─→ DynamicList (View Multiple)
│   ├─→ ListHeader (Filters/Sort)
│   └─→ ListRows
│       └─→ WidgetActionButtons (Email/Phone/Map on each row)
│
└─→ DynamicDetail (View Single)
    └─→ DetailFields (Readonly + Actions)
```

---

## 🔄 Data Flow: Complete Cycle

```
1. USER NAVIGATES TO SCHEMA
   ↓
2. Frontend: GET /api/schemas/service_ticket
   Backend response:
   {
     "name": "service_ticket",
     "jsonSchema": { properties... },
     "viewConfig": { sections... },
     "fieldMapping": { email_field, phone_field, location_field }
   }
   ↓
3. DynamicViewRenderer receives schema
   ↓
4. Routes to DynamicForm or DynamicList
   ↓
5. For Form: Renders sections with fields
   ↓
6. For each field:
   - DynamicField checks fieldMapping
   - Selects appropriate component
   - EmailFieldComponent, PhoneFieldComponent, or AddressFieldComponent
   ↓
7. User interacts with field (fills email, clicks Send button, etc.)
   ↓
8. Action triggered:
   POST /api/communications/send-email (or call, or location-view)
   ↓
9. Backend:
   - Validates permission
   - Processes action
   - Logs to audit trail
   - Returns success
   ↓
10. Frontend shows success toast
    Record updated with timestamp
    List refreshed
```

---

## 🎯 Milestone 2 Success Criteria

- ✅ DynamicViewRenderer fetches and routes schemas
- ✅ DynamicForm renders with sections and fields
- ✅ DynamicField routes to correct component type
- ✅ EmailFieldComponent sends emails with modal
- ✅ PhoneFieldComponent handles call/SMS/WhatsApp
- ✅ AddressFieldComponent shows interactive map
- ✅ All actions log to backend audit trail
- ✅ Permission checks enforced
- ✅ Error handling for all network calls
- ✅ Success/error toasts displayed

---

---

# MILESTONE 6: Widget Library & Form Generation (10 Days)

## 🎯 What is Milestone 6?

**Goal:** Build reusable, composable widgets that can be combined to create sophisticated forms without writing new code.

**Key Difference from Milestone 2:**
- M2: Foundation - basic components that render forms
- M6: Advanced - reusable widgets that handle complex scenarios

**Principle:**
```
Milestone 2: "Here are the building blocks"
Milestone 6: "Here are pre-built reusable modules you can combine"
```

---

## 🔍 What Gets Built in Milestone 6

### Widget 1: EmailWidget
**Purpose:** Complete email input + validation + send action in one reusable component

**Difference from M2 EmailFieldComponent:**
- M2: Basic email input with send button
- M6: Adds email validation, retry logic, email history

**Use Cases:**

**Use Case 1: Support Email Notifications**
```
Schema:
{
  "notification_email": {
    "type": "email_widget",
    "label": "Notify Customer",
    "placeholder": "customer@example.com"
  }
}

Frontend renders:
┌──────────────────────────────────────┐
│ Notify Customer                      │
│ [customer@example.com] [✉️ Send]    │
│ Last sent: Jan 15, 2025 10:30 AM    │
│ Status: ✓ Delivered                 │
└──────────────────────────────────────┘
```

**Use Case 2: Invoice Email**
```
Backend sends:
{
  "type": "email_widget",
  "label": "Send Invoice",
  "value": "billing@customer.com",
  "history": [
    { "date": "2025-01-10", "status": "sent" },
    { "date": "2025-01-05", "status": "failed", "error": "Invalid email" }
  ]
}

Frontend renders:
┌──────────────────────────────────────┐
│ Send Invoice                         │
│ [billing@customer.com] [✉️ Send]    │
│                                      │
│ History:                             │
│ • 2025-01-10: Sent ✓                │
│ • 2025-01-05: Failed ✗ (Invalid)   │
│                                      │
│ [Retry Last Failed]                 │
└──────────────────────────────────────┘
```

**Implementation:**
```typescript
const EmailWidget = ({ 
  value, 
  label, 
  onChange, 
  onSend,
  history = [],
  validationRules = {}
}) => {
  const [email, setEmail] = useState(value);
  const [errors, setErrors] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const validateEmail = (email) => {
    // Validate: format, domain, length
    // Return errors if any
  };
  
  const handleSend = async () => {
    const validationErrors = validateEmail(email);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Call backend to send email
    await onSend(email);
  };
  
  return (
    <View>
      <Text>{label}</Text>
      <TextInput 
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          onChange(text);
        }}
      />
      
      {errors.length > 0 && (
        <Text style={{ color: 'red' }}>
          {errors.join(', ')}
        </Text>
      )}
      
      <Button onPress={handleSend}>✉️ Send</Button>
      <Button onPress={() => setShowHistory(!showHistory)}>
        History ({history.length})
      </Button>
      
      {showHistory && (
        <HistoryList items={history} />
      )}
    </View>
  );
};
```

---

### Widget 2: PhoneWidget
**Purpose:** Complete phone input with multi-action support

**What it includes:**
- Phone validation (format, length)
- Call action with post-call logging
- SMS action
- WhatsApp action
- Call history
- SMS history

**Use Case 1: Urgent Dispatch**
```
Technician needs to reach customer urgently:

Frontend renders:
┌──────────────────────────────────┐
│ Customer Contact                 │
│ [+1-555-1234]                    │
│ [☎️ Call] [💬 SMS] [💬 WhatsApp]│
│                                  │
│ Recent Calls:                    │
│ • Jan 15, 10:30 AM (5 min 23 s) │
│ • Jan 14, 2:15 PM (1 min 5 s)  │
│                                  │
│ [Call History] [SMS History]    │
└──────────────────────────────────┘
```

**Use Case 2: Appointment Confirmation**
```
Admin confirming appointment:

Backend sends:
{
  "type": "phone_widget",
  "label": "Appointment Reminder",
  "value": "+1-555-5678",
  "defaultAction": "sms", // Pre-select SMS
  "callHistory": [ ... ],
  "smsHistory": [ ... ]
}

User sees SMS mode ready:
┌──────────────────────────────────┐
│ Appointment Reminder             │
│ [+1-555-5678]                    │
│ [☎️] [💬 SMS] [💬 WhatsApp]     │
│                                  │
│ Message Template:                │
│ "Your appointment is tomorrow..." │
│                                  │
│ [Preview] [Send SMS]             │
└──────────────────────────────────┘
```

**Implementation:**
```typescript
const PhoneWidget = ({
  value,
  label,
  onCall,
  onSMS,
  onWhatsApp,
  callHistory = [],
  smsHistory = [],
  defaultAction = 'call'
}) => {
  const [phone, setPhone] = useState(value);
  const [activeTab, setActiveTab] = useState(defaultAction);
  const [callNotes, setCallNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const handleCall = async () => {
    // Open native dialer
    const result = await openDialer(phone);
    // After call, show modal for notes
    setShowModal(true);
  };
  
  const saveCallLog = async () => {
    await onCall({
      phone,
      duration: result.duration,
      notes: callNotes,
      timestamp: new Date()
    });
  };
  
  return (
    <>
      <View>
        <Text>{label}</Text>
        <TextInput value={phone} onChangeText={setPhone} />
        
        <TabView>
          <Tab label="Call" active={activeTab === 'call'}>
            <Button onPress={handleCall}>☎️ Call</Button>
            <CallHistoryList items={callHistory} />
          </Tab>
          
          <Tab label="SMS" active={activeTab === 'sms'}>
            <Button onPress={() => onSMS(phone)}>💬 Send SMS</Button>
            <SMSHistoryList items={smsHistory} />
          </Tab>
          
          <Tab label="WhatsApp" active={activeTab === 'whatsapp'}>
            <Button onPress={() => onWhatsApp(phone)}>💬 Open WhatsApp</Button>
          </Tab>
        </TabView>
      </View>
      
      <Modal visible={showModal}>
        <TextInput 
          placeholder="Call notes"
          value={callNotes}
          onChangeText={setCallNotes}
        />
        <Button onPress={saveCallLog}>Save Call Log</Button>
      </Modal>
    </>
  );
};
```

---

### Widget 3: AddressWidget
**Purpose:** Complete address input with map and location features

**Features:**
- Address validation
- Interactive map
- Current location detection
- Distance calculation
- Directions
- Location history

**Use Case 1: Service Dispatch with Directions**
```
Technician being dispatched to customer:

Frontend renders:
┌────────────────────────────────────┐
│ Service Location                   │
│ [123 Main St, Boston MA]           │
│ [🗺️ Open Map]                     │
│                                    │
│ Distance: 2.3 km                   │
│ Est. Time: 8 minutes               │
│                                    │
│ [Get Directions] [View on Map]     │
└────────────────────────────────────┘

When user clicks "Get Directions":
- Opens map with route
- Distance displayed
- Can follow turn-by-turn
```

**Use Case 2: Customer Presence Check**
```
Support team verifying customer location:

Backend sends:
{
  "type": "address_widget",
  "label": "Verify Customer Address",
  "value": "456 Oak Ave, Boston MA",
  "requiresCurrentLocation": true
}

Frontend shows:
┌────────────────────────────────────┐
│ Verify Customer Address            │
│ [456 Oak Ave, Boston MA]           │
│ [🗺️ Open Map]                     │
│                                    │
│ Your Current Location:             │
│ [Get My Location]                  │
│                                    │
│ Distance: 0.5 km                   │
│ ✓ Customer is nearby               │
│                                    │
│ [Log Location Check]               │
└────────────────────────────────────┘
```

**Implementation:**
```typescript
const AddressWidget = ({
  value,
  label,
  onLocationView,
  locationHistory = [],
  enableDirections = true
}) => {
  const [address, setAddress] = useState(value);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [showMap, setShowMap] = useState(false);
  
  const handleViewMap = async () => {
    // Get user's current location
    const location = await getCurrentLocation();
    setUserLocation(location);
    
    // Geocode address
    const coords = await geocodeAddress(address);
    
    // Calculate distance
    const dist = calculateDistance(location, coords);
    setDistance(dist);
    
    // Log to backend
    await onLocationView({
      address,
      userLocation,
      distance,
      timestamp: new Date()
    });
    
    setShowMap(true);
  };
  
  return (
    <>
      <View>
        <Text>{label}</Text>
        <TextInput 
          value={address}
          onChangeText={setAddress}
        />
        
        <Button onPress={handleViewMap}>🗺️ Open Map</Button>
        
        {distance && (
          <Text>Distance: {distance} km</Text>
        )}
        
        <LocationHistoryList items={locationHistory} />
      </View>
      
      <MapModal
        visible={showMap}
        address={address}
        userLocation={userLocation}
        distance={distance}
        onClose={() => setShowMap(false)}
      />
    </>
  );
};
```

---

### Widget 4: LookupWidget
**Purpose:** Searchable dropdown that queries backend for options

**Use Case 1: Customer Lookup**
```
Admin creating ticket:

Backend schema:
{
  "customer_id": {
    "type": "lookup_widget",
    "label": "Select Customer",
    "lookupEndpoint": "/api/customers/search",
    "displayField": "name",
    "valueField": "id"
  }
}

Frontend renders:
┌────────────────────────────────┐
│ Select Customer                │
│ [Search or select...]          │
│                                │
│ Suggestions:                   │
│ • John Doe (john@ex.com)      │
│ • Jane Smith (jane@ex.com)    │
│ • Bob Johnson (bob@ex.com)    │
└────────────────────────────────┘

When user types "John":
- Frontend calls: GET /api/customers/search?q=John
- Backend returns matching customers
- Shows updated list
```

**Use Case 2: Product Selection**
```
Technician adding parts to job:

Backend provides:
{
  "part_id": {
    "type": "lookup_widget",
    "lookupEndpoint": "/api/inventory/parts",
    "displayField": "name",
    "valueField": "id",
    "showAdditionalFields": ["sku", "price", "quantity"]
  }
}

Frontend shows rich dropdown:
┌──────────────────────────────────┐
│ Select Part                      │
│ [Search parts...]                │
│                                  │
│ • PUMP-001 ($125, qty: 5)       │
│ • VALVE-002 ($45, qty: 12)      │
│ • FILTER-003 ($18, qty: 0) ✗    │
└──────────────────────────────────┘
```

**Implementation:**
```typescript
const LookupWidget = ({
  label,
  lookupEndpoint,
  displayField,
  valueField,
  onSelect,
  showAdditionalFields = []
}) => {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  
  const handleSearch = async (query) => {
    setSearchText(query);
    
    if (query.length < 2) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    const response = await fetch(
      `${lookupEndpoint}?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    setResults(data);
    setLoading(false);
  };
  
  const handleSelect = (item) => {
    setSelectedValue(item[valueField]);
    setSearchText(item[displayField]);
    setResults([]);
    onSelect(item);
  };
  
  return (
    <View>
      <Text>{label}</Text>
      <TextInput
        value={searchText}
        onChangeText={handleSearch}
        placeholder="Search..."
      />
      
      {loading && <Text>Loading...</Text>}
      
      {results.length > 0 && (
        <FlatList
          data={results}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelect(item)}>
              <View>
                <Text>{item[displayField]}</Text>
                {showAdditionalFields.map(field => (
                  <Text key={field} style={{ fontSize: 12, gray: true }}>
                    {field}: {item[field]}
                  </Text>
                ))}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};
```

---

### Widget 5: FileWidget
**Purpose:** File upload with progress and validation

**Use Case: Invoice Upload**
```
Customer submitting invoice:

Backend schema:
{
  "invoice_file": {
    "type": "file_widget",
    "label": "Upload Invoice",
    "acceptedFormats": ["pdf", "jpg", "png"],
    "maxSize": 5242880 // 5MB
  }
}

Frontend renders:
┌──────────────────────────────────┐
│ Upload Invoice                   │
│ [Tap to select or drag file]     │
│                                  │
│ Accepted: PDF, JPG, PNG          │
│ Max Size: 5 MB                   │
│                                  │
│ [Choose File]                    │
└──────────────────────────────────┘

After selection:
┌──────────────────────────────────┐
│ invoice.pdf (2.3 MB)             │
│ [████████░░░] 75% Uploading      │
│                                  │
│ [Cancel Upload]                  │
└──────────────────────────────────┘
```

**Implementation:**
```typescript
const FileWidget = ({
  label,
  acceptedFormats,
  maxSize,
  onUpload
}) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  const handleFileSelect = async (selectedFile) => {
    setError(null);
    
    // Validate format
    const fileExt = selectedFile.name.split('.').pop().toLowerCase();
    if (!acceptedFormats.includes(fileExt)) {
      setError(`Invalid format. Accepted: ${acceptedFormats.join(', ')}`);
      return;
    }
    
    // Validate size
    if (selectedFile.size > maxSize) {
      setError(`File too large. Max: ${(maxSize / 1024 / 1024).toFixed(1)} MB`);
      return;
    }
    
    setFile(selectedFile);
    uploadFile(selectedFile);
  };
  
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    
    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        const percentComplete = (e.loaded / e.total) * 100;
        setProgress(percentComplete);
      });
      
      xhr.addEventListener('load', () => {
        setUploading(false);
        onUpload(JSON.parse(xhr.responseText));
      });
      
      xhr.addEventListener('error', () => {
        setError('Upload failed');
        setUploading(false);
      });
      
      xhr.open('POST', '/api/files/upload');
      xhr.send(formData);
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };
  
  return (
    <View>
      <Text>{label}</Text>
      
      {file && (
        <View>
          <Text>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</Text>
          {uploading && (
            <>
              <ProgressBar progress={progress} />
              <Text>{progress.toFixed(0)}%</Text>
            </>
          )}
        </View>
      )}
      
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      
      <Button onPress={selectFile}>
        {file ? 'Change File' : 'Choose File'}
      </Button>
    </View>
  );
};
```

---

### Widget 6: MapWidget
**Purpose:** Interactive map picker for selecting locations

**Use Case: Setting Service Area**
```
Admin defining technician's service area:

Backend schema:
{
  "service_location": {
    "type": "map_widget",
    "label": "Set Service Location",
    "mode": "picker" // or "view"
  }
}

Frontend shows interactive map:
┌──────────────────────────────────┐
│ Set Service Location      [X]    │
├──────────────────────────────────┤
│                                  │
│     [Map View]                   │
│     📍 Tap to select location    │
│                                  │
│ Selected: 42.3601, -71.0589     │
│ Address: 123 Main St, Boston    │
│                                  │
│ [Clear] [Confirm]               │
└──────────────────────────────────┘
```

**Implementation:**
```typescript
const MapWidget = ({
  label,
  initialLocation,
  mode = 'picker', // 'picker' or 'view'
  onLocationSelect
}) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [address, setAddress] = useState('');
  
  const handleMapPress = async (latitude, longitude) => {
    setSelectedLocation({ latitude, longitude });
    
    // Reverse geocode to get address
    const addr = await reverseGeocode(latitude, longitude);
    setAddress(addr);
  };
  
  const handleConfirm = () => {
    onLocationSelect({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      address
    });
  };
  
  return (
    <View>
      <Text>{label}</Text>
      
      <MapView
        style={{ height: 300 }}
        initialRegion={selectedLocation}
        onPress={(e) => handleMapPress(
          e.nativeEvent.coordinate.latitude,
          e.nativeEvent.coordinate.longitude
        )}
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} title={address} />
        )}
      </MapView>
      
      {address && <Text>{address}</Text>}
      {selectedLocation && (
        <Text>Coordinates: {selectedLocation.latitude}, {selectedLocation.longitude}</Text>
      )}
      
      {mode === 'picker' && (
        <Button onPress={handleConfirm}>Confirm Location</Button>
      )}
    </View>
  );
};
```

---

## 📊 Milestone 6 Widgets Overview

| Widget | Purpose | Key Features |
|--------|---------|--------------|
| **EmailWidget** | Email input + send | Validation, history, retry |
| **PhoneWidget** | Phone input + actions | Call/SMS/WhatsApp, history |
| **AddressWidget** | Address + mapping | Geocoding, distance, directions |
| **LookupWidget** | Searchable dropdown | Dynamic search, rich display |
| **FileWidget** | File upload | Validation, progress, multiple formats |
| **MapWidget** | Interactive location picker | Geocoding, markers, reverse geocoding |

---

## 🔗 How Milestone 6 Builds on Milestone 2

**Milestone 2 Foundation:**
- DynamicViewRenderer routes schemas
- DynamicForm renders basic forms
- DynamicField picks components
- EmailFieldComponent sends emails
- PhoneFieldComponent calls/SMS
- AddressFieldComponent maps

**Milestone 6 Extensions:**
- EmailWidget = EmailFieldComponent + validation + history + retry
- PhoneWidget = PhoneFieldComponent + call/SMS/WhatsApp tabs + history
- AddressWidget = AddressFieldComponent + directions + presence check
- Plus: LookupWidget, FileWidget, MapWidget for advanced scenarios

**Data Flow Comparison:**

```
MILESTONE 2:
Schema → DynamicViewRenderer 
  → DynamicForm 
  → DynamicField 
  → EmailFieldComponent
  → User fills → Send Email

MILESTONE 6:
Schema → DynamicViewRenderer 
  → DynamicForm 
  → DynamicField 
  → EmailWidget (enhanced EmailFieldComponent)
  → User fills → Validation → History check → Send with retry logic
```

---

## 🎯 Milestone 6 Admin Control Panel

**What Admin Can Configure Per Schema:**

```
┌─────────────────────────────────────────────────────┐
│ Widget Configuration: Customer Schema               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ EMAIL WIDGET SETTINGS                              │
│ ─────────────────────────────────────────────────  │
│ ☑ Enable Email Sending                             │
│ ☑ Show Send History                                │
│ ☑ Allow Retry Failed                              │
│ ☑ Require Verification                            │
│ ☑ Log in Audit Trail                              │
│                                                     │
│ Role Permissions:                                  │
│ ☑ Admin can send    ☑ Office can send             │
│ ☑ Tech can send     ☐ Customer can send           │
│                                                     │
│ PHONE WIDGET SETTINGS                              │
│ ─────────────────────────────────────────────────  │
│ ☑ Enable Calling                                   │
│ ☑ Enable SMS                                       │
│ ☑ Enable WhatsApp                                  │
│ ☑ Log Call Details                                 │
│ ☑ Store SMS History                                │
│                                                     │
│ Role Permissions:                                  │
│ ☑ Admin   ☑ Office   ☑ Tech   ☐ Customer         │
│                                                     │
│ ADDRESS WIDGET SETTINGS                            │
│ ─────────────────────────────────────────────────  │
│ ☑ Show Map Button                                  │
│ ☑ Calculate Distance                               │
│ ☑ Show Directions                                  │
│ ☑ Enable Location Sharing                          │
│ ☑ Log Location Views                               │
│                                                     │
│ Role Permissions:                                  │
│ ☑ Admin   ☑ Office   ☑ Tech   ☑ Customer         │
│                                                     │
│ LOOKUP WIDGET SETTINGS                             │
│ ─────────────────────────────────────────────────  │
│ ☑ Show Search Results While Typing                 │
│ ☑ Cache Results                                    │
│ Maximum Results: [10 ▼]                            │
│                                                     │
│ [Save Settings]            [Reset to Defaults]    │
└─────────────────────────────────────────────────────┘
```

---

---

# 🌍 REAL-WORLD SCENARIOS & USE CASES

## Scenario 1: Craftsman Service Ticket Workflow

### Context:
A customer reports a plumbing issue. Admin needs to create a service ticket, reach out to customer, dispatch technician, and track communication.

### Schemas Involved:
```
1. customer_schema
2. service_ticket_schema
3. technician_job_schema
4. communication_log_schema
```

### Complete Flow:

**Step 1: Admin Creates Service Ticket**

Backend returns schema:
```json
{
  "name": "service_ticket",
  "jsonSchema": {
    "properties": {
      "customer_email": { "type": "string" },
      "customer_phone": { "type": "string" },
      "service_address": { "type": "string" },
      "issue_description": { "type": "string" },
      "priority": { "enum": ["low", "medium", "high"] }
    }
  },
  "fieldMapping": {
    "customer_email": "email_field",
    "customer_phone": "phone_field",
    "service_address": "location_field"
  },
  "viewConfig": {
    "sections": [
      {
        "title": "Customer Information",
        "fields": ["customer_email", "customer_phone"]
      },
      {
        "title": "Service Details",
        "fields": ["service_address", "issue_description", "priority"]
      }
    ]
  }
}
```

Frontend (Milestone 2):
```
DynamicViewRenderer routes to DynamicForm
↓
Renders sections:
┌──────────────────────────────────────────┐
│ Create Service Ticket                    │
├──────────────────────────────────────────┤
│ CUSTOMER INFORMATION                     │
│ ─────────────────────────────────────── │
│ Email: [john@example.com] [✉️ Send]    │
│ Phone: [555-1234] [☎️][💬][💬]        │
│                                          │
│ SERVICE DETAILS                          │
│ ─────────────────────────────────────── │
│ Address: [123 Main St] [🗺️ Map]        │
│ Description: [_____________________]    │
│ Priority: [High ▼]                      │
│                                          │
│ [Cancel]           [Create Ticket]      │
└──────────────────────────────────────────┘
```

**Step 2: Admin Sends Initial Email**

Admin clicks "✉️ Send":
```
Modal opens:
┌────────────────────────────────────┐
│ Send Email                         │
├────────────────────────────────────┤
│ To: john@example.com               │
│ Subject: [Your Service Ticket]     │
│ Message:                           │
│ [We have received your service    │
│  request and will dispatch a      │
│  technician within 2 hours...]    │
│                                    │
│ [Cancel]      [Send Email]        │
└────────────────────────────────────┘
```

Backend receives:
```
POST /api/communications/send-email
{
  "to": "john@example.com",
  "subject": "Your Service Ticket",
  "body": "We have received your request...",
  "entityType": "service_ticket",
  "entityId": "ticket-001",
  "entityVersion": 1
}

Backend responses:
✓ Email sent
✓ Logged to audit trail
✓ Timestamp recorded
✓ User (admin) recorded
```

**Step 3: Admin Confirms by Phone**

Admin clicks "☎️ Call":
```
1. Native dialer opens with 555-1234
2. Admin calls customer
3. Customer confirms appointment tomorrow at 10 AM
4. Call ends

Modal appears:
┌────────────────────────────────┐
│ Call Details                   │
├────────────────────────────────┤
│ Duration: 3 min 45 sec         │
│ Notes:                         │
│ [Customer confirmed appointment│
│  tomorrow 10 AM. Prefers AM.] │
│                                │
│ [Cancel]      [Save Call Log]  │
└────────────────────────────────┘

Backend receives:
POST /api/communications/calls
{
  "phone": "555-1234",
  "duration": 225,
  "notes": "Customer confirmed appointment...",
  "entityType": "service_ticket",
  "entityId": "ticket-001"
}
```

**Step 4: View Service Location**

Admin clicks "🗺️ Map":
```
Full-screen map:
┌────────────────────────────────────┐
│ Service Location         [X Close] │
├────────────────────────────────────┤
│                                    │
│  [Your Location] 🔵               │
│            \                       │
│             \ 2.3 km              │
│              \                     │
│         📍 Service Address         │
│                                    │
│ Address: 123 Main St, Boston      │
│ Distance: 2.3 km                  │
│ Estimated Time: 8 min             │
│                                    │
│ [Get Directions] [Share]          │
└────────────────────────────────────┘

Backend receives:
POST /api/communications/location-views
{
  "address": "123 Main St, Boston",
  "userLatitude": 42.36,
  "userLongitude": -71.06,
  "distance": 2.3,
  "entityType": "service_ticket",
  "entityId": "ticket-001"
}
```

**Step 5: Dispatch Technician (Milestone 6 - Enhanced)**

Create technician job, now with EmailWidget instead of basic EmailFieldComponent:

```
┌────────────────────────────────────────┐
│ Dispatch Technician                    │
├────────────────────────────────────────┤
│ Tech Email: [tech@company.com]         │
│ [✉️ Send]                              │
│                                        │
│ Email History:                         │
│ • Jan 15, 10:30 AM: Sent ✓            │
│ • Jan 15, 9:15 AM: Sent ✓             │
│                                        │
│ Tech Phone: [555-9999]                 │
│ [☎️] [💬] [💬]                        │
│                                        │
│ Service Location: [123 Main St]        │
│ [🗺️ Map]                              │
│                                        │
│ [Dispatch]                             │
└────────────────────────────────────────┘
```

Technician receives email with job details and can see location on map.

---

## Scenario 2: Customer Self-Service Portal

### Context:
Customer needs to request a service, upload photos, and track status.

### Schemas:
```
1. service_request_schema
2. photo_upload_schema
3. status_tracking_schema
```

### Flow:

**Step 1: Request Service (DynamicForm from M2)**

```
Customer fills form:
┌──────────────────────────────────────┐
│ Request Service                      │
├──────────────────────────────────────┤
│ Your Email: [customer@email.com]    │
│ [✉️] (for order updates)            │
│                                      │
│ Your Phone: [555-0000]               │
│ [☎️] (for appointment calls)         │
│                                      │
│ Service Address: [My Home Address]   │
│ [🗺️ Show Technician My Location]   │
│                                      │
│ Issue Type: [Plumbing ▼]             │
│ Description: [______________]        │
│                                      │
│ Photos: [Upload Images]              │
│                                      │
│ [Submit Request]                     │
└──────────────────────────────────────┘
```

**Step 2: Upload Photos (FileWidget from M6)**

```
When customer clicks "Upload Images":
┌──────────────────────────────────────┐
│ Upload Photo                    [X]  │
├──────────────────────────────────────┤
│ [Tap to select photos]               │
│                                      │
│ Formats: JPG, PNG, HEIC              │
│ Max: 10 MB per photo                 │
│ Limit: 5 photos                      │
│                                      │
│ [Choose Photos]                      │
└──────────────────────────────────────┘

After selection:
┌──────────────────────────────────────┐
│ photo1.jpg (2.3 MB)                  │
│ [████████░░░] 75% Uploading          │
│                                      │
│ photo2.jpg (1.8 MB)                  │
│ [✓] Uploaded                         │
│                                      │
│ [Add More Photos]    [Done]          │
└──────────────────────────────────────┘
```

**Step 3: View Service List (DynamicList from M2)**

```
After submission, customer sees their requests:

┌─────────────────────────────────────┐
│ My Service Requests                 │
├─────────────────────────────────────┤
│ Request #1 - Plumbing              │
│ Status: Scheduled for tomorrow      │
│ Tech: John Smith                    │
│ Phone: [555-9999] [☎️] [💬]       │
│ Address: [123 Main St] [🗺️ Map]   │
│                                     │
│ [View Details] [Cancel]             │
│                                     │
│ Request #2 - Electrical            │
│ Status: Completed                  │
│ Tech: Jane Doe                     │
│ Completed: Jan 14                  │
│                                     │
│ [View Details] [Reorder]            │
└─────────────────────────────────────┘
```

---

## Scenario 3: Multi-Role Communication Tracking

### Context:
Different users (Admin, Technician, Customer) need to see different information and have different permissions.

### Role-Based Views (Permission Control):

**Backend Configuration:**
```json
{
  "name": "service_ticket",
  "widgetPermissions": {
    "email": {
      "sendAllowed": true,
      "roles": {
        "admin": true,
        "office": true,
        "technician": true,
        "customer": false
      }
    },
    "phone": {
      "callAllowed": true,
      "smsAllowed": true,
      "roles": {
        "admin": true,
        "office": true,
        "technician": true,
        "customer": false
      }
    },
    "location": {
      "viewAllowed": true,
      "roles": {
        "admin": true,
        "office": true,
        "technician": true,
        "customer": true
      }
    }
  }
}
```

**What Each Role Sees:**

**Admin View:**
```
┌──────────────────────────────────────┐
│ Service Ticket TK-001                │
├──────────────────────────────────────┤
│ Customer Email: john@ex.com          │
│ [✉️ Send Email]                     │
│                                      │
│ Customer Phone: 555-1234             │
│ [☎️ Call] [💬 SMS] [💬 WhatsApp]   │
│                                      │
│ Service Address: 123 Main St         │
│ [🗺️ View Map]                      │
│                                      │
│ Communication History:               │
│ • Email sent: Jan 15, 10:30 AM     │
│ • Call logged: Jan 15, 10:45 AM    │
│ • Location viewed: Jan 15, 11:00 AM │
└──────────────────────────────────────┘
```

**Technician View:**
```
┌──────────────────────────────────────┐
│ Service Ticket TK-001                │
├──────────────────────────────────────┤
│ Customer Phone: 555-1234             │
│ [☎️ Call] [💬 SMS]                 │
│ (WhatsApp disabled by admin)         │
│                                      │
│ Service Address: 123 Main St         │
│ [🗺️ View Map]                      │
│                                      │
│ Note: Email sending disabled         │
│ (office handles customer emails)    │
└──────────────────────────────────────┘
```

**Customer View:**
```
┌──────────────────────────────────────┐
│ Service Ticket TK-001                │
├──────────────────────────────────────┤
│ Service Address: 123 Main St         │
│ [🗺️ View Map]                      │
│                                      │
│ Technician: John Smith              │
│ (Direct contact via admin only)     │
│                                      │
│ Status: Scheduled                    │
│ Date: Jan 16, 10:00 AM              │
│                                      │
│ (Phone/email communication          │
│  only through admin)                 │
└──────────────────────────────────────┘
```

---

## Scenario 4: Bulk Operations with Email Notifications

### Context:
Admin sends notification email to multiple customers about a service update.

### Flow:

**Step 1: List View with Bulk Select (M2)**

```
┌──────────────────────────────────────────┐
│ Customers                               │
├──────────────────────────────────────────┤
│ ☐ All                                    │
│                                          │
│ ☐ John Doe (john@ex.com)                │
│   [✉️ Send] [☎️] [🗺️]                  │
│                                          │
│ ☐ Jane Smith (jane@ex.com)              │
│   [✉️ Send] [☎️] [🗺️]                  │
│                                          │
│ ☐ Bob Johnson (bob@ex.com)              │
│   [✉️ Send] [☎️] [🗺️]                  │
│                                          │
│ [Send Message to Selected]               │
└──────────────────────────────────────────┘
```

**Step 2: Bulk Email Modal**

```
┌──────────────────────────────────────┐
│ Send Email to 3 Customers       [X] │
├──────────────────────────────────────┤
│ Recipients:                          │
│ • john@ex.com                        │
│ • jane@ex.com                        │
│ • bob@ex.com                         │
│                                      │
│ Subject: [Service Update]            │
│ Message:                             │
│ [We are upgrading our system...]    │
│                                      │
│ [Preview] [Cancel] [Send to All]    │
└──────────────────────────────────────┘
```

**Step 3: Backend Processing**

```
POST /api/communications/send-email-bulk
{
  "recipients": [
    "john@ex.com",
    "jane@ex.com",
    "bob@ex.com"
  ],
  "subject": "Service Update",
  "body": "We are upgrading...",
  "batchId": "batch-123"
}

Backend responses:
✓ john@ex.com: Sent
✓ jane@ex.com: Sent
✓ bob@ex.com: Failed (invalid email) → Retry
✓ All logged to audit with timestamps
✓ Sent notification to admin
```

**Step 4: Status Update (M6 EmailWidget with History)**

```
After sending, admin sees:

┌──────────────────────────────────────┐
│ Email Campaign: Service Update       │
├──────────────────────────────────────┤
│ Status: 2/3 Sent, 1 Failed           │
│                                      │
│ Recipients:                          │
│ ✓ john@ex.com (Jan 15, 11:30 AM)    │
│ ✓ jane@ex.com (Jan 15, 11:30 AM)    │
│ ✗ bob@ex.com (Invalid email format) │
│                                      │
│ [View Recipients] [Retry Failed]    │
└──────────────────────────────────────┘
```

---

# 🔄 BACKEND INTEGRATION FLOW

## How Your Backend Supports These Features

### 1. Schema Fetching & Storage

**Your Backend (from proposal):**
```
Endpoint: GET /api/schemas/{schemaName}
Response:
{
  "name": "service_ticket",
  "jsonSchema": { ... },
  "fieldMapping": { ... },
  "widgetPermissions": { ... },
  "viewConfig": { ... }
}
```

**Frontend Integration:**
```typescript
const DynamicViewRenderer = ({ schemaName }) => {
  const [schema, setSchema] = useState(null);
  
  useEffect(() => {
    // Frontend fetches schema from backend
    const fetchSchema = async () => {
      const response = await fetch(`/api/schemas/${schemaName}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSchema(data);
    };
    
    fetchSchema();
  }, [schemaName]);
  
  if (!schema) return <Loading />;
  
  // Use fieldMapping, viewConfig, widgetPermissions
  return renderAppropriateView(schema);
};
```

### 2. Data Submission

**Your Backend (from proposal):**
```
Endpoint: POST /api/data/{schemaName}
Body:
{
  "customer_email": "john@example.com",
  "customer_phone": "555-1234",
  "service_address": "123 Main St"
}

Response:
{
  "id": "record-001",
  "version": 1,
  "createdAt": "2025-01-15T10:30:00Z",
  "createdBy": "admin_user_1"
}
```

**Frontend Integration:**
```typescript
const handleFormSubmit = async (formData) => {
  const response = await fetch(`/api/data/${schemaName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });
  
  const result = await response.json();
  setRecordId(result.id);
  setVersion(result.version);
  Toast.show('✓ Record created successfully');
};
```

### 3. Communication Logging (The Key to Audit Trail)

**Your Backend (from proposal):**
```
Endpoint: POST /api/communications/send-email
Body:
{
  "to": "customer@example.com",
  "subject": "Your Service Ticket",
  "body": "Message content...",
  "entityType": "service_ticket",
  "entityId": "ticket-001",
  "entityVersion": 1
}

Backend does:
1. Validates sender role/permissions
2. Sends email via mail service
3. Logs to audit trail:
   {
     "action": "send_email",
     "entityType": "service_ticket",
     "entityId": "ticket-001",
     "userId": "admin_user_1",
     "userRole": "Admin",
     "timestamp": "2025-01-15T10:30:00Z",
     "details": {
       "to": "customer@example.com",
       "subject": "Your Service Ticket",
       "status": "delivered"
     }
   }
4. Returns success response
```

**Frontend Integration:**
```typescript
const EmailFieldComponent = ({ value, entityId, entityType }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const handleSendEmail = async () => {
    try {
      const response = await fetch('/api/communications/send-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: value,
          subject,
          body: message,
          entityType,
          entityId,
          entityVersion: currentVersion
        })
      });
      
      if (response.ok) {
        Toast.show('✓ Email sent successfully');
        // Optionally refresh audit trail
        await refreshAuditTrail();
        setShowModal(false);
      }
    } catch (error) {
      Toast.show('✗ Failed to send email');
    }
  };
};
```

### 4. Call Logging

**Your Backend (from proposal):**
```
Endpoint: POST /api/communications/calls
Body:
{
  "phone": "+1-555-1234",
  "duration": 323, // seconds
  "notes": "Customer confirmed appointment",
  "entityType": "service_ticket",
  "entityId": "ticket-001"
}

Backend audit log:
{
  "action": "log_call",
  "entityType": "service_ticket",
  "entityId": "ticket-001",
  "userId": "tech_user_1",
  "userRole": "Technician",
  "timestamp": "2025-01-15T10:45:00Z",
  "details": {
    "phone": "+1-555-1234",
    "duration": 323,
    "notes": "Customer confirmed appointment"
  }
}
```

**Frontend Integration:**
```typescript
const PhoneFieldComponent = ({ value, entityId, entityType }) => {
  const [callNotes, setCallNotes] = useState('');
  
  const handleSaveCallLog = async (callDuration) => {
    const response = await fetch('/api/communications/calls', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: value,
        duration: callDuration,
        notes: callNotes,
        entityType,
        entityId
      })
    });
    
    if (response.ok) {
      Toast.show('✓ Call logged');
      setShowModal(false);
    }
  };
};
```

### 5. Location Tracking

**Your Backend (from proposal):**
```
Endpoint: POST /api/communications/location-views
Body:
{
  "address": "123 Main St, Boston MA",
  "userLatitude": 42.3601,
  "userLongitude": -71.0589,
  "distance": 2.3,
  "entityType": "service_visit",
  "entityId": "visit-789"
}

Backend audit log:
{
  "action": "view_location",
  "entityType": "service_visit",
  "entityId": "visit-789",
  "userId": "tech_user_1",
  "userRole": "Technician",
  "timestamp": "2025-01-15T11:00:00Z",
  "details": {
    "address": "123 Main St, Boston MA",
    "coordinates": [42.3601, -71.0589],
    "distance": 2.3,
    "distanceUnit": "km"
  }
}
```

**Frontend Integration:**
```typescript
const AddressFieldComponent = ({ value, entityId, entityType }) => {
  const handleViewMap = async () => {
    const location = await getCurrentLocation();
    const coords = await geocodeAddress(value);
    const distance = calculateDistance(location, coords);
    
    const response = await fetch('/api/communications/location-views', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: value,
        userLatitude: location.latitude,
        userLongitude: location.longitude,
        distance,
        entityType,
        entityId
      })
    });
    
    if (response.ok) {
      setShowMap(true);
    }
  };
};
```

### 6. Access Control & Permission Checks

**Your Backend (from proposal):**
```
Middleware validates on every communication endpoint:

GET /api/schemas/{schemaName}
→ Check: User has read permission on schema

POST /api/communications/send-email
→ Check: 
  1. User role has "email_send" permission
  2. User role has permission for entityType
  3. widgetPermissions.email.sendAllowed = true
  4. User's role in widgetPermissions.email.roles

POST /api/communications/calls
→ Check:
  1. User role has "call_log" permission
  2. widgetPermissions.phone.callAllowed = true
  3. User's role in widgetPermissions.phone.roles
```

**Frontend Integration:**
```typescript
// Widgets check permissions before showing action buttons

const EmailFieldComponent = ({ value, entityId, entityType, permissions }) => {
  // Only show Send button if:
  // 1. Permissions allow
  // 2. Current user role has permission
  // 3. Widget is enabled in admin config
  
  const canSendEmail = 
    permissions.widgetPermissions?.email?.sendAllowed &&
    permissions.widgetPermissions?.email?.roles[currentUserRole];
  
  return (
    <View>
      <TextInput value={value} />
      {canSendEmail && (
        <Button onPress={handleSend}>✉️ Send Email</Button>
      )}
    </View>
  );
};
```

---

# 🏗️ IMPLEMENTATION CHECKLIST

## Milestone 2: Foundation (10 Days)

### Days 1-2: Core Rendering System
- [ ] Create DynamicViewRenderer component
- [ ] Implement schema fetching from backend
- [ ] Add routing logic (form/list/detail)
- [ ] Error handling for schema fetch

### Days 3-4: Form System
- [ ] Build DynamicForm component
- [ ] Implement SectionLayout
- [ ] Add DynamicField router
- [ ] Test with multiple field types

### Days 5: Basic Field Components
- [ ] TextInputComponent
- [ ] SelectComponent
- [ ] NumberInputComponent
- [ ] DatePickerComponent

### Days 6-7: Communication Components (THE CORE)
- [ ] EmailFieldComponent with modal
- [ ] PhoneFieldComponent (Call/SMS)
- [ ] AddressFieldComponent with map
- [ ] Test all modals work correctly

### Days 8-9: List & Detail Views
- [ ] DynamicList component
- [ ] DynamicDetail component
- [ ] Add action buttons to rows/details
- [ ] Implement search/filter

### Day 10: Polish & Testing
- [ ] Full end-to-end testing
- [ ] Error handling
- [ ] Success toasts
- [ ] Permission enforcement

---

## Milestone 6: Advanced Widgets (10 Days)

### Days 1-2: Widget Wrapper System
- [ ] Create base Widget component
- [ ] Implement validation framework
- [ ] Add history tracking system
- [ ] Build permission checking utility

### Days 3-4: EmailWidget
- [ ] Extend EmailFieldComponent
- [ ] Add email validation
- [ ] Implement send history
- [ ] Add retry failed logic

### Days 5-6: PhoneWidget
- [ ] Add tab system (Call/SMS/WhatsApp)
- [ ] Implement call history
- [ ] Implement SMS history
- [ ] Add call timer

### Days 7: AddressWidget
- [ ] Enhance AddressFieldComponent
- [ ] Add directions support
- [ ] Implement distance calculation
- [ ] Add location history

### Days 8: Advanced Widgets
- [ ] Build LookupWidget
- [ ] Build FileWidget with progress
- [ ] Build MapWidget with picker

### Days 9-10: Admin Panel & Polish
- [ ] Admin control panel for widgets
- [ ] Permission UI
- [ ] Enable/disable toggles
- [ ] Final testing

---

# 📊 COMPLETE DATA MODEL

## Schema Structure (What Your Backend Provides)

```typescript
interface Schema {
  name: string; // "service_ticket"
  displayName: string; // "Service Ticket"
  description?: string;
  
  // JSON Schema for data validation
  jsonSchema: {
    type: "object";
    properties: {
      [fieldName]: {
        type: string; // "string", "number", "boolean"
        enum?: string[]; // For dropdowns
        format?: string; // "email", "date"
        minimum?: number;
        maximum?: number;
        minLength?: number;
        maxLength?: number;
      };
    };
    required?: string[];
  };
  
  // Maps field names to special widget types
  fieldMapping?: {
    [fieldName]: "email_field" | "phone_field" | "location_field";
  };
  
  // Controls what actions are available per field
  widgetPermissions?: {
    email?: {
      sendAllowed: boolean;
      logInAudit: boolean;
      roles?: { admin: boolean; office: boolean; tech: boolean; customer: boolean };
    };
    phone?: {
      callAllowed: boolean;
      smsAllowed: boolean;
      whatsappAllowed: boolean;
      logInAudit: boolean;
      roles?: { admin: boolean; office: boolean; tech: boolean; customer: boolean };
    };
    location?: {
      viewAllowed: boolean;
      currentLocationDetection: boolean;
      distanceCalculation: boolean;
      roles?: { admin: boolean; office: boolean; tech: boolean; customer: boolean };
    };
  };
  
  // UI layout configuration
  viewConfig?: {
    type: "form" | "list" | "detail";
    formLayout?: "column" | "row" | "grid";
    sections?: Array<{
      title: string;
      description?: string;
      fields: string[];
    }>;
    listLayout?: "table" | "card" | "grid";
    actions?: Array<{
      id: string;
      label: string;
      type: "submit" | "cancel" | "delete";
    }>;
  };
}
```

## Record Structure (Data Stored)

```typescript
interface Record {
  id: string;
  schemaName: string;
  version: number;
  data: {
    [fieldName]: any; // Customer email, phone, address, etc.
  };
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  auditTrail: AuditEntry[];
}

interface AuditEntry {
  id: string;
  action: "send_email" | "log_call" | "view_location" | "create" | "update" | "delete";
  timestamp: string;
  userId: string;
  userRole: string;
  entityType: string;
  entityId: string;
  details: {
    [key: string]: any;
  };
  ipAddress?: string;
  userAgent?: string;
}
```

---

# 🎓 KEY TAKEAWAYS

## What Users Really Want (From Requirements)

1. **Schema-Driven Forms (M2)**
   - ✓ No hardcoded forms
   - ✓ Add fields in backend → forms update automatically
   - ✓ Works for all platforms (web + mobile)

2. **Communication with Audit (M2 + M6)**
   - ✓ Send emails to customers
   - ✓ Call customers and log details
   - ✓ View addresses on map
   - ✓ EVERY action logged to audit trail
   - ✓ Admin can see who did what and when

3. **Smart Widgets (M6)**
   - ✓ Email widget knows how to validate emails
   - ✓ Phone widget knows about call/SMS/WhatsApp
   - ✓ Address widget knows about maps and directions
   - ✓ Lookup widget searches backend data
   - ✓ File widget validates formats and size

4. **Role-Based Access (M2 + M6)**
   - ✓ Admin can send emails (customer cannot)
   - ✓ Technician can call (customer cannot)
   - ✓ All roles can view maps
   - ✓ Enforced by backend permission checks

5. **Multi-Platform Consistency**
   - ✓ Same UI logic on web and mobile
   - ✓ Same validation rules everywhere
   - ✓ Same audit trail everywhere
   - ✓ Same permissions everywhere

---

# 📝 NEXT STEPS FOR IMPLEMENTATION

1. **Week 1: Milestone 2**
   - Set up component structure
   - Build DynamicViewRenderer → DynamicForm → DynamicField
   - Implement the 3 critical components (Email, Phone, Address)
   - Test form submission and backend integration

2. **Week 2: Milestone 2 Completion**
   - Build DynamicList and DynamicDetail
   - Implement action buttons on lists/details
   - Add error handling and loading states
   - End-to-end testing

3. **Week 3: Milestone 6 - Widgets**
   - Create widget wrapper system
   - Build EmailWidget with history
   - Build PhoneWidget with tabs
   - Build AddressWidget with directions

4. **Week 4: Milestone 6 Completion**
   - Build LookupWidget, FileWidget, MapWidget
   - Create admin control panel
   - Final testing and polish
   - Deploy to staging

---

## Questions to Answer Before Starting

1. **What's your current tech stack?**
   - React Native for mobile?
   - React for web?
   - Both?

2. **Deployment target?**
   - Web app only?
   - Mobile app (iOS/Android)?
   - Both?

3. **Timeline?**
   - 2 weeks for M2?
   - 1 week for M6?

4. **Team size?**
   - 1 developer?
   - Multiple?

---

**This document provides the complete roadmap. Start with M2 fundamentals, then build M6 on top. Good luck! 🚀**