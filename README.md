# Muslim Carpool App 🚗

A cross-platform mobile app (iOS + Android) for coordinating carpools within your community. Parents/riders can select driving days on a shared calendar, upload photos and videos from each carpool day, and track who's driven how many times.

## Features

- 📅 **Shared Calendar** — Month view showing who's driving which days
- ✋ **Day Selection** — Any parent can claim a day ("I'll drive") or assign another member
- 📊 **Driver Statistics** — Bar chart + leaderboard showing carpool days per parent
- 📸 **Media Uploads** — Upload photos and videos for any calendar day, visible to all group members
- 👥 **Carpool Groups** — Create groups with invite codes, join existing groups
- 🔒 **Secure Auth** — Email/password authentication via Firebase
- 📱 **Demo Mode** — Explore the full app without setting up Firebase

## Getting Started

### 1. Install Dependencies

```bash
cd MuslimCarpool
npm install
```

### 2. Run the Dev Server

```bash
npx expo start
```

- Scan the QR code with **Expo Go** (free app on iOS/Android)
- Or press `i` for iOS simulator, `a` for Android emulator
- Phone must be on the same WiFi as the dev machine for local mode

### 3. Try Demo Mode (No Firebase Required)

On the login screen, tap **"Try Demo Mode"** to explore all features with sample data:
- Pre-populated "Saturday School Carpool" group with 4 members
- Drive days assigned across the current month
- Sample photos on some days

### 4. Connect Firebase (For Production Use)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project
2. Enable **Authentication** → Email/Password
3. Enable **Firestore Database**
4. Enable **Storage** (for photo/video uploads)
5. Copy your project config (Project Settings → Your apps → SDK setup)
6. Paste the values into `src/firebase/config.ts`:

```typescript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "yourproject.firebaseapp.com",
  projectId: "yourproject-id",
  storageBucket: "yourproject.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef",
};
```

7. Restart the app — login/register will now work with real authentication

## App Structure

```
MuslimCarpool/
├── app/                              # Expo Router file-based routes
│   ├── _layout.tsx                   # Root layout (providers)
│   ├── (auth)/
│   │   ├── _layout.tsx               # Auth guard redirect
│   │   └── login.tsx                 # Login/Register/Demo screen
│   ├── (tabs)/
│   │   ├── _layout.tsx               # Bottom tab navigation
│   │   ├── calendar.tsx              # 📅 Month calendar with driver indicators
│   │   ├── stats.tsx                 # 📊 Driver statistics + leaderboard
│   │   ├── groups.tsx                # 👥 Create/Join carpool groups
│   │   └── profile.tsx               # 👤 User profile + sign out
│   └── day/
│       └── [date].tsx                # Day detail: driver info + media gallery + upload
├── src/
│   ├── firebase/config.ts            # Firebase init (lazy proxy pattern)
│   ├── context/
│   │   ├── AuthContext.tsx           # Authentication state
│   │   └── GroupContext.tsx          # Groups, drive days, media (Firebase + demo)
│   ├── types/index.ts                # Shared TypeScript types
│   └── utils/
│       ├── demoMode.ts               # Demo mode flag + event emitter
│       └── demoData.ts               # Sample data for demo mode
├── app.json                          # Expo config
└── package.json
```

## Firestore Security Rules

Deploy these in Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read their own profile
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Groups: members can read, any authed user can create
    match /groups/{groupId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.memberUids;
      allow create: if request.auth != null;

      // Allow joining via invite code (read is needed to check invite code)
      allow update: if request.auth != null &&
        (request.auth.uid in resource.data.memberUids ||
         resource.data.inviteCode == request.resource.data.inviteCode);

      // Only members can delete
      allow delete: if request.auth != null && request.auth.uid in resource.data.memberUids;
    }

    // Drive days: only group members can read/write
    match /driveDays/{dayId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null &&
        request.auth.uid == request.resource.data.driverUid;
    }

    // Media: group members can read, uploader can create/delete
    match /media/{mediaId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.uploaderUid;
      allow delete: if request.auth != null &&
        request.auth.uid == resource.data.uploaderUid;
    }
  }
}
```

## Firebase Storage Security Rules

Deploy these in Firebase Console → Storage → Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /media/{groupId}/{date}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## How It Works

### Calendar Flow
1. User opens the app → sees the calendar for the current month
2. Each day with an assigned driver shows a colored dot (unique color per parent)
2. Days where the user is the driver show "You" badge
3. Tap any day → opens Day Detail screen

### Day Detail Flow
1. If no driver assigned → user can tap "I'll drive this day" or assign another member
2. If driver assigned → shows driver name with option to remove
3. Below: photo/video gallery for that day
4. User can upload a photo or video with an optional caption
5. Uploaded media is visible to all group members in real-time

### Stats Flow
1. Shows total days, member count, average per person
2. Bar chart comparing each parent's carpool days
3. Leaderboard with medals (🥇🥈🥉)

## Building for App Stores

When ready to publish:

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo account
eas login

# Configure project
eas build:configure

# Build for Android (Google Play AAB)
eas build --platform android

# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

## Tech Stack

- **React Native** + **Expo SDK 58** (TypeScript)
- **Expo Router** — file-based navigation
- **Firebase** — Auth, Firestore, Storage
- **expo-image-picker** — photo/video selection
- **expo-image** — optimized image rendering
- **react-native-safe-area-context** — Android-safe layouts

## License

MIT