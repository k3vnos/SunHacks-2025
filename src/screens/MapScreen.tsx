import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import MapView, { Marker, Region, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocation } from "../hooks/useLocationAndCamera";
import { useMapStore } from "../stores";
import {
  useLocationBasedQueries,
  useWebSocketIntegration,
} from "../hooks/useQueries";
import { Incident, IncidentType } from "../types";
import { MAP_CONFIG, INCIDENT_CONFIG } from "../constants";
import { calculateDistance, formatRelativeTime } from "../utils";
import IncidentCard from "../components/IncidentCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import FloatingActionButton from "../components/FloatingActionButton";

const MapScreen: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showIncidentList, setShowIncidentList] = useState(false);

  const {
    currentLocation,
    getCurrentLocation,
    isLoading: locationLoading,
  } = useLocation();
  const { region, incidents, setRegion, setSelectedIncident } = useMapStore();
  const { nearbyIncidentsQuery, isLoading, error, refetch } =
    useLocationBasedQueries();
  const { connect, subscribeToArea, handleWebSocketMessage } =
    useWebSocketIntegration();

  // Initialize location and WebSocket
  useEffect(() => {
    const initialize = async () => {
      if (!currentLocation) {
        await getCurrentLocation();
      }

      // Connect to WebSocket
      await connect();

      // Subscribe to WebSocket messages
      const handleMessage = (message: any) => {
        handleWebSocketMessage(message);
      };

      // This would be set up with the actual WebSocket service
      // webSocketService.on('incident.created', handleMessage);
      // webSocketService.on('incident.updated', handleMessage);
    };

    initialize();
  }, [currentLocation, getCurrentLocation, connect, handleWebSocketMessage]);

  // Subscribe to area when location changes
  useEffect(() => {
    if (currentLocation) {
      subscribeToArea(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation, subscribeToArea]);

  // Center map on user location
  const centerOnUserLocation = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location && mapRef.current) {
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: MAP_CONFIG.DEFAULT_REGION.latitudeDelta,
        longitudeDelta: MAP_CONFIG.DEFAULT_REGION.longitudeDelta,
      };

      setRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  }, [getCurrentLocation, setRegion]);

  // Handle map region change
  const handleRegionChange = useCallback(
    (newRegion: Region) => {
      setRegion(newRegion);
    },
    [setRegion]
  );

  // Handle marker press
  const handleMarkerPress = useCallback(
    (incident: Incident) => {
      setSelectedIncident(incident);
      setSelectedIncident(incident);
    },
    [setSelectedIncident]
  );

  // Handle incident card press
  const handleIncidentCardPress = useCallback((incident: Incident) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: incident.lat,
          longitude: incident.lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
    setSelectedIncident(incident);
  }, []);

  // Refresh incidents
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Get incident type icon
  const getIncidentIcon = (type: IncidentType): string => {
    switch (type) {
      case "pothole":
        return "car-outline";
      case "debris":
        return "trash-outline";
      case "structure":
        return "warning-outline";
      default:
        return "alert-circle-outline";
    }
  };

  // Get incident type color
  const getIncidentColor = (type: IncidentType): string => {
    switch (type) {
      case "pothole":
        return "#FF6B6B";
      case "debris":
        return "#4ECDC4";
      case "structure":
        return "#FFE66D";
      default:
        return "#95A5A6";
    }
  };

  if (locationLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Getting your location..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage
          message={error.message || "Failed to load incidents"}
          onRetry={handleRefresh}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          onRegionChangeComplete={handleRegionChange}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          showsScale
          mapType="standard"
        >
          {incidents.map((incident) => (
            <Marker
              key={incident.id}
              coordinate={{
                latitude: incident.lat,
                longitude: incident.lon,
              }}
              onPress={() => handleMarkerPress(incident)}
            >
              <View
                style={[
                  styles.markerContainer,
                  { backgroundColor: getIncidentColor(incident.type) },
                ]}
              >
                <Ionicons
                  name={getIncidentIcon(incident.type) as any}
                  size={20}
                  color="white"
                />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Location Button */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={centerOnUserLocation}
        >
          <Ionicons name="locate" size={24} color="#333" />
        </TouchableOpacity>

        {/* Incident List Toggle */}
        <TouchableOpacity
          style={styles.listButton}
          onPress={() => setShowIncidentList(!showIncidentList)}
        >
          <Ionicons
            name={showIncidentList ? "map" : "list"}
            size={24}
            color="#333"
          />
        </TouchableOpacity>

        {/* Incident Count Badge */}
        {incidents.length > 0 && (
          <View style={styles.incidentCountBadge}>
            <Text style={styles.incidentCountText}>{incidents.length}</Text>
          </View>
        )}
      </View>

      {/* Incident List */}
      {showIncidentList && (
        <View style={styles.incidentListContainer}>
          <ScrollView
            style={styles.incidentList}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            {incidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onPress={() => handleIncidentCardPress(incident)}
                showDistance={!!currentLocation}
                userLocation={currentLocation}
              />
            ))}
            {incidents.length === 0 && !isLoading && (
              <View style={styles.emptyState}>
                <Ionicons name="map-outline" size={48} color="#95A5A6" />
                <Text style={styles.emptyStateText}>No incidents nearby</Text>
                <Text style={styles.emptyStateSubtext}>
                  Be the first to report a hazard in your area
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Selected Incident Card */}
      {selectedIncident && !showIncidentList && (
        <View style={styles.selectedIncidentContainer}>
          <IncidentCard
            incident={selectedIncident}
            onPress={() => {
              // Navigate to incident detail screen
              // navigation.navigate('IncidentDetail', { incidentId: selectedIncident.id });
            }}
            showDistance={!!currentLocation}
            userLocation={currentLocation}
            onClose={() => setSelectedIncident(null)}
          />
        </View>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => {
          // Navigate to report flow
          // navigation.navigate('ReportFlow');
        }}
        icon="add"
        label="Report"
        size="large"
        color="#FF6B6B"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner message="Loading incidents..." />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  locationButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listButton: {
    position: "absolute",
    top: 80,
    right: 20,
    backgroundColor: "white",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  incidentCountBadge: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "#FF6B6B",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 30,
    alignItems: "center",
  },
  incidentCountText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  incidentListContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  incidentList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  selectedIncidentContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#7F8C8D",
    marginTop: 8,
    textAlign: "center",
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
});

export default MapScreen;
