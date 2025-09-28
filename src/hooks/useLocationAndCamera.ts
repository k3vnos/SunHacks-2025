import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, Platform } from 'react-native';
import { Location as LocationType } from '../types';
import { useLocationStore } from '../stores';
import { ERROR_MESSAGES, INCIDENT_CONFIG } from '../constants';

// Location hook
export function useLocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { 
    currentLocation, 
    setCurrentLocation, 
    setLocationEnabled,
    setLocationError 
  } = useLocationStore();

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationEnabled(granted);
      
      if (!granted) {
        setError(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show hazards near you and allow you to report new ones.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.enableNetworkProviderAsync() },
          ]
        );
      }
      
      return granted;
    } catch (err) {
      setError('Failed to request location permission');
      return false;
    }
  }, [setLocationEnabled]);

  const getCurrentLocation = useCallback(async (): Promise<LocationType | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
      });

      const locationData: LocationType = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
      };

      setCurrentLocation(locationData);
      return locationData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      setLocationError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [requestLocationPermission, setCurrentLocation, setLocationError]);

  const watchLocation = useCallback(() => {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // Update every 30 seconds
        distanceInterval: 100, // Update every 100 meters
      },
      (location) => {
        const locationData: LocationType = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          altitude: location.coords.altitude || undefined,
          heading: location.coords.heading || undefined,
          speed: location.coords.speed || undefined,
        };
        setCurrentLocation(locationData);
      }
    );
  }, [setCurrentLocation]);

  return {
    currentLocation,
    isLoading,
    error,
    getCurrentLocation,
    watchLocation,
    requestLocationPermission,
  };
}

// Camera hook
export function useCamera() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (!granted) {
        setError(ERROR_MESSAGES.CAMERA_PERMISSION_DENIED);
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access to take photos of hazards you want to report.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Camera.requestCameraPermissionsAsync() },
          ]
        );
      }
      
      return granted;
    } catch (err) {
      setError('Failed to request camera permission');
      return false;
    }
  }, []);

  useEffect(() => {
    requestCameraPermission();
  }, [requestCameraPermission]);

  return {
    hasPermission,
    isLoading,
    error,
    requestCameraPermission,
  };
}

// Image picker hook
export function useImagePicker() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Media library permission is required to select photos');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false, // Remove EXIF data for privacy
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Compress and resize the image
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [
            { resize: { width: 1200 } }, // Resize to max width of 1200px
          ],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: false,
          }
        );

        return manipulatedImage.uri;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick image';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const takePhoto = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Request camera permissions
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError(ERROR_MESSAGES.CAMERA_PERMISSION_DENIED);
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false, // Remove EXIF data for privacy
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Compress and resize the image
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [
            { resize: { width: 1200 } }, // Resize to max width of 1200px
          ],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: false,
          }
        );

        return manipulatedImage.uri;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to take photo';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateImageSize = useCallback(async (uri: string): Promise<boolean> => {
    try {
      const fileInfo = await ImagePicker.getMediaLibraryAsync();
      // Note: This is a simplified check. In a real app, you'd want to check the actual file size
      return true; // Assume valid for now
    } catch {
      return false;
    }
  }, []);

  return {
    isLoading,
    error,
    pickImage,
    takePhoto,
    validateImageSize,
  };
}

// Combined photo capture hook
export function usePhotoCapture() {
  const imagePicker = useImagePicker();
  const [showOptions, setShowOptions] = useState(false);

  const showPhotoOptions = useCallback(() => {
    setShowOptions(true);
  }, []);

  const hidePhotoOptions = useCallback(() => {
    setShowOptions(false);
  }, []);

  const handleTakePhoto = useCallback(async () => {
    hidePhotoOptions();
    return await imagePicker.takePhoto();
  }, [imagePicker.takePhoto, hidePhotoOptions]);

  const handlePickImage = useCallback(async () => {
    hidePhotoOptions();
    return await imagePicker.pickImage();
  }, [imagePicker.pickImage, hidePhotoOptions]);

  return {
    ...imagePicker,
    showOptions,
    showPhotoOptions,
    hidePhotoOptions,
    handleTakePhoto,
    handlePickImage,
  };
}

// Background location tracking hook
export function useBackgroundLocation() {
  const { currentLocation, setCurrentLocation } = useLocationStore();
  const [isTracking, setIsTracking] = useState(false);

  const startBackgroundTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Background Location Permission Required',
          'This app needs background location access to notify you about nearby hazards.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.enableNetworkProviderAsync() },
          ]
        );
        return false;
      }

      await Location.startLocationUpdatesAsync('background-location', {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 300000, // 5 minutes
        distanceInterval: 100, // 100 meters
        foregroundService: {
          notificationTitle: 'Hazard Watch',
          notificationBody: 'Tracking your location for nearby hazard alerts',
          notificationColor: '#FF6B6B',
        },
      });

      setIsTracking(true);
      return true;
    } catch (error) {
      console.error('Failed to start background location tracking:', error);
      return false;
    }
  }, []);

  const stopBackgroundTracking = useCallback(async () => {
    try {
      await Location.stopLocationUpdatesAsync('background-location');
      setIsTracking(false);
    } catch (error) {
      console.error('Failed to stop background location tracking:', error);
    }
  }, []);

  useEffect(() => {
    // Listen for location updates
    const subscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 300000, // 5 minutes
        distanceInterval: 100, // 100 meters
      },
      (location) => {
        const locationData: LocationType = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          altitude: location.coords.altitude || undefined,
          heading: location.coords.heading || undefined,
          speed: location.coords.speed || undefined,
        };
        setCurrentLocation(locationData);
      }
    );

    return () => {
      subscription.then(sub => sub.remove());
    };
  }, [setCurrentLocation]);

  return {
    isTracking,
    startBackgroundTracking,
    stopBackgroundTracking,
  };
}
