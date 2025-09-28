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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import IndegoService, { IndegoStation } from '../services/indegoService';
import PaymentScreen from '../components/PaymentScreen';

const { width, height } = Dimensions.get('window');

type CycleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cycle'>;

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

const CycleScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<CycleScreenNavigationProp>();
  const userLocation = useSelector((state: RootState) => (state as any).location?.userLocation);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const insets = useSafeAreaInsets();

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
    latitude: 39.9526, // Philadelphia coordinates
    longitude: -75.1652,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Indego stations states
  const [nearbyStartStations, setNearbyStartStations] = useState<IndegoStation[]>([]);
  const [nearbyEndStations, setNearbyEndStations] = useState<IndegoStation[]>([]);
  const [allStations, setAllStations] = useState<IndegoStation[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(false);

  // Payment screen state
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);

  // Services
  const [locationService] = useState(() => LocationService.getInstance());
  const [firebaseService] = useState(() => FirebaseService.getInstance());
  const [indegoService] = useState(() => IndegoService.getInstance());

  useEffect(() => {
    initializeLocation();
    loadAllStations();
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

  const loadAllStations = async () => {
    try {
      const stations = await indegoService.getAllStations();
      setAllStations(stations);
      console.log(`Loaded ${stations.length} Indego stations`);
    } catch (error) {
      console.error('Error loading Indego stations:', error);
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&bounded=1&viewbox=-75.280303,39.867005,-74.955763,40.137993`
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

  // Snap location to nearest Indego station
  const snapToNearestStation = async (lat: number, lng: number, isStart: boolean) => {
    setIsLoadingStations(true);
    try {
      const stations = await indegoService.findNearestStations(lat, lng, 5);
      
      if (stations.length > 0) {
        const nearestStation = stations[0];
        const snappedLocation = { lat: nearestStation.latitude, lng: nearestStation.longitude };
        
        if (isStart) {
          setStartLocation(snappedLocation);
          setStartInput(nearestStation.name);
          setNearbyStartStations(stations);
        } else {
          setDestinationLocation(snappedLocation);
          setDestinationInput(nearestStation.name);
          setNearbyEndStations(stations);
        }

        console.log(`Snapped to Indego station: ${nearestStation.name} (${nearestStation.distance?.toFixed(0)}m away)`);
        
        // Update map region to show the snapped location
        setMapRegion({
          latitude: nearestStation.latitude,
          longitude: nearestStation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        return snappedLocation;
      } else {
        // No stations found, use original location
        const location = { lat, lng };
        if (isStart) {
          setStartLocation(location);
          setStartInput(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } else {
          setDestinationLocation(location);
          setDestinationInput(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        
        Alert.alert(
          'No Indego Stations Found',
          'No bike share stations found nearby. Using your selected location instead.',
          [{ text: 'OK' }]
        );
        
        return location;
      }
    } catch (error) {
      console.error('Error snapping to Indego station:', error);
      Alert.alert('Error', 'Failed to find nearby bike stations. Please try again.');
      return null;
    } finally {
      setIsLoadingStations(false);
    }
  };

  const selectLocation = async (suggestion: LocationSuggestion, isStart: boolean) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    // Hide suggestions first
    if (isStart) {
      setShowStartSuggestions(false);
    } else {
      setShowDestinationSuggestions(false);
    }

    // Snap the selected location to nearest Indego station
    const snappedLocation = await snapToNearestStation(lat, lng, isStart);
    
    if (snappedLocation && startLocation && destinationLocation) {
      // Update map region to show both points
      const otherLocation = isStart ? destinationLocation : startLocation;
      if (otherLocation) {
        const midLat = (snappedLocation.lat + otherLocation.lat) / 2;
        const midLng = (snappedLocation.lng + otherLocation.lng) / 2;
        const deltaLat = Math.abs(snappedLocation.lat - otherLocation.lat) * 1.5;
        const deltaLng = Math.abs(snappedLocation.lng - otherLocation.lng) * 1.5;

        setMapRegion({
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: Math.max(deltaLat, 0.01),
          longitudeDelta: Math.max(deltaLng, 0.01),
        });
      }
    }
  };

  // OSRM API for cycling routing
  const fetchRoute = async () => {
    if (!startLocation || !destinationLocation) return;

    setIsLoadingRoute(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/cycling/${startLocation.lng},${startLocation.lat};${destinationLocation.lng},${destinationLocation.lat}?overview=full&geometries=geojson`
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
      console.error('Error fetching cycling route:', error);
      Alert.alert('Error', 'Failed to fetch cycling route. Please try again.');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    if (!startLocation) {
      // Snap to nearest Indego station for start location
      await snapToNearestStation(latitude, longitude, true);
    } else if (!destinationLocation) {
      // Snap to nearest Indego station for destination
      await snapToNearestStation(latitude, longitude, false);
    } else {
      // Reset and set as new start location
      setDestinationLocation(null);
      setDestinationInput('');
      setRouteData(null);
      setNearbyEndStations([]);
      await snapToNearestStation(latitude, longitude, true);
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
    setNearbyStartStations([]);
    setNearbyEndStations([]);
  };

  const confirmTrip = async () => {
    if (!routeData || !currentUser) return;
    
    // Show payment screen instead of directly completing the trip
    setShowPaymentScreen(true);
  };

  const handlePaymentSuccess = async () => {
    if (!routeData || !currentUser) return;

    const distanceKm = routeData.distance / 1000;
    const points = Math.floor(distanceKm * 8); // 8 points per km for cycling

    try {
      // Calculate payment information
      const pricePerKm = 2.50;
      const totalAmount = distanceKm * pricePerKm;
      
      // Save cycling trip to Firebase with payment information
      const cyclingData = {
        userId: currentUser.uid,
        distance: distanceKm,
        duration: routeData.duration,
        points: points,
        startTime: new Date(),
        endTime: new Date(Date.now() + routeData.duration * 1000),
        startStation: nearbyStartStations[0] ? {
          id: nearbyStartStations[0].id,
          name: nearbyStartStations[0].name,
          latitude: nearbyStartStations[0].latitude,
          longitude: nearbyStartStations[0].longitude,
          address: nearbyStartStations[0].address,
        } : undefined,
        endStation: nearbyEndStations[0] ? {
          id: nearbyEndStations[0].id,
          name: nearbyEndStations[0].name,
          latitude: nearbyEndStations[0].latitude,
          longitude: nearbyEndStations[0].longitude,
          address: nearbyEndStations[0].address,
        } : undefined,
        bikeShareSystem: 'indego' as const,
        cyclingMode: 'cycling' as const,
        payment: {
          amount: totalAmount,
          pricePerKm: pricePerKm,
          currency: 'USD',
          paymentMethod: 'Credit Card',
          transactionId: `CYC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          paidAt: new Date(),
        },
      };

      await firebaseService.addCyclingToHistory(cyclingData);
      console.log('Cycling trip saved to Firebase');

    } catch (error) {
      console.error('Error saving cycling trip:', error);
      // Continue to completion screen even if save fails
    }

    // Close payment screen and navigate to completion
    setShowPaymentScreen(false);
    navigation.navigate('ActivityCompletion', {
      activityId: Date.now().toString(),
      mode: 'cycle',
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
      <Ionicons name="location-outline" size={20} color="#FFD93D" />
      <Text style={styles.suggestionText} numberOfLines={2}>
        {item.display_name}
      </Text>
    </TouchableOpacity>
  );

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
          <Ionicons name="refresh" size={20} color="#FFD93D" />
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
          {/* All Indego Stations */}
          {allStations.map((station) => (
            <Marker
              key={station.id}
              coordinate={{
                latitude: station.latitude,
                longitude: station.longitude,
              }}
              title={station.name}
              description={`${station.totalDocks} docks • ${station.address}`}
              pinColor="#FFD93D"
              onPress={() => {
                if (!startLocation) {
                  setStartLocation({ lat: station.latitude, lng: station.longitude });
                  setStartInput(station.name);
                  setNearbyStartStations([station]);
                } else if (!destinationLocation) {
                  setDestinationLocation({ lat: station.latitude, lng: station.longitude });
                  setDestinationInput(station.name);
                  setNearbyEndStations([station]);
                }
              }}
            />
          ))}

          {/* Selected Start Station */}
          {startLocation && nearbyStartStations[0] && (
            <Marker
              coordinate={{
                latitude: startLocation.lat,
                longitude: startLocation.lng,
              }}
              title="Start Station"
              description={startInput}
              pinColor="#27AE60"
            />
          )}
          
          {/* Selected Destination Station */}
          {destinationLocation && nearbyEndStations[0] && (
            <Marker
              coordinate={{
                latitude: destinationLocation.lat,
                longitude: destinationLocation.lng,
              }}
              title="Destination Station"
              description={destinationInput}
              pinColor="#E74C3C"
            />
          )}

          {/* Route Polyline */}
          {routeData && routeData.coordinates && (
            <Polyline
              coordinates={routeData.coordinates.map(([lat, lng]) => ({
                latitude: lat,
                longitude: lng,
              }))}
              strokeColor="#FFD93D"
              strokeWidth={4}
              lineDashPattern={[10, 5]}
            />
          )}
        </MapView>

        {/* Loading indicators */}
        {(isLoadingRoute || isLoadingStations) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFD93D" />
            <Text style={styles.loadingText}>
              {isLoadingStations ? 'Finding bike stations...' : 'Calculating route...'}
            </Text>
          </View>
        )}
      </View>

      {/* Route Info Panel */}
      {routeData && (
        <View style={styles.infoPanel}>
          <LinearGradient
            colors={['#FFD93D', '#FF8C94'] as const}
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
                <Text style={styles.routeStatValue}>{Math.floor((routeData.distance / 1000) * 8)}</Text>
                <Text style={styles.routeStatLabel}>Points</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={confirmTrip}>
              <Text style={styles.confirmButtonText}>Confirm Bike Trip</Text>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Instructions */}
      {!startLocation && !destinationLocation && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            🚲 Tap on any Indego station or search to plan your bike trip
          </Text>
          <Text style={styles.instructionsSubtext}>
            Locations will automatically snap to nearby bike share stations
          </Text>
        </View>
      )}

      {/* Station Info */}
      {(nearbyStartStations.length > 0 || nearbyEndStations.length > 0) && (
        <View style={styles.stationInfoContainer}>
          <Text style={styles.stationInfoText}>
            🎯 Snapped to Indego stations • All stations shown on map
          </Text>
        </View>
      )}

      {/* Payment Screen */}
      <PaymentScreen
        visible={showPaymentScreen}
        onClose={() => setShowPaymentScreen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        tripType="cycling"
        distance={routeData ? routeData.distance / 1000 : 0}
        duration={routeData ? routeData.duration : 0}
        startLocation={nearbyStartStations[0]?.name}
        endLocation={nearbyEndStations[0]?.name}
      />
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
    color: '#FFD93D',
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
    marginBottom: 4,
  },
  instructionsSubtext: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  stationInfoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 217, 61, 0.9)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  stationInfoText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default CycleScreen; 