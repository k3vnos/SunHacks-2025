import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Alert,
  Pressable,
  Text,
  StatusBar,
  Image,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Hazard {
  id: string;
  title: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface MapScreenProps {
  onFlagPress: () => void;
  hazards: Hazard[];
}

export default function MapScreen({ onFlagPress, hazards }: MapScreenProps) {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [showHazardModal, setShowHazardModal] = useState(false);

  useEffect(() => {
    (async () => {
      // Ask location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to show your position.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const initial = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(initial);
      setHasLocation(true);
    })();
  }, []);

  const recenter = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(next);
      if (mapRef.current) {
        mapRef.current.animateToRegion(next, 600);
      }
    } catch (e) {
      Alert.alert('Location error', 'Could not get current location.');
    }
  };

  const takePhoto = async () => {
    // Ask camera permission then open camera
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!camPerm.granted) {
      Alert.alert('Permission needed', 'Camera permission is required to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled) {
      // You now have result.assets[0].uri
      Alert.alert('Photo captured', result.assets?.[0]?.uri ?? 'Photo saved');
      // TODO: upload to S3 or send to your API
    }
  };

  const handleMarkerPress = (hazard: Hazard) => {
    setSelectedHazard(hazard);
    setShowHazardModal(true);
  };

  const closeHazardModal = () => {
    setShowHazardModal(false);
    setSelectedHazard(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with FlagIt Logo */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/FlagIt_Logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Map */}
      {region && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={hasLocation}
          showsMyLocationButton={false}
          initialRegion={region}
          onMapReady={recenter}
          mapType="standard"
        >
          {/* Hazard Markers */}
          {hazards.map((hazard) => (
            <Marker
              key={hazard.id}
              coordinate={{
                latitude: hazard.latitude,
                longitude: hazard.longitude,
              }}
              onPress={() => handleMarkerPress(hazard)}
            >
              <View style={styles.markerContainer}>
                <Ionicons name="flag" size={24} color="#E74C3C" />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Flag Button - Main Action */}
      <Pressable style={styles.flagBtn} onPress={onFlagPress}>
        <Ionicons name="flag" size={32} color="#FFFFFF" />
      </Pressable>

      {/* Recenter Button */}
      <Pressable style={styles.recenterBtn} onPress={recenter}>
        <Ionicons name="locate" size={20} color="#2C3E50" />
      </Pressable>

      {/* Hazard Details Modal */}
      <Modal
        visible={showHazardModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeHazardModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedHazard && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedHazard.title}</Text>
                  <Pressable onPress={closeHazardModal} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#666666" />
                  </Pressable>
                </View>
                
                <Text style={styles.modalDescription}>{selectedHazard.description}</Text>
                
                {selectedHazard.images.length > 0 && (
                  <View style={styles.imageContainer}>
                    <Text style={styles.imageLabel}>Attached Images:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {selectedHazard.images.map((imageUri, index) => (
                        <Image
                          key={index}
                          source={{ uri: imageUri }}
                          style={styles.hazardImage}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                <Text style={styles.timestamp}>
                  Reported: {new Date(selectedHazard.timestamp).toLocaleDateString()}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  logo: {
    height: 40,
    width: 120,
  },
  flagBtn: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  recenterBtn: {
    position: 'absolute',
    right: 20,
    bottom: 120,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    maxHeight: height * 0.7,
    width: width - 40,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 16,
    color: '#7F8C8D',
    lineHeight: 22,
    marginBottom: 16,
  },
  imageContainer: {
    marginBottom: 16,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  hazardImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    resizeMode: 'cover',
  },
  timestamp: {
    fontSize: 12,
    color: '#95A5A6',
    fontStyle: 'italic',
  },
});
