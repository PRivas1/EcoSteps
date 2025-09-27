export type TransportMode = 'walk' | 'cycle' | 'transit';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface RoutePoint extends Location {
  timestamp: number;
}

export interface Activity {
  id: string;
  mode: TransportMode;
  startTime: Date;
  endTime?: Date;
  distance: number;
  points: number;
  route: RoutePoint[];
  startLocation?: Location;
  endLocation?: Location;
  isCompleted: boolean;
}

export interface CycleStation {
  id: string;
  name: string;
  location: Location;
  availableBikes: number;
  totalCapacity: number;
}

export interface TransitRoute {
  id: string;
  summary: string;
  legs: TransitLeg[];
  duration: number;
  distance: number;
  fare?: number;
}

export interface TransitLeg {
  mode: 'walking' | 'bus' | 'train' | 'subway';
  duration: number;
  distance: number;
  instructions: string;
  startLocation: Location;
  endLocation: Location;
  routeColor?: string;
  routeName?: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: 'supermarket' | 'transport' | 'entertainment' | 'food';
  discountPercentage: number;
  isRedeemed: boolean;
  redeemedAt?: Date;
  qrCode?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  totalPoints: number;
  level: number;
  activitiesCompleted: number;
  totalDistance: number;
  badges: string[];
}

export interface AppState {
  user: UserProfile | null;
  activities: Activity[];
  rewards: Reward[];
  currentActivity: Activity | null;
  isTracking: boolean;
  userLocation: Location | null;
} 