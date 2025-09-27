import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';

import { RootState } from '../store';
import { startActivity, addRoutePoint, stopActivity } from '../store/slices/activitySlice';
import { completeActivity } from '../store/slices/userSlice';
import { setUserLocation } from '../store/slices/locationSlice';
import LocationService from '../services/locationService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Location, RoutePoint } from '../types';

type WalkScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const WalkScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<WalkScreenNavigationProp>();
  
  // Temporarily simplified selectors
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const userLocation = useSelector((state: RootState) => state.location.userLocation);
  
  const [locationService] = useState(() => LocationService.getInstance());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [routePoints, setRoutePoints] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  useEffect(() => {
    initializeLocation();
    return () => {
      locationService.stopLocationTracking();
    };
  }, []);

  const initializeLocation = async () => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      dispatch(setUserLocation(location));
    }
  };

  const handleStartWalk = async () => {
    const hasPermission = await locationService.requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Location permission is required to track your walk.');
      return;
    }

    const location = await locationService.getCurrentLocation();
    if (!location) {
      Alert.alert('Location Error', 'Unable to get your current location.');
      return;
    }

    dispatch(startActivity({ mode: 'walk', startLocation: location }));
    dispatch(setUserLocation(location));
    setIsTracking(true);
    setTimeElapsed(0);
    setCurrentDistance(0);
    setRoutePoints(0);

    // Start tracking location
    locationService.startLocationTracking((newLocation: Location) => {
      dispatch(setUserLocation(newLocation));
      const routePoint: RoutePoint = {
        ...newLocation,
        timestamp: Date.now(),
      };
      dispatch(addRoutePoint(routePoint));
      setRoutePoints(prev => prev + 1);
      
      // Simulate distance calculation
      setCurrentDistance(prev => prev + 0.01); // Add ~10m per update
    });
  };

  const handleStopWalk = async () => {
    locationService.stopLocationTracking();
    setIsTracking(false);
    
    const location = await locationService.getCurrentLocation();
    dispatch(stopActivity({ endLocation: location || undefined }));

    const points = Math.round(currentDistance * 10); // 10 points per km
    
    // Update user profile
    dispatch(completeActivity({
      distance: currentDistance,
      points: points,
    }));

    // Navigate to completion screen
    navigation.navigate('ActivityCompletion', {
      activityId: Date.now().toString(),
      mode: 'walk',
      distance: currentDistance,
      points: points,
    });
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateSpeed = (): number => {
    if (timeElapsed === 0) return 0;
    return (currentDistance / (timeElapsed / 3600)); // km/h
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapContent}>
            <Ionicons name="location" size={64} color="#4ECDC4" />
            <Text style={styles.mapTitle}>GPS Tracking {isTracking ? 'Active' : 'Ready'}</Text>
            <Text style={styles.mapSubtitle}>
              {userLocation 
                ? `Lat: ${userLocation.latitude.toFixed(6)}\nLng: ${userLocation.longitude.toFixed(6)}`
                : 'Getting location...'
              }
            </Text>
            {routePoints > 0 && (
              <View style={styles.routeInfo}>
                <Text style={styles.routeText}>
                  📍 {routePoints} GPS points recorded
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Stats Overlay */}
      <View style={styles.statsOverlay}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {currentDistance.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Distance (km)</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{calculateSpeed().toFixed(1)}</Text>
            <Text style={styles.statLabel}>Speed (km/h)</Text>
          </View>
        </View>
      </View>

      {/* Control Button */}
      <View style={styles.controlContainer}>
        {!isTracking ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStartWalk}>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D'] as const}
              style={styles.buttonGradient}
            >
              <Ionicons name="play" size={32} color="#FFFFFF" />
              <Text style={styles.buttonText}>Start Walking</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.trackingControls}>
            <TouchableOpacity style={styles.stopButton} onPress={handleStopWalk}>
              <LinearGradient
                colors={['#FF6B6B', '#EE5A52'] as const}
                style={styles.buttonGradient}
              >
                <Ionicons name="stop" size={32} color="#FFFFFF" />
                <Text style={styles.buttonText}>Stop Walking</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.pointsIndicator}>
              <Text style={styles.pointsText}>
                {Math.round(currentDistance * 10)} points earned
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Status Indicator */}
      {isTracking && (
        <View style={styles.statusIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.statusText}>Recording</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mapContainer: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContent: {
    alignItems: 'center',
    padding: 20,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  routeInfo: {
    marginTop: 20,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  routeText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  statsOverlay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  controlContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  stopButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  trackingControls: {
    alignItems: 'center',
  },
  pointsIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  statusIndicator: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default WalkScreen; 