import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { redeemReward } from '../store/slices/rewardsSlice';
import { spendPoints } from '../store/slices/userSlice';
import FirebaseService from '../services/firebaseService';

const RewardsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [firebaseProfile, setFirebaseProfile] = useState<any>(null);
  const [firebaseRedeemedRewards, setFirebaseRedeemedRewards] = useState<any[]>([]);
  const [firebaseService] = useState(() => FirebaseService.getInstance());
  
  // Use actual Redux state for rewards
  const availableRewards = useSelector((state: RootState) => state.rewards.availableRewards);
  const redeemedRewards = useSelector((state: RootState) => state.rewards.redeemedRewards);

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
        console.log('RewardsScreen: Loaded fresh profile data:', profile);

        // Load user's redeemed rewards from Firebase
        const redeemedRewards = await firebaseService.getUserRedeemedRewards(currentUser.uid);
        setFirebaseRedeemedRewards(redeemedRewards);
      } catch (error) {
        console.error('RewardsScreen: Error loading profile:', error);
      }
    };
    
    loadFirebaseProfile();
  }, [currentUser, firebaseService]);

  // Refresh profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshProfile = async () => {
        if (!currentUser) return;
        
        try {
          await firebaseService.refreshUserStats(currentUser.uid);
          const profile = await firebaseService.getUserProfile(currentUser.uid);
          setFirebaseProfile(profile);
          console.log('RewardsScreen: Refreshed profile on focus');

          // Refresh redeemed rewards
          const redeemedRewards = await firebaseService.getUserRedeemedRewards(currentUser.uid);
          setFirebaseRedeemedRewards(redeemedRewards);
        } catch (error) {
          console.error('RewardsScreen: Error refreshing profile on focus:', error);
        }
      };
      
      refreshProfile();
    }, [currentUser, firebaseService])
  );
  
  // Use Firebase profile if available, otherwise fall back to Redux profile
  const displayProfile = firebaseProfile || userProfile;

  // Check if a reward has been redeemed by the user
  const isRewardRedeemed = (rewardId: string) => {
    return firebaseRedeemedRewards.some(redeemedReward => redeemedReward.rewardId === rewardId);
  };



  const handleRedeemReward = async (reward: any) => {
    if (!displayProfile || !currentUser || displayProfile.totalPoints < reward.pointsCost) {
      Alert.alert(
        'Insufficient Points',
        `You need ${reward.pointsCost} points to redeem this reward. You currently have ${displayProfile?.totalPoints || 0} points.`
      );
      return;
    }

    if (isRewardRedeemed(reward.id)) {
      Alert.alert(
        'Already Redeemed',
        'You have already redeemed this reward.'
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
          onPress: async () => {
            try {
              // Update Firebase first - deduct points
              const newPointsBalance = displayProfile.totalPoints - reward.pointsCost;
              await firebaseService.updateUserProfile(currentUser.uid, {
                totalPoints: newPointsBalance,
              });

              // Store redeemed reward in Firebase
              const qrCode = `QR-${reward.id}-${Date.now()}`;
              await firebaseService.addRedeemedReward(currentUser.uid, {
                rewardId: reward.id,
                title: reward.title,
                pointsCost: reward.pointsCost,
                category: reward.category,
                redeemedAt: new Date(),
                qrCode: qrCode,
              });

              // Update local Redux state
              dispatch(spendPoints(reward.pointsCost));
              dispatch(redeemReward(reward.id));

              // Refresh the Firebase profile to show updated points
              await firebaseService.refreshUserStats(currentUser.uid);
              const updatedProfile = await firebaseService.getUserProfile(currentUser.uid);
              setFirebaseProfile(updatedProfile);

              // Refresh redeemed rewards list
              const updatedRedeemedRewards = await firebaseService.getUserRedeemedRewards(currentUser.uid);
              setFirebaseRedeemedRewards(updatedRedeemedRewards);

              Alert.alert(
                'Reward Redeemed!',
                `You have successfully redeemed "${reward.title}" for ${reward.pointsCost} points. Your new balance is ${newPointsBalance} points.\n\nVoucher Code: ${qrCode}`
              );
            } catch (error) {
              console.error('Error redeeming reward:', error);
              Alert.alert(
                'Redemption Failed',
                'There was an error processing your reward redemption. Please try again.'
              );
            }
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

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* Screen Title */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Rewards</Text>
        </View>
        
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#4ECDC4', '#44A08D'] as const}
            style={styles.pointsCard}
          >
            <View style={styles.pointsContent}>
              <Text style={styles.pointsLabel}>Available Points</Text>
              <Text style={styles.pointsValue}>{displayProfile?.totalPoints || 0}</Text>
            </View>
            <Ionicons name="star" size={32} color="#FFFFFF" style={styles.pointsIcon} />
          </LinearGradient>
        </View>

        {/* Available Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
          {availableRewards.map((reward, index) => {
            const isRedeemed = isRewardRedeemed(reward.id);
            return (
            <View key={`available-${reward.id}-${index}`} style={[
              styles.rewardCard,
              isRedeemed && styles.redeemedRewardCard
            ]}>
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
                    ((displayProfile?.totalPoints || 0) < reward.pointsCost || isRedeemed) && styles.redeemButtonDisabled
                  ]}
                  onPress={() => handleRedeemReward(reward)}
                  disabled={(displayProfile?.totalPoints || 0) < reward.pointsCost || isRedeemed}
                >
                  <LinearGradient
                    colors={
                      isRedeemed
                        ? ['#27AE60', '#2ECC71'] as const
                        : (displayProfile?.totalPoints || 0) >= reward.pointsCost
                        ? ['#4ECDC4', '#44A08D'] as const
                        : ['#BDC3C7', '#95A5A6'] as const
                    }
                    style={styles.redeemButtonGradient}
                  >
                    <View style={styles.buttonContent}>
                      {isRedeemed && (
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                      )}
                      <Text style={styles.redeemButtonText}>
                        {isRedeemed 
                          ? 'Redeemed' 
                          : (displayProfile?.totalPoints || 0) >= reward.pointsCost 
                          ? 'Redeem' 
                          : 'Not enough points'}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
            );
          })}
        </View>

        {/* Redeemed Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Rewards</Text>
          {firebaseRedeemedRewards.length > 0 ? (
            firebaseRedeemedRewards.map((reward, index) => (
              <View key={`redeemed-${reward.id}-${index}`} style={styles.redeemedRewardCard}>
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
                    <Text style={styles.redeemedDate}>
                      Redeemed: {reward.redeemedAt ? new Date(reward.redeemedAt).toLocaleDateString() : 'Unknown'}
                    </Text>
                    {reward.usedForDiscount && (
                      <Text style={styles.usedForDiscountText}>
                        ✅ Used for discount on {reward.discountUsedAt ? new Date(reward.discountUsedAt.toDate()).toLocaleDateString() : 'Unknown date'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.redeemedBadge}>
                    <Ionicons 
                      name={reward.usedForDiscount ? "star" : "checkmark-circle"} 
                      size={24} 
                      color={reward.usedForDiscount ? "#FFD93D" : "#27AE60"} 
                    />
                  </View>
                </View>
                
                {reward.qrCode && (
                  <View style={styles.qrCodeSection}>
                    <Text style={styles.qrCodeLabel}>Your Voucher Code:</Text>
                    <Text style={styles.qrCode}>{reward.qrCode}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={64} color="#BDC3C7" />
              <Text style={styles.emptyTitle}>No Rewards Yet</Text>
              <Text style={styles.emptySubtitle}>
                Redeem your first reward to see it here!
              </Text>
            </View>
          )}
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
    </View>
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
    padding: 20,
    paddingTop: 0,
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 4,
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
  redeemedRewardCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    opacity: 0.7,
  },
  redeemedDate: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
    marginTop: 2,
  },
  redeemedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignItems: 'center',
  },
  qrCodeLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  qrCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  usedForDiscountText: {
    fontSize: 12,
    color: '#FFD93D',
    fontWeight: '500',
    marginTop: 4,
  },
});

export default RewardsScreen; 