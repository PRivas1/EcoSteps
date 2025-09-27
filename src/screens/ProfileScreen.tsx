import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const ProfileScreen: React.FC = () => {
  const userProfile = useSelector((state: RootState) => state.user.profile);
  // Temporarily using empty array instead of complex selector
  const activities: any[] = [];

  const getProgressToNextLevel = () => {
    const currentPoints = userProfile?.totalPoints || 0;
    const pointsInCurrentLevel = currentPoints % 100;
    return (pointsInCurrentLevel / 100) * 100;
  };

  const getActivityStats = () => {
    return { walkCount: 0, cycleCount: 0, transitCount: 0 };
  };

  const { walkCount, cycleCount, transitCount } = getActivityStats();

  const achievements = [
    { id: 1, title: 'First Steps', description: 'Complete your first walk', icon: 'footsteps', achieved: walkCount > 0 },
    { id: 2, title: 'Cyclist', description: 'Complete your first bike ride', icon: 'bicycle', achieved: cycleCount > 0 },
    { id: 3, title: 'Commuter', description: 'Use public transport', icon: 'bus', achieved: transitCount > 0 },
    { id: 4, title: 'Eco Warrior', description: 'Reach 500 points', icon: 'leaf', achieved: (userProfile?.totalPoints || 0) >= 500 },
    { id: 5, title: 'Distance Master', description: 'Walk 10km total', icon: 'trophy', achieved: (userProfile?.totalDistance || 0) >= 10 },
    { id: 6, title: 'Level Up!', description: 'Reach level 5', icon: 'star', achieved: (userProfile?.level || 1) >= 5 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#4ECDC4', '#44A08D'] as const}
          style={styles.headerGradient}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.userName}>{userProfile?.name}</Text>
            <Text style={styles.userLevel}>Level {userProfile?.level || 1}</Text>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userProfile?.totalPoints || 0}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userProfile?.activitiesCompleted || 0}</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{(userProfile?.totalDistance || 0).toFixed(1)}</Text>
              <Text style={styles.statLabel}>Distance (km)</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userProfile?.badges?.length || 0}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        </View>

        {/* Progress to Next Level */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Progress to Next Level</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {(userProfile?.totalPoints || 0) % 100} / 100 points
              </Text>
              <Text style={styles.progressSubtext}>
                {100 - ((userProfile?.totalPoints || 0) % 100)} points to level {(userProfile?.level || 1) + 1}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${getProgressToNextLevel()}%` }]} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* Activity Breakdown */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Activity Breakdown</Text>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="walk" size={24} color="#4ECDC4" />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>Walking</Text>
              <Text style={styles.activityCount}>{walkCount} activities</Text>
            </View>
            <Text style={styles.activityPoints}>10 pts/km</Text>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="bicycle" size={24} color="#FFD93D" />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>Cycling</Text>
              <Text style={styles.activityCount}>{cycleCount} activities</Text>
            </View>
            <Text style={styles.activityPoints}>8 pts/km</Text>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="bus" size={24} color="#A8C8EC" />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>Public Transport</Text>
              <Text style={styles.activityCount}>{transitCount} activities</Text>
            </View>
            <Text style={styles.activityPoints}>4 pts/km</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {achievements.map((achievement) => (
            <View 
              key={achievement.id} 
              style={[
                styles.achievementItem,
                achievement.achieved ? styles.achievementAchieved : styles.achievementLocked
              ]}
            >
              <View style={[
                styles.achievementIcon,
                achievement.achieved ? styles.achievementIconAchieved : styles.achievementIconLocked
              ]}>
                <Ionicons 
                  name={achievement.icon as keyof typeof Ionicons.glyphMap} 
                  size={20} 
                  color={achievement.achieved ? "#4ECDC4" : "#BDC3C7"} 
                />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={[
                  styles.achievementTitle,
                  achievement.achieved ? styles.achievementTitleAchieved : styles.achievementTitleLocked
                ]}>
                  {achievement.title}
                </Text>
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
              </View>
              {achievement.achieved && (
                <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
              )}
            </View>
          ))}
        </View>

        {/* Get Started */}
        <View style={styles.getStartedSection}>
          <Text style={styles.sectionTitle}>Get Started</Text>
          <View style={styles.tipCard}>
            <Ionicons name="walk" size={32} color="#4ECDC4" />
            <Text style={styles.tipTitle}>Start Walking!</Text>
            <Text style={styles.tipDescription}>
              Head to the Home screen and tap "Walk on Foot" to start earning points for your eco-friendly activities.
            </Text>
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
  headerGradient: {
    paddingBottom: 40,
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  userLevel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsSection: {
    padding: 20,
    marginTop: -20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    marginHorizontal: 6,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  progressSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressInfo: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  activitySection: {
    padding: 20,
    paddingTop: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  activityCount: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  activityPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  achievementsSection: {
    padding: 20,
    paddingTop: 0,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  achievementAchieved: {
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementIconAchieved: {
    backgroundColor: '#E8F8F5',
  },
  achievementIconLocked: {
    backgroundColor: '#F8F9FA',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  achievementTitleAchieved: {
    color: '#2C3E50',
  },
  achievementTitleLocked: {
    color: '#7F8C8D',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  getStartedSection: {
    padding: 20,
    paddingTop: 0,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 12,
    marginBottom: 8,
  },
  tipDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProfileScreen; 