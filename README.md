# EcoSteps - Gamified Eco-Friendly Transport App

EcoSteps is a React Native mobile app that incentivizes users to choose eco-friendly transport options through gamification. Users earn points for walking, cycling, or using public transport, which can be redeemed for real-world rewards.

## 🌟 Features

### Core Transport Modes
- **🚶 Walk on Foot** (10 points/km)
  - GPS route tracking with Google Maps
  - Real-time distance calculation
  - Live route visualization
  
- **🚲 Cycle** (8 points/km)
  - Find nearby bike rental stations
  - Route planning between stations
  - Station availability tracking

- **🚌 Public Transport** (4 points/km)
  - Route planning with multiple transport options
  - Mock ticket purchasing system
  - Journey optimization

### Gamification System
- **Points System**: Earn points based on distance and transport mode
- **Levels**: Progress through levels (100 points per level)
- **Achievements**: Unlock badges for various milestones
- **Environmental Impact**: Track CO₂ savings

### Rewards Program
- **Point Redemption**: Exchange points for discounts
- **Digital Vouchers**: QR codes for easy redemption
- **Multiple Categories**: Supermarket, transport, entertainment, food
- **Real-time Balance**: Track available and spent points

## 🛠 Technical Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Maps**: React Native Maps (with Google Maps integration)
- **Location**: Expo Location
- **Storage**: AsyncStorage (with optional Firebase backend)
- **UI**: Expo Linear Gradient, Vector Icons

## 📱 Screens

1. **Home Screen**: Transport mode selection and user stats
2. **Walk Screen**: GPS tracking with live map and route visualization
3. **Cycle Screen**: Bike station finder and route planning
4. **Transit Screen**: Public transport route planning and ticketing
5. **Profile Screen**: User stats, achievements, and progress tracking
6. **Rewards Screen**: Available rewards and redemption history
7. **Activity Completion**: Post-activity summary and points earned

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

### Installation

1. **Clone and Setup**
   ```bash
   cd EcoSteps
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Run on Platform**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web (for development)
   npm run web
   ```

### Configuration

#### Google Maps API (Required for full functionality)
1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps SDK for Android/iOS
   - Places API
   - Directions API
   - Distance Matrix API

3. Add your API key to the app configuration:
   ```javascript
   // src/services/locationService.ts
   const GOOGLE_MAPS_API_KEY = 'your-api-key-here';
   ```

#### Permissions
The app requires location permissions for GPS tracking:
- iOS: Configured in `app.json` infoPlist
- Android: Configured in `app.json` permissions array

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
│   ├── HomeScreen.tsx
│   ├── WalkScreen.tsx
│   ├── ProfileScreen.tsx
│   └── ...
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── store/             # Redux store and slices
│   ├── index.ts
│   └── slices/
│       ├── userSlice.ts
│       ├── activitySlice.ts
│       ├── rewardsSlice.ts
│       └── locationSlice.ts
├── services/          # External service integrations
│   └── locationService.ts
├── types/             # TypeScript type definitions
│   └── index.ts
└── utils/            # Utility functions
```

## 🎮 How to Use

### Starting an Activity
1. Open the app and select a transport mode from the home screen
2. For walking: Tap "Start Walking" to begin GPS tracking
3. For cycling: Choose a bike station and plan your route
4. For transit: Enter start/destination for route planning

### Earning Points
- **Walking**: 10 points per kilometer
- **Cycling**: 8 points per kilometer
- **Public Transport**: 4 points per kilometer

### Redeeming Rewards
1. Go to the Rewards tab
2. Browse available rewards
3. Tap "Redeem" on any reward you can afford
4. Use the generated voucher code at participating locations

## 🔮 Future Enhancements

### Planned Features
- **Social Integration**: Friend challenges and leaderboards
- **Carbon Footprint**: Detailed environmental impact tracking
- **Weather Integration**: Weather-based activity suggestions
- **Route Optimization**: AI-powered route recommendations
- **Wearable Support**: Apple Watch and fitness tracker integration

### Technical Improvements
- **Offline Mode**: Cache maps and allow offline tracking
- **Push Notifications**: Activity reminders and achievement alerts
- **Backend Integration**: User accounts and cloud synchronization
- **Real Payment**: Integrate with actual payment gateways
- **Analytics**: User behavior and app usage tracking

## 📊 Mock Data

The app currently uses mock data for:
- Bike station locations and availability
- Public transport routes and schedules
- Reward catalogs and discount codes
- Payment processing for tickets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Maps API for mapping and location services
- Expo team for the excellent React Native framework
- Contributors to the open-source libraries used

---

**Note**: This is a prototype/demo application. For production use, implement proper backend services, real payment processing, and actual reward partnerships. 