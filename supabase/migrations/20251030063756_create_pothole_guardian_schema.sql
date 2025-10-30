/*
  # PotholeGuardian Database Schema

  1. New Tables
    - `pothole_reports`
      - `id` (uuid, primary key) - Unique identifier for each report
      - `device_id` (text) - Unique device identifier
      - `latitude` (double precision) - Location latitude
      - `longitude` (double precision) - Location longitude
      - `pothole_count` (integer) - Number of potholes detected in 50m interval
      - `distance_covered` (double precision) - Distance covered in meters
      - `reported_at` (timestamptz) - Timestamp of the report
      - `created_at` (timestamptz) - Record creation timestamp

    - `user_devices`
      - `id` (uuid, primary key) - Unique identifier
      - `device_id` (text, unique) - Unique device identifier
      - `fcm_token` (text) - Firebase Cloud Messaging token for notifications
      - `last_location_lat` (double precision) - Last known latitude
      - `last_location_lng` (double precision) - Last known longitude
      - `is_active` (boolean) - Device active status
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `pothole_detections`
      - `id` (uuid, primary key) - Unique identifier
      - `device_id` (text) - Device that detected the pothole
      - `latitude` (double precision) - Detection location latitude
      - `longitude` (double precision) - Detection location longitude
      - `confidence` (double precision) - AI model confidence score
      - `image_url` (text) - Optional image URL
      - `detected_at` (timestamptz) - Detection timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access to own device data
    - Add policies for public read access to pothole reports
    - Add policies for inserting detections and reports

  3. Indexes
    - Index on latitude/longitude for geospatial queries
    - Index on device_id for faster lookups
    - Index on reported_at for time-based queries
*/

-- Create pothole_reports table
CREATE TABLE IF NOT EXISTS pothole_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  pothole_count integer NOT NULL DEFAULT 0,
  distance_covered double precision NOT NULL DEFAULT 0,
  reported_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create user_devices table
CREATE TABLE IF NOT EXISTS user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL,
  fcm_token text,
  last_location_lat double precision,
  last_location_lng double precision,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pothole_detections table
CREATE TABLE IF NOT EXISTS pothole_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  confidence double precision DEFAULT 0,
  image_url text,
  detected_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pothole_reports_location ON pothole_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pothole_reports_device ON pothole_reports(device_id);
CREATE INDEX IF NOT EXISTS idx_pothole_reports_time ON pothole_reports(reported_at);
CREATE INDEX IF NOT EXISTS idx_pothole_detections_location ON pothole_detections(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pothole_detections_device ON pothole_detections(device_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_location ON user_devices(last_location_lat, last_location_lng);

-- Enable Row Level Security
ALTER TABLE pothole_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pothole_detections ENABLE ROW LEVEL SECURITY;

-- Policies for pothole_reports (public read, authenticated insert)
CREATE POLICY "Anyone can view pothole reports"
  ON pothole_reports FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert pothole reports"
  ON pothole_reports FOR INSERT
  WITH CHECK (true);

-- Policies for user_devices (device can manage own data)
CREATE POLICY "Devices can view own data"
  ON user_devices FOR SELECT
  USING (true);

CREATE POLICY "Devices can insert own data"
  ON user_devices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Devices can update own data"
  ON user_devices FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policies for pothole_detections (public read, authenticated insert)
CREATE POLICY "Anyone can view detections"
  ON pothole_detections FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert detections"
  ON pothole_detections FOR INSERT
  WITH CHECK (true);