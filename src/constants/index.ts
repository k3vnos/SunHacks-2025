// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.hazardwatch.com',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'wss://ws.hazardwatch.com',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_REGION: {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  CLUSTER_RADIUS: 60,
  MIN_ZOOM: 3,
  MAX_ZOOM: 20,
  NEARBY_RADIUS_KM: 5,
};

// Incident Configuration
export const INCIDENT_CONFIG = {
  MAX_PHOTO_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_TEXT_LENGTH: 500,
  MAX_COMMENT_LENGTH: 200,
  VOTE_COOLDOWN_MS: 30000, // 30 seconds
  REPORT_COOLDOWN_MS: 300000, // 5 minutes
  AI_SUMMARY_MAX_LENGTH: 140,
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  NEARBY_THRESHOLD_METERS: 100,
  BACKGROUND_REFRESH_INTERVAL: 300000, // 5 minutes
  MAX_NOTIFICATIONS_PER_HOUR: 5,
};

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  PULL_TO_REFRESH_THRESHOLD: 50,
  INFINITE_SCROLL_THRESHOLD: 0.8,
};

// Feature Flags
export const FEATURE_FLAGS = {
  USE_AI_SUMMARY: process.env.EXPO_PUBLIC_USE_AI_SUMMARY === 'true',
  ENABLE_PUSH_NOTIFICATIONS: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true',
  ENABLE_WEBSOCKET: process.env.EXPO_PUBLIC_ENABLE_WEBSOCKET === 'true',
  ENABLE_OFFLINE_MODE: process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
};

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  CACHED_INCIDENTS: 'cached_incidents',
  LAST_LOCATION: 'last_location',
  NOTIFICATION_SETTINGS: 'notification_settings',
  DRAFT_REPORT: 'draft_report',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  LOCATION_PERMISSION_DENIED: 'Location permission is required to use this app.',
  CAMERA_PERMISSION_DENIED: 'Camera permission is required to take photos.',
  UPLOAD_FAILED: 'Failed to upload photo. Please try again.',
  REPORT_FAILED: 'Failed to submit report. Please try again.',
  VOTE_FAILED: 'Failed to vote. Please try again.',
  COMMENT_FAILED: 'Failed to add comment. Please try again.',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  REPORT_SUBMITTED: 'Report submitted successfully!',
  VOTE_RECORDED: 'Vote recorded successfully!',
  COMMENT_ADDED: 'Comment added successfully!',
  PHOTO_UPLOADED: 'Photo uploaded successfully!',
};
