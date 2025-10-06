import React, { useState, useEffect } from "react";
import LoadingScreen from "./src/components/LoadingScreen";
import MapScreen from "./src/components/MapScreen";
import ReportScreen from "./src/components/ReportScreen";
import ConfirmationScreen from "./src/components/ConfirmationScreen";
import SuccessPopup from "./src/components/SuccessPopup";
import * as Location from 'expo-location';
import { saveReport, getAllReports } from './src/dynamodb';
import { uploadImagesToS3 } from './src/s3Upload';

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

    // Load existing reports from DynamoDB
    try {
      const reports = await getAllReports();
      setHazards(reports);
      console.log('Loaded', reports.length, 'reports from DynamoDB');
    } catch (error) {
      console.error('Error loading reports from DynamoDB:', error);
    }

    setIsLoading(false);
  };


  const handleFlagPress = () => {
    setCurrentScreen('report');
  };

  const handleBackToMap = () => {
    setCurrentScreen('map');
    // Clear the submitted report when going back to map
    setSubmittedReport(null);
  };

  const handleReportSubmit = async (reportData, onNavigationComplete) => {
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

      const reportId = Date.now().toString();

      // Upload images to S3
      let s3ImageUrls = [];
      try {
        console.log('Uploading images to S3...');
        s3ImageUrls = await uploadImagesToS3(reportData.images, reportId);
        console.log('Images uploaded to S3:', s3ImageUrls);
      } catch (s3Error) {
        console.error('Failed to upload images to S3:', s3Error);
        // Fall back to local URIs if S3 upload fails
        s3ImageUrls = reportData.images;
      }

      // Create the submitted report with fresh location and S3 URLs
      const newReport = {
        id: reportId,
        title: reportData.title,
        description: reportData.description,
        images: s3ImageUrls,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timestamp: new Date().toISOString(),
        category: reportData.category,
      };

      console.log('New report created:', newReport);

      // Save to DynamoDB
      try {
        await saveReport(newReport);
        console.log('Report saved to DynamoDB successfully');
      } catch (dbError) {
        console.error('Failed to save to DynamoDB, continuing anyway:', dbError);
      }

      // Add to hazards list for map display
      setHazards(prev => [...prev, newReport]);

      // Set the submitted report and navigate to confirmation
      console.log('Setting submitted report and navigating to confirmation');

      // Use a single state update to avoid race conditions
      setSubmittedReport(newReport);
      setTimeout(() => {
        setCurrentScreen('confirmation');
        console.log('Navigation to confirmation screen completed');
        // Call the callback to stop loading animation
        if (onNavigationComplete) {
          onNavigationComplete();
        }
      }, 0);
    } catch (error) {
      console.error('Error getting fresh location:', error);

      const reportId = Date.now().toString();

      // Upload images to S3
      let s3ImageUrls = [];
      try {
        console.log('Uploading images to S3 (fallback)...');
        s3ImageUrls = await uploadImagesToS3(reportData.images, reportId);
        console.log('Images uploaded to S3 (fallback):', s3ImageUrls);
      } catch (s3Error) {
        console.error('Failed to upload images to S3:', s3Error);
        s3ImageUrls = reportData.images;
      }

      // Fallback to stored location if fresh location fails
      const newReport = {
        id: reportId,
        title: reportData.title,
        description: reportData.description,
        images: s3ImageUrls,
        latitude: userLocation?.latitude || 37.7749,
        longitude: userLocation?.longitude || -122.4194,
        timestamp: new Date().toISOString(),
        category: reportData.category,
      };

      // Save to DynamoDB
      try {
        await saveReport(newReport);
        console.log('Report saved to DynamoDB successfully (fallback)');
      } catch (dbError) {
        console.error('Failed to save to DynamoDB, continuing anyway:', dbError);
      }

      setHazards(prev => [...prev, newReport]);
      console.log('Setting submitted report (fallback) and navigating to confirmation');

      // Use a single state update to avoid race conditions
      setSubmittedReport(newReport);
      setTimeout(() => {
        setCurrentScreen('confirmation');
        console.log('Navigation to confirmation screen completed (fallback)');
        // Call the callback to stop loading animation
        if (onNavigationComplete) {
          onNavigationComplete();
        }
      }, 0);
    }
  };

  const handleCloseSuccessPopup = () => {
    console.log('Closing success popup');
    setShowSuccessPopup(false);
  };

  const handleConfirmationComplete = () => {
    console.log('Confirmation completed, returning to map');
    setCurrentScreen('map');
    setSubmittedReport(null);
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

  // Debug state changes
  useEffect(() => {
    console.log('State changed - currentScreen:', currentScreen, 'submittedReport:', submittedReport ? 'exists' : 'null');
  }, [currentScreen, submittedReport]);

  // Debug logging
  console.log('App state - currentScreen:', currentScreen, 'showSuccessPopup:', showSuccessPopup, 'hazards count:', hazards.length, 'user location:', userLocation, 'submittedReport:', submittedReport ? 'exists' : 'null');

  // Show loading screen first
  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  // Show appropriate screen based on current state
  console.log('Rendering decision - currentScreen:', currentScreen, 'submittedReport:', submittedReport ? 'exists' : 'null');
  
  if (currentScreen === 'report') {
    console.log('Rendering ReportScreen');
    return (
      <ReportScreen 
        onBack={handleBackToMap} 
        onSubmit={handleReportSubmit} 
      />
    );
  }

  if (currentScreen === 'confirmation' && submittedReport) {
    console.log('Rendering ConfirmationScreen');
    return (
      <ConfirmationScreen 
        onBack={handleBackToMap} 
        onComplete={handleConfirmationComplete}
        reportData={submittedReport} 
      />
    );
  }

  console.log('Rendering MapScreen (default)');
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
