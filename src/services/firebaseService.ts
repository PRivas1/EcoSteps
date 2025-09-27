import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { auth, firestore, analytics } from './firebaseConfig';
import { UserProfile, Activity } from '../types';

export interface WalkHistoryEntry {
  id?: string;
  userId: string;
  distance: number;
  duration: number; // in seconds
  points: number;
  startTime: Date;
  endTime: Date;
  startLocation?: {
    latitude: number;
    longitude: number;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
  };
  route: Array<{
    latitude: number;
    longitude: number;
    timestamp: number;
  }>;
  createdAt: Date;
}

class FirebaseService {
  private static instance: FirebaseService;

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // Analytics
  logEvent(eventName: string, parameters?: any) {
    if (analytics) {
      logEvent(analytics, eventName, parameters);
    }
  }

  // Authentication
  async signUp(email: string, password: string, name: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with name
      await updateProfile(user, { displayName: name });

      // Create user profile in Firestore
      await this.createUserProfile(user.uid, {
        id: user.uid,
        name,
        email,
        totalPoints: 0,
        level: 1,
        activitiesCompleted: 0,
        totalDistance: 0,
        badges: [],
      });

      // Log analytics event
      this.logEvent('sign_up', { method: 'email' });

      return user;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Log analytics event
      this.logEvent('login', { method: 'email' });

      return user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      this.logEvent('logout');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Auth state observer
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // User Profile Management
  async createUserProfile(userId: string, userData: UserProfile): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Walk History Management - User-specific subcollections
  // Structure: users/{userId}/walkHistory/{walkId}
  // This ensures each user's walk history is private and isolated
  async addWalkToHistory(walkData: Omit<WalkHistoryEntry, 'id' | 'createdAt'>): Promise<string> {
    try {
      // Create user-specific subcollection: users/{userId}/walkHistory
      const userWalkHistoryRef = collection(firestore, 'users', walkData.userId, 'walkHistory');
      const docRef = await addDoc(userWalkHistoryRef, {
        ...walkData,
        createdAt: serverTimestamp(),
      });

      // Log analytics event
      this.logEvent('walk_completed', {
        distance: walkData.distance,
        duration: walkData.duration,
        points: walkData.points,
        userId: walkData.userId, // Include userId for analytics segmentation
      });

      console.log(`Walk added to user ${walkData.userId} history with ID:`, docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding walk to user history:', error);
      throw error;
    }
  }

  async getUserWalkHistory(
    userId: string, 
    limitCount: number = 10
  ): Promise<WalkHistoryEntry[]> {
    try {
      // Query user-specific subcollection: users/{userId}/walkHistory
      const userWalkHistoryRef = collection(firestore, 'users', userId, 'walkHistory');
      
      // We can now use orderBy since we're querying a specific user's subcollection
      const q = query(
        userWalkHistoryRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const walks: WalkHistoryEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        walks.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to Date objects
          startTime: data.startTime?.toDate?.() || data.startTime,
          endTime: data.endTime?.toDate?.() || data.endTime,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
        } as WalkHistoryEntry);
      });

      console.log(`Retrieved ${walks.length} walks for user ${userId}`);
      return walks;
    } catch (error) {
      console.error('Error getting user walk history:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  async getUserTotalStats(userId: string): Promise<{
    totalWalks: number;
    totalDistance: number;
    totalDuration: number;
    totalPoints: number;
  }> {
    try {
      const walks = await this.getUserWalkHistory(userId, 1000); // Get more for stats
      
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

      return stats;
    } catch (error) {
      console.error('Error getting user total stats:', error);
      throw error;
    }
  }

  // Delete a specific walk from user's history
  async deleteUserWalk(userId: string, walkId: string): Promise<void> {
    try {
      const walkRef = doc(firestore, 'users', userId, 'walkHistory', walkId);
      await deleteDoc(walkRef);
      console.log(`Deleted walk ${walkId} for user ${userId}`);
    } catch (error) {
      console.error('Error deleting user walk:', error);
      throw error;
    }
  }

  // Get count of user's walks without fetching all data
  async getUserWalkCount(userId: string): Promise<number> {
    try {
      const userWalkHistoryRef = collection(firestore, 'users', userId, 'walkHistory');
      const querySnapshot = await getDocs(userWalkHistoryRef);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting user walk count:', error);
      return 0;
    }
  }

  // Refresh user profile stats based on actual walk history data
  async refreshUserStats(userId: string): Promise<void> {
    try {
      const actualStats = await this.getUserTotalStats(userId);
      const currentProfile = await this.getUserProfile(userId);
      
      if (currentProfile) {
        await this.updateUserProfile(userId, {
          totalPoints: actualStats.totalPoints,
          activitiesCompleted: actualStats.totalWalks,
          totalDistance: actualStats.totalDistance,
          level: Math.floor(actualStats.totalPoints / 100) + 1,
        });
        
        console.log(`Refreshed user ${userId} stats: ${actualStats.totalWalks} activities, ${actualStats.totalPoints} points`);
      }
    } catch (error) {
      console.error('Error refreshing user stats:', error);
      throw error;
    }
  }

  // Utility method to sync local activity with Firebase
  async syncActivityToFirebase(activity: Activity, userId: string): Promise<void> {
    if (!activity.isCompleted || !activity.endTime) {
      console.log('Activity not completed, skipping sync');
      return;
    }

    try {
      const walkData: Omit<WalkHistoryEntry, 'id' | 'createdAt'> = {
        userId,
        distance: activity.distance,
        duration: Math.floor((activity.endTime.getTime() - activity.startTime.getTime()) / 1000), // milliseconds to seconds
        points: activity.points,
        startTime: activity.startTime,
        endTime: activity.endTime,
        startLocation: activity.startLocation,
        endLocation: activity.endLocation,
        route: activity.route.map(point => ({
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: point.timestamp,
        })),
      };

      await this.addWalkToHistory(walkData);

      // Update user profile with new stats
      const currentProfile = await this.getUserProfile(userId);
      if (currentProfile) {
        await this.updateUserProfile(userId, {
          totalPoints: currentProfile.totalPoints + activity.points,
          activitiesCompleted: currentProfile.activitiesCompleted + 1,
          totalDistance: currentProfile.totalDistance + activity.distance,
          level: Math.floor((currentProfile.totalPoints + activity.points) / 100) + 1,
        });
      }
    } catch (error) {
      console.error('Error syncing activity to Firebase:', error);
      throw error;
    }
  }

  // Get current authenticated user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

export default FirebaseService; 