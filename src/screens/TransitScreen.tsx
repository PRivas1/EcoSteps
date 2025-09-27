import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

import { RootState, AppDispatch } from '../store';
import { RootStackParamList } from '../navigation/AppNavigator';
import LocationService from '../services/locationService';
import FirebaseService from '../services/firebaseService';

const { width, height } = Dimensions.get('window');

type TransitScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Transit'>;

interface LocationSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

interface RouteData {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: string; // encoded polyline
  coordinates: Array<[number, number]>; // decoded coordinates
}

const TransitScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<TransitScreenNavigationProp>();
  const userLocation = useSelector((state: RootState) => (state as any).location?.userLocation);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Location states
  const [startLocation, setStartLocation] = useState<{lat: number, lng: number} | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  // Search states
  const [startInput, setStartInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [startSuggestions, setStartSuggestions] = useState<LocationSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  // Route states
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Services
  const [locationService] = useState(() => LocationService.getInstance());
  const [firebaseService] = useState(() => FirebaseService.getInstance());

  useEffect(() => {
    initializeLocation();
  }, []);

  useEffect(() => {
    if (startLocation && destinationLocation) {
      fetchRoute();
    }
  }, [startLocation, destinationLocation]);

  const initializeLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation({ lat: location.latitude, lng: location.longitude });
        setMapRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  // Nominatim API for geocoding
  const searchLocation = async (query: string, isStart: boolean) => {
    if (query.length < 3) {
      if (isStart) {
        setStartSuggestions([]);
        setShowStartSuggestions(false);
      } else {
        setDestinationSuggestions([]);
        setShowDestinationSuggestions(false);
      }
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data: LocationSuggestion[] = await response.json();
      
      if (isStart) {
        setStartSuggestions(data);
        setShowStartSuggestions(true);
      } else {
        setDestinationSuggestions(data);
        setShowDestinationSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  const selectLocation = (suggestion: LocationSuggestion, isStart: boolean) => {
    const location = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    };

    if (isStart) {
      setStartLocation(location);
      setStartInput(suggestion.display_name);
      setShowStartSuggestions(false);
    } else {
      setDestinationLocation(location);
      setDestinationInput(suggestion.display_name);
      setShowDestinationSuggestions(false);
    }

    // Update map region to show both points
    if (startLocation || destinationLocation) {
      const otherLocation = isStart ? destinationLocation : startLocation;
      if (otherLocation) {
        const midLat = (location.lat + otherLocation.lat) / 2;
        const midLng = (location.lng + otherLocation.lng) / 2;
        const deltaLat = Math.abs(location.lat - otherLocation.lat) * 1.5;
        const deltaLng = Math.abs(location.lng - otherLocation.lng) * 1.5;

        setMapRegion({
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: Math.max(deltaLat, 0.01),
          longitudeDelta: Math.max(deltaLng, 0.01),
        });
      }
    }
  };

  // OSRM API for routing
  const fetchRoute = async () => {
    if (!startLocation || !destinationLocation) return;

    setIsLoadingRoute(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLocation.lng},${startLocation.lat};${destinationLocation.lng},${destinationLocation.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteData({
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry,
          coordinates: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert('Error', 'Failed to fetch route. Please try again.');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    if (!startLocation) {
      setStartLocation({ lat: latitude, lng: longitude });
      setStartInput(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    } else if (!destinationLocation) {
      setDestinationLocation({ lat: latitude, lng: longitude });
      setDestinationInput(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    } else {
      // Reset and set as new start location
      setStartLocation({ lat: latitude, lng: longitude });
      setDestinationLocation(null);
      setStartInput(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      setDestinationInput('');
      setRouteData(null);
    }
  };

  const clearLocations = () => {
    setStartLocation(null);
    setDestinationLocation(null);
    setStartInput('');
    setDestinationInput('');
    setRouteData(null);
    setShowStartSuggestions(false);
    setShowDestinationSuggestions(false);
  };

  const confirmTrip = async () => {
    if (!routeData || !currentUser) return;

    const distanceKm = routeData.distance / 1000;
    const points = Math.floor(distanceKm * 4); // 4 points per km for public transport

    try {
      // Save transit trip to Firebase
      const transitData = {
        userId: currentUser.uid,
        distance: distanceKm,
        duration: routeData.duration,
        points: points,
        startTime: new Date(),
        endTime: new Date(Date.now() + routeData.duration * 1000),
        startLocation: startLocation ? {
          latitude: startLocation.lat,
          longitude: startLocation.lng,
          address: startInput,
        } : undefined,
        endLocation: destinationLocation ? {
          latitude: destinationLocation.lat,
          longitude: destinationLocation.lng,
          address: destinationInput,
        } : undefined,
        routeType: 'bus' as const, // Default to bus for public transit
        transitMode: 'transit' as const,
      };

      await firebaseService.addTransitToHistory(transitData);
      console.log('Transit trip saved to Firebase');

    } catch (error) {
      console.error('Error saving transit trip:', error);
      // Continue to completion screen even if save fails
    }

    navigation.navigate('ActivityCompletion', {
      activityId: Date.now().toString(),
      mode: 'transit',
      distance: distanceKm,
      points: points,
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const renderSuggestionItem = ({ item, isStart }: { item: LocationSuggestion; isStart: boolean }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => selectLocation(item, isStart)}
    >
      <Ionicons name="location-outline" size={20} color="#4ECDC4" />
      <Text style={styles.suggestionText} numberOfLines={2}>
        {item.display_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Inputs */}
      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="radio-button-on" size={20} color="#27AE60" style={styles.inputIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter start location"
            value={startInput}
            onChangeText={(text) => {
              setStartInput(text);
              searchLocation(text, true);
            }}
            onFocus={() => setShowDestinationSuggestions(false)}
          />
          {startInput.length > 0 && (
            <TouchableOpacity onPress={() => {
              setStartInput('');
              setStartLocation(null);
              setStartSuggestions([]);
              setShowStartSuggestions(false);
            }}>
              <Ionicons name="close" size={20} color="#7F8C8D" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="location" size={20} color="#E74C3C" style={styles.inputIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter destination"
            value={destinationInput}
            onChangeText={(text) => {
              setDestinationInput(text);
              searchLocation(text, false);
            }}
            onFocus={() => setShowStartSuggestions(false)}
          />
          {destinationInput.length > 0 && (
            <TouchableOpacity onPress={() => {
              setDestinationInput('');
              setDestinationLocation(null);
              setDestinationSuggestions([]);
              setShowDestinationSuggestions(false);
            }}>
              <Ionicons name="close" size={20} color="#7F8C8D" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={clearLocations}>
          <Ionicons name="refresh" size={20} color="#4ECDC4" />
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Suggestions */}
      {showStartSuggestions && startSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={startSuggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => renderSuggestionItem({ item, isStart: true })}
            style={styles.suggestionsList}
          />
        </View>
      )}

      {showDestinationSuggestions && destinationSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={destinationSuggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => renderSuggestionItem({ item, isStart: false })}
            style={styles.suggestionsList}
          />
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={mapRegion}
          onPress={handleMapPress}
          provider={PROVIDER_DEFAULT}
          mapType="standard"
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {startLocation && (
            <Marker
              coordinate={{
                latitude: startLocation.lat,
                longitude: startLocation.lng,
              }}
              title="Start"
              pinColor="#27AE60"
            />
          )}
          
          {destinationLocation && (
            <Marker
              coordinate={{
                latitude: destinationLocation.lat,
                longitude: destinationLocation.lng,
              }}
              title="Destination"
              pinColor="#E74C3C"
            />
          )}

          {routeData && routeData.coordinates && (
            <Polyline
              coordinates={routeData.coordinates.map(([lat, lng]) => ({
                latitude: lat,
                longitude: lng,
              }))}
              strokeColor="#4ECDC4"
              strokeWidth={4}
              lineDashPattern={[5, 5]}
            />
          )}
        </MapView>

        {/* Loading indicator */}
        {isLoadingRoute && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4ECDC4" />
            <Text style={styles.loadingText}>Calculating route...</Text>
          </View>
        )}
      </View>

      {/* Route Info Panel */}
      {routeData && (
        <View style={styles.infoPanel}>
          <LinearGradient
            colors={['#4ECDC4', '#44A08D'] as const}
            style={styles.infoPanelGradient}
          >
            <View style={styles.routeInfo}>
              <View style={styles.routeStat}>
                <Ionicons name="speedometer-outline" size={24} color="#FFFFFF" />
                <Text style={styles.routeStatValue}>{formatDistance(routeData.distance)}</Text>
                <Text style={styles.routeStatLabel}>Distance</Text>
              </View>
              
              <View style={styles.routeStat}>
                <Ionicons name="time-outline" size={24} color="#FFFFFF" />
                <Text style={styles.routeStatValue}>{formatDuration(routeData.duration)}</Text>
                <Text style={styles.routeStatLabel}>Est. Time</Text>
              </View>
              
              <View style={styles.routeStat}>
                <Ionicons name="star-outline" size={24} color="#FFFFFF" />
                <Text style={styles.routeStatValue}>{Math.floor((routeData.distance / 1000) * 4)}</Text>
                <Text style={styles.routeStatLabel}>Points</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={confirmTrip}>
              <Text style={styles.confirmButtonText}>Confirm Trip</Text>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Instructions */}
      {!startLocation && !destinationLocation && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            🗺️ Tap on the map or search to set your start and destination
          </Text>
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  inputIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  clearButtonText: {
    marginLeft: 4,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
  infoPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoPanelGradient: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  routeStat: {
    alignItems: 'center',
  },
  routeStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  routeStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: '#2C3E50',
    textAlign: 'center',
  },
});

export default TransitScreen; 