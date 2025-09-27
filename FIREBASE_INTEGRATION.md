# Firebase Integration - EcoSteps

## Overview
EcoSteps now includes complete Firebase integration with authentication, Firestore database, analytics, and the requested WalkHistory collection.

## Features Implemented

### 🔐 Authentication
- **Sign Up**: Create new accounts with email/password + name
- **Sign In**: Authenticate existing users
- **Sign Out**: Secure logout with confirmation
- **Auto-login**: Persistent authentication state
- **Profile Sync**: Automatic user profile synchronization

### 🗄️ Firestore Database
- **User Profiles**: Cloud-stored user data with real-time sync
- **WalkHistory Collection**: Every completed walk is automatically saved
- **Real-time Updates**: Profile and activity data sync across devices
- **Error Handling**: Graceful fallbacks when offline

### 📊 Analytics
- **User Events**: Track sign-ups, logins, and walk completions
- **Activity Metrics**: Monitor distance, duration, and points earned
- **Usage Insights**: Understand user behavior patterns

### 🚶 WalkHistory Collection
Every completed walk automatically creates a document with:
```typescript
{
  id: string,
  userId: string,
  distance: number,        // in kilometers
  duration: number,        // in seconds
  points: number,          // earned points
  startTime: Date,
  endTime: Date,
  startLocation?: {
    latitude: number,
    longitude: number
  },
  endLocation?: {
    latitude: number,
    longitude: number
  },
  route: Array<{
    latitude: number,
    longitude: number,
    timestamp: number
  }>,
  createdAt: Date
}
```

## New Screens

### 🔑 Login Screen (`LoginScreen.tsx`)
- Email/password authentication
- Show/hide password toggle
- Error handling and validation
- Navigation to sign-up
- Beautiful gradient UI

### 📝 Sign Up Screen (`SignUpScreen.tsx`)
- Full name, email, password, confirm password
- Form validation
- Password strength requirements
- Error handling
- Auto-login after successful registration

### 👤 Enhanced Profile Screen (`ProfileScreen.tsx`)
- Real user data from Firebase
- Recent walks history
- Pull-to-refresh functionality
- Dynamic achievements based on actual data
- Sign-out functionality

## Technical Implementation

### 🏗️ Architecture
```
src/
├── services/
│   ├── firebaseConfig.ts      # Firebase configuration
│   └── firebaseService.ts     # Firebase operations
├── store/slices/
│   └── authSlice.ts          # Authentication state
├── hooks/
│   └── useAuth.ts            # Authentication hook
└── screens/
    ├── LoginScreen.tsx
    ├── SignUpScreen.tsx
    └── ProfileScreen.tsx     # Enhanced with Firebase
```

### 🔧 Services

#### `FirebaseService`
Singleton service managing all Firebase operations:
- User authentication
- Profile management
- Walk history CRUD operations
- Analytics event tracking

#### `useAuth` Hook
Custom React hook that:
- Listens to authentication state changes
- Syncs user profiles between Firebase and Redux
- Handles initial profile creation
- Manages state cleanup on logout

### 🔄 Data Flow
1. **User signs up/in** → Firebase Auth
2. **Profile created/loaded** → Firestore `users` collection
3. **Walk completed** → Automatically saved to `WalkHistory` collection
4. **Profile updated** → Points, level, activities count synced
5. **Data displayed** → Real-time updates in UI

## Usage Examples

### Complete a Walk
```typescript
// In WalkScreen.tsx - automatically happens when walk stops
const walkData = {
  userId: currentUser.uid,
  distance: 2.5,
  duration: 1800, // 30 minutes
  points: 25,
  startTime: new Date(),
  endTime: new Date(),
  // ... location data
};

await firebaseService.addWalkToHistory(walkData);
```

### Get User's Walk History
```typescript
// Load recent walks
const walks = await firebaseService.getUserWalkHistory(userId, 10);
```

### Track Analytics
```typescript
// Automatically logged on important events
firebaseService.logEvent('walk_started', { distance: 0 });
firebaseService.logEvent('walk_completed', { distance: 2.5, points: 25 });
```

## Security Features

- **Authentication Required**: All Firebase operations require valid user
- **User Data Isolation**: Users can only access their own data
- **Secure Configuration**: API keys properly configured
- **Error Handling**: Graceful fallbacks for network issues

## Firestore Security Rules

The following security rules should be configured in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only read/write their own walk history
    match /WalkHistory/{walkId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Firebase Configuration

Your Firebase project is configured with:
- **Project ID**: `ecosteps-aeb56`
- **Auth Domain**: `ecosteps-aeb56.firebaseapp.com`
- **Analytics**: Enabled with measurement ID

## Testing

The app now supports:
- ✅ User registration and login
- ✅ Automatic profile creation
- ✅ Walk tracking and cloud sync
- ✅ Real-time data updates
- ✅ Offline fallbacks
- ✅ Analytics tracking

## Next Steps

Potential enhancements:
1. **Cloud Functions**: Server-side logic for rewards
2. **Push Notifications**: Remind users to stay active
3. **Social Features**: Share achievements
4. **Advanced Analytics**: Custom dashboards
5. **Data Export**: Allow users to download their data

---

Every walk you take is now automatically saved to the cloud! 🌟 