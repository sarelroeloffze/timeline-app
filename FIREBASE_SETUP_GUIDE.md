# Firebase Setup Guide — All Phases Complete ✅

**Status:** Firebase migration complete (Phases 1-8) — fully functional with cloud sync, authentication, offline support, and local backup
**Implementation Date:** May 15-18, 2026

---

## What's Been Built

**Phase 1-2: Authentication**
✅ Firebase SDK 9.23.0 (compat) CDN scripts added to `index.html`
✅ `LoginScreen` component with email/password + Google OAuth
✅ Authentication state listener in App component
✅ Loading spinner while checking auth state
✅ Sign Out button in File menu
✅ Automatic redirect to login screen when not authenticated

**Phase 3: Database Migration**
✅ All SQLite/FastAPI calls replaced with Firestore queries
✅ 8 subcollections: people, events, relationships, dependencies, places, arcs, canvasImages, markers
✅ Real-time sync via `.onSnapshot()` listeners
✅ Batch writes for save operations
✅ `server.py` and `timeline.db` removed

**Phase 4: Image Storage + Enhancements**
✅ Firebase Storage for all images (people photos, event images, canvas images)
✅ `uploadResizedImage()` helper with auto-resize
✅ Offline indicator banner (red "🔴 Offline" when no connection)
✅ Person photo upload in Add/Edit Person modals

**Phase 5-6: Real-Time Sync + Dashboard**
✅ Multi-device automatic sync (changes appear instantly across devices)
✅ My Timelines Dashboard with full timeline list
✅ Timeline cards show counts, colors, last-modified timestamps
✅ Delete timeline functionality with confirmation

**Phase 7: Offline Mode**
✅ IndexedDB persistence with `synchronizeTabs: true`
✅ Smart recovery from corruption (terminate + clearPersistence only on error)
✅ Connection status detection via `navigator.onLine` + auth state
✅ Proper cleanup on page unload to prevent IndexedDB corruption

**Phase 8: Cloud Backup Integration (Electron-only)**
✅ Auto-backup to user-selected local folder (Dropbox/OneDrive/custom)
✅ Configurable auto-save interval (1/5/10/30 minutes)
✅ Auto-prune: keep last N backups (5/10/20/50)
✅ Exit backup on app quit if unsaved changes exist
✅ Toolbar indicator badge showing last backup time
✅ BackupSettingsModal with folder picker, interval selector, keepN selector
✅ Electron IPC handlers for file system operations (choose folder, write/list/delete files)
✅ Backup files: JSON format matching Export JSON structure
✅ Browser mode: graceful degradation with "Desktop app only" warning

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `timeline-app` (or your preferred name)
4. **Google Analytics:** Optional — choose "Not right now" for faster setup
5. Click **"Create project"**
6. Wait ~30 seconds for project creation

---

## Step 2: Register Web App

1. In your new Firebase project, click the **⚙️ Settings** gear icon (top left, next to "Project Overview")
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **`</>`** Web icon
5. Enter app nickname: `Timeline Web App`
6. **Do NOT** check "Also set up Firebase Hosting"
7. Click **"Register app"**
8. You'll see a code block like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "timeline-app-xxxxx.firebaseapp.com",
  projectId: "timeline-app-xxxxx",
  storageBucket: "timeline-app-xxxxx.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxx"
};
```

9. **Copy these values** — you'll need them in Step 6

---

## Step 3: Enable Authentication Methods

1. In Firebase Console left sidebar, click **"Authentication"** (under Build)
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab

### Enable Email/Password:
1. Click **"Email/Password"** row
2. Toggle **"Enable"** to ON
3. Leave "Email link" disabled
4. Click **"Save"**

### Enable Google Sign-In:
1. Click **"Google"** row
2. Toggle **"Enable"** to ON
3. Enter **"Project support email"** (use your email)
4. Click **"Save"**

---

## Step 4: Enable Firestore Database

1. In Firebase Console left sidebar, click **"Firestore Database"** (under Build)
2. Click **"Create database"**
3. **Start in:** Select **"Test mode"** (for now — we'll secure it later)
   - Test mode allows all reads/writes for 30 days
   - We'll add security rules in Phase 3
4. **Location:** Choose closest region (e.g., `us-central1` or `europe-west1`)
5. Click **"Enable"**
6. Wait ~1 minute for database creation

---

## Step 5: Enable Cloud Storage

1. In Firebase Console left sidebar, click **"Storage"** (under Build)
2. Click **"Get started"**
3. **Security rules:** Select **"Start in test mode"**
4. **Location:** Use same region as Firestore
5. Click **"Done"**

---

## Step 6: Update `index.html` with Your Config

1. Open `index.html` in your editor
2. Find this section (around line 160):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "timeline-app-XXXXX.firebaseapp.com",
  projectId: "timeline-app-XXXXX",
  storageBucket: "timeline-app-XXXXX.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxx"
};
```

3. **Replace the entire object** with the values you copied from Step 2
4. Save the file

---

## Step 7: Test Authentication

1. Open `index.html` in your browser:
   - **With server running:** `python server.py` → `http://localhost:8765`
   - **Standalone:** Just open the HTML file directly

2. You should see the **LoginScreen** with:
   - Email/Password form
   - "Sign in with Google" button
   - Toggle between Login/Signup

3. **Test Sign Up:**
   - Click "Sign up" link
   - Enter email + password (min 6 chars)
   - Click "Create Account"
   - You should be redirected to the main app

4. **Test Sign Out:**
   - In the app, go to **File → 🚪 Sign Out**
   - You should return to the login screen

5. **Test Sign In:**
   - Enter the same email + password
   - Click "Sign In"
   - You should enter the main app

6. **Test Google Sign-In:**
   - Click "Sign in with Google"
   - Choose your Google account
   - You should enter the main app

7. **Check Firebase Console:**
   - Go to **Authentication → Users** tab
   - You should see your registered user(s)

---

## Troubleshooting

### Error: "Firebase not initialized"
- Check browser console for errors
- Verify `firebaseConfig` values are correct (no `XXXXX` placeholders)
- Ensure Firebase SDK scripts loaded (check Network tab)

### Error: "auth/invalid-api-key"
- Your `apiKey` is incorrect
- Copy the exact value from Firebase Console → Project Settings

### Error: "auth/network-request-failed"
- Check internet connection
- Verify Firebase project is active (not deleted/suspended)

### Google Sign-In popup blocked
- Allow popups for your domain
- Or use `signInWithRedirect()` instead (requires code change)

### Error: "auth/unauthorized-domain"
- Go to Firebase Console → Authentication → Settings → Authorized domains
- Add your domain (e.g., `localhost`)

---

## Implementation Summary

**Phases 1-7 complete** (May 15-18, 2026)

### Critical Bugs Fixed During Implementation

1. **IndexedDB Corruption (CRITICAL)**
   - Problem: Every hard reload produced "INTERNAL ASSERTION FAILED" errors, all writes failed
   - Root cause: Blanket `clearPersistence()` on every startup destroyed IndexedDB connection
   - Fix: Only clear on actual corruption detection; proper `terminate()` on page unload

2. **Data Persistence Failing (CRITICAL)**
   - Problem: Changes appeared in UI but reverted after reload
   - Root cause: Same as above — clearPersistence() broke the write path
   - Fix: Smart recovery pattern with try/catch around enablePersistence()

3. **Real-time Sync Blocked**
   - Problem: Tab 2 never received updates; "Skipping remote update" logged continuously
   - Root cause: `hasUnsavedRef` marked all state changes as dirty, including Firestore loads
   - Fix: Added `isRemoteUpdateRef` + `isLoadingRef` pattern to exclude non-user changes

4. **Unassigned Events Invisible**
   - Problem: Events without people associations were invisible in Horizontal view
   - Root cause: Filter logic assumed all events had person_ids array with length > 0
   - Fix: Added `__unassigned__` group row; updated filter to check array length first

5. **Person Photo Upload Missing**
   - Problem: No UI to upload person photos in Add/Edit Person modals
   - Root cause: Feature not implemented
   - Fix: Added photo state + uploadingPhoto flag + `handlePhotoUpload` + UI with avatar preview

---

## All Phases Complete! 🎉

**Firebase migration is now complete** (Phases 1-8).

### What's Working:
- ✅ Cloud Firestore database with 8 subcollections
- ✅ Firebase Storage for all images
- ✅ Email + Google OAuth authentication
- ✅ Real-time multi-device sync
- ✅ Offline persistence with IndexedDB
- ✅ My Timelines dashboard
- ✅ Auto-backup to local folder (Electron)

### Next Steps (Optional):
1. **Electron Build Update** — Package app with Firebase SDK + backup system
2. **User Testing** — Multi-device sync, offline mode, backup restore
3. **Security Review** — Firestore rules, Storage rules, auth flows
4. **Documentation** — User guide, backup instructions, troubleshooting
5. **Performance** — Optimize large timeline handling (pagination, lazy loading)

---

## Security Notes

⚠️ **Current setup is in TEST MODE**
- Anyone can read/write your Firestore database
- Anyone can upload to your Storage bucket
- This is ONLY for development/testing

**Before production:**
- We'll add Firestore Security Rules (Phase 3)
- We'll add Storage Security Rules (Phase 4)
- We'll restrict access to authenticated users + their own data

---

## Contact

If you encounter any issues during setup, take a screenshot of:
1. The browser console (F12 → Console tab)
2. The Firebase Console error message
3. The relevant section of your `index.html` (firebaseConfig block)

And I'll help troubleshoot!

---

**— REED**
*Senior Full-Stack Developer*
*Firebase Phase 1 & 2 delivered 2026-05-17*
