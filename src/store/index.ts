import { configureStore } from '@reduxjs/toolkit';
import userSlice from './slices/userSlice';
import activitySlice from './slices/activitySlice';
import rewardsSlice from './slices/rewardsSlice';
import locationSlice from './slices/locationSlice';

export const store = configureStore({
  reducer: {
    user: userSlice,
    activity: activitySlice,
    rewards: rewardsSlice,
    location: locationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['activity/startTracking', 'activity/addRoutePoint'],
        ignoredPaths: ['activity.currentActivity.startTime', 'activity.currentActivity.endTime'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 