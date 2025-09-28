import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  showRetryButton = true,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>

      {showRetryButton && onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2C3E50",
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ErrorMessage;
