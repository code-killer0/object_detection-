import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Alert, TouchableOpacity } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Play, Pause, AlertTriangle } from 'lucide-react-native';
import { locationService, LocationData } from '../../services/locationService';
import { potholeDetectionService } from '../../services/potholeDetectionService';
import { reportingService } from '../../services/reportingService';
import { notificationService } from '../../services/notificationService';
import Constants from 'expo-constants';

const DETECTION_INTERVAL = 2000;
const DISTANCE_THRESHOLD = 50;
const POTHOLE_THRESHOLD = 5;

export default function DetectorScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [potholeCount, setPotholeCount] = useState(0);
  const [intervalPotholeCount, setIntervalPotholeCount] = useState(0);
  const [distance, setDistance] = useState(0);
  const [intervalDistance, setIntervalDistance] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [deviceId] = useState(Constants.deviceId || `device_${Date.now()}`);

  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastReportDistanceRef = useRef(0);

  useEffect(() => {
    requestLocationPermission();
    registerDevice();
  }, []);

  const requestLocationPermission = async () => {
    const granted = await locationService.requestPermissions();
    setLocationPermission(granted);
  };

  const registerDevice = async () => {
    await notificationService.registerDevice(deviceId);
  };

  const startScanning = async () => {
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
      return;
    }

    if (!locationPermission) {
      Alert.alert('Permission Required', 'Location permission is required to track potholes.');
      return;
    }

    setIsScanning(true);
    locationService.resetDistance();
    setPotholeCount(0);
    setIntervalPotholeCount(0);
    setIntervalDistance(0);
    lastReportDistanceRef.current = 0;

    locationService.startTracking((location, totalDistance) => {
      setCurrentLocation(location);
      setDistance(totalDistance);
      setIntervalDistance(totalDistance - lastReportDistanceRef.current);

      notificationService.updateDeviceLocation(deviceId, location.latitude, location.longitude);
    });

    startDetection();
  };

  const stopScanning = () => {
    setIsScanning(false);
    locationService.stopTracking();
    stopDetection();
  };

  const startDetection = () => {
    if (Platform.OS === 'web') {
      detectionIntervalRef.current = setInterval(async () => {
        await performDetection();
      }, DETECTION_INTERVAL);
    } else {
      performDetection();
    }
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const performDetection = async () => {
    if (!isScanning || !currentLocation) return;

    try {
      const result = await potholeDetectionService.detectPothole('');

      if (result.hasPothole && result.confidence > 0.6) {
        const newPotholeCount = potholeCount + 1;
        const newIntervalCount = intervalPotholeCount + 1;

        setPotholeCount(newPotholeCount);
        setIntervalPotholeCount(newIntervalCount);

        await reportingService.logDetection(
          deviceId,
          currentLocation.latitude,
          currentLocation.longitude,
          result.confidence
        );

        if (intervalDistance >= DISTANCE_THRESHOLD) {
          if (newIntervalCount >= POTHOLE_THRESHOLD) {
            await handleThresholdExceeded(newIntervalCount);
          }

          setIntervalPotholeCount(0);
          setIntervalDistance(0);
          lastReportDistanceRef.current = distance;
        }
      }
    } catch (error) {
      console.error('Detection error:', error);
    }
  };

  const handleThresholdExceeded = async (count: number) => {
    if (!currentLocation) return;

    await reportingService.submitReport({
      deviceId,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      potholeCount: count,
      distanceCovered: distance,
    });

    await notificationService.notifyNearbyUsers(
      currentLocation.latitude,
      currentLocation.longitude,
      count
    );

    Alert.alert(
      'High Pothole Density',
      `Detected ${count} potholes in the last ${DISTANCE_THRESHOLD}m. Report sent to admin and nearby users notified.`
    );
  };

  if (!cameraPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required</Text>
        <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS !== 'web' && (
        <CameraView style={styles.camera} facing="back">
          <View style={styles.overlay}>
            <View style={styles.header}>
              <Text style={styles.appTitle}>PotholeGuardian</Text>
            </View>
          </View>
        </CameraView>
      )}

      {Platform.OS === 'web' && (
        <View style={styles.webPlaceholder}>
          <Camera size={80} color="#9ca3af" />
          <Text style={styles.webText}>Camera available on mobile devices</Text>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Potholes</Text>
          <Text style={styles.statValue}>{potholeCount}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Distance (m)</Text>
          <Text style={styles.statValue}>{distance.toFixed(0)}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Last 50m</Text>
          <Text style={[styles.statValue, intervalPotholeCount >= POTHOLE_THRESHOLD && styles.statWarning]}>
            {intervalPotholeCount}
          </Text>
        </View>
      </View>

      {intervalPotholeCount >= POTHOLE_THRESHOLD && (
        <View style={styles.warningBanner}>
          <AlertTriangle size={20} color="#ffffff" />
          <Text style={styles.warningText}>High pothole density detected!</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isScanning && styles.controlButtonActive]}
          onPress={isScanning ? stopScanning : startScanning}>
          {isScanning ? <Pause size={32} color="#ffffff" /> : <Play size={32} color="#ffffff" />}
        </TouchableOpacity>
        <Text style={styles.controlLabel}>{isScanning ? 'Stop Scanning' : 'Start Scanning'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  camera: {
    flex: 1,
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  webText: {
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  message: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  statWarning: {
    color: '#ef4444',
  },
  warningBanner: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  controlButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  controlButtonActive: {
    backgroundColor: '#dc2626',
  },
  controlLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
});
