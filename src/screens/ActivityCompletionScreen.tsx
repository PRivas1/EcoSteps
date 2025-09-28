import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type ActivityCompletionScreenRouteProp = RouteProp<RootStackParamList, 'ActivityCompletion'>;
type ActivityCompletionScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ActivityCompletionScreen: React.FC = () => {
  const navigation = useNavigation<ActivityCompletionScreenNavigationProp>();
  const route = useRoute<ActivityCompletionScreenRouteProp>();
  const insets = useSafeAreaInsets();
  
  const { mode, distance, points } = route.params;

  const getModeEmoji = () => {
    switch (mode) {
      case 'walk':
        return '🚶';
      case 'cycle':
        return '🚲';
      case 'transit':
        return '🚌';
      default:
        return '🎯';
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'walk':
        return 'Walking Complete!';
      case 'cycle':
        return 'Cycling Complete!';
      case 'transit':
        return 'Journey Complete!';
      default:
        return 'Activity Complete!';
    }
  };

  const getEncouragement = () => {
    if (points >= 50) {
      return "Outstanding! You're making a real difference! 🌟";
    } else if (points >= 20) {
      return "Great job! Keep up the eco-friendly choices! 🌱";
    } else {
      return "Every step counts towards a greener future! 🌍";
    }
  };

  const handleContinue = () => {
    navigation.navigate('MainTabs');
  };

  const handleViewRewards = () => {
    navigation.navigate('MainTabs');
    // Navigate to rewards tab after main tabs load
    setTimeout(() => {
      // This would normally use a tab navigation ref
    }, 100);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('MainTabs')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          <Text style={styles.backButtonText}>Home</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Success Animation Area */}
        <View style={styles.celebrationSection}>
          <Text style={styles.modeEmoji}>{getModeEmoji()}</Text>
          <Text style={styles.title}>{getModeTitle()}</Text>
          <Text style={styles.encouragement}>{getEncouragement()}</Text>
        </View>

        {/* Stats Display */}
        <LinearGradient
          colors={['#4ECDC4', '#44A08D'] as const}
          style={styles.statsCard}
        >
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Ionicons name="location" size={32} color="#FFFFFF" />
              <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Kilometers</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Ionicons name="star" size={32} color="#FFFFFF" />
              <Text style={styles.statValue}>{points}</Text>
              <Text style={styles.statLabel}>Points Earned</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Environmental Impact */}
        <View style={styles.impactSection}>
          <Text style={styles.impactTitle}>Your Environmental Impact</Text>
          <View style={styles.impactCard}>
            <View style={styles.impactItem}>
              <Ionicons name="leaf" size={20} color="#27AE60" />
              <Text style={styles.impactText}>
                ~{(distance * 0.2).toFixed(1)} kg CO₂ saved
              </Text>
            </View>

          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D'] as const}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleViewRewards}>
            <Text style={styles.secondaryButtonText}>View Rewards</Text>
          </TouchableOpacity>
        </View>

        {/* Achievement Badge */}
        <View style={styles.achievementSection}>
          <View style={styles.achievementBadge}>
            <Ionicons name="trophy" size={24} color="#FFD93D" />
            <Text style={styles.achievementText}>Eco Champion</Text>
          </View>
        </View>

        {/* Extra padding for comfortable scrolling */}
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
    padding: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  celebrationSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  modeEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  encouragement: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 32,
  },
  statsCard: {
    borderRadius: 20,
    padding: 24,
    marginVertical: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
  },
  impactSection: {
    marginVertical: 20,
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  impactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'center',
  },
  impactText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2C3E50',
  },
  buttonSection: {
    marginVertical: 20,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  secondaryButtonText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD93D',
  },
  achievementText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
  },
  bottomPadding: {
    height: 30,
  },
});

export default ActivityCompletionScreen; 