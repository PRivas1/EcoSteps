import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const TransitScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🚌 Public Transport</Text>
        <Text style={styles.subtitle}>Feature coming soon!</Text>
        <Text style={styles.description}>
          Plan your journey with buses and trains, purchase tickets, and earn points.
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

export default TransitScreen; 