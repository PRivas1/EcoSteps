# Transit Stop Snapping Feature

## Overview
The TransitScreen now automatically snaps user-selected locations to the nearest public transit stops (bus, train, subway, tram, metro) for more realistic route planning. This ensures users start and end their journeys at actual transit stations rather than arbitrary map points.

## Core Functionality

### 🚏 **Automatic Location Snapping**
- **Map Clicks**: Automatically find nearest transit stop within 1km radius
- **Search Results**: Snap search results to closest transit stations  
- **Real Transit Stops**: Use actual OpenStreetMap public transport data
- **Multiple Options**: Show 5 nearest stops with alternatives

### 🗺️ **OpenStreetMap Integration**
- **Overpass API**: Query real-time transit stop data
- **Stop Types**: Bus stops, train stations, subway entrances, tram stops
- **Accurate Data**: Community-maintained, up-to-date information
- **Global Coverage**: Works worldwide where OSM data is available

## Technical Implementation

### Data Sources

#### **Overpass API Query**
```javascript
const overpassQuery = `
  [out:json][timeout:25];
  (
    node["public_transport"="stop_position"](around:${radius},${lat},${lng});
    node["railway"="station"](around:${radius},${lat},${lng});
    node["railway"="subway_entrance"](around:${radius},${lat},${lng});
    node["highway"="bus_stop"](around:${radius},${lat},${lng});
  );
  out geom;
`;
```

#### **Transit Stop Types**
- **🚌 Bus**: `highway=bus_stop`
- **🚂 Train**: `railway=station`
- **🚇 Subway**: `railway=subway_entrance`, `station=subway`
- **🚊 Tram**: `railway=tram_stop`
- **🚇 Metro**: Generic metro/underground systems

### Core Functions

#### **findNearbyTransitStops()**
```typescript
const findNearbyTransitStops = async (
  lat: number, 
  lng: number, 
  radius: number = 1000
): Promise<TransitStop[]> => {
  // Query Overpass API for transit stops
  // Parse and categorize stop types
  // Calculate distances from selected point
  // Return sorted list of 5 nearest stops
};
```

#### **snapToNearestStop()**
```typescript
const snapToNearestStop = async (
  lat: number, 
  lng: number, 
  isStart: boolean
) => {
  // Find nearby stops
  // Snap to closest station
  // Update location state
  // Display stop information
  // Show alternative options
};
```

#### **Distance Calculation**
```typescript
const calculateDistance = (lat1, lng1, lat2, lng2): number => {
  // Haversine formula for accurate distance calculation
  // Returns distance in meters
};
```

## User Experience

### 🎯 **Snapping Behavior**

#### **Map Interaction**
1. User taps anywhere on map
2. System queries nearby transit stops (1km radius)
3. Automatically snaps to nearest station
4. Updates input field with station name
5. Shows distance from original tap point

#### **Search Integration**
1. User searches for location
2. Selects result from autocomplete
3. System finds nearest transit stop to search result
4. Snaps to closest station
5. Provides feedback about snapping

### 📍 **Visual Feedback**

#### **Map Markers**
- **🟢 Start Station**: Green marker for departure point
- **🔴 Destination Station**: Red marker for arrival point
- **🟡 Alternative Stops**: Light-colored markers for other nearby options
- **📝 Stop Information**: Name, type, and distance in marker descriptions

#### **Loading States**
- **"Finding transit stops..."**: When querying Overpass API
- **"Calculating route..."**: When computing journey between stations
- **Visual indicators**: Activity spinners during API calls

#### **Information Display**
```jsx
// Instructions when no stops selected
🚏 Tap on the map or search to find your nearest transit stops
Locations will automatically snap to nearby bus/train/subway stations

// Info when stops are found
🎯 Snapped to nearest transit stops • Tap other markers to switch
```

### ⚠️ **Fallback Handling**

#### **No Stops Found**
```typescript
Alert.alert(
  'No Transit Stops Found',
  'No public transit stops found nearby. Using your selected location instead.',
  [{ text: 'OK' }]
);
```

#### **API Errors**
- Graceful error handling for Overpass API failures
- Fallback to original coordinates when transit data unavailable
- User-friendly error messages

## Enhanced Features

### 🚉 **Alternative Stop Selection**
- **Multiple Options**: Show 5 nearest stops as clickable markers
- **Easy Switching**: Tap any alternative marker to switch stations
- **Distance Information**: Display how far each stop is from original point
- **Stop Details**: Show station name and transit type

### 🛣️ **Route Planning Integration**
- **Station-to-Station**: Routes calculated between actual transit stops
- **Realistic Journeys**: Reflects real public transport connections
- **Route Type Detection**: Automatically set trip type based on selected stations

### 💾 **Data Persistence**
- **Route Type Tracking**: Save whether trip used bus, train, subway, etc.
- **Station Names**: Store actual station names in trip history
- **Location Accuracy**: Precise coordinates of transit stops

## Benefits

### 🎯 **Realism**
- **Actual Stations**: Users plan trips using real transit infrastructure
- **Practical Routes**: Journeys start/end where public transport is available
- **Accurate Timing**: Route calculations based on station-to-station connections

### 🗺️ **Data Quality**
- **Community Data**: OpenStreetMap provides accurate, up-to-date information
- **Global Coverage**: Works in cities worldwide with OSM transit data
- **Free Service**: No API costs for basic usage

### 📱 **User Experience**
- **Intelligent Snapping**: Automatically finds relevant transit stops
- **Visual Clarity**: Clear indication of selected vs alternative stations
- **Informed Decisions**: Users can see all nearby options before choosing

### 🔄 **Consistency**
- **Standardized Trips**: All transit journeys use actual infrastructure
- **Better Analytics**: Accurate data on which transit types are used
- **Environmental Impact**: More precise calculations of eco-friendly choices

## Implementation Details

### API Configuration
```typescript
interface TransitStop {
  id: string;           // Unique OSM node ID
  name: string;         // Station name or reference
  lat: number;          // Latitude coordinate
  lng: number;          // Longitude coordinate  
  type: 'subway' | 'train' | 'bus' | 'tram' | 'metro';
  distance?: number;    // Distance from selected point (meters)
}
```

### State Management
```typescript
// Transit stop states
const [nearbyStartStops, setNearbyStartStops] = useState<TransitStop[]>([]);
const [nearbyEndStops, setNearbyEndStops] = useState<TransitStop[]>([]);
const [isLoadingStops, setIsLoadingStops] = useState(false);
```

### Error Handling
- **Network Failures**: Graceful degradation when Overpass API unavailable
- **Empty Results**: Fallback to original coordinates when no stops found
- **Invalid Data**: Robust parsing of OSM response data
- **Timeout Handling**: 25-second timeout for Overpass queries

This implementation provides a realistic, user-friendly transit planning experience that connects users with actual public transportation infrastructure while maintaining the app's focus on eco-friendly travel choices. 