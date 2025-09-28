import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Incident, Location } from "../types";
import {
  calculateDistance,
  formatRelativeTime,
  capitalizeFirst,
} from "../utils";

interface IncidentCardProps {
  incident: Incident;
  onPress?: () => void;
  onClose?: () => void;
  showDistance?: boolean;
  userLocation?: Location | null;
  showCloseButton?: boolean;
}

const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onPress,
  onClose,
  showDistance = false,
  userLocation,
  showCloseButton = false,
}) => {
  const distance =
    userLocation && showDistance
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          incident.lat,
          incident.lon
        )
      : null;

  const getIncidentIcon = (type: string): string => {
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

  const getIncidentColor = (type: string): string => {
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

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {showCloseButton && onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      )}

      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <View
            style={[
              styles.typeIcon,
              { backgroundColor: getIncidentColor(incident.type) },
            ]}
          >
            <Ionicons
              name={getIncidentIcon(incident.type) as any}
              size={16}
              color="white"
            />
          </View>
          <Text style={styles.typeText}>{capitalizeFirst(incident.type)}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Ionicons name="thumbs-up" size={14} color="#27AE60" />
          <Text style={styles.scoreText}>{incident.score}</Text>
        </View>
      </View>

      {incident.photoCdnUrl && (
        <Image source={{ uri: incident.photoCdnUrl }} style={styles.photo} />
      )}

      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={2}>
          {incident.aiSummary || incident.text}
        </Text>

        <View style={styles.footer}>
          <View style={styles.metaInfo}>
            <Text style={styles.timeText}>
              {formatRelativeTime(incident.createdAt)}
            </Text>
            {distance !== null && (
              <Text style={styles.distanceText}>
                {distance < 1
                  ? `${Math.round(distance * 1000)}m away`
                  : `${distance.toFixed(1)}km away`}
              </Text>
            )}
          </View>

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(incident.status) },
              ]}
            />
            <Text style={styles.statusText}>
              {capitalizeFirst(incident.status)}
            </Text>
          </View>
        </View>

        {incident.commentsCount > 0 && (
          <View style={styles.commentsContainer}>
            <Ionicons name="chatbubble-outline" size={14} color="#7F8C8D" />
            <Text style={styles.commentsText}>
              {incident.commentsCount} comment
              {incident.commentsCount !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "open":
      return "#E74C3C";
    case "acknowledged":
      return "#F39C12";
    case "resolved":
      return "#27AE60";
    default:
      return "#95A5A6";
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  typeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#27AE60",
    marginLeft: 4,
  },
  photo: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: "#34495E",
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  distanceText: {
    fontSize: 12,
    color: "#7F8C8D",
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  commentsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  commentsText: {
    fontSize: 12,
    color: "#7F8C8D",
    marginLeft: 4,
  },
});

export default IncidentCard;
