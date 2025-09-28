import React from "react";
import { TouchableOpacity, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
  label?: string;
  size?: "small" | "medium" | "large";
  color?: string;
  disabled?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = "add",
  label,
  size = "medium",
  color = "#007AFF",
  disabled = false,
}) => {
  const getSize = () => {
    switch (size) {
      case "small":
        return { width: 48, height: 48, iconSize: 20 };
      case "large":
        return { width: 64, height: 64, iconSize: 28 };
      default:
        return { width: 56, height: 56, iconSize: 24 };
    }
  };

  const { width, height, iconSize } = getSize();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width,
          height,
          backgroundColor: disabled ? "#BDC3C7" : color,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Ionicons name={icon as any} size={iconSize} color="white" />
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  label: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});

export default FloatingActionButton;
