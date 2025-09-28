import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  AuthState, 
  MapState, 
  ReportState, 
  User, 
  Incident, 
  Location, 
  MapRegion 
} from '../types';
import { STORAGE_KEYS } from '../constants';

// Auth Store
interface AuthStore extends AuthState {
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: (user: User, token: string) => {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },
      
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      setError: (error: string | null) => {
        set({ error });
      },
      
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },
    }),
    {
      name: STORAGE_KEYS.USER_DATA,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Map Store
interface MapStore extends MapState {
  setRegion: (region: MapRegion) => void;
  setIncidents: (incidents: Incident[]) => void;
  addIncident: (incident: Incident) => void;
  updateIncident: (incident: Incident) => void;
  removeIncident: (incidentId: string) => void;
  setSelectedIncident: (incident: Incident | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearIncidents: () => void;
}

export const useMapStore = create<MapStore>()(
  persist(
    (set, get) => ({
      region: {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
      incidents: [],
      selectedIncident: null,
      isLoading: false,
      error: null,
      
      setRegion: (region: MapRegion) => {
        set({ region });
      },
      
      setIncidents: (incidents: Incident[]) => {
        set({ incidents });
      },
      
      addIncident: (incident: Incident) => {
        const currentIncidents = get().incidents;
        const exists = currentIncidents.some(i => i.id === incident.id);
        if (!exists) {
          set({ incidents: [incident, ...currentIncidents] });
        }
      },
      
      updateIncident: (incident: Incident) => {
        const currentIncidents = get().incidents;
        set({
          incidents: currentIncidents.map(i =>
            i.id === incident.id ? incident : i
          ),
        });
      },
      
      removeIncident: (incidentId: string) => {
        const currentIncidents = get().incidents;
        set({
          incidents: currentIncidents.filter(i => i.id !== incidentId),
        });
      },
      
      setSelectedIncident: (incident: Incident | null) => {
        set({ selectedIncident: incident });
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      setError: (error: string | null) => {
        set({ error });
      },
      
      clearIncidents: () => {
        set({ incidents: [] });
      },
    }),
    {
      name: STORAGE_KEYS.CACHED_INCIDENTS,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        incidents: state.incidents,
        region: state.region,
      }),
    }
  )
);

// Report Store
interface ReportStore extends ReportState {
  setReporting: (reporting: boolean) => void;
  setCurrentStep: (step: 'camera' | 'details' | 'submitting') => void;
  setPhotoUri: (uri: string | null) => void;
  setIncidentData: (data: Partial<CreateIncidentRequest> | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      isReporting: false,
      currentStep: 'camera',
      photoUri: null,
      incidentData: null,
      error: null,
      
      setReporting: (reporting: boolean) => {
        set({ isReporting: reporting });
      },
      
      setCurrentStep: (step: 'camera' | 'details' | 'submitting') => {
        set({ currentStep: step });
      },
      
      setPhotoUri: (uri: string | null) => {
        set({ photoUri: uri });
      },
      
      setIncidentData: (data: Partial<CreateIncidentRequest> | null) => {
        set({ incidentData: data });
      },
      
      setError: (error: string | null) => {
        set({ error });
      },
      
      reset: () => {
        set({
          isReporting: false,
          currentStep: 'camera',
          photoUri: null,
          incidentData: null,
          error: null,
        });
      },
    }),
    {
      name: STORAGE_KEYS.DRAFT_REPORT,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        photoUri: state.photoUri,
        incidentData: state.incidentData,
      }),
    }
  )
);

// Location Store
interface LocationStore {
  currentLocation: Location | null;
  lastKnownLocation: Location | null;
  isLocationEnabled: boolean;
  locationError: string | null;
  setCurrentLocation: (location: Location | null) => void;
  setLastKnownLocation: (location: Location | null) => void;
  setLocationEnabled: (enabled: boolean) => void;
  setLocationError: (error: string | null) => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      currentLocation: null,
      lastKnownLocation: null,
      isLocationEnabled: false,
      locationError: null,
      
      setCurrentLocation: (location: Location | null) => {
        set({ 
          currentLocation: location,
          lastKnownLocation: location,
        });
      },
      
      setLastKnownLocation: (location: Location | null) => {
        set({ lastKnownLocation: location });
      },
      
      setLocationEnabled: (enabled: boolean) => {
        set({ isLocationEnabled: enabled });
      },
      
      setLocationError: (error: string | null) => {
        set({ locationError: error });
      },
    }),
    {
      name: STORAGE_KEYS.LAST_LOCATION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastKnownLocation: state.lastKnownLocation,
        isLocationEnabled: state.isLocationEnabled,
      }),
    }
  )
);

// Notification Store
interface NotificationStore {
  isEnabled: boolean;
  nearbyRadius: number;
  deviceToken: string | null;
  lastNotificationTime: number;
  setIsEnabled: (enabled: boolean) => void;
  setNearbyRadius: (radius: number) => void;
  setDeviceToken: (token: string | null) => void;
  setLastNotificationTime: (time: number) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      isEnabled: true,
      nearbyRadius: 100, // meters
      deviceToken: null,
      lastNotificationTime: 0,
      
      setIsEnabled: (enabled: boolean) => {
        set({ isEnabled: enabled });
      },
      
      setNearbyRadius: (radius: number) => {
        set({ nearbyRadius: radius });
      },
      
      setDeviceToken: (token: string | null) => {
        set({ deviceToken: token });
      },
      
      setLastNotificationTime: (time: number) => {
        set({ lastNotificationTime: time });
      },
    }),
    {
      name: STORAGE_KEYS.NOTIFICATION_SETTINGS,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        nearbyRadius: state.nearbyRadius,
        lastNotificationTime: state.lastNotificationTime,
      }),
    }
  )
);
