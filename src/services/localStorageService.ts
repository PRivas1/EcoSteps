import AsyncStorage from '@react-native-async-storage/async-storage';
import { WalkHistoryEntry } from './firebaseService';

export interface LocalWalkEntry extends Omit<WalkHistoryEntry, 'createdAt'> {
  localId: string;
  createdAt: Date;
  synced?: boolean;
  syncAttempts?: number;
  lastSyncAttempt?: Date;
}

class LocalStorageService {
  private static instance: LocalStorageService;
  private readonly WALKS_KEY = '@ecosteps_local_walks';
  private readonly USER_PERMISSIONS_KEY = '@ecosteps_permissions';

  static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  // Walk Data Management
  async saveWalkLocally(walkData: Omit<LocalWalkEntry, 'localId' | 'createdAt' | 'synced'>): Promise<string> {
    try {
      const localId = `walk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const localWalk: LocalWalkEntry = {
        ...walkData,
        localId,
        createdAt: new Date(),
        synced: false,
        syncAttempts: 0,
      };

      const existingWalks = await this.getLocalWalks();
      existingWalks.push(localWalk);
      
      await AsyncStorage.setItem(this.WALKS_KEY, JSON.stringify(existingWalks));
      console.log('Walk saved locally with ID:', localId);
      
      return localId;
    } catch (error) {
      console.error('Error saving walk locally:', error);
      throw error;
    }
  }

  async getLocalWalks(): Promise<LocalWalkEntry[]> {
    try {
      const walksData = await AsyncStorage.getItem(this.WALKS_KEY);
      if (!walksData) return [];
      
      const walks: LocalWalkEntry[] = JSON.parse(walksData);
      // Convert date strings back to Date objects
      return walks.map(walk => ({
        ...walk,
        startTime: new Date(walk.startTime),
        endTime: new Date(walk.endTime),
        createdAt: new Date(walk.createdAt),
        lastSyncAttempt: walk.lastSyncAttempt ? new Date(walk.lastSyncAttempt) : undefined,
      }));
    } catch (error) {
      console.error('Error getting local walks:', error);
      return [];
    }
  }

  async getUnsyncedWalks(): Promise<LocalWalkEntry[]> {
    const allWalks = await this.getLocalWalks();
    return allWalks.filter(walk => !walk.synced);
  }

  async markWalkAsSynced(localId: string, firebaseId?: string): Promise<void> {
    try {
      const walks = await this.getLocalWalks();
      const walkIndex = walks.findIndex(walk => walk.localId === localId);
      
      if (walkIndex !== -1) {
        walks[walkIndex].synced = true;
        if (firebaseId) {
          walks[walkIndex].id = firebaseId;
        }
        
        await AsyncStorage.setItem(this.WALKS_KEY, JSON.stringify(walks));
        console.log('Walk marked as synced:', localId);
      }
    } catch (error) {
      console.error('Error marking walk as synced:', error);
    }
  }

  async incrementSyncAttempts(localId: string): Promise<void> {
    try {
      const walks = await this.getLocalWalks();
      const walkIndex = walks.findIndex(walk => walk.localId === localId);
      
      if (walkIndex !== -1) {
        walks[walkIndex].syncAttempts = (walks[walkIndex].syncAttempts || 0) + 1;
        walks[walkIndex].lastSyncAttempt = new Date();
        
        await AsyncStorage.setItem(this.WALKS_KEY, JSON.stringify(walks));
      }
    } catch (error) {
      console.error('Error incrementing sync attempts:', error);
    }
  }

  async deleteSyncedWalks(): Promise<void> {
    try {
      const walks = await this.getLocalWalks();
      const unsyncedWalks = walks.filter(walk => !walk.synced);
      
      await AsyncStorage.setItem(this.WALKS_KEY, JSON.stringify(unsyncedWalks));
      console.log('Synced walks deleted from local storage');
    } catch (error) {
      console.error('Error deleting synced walks:', error);
    }
  }

  async deleteWalk(localId: string): Promise<void> {
    try {
      const walks = await this.getLocalWalks();
      const filteredWalks = walks.filter(walk => walk.localId !== localId);
      
      await AsyncStorage.setItem(this.WALKS_KEY, JSON.stringify(filteredWalks));
      console.log('Walk deleted locally:', localId);
    } catch (error) {
      console.error('Error deleting walk locally:', error);
    }
  }

  // Permission State Management
  async savePermissionState(granted: boolean): Promise<void> {
    try {
      const permissionData = {
        locationGranted: granted,
        lastChecked: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(this.USER_PERMISSIONS_KEY, JSON.stringify(permissionData));
    } catch (error) {
      console.error('Error saving permission state:', error);
    }
  }

  async getPermissionState(): Promise<{ locationGranted: boolean; lastChecked?: Date } | null> {
    try {
      const permissionData = await AsyncStorage.getItem(this.USER_PERMISSIONS_KEY);
      if (!permissionData) return null;
      
      const parsed = JSON.parse(permissionData);
      return {
        locationGranted: parsed.locationGranted,
        lastChecked: parsed.lastChecked ? new Date(parsed.lastChecked) : undefined,
      };
    } catch (error) {
      console.error('Error getting permission state:', error);
      return null;
    }
  }

  // Statistics
  async getLocalWalkStats(): Promise<{
    totalWalks: number;
    totalDistance: number;
    totalDuration: number;
    totalPoints: number;
    unsyncedCount: number;
  }> {
    try {
      const walks = await this.getLocalWalks();
      const unsyncedWalks = walks.filter(walk => !walk.synced);
      
      const stats = walks.reduce(
        (acc, walk) => ({
          totalWalks: acc.totalWalks + 1,
          totalDistance: acc.totalDistance + walk.distance,
          totalDuration: acc.totalDuration + walk.duration,
          totalPoints: acc.totalPoints + walk.points,
        }),
        {
          totalWalks: 0,
          totalDistance: 0,
          totalDuration: 0,
          totalPoints: 0,
        }
      );

      return {
        ...stats,
        unsyncedCount: unsyncedWalks.length,
      };
    } catch (error) {
      console.error('Error getting local walk stats:', error);
      return {
        totalWalks: 0,
        totalDistance: 0,
        totalDuration: 0,
        totalPoints: 0,
        unsyncedCount: 0,
      };
    }
  }

  // Utility method to clear all local data (for testing/reset)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.WALKS_KEY, this.USER_PERMISSIONS_KEY]);
      console.log('All local data cleared');
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  }
}

export default LocalStorageService; 