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

  // Walk History Management
  async addWalkToHistory(walkData: Omit<WalkHistoryEntry, 'id' | 'createdAt'>): Promise<string> {
    try {
      const walkHistoryRef = collection(firestore, 'WalkHistory');
      const docRef = await addDoc(walkHistoryRef, {
        ...walkData,
        createdAt: serverTimestamp(),
      });

      // Log analytics event
      this.logEvent('walk_completed', {
        distance: walkData.distance,
        duration: walkData.duration,
        points: walkData.points,
      });

      console.log('Walk added to history with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding walk to history:', error);
      throw error;
    }
  }

  async getUserWalkHistory(
    userId: string, 
    limitCount: number = 10
  ): Promise<WalkHistoryEntry[]> {
    try {
      const walkHistoryRef = collection(firestore, 'WalkHistory');
      // Simplified query to avoid index requirement - just filter by userId
      const q = query(
        walkHistoryRef,
        where('userId', '==', userId),
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

      // Sort in memory by createdAt descending
      walks.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      return walks.slice(0, limitCount);
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