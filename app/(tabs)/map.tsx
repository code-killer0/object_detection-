import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { MapPin, Navigation, RefreshCw } from 'lucide-react-native';
import { reportingService } from '../../services/reportingService';
import { locationService } from '../../services/locationService';
import { PotholeReport } from '../../lib/supabase';

export default function MapScreen() {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      setCurrentLat(location.latitude);
      setCurrentLng(location.longitude);
      loadNearbyReports(location.latitude, location.longitude);
    }
  };

  const loadNearbyReports = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const nearbyReports = await reportingService.getNearbyReports(lat, lng, 10);
      setReports(nearbyReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (currentLat && currentLng) {
      loadNearbyReports(currentLat, currentLng);
    } else {
      loadCurrentLocation();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDistance = (lat: number, lng: number) => {
    if (!currentLat || !currentLng) return null;
    const distance = locationService.calculateDistanceBetween(currentLat, currentLng, lat, lng);
    return (distance / 1000).toFixed(2);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Pothole Map</Text>
          <Text style={styles.subtitle}>Reports within 10km radius</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <RefreshCw size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {Platform.OS === 'web' && (
        <View style={styles.webNotice}>
          <Navigation size={20} color="#6b7280" />
          <Text style={styles.webNoticeText}>Map view is optimized for mobile devices</Text>
        </View>
      )}

      {currentLat && currentLng && (
        <View style={styles.locationCard}>
          <MapPin size={20} color="#2563eb" />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Your Location</Text>
            <Text style={styles.locationCoords}>
              {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
            </Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.reportsList}>
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        )}

        {!loading && reports.length === 0 && (
          <View style={styles.emptyContainer}>
            <MapPin size={48} color="#6b7280" />
            <Text style={styles.emptyText}>No pothole reports nearby</Text>
            <Text style={styles.emptySubtext}>Start scanning to contribute data</Text>
          </View>
        )}

        {!loading &&
          reports.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportBadge}>
                  <MapPin size={16} color="#ffffff" />
                  <Text style={styles.reportBadgeText}>{report.pothole_count} potholes</Text>
                </View>
                {calculateDistance(report.latitude, report.longitude) && (
                  <Text style={styles.distanceText}>
                    {calculateDistance(report.latitude, report.longitude)} km away
                  </Text>
                )}
              </View>

              <View style={styles.reportDetails}>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Location:</Text>
                  <Text style={styles.reportValue}>
                    {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                  </Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Distance Covered:</Text>
                  <Text style={styles.reportValue}>{report.distance_covered.toFixed(0)}m</Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Reported:</Text>
                  <Text style={styles.reportValue}>{formatDate(report.reported_at)}</Text>
                </View>
              </View>
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  webNoticeText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  reportsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 8,
  },
  reportCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  reportBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  distanceText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  reportDetails: {
    gap: 8,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportLabel: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '500',
  },
  reportValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
