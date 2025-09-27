# Firestore Database Structure

## User-Specific Walk History Implementation

### Overview
The walk history data is now stored in user-specific subcollections to ensure data privacy and security. Each user's walking data is completely isolated from other users.

### Database Structure

```
firestore/
├── users/
│   ├── {userId1}/
│   │   ├── [user profile data]
│   │   └── walkHistory/
│   │       ├── {walkId1}/
│   │       ├── {walkId2}/
│   │       └── {walkId3}/
│   ├── {userId2}/
│   │   ├── [user profile data]
│   │   └── walkHistory/
│   │       ├── {walkId1}/
│   │       └── {walkId2}/
│   └── ...
```

### Collection Paths

1. **User Profiles**: `users/{userId}`
2. **User Walk History**: `users/{userId}/walkHistory/{walkId}`

### Benefits

#### 🔒 **Security & Privacy**
- Each user can only access their own walk history
- No risk of cross-user data exposure
- Automatic data isolation through Firestore security rules

#### ⚡ **Performance**
- Faster queries (no need to filter by userId)
- Better indexing performance
- Can use `orderBy` without composite indexes
- Reduced data transfer

#### 📊 **Scalability**
- Better horizontal scaling
- Reduced query complexity
- More efficient pagination
- Better cache locality

#### 🛡️ **Security Rules**
Can implement simple, secure rules:
```javascript
// Allow users to read/write only their own data
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  
  match /walkHistory/{walkId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
```

### API Changes

#### Before (Global Collection)
```typescript
// Old: Single collection with userId filter
collection(firestore, 'WalkHistory')
query(walkHistoryRef, where('userId', '==', userId), limit(10))
```

#### After (User-Specific Subcollections)
```typescript
// New: User-specific subcollection
collection(firestore, 'users', userId, 'walkHistory')
query(userWalkHistoryRef, orderBy('createdAt', 'desc'), limit(10))
```

### Migration Notes

- **New installations**: Will automatically use the new structure
- **Existing data**: Previous walk history data in the global `WalkHistory` collection remains accessible but new walks will be stored in user subcollections
- **Backwards compatibility**: The app gracefully handles both old and new data structures

### Data Flow

1. **Save Walk**: User completes a walk → Saved locally → Synced to `users/{userId}/walkHistory/`
2. **Load History**: Query `users/{userId}/walkHistory/` ordered by date
3. **User Stats**: Aggregate data from user's subcollection
4. **Analytics**: Can still track aggregated metrics across all users

### Example Document Structure

**User Profile** (`users/{userId}`)
```json
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@example.com",
  "totalPoints": 150,
  "level": 2,
  "activitiesCompleted": 5,
  "totalDistance": 12.5,
  "badges": ["eco-warrior"],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Walk History Entry** (`users/{userId}/walkHistory/{walkId}`)
```json
{
  "userId": "user123",
  "distance": 2.5,
  "duration": 1800,
  "points": 25,
  "startTime": "2025-01-15T09:00:00Z",
  "endTime": "2025-01-15T09:30:00Z",
  "startLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "endLocation": {
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "route": [],
  "createdAt": "2025-01-15T09:30:15Z"
}
```

This structure ensures optimal performance, security, and scalability for the EcoSteps application. 