# 🔥 Firebase Setup - Quick Start (5 Minutes)

If you're seeing this error:
```
❌ Firebase Admin SDK initialization failed
ℹ️  Phone authentication will not work without Firebase configuration
```

## ✅ Quick Fix (Recommended - Easiest Method)

### Step 1: Download Service Account File

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **kavaach-app**
3. Click **⚙️ Settings** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key** button
6. A file will download: `kavaach-app-firebase-adminsdk-xxxxx.json`

### Step 2: Place the File

```bash
# Navigate to server directory
cd server/

# Place the downloaded file here and rename it
mv ~/Downloads/kavaach-app-firebase-adminsdk-xxxxx.json ./firebase-service-account.json
```

### Step 3: Restart Server

```bash
# In server/ directory
npm start
```

You should see:
```
✅ Firebase Admin SDK initialized from default location
```

**That's it! No environment variables needed!**

---

## Alternative Methods

### Method 2: Using Environment Variable (File Path)

If you want to keep the file somewhere else:

```bash
# In server/.env file
FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/your-service-account.json
```

### Method 3: Using Environment Variable (JSON String)

⚠️ **Not Recommended** - Prone to escaping errors

If you must use JSON string in `.env`:

```bash
# DON'T include quotes around the entire value
# DON'T include newlines
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"kavaach-app","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@kavaach-app.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}
```

**Common issues with this method:**
- Newlines in private_key must be escaped as `\n`
- No quotes around the entire JSON
- No extra spaces or newlines
- Must be a single line

---

## How to Get Your Firebase Service Account

### Detailed Steps with Screenshots Context:

1. **Open Firebase Console**
   - URL: https://console.firebase.google.com
   - Sign in with your Google account

2. **Select Project**
   - Click on your project: **kavaach-app**

3. **Navigate to Settings**
   ```
   Click ⚙️ (gear icon) at top left
   ↓
   Select "Project settings"
   ```

4. **Go to Service Accounts Tab**
   ```
   Project settings page
   ↓
   Click "Service accounts" tab (top navigation)
   ```

5. **Generate Key**
   ```
   Scroll down to "Firebase Admin SDK" section
   ↓
   Click "Generate new private key" button
   ↓
   Confirm "Generate key" in popup
   ↓
   File downloads automatically
   ```

6. **Verify Downloaded File**
   ```bash
   # Check if file is valid JSON
   cat kavaach-app-firebase-adminsdk-xxxxx.json | jq .
   
   # Should show formatted JSON with:
   # - type: "service_account"
   # - project_id: "kavaach-app"
   # - private_key: "-----BEGIN PRIVATE KEY-----..."
   # - client_email: "...@kavaach-app.iam.gserviceaccount.com"
   ```

---

## Verification

After setting up, verify it works:

### Backend Verification:

```bash
cd server
npm start
```

Look for:
```
✅ Firebase Admin SDK initialized from [method]
```

### API Test:

```bash
curl http://localhost:5000/api/auth/firebase-status
```

Should return:
```json
{
  "enabled": true,
  "message": "Firebase Phone Authentication is enabled"
}
```

---

## Troubleshooting

### Error: "Expected property name or '}' in JSON"

**Cause:** Malformed JSON in environment variable

**Fix:** Use Method 1 (file placement) instead

### Error: "ENOENT: no such file or directory"

**Cause:** File not found at specified path

**Fix:**
```bash
# Check current directory
pwd

# List files
ls -la firebase-service-account.json

# If file is elsewhere, either:
# 1. Move it: mv /path/to/file.json ./firebase-service-account.json
# 2. Set path: FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/file.json
```

### Error: "credential-internal-error"

**Cause:** Invalid or corrupted JSON file

**Fix:**
1. Re-download service account from Firebase Console
2. Make sure it's the complete file (starts with `{`, ends with `}`)
3. Verify it's valid JSON: `cat file.json | jq .`

### Error: "Firebase credentials not configured"

**Cause:** No credentials found

**Fix:** Follow Method 1 above (place file in server/ directory)

---

## Security Best Practices

### ✅ DO:
- Keep `firebase-service-account.json` in server directory
- Add to `.gitignore` (already done)
- Use file permissions: `chmod 600 firebase-service-account.json`
- Regenerate keys if exposed

### ❌ DON'T:
- Commit service account to Git
- Share service account publicly
- Use service account on frontend
- Include in Docker images (use secrets)

---

## File Structure

```
CrisisManagementApp/
├── server/
│   ├── firebase-service-account.json  ← Place here (gitignored)
│   ├── .env
│   ├── src/
│   │   └── config/
│   │       └── firebase.js           ← Loads credentials
│   └── package.json
├── FIREBASE_SETUP.md                  ← Full guide
└── FIREBASE_QUICKSTART.md            ← This file
```

---

## Environment File Template

### server/.env
```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/crisis-management
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=*
PORT=5000

# Firebase (Choose ONE method)

# Method 1: Default location (recommended)
# Just place firebase-service-account.json in server/ directory

# Method 2: Custom file path
# FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Method 3: JSON string (not recommended)
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

---

## Quick Setup Script

Run this to check your setup:

```bash
cd server
./setup-firebase.sh
```

This script will:
- ✅ Check if firebase-service-account.json exists
- ✅ Validate if it's proper JSON
- ✅ Show setup instructions if missing

---

## Still Having Issues?

1. **Check server logs** when starting:
   ```bash
   cd server
   npm start 2>&1 | grep -i firebase
   ```

2. **Verify file exists**:
   ```bash
   ls -lh server/firebase-service-account.json
   ```

3. **Test JSON validity**:
   ```bash
   cat server/firebase-service-account.json | jq .
   # If jq not installed: cat server/firebase-service-account.json | python -m json.tool
   ```

4. **Check file permissions**:
   ```bash
   # File should be readable
   chmod 600 server/firebase-service-account.json
   ```

5. **Review full guide**: See `FIREBASE_SETUP.md` for comprehensive instructions

---

## Summary

**Easiest Method:**
1. Download service account JSON from Firebase Console
2. Rename to `firebase-service-account.json`
3. Place in `server/` directory
4. Restart server
5. Done! ✅

**Time Required:** 2-3 minutes

**No environment variables needed!**
