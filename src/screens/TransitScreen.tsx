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
import PaymentScreen from '../components/PaymentScreen';

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

interface TransitStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'subway' | 'train' | 'bus' | 'tram' | 'metro';
  distance?: number; // distance from selected point in meters
}

const TransitScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<TransitScreenNavigationProp>();
  const userLocation = useSelector((state: RootState) => (state as any).location?.userLocation);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const insets = useSafeAreaInsets();
  
  // Redeemed rewards state
  const [redeemedTransportRewards, setRedeemedTransportRewards] = useState<any[]>([]);

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

  // Transit stops states
  const [nearbyStartStops, setNearbyStartStops] = useState<TransitStop[]>([]);
  const [nearbyEndStops, setNearbyEndStops] = useState<TransitStop[]>([]);
  const [isLoadingStops, setIsLoadingStops] = useState(false);

  // Payment screen state
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);

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

  // Load redeemed transport rewards
  useEffect(() => {
    const loadRedeemedRewards = async () => {
      if (!currentUser) return;
      
      try {
        const rewards = await firebaseService.getUserRedeemedRewards(currentUser.uid);
        // Filter for transport category rewards that haven't been used for discount yet
        const transportRewards = rewards.filter(reward => 
          reward.category === 'transport' && !reward.usedForDiscount
        );
        setRedeemedTransportRewards(transportRewards);
      } catch (error) {
        console.error('Error loading redeemed transport rewards:', error);
      }
    };
    
    loadRedeemedRewards();
  }, [currentUser, firebaseService]);

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

  const selectLocation = async (suggestion: LocationSuggestion, isStart: boolean) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    // Hide suggestions first
    if (isStart) {
      setShowStartSuggestions(false);
    } else {
      setShowDestinationSuggestions(false);
    }

    // Snap the selected location to nearest transit stop
    const snappedLocation = await snapToNearestStop(lat, lng, isStart);
    
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

  // Find nearby transit stops using Overpass API
  const findNearbyTransitStops = async (lat: number, lng: number, radius: number = 1000): Promise<TransitStop[]> => {
    try {
      // Overpass API query for public transport stops
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["public_transport"="stop_position"](around:${radius},${lat},${lng});
          node["railway"="station"](around:${radius},${lat},${lng});
          node["railway"="subway_entrance"](around:${radius},${lat},${lng});
          node["highway"="bus_stop"](around:${radius},${lat},${lng});
        );
        out geom;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      const data = await response.json();
      
      if (!data.elements) {
        return [];
      }

      const stops: TransitStop[] = data.elements.map((element: any) => {
        const name = element.tags?.name || element.tags?.ref || 'Transit Stop';
        let type: TransitStop['type'] = 'bus'; // default
        
        // Determine stop type based on tags
        if (element.tags?.railway === 'station') {
          type = 'train';
        } else if (element.tags?.railway === 'subway_entrance' || element.tags?.station === 'subway') {
          type = 'subway';
        } else if (element.tags?.highway === 'bus_stop') {
          type = 'bus';
        } else if (element.tags?.railway === 'tram_stop') {
          type = 'tram';
        }

        // Calculate distance from selected point
        const distance = calculateDistance(lat, lng, element.lat, element.lon);

        return {
          id: element.id.toString(),
          name,
          lat: element.lat,
          lng: element.lon,
          type,
          distance,
        };
      });

      // Sort by distance and return closest 5
      return stops
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 5);

    } catch (error) {
      console.error('Error finding transit stops:', error);
      return [];
    }
  };

  // Calculate distance between two points in meters
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Snap location to nearest transit stop
  const snapToNearestStop = async (lat: number, lng: number, isStart: boolean) => {
    setIsLoadingStops(true);
    try {
      const stops = await findNearbyTransitStops(lat, lng);
      
      if (stops.length > 0) {
        const nearestStop = stops[0];
        const snappedLocation = { lat: nearestStop.lat, lng: nearestStop.lng };
        
        if (isStart) {
          setStartLocation(snappedLocation);
          setStartInput(nearestStop.name);
          setNearbyStartStops(stops);
        } else {
          setDestinationLocation(snappedLocation);
          setDestinationInput(nearestStop.name);
          setNearbyEndStops(stops);
        }

        console.log(`Snapped to ${nearestStop.type} stop: ${nearestStop.name} (${nearestStop.distance?.toFixed(0)}m away)`);
        
        // Update map region to show the snapped location
        setMapRegion({
          latitude: nearestStop.lat,
          longitude: nearestStop.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        return snappedLocation;
      } else {
        // No transit stops found, use original location
        const location = { lat, lng };
        if (isStart) {
          setStartLocation(location);
          setStartInput(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } else {
          setDestinationLocation(location);
          setDestinationInput(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        
        Alert.alert(
          'No Transit Stops Found',
          'No public transit stops found nearby. Using your selected location instead.',
          [{ text: 'OK' }]
        );
        
        return location;
      }
    } catch (error) {
      console.error('Error snapping to transit stop:', error);
      Alert.alert('Error', 'Failed to find nearby transit stops. Please try again.');
      return null;
    } finally {
      setIsLoadingStops(false);
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

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    if (!startLocation) {
      // Snap to nearest transit stop for start location
      await snapToNearestStop(latitude, longitude, true);
    } else if (!destinationLocation) {
      // Snap to nearest transit stop for destination
      await snapToNearestStop(latitude, longitude, false);
    } else {
      // Reset and set as new start location
      setDestinationLocation(null);
      setDestinationInput('');
      setRouteData(null);
      setNearbyEndStops([]);
      await snapToNearestStop(latitude, longitude, true);
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
    setNearbyStartStops([]);
    setNearbyEndStops([]);
  };

  const confirmTrip = async () => {
    if (!routeData || !currentUser) return;
    
    // Show payment screen instead of directly completing the trip
    setShowPaymentScreen(true);
  };

  const handlePaymentSuccess = async () => {
    if (!routeData || !currentUser) return;

    const distanceKm = routeData.distance / 1000;
    const points = Math.floor(distanceKm * 4); // 4 points per km for public transport

    try {
      // Calculate payment information
      const pricePerKm = 1.80;
      const totalAmount = distanceKm * pricePerKm;
      
      // Save transit trip to Firebase with payment information
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
        routeType: nearbyStartStops[0]?.type || 'bus', // Use the type of the selected transit stop
        transitMode: 'transit' as const,
        payment: {
          amount: totalAmount,
          pricePerKm: pricePerKm,
          currency: 'USD',
          paymentMethod: 'Credit Card',
          transactionId: `TRN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          paidAt: new Date(),
        },
      };

      await firebaseService.addTransitToHistory(transitData);
      console.log('Transit trip saved to Firebase');

      // Mark reward as used for discount if one was applied
      if (redeemedTransportRewards.length > 0) {
        try {
          await firebaseService.markRewardUsedForDiscount(
            currentUser.uid, 
            redeemedTransportRewards[0].id
          );
          console.log('Marked transport reward as used for discount');
          
          // Refresh the redeemed rewards list to remove used reward
          const rewards = await firebaseService.getUserRedeemedRewards(currentUser.uid);
          const transportRewards = rewards.filter(reward => 
            reward.category === 'transport' && !reward.usedForDiscount
          );
          setRedeemedTransportRewards(transportRewards);
        } catch (rewardError) {
          console.error('Error marking reward as used:', rewardError);
          // Don't fail the entire flow if reward marking fails
        }
      }

    } catch (error) {
      console.error('Error saving transit trip:', error);
      // Continue to completion screen even if save fails
    }

    // Close payment screen and navigate to completion
    setShowPaymentScreen(false);
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
          {/* Start Location - Transit Stop */}
          {startLocation && (
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
          
          {/* Destination Location - Transit Stop */}
          {destinationLocation && (
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

          {/* Nearby Start Stops (alternative options) */}
          {nearbyStartStops.slice(1).map((stop) => (
            <Marker
              key={`start-${stop.id}`}
              coordinate={{
                latitude: stop.lat,
                longitude: stop.lng,
              }}
              title={stop.name}
              description={`${stop.type} • ${stop.distance?.toFixed(0)}m away`}
              pinColor="#A8E6CF"
              onPress={() => {
                setStartLocation({ lat: stop.lat, lng: stop.lng });
                setStartInput(stop.name);
              }}
            />
          ))}

          {/* Nearby End Stops (alternative options) */}
          {nearbyEndStops.slice(1).map((stop) => (
            <Marker
              key={`end-${stop.id}`}
              coordinate={{
                latitude: stop.lat,
                longitude: stop.lng,
              }}
              title={stop.name}
              description={`${stop.type} • ${stop.distance?.toFixed(0)}m away`}
              pinColor="#FFB6C1"
              onPress={() => {
                setDestinationLocation({ lat: stop.lat, lng: stop.lng });
                setDestinationInput(stop.name);
              }}
            />
          ))}

          {/* Route Polyline */}
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

        {/* Loading indicators */}
        {(isLoadingRoute || isLoadingStops) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4ECDC4" />
            <Text style={styles.loadingText}>
              {isLoadingStops ? 'Finding transit stops...' : 'Calculating route...'}
            </Text>
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
            🚏 Tap on the map or search to find your nearest transit stops
          </Text>
          <Text style={styles.instructionsSubtext}>
            Locations will automatically snap to nearby bus/train/subway stations
          </Text>
        </View>
      )}

      {/* Transit Stop Info */}
      {(nearbyStartStops.length > 0 || nearbyEndStops.length > 0) && (
        <View style={styles.transitInfoContainer}>
          <Text style={styles.transitInfoText}>
            🎯 Snapped to nearest transit stops • Tap other markers to switch
          </Text>
        </View>
      )}

      {/* Payment Screen */}
      <PaymentScreen
        visible={showPaymentScreen}
        onClose={() => setShowPaymentScreen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        tripType="transit"
        distance={routeData ? routeData.distance / 1000 : 0}
        duration={routeData ? routeData.duration : 0}
        startLocation={startInput}
        endLocation={destinationInput}
        routeType={nearbyStartStops[0]?.type || 'bus'}
        discount={redeemedTransportRewards.length > 0 ? {
          percentage: 10, // 10% discount for transport rewards
          rewardTitle: redeemedTransportRewards[0].title || '10% Off Public Transport'
        } : undefined}
      />
    </View>
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
    marginBottom: 4,
  },
  instructionsSubtext: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  transitInfoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(76, 217, 196, 0.9)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  transitInfoText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default TransitScreen; 