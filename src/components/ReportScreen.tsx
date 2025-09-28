import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ReportScreenProps {
  onBack: () => void;
  onSubmit: (data: ReportData) => void;
}

interface ReportData {
  title: string;
  description: string;
  images: string[];
}

interface PhotoItem {
  id: string;
  uri: string;
  type: 'camera' | 'gallery';
}

export default function ReportScreen({ onBack, onSubmit }: ReportScreenProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // Generate AI title based on description
  const generateTitle = async (description: string) => {
    if (!description.trim()) return;
    
    setIsGeneratingTitle(true);
    try {
      // TODO: Integrate with Gemini AI API
      // For now, we'll simulate AI title generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate AI-generated title based on description
      const aiTitle = `Hazard Report: ${description.split(' ').slice(0, 3).join(' ')}`;
      setTitle(aiTitle);
    } catch (error) {
      console.error('Error generating title:', error);
      Alert.alert('Error', 'Failed to generate title. Please try again.');
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto: PhotoItem = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        type: 'camera',
      };
      setPhotos(prev => [...prev, newPhoto]);
    }
  };

  // Select photos from gallery
  const selectPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library permission is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhotos: PhotoItem[] = result.assets.map((asset, index) => ({
        id: `${Date.now()}-${index}`,
        uri: asset.uri,
        type: 'gallery',
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  // Delete photo
  const deletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Information', 'Please fill in both title and description.');
      return;
    }

    const reportData: ReportData = {
      title: title.trim(),
      description: description.trim(),
      images: photos.map(photo => photo.uri),
    };

    onSubmit(reportData);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Ionicons name="flag" size={20} color="#E74C3C" />
          <Text style={styles.logoText}>
            <Text style={styles.logoTextBlack}>Flag</Text>
            <Text style={styles.logoTextRed}>It</Text>
          </Text>
        </View>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title for your report"
            placeholderTextColor="#999999"
          />
          {description.trim() && (
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => generateTitle(description)}
              disabled={isGeneratingTitle}
            >
              <Ionicons 
                name="sparkles" 
                size={16} 
                color={isGeneratingTitle ? "#999999" : "#E74C3C"} 
              />
              <Text style={[styles.aiButtonText, isGeneratingTitle && styles.aiButtonTextDisabled]}>
                {isGeneratingTitle ? 'Generating...' : 'Generate with AI'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Describe the Image</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what you see in detail..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Photo Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Attached Images</Text>
          
          {/* Photo Action Buttons */}
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoButton} onPress={selectPhotos}>
              <Ionicons name="link" size={20} color="#666666" />
              <Text style={styles.photoButtonText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Ionicons name="camera" size={20} color="#666666" />
              <Text style={styles.photoButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {/* Photo Grid */}
          {photos.length > 0 && (
            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deletePhoto(photo.id)}
                  >
                    <Ionicons name="close-circle" size={24} color="#E74C3C" />
                  </TouchableOpacity>
                  <View style={styles.photoTypeIndicator}>
                    <Ionicons
                      name={photo.type === 'camera' ? 'camera' : 'images'}
                      size={12}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoTextBlack: {
    color: '#000000',
  },
  logoTextRed: {
    color: '#E74C3C',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  titleInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  descriptionInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  aiButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '500',
  },
  aiButtonTextDisabled: {
    color: '#999999',
  },
  photoActions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  photoButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  photoTypeIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
});
