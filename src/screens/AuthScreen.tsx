import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../stores";
import { User } from "../types";

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, setLoading, setError } = useAuthStore();

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setLoading(true);

    try {
      // Mock authentication - replace with actual Cognito integration
      const mockUser: User = {
        id: "user-123",
        handle: email.split("@")[0],
        reputation: 100,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      login(mockUser, "mock-token");
    } catch (error) {
      setError("Authentication failed. Please try again.");
      Alert.alert("Error", "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setLoading(true);

    try {
      const mockUser: User = {
        id: "demo-user",
        handle: "demo_user",
        reputation: 150,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      login(mockUser, "demo-token");
    } catch (error) {
      setError("Demo login failed");
      Alert.alert("Error", "Demo login failed");
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="warning" size={48} color="#FF6B6B" />
            </View>
            <Text style={styles.title}>Hazard Watch</Text>
            <Text style={styles.subtitle}>
              Report hazards, keep your community safe
            </Text>
          </View>

          {/* Auth Form */}
          <View style={styles.formContainer}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.activeTab]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.activeTab]}
                onPress={() => setIsLogin(false)}
              >
                <Text
                  style={[styles.tabText, !isLogin && styles.activeTabText]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.authButton,
                isLoading && styles.authButtonDisabled,
              ]}
              onPress={handleAuth}
              disabled={isLoading}
            >
              <Text style={styles.authButtonText}>
                {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoLogin}
              disabled={isLoading}
            >
              <Text style={styles.demoButtonText}>Try Demo Mode</Text>
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Features</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="camera" size={20} color="#4ECDC4" />
                <Text style={styles.featureText}>
                  Report hazards with photos
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="map" size={20} color="#4ECDC4" />
                <Text style={styles.featureText}>
                  View incidents on live map
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="notifications" size={20} color="#4ECDC4" />
                <Text style={styles.featureText}>Get nearby hazard alerts</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="chatbubbles" size={20} color="#4ECDC4" />
                <Text style={styles.featureText}>
                  Comment and vote on reports
                </Text>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: 40,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7F8C8D",
  },
  activeTabText: {
    color: "#2C3E50",
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#F8F9FA",
  },
  authButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  authButtonDisabled: {
    backgroundColor: "#BDC3C7",
  },
  authButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  demoButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  demoButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  featuresContainer: {
    flex: 1,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 16,
    textAlign: "center",
  },
  featuresList: {
    flex: 1,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: "#34495E",
    marginLeft: 12,
    flex: 1,
  },
});

export default AuthScreen;
