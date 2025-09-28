import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { signOutUser } from '../store/slices/authSlice';
import FirebaseService, { WalkHistoryEntry, TransitHistoryEntry, CyclingHistoryEntry } from '../services/firebaseService';
import ActivityDetailModal from '../components/ActivityDetailModal';
import AllActivitiesModal from '../components/AllActivitiesModal';
import { useTheme } from '../contexts/ThemeContext';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { theme } = useTheme();
  
  const [firebaseService] = useState(() => FirebaseService.getInstance());
  const [walkHistory, setWalkHistory] = useState<WalkHistoryEntry[]>([]);
  const [transitHistory, setTransitHistory] = useState<TransitHistoryEntry[]>([]);
  const [cyclingHistory, setCyclingHistory] = useState<CyclingHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [firebaseProfile, setFirebaseProfile] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [currentUser])
  );

  const loadUserData = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Refresh user stats to ensure accuracy with actual walk count
      try {
        await firebaseService.refreshUserStats(currentUser.uid);
      } catch (refreshError) {
        console.log('Stats refresh failed, continuing with existing data:', refreshError);
      }
      
      // Load user profile from Firebase (now with refreshed stats)
      const profile = await firebaseService.getUserProfile(currentUser.uid);
      setFirebaseProfile(profile);
      
      // Load walk, transit, and cycling history (with error handling for index issues)
      try {
        const [walkHist, transitHist, cyclingHist] = await Promise.all([
          firebaseService.getUserWalkHistory(currentUser.uid, 10),
          firebaseService.getUserTransitHistory(currentUser.uid, 10),
          firebaseService.getUserCyclingHistory(currentUser.uid, 10)
        ]);
        setWalkHistory(walkHist);
        setTransitHistory(transitHist);
        setCyclingHistory(cyclingHist);
      } catch (historyError) {
        console.log('Activity history not available yet (index may be building):', historyError);
        setWalkHistory([]);
        setTransitHistory([]);
        setCyclingHistory([]);
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
    const totalSeconds = Math.floor(seconds); // Remove any decimals from input
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleActivityPress = (activity: any) => {
    setSelectedActivity(activity);
    setShowActivityDetail(true);
  };

  const closeActivityDetail = () => {
    setShowActivityDetail(false);
    setSelectedActivity(null);
  };

  const profileData = firebaseProfile || userProfile;
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Screen Title */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Profile</Text>
        </View>
        
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
              <Text style={styles.statLabel}>Total km</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="leaf" size={32} color="#27AE60" />
              <Text style={styles.statNumber}>{((profileData?.totalCarbonSaved || 0) / 1000).toFixed(1)}</Text>
              <Text style={styles.statLabel}>CO₂ Saved (kg)</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="earth" size={32} color="#2E8B57" />
              <Text style={styles.statNumber}>{Math.round((profileData?.totalCarbonSaved || 0) / 251) || 0}</Text>
              <Text style={styles.statLabel}>Car km Avoided</Text>
            </View>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            <TouchableOpacity onPress={loadUserData}>
              <Ionicons name="refresh" size={20} color="#4ECDC4" />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading activities...</Text>
            </View>
            ) : (walkHistory.length > 0 || transitHistory.length > 0 || cyclingHistory.length > 0) ? (
    (() => {
      // Combine and sort activities by date (latest first)
      const allActivities = [
        ...walkHistory.map(walk => ({ ...walk, type: 'walk' as const })),
        ...transitHistory.map(transit => ({ ...transit, type: 'transit' as const })),
        ...cyclingHistory.map(cycling => ({ ...cycling, type: 'cycling' as const }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Show only first 7 activities
      const recentActivities = allActivities.slice(0, 7);
      const hasMoreActivities = allActivities.length > 7;

                              return (
                                <>
                                  {recentActivities.map((activity, index) => (
        <TouchableOpacity 
          key={`${activity.type}-${activity.id}-${index}`} 
          style={styles.walkCard}
          onPress={() => handleActivityPress(activity)}
          activeOpacity={0.7}
        >
              <View style={styles.walkHeader}>
                <View style={styles.walkIcon}>
                  <Ionicons 
                    name={
                      activity.type === 'walk' ? 'walk' : 
                      activity.type === 'cycling' ? 'bicycle' : 'bus'
                    } 
                    size={24} 
                    color={
                      activity.type === 'walk' ? '#4ECDC4' : 
                      activity.type === 'cycling' ? '#FFD93D' : '#E74C3C'
                    } 
                  />
                </View>
                <View style={styles.walkInfo}>
                  <Text style={styles.walkDate}>{formatDate(activity.createdAt)}</Text>
                  <Text style={styles.walkTime}>
                    {activity.type === 'walk' ? 'Walking' : 
                     activity.type === 'cycling' ? 'Cycling' : 'Public Transit'} • {formatDuration(activity.duration)}
                  </Text>
                </View>
                    <View style={styles.walkStats}>
                      <Text style={styles.walkDistance}>{activity.distance.toFixed(2)} km</Text>
                      <Text style={styles.walkPoints}>+{activity.points} pts</Text>
                    </View>
                    <View style={styles.chevronIcon}>
                      <Ionicons name="chevron-forward" size={16} color="#BDC3C7" />
                    </View>
                  </View>
                </TouchableOpacity>
                                  ))}
                                  
                                  {/* View All Activities Button */}
                                  {hasMoreActivities && (
                                    <TouchableOpacity 
                                      style={styles.viewAllButton}
                                      onPress={() => setShowAllActivitiesModal(true)}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={styles.viewAllText}>
                                        View All Activities ({allActivities.length})
                                      </Text>
                                      <Ionicons name="chevron-forward" size={16} color="#4ECDC4" />
                                    </TouchableOpacity>
                                  )}
                                </>
                              );
            })()
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={64} color="#BDC3C7" />
              <Text style={styles.emptyTitle}>No activities yet</Text>
              <Text style={styles.emptySubtitle}>
                Start your first eco-friendly activity to see your progress here!
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

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity 
            style={styles.settingsCard}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <View style={styles.settingsContent}>
              <View style={styles.settingsIcon}>
                <Ionicons name="settings-outline" size={24} color="#4ECDC4" />
              </View>
              <View style={styles.settingsText}>
                <Text style={styles.settingsTitle}>App Settings</Text>
                <Text style={styles.settingsDescription}>Customize your experience</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <TouchableOpacity style={styles.signOutButtonBottom} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        visible={showActivityDetail}
        onClose={closeActivityDetail}
        activity={selectedActivity}
      />

      {/* All Activities Modal */}
      <AllActivitiesModal
        visible={showAllActivitiesModal}
        onClose={() => setShowAllActivitiesModal(false)}
        walkHistory={walkHistory}
        transitHistory={transitHistory}
        cyclingHistory={cyclingHistory}
        onActivityPress={handleActivityPress}
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  screenHeader: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  header: {
    padding: 24,
    paddingTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
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
  signOutSection: {
    padding: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  signOutButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEBEE',
  },
  signOutButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
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
    color: theme.colors.text,
    marginBottom: 5,
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
  chevronIcon: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  viewAllText: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    marginRight: 16,
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  settingsDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
});

export default ProfileScreen; 