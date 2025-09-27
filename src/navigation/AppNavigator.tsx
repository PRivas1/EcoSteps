import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

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
        tabBarStyle: styles.tabBar,
        headerStyle: styles.header,
        headerTintColor: '#2C3E50',
        headerTitleStyle: styles.headerTitle,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'EcoSteps',
          headerTitleAlign: 'center',
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Profile',
          headerTitleAlign: 'center',
        }} 
      />
      <Tab.Screen 
        name="Rewards" 
        component={RewardsScreen} 
        options={{ 
          title: 'Rewards',
          headerTitleAlign: 'center',
        }} 
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: styles.header,
          headerTintColor: '#2C3E50',
          headerTitleStyle: styles.headerTitle,
          headerTitleAlign: 'center',
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
            title: '🚶 Walking',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen 
          name="Cycle" 
          component={CycleScreen} 
          options={{ 
            title: '🚲 Cycling',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen 
          name="Transit" 
          component={TransitScreen} 
          options={{ 
            title: '🚌 Public Transport',
            headerBackTitle: 'Back',
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
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingBottom: 5,
    paddingTop: 5,
    height: 60,
  },
  header: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default AppNavigator; 