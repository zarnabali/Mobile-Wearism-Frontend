# 📥 CSV Export - Setup & Troubleshooting Guide

## ✅ What's Fixed

1. **Rounded Corners** - Added `rounded-3xl` to outermost container
2. **CSV Download** - Now uses `expo-file-system` and `expo-sharing` for real file downloads

---

## 📦 Required Packages

The following packages have been installed:

```bash
npx expo install expo-file-system expo-sharing
```

**Packages:**
- `expo-file-system` - For writing CSV files to device storage
- `expo-sharing` - For native share dialog (save to device)

---

## 🚀 How It Works

### 1. User Flow

```
User clicks [Download] button
    ↓
Download modal opens
    ↓
User selects:
  - Data: All Records / Filtered Results
  - Format: Column View / Row View
    ↓
User clicks [Download]
    ↓
CSV file is generated
    ↓
File saved to app's document directory
    ↓
Native share dialog opens
    ↓
User chooses where to save:
  - Save to Files
  - Share to other apps
  - Email
  - Google Drive
  - etc.
```

---

### 2. Technical Implementation

**File Generation:**
```typescript
// Generate CSV content
const csvContent = generateCSV(data, format);

// Get file path
const fileName = `${schemaName}_${date}.csv`;
const fileUri = FileSystem.documentDirectory + fileName;

// Write file
await FileSystem.writeAsStringAsync(fileUri, csvContent, {
  encoding: 'utf8'
});

// Share via native dialog
await Sharing.shareAsync(fileUri, {
  mimeType: 'text/csv',
  dialogTitle: `Export ${schemaName}`,
  UTI: 'public.comma-separated-values-text',
});
```

---

## 📱 Testing on Your Phone

### Step 1: Rebuild the App

Since we added native dependencies, you need to rebuild:

```bash
# Option 1: Development build
cd Toolvio-Frontend
npx expo prebuild
npx expo run:android  # or run:ios

# Option 2: EAS Build (for production)
eas build --platform android  # or ios
```

**Important:** Simply restarting the metro bundler won't work for native dependencies!

---

### Step 2: Test CSV Export

1. Open the app on your phone
2. Navigate to any schema's entries
3. Click the **Download** button (green button in header)
4. Select options:
   - **All Records** or **Filtered Results**
   - **Column View** or **Row View**
5. Click **Download**
6. Wait for share dialog to open
7. Choose where to save:
   - **Save to Files** (iOS/Android)
   - **Download** folder
   - **Google Drive**
   - **Email** to yourself
   - Any other app

---

### Step 3: Verify the File

**On Android:**
- Check **Files** app → **Downloads** folder
- Or check the app you saved to (Drive, etc.)

**On iOS:**
- Check **Files** app → **On My iPhone** → **Downloads**
- Or check the app you saved to (iCloud Drive, etc.)

**Open the CSV:**
- Tap the file
- Choose Excel, Google Sheets, or Numbers
- Verify data is correct

---

## 🔍 Troubleshooting

### Issue 1: "File system not available"

**Cause:** `expo-file-system` not properly installed

**Solution:**
```bash
cd Toolvio-Frontend
npx expo install expo-file-system
npx expo prebuild --clean
npx expo run:android  # or run:ios
```

---

### Issue 2: "Sharing not available"

**Cause:** `expo-sharing` not properly installed or device doesn't support sharing

**Solution:**
```bash
cd Toolvio-Frontend
npx expo install expo-sharing
npx expo prebuild --clean
npx expo run:android  # or run:ios
```

**Note:** If still not working, the file is saved but can't be shared. Check the file path in the alert message.

---

### Issue 3: Share dialog doesn't open

**Cause:** App needs to be rebuilt after installing native dependencies

**Solution:**
```bash
# Clean and rebuild
cd Toolvio-Frontend
rm -rf node_modules
npm install
npx expo prebuild --clean
npx expo run:android  # or run:ios
```

---

### Issue 4: "Permission denied"

**Cause:** App doesn't have storage permissions

**Solution (Android):**

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

**Solution (iOS):**
Permissions are handled automatically by expo-sharing.

---

### Issue 5: CSV file is empty or corrupted

**Cause:** Data encoding issue

**Check:**
1. Open developer console and check logs
2. Look for "File saved to: ..." message
3. Use the "Preview" button to see CSV content

**Solution:**
- Ensure data is properly formatted
- Check for special characters in field values
- Verify all entries have valid data

---

## 📊 CSV Format Examples

### Column View Format:
```csv
Name,Email,Phone,Address
"John Doe","john@example.com","555-1234","123 Main St"
"Jane Smith","jane@example.com","555-5678","456 Oak Ave"
```

### Row View Format (Transposed):
```csv
Fields,Item 1,Item 2
Name,"John Doe","Jane Smith"
Email,"john@example.com","jane@example.com"
Phone,"555-1234","555-5678"
```

---

## 🎯 Expected Behavior

### Success Path:
1. ✅ Download button clicked
2. ✅ Modal opens with options
3. ✅ "Download" button clicked
4. ✅ File generates (may take a few seconds)
5. ✅ Native share dialog opens
6. ✅ User selects destination
7. ✅ Success alert shows
8. ✅ Modal closes
9. ✅ File available in chosen location

### File Details:
- **Format:** `.csv` (Comma-Separated Values)
- **Encoding:** UTF-8
- **Size:** Depends on data (typically 1-100 KB)
- **Location:** App's document directory + user's chosen location
- **Naming:** `SchemaName_YYYY-MM-DD.csv`

---

## 🔧 Advanced Configuration

### Custom File Name:
```typescript
const fileName = `Custom_Export_${Date.now()}.csv`;
```

### Different MIME Types:
```typescript
// For Excel format
mimeType: 'application/vnd.ms-excel'

// For plain text
mimeType: 'text/plain'
```

### Additional Share Options:
```typescript
await Sharing.shareAsync(fileUri, {
  mimeType: 'text/csv',
  dialogTitle: 'Export Data',
  UTI: 'public.comma-separated-values-text',
});
```

---

## 📝 Testing Checklist

- [ ] Packages installed (`expo-file-system`, `expo-sharing`)
- [ ] App rebuilt (not just metro bundler restart)
- [ ] Download button visible in header
- [ ] Download modal opens when clicked
- [ ] Both data options work (All/Filtered)
- [ ] Both format options work (Column/Row)
- [ ] File generates successfully
- [ ] Share dialog opens
- [ ] File can be saved to Files app
- [ ] File can be opened in Excel/Sheets
- [ ] Data is correct and complete
- [ ] No errors in console

---

## 🆘 Still Not Working?

### Check the Logs:

**Metro Bundler:**
```bash
cd Toolvio-Frontend
npx expo start
# Look for any errors related to expo-file-system or expo-sharing
```

**Device Console:**
```bash
# Android
adb logcat | grep "Expo"

# iOS
# Use Xcode console or Safari Web Inspector
```

### Verify Installation:

```bash
cd Toolvio-Frontend
npm list expo-file-system expo-sharing

# Should show:
# ├── expo-file-system@XX.X.X
# └── expo-sharing@XX.X.X
```

### Last Resort - Clean Reinstall:

```bash
cd Toolvio-Frontend

# Remove everything
rm -rf node_modules
rm -rf ios
rm -rf android
rm -rf .expo

# Reinstall
npm install
npx expo install expo-file-system expo-sharing
npx expo prebuild

# Run
npx expo run:android  # or run:ios
```

---

## 💡 Alternative: Manual File Access

If sharing doesn't work, the file is still saved. You can access it via:

**Android:**
```bash
adb pull /data/data/com.yourapp/files/SchemaName_2024-01-15.csv
```

**iOS:**
Use Xcode → Devices → Download Container → Files folder

---

## 📚 Related Documentation

- [Expo FileSystem Docs](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [Expo Sharing Docs](https://docs.expo.dev/versions/latest/sdk/sharing/)
- [CSV Export Guide](./ENTRY_LIST_VIEW_GUIDE.md)

---

## ✅ Summary

**What was added:**
1. ✅ Rounded corners on outermost container (`rounded-3xl`)
2. ✅ Real CSV file export using `expo-file-system`
3. ✅ Native share dialog using `expo-sharing`
4. ✅ Better error handling and user feedback
5. ✅ Success/failure alerts with details

**What you need to do:**
1. ✅ Rebuild the app (packages are installed)
2. ✅ Test on your phone
3. ✅ Verify CSV files export correctly

**If it doesn't work:**
- Check the troubleshooting section above
- Verify the app was rebuilt (not just metro restart)
- Check device logs for errors
- Ensure permissions are granted

---

**Last Updated:** 2024  
**Version:** 2.2  

