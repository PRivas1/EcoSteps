import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { RootStackParamList } from '../navigation/AppNavigator';
import FirebaseService from '../services/firebaseService';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [firebaseProfile, setFirebaseProfile] = useState<any>(null);
  const [firebaseService] = useState(() => FirebaseService.getInstance());
  
  // Temporarily comment out until store is fixed
  // const recentActivities = useSelector((state: RootState) => 
  //   state.activity.activities.slice(-3).reverse()
  // );
  const recentActivities: any[] = [];

  // Load fresh profile data from Firebase when component mounts or user changes
  useEffect(() => {
    const loadFirebaseProfile = async () => {
      if (!currentUser) return;
      
      try {
        // Refresh stats to ensure we have the latest data
        await firebaseService.refreshUserStats(currentUser.uid);
        
        // Get the updated profile
        const profile = await firebaseService.getUserProfile(currentUser.uid);
        setFirebaseProfile(profile);
        console.log('HomeScreen: Loaded fresh profile data:', profile);
      } catch (error) {
        console.error('HomeScreen: Error loading profile:', error);
      }
    };
    
    loadFirebaseProfile();
  }, [currentUser, firebaseService]);

  // Refresh profile when screen comes into focus (e.g., returning from activities)
  useFocusEffect(
    React.useCallback(() => {
      const refreshProfile = async () => {
        if (!currentUser) return;
        
        try {
          await firebaseService.refreshUserStats(currentUser.uid);
          const profile = await firebaseService.getUserProfile(currentUser.uid);
          setFirebaseProfile(profile);
          console.log('HomeScreen: Refreshed profile on focus');
        } catch (error) {
          console.error('HomeScreen: Error refreshing profile on focus:', error);
        }
      };
      
      refreshProfile();
    }, [currentUser, firebaseService])
  );
  
  // Use Firebase profile if available, otherwise fall back to Redux profile
  const displayProfile = firebaseProfile || userProfile;

  const transportModes = [
    {
      id: 'walk',
      title: 'Walk on Foot',
      icon: 'walk',
      color: ['#A8E6CF', '#7FCDCD'] as const,
      points: '10 pts/km',
      description: 'Track your walking route',
      screen: 'Walk' as const,
    },
    {
      id: 'cycle',
      title: 'Cycle',
      icon: 'bicycle',
      color: ['#FFD93D', '#FF8C94'] as const,
      points: '8 pts/km',
      description: 'Find nearby bike stations',
      screen: 'Cycle' as const,
    },
    {
      id: 'transit',
      title: 'Take the Bus/Train',
      icon: 'bus',
      color: ['#A8C8EC', '#88E5A3'] as const,
      points: '4 pts/km',
      description: 'Plan your public transport',
      screen: 'Transit' as const,
    },
  ];

  const handleModeSelection = (screen: 'Walk' | 'Cycle' | 'Transit') => {
    navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.nameText}>{displayProfile?.name}</Text>
          
          {/* Points Card */}
          <TouchableOpacity
            onPress={async () => {
              if (currentUser) {
                try {
                  await firebaseService.refreshUserStats(currentUser.uid);
                  const profile = await firebaseService.getUserProfile(currentUser.uid);
                  setFirebaseProfile(profile);
                } catch (error) {
                  console.error('Error refreshing points:', error);
                }
              }
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4ECDC4', '#44A08D'] as const}
              style={styles.pointsCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.pointsContent}>
                <View style={styles.pointsInfo}>
                  <Text style={styles.pointsLabel}>Your Points</Text>
                  <Text style={styles.pointsValue}>{displayProfile?.totalPoints || 0}</Text>
                </View>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelLabel}>Level {displayProfile?.level || 1}</Text>
                  <Text style={styles.levelSubtext}>
                    {Math.max(0, 100 - ((displayProfile?.totalPoints || 0) % 100))} pts to next level
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Transport Modes */}
        <View style={styles.modesSection}>
          <Text style={styles.sectionTitle}>Choose Your Transport</Text>
          
          {transportModes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={styles.modeCard}
              onPress={() => handleModeSelection(mode.screen)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={mode.color}
                style={styles.modeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.modeContent}>
                  <View style={styles.modeIcon}>
                    <Ionicons 
                      name={mode.icon as keyof typeof Ionicons.glyphMap} 
                      size={32} 
                      color="#2C3E50" 
                    />
                  </View>
                  <View style={styles.modeInfo}>
                    <Text style={styles.modeTitle}>{mode.title}</Text>
                    <Text style={styles.modeDescription}>{mode.description}</Text>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsText}>{mode.points}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#2C3E50" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Getting Started Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Getting Started</Text>
          <View style={styles.tipCard}>
            <View style={styles.tipItem}>
              <Ionicons name="footsteps" size={20} color="#4ECDC4" />
              <Text style={styles.tipText}>Tap "Walk on Foot" to start your first eco-friendly journey</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="star" size={20} color="#FFD93D" />
              <Text style={styles.tipText}>Earn points based on distance traveled</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="gift" size={20} color="#FF8C94" />
              <Text style={styles.tipText}>Redeem points for real-world rewards</Text>
            </View>
          </View>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Impact</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{displayProfile?.activitiesCompleted || 0}</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{(displayProfile?.totalDistance || 0).toFixed(1)}</Text>
              <Text style={styles.statLabel}>Total km</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{displayProfile?.badges?.length || 0}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  pointsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
  },
  pointsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  pointsValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  levelInfo: {
    alignItems: 'flex-end',
  },
  levelLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  levelSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  modesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  modeCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeGradient: {
    padding: 20,
  },
  modeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: '#34495E',
    marginBottom: 8,
  },
  pointsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  tipsSection: {
    padding: 20,
    paddingTop: 0,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  statsSection: {
    padding: 20,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});

export default HomeScreen; 