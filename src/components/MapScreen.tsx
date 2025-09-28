import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Alert,
  Pressable,
  Text,
  StatusBar,
  Image,
  Modal,
  Dimensions,
  ScrollView,
  TextInput,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Hazard {
  id: string;
  title: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  timestamp: string;
  upvotes?: number;
  downvotes?: number;
  comments?: Comment[];
  category?: string;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  upvotes?: number;
  downvotes?: number;
}

interface MapScreenProps {
  onFlagPress: () => void;
  hazards: Hazard[];
}

export default function MapScreen({ onFlagPress, hazards }: MapScreenProps) {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [showHazardModal, setShowHazardModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [userVotes, setUserVotes] = useState<{[key: string]: 'up' | 'down' | null}>({});
  const [liveVoteCounts, setLiveVoteCounts] = useState<{[key: string]: {upvotes: number, downvotes: number}}>({});
  const [commentVoteCounts, setCommentVoteCounts] = useState<{[key: string]: {upvotes: number, downvotes: number}}>({});
  const [hazardCategories, setHazardCategories] = useState<{[key: string]: string}>({});

  // Initialize vote counts when hazards change
  useEffect(() => {
    const initialCounts: {[key: string]: {upvotes: number, downvotes: number}} = {};
    const initialCommentCounts: {[key: string]: {upvotes: number, downvotes: number}} = {};
    const initialCategories: {[key: string]: string} = {};
    
    hazards.forEach(hazard => {
      if (!liveVoteCounts[hazard.id]) {
        initialCounts[hazard.id] = {
          upvotes: hazard.upvotes || 0,
          downvotes: hazard.downvotes || 0,
        };
      }
      
      // Initialize hazard categories
      if (!hazardCategories[hazard.id]) {
        initialCategories[hazard.id] = hazard.category || 'Hazard';
      }
      
      // Initialize comment vote counts
      if (hazard.comments) {
        hazard.comments.forEach(comment => {
          if (!commentVoteCounts[comment.id]) {
            initialCommentCounts[comment.id] = {
              upvotes: comment.upvotes || 0,
              downvotes: comment.downvotes || 0,
            };
          }
        });
      }
    });
    
    if (Object.keys(initialCounts).length > 0) {
      setLiveVoteCounts(prev => ({ ...prev, ...initialCounts }));
    }
    if (Object.keys(initialCommentCounts).length > 0) {
      setCommentVoteCounts(prev => ({ ...prev, ...initialCommentCounts }));
    }
    if (Object.keys(initialCategories).length > 0) {
      setHazardCategories(prev => ({ ...prev, ...initialCategories }));
    }
  }, [hazards]);

  // Simple location initialization - no watching
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        setIsLoadingLocation(true);
        
        // Ask location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Location permission is required to show your position.');
          setIsLoadingLocation(false);
          return;
        }
        
        // Get initial location only
        const loc = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.High
        });
        
        const initial = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(initial);
        setHasLocation(true);
        setIsLoadingLocation(false);
        
        console.log('MapScreen - Initial location set:', loc.coords);
      } catch (error) {
        console.error('Location initialization error:', error);
        setIsLoadingLocation(false);
        Alert.alert('Location Error', 'Could not get your location. Please check your location settings.');
      }
    };

    initializeLocation();
  }, []);

  const recenter = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High
      });
      const next = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      // Update region state
      setRegion(next);
      
      // Animate to new location
      if (mapRef.current) {
        try {
          mapRef.current.animateToRegion(next, 1000);
        } catch (error) {
          console.log('Recenter animation error:', error);
          // Fallback: just update the region without animation
          setRegion(next);
        }
      }
    } catch (e) {
      console.error('Recenter error:', e);
      Alert.alert('Location error', 'Could not get current location. Please check your location settings.');
    }
  };

  const takePhoto = async () => {
    // Ask camera permission then open camera
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!camPerm.granted) {
      Alert.alert('Permission needed', 'Camera permission is required to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled) {
      // You now have result.assets[0].uri
      Alert.alert('Photo captured', result.assets?.[0]?.uri ?? 'Photo saved');
      // TODO: upload to S3 or send to your API
    }
  };

  const handleMarkerPress = (hazard: Hazard) => {
    setSelectedHazard(hazard);
    setShowHazardModal(true);
  };

  const closeHazardModal = () => {
    setShowHazardModal(false);
    setSelectedHazard(null);
    setNewComment('');
  };

  const handleVote = (hazardId: string, voteType: 'up' | 'down') => {
    const currentVote = userVotes[hazardId];
    const currentCounts = liveVoteCounts[hazardId] || { upvotes: 0, downvotes: 0 };
    let newVote: 'up' | 'down' | null = null;
    let newCounts = { ...currentCounts };
    
    // Toggle logic: if same vote, remove it; otherwise set new vote
    if (currentVote === voteType) {
      newVote = null; // Remove vote
      // Decrease the count for the vote being removed
      if (voteType === 'up') {
        newCounts.upvotes = Math.max(0, newCounts.upvotes - 1);
      } else {
        newCounts.downvotes = Math.max(0, newCounts.downvotes - 1);
      }
    } else {
      newVote = voteType; // Set new vote
      
      // Remove previous vote if exists
      if (currentVote === 'up') {
        newCounts.upvotes = Math.max(0, newCounts.upvotes - 1);
      } else if (currentVote === 'down') {
        newCounts.downvotes = Math.max(0, newCounts.downvotes - 1);
      }
      
      // Add new vote
      if (voteType === 'up') {
        newCounts.upvotes += 1;
      } else {
        newCounts.downvotes += 1;
      }
    }
    
    setUserVotes(prev => ({
      ...prev,
      [hazardId]: newVote
    }));
    
    setLiveVoteCounts(prev => ({
      ...prev,
      [hazardId]: newCounts
    }));
    
    // TODO: Send vote to backend
    console.log(`Voted ${voteType} for hazard ${hazardId}`, newCounts);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedHazard) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment.trim(),
      author: 'Anonymous User', // TODO: Get from user context
      timestamp: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
    };
    
    // TODO: Send comment to backend
    console.log('Adding comment:', comment);
    
    // Clear comment input
    setNewComment('');
    
    // Show success message
    Alert.alert('Success', 'Comment added successfully!');
  };

  const handleCommentVote = (commentId: string, voteType: 'up' | 'down') => {
    const currentCounts = commentVoteCounts[commentId] || { upvotes: 0, downvotes: 0 };
    let newCounts = { ...currentCounts };
    
    // Simple increment for comment votes (no toggle logic for comments)
    if (voteType === 'up') {
      newCounts.upvotes += 1;
    } else {
      newCounts.downvotes += 1;
    }
    
    setCommentVoteCounts(prev => ({
      ...prev,
      [commentId]: newCounts
    }));
    
    // TODO: Send comment vote to backend
    console.log(`Voted ${voteType} for comment ${commentId}`, newCounts);
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with FlagIt Logo */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/FlagIt_Logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Loading Indicator */}
      {isLoadingLocation && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      )}

      {/* Map */}
      {!isLoadingLocation && region && region.latitude && region.longitude && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={hasLocation}
          showsMyLocationButton={false}
          initialRegion={region}
          region={region}
          onMapReady={() => {
            // Don't call recenter here to avoid conflicts
            console.log('Map is ready');
          }}
          mapType="standard"
          followsUserLocation={false}
          userLocationAnnotationTitle="Your Location"
        >
          {/* Hazard Markers */}
          {hazards.map((hazard) => (
            <Marker
              key={hazard.id}
              coordinate={{
                latitude: hazard.latitude,
                longitude: hazard.longitude,
              }}
              onPress={() => handleMarkerPress(hazard)}
            >
              <View style={styles.markerContainer}>
                <Ionicons name="flag" size={24} color="#E74C3C" />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Flag Button - Main Action */}
      <Pressable style={styles.flagBtn} onPress={onFlagPress}>
        <Ionicons name="flag" size={32} color="#FFFFFF" />
      </Pressable>

      {/* Recenter Button */}
      <Pressable style={styles.recenterBtn} onPress={recenter}>
        <Ionicons name="locate" size={20} color="#2C3E50" />
      </Pressable>

      {/* Hazard Details Modal */}
      <Modal
        visible={showHazardModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeHazardModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedHazard && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedHazard.title}</Text>
                  <Pressable onPress={closeHazardModal} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#666666" />
                  </Pressable>
                </View>
                
                <Text style={styles.modalDescription}>{selectedHazard.description}</Text>
                
                {selectedHazard.images.length > 0 && (
                  <View style={styles.imageContainer}>
                    <Text style={styles.imageLabel}>Attached Images:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {selectedHazard.images.map((imageUri, index) => (
                        <Image
                          key={index}
                          source={{ uri: imageUri }}
                          style={styles.hazardImage}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                <View style={styles.timestampContainer}>
                  <Text style={styles.timestamp}>
                    Reported: {new Date(selectedHazard.timestamp).toLocaleDateString()}
                  </Text>
                  <View style={styles.categoryContainer}>
                    <Text style={styles.categoryLabel}>Category:</Text>
                    <Text style={styles.categoryText}>
                      {hazardCategories[selectedHazard.id] || selectedHazard.category || 'Hazard'}
                    </Text>
                  </View>
                </View>

                {/* Voting Section */}
                <View style={styles.votingSection}>
                  <Text style={styles.sectionTitle}>Is this still there?</Text>
                  <View style={styles.voteButtons}>
                    <Pressable 
                      style={[
                        styles.voteButton, 
                        styles.upvoteButton,
                        userVotes[selectedHazard.id] === 'up' && styles.voteButtonActive
                      ]}
                      onPress={() => handleVote(selectedHazard.id, 'up')}
                    >
                      <Ionicons 
                        name="thumbs-up" 
                        size={20} 
                        color={userVotes[selectedHazard.id] === 'up' ? '#FFFFFF' : '#27AE60'} 
                      />
                      <Text style={[
                        styles.voteButtonText,
                        userVotes[selectedHazard.id] === 'up' && styles.voteButtonTextActive
                      ]}>
                        Yes ({liveVoteCounts[selectedHazard.id]?.upvotes || selectedHazard.upvotes || 0})
                      </Text>
                    </Pressable>
                    
                    <Pressable 
                      style={[
                        styles.voteButton, 
                        styles.downvoteButton,
                        userVotes[selectedHazard.id] === 'down' && styles.voteButtonActive
                      ]}
                      onPress={() => handleVote(selectedHazard.id, 'down')}
                    >
                      <Ionicons 
                        name="thumbs-down" 
                        size={20} 
                        color={userVotes[selectedHazard.id] === 'down' ? '#FFFFFF' : '#E74C3C'} 
                      />
                      <Text style={[
                        styles.voteButtonText,
                        userVotes[selectedHazard.id] === 'down' && styles.voteButtonTextActive
                      ]}>
                        No ({liveVoteCounts[selectedHazard.id]?.downvotes || selectedHazard.downvotes || 0})
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Comments Section */}
                <View style={styles.commentsSection}>
                  <Text style={styles.sectionTitle}>Comments</Text>
                  
                  {/* Add Comment */}
                  <View style={styles.addCommentContainer}>
                    <TextInput
                      style={styles.commentInput}
                      value={newComment}
                      onChangeText={setNewComment}
                      placeholder="Add a comment..."
                      placeholderTextColor="#999999"
                      multiline
                      numberOfLines={2}
                    />
                    <Pressable 
                      style={styles.addCommentButton}
                      onPress={handleAddComment}
                    >
                      <Ionicons name="send" size={20} color="#FFFFFF" />
                    </Pressable>
                  </View>

                  {/* Comments List */}
                  <View style={styles.commentsList}>
                    {(selectedHazard.comments || []).map((comment) => (
                      <View key={comment.id} style={styles.commentItem}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.commentAuthor}>{comment.author}</Text>
                          <Text style={styles.commentTime}>
                            {new Date(comment.timestamp).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>{comment.text}</Text>
                        <View style={styles.commentVotes}>
                          <Pressable 
                            style={styles.commentVoteButton}
                            onPress={() => handleCommentVote(comment.id, 'up')}
                          >
                            <Ionicons name="thumbs-up" size={16} color="#27AE60" />
                            <Text style={styles.commentVoteText}>{commentVoteCounts[comment.id]?.upvotes || comment.upvotes || 0}</Text>
                          </Pressable>
                          <Pressable 
                            style={styles.commentVoteButton}
                            onPress={() => handleCommentVote(comment.id, 'down')}
                          >
                            <Ionicons name="thumbs-down" size={16} color="#E74C3C" />
                            <Text style={styles.commentVoteText}>{commentVoteCounts[comment.id]?.downvotes || comment.downvotes || 0}</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                    
                    {(!selectedHazard.comments || selectedHazard.comments.length === 0) && (
                      <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
                    )}
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  logo: {
    height: 40,
    width: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  flagBtn: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  recenterBtn: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  markerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E74C3C',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    maxHeight: height * 0.8,
    width: width - 40,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 16,
    color: '#7F8C8D',
    lineHeight: 22,
    marginBottom: 16,
  },
  imageContainer: {
    marginBottom: 16,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  hazardImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    resizeMode: 'cover',
  },
  timestampContainer: {
    marginTop: 12,
  },
  timestamp: {
    fontSize: 12,
    color: '#95A5A6',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  categoryText: {
    fontSize: 12,
    color: 'black',
    fontWeight: '500',
  },
  // Voting Section Styles
  votingSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  upvoteButton: {
    borderColor: '#27AE60',
    backgroundColor: '#F8FFF8',
  },
  downvoteButton: {
    borderColor: '#E74C3C',
    backgroundColor: '#FFF8F8',
  },
  voteButtonActive: {
    backgroundColor: '#2C3E50',
  },
  voteButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  voteButtonTextActive: {
    color: '#FFFFFF',
  },
  // Comments Section Styles
  commentsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
    minHeight: 40,
    maxHeight: 80,
  },
  addCommentButton: {
    backgroundColor: '#E74C3C',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E74C3C',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
  },
  commentTime: {
    fontSize: 10,
    color: '#95A5A6',
  },
  commentText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 18,
    marginBottom: 8,
  },
  commentVotes: {
    flexDirection: 'row',
    gap: 16,
  },
  commentVoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentVoteText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  noCommentsText: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});