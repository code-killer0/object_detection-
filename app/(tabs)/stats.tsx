import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { BarChart3, TrendingUp, MapPin, Settings } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { potholeDetectionService } from '../../services/potholeDetectionService';
import { reportingService } from '../../services/reportingService';

export default function StatsScreen() {
  const [totalReports, setTotalReports] = useState(0);
  const [totalPotholes, setTotalPotholes] = useState(0);
  const [totalDetections, setTotalDetections] = useState(0);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [adminPortalUrl, setAdminPortalUrl] = useState('https://api.potholeguardian.com/report');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const { data: reports, error: reportsError } = await supabase
        .from('pothole_reports')
        .select('pothole_count');

      if (!reportsError && reports) {
        setTotalReports(reports.length);
        const total = reports.reduce((sum, report) => sum + report.pothole_count, 0);
        setTotalPotholes(total);
      }

      const { data: detections, error: detectionsError } = await supabase
        .from('pothole_detections')
        .select('id');

      if (!detectionsError && detections) {
        setTotalDetections(detections.length);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleSaveApiEndpoint = () => {
    if (apiEndpoint.trim()) {
      potholeDetectionService.setApiEndpoint(apiEndpoint.trim());
      setShowSettings(false);
    }
  };

  const handleSaveAdminUrl = () => {
    if (adminPortalUrl.trim()) {
      reportingService.setAdminPortalUrl(adminPortalUrl.trim());
      setShowSettings(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Statistics</Text>
          <Text style={styles.subtitle}>Community pothole data</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(!showSettings)}>
          <Settings size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showSettings && (
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>API Configuration</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pothole Detection API Endpoint</Text>
              <TextInput
                style={styles.input}
                value={apiEndpoint}
                onChangeText={setApiEndpoint}
                placeholder="https://api.example.com/detect"
                placeholderTextColor="#6b7280"
              />
              <Text style={styles.inputHint}>
                Leave empty to use mock detection (demo mode)
              </Text>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveApiEndpoint}>
                <Text style={styles.saveButtonText}>Save Detection API</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Admin Portal URL</Text>
              <TextInput
                style={styles.input}
                value={adminPortalUrl}
                onChangeText={setAdminPortalUrl}
                placeholder="https://api.potholeguardian.com/report"
                placeholderTextColor="#6b7280"
              />
              <Text style={styles.inputHint}>
                URL where reports will be sent to admin
              </Text>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveAdminUrl}>
                <Text style={styles.saveButtonText}>Save Admin URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <BarChart3 size={32} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>{totalReports}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MapPin size={32} color="#dc2626" />
            </View>
            <Text style={styles.statValue}>{totalPotholes}</Text>
            <Text style={styles.statLabel}>Potholes Found</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={32} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{totalDetections}</Text>
            <Text style={styles.statLabel}>Total Detections</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About PotholeGuardian</Text>
          <Text style={styles.infoText}>
            PotholeGuardian is a community-driven app that uses AI to detect potholes in real-time.
            Together, we make roads safer by reporting road hazards to authorities and alerting nearby drivers.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Real-time AI pothole detection</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>GPS tracking and distance measurement</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Automatic alerts to nearby users</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Direct reporting to admin portal</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Community-driven map view</Text>
            </View>
          </View>
        </View>

        <View style={styles.thresholdCard}>
          <Text style={styles.thresholdTitle}>Alert Thresholds</Text>
          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Distance Interval:</Text>
            <Text style={styles.thresholdValue}>50 meters</Text>
          </View>
          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Pothole Threshold:</Text>
            <Text style={styles.thresholdValue}>5 potholes</Text>
          </View>
          <Text style={styles.thresholdDescription}>
            When more than 5 potholes are detected within 50 meters, an alert is sent to the admin
            portal and nearby users are notified.
          </Text>
        </View>
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingsCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb',
  },
  featureText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  thresholdCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
  },
  thresholdTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  thresholdLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  thresholdValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  thresholdDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
});
