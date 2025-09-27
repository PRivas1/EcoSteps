import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Activity, RoutePoint, TransportMode } from '../../types';

interface ActivityState {
  currentActivity: Activity | null;
  activities: Activity[];
  isTracking: boolean;
}

const initialState: ActivityState = {
  currentActivity: null,
  activities: [],
  isTracking: false,
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    startActivity: (state, action: PayloadAction<{ mode: TransportMode; startLocation?: { latitude: number; longitude: number } }>) => {
      const newActivity: Activity = {
        id: Date.now().toString(),
        mode: action.payload.mode,
        startTime: new Date(), // This will be converted to timestamp by the serialization check config
        distance: 0,
        points: 0,
        route: [],
        startLocation: action.payload.startLocation,
        isCompleted: false,
      };
      state.currentActivity = newActivity;
      state.isTracking = true;
    },
    addRoutePoint: (state, action: PayloadAction<RoutePoint>) => {
      if (state.currentActivity) {
        state.currentActivity.route.push(action.payload);
        // Calculate distance if we have at least 2 points
        if (state.currentActivity.route.length >= 2) {
          const lastPoint = state.currentActivity.route[state.currentActivity.route.length - 2];
          const currentPoint = action.payload;
          const distance = calculateDistance(lastPoint, currentPoint);
          state.currentActivity.distance += distance;
        }
      }
    },
    stopActivity: (state, action: PayloadAction<{ endLocation?: { latitude: number; longitude: number } }>) => {
      if (state.currentActivity) {
        state.currentActivity.endTime = new Date(); // This will be converted to timestamp
        state.currentActivity.endLocation = action.payload.endLocation;
        state.currentActivity.isCompleted = true;
        
        // Calculate points based on mode and distance
        const pointsPerKm = {
          walk: 10,
          cycle: 8,
          transit: 4,
        };
        state.currentActivity.points = Math.round(state.currentActivity.distance * pointsPerKm[state.currentActivity.mode]);
        
        // Add to completed activities
        state.activities.push(state.currentActivity);
        state.currentActivity = null;
        state.isTracking = false;
      }
    },
    cancelActivity: (state) => {
      state.currentActivity = null;
      state.isTracking = false;
    },
    clearActivities: (state) => {
      state.activities = [];
    },
    updateActivityDistance: (state, action: PayloadAction<number>) => {
      if (state.currentActivity) {
        state.currentActivity.distance = action.payload;
      }
    },
  },
});

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const { 
  startActivity, 
  addRoutePoint, 
  stopActivity, 
  cancelActivity, 
  clearActivities,
  updateActivityDistance 
} = activitySlice.actions;

export default activitySlice.reducer; 