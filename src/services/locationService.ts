import * as Location from 'expo-location';
import { Location as LocationType, CycleStation, TransitRoute } from '../types';
import { Alert, Platform } from 'react-native';

class LocationService {
  private static instance: LocationService;
  private watchSubscription: Location.LocationSubscription | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Silent permission check for startup
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  // Request permissions with user interaction
  async requestPermissions(silent: boolean = false): Promise<boolean> {
    try {
      // Check if we're in a simulator
      const isSimulator = Platform.OS === 'ios' && !__DEV__;
      
      // First check current permissions
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return true;
      }

      // If silent, don't request - just return current status
      if (silent) {
        return false;
      }

      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        return true;
      } else if (status === 'denied') {
        Alert.alert(
          'Location Permission Required',
          'EcoSteps needs location access to track your eco-friendly activities. Please enable location permissions in your device settings.',
          [
            { text: 'OK', style: 'default' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  // iOS doesn't allow direct opening to app settings
                  Alert.alert('Please open Settings app and enable location for EcoSteps');
                } else {
                  // For Android, you could use Linking.openSettings()
                }
              }
            }
          ]
        );
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      if (!silent) {
        Alert.alert(
          'Permission Error',
          'There was an error requesting location permissions. Please try again or enable permissions manually in settings.'
        );
      }
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationType | null> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted, requesting...');
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          return this.getMockLocation(); // Return mock location for testing
        }
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
      
      // If we're in development/simulator, provide a mock location
      if (__DEV__) {
        console.log('Using mock location for development');
        return this.getMockLocation();
      }
      
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Make sure location services are enabled and try again.',
        [{ text: 'OK' }]
      );
      return null;
    }
  }

  private getMockLocation(): LocationType {
    // San Francisco coordinates for development/testing
    return {
      latitude: 37.7749,
      longitude: -122.4194,
    };
  }

  async startLocationTracking(callback: (location: LocationType) => void): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        // For testing, still start with mock location
        if (__DEV__) {
          console.log('Starting location tracking with mock data for development');
          this.startMockLocationTracking(callback);
          return true;
        }
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
      
      // For development, provide mock tracking
      if (__DEV__) {
        console.log('Starting mock location tracking for development');
        this.startMockLocationTracking(callback);
        return true;
      }
      
      return false;
    }
  }

  private startMockLocationTracking(callback: (location: LocationType) => void): void {
    // Simulate movement for testing
    let mockLat = 37.7749;
    let mockLng = -122.4194;
    
    const interval = setInterval(() => {
      // Simulate small movements
      mockLat += (Math.random() - 0.5) * 0.001;
      mockLng += (Math.random() - 0.5) * 0.001;
      
      callback({
        latitude: mockLat,
        longitude: mockLng,
      });
    }, 2000); // Update every 2 seconds for testing

    // Store interval reference for cleanup
    this.watchSubscription = {
      remove: () => clearInterval(interval)
    } as Location.LocationSubscription;
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
      return 'Mock Location, San Francisco, CA';
    }
  }
}

export default LocationService; 