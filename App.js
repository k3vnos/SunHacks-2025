import React, { useState, useEffect } from "react";
import LoadingScreen from "./src/components/LoadingScreen";
import MapScreen from "./src/components/MapScreen";
import ReportScreen from "./src/components/ReportScreen";
import ConfirmationScreen from "./src/components/ConfirmationScreen";
import SuccessPopup from "./src/components/SuccessPopup";
import * as Location from 'expo-location';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('map'); // 'map', 'report', or 'confirmation'
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [hazards, setHazards] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);

  const handleLoadingComplete = async () => {
    // Get user location when app loads and start tracking
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Start watching location changes
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15000, // Update every 15 seconds
            distanceInterval: 100, // Update every 100 meters
          },
          (location) => {
            console.log('Location updated:', location.coords);
            setUserLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
        setLocationSubscription(subscription);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
    setIsLoading(false);
  };


  const handleFlagPress = () => {
    setCurrentScreen('report');
  };

  const handleBackToMap = () => {
    setCurrentScreen('map');
  };

  const handleReportSubmit = async (reportData) => {
    console.log('Report submitted:', reportData);
    console.log('Current user location:', userLocation);
    
    try {
      // Get fresh location at the time of submission
      const freshLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const currentLocation = {
        latitude: freshLocation.coords.latitude,
        longitude: freshLocation.coords.longitude,
      };
      
      console.log('Fresh location for report:', currentLocation);
      
      // Create the submitted report with fresh location
      const newReport = {
        id: Date.now().toString(),
        title: reportData.title,
        description: reportData.description,
        images: reportData.images,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timestamp: new Date().toISOString(),
      };
      
      console.log('New report created:', newReport);
      
      // Add to hazards list for map display
      setHazards(prev => [...prev, newReport]);
      
      // Set the submitted report and navigate to confirmation
      setSubmittedReport(newReport);
      setCurrentScreen('confirmation');
    } catch (error) {
      console.error('Error getting fresh location:', error);
      // Fallback to stored location if fresh location fails
      const newReport = {
        id: Date.now().toString(),
        title: reportData.title,
        description: reportData.description,
        images: reportData.images,
        latitude: userLocation?.latitude || 37.7749,
        longitude: userLocation?.longitude || -122.4194,
        timestamp: new Date().toISOString(),
      };
      
      setHazards(prev => [...prev, newReport]);
      setSubmittedReport(newReport);
      setCurrentScreen('confirmation');
    }
  };

  const handleCloseSuccessPopup = () => {
    console.log('Closing success popup');
    setShowSuccessPopup(false);
  };

  // Test function to show popup
  const testPopup = () => {
    console.log('Testing popup - setting showSuccessPopup to true');
    setShowSuccessPopup(true);
  };

  // Cleanup location subscription on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationSubscription]);

  // Debug logging
  console.log('App state - showSuccessPopup:', showSuccessPopup, 'hazards count:', hazards.length, 'user location:', userLocation);

  // Show loading screen first
  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  // Show appropriate screen based on current state
  if (currentScreen === 'report') {
    return (
      <ReportScreen 
        onBack={handleBackToMap} 
        onSubmit={handleReportSubmit} 
      />
    );
  }

  if (currentScreen === 'confirmation' && submittedReport) {
    return (
      <ConfirmationScreen 
        onBack={handleBackToMap} 
        reportData={submittedReport} 
      />
    );
  }

  return (
    <>
      <MapScreen onFlagPress={handleFlagPress} hazards={hazards} />
      <SuccessPopup 
        visible={showSuccessPopup}
        onClose={handleCloseSuccessPopup}
      />
    </>
  );
}
