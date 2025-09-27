# Firebase Setup Guide

## Required Firebase Configuration

### 1. Firestore Security Rules

Go to **Firebase Console → Firestore Database → Rules** and set:

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

### 2. Firestore Indexes (Optional but Recommended)

If you want optimized queries, create this composite index:

**Collection ID**: `WalkHistory`
**Fields indexed**:
- `userId` (Ascending)
- `createdAt` (Descending)

#### To create the index:
1. Go to **Firebase Console → Firestore Database → Indexes**
2. Click **"Create Index"**
3. Set Collection ID: `WalkHistory`
4. Add fields:
   - Field path: `userId`, Order: `Ascending`
   - Field path: `createdAt`, Order: `Descending`
5. Click **"Create"**

Or click this auto-generated link from the error:
https://console.firebase.google.com/v1/r/project/ecosteps-aeb56/firestore/indexes?create_composite=ClJwcm9qZWN0cy9lY29zdGVwcy1hZWI1Ni9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvV2Fsa0hpc3RvcnkvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg

### 3. Authentication Settings

In **Firebase Console → Authentication → Settings → Authorized domains**, make sure these are added:
- `localhost`
- Your domain (if deploying)

### 4. Test Data Structure

The app will create documents with this structure:

#### Users Collection (`/users/{userId}`)
```json
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@example.com",
  "totalPoints": 0,
  "level": 1,
  "activitiesCompleted": 0,
  "totalDistance": 0,
  "badges": [],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### WalkHistory Collection (`/WalkHistory/{walkId}`)
```json
{
  "userId": "user123",
  "distance": 2.5,
  "duration": 1800,
  "points": 25,
  "startTime": "2025-01-01T10:00:00Z",
  "endTime": "2025-01-01T10:30:00Z",
  "startLocation": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "endLocation": {
    "latitude": 37.7849,
    "longitude": -122.4094
  },
  "route": [],
  "createdAt": "2025-01-01T10:30:00Z"
}
```

## Current Status

✅ **Authentication** - Working
✅ **User Profiles** - Working  
✅ **Walk Creation** - Working
⚠️ **Walk History Query** - Works with simplified query (no index needed)
⚠️ **AsyncStorage Warning** - Cosmetic only, auth still persists

## Notes

- The AsyncStorage warning is cosmetic - Firebase automatically handles persistence in React Native
- The simplified query works without indexes but may be slower with many walks
- Creating the composite index will improve performance for users with lots of walks 