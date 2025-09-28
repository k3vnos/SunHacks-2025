import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "large";
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = "large",
  color = "#007AFF",
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
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
  message: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default LoadingSpinner;
