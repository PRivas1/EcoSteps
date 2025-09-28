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

export interface TransitHistoryEntry {
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
    address?: string;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  routeType: 'bus' | 'train' | 'subway' | 'tram' | 'metro';
  transitMode: 'transit';
  // Payment information
  payment?: {
    amount: number; // Total price paid
    pricePerKm: number; // Rate per kilometer
    currency: string; // Currency code (e.g., 'USD')
    paymentMethod: string; // Payment method used
    transactionId: string; // Mock transaction ID
    paidAt: Date; // Payment timestamp
  };
  createdAt: Date;
}

export interface CyclingHistoryEntry {
  id?: string;
  userId: string;
  distance: number;
  duration: number; // in seconds
  points: number;
  startTime: Date;
  endTime: Date;
  startStation?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
  endStation?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
  bikeShareSystem: 'indego';
  cyclingMode: 'cycling';
  // Payment information
  payment?: {
    amount: number; // Total price paid
    pricePerKm: number; // Rate per kilometer
    currency: string; // Currency code (e.g., 'USD')
    paymentMethod: string; // Payment method used
    transactionId: string; // Mock transaction ID
    paidAt: Date; // Payment timestamp
  };
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

      // Add points to user's profile
      await this.addPointsFromActivity(walkData.userId, walkData.points);

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
    totalTransits: number;
    totalCycling: number;
    totalActivities: number;
    totalDistance: number;
    totalDuration: number;
    totalPoints: number;
  }> {
    try {
      // Get walks, transits, and cycling in parallel
      const [walks, transits, cycling] = await Promise.all([
        this.getUserWalkHistory(userId, 1000),
        this.getUserTransitHistory(userId, 1000),
        this.getUserCyclingHistory(userId, 1000)
      ]);
      
      const walkStats = walks.reduce(
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

      const transitStats = transits.reduce(
        (acc, transit) => ({
          totalTransits: acc.totalTransits + 1,
          totalDistance: acc.totalDistance + transit.distance,
          totalDuration: acc.totalDuration + transit.duration,
          totalPoints: acc.totalPoints + transit.points,
        }),
        {
          totalTransits: 0,
          totalDistance: 0,
          totalDuration: 0,
          totalPoints: 0,
        }
      );

      const cyclingStats = cycling.reduce(
        (acc, cycle) => ({
          totalCycling: acc.totalCycling + 1,
          totalDistance: acc.totalDistance + cycle.distance,
          totalDuration: acc.totalDuration + cycle.duration,
          totalPoints: acc.totalPoints + cycle.points,
        }),
        {
          totalCycling: 0,
          totalDistance: 0,
          totalDuration: 0,
          totalPoints: 0,
        }
      );

      const combinedStats = {
        totalWalks: walkStats.totalWalks,
        totalTransits: transitStats.totalTransits,
        totalCycling: cyclingStats.totalCycling,
        totalActivities: walkStats.totalWalks + transitStats.totalTransits + cyclingStats.totalCycling,
        totalDistance: walkStats.totalDistance + transitStats.totalDistance + cyclingStats.totalDistance,
        totalDuration: walkStats.totalDuration + transitStats.totalDuration + cyclingStats.totalDuration,
        totalPoints: walkStats.totalPoints + transitStats.totalPoints + cyclingStats.totalPoints,
      };

      console.log(`User ${userId} combined stats: ${combinedStats.totalWalks} walks, ${combinedStats.totalTransits} transits, ${combinedStats.totalCycling} cycling, ${combinedStats.totalActivities} total activities`);
      return combinedStats;
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

  // Transit History Management - User-specific subcollections
  // Structure: users/{userId}/transitHistory/{transitId}
  async addTransitToHistory(transitData: Omit<TransitHistoryEntry, 'id' | 'createdAt'>): Promise<string> {
    try {
      // Create user-specific subcollection: users/{userId}/transitHistory
      const userTransitHistoryRef = collection(firestore, 'users', transitData.userId, 'transitHistory');
      const docRef = await addDoc(userTransitHistoryRef, {
        ...transitData,
        createdAt: serverTimestamp(),
      });

      // Add points to user's profile
      await this.addPointsFromActivity(transitData.userId, transitData.points);

      // Log analytics event
      this.logEvent('transit_completed', {
        distance: transitData.distance,
        duration: transitData.duration,
        points: transitData.points,
        routeType: transitData.routeType,
        userId: transitData.userId,
      });

      console.log(`Transit trip added to user ${transitData.userId} history with ID:`, docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding transit to user history:', error);
      throw error;
    }
  }

  async getUserTransitHistory(
    userId: string, 
    limitCount: number = 10
  ): Promise<TransitHistoryEntry[]> {
    try {
      // Query user-specific subcollection: users/{userId}/transitHistory
      const userTransitHistoryRef = collection(firestore, 'users', userId, 'transitHistory');
      
      const q = query(
        userTransitHistoryRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const transits: TransitHistoryEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transits.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to Date objects
          startTime: data.startTime?.toDate?.() || data.startTime,
          endTime: data.endTime?.toDate?.() || data.endTime,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
        } as TransitHistoryEntry);
      });

      console.log(`Retrieved ${transits.length} transit trips for user ${userId}`);
      return transits;
    } catch (error) {
      console.error('Error getting user transit history:', error);
      return [];
    }
  }

  async getUserTransitCount(userId: string): Promise<number> {
    try {
      const userTransitHistoryRef = collection(firestore, 'users', userId, 'transitHistory');
      const querySnapshot = await getDocs(userTransitHistoryRef);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting user transit count:', error);
      return 0;
    }
  }

  async deleteUserTransit(userId: string, transitId: string): Promise<void> {
    try {
      const transitRef = doc(firestore, 'users', userId, 'transitHistory', transitId);
      await deleteDoc(transitRef);
      console.log(`Deleted transit ${transitId} for user ${userId}`);
    } catch (error) {
      console.error('Error deleting user transit:', error);
      throw error;
    }
  }

  // Cycling History Management - User-specific subcollections
  // Structure: users/{userId}/cyclingHistory/{cyclingId}
  async addCyclingToHistory(cyclingData: Omit<CyclingHistoryEntry, 'id' | 'createdAt'>): Promise<string> {
    try {
      // Create user-specific subcollection: users/{userId}/cyclingHistory
      const userCyclingHistoryRef = collection(firestore, 'users', cyclingData.userId, 'cyclingHistory');
      const docRef = await addDoc(userCyclingHistoryRef, {
        ...cyclingData,
        createdAt: serverTimestamp(),
      });

      // Add points to user's profile
      await this.addPointsFromActivity(cyclingData.userId, cyclingData.points);

      // Log analytics event
      this.logEvent('cycling_completed', {
        distance: cyclingData.distance,
        duration: cyclingData.duration,
        points: cyclingData.points,
        bikeShareSystem: cyclingData.bikeShareSystem,
        userId: cyclingData.userId,
      });

      console.log(`Cycling trip added to user ${cyclingData.userId} history with ID:`, docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding cycling to user history:', error);
      throw error;
    }
  }

  async getUserCyclingHistory(
    userId: string, 
    limitCount: number = 10
  ): Promise<CyclingHistoryEntry[]> {
    try {
      // Query user-specific subcollection: users/{userId}/cyclingHistory
      const userCyclingHistoryRef = collection(firestore, 'users', userId, 'cyclingHistory');
      
      const q = query(
        userCyclingHistoryRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const cycling: CyclingHistoryEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        cycling.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to Date objects
          startTime: data.startTime?.toDate?.() || data.startTime,
          endTime: data.endTime?.toDate?.() || data.endTime,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
        } as CyclingHistoryEntry);
      });

      console.log(`Retrieved ${cycling.length} cycling trips for user ${userId}`);
      return cycling;
    } catch (error) {
      console.error('Error getting user cycling history:', error);
      return [];
    }
  }

  async getUserCyclingCount(userId: string): Promise<number> {
    try {
      const userCyclingHistoryRef = collection(firestore, 'users', userId, 'cyclingHistory');
      const querySnapshot = await getDocs(userCyclingHistoryRef);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting user cycling count:', error);
      return 0;
    }
  }

  async deleteUserCycling(userId: string, cyclingId: string): Promise<void> {
    try {
      const cyclingRef = doc(firestore, 'users', userId, 'cyclingHistory', cyclingId);
      await deleteDoc(cyclingRef);
      console.log(`Deleted cycling ${cyclingId} for user ${userId}`);
    } catch (error) {
      console.error('Error deleting user cycling:', error);
      throw error;
    }
  }

  // Refresh user profile stats based on actual walk and transit history data
  // Note: This method preserves totalPoints to account for reward redemptions
  async refreshUserStats(userId: string): Promise<void> {
    try {
      const actualStats = await this.getUserTotalStats(userId);
      const currentProfile = await this.getUserProfile(userId);
      
      if (currentProfile) {
        // Calculate level based on current totalPoints (not activity points)
        const currentTotalPoints = currentProfile.totalPoints || 0;
        
        await this.updateUserProfile(userId, {
          // DO NOT update totalPoints here - preserve existing value to account for reward redemptions
          activitiesCompleted: actualStats.totalActivities, // Now includes both walks and transits
          totalDistance: actualStats.totalDistance,
          level: Math.floor(currentTotalPoints / 100) + 1,
        });
        
        console.log(`Refreshed user ${userId} stats: ${actualStats.totalActivities} activities (${actualStats.totalWalks} walks + ${actualStats.totalTransits} transits + ${actualStats.totalCycling} cycling), current points: ${currentTotalPoints}`);
      }
    } catch (error) {
      console.error('Error refreshing user stats:', error);
      throw error;
    }
  }

  // Add points from a new activity (used when completing activities)
  async addPointsFromActivity(userId: string, points: number): Promise<void> {
    try {
      const currentProfile = await this.getUserProfile(userId);
      if (currentProfile) {
        const newTotalPoints = (currentProfile.totalPoints || 0) + points;
        await this.updateUserProfile(userId, {
          totalPoints: newTotalPoints,
          level: Math.floor(newTotalPoints / 100) + 1,
        });
        console.log(`Added ${points} points to user ${userId}. New total: ${newTotalPoints}`);
      }
    } catch (error) {
      console.error('Error adding points from activity:', error);
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
  // Reward redemption management
  async addRedeemedReward(userId: string, rewardData: {
    rewardId: string;
    title: string;
    pointsCost: number;
    category: string;
    redeemedAt: Date;
    qrCode: string;
  }): Promise<string> {
    try {
      const userRedeemedRewardsRef = collection(firestore, 'users', userId, 'redeemedRewards');
      const docRef = await addDoc(userRedeemedRewardsRef, {
        ...rewardData,
        usedForDiscount: false, // Track if reward has been used for discount
        discountUsedAt: null, // Track when discount was used
        createdAt: serverTimestamp(),
      });

      this.logEvent('reward_redeemed', {
        rewardId: rewardData.rewardId,
        pointsCost: rewardData.pointsCost,
        category: rewardData.category,
        userId: userId,
      });

      console.log(`Reward ${rewardData.rewardId} redeemed by user ${userId} with ID:`, docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding redeemed reward:', error);
      throw error;
    }
  }

  async getUserRedeemedRewards(userId: string): Promise<any[]> {
    try {
      const userRedeemedRewardsRef = collection(firestore, 'users', userId, 'redeemedRewards');
      const q = query(userRedeemedRewardsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const redeemedRewards: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        redeemedRewards.push({
          id: doc.id,
          ...data,
          redeemedAt: data.redeemedAt?.toDate?.() || data.redeemedAt,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
        });
      });

      console.log(`Retrieved ${redeemedRewards.length} redeemed rewards for user ${userId}`);
      return redeemedRewards;
    } catch (error) {
      console.error('Error getting user redeemed rewards:', error);
      return [];
    }
  }

  // Mark a redeemed reward as used for discount
  async markRewardUsedForDiscount(userId: string, rewardDocId: string): Promise<void> {
    try {
      const rewardRef = doc(firestore, 'users', userId, 'redeemedRewards', rewardDocId);
      await updateDoc(rewardRef, {
        usedForDiscount: true,
        discountUsedAt: serverTimestamp(),
      });
      
      console.log(`Marked reward ${rewardDocId} as used for discount for user ${userId}`);
    } catch (error) {
      console.error('Error marking reward as used for discount:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

export default FirebaseService; 