import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { signOutUser } from '../store/slices/authSlice';
import FirebaseService, { WalkHistoryEntry } from '../services/firebaseService';

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [firebaseService] = useState(() => FirebaseService.getInstance());
  const [walkHistory, setWalkHistory] = useState<WalkHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [firebaseProfile, setFirebaseProfile] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Load user profile from Firebase
      const profile = await firebaseService.getUserProfile(currentUser.uid);
      setFirebaseProfile(profile);
      
      // Load walk history (with error handling for index issues)
      try {
        const history = await firebaseService.getUserWalkHistory(currentUser.uid, 10);
        setWalkHistory(history);
      } catch (historyError) {
        console.log('Walk history not available yet (index may be building):', historyError);
        setWalkHistory([]); // Set empty array so UI doesn't break
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(signOutUser()).unwrap();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const profileData = firebaseProfile || userProfile;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#4ECDC4', '#44A08D'] as const}
          style={styles.header}
        >
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.userName}>{profileData?.name || currentUser?.displayName || 'EcoUser'}</Text>
            <Text style={styles.userEmail}>{profileData?.email || currentUser?.email || ''}</Text>
          </View>
          
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="flash" size={32} color="#4ECDC4" />
              <Text style={styles.statNumber}>{profileData?.totalPoints || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={32} color="#F39C12" />
              <Text style={styles.statNumber}>{profileData?.level || 1}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="walk" size={32} color="#27AE60" />
              <Text style={styles.statNumber}>{profileData?.activitiesCompleted || 0}</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="map" size={32} color="#E74C3C" />
              <Text style={styles.statNumber}>{(profileData?.totalDistance || 0).toFixed(1)}</Text>
              <Text style={styles.statLabel}>km Walked</Text>
            </View>
          </View>
        </View>

        {/* Recent Walks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Walks</Text>
            <TouchableOpacity onPress={loadUserData}>
              <Ionicons name="refresh" size={20} color="#4ECDC4" />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading walks...</Text>
            </View>
          ) : walkHistory.length > 0 ? (
            walkHistory.map((walk) => (
              <View key={walk.id} style={styles.walkCard}>
                <View style={styles.walkHeader}>
                  <View style={styles.walkIcon}>
                    <Ionicons name="walk" size={24} color="#4ECDC4" />
                  </View>
                  <View style={styles.walkInfo}>
                    <Text style={styles.walkDate}>{formatDate(walk.createdAt)}</Text>
                    <Text style={styles.walkTime}>{formatDuration(walk.duration)}</Text>
                  </View>
                  <View style={styles.walkStats}>
                    <Text style={styles.walkDistance}>{walk.distance.toFixed(2)} km</Text>
                    <Text style={styles.walkPoints}>+{walk.points} pts</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="walk-outline" size={64} color="#BDC3C7" />
              <Text style={styles.emptyTitle}>No walks yet</Text>
              <Text style={styles.emptySubtitle}>
                Start your first eco-friendly walk to see your activity here!
              </Text>
            </View>
          )}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          
          <View style={styles.achievementCard}>
            <View style={styles.achievementIcon}>
              <Ionicons name="leaf" size={32} color="#27AE60" />
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>Eco Warrior</Text>
              <Text style={styles.achievementDesc}>Keep making eco-friendly choices!</Text>
            </View>
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementLevel}>✓</Text>
            </View>
          </View>

          {profileData?.totalPoints >= 100 && (
            <View style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Ionicons name="star" size={32} color="#F39C12" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Point Collector</Text>
                <Text style={styles.achievementDesc}>Earned 100+ points</Text>
              </View>
              <View style={styles.achievementBadge}>
                <Text style={styles.achievementLevel}>★</Text>
              </View>
            </View>
          )}

          {(profileData?.activitiesCompleted || 0) >= 5 && (
            <View style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Ionicons name="footsteps" size={32} color="#8E44AD" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Regular Walker</Text>
                <Text style={styles.achievementDesc}>Completed 5+ activities</Text>
              </View>
              <View style={styles.achievementBadge}>
                <Text style={styles.achievementLevel}>🚶</Text>
              </View>
            </View>
          )}
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              EcoSteps helps you make eco-friendly transport choices while earning rewards. 
              Every step counts toward a greener future!
            </Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileInfo: {
    flex: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  signOutButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 16,
    paddingTop: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  walkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  walkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  walkInfo: {
    flex: 1,
  },
  walkDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  walkTime: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  walkStats: {
    alignItems: 'flex-end',
  },
  walkDistance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  walkPoints: {
    fontSize: 14,
    color: '#4ECDC4',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  achievementDesc: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  achievementBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementLevel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 12,
    color: '#BDC3C7',
    textAlign: 'center',
  },
});

export default ProfileScreen; 