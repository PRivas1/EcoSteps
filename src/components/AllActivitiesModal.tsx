import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WalkHistoryEntry, TransitHistoryEntry, CyclingHistoryEntry } from '../services/firebaseService';

const { width } = Dimensions.get('window');

interface AllActivitiesModalProps {
  visible: boolean;
  onClose: () => void;
  walkHistory: WalkHistoryEntry[];
  transitHistory: TransitHistoryEntry[];
  cyclingHistory: CyclingHistoryEntry[];
  onActivityPress: (activity: any) => void;
}

const AllActivitiesModal: React.FC<AllActivitiesModalProps> = ({
  visible,
  onClose,
  walkHistory,
  transitHistory,
  cyclingHistory,
  onActivityPress,
}) => {
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

  // Combine and sort all activities by date (latest first)
  const allActivities = [
    ...walkHistory.map(walk => ({ ...walk, type: 'walk' as const })),
    ...transitHistory.map(transit => ({ ...transit, type: 'transit' as const })),
    ...cyclingHistory.map(cycling => ({ ...cycling, type: 'cycling' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>All Activities</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#2C3E50" />
          </TouchableOpacity>
        </View>

        {/* Activities List */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.totalText}>
              Total: {allActivities.length} activities
            </Text>

            {allActivities.length > 0 ? (
              allActivities.map((activity, index) => (
                <TouchableOpacity 
                  key={`${activity.type}-${activity.id}-${index}`} 
                  style={styles.activityCard}
                  onPress={() => onActivityPress(activity)}
                  activeOpacity={0.7}
                >
                  <View style={styles.activityHeader}>
                    <View style={styles.activityIcon}>
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
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityDate}>{formatDate(activity.createdAt)}</Text>
                      <Text style={styles.activityTime}>
                        {activity.type === 'walk' ? 'Walking' : 
                         activity.type === 'cycling' ? 'Cycling' : 'Public Transit'} • {formatDuration(activity.duration)}
                      </Text>
                    </View>
                    <View style={styles.activityStats}>
                      <Text style={styles.activityDistance}>{activity.distance.toFixed(2)} km</Text>
                      <Text style={styles.activityPoints}>+{activity.points} pts</Text>
                    </View>
                    <View style={styles.chevronIcon}>
                      <Ionicons name="chevron-forward" size={16} color="#BDC3C7" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  totalText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 20,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  activityStats: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  activityDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  activityPoints: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  chevronIcon: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AllActivitiesModal; 