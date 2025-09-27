export interface IndegoStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  totalDocks: number;
  hasKiosk: boolean;
  distance?: number; // distance from selected point in meters
}

class IndegoService {
  private static instance: IndegoService;
  private stations: IndegoStation[] = [];
  private isLoaded = false;

  static getInstance(): IndegoService {
    if (!IndegoService.instance) {
      IndegoService.instance = new IndegoService();
    }
    return IndegoService.instance;
  }

  async loadStations(): Promise<IndegoStation[]> {
    if (this.isLoaded && this.stations.length > 0) {
      return this.stations;
    }

    try {
      // In a real app, you'd load this from a bundled asset or API
      // For now, we'll use the hardcoded data from the CSV
      const csvData = await this.loadIndegoData();
      this.stations = this.parseCSV(csvData);
      this.isLoaded = true;
      console.log(`Loaded ${this.stations.length} Indego stations`);
      return this.stations;
    } catch (error) {
      console.error('Error loading Indego stations:', error);
      return [];
    }
  }

  private async loadIndegoData(): Promise<string> {
    // In a real implementation, you would:
    // 1. Bundle the CSV with the app using expo-asset
    // 2. Load from a remote API
    // 3. Use react-native-fs to read local files
    
    // For now, return a subset of the CSV data as a string
    return `Station_ID,Station_Name,Latitude,Longitude,Address,Total_Docks,Has_Kiosk
3004,Municipal Services Building,39.95378,-75.16374,1401 John F Kennedy Blvd,30,True
3005,11th & Pine,39.945731,-75.160171,11th & Pine St,19,True
3006,4th & Walnut,39.94759,-75.14811,4th & Walnut St,19,True
3007,13th & Market,39.95254,-75.16238,13th & Market St,21,True
3008,Temple University - TECH Center,39.981872,-75.155449,12th & Montgomery Ave,35,True
3009,12th & Washington,39.938099,-75.16235,12th & Washington Ave,23,True
3010,13th & Locust,39.94781,-75.16248,13th & Locust St,27,True
3011,10th & Federal,39.93489,-75.16112,10th & Federal St,24,True
3012,20th & Market,39.95325,-75.17333,20th & Market St,33,True
3013,16th & Jackson,39.92723,-75.17144,16th & Jackson St,16,True
3014,City Hall N Portal,39.95276,-75.16335,1400 John F Kennedy Blvd,22,True
3015,19th & Lombard,39.94639,-75.17248,19th & Lombard St,19,True
3016,21st & Winter,39.95855,-75.17399,21st & Winter St,18,True
3017,11th & South,39.94318,-75.16016,11th & South St,19,True
3018,University City Station,39.95473,-75.19131,3001 Market St,34,True
3019,23rd & South,39.94435,-75.17935,23rd & South St,22,True
3020,38th & Market,39.95663,-75.19835,38th & Market St,28,True
3021,2nd & Market,39.95011,-75.14392,2nd & Market St,19,True
3022,23rd & Fairmount,39.96644,-75.17599,23rd & Fairmount Ave,23,True
3023,Boat House Row,39.96906,-75.18189,2500 Kelly Dr,19,True
3024,19th & Fairmount,39.96662,-75.17182,19th & Fairmount Ave,19,True
3025,7th & Spring Garden,39.96191,-75.14932,7th & Spring Garden St,19,True
3026,5th & Market,39.95134,-75.14553,5th & Market St,19,True
3027,8th & Market,39.95134,-75.1524,8th & Market St,23,True
3028,10th & Market,39.95134,-75.15873,10th & Market St,19,True
3029,15th & Market,39.95254,-75.16668,15th & Market St,19,True
3030,18th & Market,39.95264,-75.17115,18th & Market St,19,True
3031,22nd & Market,39.95325,-75.17599,22nd & Market St,19,True
3032,30th & Market,39.95492,-75.18208,30th & Market St,19,True
3033,34th & Market,39.95552,-75.18829,34th & Market St,19,True
3034,36th & Market,39.95602,-75.1916,36th & Market St,19,True
3035,40th & Market,39.95713,-75.20163,40th & Market St,19,True
3036,15th & Spruce,39.94645,-75.16668,15th & Spruce St,19,True
3037,Broad & Pine,39.94577,-75.16281,Broad & Pine St,19,True
3038,20th & Pine,39.94632,-75.17332,20th & Pine St,19,True
3039,University City - Drexel,39.95552,-75.18957,32nd & Market St,19,True
3040,Penn Medicine - 800 Walnut,39.94759,-75.15873,8th & Walnut St,19,True`;
  }

  private parseCSV(csvData: string): IndegoStation[] {
    const lines = csvData.split('\n');
    const stations: IndegoStation[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(',');
      if (columns.length >= 7) {
        stations.push({
          id: columns[0],
          name: columns[1],
          latitude: parseFloat(columns[2]),
          longitude: parseFloat(columns[3]),
          address: columns[4],
          totalDocks: parseInt(columns[5]),
          hasKiosk: columns[6].toLowerCase() === 'true',
        });
      }
    }

    return stations;
  }

  async findNearestStations(lat: number, lng: number, limit: number = 5): Promise<IndegoStation[]> {
    const stations = await this.loadStations();
    
    // Calculate distances and sort
    const stationsWithDistance = stations.map(station => ({
      ...station,
      distance: this.calculateDistance(lat, lng, station.latitude, station.longitude),
    }));

    return stationsWithDistance
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  async getAllStations(): Promise<IndegoStation[]> {
    return this.loadStations();
  }

  getStationById(id: string): IndegoStation | undefined {
    return this.stations.find(station => station.id === id);
  }
}

export default IndegoService; 