import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiService } from './api';
import { useNotificationStore } from '../stores';
import { calculateDistance } from '../utils';
import { NOTIFICATION_CONFIG, FEATURE_FLAGS } from '../constants';
import { Incident, NotificationData } from '../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (!FEATURE_FLAGS.ENABLE_PUSH_NOTIFICATIONS || this.isInitialized) {
      return;
    }

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      // Get push token
      const token = await this.getPushToken();
      if (token) {
        await this.registerDeviceToken(token);
      }

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  private async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  private async registerDeviceToken(token: string): Promise<void> {
    try {
      const platform = Platform.OS as 'ios' | 'android';
      await apiService.registerDevice(token, platform);
      
      // Store token in local state
      useNotificationStore.getState().setDeviceToken(token);
    } catch (error) {
      console.error('Failed to register device token:', error);
    }
  }

  private async createNotificationChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('hazard-alerts', {
      name: 'Hazard Alerts',
      description: 'Notifications about nearby hazards',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B',
    });

    await Notifications.setNotificationChannelAsync('incident-updates', {
      name: 'Incident Updates',
      description: 'Updates about incidents you\'re following',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4ECDC4',
    });
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });

      return identifier;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  // Check for nearby incidents and send notifications
  async checkNearbyIncidents(
    userLocation: { latitude: number; longitude: number },
    incidents: Incident[]
  ): Promise<void> {
    const { isEnabled, nearbyRadius, lastNotificationTime } = useNotificationStore.getState();
    
    if (!isEnabled) return;

    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime;
    
    // Rate limiting: max 5 notifications per hour
    if (timeSinceLastNotification < 12 * 60 * 1000) { // 12 minutes
      return;
    }

    const nearbyIncidents = incidents.filter(incident => {
      if (incident.status !== 'open') return false;
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        incident.lat,
        incident.lon
      );
      
      return distance * 1000 <= nearbyRadius; // Convert km to meters
    });

    if (nearbyIncidents.length > 0) {
      const incident = nearbyIncidents[0]; // Notify about the closest one
      
      await this.scheduleLocalNotification(
        'Hazard Nearby',
        `${incident.type.charAt(0).toUpperCase() + incident.type.slice(1)} reported nearby`,
        {
          type: 'incident_nearby',
          incidentId: incident.id,
        }
      );

      // Update last notification time
      useNotificationStore.getState().setLastNotificationTime(now);
    }
  }

  // Handle incoming push notifications
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Background task for checking nearby incidents
  async registerBackgroundTask(): Promise<void> {
    try {
      await Notifications.registerTaskAsync('check-nearby-incidents');
    } catch (error) {
      console.error('Failed to register background task:', error);
    }
  }

  // Get notification settings
  async getNotificationSettings(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.getPermissionsAsync();
  }

  // Update notification settings
  async updateNotificationSettings(
    settings: Notifications.NotificationPermissionsRequest
  ): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.requestPermissionsAsync(settings);
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Hook for using notifications
export function useNotifications() {
  const {
    isEnabled,
    nearbyRadius,
    setIsEnabled,
    setNearbyRadius,
  } = useNotificationStore();

  const initializeNotifications = async () => {
    await notificationService.initialize();
  };

  const scheduleNotification = async (
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    return await notificationService.scheduleLocalNotification(title, body, data);
  };

  const checkNearbyIncidents = async (
    userLocation: { latitude: number; longitude: number },
    incidents: Incident[]
  ) => {
    await notificationService.checkNearbyIncidents(userLocation, incidents);
  };

  return {
    isEnabled,
    nearbyRadius,
    setIsEnabled,
    setNearbyRadius,
    initializeNotifications,
    scheduleNotification,
    checkNearbyIncidents,
  };
}

// Background task handler
export async function checkNearbyIncidentsTask() {
  try {
    // This would be called by the background task
    // Implementation depends on your background task setup
    console.log('Background task: checking nearby incidents');
  } catch (error) {
    console.error('Background task error:', error);
  }
}
