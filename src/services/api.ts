import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  CreateIncidentRequest,
  UploadRequestResponse,
  NearbyIncidentsResponse,
  IncidentDetailResponse,
  VoteRequest,
  CommentRequest,
  User,
  Incident,
  Comment,
} from '../types';
import { API_CONFIG } from '../constants';

class ApiService {
  private api: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.setAuthToken(null);
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Auth endpoints
  async getMe(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/me');
    return response.data;
  }

  // Incident endpoints
  async requestUpload(): Promise<UploadRequestResponse> {
    const response: AxiosResponse<UploadRequestResponse> = await this.api.post(
      '/incidents/request-upload'
    );
    return response.data;
  }

  async createIncident(data: CreateIncidentRequest): Promise<Incident> {
    const response: AxiosResponse<Incident> = await this.api.post(
      '/incidents',
      data
    );
    return response.data;
  }

  async getNearbyIncidents(
    lat: number,
    lon: number,
    radius: number = 5,
    after?: string
  ): Promise<NearbyIncidentsResponse> {
    const params: Record<string, any> = {
      lat,
      lon,
      radius,
    };
    
    if (after) {
      params.after = after;
    }

    const response: AxiosResponse<NearbyIncidentsResponse> = await this.api.get(
      '/incidents/near',
      { params }
    );
    return response.data;
  }

  async getIncidentDetail(id: string): Promise<IncidentDetailResponse> {
    const response: AxiosResponse<IncidentDetailResponse> = await this.api.get(
      `/incidents/${id}`
    );
    return response.data;
  }

  async voteIncident(id: string, vote: VoteRequest): Promise<{ score: number }> {
    const response: AxiosResponse<{ score: number }> = await this.api.post(
      `/incidents/${id}/vote`,
      vote
    );
    return response.data;
  }

  async addComment(id: string, comment: CommentRequest): Promise<Comment> {
    const response: AxiosResponse<Comment> = await this.api.post(
      `/incidents/${id}/comment`,
      comment
    );
    return response.data;
  }

  async updateIncidentStatus(
    id: string,
    status: 'open' | 'acknowledged' | 'resolved'
  ): Promise<Incident> {
    const response: AxiosResponse<Incident> = await this.api.patch(
      `/incidents/${id}/status`,
      { status }
    );
    return response.data;
  }

  // Device/Notification endpoints
  async registerDevice(token: string, platform: 'ios' | 'android'): Promise<void> {
    await this.api.post('/devices', { token, platform });
  }

  // Upload photo to S3
  async uploadPhoto(uploadUrl: string, photoUri: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    await axios.put(uploadUrl, formData, {
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });
  }

  // Retry logic for failed requests
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = API_CONFIG.RETRY_ATTEMPTS
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on 4xx errors (client errors)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError!;
  }
}

// Singleton instance
export const apiService = new ApiService();

// Export individual methods for easier testing
export const {
  getMe,
  requestUpload,
  createIncident,
  getNearbyIncidents,
  getIncidentDetail,
  voteIncident,
  addComment,
  updateIncidentStatus,
  registerDevice,
  uploadPhoto,
  retryRequest,
} = apiService;
