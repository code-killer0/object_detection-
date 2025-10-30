import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';

export interface ReportData {
  deviceId: string;
  latitude: number;
  longitude: number;
  potholeCount: number;
  distanceCovered: number;
}

export class ReportingService {
  private adminPortalUrl: string = 'https://api.potholeguardian.com/report';

  async submitReport(data: ReportData): Promise<boolean> {
    try {
      const { error: dbError } = await supabase
        .from('pothole_reports')
        .insert({
          device_id: data.deviceId,
          latitude: data.latitude,
          longitude: data.longitude,
          pothole_count: data.potholeCount,
          distance_covered: data.distanceCovered,
          reported_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error('Database insert error:', dbError);
      }

      await this.sendToAdminPortal(data);

      return true;
    } catch (error) {
      console.error('Error submitting report:', error);
      return false;
    }
  }

  private async sendToAdminPortal(data: ReportData): Promise<void> {
    try {
      const response = await fetch(this.adminPortalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
          potholeCount: data.potholeCount,
          timestamp: new Date().toISOString(),
          deviceId: data.deviceId,
          distanceCovered: data.distanceCovered,
        }),
      });

      if (!response.ok) {
        console.warn('Admin portal notification failed:', response.status);
      }
    } catch (error) {
      console.warn('Admin portal not reachable:', error);
    }
  }

  async logDetection(
    deviceId: string,
    latitude: number,
    longitude: number,
    confidence: number
  ): Promise<void> {
    try {
      await supabase.from('pothole_detections').insert({
        device_id: deviceId,
        latitude,
        longitude,
        confidence,
        detected_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging detection:', error);
    }
  }

  async getNearbyReports(latitude: number, longitude: number, radiusKm: number = 5) {
    try {
      const { data, error } = await supabase
        .from('pothole_reports')
        .select('*')
        .order('reported_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const filtered = data?.filter((report) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          report.latitude,
          report.longitude
        );
        return distance <= radiusKm * 1000;
      });

      return filtered || [];
    } catch (error) {
      console.error('Error fetching nearby reports:', error);
      return [];
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

  setAdminPortalUrl(url: string) {
    this.adminPortalUrl = url;
  }
}

export const reportingService = new ReportingService();
