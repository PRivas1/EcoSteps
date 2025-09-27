# Activity Counter Fix

## Problem
The activity counter in user profiles was incrementing by 1 with each sync instead of reflecting the actual number of walks in the user's walk history.

## Root Cause
In the `SyncService.updateUserStats()` method, the code was using:
```typescript
activitiesCompleted: currentProfile.activitiesCompleted + 1
```

This approach caused the counter to increment incorrectly and become out of sync with the actual walk history data.

## Solution
Updated the sync process to calculate stats from the actual walk history data:

### 1. Updated `SyncService.updateUserStats()` 
```typescript
// Before (Incorrect)
activitiesCompleted: currentProfile.activitiesCompleted + 1

// After (Correct)
const actualStats = await this.firebaseService.getUserTotalStats(userId);
activitiesCompleted: actualStats.totalWalks // Use actual count from database
```

### 2. Added `FirebaseService.refreshUserStats()`
```typescript
async refreshUserStats(userId: string): Promise<void> {
  const actualStats = await this.getUserTotalStats(userId);
  await this.updateUserProfile(userId, {
    totalPoints: actualStats.totalPoints,
    activitiesCompleted: actualStats.totalWalks, // Actual count from walk history
    totalDistance: actualStats.totalDistance,
    level: Math.floor(actualStats.totalPoints / 100) + 1,
  });
}
```

### 3. Updated Profile Loading
- **ProfileScreen**: Refreshes stats when loading user data
- **useAuth Hook**: Refreshes stats when user authenticates

## Benefits

### ✅ **Accurate Counting**
- Activity counter now reflects the exact number of walks in user's history
- No more drift between displayed count and actual data

### ✅ **Data Consistency**
- All stats (points, distance, activities) are calculated from the same source
- Eliminates sync issues between local state and database

### ✅ **Self-Healing**
- Profile refresh automatically corrects any inconsistencies
- Stats are recalculated from source of truth on each app launch

### ✅ **Future-Proof**
- Works correctly with user-specific subcollections
- Handles edge cases like deleted walks or data migration

## Implementation Details

### When Stats Are Refreshed
1. **App Launch**: When user authenticates (`useAuth` hook)
2. **Profile View**: When user opens profile screen
3. **Manual Refresh**: Pull-to-refresh on profile screen
4. **After Sync**: When walks are synced to Firebase

### Data Flow
```
Walk Completed → Saved Locally → Synced to Firebase → Stats Refreshed → UI Updated
```

### Database Query
```typescript
// Get all walks for user and calculate totals
const walks = await getUserWalkHistory(userId, 1000);
const totalWalks = walks.length; // Actual count
const totalPoints = walks.reduce((sum, walk) => sum + walk.points, 0);
const totalDistance = walks.reduce((sum, walk) => sum + walk.distance, 0);
```

This ensures the activity counter always shows the correct number of walks in the user's history. 