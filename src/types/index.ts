import { z } from 'zod';

// Incident Types
export const IncidentTypeSchema = z.enum(['debris', 'pothole', 'structure', 'other']);
export type IncidentType = z.infer<typeof IncidentTypeSchema>;

export const IncidentStatusSchema = z.enum(['open', 'acknowledged', 'resolved']);
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;

export const IncidentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lat: z.number(),
  lon: z.number(),
  geohash: z.string(),
  type: IncidentTypeSchema,
  status: IncidentStatusSchema,
  text: z.string(),
  aiSummary: z.string().optional(),
  aiFlags: z.object({
    nsfw: z.boolean(),
    sensitive: z.boolean(),
  }).optional(),
  photoKey: z.string().optional(),
  photoCdnUrl: z.string().optional(),
  score: z.number(),
  commentsCount: z.number(),
});

export type Incident = z.infer<typeof IncidentSchema>;

// Vote Types
export const VoteSchema = z.object({
  id: z.string(),
  incidentId: z.string(),
  userId: z.string(),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export type Vote = z.infer<typeof VoteSchema>;

// Comment Types
export const CommentSchema = z.object({
  id: z.string(),
  incidentId: z.string(),
  userId: z.string(),
  text: z.string(),
  createdAt: z.string(),
});

export type Comment = z.infer<typeof CommentSchema>;

// User Types
export const UserSchema = z.object({
  id: z.string(),
  handle: z.string(),
  reputation: z.number(),
  createdAt: z.string(),
  lastActiveAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;

// Device Types
export const DeviceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expoPushToken: z.string().optional(),
  fcmToken: z.string().optional(),
  platform: z.enum(['ios', 'android']),
  createdAt: z.string(),
});

export type Device = z.infer<typeof DeviceSchema>;

// API Request/Response Types
export const CreateIncidentRequestSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  type: IncidentTypeSchema,
  text: z.string(),
  photoKey: z.string().optional(),
});

export type CreateIncidentRequest = z.infer<typeof CreateIncidentRequestSchema>;

export const UploadRequestResponseSchema = z.object({
  uploadUrl: z.string(),
  photoKey: z.string(),
});

export type UploadRequestResponse = z.infer<typeof UploadRequestResponseSchema>;

export const NearbyIncidentsResponseSchema = z.object({
  items: z.array(IncidentSchema),
  cursor: z.string().optional(),
});

export type NearbyIncidentsResponse = z.infer<typeof NearbyIncidentsResponseSchema>;

export const IncidentDetailResponseSchema = z.object({
  incident: IncidentSchema,
  comments: z.array(CommentSchema),
});

export type IncidentDetailResponse = z.infer<typeof IncidentDetailResponseSchema>;

export const VoteRequestSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
});

export type VoteRequest = z.infer<typeof VoteRequestSchema>;

export const CommentRequestSchema = z.object({
  text: z.string(),
});

export type CommentRequest = z.infer<typeof CommentRequestSchema>;

// WebSocket Types
export const WebSocketMessageSchema = z.object({
  type: z.enum(['incident.created', 'incident.updated', 'incident.voted', 'incident.commented']),
  data: z.any(),
});

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

export const WebSocketSubscriptionSchema = z.object({
  action: z.enum(['subscribeArea', 'subscribeIncident']),
  geohashPrefix: z.string().optional(),
  incidentId: z.string().optional(),
});

export type WebSocketSubscription = z.infer<typeof WebSocketSubscriptionSchema>;

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// UI State Types
export interface MapState {
  region: MapRegion;
  incidents: Incident[];
  selectedIncident: Incident | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ReportState {
  isReporting: boolean;
  currentStep: 'camera' | 'details' | 'submitting';
  photoUri: string | null;
  incidentData: Partial<CreateIncidentRequest> | null;
  error: string | null;
}

// Notification Types
export interface NotificationData {
  type: 'incident_nearby' | 'incident_updated' | 'comment_added';
  incidentId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}
