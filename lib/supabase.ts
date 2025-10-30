import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PotholeReport = {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  pothole_count: number;
  distance_covered: number;
  reported_at: string;
  created_at: string;
};

export type UserDevice = {
  id: string;
  device_id: string;
  fcm_token: string | null;
  last_location_lat: number | null;
  last_location_lng: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PotholeDetection = {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  confidence: number;
  image_url: string | null;
  detected_at: string;
};
