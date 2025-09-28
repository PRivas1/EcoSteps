import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface PaymentScreenProps {
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  tripType: 'cycling' | 'transit';
  distance: number;
  duration: number;
  startLocation?: string;
  endLocation?: string;
  routeType?: string;
  discount?: {
    percentage: number;
    rewardTitle: string;
  };
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({
  visible,
  onClose,
  onPaymentSuccess,
  tripType,
  distance,
  duration,
  startLocation,
  endLocation,
  routeType,
  discount,
}) => {
  const [paymentState, setPaymentState] = useState<'ready' | 'processing' | 'success'>('ready');

  // Pricing per km
  const pricePerKm = tripType === 'cycling' ? 2.50 : 1.80; // $2.50/km for cycling, $1.80/km for transit
  const originalPrice = distance * pricePerKm;
  const discountAmount = discount ? (originalPrice * discount.percentage) / 100 : 0;
  const totalPrice = originalPrice - discountAmount;

  const handlePayment = async () => {
    setPaymentState('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentState('success');
      
      // After showing success for 2 seconds, complete the journey
      setTimeout(() => {
        onPaymentSuccess();
        setPaymentState('ready'); // Reset for next time
      }, 2000);
    }, 3000); // 3 second loading
  };

  const formatDuration = (seconds: number) => {
    const totalSeconds = Math.floor(seconds); // Remove any decimals from input
    const mins = Math.floor(totalSeconds / 60);
    return `${mins} min`;
  };

  const getTripIcon = () => {
    return tripType === 'cycling' ? 'bicycle' : 'bus';
  };

  const getTripTitle = () => {
    if (tripType === 'cycling') {
      return 'Bike Share Rental';
    }
    return `${routeType?.charAt(0).toUpperCase()}${routeType?.slice(1)} Ticket` || 'Transit Ticket';
  };

  const getTripColor = () => {
    return tripType === 'cycling' 
      ? ['#FFD93D', '#FF8C94'] as const
      : ['#FFABAB', '#FFC3A0'] as const;
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
          <Text style={styles.headerTitle}>Purchase Ticket</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Trip Summary Card */}
          <LinearGradient
            colors={getTripColor()}
            style={styles.summaryCard}
          >
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIcon}>
                <Ionicons 
                  name={getTripIcon() as keyof typeof Ionicons.glyphMap} 
                  size={32} 
                  color="#FFFFFF" 
                />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryTitle}>{getTripTitle()}</Text>
                <Text style={styles.summarySubtitle}>
                  {distance.toFixed(2)} km • {formatDuration(duration)}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Route Information */}
          <View style={styles.routeSection}>
            <Text style={styles.sectionTitle}>Route Details</Text>
            
            <View style={styles.routeCard}>
              <View style={styles.routeItem}>
                <View style={styles.routeIcon}>
                  <Ionicons name="play-circle" size={20} color="#27AE60" />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeLabel}>From</Text>
                  <Text style={styles.routeText}>{startLocation || 'Current Location'}</Text>
                </View>
              </View>

              <View style={styles.routeDivider} />

              <View style={styles.routeItem}>
                <View style={styles.routeIcon}>
                  <Ionicons name="stop-circle" size={20} color="#E74C3C" />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeLabel}>To</Text>
                  <Text style={styles.routeText}>{endLocation || 'Destination'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Pricing Breakdown */}
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            
            <View style={styles.pricingCard}>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Distance</Text>
                <Text style={styles.pricingValue}>{distance.toFixed(2)} km</Text>
              </View>
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Rate per km</Text>
                <Text style={styles.pricingValue}>${pricePerKm.toFixed(2)}</Text>
              </View>

              {discount && (
                <>
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>Subtotal</Text>
                    <Text style={styles.pricingValue}>${originalPrice.toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.pricingRow}>
                    <Text style={styles.discountLabel}>
                      {discount.rewardTitle} (-{discount.percentage}%)
                    </Text>
                    <Text style={styles.discountValue}>-${discountAmount.toFixed(2)}</Text>
                  </View>
                </>
              )}
              
              <View style={styles.pricingDivider} />
              
              <View style={styles.pricingRow}>
                <Text style={styles.totalLabel}>Total Price</Text>
                <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Payment Button */}
          <View style={styles.paymentSection}>
            <TouchableOpacity
              style={[
                styles.paymentButton,
                paymentState !== 'ready' && styles.paymentButtonDisabled
              ]}
              onPress={handlePayment}
              disabled={paymentState !== 'ready'}
            >
              <LinearGradient
                colors={
                  paymentState === 'success' 
                    ? ['#27AE60', '#2ECC71'] as const
                    : ['#4ECDC4', '#44A08D'] as const
                }
                style={styles.paymentButtonGradient}
              >
                {paymentState === 'ready' && (
                  <>
                    <Ionicons name="card" size={24} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.paymentButtonText}>Buy Ticket - ${totalPrice.toFixed(2)}</Text>
                  </>
                )}
                
                {paymentState === 'processing' && (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.paymentButtonText}>Processing Payment...</Text>
                  </>
                )}
                
                {paymentState === 'success' && (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.paymentButtonText}>Payment Successful!</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {paymentState === 'success' && (
              <View style={styles.successMessage}>
                <Text style={styles.successText}>
                  Your {tripType === 'cycling' ? 'bike rental' : 'transit ticket'} has been purchased successfully!
                </Text>
                <Text style={styles.successSubtext}>
                  Completing your eco-friendly journey...
                </Text>
              </View>
            )}
          </View>

          {/* Payment Methods Info */}
          {paymentState === 'ready' && (
            <View style={styles.paymentMethodsSection}>
              <Text style={styles.paymentMethodsTitle}>Secure Payment</Text>
              <View style={styles.paymentMethods}>
                <View style={styles.paymentMethod}>
                  <Ionicons name="card" size={20} color="#4ECDC4" />
                  <Text style={styles.paymentMethodText}>Credit Card</Text>
                </View>
                <View style={styles.paymentMethod}>
                  <Ionicons name="logo-apple" size={20} color="#4ECDC4" />
                  <Text style={styles.paymentMethodText}>Apple Pay</Text>
                </View>
                <View style={styles.paymentMethod}>
                  <Ionicons name="logo-google" size={20} color="#4ECDC4" />
                  <Text style={styles.paymentMethodText}>Google Pay</Text>
                </View>
              </View>
            </View>
          )}

          {/* Bottom padding for better scrolling */}
          <View style={styles.bottomPadding} />
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
  summarySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  routeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  routeText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 8,
    marginLeft: 52,
  },
  pricingSection: {
    marginBottom: 24,
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  pricingValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  paymentSection: {
    marginBottom: 24,
  },
  paymentButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  paymentButtonDisabled: {
    opacity: 0.8,
  },
  paymentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonIcon: {
    marginRight: 8,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successMessage: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  successSubtext: {
    fontSize: 12,
    color: '#27AE60',
    textAlign: 'center',
  },
  paymentMethodsSection: {
    alignItems: 'center',
  },
  paymentMethodsTitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  paymentMethod: {
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 10,
    color: '#7F8C8D',
    marginTop: 4,
  },
  bottomPadding: {
    height: 20,
  },
  discountLabel: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
  },
});

export default PaymentScreen; 