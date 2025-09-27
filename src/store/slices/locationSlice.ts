import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Location, CycleStation, TransitRoute } from '../../types';

interface LocationState {
  userLocation: Location | null;
  nearbyStations: CycleStation[];
  transitRoutes: TransitRoute[];
  isLocationEnabled: boolean;
  locationError: string | null;
}

const initialState: LocationState = {
  userLocation: null,
  nearbyStations: [],
  transitRoutes: [],
  isLocationEnabled: false,
  locationError: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setUserLocation: (state, action: PayloadAction<Location>) => {
      state.userLocation = action.payload;
      state.locationError = null;
    },
    setLocationEnabled: (state, action: PayloadAction<boolean>) => {
      state.isLocationEnabled = action.payload;
    },
    setLocationError: (state, action: PayloadAction<string>) => {
      state.locationError = action.payload;
    },
    setNearbyStations: (state, action: PayloadAction<CycleStation[]>) => {
      state.nearbyStations = action.payload;
    },
    setTransitRoutes: (state, action: PayloadAction<TransitRoute[]>) => {
      state.transitRoutes = action.payload;
    },
    updateStationAvailability: (state, action: PayloadAction<{ stationId: string; availableBikes: number }>) => {
      const station = state.nearbyStations.find(s => s.id === action.payload.stationId);
      if (station) {
        station.availableBikes = action.payload.availableBikes;
      }
    },
    clearLocation: (state) => {
      state.userLocation = null;
      state.nearbyStations = [];
      state.transitRoutes = [];
      state.locationError = null;
    },
  },
});

export const {
  setUserLocation,
  setLocationEnabled,
  setLocationError,
  setNearbyStations,
  setTransitRoutes,
  updateStationAvailability,
  clearLocation,
} = locationSlice.actions;

export default locationSlice.reducer; 