import FirebaseService from './firebaseService';
import LocalStorageService, { LocalWalkEntry } from './localStorageService';
import { AppState, AppStateStatus } from 'react-native';

class SyncService {
  private static instance: SyncService;
  private firebaseService: FirebaseService;
  private localStorageService: LocalStorageService;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private appStateListener: any = null;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  constructor() {
    this.firebaseService = FirebaseService.getInstance();
    this.localStorageService = LocalStorageService.getInstance();
  }

  // Initialize background sync
  initializeBackgroundSync(): void {
    // Sync when app state changes
    this.appStateListener = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
    
    // Initial sync
    this.syncUnsyncedWalks();
    
    // Set up periodic sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.syncUnsyncedWalks();
    }, 5 * 60 * 1000);
  }

  // Clean up listeners
  cleanup(): void {
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'active') {
      // App came to foreground, sync data
      this.syncUnsyncedWalks();
    }
  }

  // Main sync method
  async syncUnsyncedWalks(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    const currentUser = this.firebaseService.getCurrentUser();
    if (!currentUser) {
      console.log('No authenticated user, skipping sync');
      return;
    }

    this.isSyncing = true;
    console.log('Starting sync of unsynced walks...');

    try {
      const unsyncedWalks = await this.localStorageService.getUnsyncedWalks();
      console.log(`Found ${unsyncedWalks.length} unsynced walks`);

      if (unsyncedWalks.length === 0) {
        return;
      }

      let syncedCount = 0;
      let failedCount = 0;

      for (const walk of unsyncedWalks) {
        try {
          // Skip if too many failed attempts (more than 5)
          if ((walk.syncAttempts || 0) >= 5) {
            console.log(`Skipping walk ${walk.localId} - too many failed attempts`);
            continue;
          }

          await this.localStorageService.incrementSyncAttempts(walk.localId);

          // Convert local walk to Firebase format
          const firebaseWalkData = {
            userId: currentUser.uid,
            distance: walk.distance,
            duration: walk.duration,
            points: walk.points,
            startTime: walk.startTime,
            endTime: walk.endTime,
            startLocation: walk.startLocation,
            endLocation: walk.endLocation,
            route: walk.route,
          };

          // Upload to Firebase
          const firebaseId = await this.firebaseService.addWalkToHistory(firebaseWalkData);
          
          // Mark as synced and optionally delete locally
          await this.localStorageService.markWalkAsSynced(walk.localId, firebaseId);
          
          // Update user profile with new stats
          await this.updateUserStats(currentUser.uid, walk);
          
          syncedCount++;
          console.log(`Successfully synced walk ${walk.localId} to Firebase as ${firebaseId}`);

        } catch (error) {
          console.error(`Failed to sync walk ${walk.localId}:`, error);
          failedCount++;
        }
      }

      console.log(`Sync completed: ${syncedCount} synced, ${failedCount} failed`);

      // Clean up synced walks after successful sync
      if (syncedCount > 0) {
        await this.localStorageService.deleteSyncedWalks();
        console.log('Cleaned up synced walks from local storage');
      }

    } catch (error) {
      console.error('Error during sync process:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Update user profile stats after syncing walks
  private async updateUserStats(userId: string, walk: LocalWalkEntry): Promise<void> {
    try {
      const currentProfile = await this.firebaseService.getUserProfile(userId);
      if (currentProfile) {
        // Get actual stats from walk history to ensure accuracy
        const actualStats = await this.firebaseService.getUserTotalStats(userId);
        
        await this.firebaseService.updateUserProfile(userId, {
          totalPoints: actualStats.totalPoints,
          activitiesCompleted: actualStats.totalActivities, // Use actual count from database (walks + transits)
          totalDistance: actualStats.totalDistance,
          level: Math.floor(actualStats.totalPoints / 100) + 1,
        });
        
        console.log(`Updated user stats: ${actualStats.totalActivities} activities (${actualStats.totalWalks} walks + ${actualStats.totalTransits} transits), ${actualStats.totalPoints} points, ${actualStats.totalDistance.toFixed(2)} km`);
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
      // Don't throw error here as the walk sync was successful
    }
  }

  // Manual sync trigger
  async forcSync(): Promise<boolean> {
    try {
      await this.syncUnsyncedWalks();
      return true;
    } catch (error) {
      console.error('Force sync failed:', error);
      return false;
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isSyncing: boolean;
    unsyncedCount: number;
    lastSync?: Date;
  }> {
    const unsyncedWalks = await this.localStorageService.getUnsyncedWalks();
    
    // Find the most recent sync attempt
    const walks = await this.localStorageService.getLocalWalks();
    const syncedWalks = walks.filter(walk => walk.synced);
    const lastSync = syncedWalks.length > 0 
      ? new Date(Math.max(...syncedWalks.map(w => w.lastSyncAttempt?.getTime() || 0)))
      : undefined;

    return {
      isSyncing: this.isSyncing,
      unsyncedCount: unsyncedWalks.length,
      lastSync: lastSync?.getTime() === 0 ? undefined : lastSync,
    };
  }

  // Check if internet connection is available (basic check)
  private async isOnline(): Promise<boolean> {
    try {
      // Simple connectivity check by trying to fetch from Firebase
      const currentUser = this.firebaseService.getCurrentUser();
      if (!currentUser) return false;
      
      // Try to get user profile as connectivity test
      await this.firebaseService.getUserProfile(currentUser.uid);
      return true;
    } catch (error) {
      console.log('Appears to be offline or Firebase unreachable');
      return false;
    }
  }
}

export default SyncService; 