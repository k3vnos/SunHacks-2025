import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { notificationService } from "./src/services/notifications";
import { apiService } from "./src/services/api";
import { webSocketService } from "./src/services/websocket";
import { useAuthStore } from "./src/stores";
import MapScreen from "./src/screens/MapScreen";
import ReportFlow from "./src/screens/ReportFlow";
import IncidentDetailScreen from "./src/screens/IncidentDetailScreen";
import AuthScreen from "./src/screens/AuthScreen";

const Stack = createNativeStackNavigator();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      try {
        // Initialize notifications
        await notificationService.initialize();

        // Set up WebSocket connection
        await webSocketService.connect();

        // Set up notification listeners
        notificationService.addNotificationReceivedListener((notification) => {
          console.log("Notification received:", notification);
        });

        notificationService.addNotificationResponseReceivedListener(
          (response) => {
            console.log("Notification response:", response);
          }
        );
      } catch (error) {
        console.error("Failed to initialize services:", error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthScreen} />
          ) : (
            <>
              <Stack.Screen name="Map" component={MapScreen} />
              <Stack.Screen
                name="ReportFlow"
                component={ReportFlow}
                options={{
                  presentation: "modal",
                  animation: "slide_from_bottom",
                }}
              />
              <Stack.Screen
                name="IncidentDetail"
                component={IncidentDetailScreen}
                options={{
                  headerShown: true,
                  title: "Incident Details",
                  headerBackTitle: "Back",
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
