import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '../../types';

interface UserState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  profile: {
    id: '1',
    name: 'EcoUser',
    email: 'user@ecosteps.com',
    totalPoints: 0,
    level: 1,
    activitiesCompleted: 0,
    totalDistance: 0,
    badges: [],
  },
  isAuthenticated: true,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    addPoints: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.totalPoints += action.payload;
        // Update level based on points (every 100 points = new level)
        state.profile.level = Math.floor(state.profile.totalPoints / 100) + 1;
      }
    },
    completeActivity: (state, action: PayloadAction<{ distance: number; points: number }>) => {
      if (state.profile) {
        state.profile.activitiesCompleted += 1;
        state.profile.totalDistance += action.payload.distance;
        state.profile.totalPoints += action.payload.points;
        state.profile.level = Math.floor(state.profile.totalPoints / 100) + 1;
      }
    },
    addBadge: (state, action: PayloadAction<string>) => {
      if (state.profile && !state.profile.badges.includes(action.payload)) {
        state.profile.badges.push(action.payload);
      }
    },
    spendPoints: (state, action: PayloadAction<number>) => {
      if (state.profile && state.profile.totalPoints >= action.payload) {
        state.profile.totalPoints -= action.payload;
      }
    },
  },
});

export const { updateProfile, addPoints, completeActivity, addBadge, spendPoints } = userSlice.actions;
export default userSlice.reducer; 