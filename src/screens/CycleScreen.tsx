import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CycleScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🚲 Cycle Mode</Text>
        <Text style={styles.subtitle}>Feature coming soon!</Text>
        <Text style={styles.description}>
          Find nearby bike stations and plan your cycling route.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
  },
});

export default CycleScreen; 