import { configureStore } from '@reduxjs/toolkit';
import userSlice from './slices/userSlice';
import activitySlice from './slices/activitySlice';
import rewardsSlice from './slices/rewardsSlice';
import locationSlice from './slices/locationSlice';
import authSlice from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    activity: activitySlice,
    rewards: rewardsSlice,
    location: locationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable for development simplicity
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 