import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export class LocationService {
  private lastLocation: LocationData | null = null;
  private totalDistance: number = 0;
  private subscription: Location.LocationSubscription | null = null;

  async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  startTracking(callback: (location: LocationData, distance: number) => void) {
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (location) => {
        const newLocation: LocationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        };

        if (this.lastLocation) {
          const distance = this.calculateDistance(
            this.lastLocation.latitude,
            this.lastLocation.longitude,
            newLocation.latitude,
            newLocation.longitude
          );
          this.totalDistance += distance;
        }

        this.lastLocation = newLocation;
        callback(newLocation, this.totalDistance);
      }
    ).then((sub) => {
      this.subscription = sub;
    });
  }

  stopTracking() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }

  resetDistance() {
    this.totalDistance = 0;
    this.lastLocation = null;
  }

  getTotalDistance(): number {
    return this.totalDistance;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  calculateDistanceBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return this.calculateDistance(lat1, lon1, lat2, lon2);
  }
}

export const locationService = new LocationService();
