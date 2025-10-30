import { supabase } from '../lib/supabase';

export class NotificationService {
  async registerDevice(deviceId: string, fcmToken?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_devices')
        .upsert({
          device_id: deviceId,
          fcm_token: fcmToken || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'device_id',
        });

      if (error) {
        console.error('Error registering device:', error);
      }
    } catch (error) {
      console.error('Device registration failed:', error);
    }
  }

  async updateDeviceLocation(
    deviceId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_devices')
        .update({
          last_location_lat: latitude,
          last_location_lng: longitude,
          updated_at: new Date().toISOString(),
        })
        .eq('device_id', deviceId);

      if (error) {
        console.error('Error updating device location:', error);
      }
    } catch (error) {
      console.error('Location update failed:', error);
    }
  }

  async getNearbyDevices(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('device_id, fcm_token, last_location_lat, last_location_lng')
        .eq('is_active', true)
        .not('fcm_token', 'is', null);

      if (error) throw error;

      const nearbyDevices = data?.filter((device) => {
        if (!device.last_location_lat || !device.last_location_lng) return false;

        const distance = this.calculateDistance(
          latitude,
          longitude,
          device.last_location_lat,
          device.last_location_lng
        );

        return distance <= radiusKm * 1000;
      });

      return nearbyDevices?.map((d) => d.fcm_token!).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching nearby devices:', error);
      return [];
    }
  }

  async notifyNearbyUsers(
    latitude: number,
    longitude: number,
    potholeCount: number
  ): Promise<void> {
    try {
      const fcmTokens = await this.getNearbyDevices(latitude, longitude);

      if (fcmTokens.length === 0) {
        console.log('No nearby users to notify');
        return;
      }

      console.log(`Would notify ${fcmTokens.length} nearby users about ${potholeCount} potholes`);
    } catch (error) {
      console.error('Error notifying nearby users:', error);
    }
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
}

export const notificationService = new NotificationService();
