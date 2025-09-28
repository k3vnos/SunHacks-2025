import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Platform, Alert, Pressable } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

export default function App() {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    (async () => {
      // Ask location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Location permission is required to show your position.");
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
      Alert.alert("Location error", "Could not get current location.");
    }
  };

  const takePhoto = async () => {
    // Ask camera permission then open camera
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!camPerm.granted) {
      Alert.alert("Permission needed", "Camera permission is required to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled) {
      // You now have result.assets[0].uri
      Alert.alert("Photo captured", result.assets?.[0]?.uri ?? "Photo saved");
      // TODO: upload to S3 or send to your API
    }
  };

  return (
    <View style={styles.container}>
      {region && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}         // works on iOS/Android (Google maps on Android)
          showsUserLocation={hasLocation}    // blue dot
          showsMyLocationButton={false}      // we’ll use our own button
          initialRegion={region}
          onMapReady={recenter}
        />
      )}

      {/* Bottom-center camera button */}
      <Pressable style={styles.cameraBtn} onPress={takePhoto}>
        <Ionicons name="camera" size={28} color="#fff" />
      </Pressable>

      {/* Optional: small recenter button (bottom-right) */}
      <Pressable style={styles.recenterBtn} onPress={recenter}>
        <Ionicons name="locate" size={22} color="#222" />
      </Pressable>
    </View>
  );
}

const BTN_SIZE = 64;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  cameraBtn: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  recenterBtn: {
    position: "absolute",
    right: 18,
    bottom: 32 + BTN_SIZE, // above camera button
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.2 : 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
