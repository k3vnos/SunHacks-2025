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
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useIncidentDetail,
  useVoteIncident,
  useAddComment,
  useOptimisticVote,
} from "../hooks/useQueries";
import { useWebSocketIntegration } from "../hooks/useQueries";
import { Incident, Comment } from "../types";
import { INCIDENT_CONFIG, SUCCESS_MESSAGES } from "../constants";
import {
  formatRelativeTime,
  calculateDistance,
  capitalizeFirst,
} from "../utils";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

interface IncidentDetailScreenProps {
  incidentId: string;
  userLocation?: { latitude: number; longitude: number } | null;
}

const IncidentDetailScreen: React.FC<IncidentDetailScreenProps> = ({
  incidentId,
  userLocation,
}) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: incidentData,
    isLoading,
    error,
    refetch,
  } = useIncidentDetail(incidentId);

  const { optimisticVote, isVoting } = useOptimisticVote();
  const addCommentMutation = useAddComment();
  const { subscribeToIncident, unsubscribeFromIncident } =
    useWebSocketIntegration();

  const incident = incidentData?.incident;
  const comments = incidentData?.comments || [];

  // Subscribe to WebSocket updates for this incident
  useEffect(() => {
    subscribeToIncident(incidentId);

    return () => {
      unsubscribeFromIncident(incidentId);
    };
  }, [incidentId, subscribeToIncident, unsubscribeFromIncident]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleVote = useCallback(
    async (value: 1 | -1) => {
      if (!incident) return;

      try {
        await optimisticVote(incident.id, value);
      } catch (error) {
        Alert.alert("Error", "Failed to vote. Please try again.");
      }
    },
    [incident, optimisticVote]
  );

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !incident) return;

    setIsSubmittingComment(true);

    try {
      await addCommentMutation.mutateAsync({
        id: incident.id,
        comment: { text: newComment.trim() },
      });

      setNewComment("");
      Alert.alert("Success", SUCCESS_MESSAGES.COMMENT_ADDED);
    } catch (error) {
      Alert.alert("Error", "Failed to add comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  }, [newComment, incident, addCommentMutation]);

  const getIncidentIcon = (type: string): string => {
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

  const getIncidentColor = (type: string): string => {
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "open":
        return "#E74C3C";
      case "acknowledged":
        return "#F39C12";
      case "resolved":
        return "#27AE60";
      default:
        return "#95A5A6";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading incident details..." />
      </SafeAreaView>
    );
  }

  if (error || !incident) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage
          message={error?.message || "Failed to load incident details"}
          onRetry={handleRefresh}
        />
      </SafeAreaView>
    );
  }

  const distance = userLocation
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        incident.lat,
        incident.lon
      )
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.typeContainer}>
              <View
                style={[
                  styles.typeIcon,
                  { backgroundColor: getIncidentColor(incident.type) },
                ]}
              >
                <Ionicons
                  name={getIncidentIcon(incident.type) as any}
                  size={24}
                  color="white"
                />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeText}>
                  {capitalizeFirst(incident.type)}
                </Text>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(incident.status) },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {capitalizeFirst(incident.status)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>{incident.score}</Text>
              <Text style={styles.scoreLabel}>votes</Text>
            </View>
          </View>

          {/* Photo */}
          {incident.photoCdnUrl && (
            <Image
              source={{ uri: incident.photoCdnUrl }}
              style={styles.photo}
            />
          )}

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {incident.aiSummary || incident.text}
            </Text>
          </View>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#7F8C8D" />
              <Text style={styles.metaText}>
                {formatRelativeTime(incident.createdAt)}
              </Text>
            </View>

            {distance !== null && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color="#7F8C8D" />
                <Text style={styles.metaText}>
                  {distance < 1
                    ? `${Math.round(distance * 1000)}m away`
                    : `${distance.toFixed(1)}km away`}
                </Text>
              </View>
            )}

            <View style={styles.metaItem}>
              <Ionicons name="chatbubble-outline" size={16} color="#7F8C8D" />
              <Text style={styles.metaText}>
                {comments.length} comment{comments.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {/* Vote Buttons */}
          <View style={styles.voteContainer}>
            <TouchableOpacity
              style={[styles.voteButton, styles.upvoteButton]}
              onPress={() => handleVote(1)}
              disabled={isVoting}
            >
              <Ionicons name="thumbs-up" size={20} color="white" />
              <Text style={styles.voteButtonText}>Upvote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.voteButton, styles.downvoteButton]}
              onPress={() => handleVote(-1)}
              disabled={isVoting}
            >
              <Ionicons name="thumbs-down" size={20} color="white" />
              <Text style={styles.voteButtonText}>Downvote</Text>
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Comments</Text>

            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}

            {comments.length === 0 && (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubble-outline" size={32} color="#BDC3C7" />
                <Text style={styles.emptyCommentsText}>
                  No comments yet. Be the first to comment!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={INCIDENT_CONFIG.MAX_COMMENT_LENGTH}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() || isSubmittingComment) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleAddComment}
            disabled={!newComment.trim() || isSubmittingComment}
          >
            <Ionicons
              name="send"
              size={20}
              color={
                newComment.trim() && !isSubmittingComment ? "white" : "#BDC3C7"
              }
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
  return (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>Anonymous User</Text>
        <Text style={styles.commentTime}>
          {formatRelativeTime(comment.createdAt)}
        </Text>
      </View>
      <Text style={styles.commentText}>{comment.text}</Text>
    </View>
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  scoreContainer: {
    alignItems: "center",
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#27AE60",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    marginTop: 2,
  },
  photo: {
    width: "100%",
    height: 200,
    backgroundColor: "#F8F9FA",
  },
  descriptionContainer: {
    padding: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: "#34495E",
    lineHeight: 24,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E5E5",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 14,
    color: "#7F8C8D",
    marginLeft: 6,
  },
  voteContainer: {
    flexDirection: "row",
    padding: 20,
    justifyContent: "space-around",
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: "center",
  },
  upvoteButton: {
    backgroundColor: "#27AE60",
  },
  downvoteButton: {
    backgroundColor: "#E74C3C",
  },
  voteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  commentsSection: {
    padding: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 16,
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F9FA",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
  },
  commentTime: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  commentText: {
    fontSize: 14,
    color: "#34495E",
    lineHeight: 20,
  },
  emptyComments: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 12,
    textAlign: "center",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#F8F9FA",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: "white",
  },
  sendButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#BDC3C7",
  },
});

export default IncidentDetailScreen;
