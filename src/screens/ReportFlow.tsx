import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePhotoCapture } from "../hooks/useLocationAndCamera";
import { useLocation } from "../hooks/useLocationAndCamera";
import { useCreateIncident } from "../hooks/useQueries";
import { useReportStore } from "../stores";
import { IncidentType } from "../types";
import { INCIDENT_CONFIG, SUCCESS_MESSAGES } from "../constants";
import { capitalizeFirst } from "../utils";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const ReportFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<
    "camera" | "details" | "submitting"
  >("camera");
  const [selectedType, setSelectedType] = useState<IncidentType>("other");
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    isLoading: photoLoading,
    error: photoError,
    handleTakePhoto,
    handlePickImage,
    showPhotoOptions,
    hidePhotoOptions,
  } = usePhotoCapture();

  const { currentLocation, getCurrentLocation } = useLocation();
  const createIncidentMutation = useCreateIncident();
  const { reset: resetReportStore } = useReportStore();

  // Reset form when component mounts
  useEffect(() => {
    resetReportStore();
  }, [resetReportStore]);

  // Get current location when component mounts
  useEffect(() => {
    if (!currentLocation) {
      getCurrentLocation();
    }
  }, [currentLocation, getCurrentLocation]);

  const handleTakePhotoPress = useCallback(async () => {
    const uri = await handleTakePhoto();
    if (uri) {
      setPhotoUri(uri);
      setCurrentStep("details");
    }
  }, [handleTakePhoto]);

  const handlePickImagePress = useCallback(async () => {
    const uri = await handlePickImage();
    if (uri) {
      setPhotoUri(uri);
      setCurrentStep("details");
    }
  }, [handlePickImage]);

  const handleTypeSelect = useCallback((type: IncidentType) => {
    setSelectedType(type);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep === "camera" && photoUri) {
      setCurrentStep("details");
    } else if (currentStep === "details") {
      setCurrentStep("submitting");
      handleSubmit();
    }
  }, [currentStep, photoUri]);

  const handleBack = useCallback(() => {
    if (currentStep === "details") {
      setCurrentStep("camera");
    } else if (currentStep === "submitting") {
      setCurrentStep("details");
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (!currentLocation) {
      Alert.alert("Error", "Location is required to submit a report");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please provide a description of the hazard");
      return;
    }

    setIsSubmitting(true);

    try {
      await createIncidentMutation.mutateAsync({
        lat: currentLocation.latitude,
        lon: currentLocation.longitude,
        type: selectedType,
        text: description.trim(),
        photoKey: photoUri || undefined,
      });

      Alert.alert("Success", SUCCESS_MESSAGES.REPORT_SUBMITTED, [
        {
          text: "OK",
          onPress: () => {
            // Navigate back to map screen
            // navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to submit report. Please try again.");
      setCurrentStep("details");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentLocation,
    description,
    selectedType,
    photoUri,
    createIncidentMutation,
  ]);

  const renderCameraStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Take a Photo</Text>
      <Text style={styles.stepSubtitle}>
        Help others by taking a clear photo of the hazard
      </Text>

      <View style={styles.cameraContainer}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Ionicons name="camera-outline" size={64} color="#BDC3C7" />
            <Text style={styles.placeholderText}>No photo selected</Text>
          </View>
        )}
      </View>

      <View style={styles.cameraButtons}>
        <TouchableOpacity
          style={[styles.cameraButton, styles.takePhotoButton]}
          onPress={handleTakePhotoPress}
          disabled={photoLoading}
        >
          <Ionicons name="camera" size={24} color="white" />
          <Text style={styles.cameraButtonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cameraButton, styles.pickImageButton]}
          onPress={handlePickImagePress}
          disabled={photoLoading}
        >
          <Ionicons name="images-outline" size={24} color="white" />
          <Text style={styles.cameraButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      {photoLoading && (
        <View style={styles.loadingContainer}>
          <LoadingSpinner message="Processing photo..." />
        </View>
      )}

      {photoError && (
        <ErrorMessage message={photoError} showRetryButton={false} />
      )}
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Report Details</Text>
      <Text style={styles.stepSubtitle}>
        Provide more information about the hazard
      </Text>

      {photoUri && (
        <View style={styles.photoPreview}>
          <Image source={{ uri: photoUri }} style={styles.smallPreviewImage} />
          <TouchableOpacity
            style={styles.removePhotoButton}
            onPress={() => setPhotoUri(null)}
          >
            <Ionicons name="close-circle" size={24} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.typeSelection}>
        <Text style={styles.sectionTitle}>Hazard Type</Text>
        <View style={styles.typeGrid}>
          {(["pothole", "debris", "structure", "other"] as IncidentType[]).map(
            (type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  selectedType === type && styles.typeButtonSelected,
                ]}
                onPress={() => handleTypeSelect(type)}
              >
                <Ionicons
                  name={getTypeIcon(type)}
                  size={24}
                  color={selectedType === type ? "white" : "#666"}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    selectedType === type && styles.typeButtonTextSelected,
                  ]}
                >
                  {capitalizeFirst(type)}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      <View style={styles.descriptionContainer}>
        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Describe the hazard in detail..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={INCIDENT_CONFIG.MAX_TEXT_LENGTH}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>
          {description.length}/{INCIDENT_CONFIG.MAX_TEXT_LENGTH}
        </Text>
      </View>
    </View>
  );

  const renderSubmittingStep = () => (
    <View style={styles.stepContainer}>
      <LoadingSpinner message="Submitting your report..." />
      <Text style={styles.submittingText}>
        Your report is being processed and will appear on the map shortly.
      </Text>
    </View>
  );

  const getTypeIcon = (type: IncidentType): string => {
    switch (type) {
      case "pothole":
        return "car-outline";
      case "debris":
        return "trash-outline";
      case "structure":
        return "warning-outline";
      default:
        return "alert-circle-outline";
    }
  };

  const getTypeColor = (type: IncidentType): string => {
    switch (type) {
      case "pothole":
        return "#FF6B6B";
      case "debris":
        return "#4ECDC4";
      case "structure":
        return "#FFE66D";
      default:
        return "#95A5A6";
    }
  };

  const canProceed = () => {
    if (currentStep === "camera") {
      return !!photoUri;
    } else if (currentStep === "details") {
      return description.trim().length > 0;
    }
    return false;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={currentStep === "camera"}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Report Hazard</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentStep === "camera" && renderCameraStep()}
          {currentStep === "details" && renderDetailsStep()}
          {currentStep === "submitting" && renderSubmittingStep()}
        </ScrollView>

        {currentStep !== "submitting" && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                !canProceed() && styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!canProceed() || isSubmitting}
            >
              <Text
                style={[
                  styles.nextButtonText,
                  !canProceed() && styles.nextButtonTextDisabled,
                ]}
              >
                {currentStep === "camera" ? "Next" : "Submit Report"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#7F8C8D",
    marginBottom: 24,
    lineHeight: 24,
  },
  cameraContainer: {
    height: 200,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  cameraPlaceholder: {
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 16,
    color: "#BDC3C7",
    marginTop: 12,
  },
  cameraButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cameraButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  takePhotoButton: {
    backgroundColor: "#007AFF",
  },
  pickImageButton: {
    backgroundColor: "#34C759",
  },
  cameraButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    marginTop: 20,
  },
  photoPreview: {
    position: "relative",
    marginBottom: 20,
  },
  smallPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  typeSelection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  typeButton: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    alignItems: "center",
    marginBottom: 12,
  },
  typeButtonSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 8,
  },
  typeButtonTextSelected: {
    color: "white",
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: "#F8F9FA",
  },
  characterCount: {
    fontSize: 12,
    color: "#7F8C8D",
    textAlign: "right",
    marginTop: 4,
  },
  submittingText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 24,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  nextButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: "#BDC3C7",
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  nextButtonTextDisabled: {
    color: "#7F8C8D",
  },
});

export default ReportFlow;
