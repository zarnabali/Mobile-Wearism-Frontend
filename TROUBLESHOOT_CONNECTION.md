# 🔍 Connection Troubleshooting Guide

## Quick Diagnosis Steps

### Step 1: Check Your Current IP Address
Run this in PowerShell:
```powershell
ipconfig | Select-String "IPv4"
```

You should see your current IP (e.g., `192.168.18.75`)

### Step 2: Verify Backend is Running & Accessible

1. **Check if backend is running:**
   ```bash
   cd Toolvio_Backend
   npm start
   ```

2. **Look for this message:**
   ```
   🚀 Server running on port 3000
   📱 Backend accessible from network: http://YOUR_IP:3000
   ```

3. **Test from your phone's browser:**
   - Open browser on your phone
   - Visit: `http://192.168.18.75:3000/health`
   - Should see JSON response

### Step 3: Check Firewall (Windows)

**Run as Administrator:**
```powershell
# Allow backend port 3000
netsh advfirewall firewall add rule name="Node.js Backend" dir=in action=allow protocol=TCP localport=3000

# Allow Expo dev server port 8081
netsh advfirewall firewall add rule name="Expo Dev Server" dir=in action=allow protocol=TCP localport=8081

# Allow Expo Metro Bundler ports
netsh advfirewall firewall add rule name="Expo Metro Bundler" dir=in action=allow protocol=TCP localport=19000
netsh advfirewall firewall add rule name="Expo Dev Tools" dir=in action=allow protocol=TCP localport=19001
netsh advfirewall firewall add rule name="Expo Dev Tools" dir=in action=allow protocol=TCP localport=19002
```

### Step 4: Create/Update .env File

Create `Toolvio-Frontend/.env` file:
```
EXPO_PUBLIC_API_BASE=http://192.168.18.75:3000
EXPO_PUBLIC_BACKEND_PORT=3000
```

**Replace `192.168.18.75` with your actual IP from Step 1!**

### Step 5: Start Expo with Correct Mode

**Option A: LAN Mode (if same WiFi works):**
```bash
cd Toolvio-Frontend
npx expo start --lan --clear
```

**Option B: Tunnel Mode (most reliable, works even if WiFi has issues):**
```bash
cd Toolvio-Frontend
npx expo start --tunnel --clear
```

### Step 6: Check Console Logs

When app loads, check the console for:
```
🔧 Loading API config: { explicitEnv: 'http://192.168.18.75:3000', ... }
🔧 Using EXPO_PUBLIC_API_BASE from env: http://192.168.18.75:3000
🌐 API Base URL: http://192.168.18.75:3000
```

## Common Issues & Solutions

### ❌ "Network request failed"
- Backend not running? → Start backend: `cd Toolvio_Backend && npm start`
- Wrong IP? → Update `.env` file with correct IP
- Firewall blocking? → Run firewall commands above
- Backend listening on localhost only? → Should listen on `0.0.0.0` (already configured)

### ❌ "Cannot connect to Expo dev server"
- Use `--tunnel` mode: `npx expo start --tunnel`
- Check firewall allows port 8081
- Make sure phone and laptop on same WiFi

### ❌ "Backend accessible but app can't connect"
- Check `.env` file exists and has correct IP
- Restart Expo: `npx expo start --clear`
- Check console logs show correct API_BASE_URL

## ✅ Quick Test Checklist

- [ ] Backend is running (`npm start` in Toolvio_Backend)
- [ ] Backend accessible from phone browser (`http://YOUR_IP:3000/health`)
- [ ] Firewall allows ports 3000 and 8081
- [ ] `.env` file exists with correct IP
- [ ] Restarted Expo after changes
- [ ] Console shows correct API_BASE_URL

