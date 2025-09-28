# Hazard Watch - Frontend

A React Native (Expo) frontend for the Hazard Watch citizen reporting app. This app allows users to report hazards like potholes, debris, and unsafe structures, view them on a live map, and get notified about nearby incidents.

## Features

- 🗺️ **Live Map**: View incidents on an interactive map with clustering
- 📸 **Photo Reports**: Take photos or select from gallery to report hazards
- 🔔 **Real-time Updates**: WebSocket integration for live incident updates
- 📍 **Location Services**: GPS-based location tracking and nearby alerts
- 💬 **Community Features**: Vote and comment on incidents
- 🔐 **Authentication**: Secure user authentication (mock implementation)
- 📱 **Offline Support**: Cache incidents for offline viewing
- 🎨 **Modern UI**: Clean, intuitive interface with smooth animations

## Tech Stack

- **Framework**: Expo SDK 54 (React Native)
- **Language**: TypeScript
- **State Management**: Zustand + React Query
- **Maps**: react-native-maps
- **Camera**: expo-camera, expo-image-picker
- **Location**: expo-location
- **Notifications**: expo-notifications
- **Navigation**: React Navigation 7
- **Storage**: AsyncStorage
- **Validation**: Zod

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── IncidentCard.tsx
│   ├── LoadingSpinner.tsx
│   ├── ErrorMessage.tsx
│   └── FloatingActionButton.tsx
├── screens/            # Main app screens
│   ├── MapScreen.tsx
│   ├── ReportFlow.tsx
│   ├── IncidentDetailScreen.tsx
│   └── AuthScreen.tsx
├── hooks/              # Custom React hooks
│   ├── useQueries.ts
│   └── useLocationAndCamera.ts
├── services/           # API and external services
│   ├── api.ts
│   ├── websocket.ts
│   └── notifications.ts
├── stores/             # Zustand state stores
│   └── index.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   └── index.ts
└── constants/           # App constants and configuration
    └── index.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- Physical device with Expo Go app (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hazard-watch-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_API_URL=https://api.hazardwatch.com
   EXPO_PUBLIC_WS_URL=wss://ws.hazardwatch.com
   EXPO_PUBLIC_USE_AI_SUMMARY=true
   EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
   EXPO_PUBLIC_ENABLE_WEBSOCKET=true
   EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true
   EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - **iOS**: Press `i` in the terminal or scan QR code with Camera app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

### Development Commands

```bash
# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Type checking
npm run type-check

# Linting
npm run lint
```

## Key Features Implementation

### 1. Map Screen
- Interactive map with custom markers
- Incident clustering for better performance
- Real-time updates via WebSocket
- Location-based incident filtering
- Pull-to-refresh functionality

### 2. Report Flow
- Camera integration for photo capture
- Image compression and optimization
- Multi-step form with validation
- Offline draft saving
- AI-powered description generation (when enabled)

### 3. Real-time Updates
- WebSocket connection for live updates
- Automatic reconnection on network issues
- Optimistic UI updates for better UX
- Background location tracking

### 4. Offline Support
- Incident caching with AsyncStorage
- Offline incident viewing
- Automatic sync when online
- Draft report saving

## Configuration

### Feature Flags
The app uses feature flags to enable/disable functionality:

- `EXPO_PUBLIC_USE_AI_SUMMARY`: Enable AI-powered incident summaries
- `EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS`: Enable push notifications
- `EXPO_PUBLIC_ENABLE_WEBSOCKET`: Enable real-time WebSocket updates
- `EXPO_PUBLIC_ENABLE_OFFLINE_MODE`: Enable offline functionality

### Map Configuration
- Default region: San Francisco, CA
- Cluster radius: 60 pixels
- Nearby radius: 5km
- Max photo size: 5MB

## API Integration

The app expects a REST API with the following endpoints:

- `GET /me` - Get current user info
- `POST /incidents/request-upload` - Get presigned upload URL
- `POST /incidents` - Create new incident
- `GET /incidents/near` - Get nearby incidents
- `GET /incidents/{id}` - Get incident details
- `POST /incidents/{id}/vote` - Vote on incident
- `POST /incidents/{id}/comment` - Add comment
- `POST /devices` - Register push token

## WebSocket Events

The app listens for these WebSocket events:
- `incident.created` - New incident created
- `incident.updated` - Incident updated
- `incident.voted` - Incident vote changed
- `incident.commented` - New comment added

## State Management

### Zustand Stores
- **AuthStore**: User authentication state
- **MapStore**: Map region and incidents
- **ReportStore**: Report form state
- **LocationStore**: User location data
- **NotificationStore**: Notification settings

### React Query
- Server state caching and synchronization
- Background refetching
- Optimistic updates
- Error handling and retries

## Testing

### Manual Testing Checklist
- [ ] User can authenticate (demo mode)
- [ ] Map loads with user location
- [ ] Can take photo and report incident
- [ ] Incidents appear on map in real-time
- [ ] Can vote and comment on incidents
- [ ] Push notifications work (when enabled)
- [ ] App works offline (cached incidents)
- [ ] Location permissions handled gracefully

### Testing on Different Devices
- **iOS**: Test on iPhone simulator and physical device
- **Android**: Test on Android emulator and physical device
- **Different screen sizes**: Test on various device sizes
- **Network conditions**: Test with poor/no connectivity

## Troubleshooting

### Common Issues

1. **Location not working**
   - Check location permissions in device settings
   - Ensure location services are enabled
   - Test on physical device (simulator may have issues)

2. **Camera not working**
   - Check camera permissions
   - Test on physical device
   - Ensure proper Expo configuration

3. **WebSocket connection issues**
   - Check network connectivity
   - Verify WebSocket URL configuration
   - Check for firewall/proxy issues

4. **Build issues**
   - Clear Expo cache: `expo r -c`
   - Delete node_modules and reinstall
   - Check for TypeScript errors

### Debug Mode
Enable debug mode by setting `EXPO_PUBLIC_DEBUG=true` in your `.env` file.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the Expo documentation for platform-specific issues