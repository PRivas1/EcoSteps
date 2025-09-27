import * as Location from 'expo-location';
import { Location as LocationType, CycleStation, TransitRoute } from '../types';

class LocationService {
  private static instance: LocationService;
  private watchSubscription: Location.LocationSubscription | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationType | null> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startLocationTracking(callback: (location: LocationType) => void): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  stopLocationTracking(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  // Mock Google Maps API calls - replace with actual API implementation
  async getNearbyStations(location: LocationType, radius: number = 1000): Promise<CycleStation[]> {
    // Mock data - replace with actual Google Places API call
    const mockStations: CycleStation[] = [
      {
        id: 'station_1',
        name: 'Central Station',
        location: {
          latitude: location.latitude + 0.005,
          longitude: location.longitude + 0.005,
        },
        availableBikes: 8,
        totalCapacity: 15,
      },
      {
        id: 'station_2',
        name: 'Park Avenue',
        location: {
          latitude: location.latitude - 0.003,
          longitude: location.longitude + 0.007,
        },
        availableBikes: 3,
        totalCapacity: 12,
      },
      {
        id: 'station_3',
        name: 'Market Square',
        location: {
          latitude: location.latitude + 0.008,
          longitude: location.longitude - 0.004,
        },
        availableBikes: 12,
        totalCapacity: 20,
      },
    ];

    return mockStations;
  }

  async getTransitRoutes(
    origin: LocationType,
    destination: LocationType
  ): Promise<TransitRoute[]> {
    // Mock data - replace with actual Google Directions API call
    const mockRoutes: TransitRoute[] = [
      {
        id: 'route_1',
        summary: 'Bus 42 → Metro Line 1',
        duration: 25, // minutes
        distance: 8.5, // km
        fare: 2.50,
        legs: [
          {
            mode: 'walking',
            duration: 5,
            distance: 0.4,
            instructions: 'Walk to Bus Stop',
            startLocation: origin,
            endLocation: {
              latitude: origin.latitude + 0.003,
              longitude: origin.longitude + 0.002,
            },
          },
          {
            mode: 'bus',
            duration: 15,
            distance: 6.1,
            instructions: 'Take Bus 42 towards Downtown',
            startLocation: {
              latitude: origin.latitude + 0.003,
              longitude: origin.longitude + 0.002,
            },
            endLocation: {
              latitude: destination.latitude - 0.005,
              longitude: destination.longitude - 0.003,
            },
            routeColor: '#FF6B6B',
            routeName: 'Bus 42',
          },
          {
            mode: 'subway',
            duration: 8,
            distance: 2.0,
            instructions: 'Take Metro Line 1 to Central Station',
            startLocation: {
              latitude: destination.latitude - 0.005,
              longitude: destination.longitude - 0.003,
            },
            endLocation: destination,
            routeColor: '#4ECDC4',
            routeName: 'Metro Line 1',
          },
        ],
      },
    ];

    return mockRoutes;
  }

  calculateDistance(point1: LocationType, point2: LocationType): number {
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

  async reverseGeocode(location: LocationType): Promise<string> {
    try {
      const result = await Location.reverseGeocodeAsync(location);
      if (result && result.length > 0) {
        const address = result[0];
        return `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}`.trim();
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Unknown location';
    }
  }
}

export default LocationService; 