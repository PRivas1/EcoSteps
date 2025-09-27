import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { redeemReward } from '../store/slices/rewardsSlice';
import { spendPoints } from '../store/slices/userSlice';

const RewardsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const userProfile = useSelector((state: RootState) => state.user.profile);
  // Temporarily using empty arrays
  const availableRewards: any[] = [];
  const redeemedRewards: any[] = [];

  const mockRewards = [
    {
      id: '1',
      title: '5% Off Groceries',
      description: 'Get 5% discount at participating supermarkets',
      pointsCost: 100,
      category: 'supermarket',
      discountPercentage: 5,
    },
    {
      id: '2',
      title: '10% Off Public Transport',
      description: 'Save 10% on your next bus or train ticket',
      pointsCost: 80,
      category: 'transport',
      discountPercentage: 10,
    },
    {
      id: '3',
      title: 'Free Coffee',
      description: 'Enjoy a free coffee at participating cafes',
      pointsCost: 50,
      category: 'food',
      discountPercentage: 100,
    },
  ];

  const handleRedeemReward = (reward: any) => {
    if (!userProfile || userProfile.totalPoints < reward.pointsCost) {
      Alert.alert(
        'Insufficient Points',
        `You need ${reward.pointsCost} points to redeem this reward. You currently have ${userProfile?.totalPoints || 0} points.`
      );
      return;
    }

    Alert.alert(
      'Redeem Reward',
      `Are you sure you want to redeem "${reward.title}" for ${reward.pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: () => {
            dispatch(redeemReward(reward.id));
            dispatch(spendPoints(reward.pointsCost));
            Alert.alert(
              'Reward Redeemed!',
              'Your reward has been successfully redeemed. Check the "My Rewards" section for your voucher.'
            );
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'supermarket':
        return 'storefront';
      case 'transport':
        return 'bus';
      case 'entertainment':
        return 'ticket';
      case 'food':
        return 'restaurant';
      default:
        return 'gift';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'supermarket':
        return '#4ECDC4';
      case 'transport':
        return '#A8C8EC';
      case 'entertainment':
        return '#FFD93D';
      case 'food':
        return '#FF8C94';
      default:
        return '#95A5A6';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#4ECDC4', '#44A08D'] as const}
            style={styles.pointsCard}
          >
            <View style={styles.pointsContent}>
              <Text style={styles.pointsLabel}>Available Points</Text>
              <Text style={styles.pointsValue}>{userProfile?.totalPoints || 0}</Text>
            </View>
            <Ionicons name="star" size={32} color="#FFFFFF" style={styles.pointsIcon} />
          </LinearGradient>
        </View>

        {/* Available Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
          {mockRewards.map((reward) => (
            <View key={reward.id} style={styles.rewardCard}>
              <View style={styles.rewardHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(reward.category) }]}>
                  <Ionicons 
                    name={getCategoryIcon(reward.category) as keyof typeof Ionicons.glyphMap} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  <Text style={styles.rewardDescription}>{reward.description}</Text>
                </View>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{reward.discountPercentage}% OFF</Text>
                </View>
              </View>
              
              <View style={styles.rewardFooter}>
                <View style={styles.pointsCost}>
                  <Ionicons name="star" size={16} color="#FFD93D" />
                  <Text style={styles.pointsCostText}>{reward.pointsCost} points</Text>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.redeemButton,
                    (userProfile?.totalPoints || 0) < reward.pointsCost && styles.redeemButtonDisabled
                  ]}
                  onPress={() => handleRedeemReward(reward)}
                  disabled={(userProfile?.totalPoints || 0) < reward.pointsCost}
                >
                  <LinearGradient
                    colors={
                      (userProfile?.totalPoints || 0) >= reward.pointsCost
                        ? ['#4ECDC4', '#44A08D'] as const
                        : ['#BDC3C7', '#95A5A6'] as const
                    }
                    style={styles.redeemButtonGradient}
                  >
                    <Text style={styles.redeemButtonText}>
                      {(userProfile?.totalPoints || 0) >= reward.pointsCost ? 'Redeem' : 'Not enough points'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Earn More Points</Text>
          <View style={styles.tipCard}>
            <View style={styles.tipItem}>
              <Ionicons name="walk" size={20} color="#4ECDC4" />
              <Text style={styles.tipText}>Walk: 10 points per km</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="bicycle" size={20} color="#FFD93D" />
              <Text style={styles.tipText}>Cycle: 8 points per km</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="bus" size={20} color="#A8C8EC" />
              <Text style={styles.tipText}>Public Transport: 4 points per km</Text>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.section}>
          <View style={styles.ctaCard}>
            <Ionicons name="trophy" size={48} color="#FFD93D" />
            <Text style={styles.ctaTitle}>Start Earning Points!</Text>
            <Text style={styles.ctaDescription}>
              Head to the Home screen and start your first eco-friendly journey to earn points and unlock these rewards.
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
  header: {
    padding: 20,
  },
  pointsCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsContent: {
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
  pointsIcon: {
    opacity: 0.3,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  discountBadge: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsCost: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsCostText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  redeemButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  redeemButtonDisabled: {
    opacity: 0.6,
  },
  redeemButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
    marginBottom: 8,
  },
  tipText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#2C3E50',
  },
  ctaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 12,
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RewardsScreen; 