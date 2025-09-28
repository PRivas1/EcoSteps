import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

import { RootState, AppDispatch } from '../store';
import { startActivity, addRoutePoint, stopActivity } from '../store/slices/activitySlice';
import { completeActivity } from '../store/slices/userSlice';
import { setUserLocation } from '../store/slices/locationSlice';
import LocationService from '../services/locationService';
import FirebaseService from '../services/firebaseService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Location, RoutePoint } from '../types';

type WalkScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Walk'>;

const { width, height } = Dimensions.get('window');

const WalkScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<WalkScreenNavigationProp>();

  const userProfile = useSelector((state: RootState) => state.user.profile);
  const userLocation = useSelector((state: RootState) => (state as any).location?.userLocation);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isLocationEnabled = useSelector((state: RootState) => (state as any).location?.isLocationEnabled || false);
  
  // Add Firebase profile state
  const [firebaseProfile, setFirebaseProfile] = useState<any>(null);

  const [locationService] = useState(() => LocationService.getInstance());
  const [firebaseService] = useState(() => FirebaseService.getInstance());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [routePoints, setRoutePoints] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Route tracking state
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [startLocation, setStartLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 39.9526, // Philadelphia coordinates
    longitude: -75.1652,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Load Firebase profile data
  useEffect(() => {
    const loadFirebaseProfile = async () => {
      if (!currentUser) return;
      
      try {
        await firebaseService.refreshUserStats(currentUser.uid);
        const profile = await firebaseService.getUserProfile(currentUser.uid);
        setFirebaseProfile(profile);
      } catch (error) {
        console.error('WalkScreen: Error loading profile:', error);
      }
    };
    
    loadFirebaseProfile();
  }, [currentUser, firebaseService]);

  // Timer effect for tracking time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const handleStartWalk = async () => {
    if (!isLocationEnabled) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permissions in your device settings to track your walk.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Request Permission',
            onPress: async () => {
              const granted = await locationService.requestPermissions();
              if (granted) {
                handleStartWalk();
              }
            }
          }
        ]
      );
      return;
    }

    try {
      setIsTracking(true);
      setTimeElapsed(0);
      setCurrentDistance(0);
      setRoutePoints(0);
      setRouteCoordinates([]);

      const currentLocation = await locationService.getCurrentLocation();
      if (currentLocation) {
        const locationCoord = { latitude: currentLocation.latitude, longitude: currentLocation.longitude };
        setStartLocation(locationCoord);
        setRouteCoordinates([locationCoord]);
        setMapRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        dispatch(setUserLocation(currentLocation));
        dispatch(startActivity({ mode: 'walk', startLocation: currentLocation }));
      }

      // Start location tracking
      locationService.startLocationTracking((location: Location) => {
        const newCoord = { latitude: location.latitude, longitude: location.longitude };
        
        dispatch(setUserLocation(location));
        dispatch(addRoutePoint({
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: Date.now(),
        }));
        
        // Add to route coordinates for map display
        setRouteCoordinates(prev => [...prev, newCoord]);
        setRoutePoints(prev => prev + 1);
        setCurrentDistance(prev => prev + 0.01);
      });

    } catch (error) {
      console.error('Error starting walk:', error);
      Alert.alert('Error', 'Failed to start tracking. Please try again.');
      setIsTracking(false);
    }
  };

  const handleStopWalk = async () => {
    if (!isTracking) return;

    try {
      setIsSyncing(true);
      setIsTracking(false);
      locationService.stopLocationTracking();

      const endLocation = await locationService.getCurrentLocation();
      const points = Math.floor(currentDistance * 10);

      dispatch(stopActivity({ endLocation: endLocation || undefined }));
      dispatch(completeActivity({ points, distance: currentDistance }));

            // Save directly to Firebase
      if (currentUser && currentDistance > 0) {
        const walkData = {
          userId: currentUser.uid,
          distance: currentDistance,
          duration: timeElapsed,
          points,
          startTime: new Date(Date.now() - timeElapsed * 1000),
          endTime: new Date(),
          startLocation: userLocation || undefined,
          endLocation: endLocation || undefined,
          route: routeCoordinates.map((coord, index) => ({
            latitude: coord.latitude,
            longitude: coord.longitude,
            timestamp: Date.now() - (routeCoordinates.length - index) * 1000, // Approximate timestamps
          })),
        };

        try {
          // Save directly to Firebase
          const walkId = await firebaseService.addWalkToHistory(walkData);
          console.log('Walk saved to Firebase with ID:', walkId);

          // Refresh Firebase profile after activity completion
          try {
            await firebaseService.refreshUserStats(currentUser.uid);
            const updatedProfile = await firebaseService.getUserProfile(currentUser.uid);
            setFirebaseProfile(updatedProfile);
          } catch (profileError) {
            console.error('Error refreshing profile after walk:', profileError);
          }
          
        } catch (firebaseError) {
          console.error('Error saving walk to Firebase:', firebaseError);
          Alert.alert(
            'Save Error',
            'Failed to save walk data to cloud. Please try again.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      navigation.navigate('ActivityCompletion', {
        activityId: Date.now().toString(),
        mode: 'walk',
        distance: currentDistance,
        points,
      });

    } catch (error) {
      console.error('Error stopping walk:', error);
      Alert.alert('Error', 'Failed to complete walk. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const insets = useSafeAreaInsets();

  const renderLocationStatus = () => {
    if (!isLocationEnabled) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>⚠️ Location permission required</Text>
        </View>
      );
    }

    if (userLocation) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>✅ Location ready</Text>
        </View>
      );
    }

    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>📍 Getting location...</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={false}
            followsUserLocation={isTracking}
            toolbarEnabled={false}
          >
            {/* Start Location Marker */}
            {startLocation && (
              <Marker
                coordinate={startLocation}
                title="Start"
                description="Walking started here"
                pinColor="green"
              />
            )}

            {/* Current Location Marker */}
            {userLocation && isTracking && (
              <Marker
                coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                title="Current Position"
                description="You are here"
                pinColor="blue"
              />
            )}

            {/* Route Path */}
            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#4ECDC4"
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapView>

          {/* Overlay Status Information */}
          <View style={styles.mapOverlay}>
            <View style={styles.statusContainer}>
              <Text style={styles.statusTitle}>GPS Tracking {isTracking ? 'Active' : 'Ready'}</Text>
              {renderLocationStatus()}
              {routePoints > 0 && (
                <Text style={styles.routeText}>📍 {routePoints} GPS points recorded</Text>
              )}
                                    {isSyncing && (
                        <Text style={styles.syncText}>☁️ Saving to cloud...</Text>
                      )}
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentDistance.toFixed(2)} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.floor(currentDistance * 10)}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        <View style={styles.controlContainer}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              isTracking && styles.stopButton,
              isSyncing && styles.disabledButton
            ]}
            onPress={isTracking ? handleStopWalk : handleStartWalk}
            disabled={isSyncing}
          >
            <LinearGradient
              colors={isTracking ? ['#E74C3C', '#C0392B'] as const : ['#4ECDC4', '#44A08D'] as const}
              style={styles.buttonGradient}
            >
              <Ionicons
                name={isTracking ? 'stop' : 'play'}
                size={32}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
                                    <Text style={styles.buttonText}>
                        {isSyncing ? 'Saving to Cloud...' : isTracking ? 'Stop Walk' : 'Start Walk'}
                      </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.userStats}>
          <Text style={styles.userStatsTitle}>Your Progress</Text>
          <Text style={styles.userStatsText}>
            Total Points: {(firebaseProfile || userProfile)?.totalPoints || 0} | Level: {(firebaseProfile || userProfile)?.level || 1}
          </Text>
          <Text style={styles.userStatsText}>
            Activities: {(firebaseProfile || userProfile)?.activitiesCompleted || 0} | Distance: {((firebaseProfile || userProfile)?.totalDistance || 0).toFixed(2)} km
          </Text>
        </View>

        {/* Add some extra padding at the bottom for better scrolling */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  mapContainer: {
    height: 300,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mapPlaceholder: {
    height: '100%',
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContent: {
    alignItems: 'center',
    padding: 20,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 15,
    marginBottom: 10,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  routeInfo: {
    marginTop: 15,
    padding: 10,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 10,
  },
  routeText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  statusContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#2C3E50',
    textAlign: 'center',
  },
  syncStatus: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 8,
  },
  syncText: {
    fontSize: 12,
    color: '#3498DB',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 5,
  },
  controlContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  controlButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  stopButton: {
    // Different styling for stop button if needed
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userStats: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  userStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  userStatsText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  bottomPadding: {
    height: 30,
  },
  map: {
    flex: 1,
    borderRadius: 15,
  },
  mapOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 10,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 5,
  },
});

export default WalkScreen; 