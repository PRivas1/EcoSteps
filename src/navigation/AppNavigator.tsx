import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import HomeScreen from '../screens/HomeScreen';
import WalkScreen from '../screens/WalkScreen';
import CycleScreen from '../screens/CycleScreen';
import TransitScreen from '../screens/TransitScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RewardsScreen from '../screens/RewardsScreen';
import ActivityCompletionScreen from '../screens/ActivityCompletionScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Walk: undefined;
  Cycle: undefined;
  Transit: undefined;
  ActivityCompletion: {
    activityId: string;
    mode: 'walk' | 'cycle' | 'transit';
    distance: number;
    points: number;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
  Rewards: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Rewards') {
            iconName = focused ? 'gift' : 'gift-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4ECDC4',
        tabBarInactiveTintColor: '#95A5A6',
        tabBarStyle: {
          ...styles.tabBar,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom - 10, 5) : 5,
          height: Platform.OS === 'ios' ? 60 + Math.max(insets.bottom - 10, 0) : 60,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          headerShown: false,
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          headerShown: false,
        }} 
      />
      <Tab.Screen 
        name="Rewards" 
        component={RewardsScreen} 
        options={{ 
          headerShown: false,
        }} 
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Walk" 
          component={WalkScreen} 
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="Cycle" 
          component={CycleScreen} 
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="Transit" 
          component={TransitScreen} 
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="ActivityCompletion" 
          component={ActivityCompletionScreen} 
          options={{ 
            title: 'Activity Complete!',
            headerBackTitle: 'Done',
            gestureEnabled: false,
          }}
        />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

});

export default AppNavigator; 