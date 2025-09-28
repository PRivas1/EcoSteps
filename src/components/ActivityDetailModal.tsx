import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

interface ActivityDetailModalProps {
  visible: boolean;
  onClose: () => void;
  activity: {
    id?: string;
    type: 'walk' | 'transit' | 'cycling';
    distance: number;
    duration: number;
    points: number;
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    startLocation?: { latitude: number; longitude: number; address?: string };
    endLocation?: { latitude: number; longitude: number; address?: string };
    route?: Array<{ latitude: number; longitude: number; timestamp?: number }>;
    // Transit specific
    routeType?: 'bus' | 'train' | 'subway' | 'tram' | 'metro';
    // Cycling specific
    startStation?: { id: string; name: string; latitude: number; longitude: number; address: string };
    endStation?: { id: string; name: string; latitude: number; longitude: number; address: string };
    bikeShareSystem?: 'indego';
    // Payment information
    payment?: {
      amount: number;
      pricePerKm: number;
      currency: string;
      paymentMethod: string;
      transactionId: string;
      paidAt: Date;
    };
  } | null;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  visible,
  onClose,
  activity,
}) => {
  if (!activity) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getActivityTitle = () => {
    switch (activity.type) {
      case 'walk':
        return 'Walking Activity';
      case 'cycling':
        return 'Cycling Activity';
      case 'transit':
        return `Public Transit (${activity.routeType || 'transit'})`;
      default:
        return 'Activity';
    }
  };

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'walk':
        return 'walk';
      case 'cycling':
        return 'bicycle';
      case 'transit':
        return 'bus';
      default:
        return 'fitness';
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case 'walk':
        return ['#4ECDC4', '#44A08D'];
      case 'cycling':
        return ['#FFD93D', '#FF8C94'];
      case 'transit':
        return ['#FFABAB', '#FFC3A0'];
      default:
        return ['#95A5A6', '#7F8C8D'];
    }
  };

  // Calculate map region based on activity locations
  const getMapRegion = () => {
    const { startLocation, endLocation, route } = activity;
    
    let minLat = 39.9526; // Default to Philadelphia
    let maxLat = 39.9526;
    let minLng = -75.1652;
    let maxLng = -75.1652;
    
    const locations = [];
    if (startLocation) locations.push(startLocation);
    if (endLocation) locations.push(endLocation);
    if (route && route.length > 0) locations.push(...route);
    
    if (locations.length > 0) {
      minLat = Math.min(...locations.map(loc => loc.latitude));
      maxLat = Math.max(...locations.map(loc => loc.latitude));
      minLng = Math.min(...locations.map(loc => loc.longitude));
      maxLng = Math.max(...locations.map(loc => loc.longitude));
    }
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const deltaLat = Math.max((maxLat - minLat) * 1.2, 0.01); // Add 20% padding
    const deltaLng = Math.max((maxLng - minLng) * 1.2, 0.01);
    
    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng,
    };
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getActivityTitle()}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Activity Summary Card */}
          <LinearGradient
            colors={getActivityColor() as [string, string]}
            style={styles.summaryCard}
          >
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIcon}>
                <Ionicons 
                  name={getActivityIcon() as keyof typeof Ionicons.glyphMap} 
                  size={32} 
                  color="#FFFFFF" 
                />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryTitle}>{getActivityTitle()}</Text>
                <Text style={styles.summaryDate}>{formatDate(activity.createdAt)}</Text>
                <Text style={styles.summaryTime}>
                  {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Stats Grid */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="map" size={24} color="#4ECDC4" />
              <Text style={styles.statValue}>{activity.distance.toFixed(2)} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#F39C12" />
              <Text style={styles.statValue}>{formatDuration(activity.duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color="#FFD93D" />
              <Text style={styles.statValue}>{activity.points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>

          {/* Map Section */}
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Route Map</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={getMapRegion()}
                showsUserLocation={false}
                showsMyLocationButton={false}
                toolbarEnabled={false}
              >
                {/* Start Location Marker */}
                {activity.startLocation && (
                  <Marker
                    coordinate={activity.startLocation}
                    title="Start"
                    description={activity.startLocation.address || "Starting point"}
                    pinColor="green"
                  />
                )}

                {/* End Location Marker */}
                {activity.endLocation && (
                  <Marker
                    coordinate={activity.endLocation}
                    title="End"
                    description={activity.endLocation.address || "Ending point"}
                    pinColor="red"
                  />
                )}

                {/* Route Path */}
                {activity.route && activity.route.length > 1 && (
                  <Polyline
                    coordinates={activity.route}
                    strokeColor={getActivityColor()[0]}
                    strokeWidth={4}
                    lineDashPattern={activity.type === 'walk' ? [0] : [10, 5]}
                  />
                )}

                {/* Station Markers for Cycling */}
                {activity.type === 'cycling' && activity.startStation && (
                  <Marker
                    coordinate={{
                      latitude: activity.startStation.latitude,
                      longitude: activity.startStation.longitude,
                    }}
                    title={activity.startStation.name}
                    description="Start Station"
                  >
                    <View style={styles.stationMarker}>
                      <Ionicons name="bicycle" size={16} color="#FFFFFF" />
                    </View>
                  </Marker>
                )}

                {activity.type === 'cycling' && activity.endStation && (
                  <Marker
                    coordinate={{
                      latitude: activity.endStation.latitude,
                      longitude: activity.endStation.longitude,
                    }}
                    title={activity.endStation.name}
                    description="End Station"
                  >
                    <View style={styles.stationMarker}>
                      <Ionicons name="bicycle" size={16} color="#FFFFFF" />
                    </View>
                  </Marker>
                )}
              </MapView>
            </View>
          </View>

          {/* Location Details */}
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Location Details</Text>
            
            {activity.startLocation && (
              <View style={styles.locationCard}>
                <View style={styles.locationIcon}>
                  <Ionicons name="play-circle" size={20} color="#27AE60" />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationTitle}>Start Location</Text>
                  <Text style={styles.locationAddress}>
                    {activity.startLocation.address || 
                     `${activity.startLocation.latitude.toFixed(6)}, ${activity.startLocation.longitude.toFixed(6)}`}
                  </Text>
                </View>
              </View>
            )}

            {activity.endLocation && (
              <View style={styles.locationCard}>
                <View style={styles.locationIcon}>
                  <Ionicons name="stop-circle" size={20} color="#E74C3C" />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationTitle}>End Location</Text>
                  <Text style={styles.locationAddress}>
                    {activity.endLocation.address || 
                     `${activity.endLocation.latitude.toFixed(6)}, ${activity.endLocation.longitude.toFixed(6)}`}
                  </Text>
                </View>
              </View>
            )}

            {/* Cycling Station Details */}
            {activity.type === 'cycling' && (activity.startStation || activity.endStation) && (
              <>
                {activity.startStation && (
                  <View style={styles.locationCard}>
                    <View style={styles.locationIcon}>
                      <Ionicons name="bicycle" size={20} color="#FFD93D" />
                    </View>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationTitle}>Start Station</Text>
                      <Text style={styles.locationAddress}>{activity.startStation.name}</Text>
                      <Text style={styles.locationSubtext}>{activity.startStation.address}</Text>
                    </View>
                  </View>
                )}

                {activity.endStation && (
                  <View style={styles.locationCard}>
                    <View style={styles.locationIcon}>
                      <Ionicons name="bicycle" size={20} color="#FFD93D" />
                    </View>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationTitle}>End Station</Text>
                      <Text style={styles.locationAddress}>{activity.endStation.name}</Text>
                      <Text style={styles.locationSubtext}>{activity.endStation.address}</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Payment Information */}
          {activity.payment && (activity.type === 'cycling' || activity.type === 'transit') && (
            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentIcon}>
                    <Ionicons name="card" size={20} color="#4ECDC4" />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>
                      {activity.type === 'cycling' ? 'Bike Share Rental' : 'Transit Ticket'}
                    </Text>
                    <Text style={styles.paymentSubtitle}>
                      Paid via {activity.payment.paymentMethod}
                    </Text>
                  </View>
                  <View style={styles.paymentAmount}>
                    <Text style={styles.paymentPrice}>
                      ${activity.payment.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.paymentDetails}>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Distance</Text>
                    <Text style={styles.paymentValue}>{activity.distance.toFixed(2)} km</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Rate per km</Text>
                    <Text style={styles.paymentValue}>
                      ${activity.payment.pricePerKm.toFixed(2)} {activity.payment.currency}
                    </Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Transaction ID</Text>
                    <Text style={styles.paymentValue}>{activity.payment.transactionId}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Payment Date</Text>
                    <Text style={styles.paymentValue}>
                      {new Date(activity.payment.paidAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Route Information */}
          {activity.route && activity.route.length > 0 && (
            <View style={styles.routeSection}>
              <Text style={styles.sectionTitle}>Route Information</Text>
              <View style={styles.routeCard}>
                <View style={styles.routeStats}>
                  <View style={styles.routeStat}>
                    <Ionicons name="location" size={16} color="#4ECDC4" />
                    <Text style={styles.routeStatText}>{activity.route.length} GPS points</Text>
                  </View>
                  <View style={styles.routeStat}>
                    <Ionicons name="trending-up" size={16} color="#27AE60" />
                    <Text style={styles.routeStatText}>
                      Avg speed: {((activity.distance / activity.duration) * 3600).toFixed(1)} km/h
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  summaryTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  mapSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    flex: 1,
  },
  stationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD93D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  locationSection: {
    marginBottom: 24,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  locationSubtext: {
    fontSize: 12,
    color: '#95A5A6',
  },
  routeSection: {
    marginBottom: 24,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  routeStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeStatText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2C3E50',
  },
  paymentSection: {
    marginBottom: 24,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  paymentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  paymentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  paymentValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
});

export default ActivityDetailModal; 