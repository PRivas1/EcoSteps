# Public Transit Feature

## Overview
The TransitScreen provides a comprehensive public transit planning interface using OpenStreetMap (OSM) data and free, open-source APIs. Users can search for locations, plan routes, and earn points for using eco-friendly public transportation.

## Core Features

### 📍 **Location Search & Selection**
- **Dual Input Fields**: Start and destination location search
- **Autocomplete**: Powered by Nominatim API (OpenStreetMap's geocoding service)
- **Interactive Map Selection**: Click on map to set start/destination
- **Smart Behavior**: 
  - First click = start location (green marker)
  - Second click = destination (red marker)
  - Third click = resets to new start location

### 🗺️ **OpenStreetMap Integration**
- **OSM Tiles**: Uses OpenStreetMap as the tile provider
- **Interactive Map**: Full zoom, pan, and click functionality
- **User Location**: Shows current position with location button
- **Markers**: Color-coded pins (green=start, red=destination)
- **Route Visualization**: Dashed polyline showing the planned route

### 🛣️ **Route Planning & Navigation**
- **OSRM Routing**: Uses Open Source Routing Machine API
- **Real-time Calculation**: Automatic route calculation when both locations are set
- **Route Details**: Distance, estimated travel time, and points calculation
- **Route Visualization**: Interactive polyline on the map

### 🎯 **Gamification & Points**
- **Points System**: 4 points per kilometer for public transit
- **Activity Completion**: Integration with existing completion flow
- **Progress Tracking**: Seamless integration with user stats and Firebase

## Technical Implementation

### APIs Used

#### 1. **Nominatim API** (Geocoding)
```javascript
// Location search with autocomplete
const searchLocation = async (query: string) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
  );
  return response.json();
};
```

#### 2. **OSRM API** (Routing)
```javascript
// Route calculation
const fetchRoute = async (start, destination) => {
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
  );
  return response.json();
};
```

### Map Integration

#### **React Native Maps**
```jsx
<MapView
  style={styles.map}
  region={mapRegion}
  onPress={handleMapPress}
  provider={PROVIDER_DEFAULT}
  mapType="standard"
  showsUserLocation={true}
  showsMyLocationButton={true}
>
  {/* Markers for start/destination */}
  {/* Polyline for route */}
</MapView>
```

#### **OpenStreetMap Configuration**
- **Tile Provider**: Default OSM tiles
- **Map Type**: Standard view
- **User Controls**: Zoom, pan, location button
- **Interaction**: Tap to place markers

### State Management

#### **Location States**
```typescript
const [startLocation, setStartLocation] = useState<{lat: number, lng: number} | null>(null);
const [destinationLocation, setDestinationLocation] = useState<{lat: number, lng: number} | null>(null);
const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
```

#### **Search States**
```typescript
const [startInput, setStartInput] = useState('');
const [destinationInput, setDestinationInput] = useState('');
const [startSuggestions, setStartSuggestions] = useState<LocationSuggestion[]>([]);
const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
```

#### **Route States**
```typescript
const [routeData, setRouteData] = useState<RouteData | null>(null);
const [isLoadingRoute, setIsLoadingRoute] = useState(false);
const [mapRegion, setMapRegion] = useState({...});
```

## User Interface

### 🔍 **Search Interface**
- **Top Search Bar**: Two input fields for start and destination
- **Icons**: Green dot for start, red location pin for destination
- **Clear Buttons**: Individual clear buttons for each input
- **Clear All**: Button to reset everything
- **Autocomplete Dropdown**: Shows location suggestions below inputs

### 🗺️ **Map Display**
- **Full Screen**: Map takes up most of the screen real estate
- **Interactive Elements**:
  - Zoom controls
  - User location button
  - Tap to select locations
  - Route polyline with dashed pattern

### 📊 **Route Information Panel**
When route is calculated, a bottom panel shows:
- **Distance**: Formatted in km/meters
- **Estimated Time**: Hours and minutes
- **Points**: Calculated at 4 points per km
- **Confirm Button**: Proceeds to activity completion

### 💡 **User Guidance**
- **Instructions Overlay**: Helpful text when no locations are set
- **Loading States**: Visual feedback during route calculation
- **Error Handling**: Graceful handling of API failures

## User Flow

### 1. **Initial State**
```
User opens Transit screen
↓
Map centers on user's current location
↓
Instructions overlay shows: "Tap on map or search to set locations"
```

### 2. **Location Selection**
```
User searches or taps map
↓
Start location set (green marker appears)
↓
User sets destination (red marker appears)
↓
Route automatically calculated
```

### 3. **Route Planning**
```
OSRM API calculates route
↓
Polyline drawn on map
↓
Info panel shows distance, time, points
↓
Map adjusts to show both locations
```

### 4. **Trip Confirmation**
```
User reviews route information
↓
Taps "Confirm Trip" button
↓
Navigates to ActivityCompletion screen
↓
Points awarded and stats updated
```

## API Specifications

### **Nominatim API Response**
```json
{
  "place_id": "123456789",
  "display_name": "Main Street, City, Country",
  "lat": "40.7128",
  "lon": "-74.0060",
  "type": "way",
  "importance": 0.75
}
```

### **OSRM API Response**
```json
{
  "routes": [{
    "distance": 5420.3,
    "duration": 1234.5,
    "geometry": {
      "coordinates": [[-74.0060, 40.7128], [-74.0050, 40.7130]],
      "type": "LineString"
    }
  }]
}
```

## Styling & Design

### **Color Scheme**
- **Primary**: #4ECDC4 (app brand color)
- **Success**: #27AE60 (start location)
- **Error**: #E74C3C (destination location)
- **Text**: #2C3E50 (primary text)
- **Secondary**: #7F8C8D (secondary text)

### **Component Styling**
- **Search Inputs**: Rounded corners, subtle borders, icon integration
- **Map**: Full-width with rounded corners for overlays
- **Info Panel**: Gradient background with rounded top corners
- **Buttons**: Gradient backgrounds with proper touch feedback

## Benefits

### 🌍 **Environmental Impact**
- **Encourages Public Transit**: Makes planning easy and rewarding
- **Gamification**: Points system motivates eco-friendly choices
- **Awareness**: Shows route options and travel times

### 🆓 **Cost-Effective Implementation**
- **Free APIs**: No API costs for basic usage
- **Open Source**: OSM data is community-maintained
- **No Vendor Lock-in**: Can switch providers easily

### 📱 **User Experience**
- **Intuitive Interface**: Clear, easy-to-use design
- **Offline Capability**: OSM tiles can be cached
- **Performance**: Fast route calculation with OSRM
- **Accessibility**: Large touch targets and clear labels

### 🔄 **Integration**
- **Seamless Flow**: Integrates with existing activity tracking
- **Consistent UI**: Matches app's design language
- **Local-First**: Works with existing sync infrastructure

## Future Enhancements

### **Phase 2 Features**
- **Real-time Transit Data**: Integration with GTFS feeds
- **Multi-modal Routing**: Walking + transit combinations
- **Offline Maps**: Downloaded OSM tiles for offline use
- **Route Alternatives**: Multiple route options
- **Live Updates**: Real-time delays and disruptions

### **Advanced Features**
- **Transit Tickets**: Mock ticket purchasing
- **Schedule Integration**: Real bus/train timetables
- **Carbon Footprint**: CO₂ savings calculations
- **Social Features**: Share routes with friends
- **Favorites**: Save frequently used routes

This implementation provides a solid foundation for public transit planning while maintaining the app's eco-friendly mission and gamification elements. 