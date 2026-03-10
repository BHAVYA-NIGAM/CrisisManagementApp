# Firebase Phone Authentication Setup Guide

This guide explains how to set up Firebase Phone Authentication for the Crisis Management App. Firebase Phone Auth is **completely free** and doesn't require SMS credits.

## Why Firebase Over Twilio?

| Feature | Firebase | Twilio |
|---------|----------|--------|
| Cost | **FREE (unlimited)** | $0.0079 per SMS |
| Setup | Simple (10 minutes) | Complex |
| Phone Verification | Built-in | Manual OTP generation |
| Reliability | Google infrastructure | Third-party |
| Security | Token-based | OTP-based |

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `crisis-management-app`
4. Disable Google Analytics (optional)
5. Click "Create Project"

---

## Step 2: Add App to Firebase Project

### For Web/Expo:

1. In Firebase Console, click ⚙️ (Settings) → Project Settings
2. Scroll to "Your apps" section
3. Click "Web" icon (`</>`)
4. Register app name: `Crisis Management Web`
5. **Copy the configuration values** (you'll need these):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## Step 3: Enable Phone Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click "Get Started" (if first time)
3. Go to **Sign-in method** tab
4. Click on "Phone" provider
5. Click "Enable" toggle
6. Click "Save"

---

## Step 4: Configure reCAPTCHA (Important!)

### For Development:

1. In Phone authentication settings, scroll to "Test phone numbers"
2. Add test numbers (optional): `+911234567890` → OTP: `123456`
3. This allows testing without SMS

### For Production:

1. Go to **App Check** in Firebase Console
2. Click "Get started"
3. Register your app
4. Choose reCAPTCHA v3 for web
5. Add your domain

---

## Step 5: Frontend Configuration (React Native/Expo)

### 5.1 Update Firebase Config

Edit `src/config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 5.2 Environment Variables (Recommended)

Create `.env` file in root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## Step 6: Backend Configuration (Node.js)

### 6.1 Generate Service Account Key

1. In Firebase Console, go to Project Settings ⚙️
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. **Keep this file secure!**

### 6.2 Configure Backend

**Option 1: Using File Path (Development)**

```bash
# In server/.env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

**Option 2: Using Environment Variable (Production - Recommended)**

```bash
# In server/.env
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project",...}'
```

---

## Step 7: Test the Integration

### 7.1 Start Backend

```bash
cd server
npm start
```

You should see:
```
✅ Firebase Admin SDK initialized
```

### 7.2 Start Frontend

```bash
npm start
```

### 7.3 Test Phone Verification

1. Open the app
2. Go to Registration
3. Enter phone number: `+911234567890`
4. Click "Send OTP via SMS"
5. Check your phone for SMS
6. Enter the 6-digit OTP
7. Click "Verify OTP"

---

## Phone Number Format

Firebase requires international format:

| Input | Converted To | Country |
|-------|--------------|---------|
| `9876543210` | `+919876543210` | India |
| `+14155552671` | `+14155552671` | USA |
| `+447700900123` | `+447700900123` | UK |

The app automatically adds `+91` for Indian numbers. To change default country:

Edit `src/screens/auth/RegisterScreen.js` line 96:

```javascript
const phoneNumber = phone.startsWith("+") ? phone : `+91${phone.trim()}`;
// Change +91 to your country code
```

---

## Security Best Practices

### 1. Enable App Check (Production)
- Protects against abuse
- Verifies requests come from your app
- Free tier: 15k verifications/day

### 2. Secure Service Account
```bash
# Never commit service account JSON
echo "firebase-service-account.json" >> .gitignore
```

### 3. Rate Limiting
Firebase has built-in rate limiting:
- 10 SMS per phone number per day (development)
- Increases with App Check enabled

### 4. Token Expiration
Firebase ID tokens expire after 1 hour and auto-refresh.

---

## Troubleshooting

### Issue: "reCAPTCHA verification failed"

**Solution:**
1. Check firebase config is correct
2. Ensure domain is whitelisted in Firebase Console
3. For Expo: Use `exp://` URL in authorized domains

### Issue: "Phone number format is incorrect"

**Solution:**
```javascript
// Always use E.164 format
const phoneNumber = `+${countryCode}${phoneNumber}`;
```

### Issue: "PERMISSION_DENIED: Missing or insufficient permissions"

**Solution:**
1. Re-download service account JSON
2. Check file path in `.env`
3. Restart backend server

### Issue: "Firebase Admin SDK not initialized"

**Solution:**
```bash
# Check environment variable is set
echo $FIREBASE_SERVICE_ACCOUNT_JSON

# Or check file exists
ls server/firebase-service-account.json
```

### Issue: "Quota exceeded"

**Solution:**
- You've exceeded free tier limits
- Enable App Check to increase limits
- Implement client-side rate limiting

---

## Testing Without Real Phone Numbers

### Method 1: Test Phone Numbers (Recommended)

1. Go to Firebase Console → Authentication → Sign-in method → Phone
2. Scroll to "Test phone numbers"
3. Add numbers:
   - `+911234567890` → OTP: `123456`
   - `+919876543210` → OTP: `654321`
4. Use these in testing

### Method 2: Firebase Emulator

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize emulator
firebase init emulators

# Start emulator
firebase emulators:start
```

Update `src/config/firebase.js`:
```javascript
if (__DEV__) {
  connectAuthEmulator(auth, "http://localhost:9099");
}
```

---

## Cost Comparison

### Twilio
- Setup: 30 minutes
- Cost: $0.0079 per SMS (India)
- 1000 verifications = $7.90
- Requires credit card

### Firebase
- Setup: 10 minutes  
- Cost: **FREE** (unlimited)
- 1000 verifications = $0
- No credit card required (for Phone Auth)

---

## Production Checklist

- [x] Firebase project created
- [x] Phone authentication enabled
- [x] App registered in Firebase
- [x] Service account downloaded
- [x] Environment variables configured
- [x] App Check enabled (recommended)
- [x] Test phone numbers added (optional)
- [x] Rate limiting implemented
- [x] Error handling added
- [x] Backend verification working

---

## Additional Resources

- [Firebase Phone Auth Docs](https://firebase.google.com/docs/auth/web/phone-auth)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Support](https://firebase.google.com/support)

---

## Comparison with Previous (Twilio) Setup

| Aspect | Twilio | Firebase |
|--------|--------|----------|
| Monthly Cost (1000 users) | $7.90 | FREE |
| Setup Complexity | High | Low |
| Verification Method | Custom OTP | Built-in |
| Security | Custom | Google-backed |
| Scaling | Manual | Automatic |
| Maintenance | High | Low |
| SMS Delivery | Third-party | Google |

**Recommendation:** Use Firebase for production. It's free, reliable, and easier to maintain.
