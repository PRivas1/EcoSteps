import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { setUser } from '../store/slices/authSlice';
import { updateProfile } from '../store/slices/userSlice';
import FirebaseService from '../services/firebaseService';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const firebaseService = FirebaseService.getInstance();
    
    // Listen for authentication state changes
    const unsubscribe = firebaseService.onAuthStateChanged(async (user) => {
      dispatch(setUser(user));
      
      if (user) {
        try {
          // Load user profile from Firebase
          const userProfile = await firebaseService.getUserProfile(user.uid);
          if (userProfile) {
            // Update Redux store with Firebase user profile data
            dispatch(updateProfile(userProfile));
            console.log('User profile synced from Firebase:', userProfile);
          } else {
            // Create initial profile if it doesn't exist
            const initialProfile = {
              id: user.uid,
              name: user.displayName || 'EcoUser',
              email: user.email || '',
              totalPoints: 0,
              level: 1,
              activitiesCompleted: 0,
              totalDistance: 0,
              badges: [],
            };
            
            await firebaseService.createUserProfile(user.uid, initialProfile);
            dispatch(updateProfile(initialProfile));
            console.log('Created initial user profile in Firebase');
          }
        } catch (error) {
          console.error('Error syncing user profile:', error);
        }
      } else {
        // User signed out, reset profile
        dispatch(updateProfile({
          id: '1',
          name: 'EcoUser',
          email: 'user@ecosteps.com',
          totalPoints: 0,
          level: 1,
          activitiesCompleted: 0,
          totalDistance: 0,
          badges: [],
        }));
      }
    });

    // Clean up subscription on unmount
    return unsubscribe;
  }, [dispatch]);
}; 