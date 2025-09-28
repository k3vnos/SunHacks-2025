import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface ConfirmationScreenProps {
  onBack: () => void;
  onComplete: () => void;
  reportData: {
    id: string;
    title: string;
    description: string;
    images: string[];
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

export default function ConfirmationScreen({ onBack, onComplete, reportData }: ConfirmationScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState({
    latitude: reportData.latitude,
    longitude: reportData.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    // Animate the confirmation elements
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto navigate back after 2 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleBackToMap = () => {
    onBack();
  };

  const zoomIn = () => {
    if (mapRef.current && region) {
      const newLatitudeDelta = region.latitudeDelta * 0.5;
      const newLongitudeDelta = region.longitudeDelta * 0.5;
      
      // Prevent zooming in too much (minimum zoom level)
      if (newLatitudeDelta < 0.001) return;
      
      const newRegion = {
        ...region,
        latitudeDelta: newLatitudeDelta,
        longitudeDelta: newLongitudeDelta,
      };
      setRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  const zoomOut = () => {
    if (mapRef.current && region) {
      const newLatitudeDelta = region.latitudeDelta * 2;
      const newLongitudeDelta = region.longitudeDelta * 2;
      
      // Prevent zooming out too much (maximum zoom level)
      if (newLatitudeDelta > 0.5) return;
      
      const newRegion = {
        ...region,
        latitudeDelta: newLatitudeDelta,
        longitudeDelta: newLongitudeDelta,
      };
      setRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A202C" />
      
      {/* Success Banner */}
      <Animated.View 
        style={[
          styles.banner,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.bannerContent}>
          <Ionicons name="checkmark-circle" size={28} color="#27AE60" />
          <Text style={styles.bannerText}>Report Submitted Successfully!</Text>
        </View>
      </Animated.View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>FlagIt</Text>
        </View>

        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          mapType="standard"
        >
          {/* User Location Marker */}
          <Marker
            coordinate={{
              latitude: reportData.latitude,
              longitude: reportData.longitude,
            }}
            title="Your Location"
            description="You are here"
            pinColor="blue"
          />
          
          {/* New Report Marker */}
          <Marker
            coordinate={{
              latitude: reportData.latitude,
              longitude: reportData.longitude,
            }}
            title="New Report"
            description={reportData.title}
            pinColor="red"
          >
            <View style={styles.markerContainer}>
              <Ionicons name="flag" size={24} color="#E74C3C" />
            </View>
          </Marker>
        </MapView>

        {/* Flag Button - Centered Bottom */}
        <View style={styles.flagButtonContainer}>
          <TouchableOpacity style={styles.flagButton} onPress={handleBackToMap}>
            <Ionicons name="flag" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Zoom Controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity 
            style={[
              styles.zoomButton, 
              region.latitudeDelta <= 0.001 && styles.zoomButtonDisabled
            ]} 
            onPress={zoomIn}
            disabled={region.latitudeDelta <= 0.001}
          >
            <Ionicons 
              name="add" 
              size={24} 
              color={region.latitudeDelta <= 0.001 ? "#BDC3C7" : "#4A5568"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.zoomButton, 
              region.latitudeDelta >= 0.5 && styles.zoomButtonDisabled
            ]} 
            onPress={zoomOut}
            disabled={region.latitudeDelta >= 0.5}
          >
            <Ionicons 
              name="remove" 
              size={24} 
              color={region.latitudeDelta >= 0.5 ? "#BDC3C7" : "#4A5568"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Success Details Card */}
      <Animated.View 
        style={[
          styles.successCard,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="checkmark-circle" size={32} color="#27AE60" />
          <Text style={styles.cardTitle}>Report Submitted!</Text>
        </View>
        
        <Text style={styles.cardSubtext}>
          Your hazardous waste report has been submitted and is being reviewed. 
          You'll receive updates on the status of your report.
        </Text>
        
        <View style={styles.reportDetails}>
          <Text style={styles.reportId}>Report ID: {reportData.id}</Text>
          <Text style={styles.reportTitle}>Title: {reportData.title}</Text>
          <Text style={styles.reportTime}>
            Submitted: {new Date(reportData.timestamp).toLocaleString()}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.backButton} onPress={handleBackToMap}>
          <Text style={styles.backButtonText}>Back to Map</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A202C',
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#27AE60',
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  mapContainer: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 100 : 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#1A202C',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E74C3C',
  },
  flagButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  flagButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  zoomControls: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    flexDirection: 'column',
    gap: 8,
  },
  zoomButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  zoomButtonDisabled: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E9ECEF',
  },
  successCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 8,
  },
  cardSubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  reportDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  reportId: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 4,
    fontWeight: '500',
  },
  reportTitle: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 4,
    fontWeight: '600',
  },
  reportTime: {
    fontSize: 12,
    color: '#95A5A6',
    fontStyle: 'italic',
  },
  backButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
