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

  const handleLoadingComplete = async () => {
    // Get user location when app loads
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
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

  const handleReportSubmit = (reportData) => {
    console.log('Report submitted:', reportData);
    console.log('User location:', userLocation);
    
    // Create the submitted report with actual user location
    const newReport = {
      id: Date.now().toString(),
      title: reportData.title,
      description: reportData.description,
      images: reportData.images,
      latitude: userLocation?.latitude || 37.7749, // Use actual location or fallback
      longitude: userLocation?.longitude || -122.4194, // Use actual location or fallback
      timestamp: new Date().toISOString(),
    };
    
    console.log('New report created:', newReport);
    
    // Add to hazards list for map display
    setHazards(prev => [...prev, newReport]);
    
    // Set the submitted report and navigate to confirmation
    setSubmittedReport(newReport);
    setCurrentScreen('confirmation');
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

  // Debug logging
  console.log('App state - showSuccessPopup:', showSuccessPopup, 'hazards count:', hazards.length);

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
