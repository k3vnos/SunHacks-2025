import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Location, MapRegion } from '../types';

dayjs.extend(relativeTime);

// Geohash utilities
export function encodeGeohash(lat: number, lon: number, precision: number = 7): string {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let latRange = [-90, 90];
  let lonRange = [-180, 180];
  let geohash = '';
  let bit = 0;
  let ch = 0;
  let even = true;

  while (geohash.length < precision) {
    if (even) {
      const mid = (lonRange[0] + lonRange[1]) / 2;
      if (lon >= mid) {
        ch |= (1 << (4 - bit));
        lonRange[0] = mid;
      } else {
        lonRange[1] = mid;
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        ch |= (1 << (4 - bit));
        latRange[0] = mid;
      } else {
        latRange[1] = mid;
      }
    }

    even = !even;
    bit++;

    if (bit === 5) {
      geohash += base32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

export function getGeohashPrefixes(lat: number, lon: number, radiusKm: number): string[] {
  const prefixes: string[] = [];
  const precision = Math.max(3, Math.min(7, Math.floor(-Math.log2(radiusKm / 100))));
  
  // Generate prefixes for the area around the point
  const step = 0.01; // Approximate step size
  const steps = Math.ceil(radiusKm / 111); // Rough conversion from km to degrees
  
  for (let i = -steps; i <= steps; i++) {
    for (let j = -steps; j <= steps; j++) {
      const testLat = lat + (i * step);
      const testLon = lon + (j * step);
      const prefix = encodeGeohash(testLat, testLon, precision);
      if (!prefixes.includes(prefix)) {
        prefixes.push(prefix);
      }
    }
  }
  
  return prefixes;
}

// Distance calculation
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Date formatting
export function formatRelativeTime(dateString: string): string {
  return dayjs(dateString).fromNow();
}

export function formatDate(dateString: string): string {
  return dayjs(dateString).format('MMM D, YYYY');
}

export function formatDateTime(dateString: string): string {
  return dayjs(dateString).format('MMM D, YYYY h:mm A');
}

// Location utilities
export function isValidLocation(location: Location | null): boolean {
  return (
    location !== null &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    !isNaN(location.latitude) &&
    !isNaN(location.longitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
}

export function createMapRegion(
  latitude: number,
  longitude: number,
  latitudeDelta: number = 0.0922,
  longitudeDelta: number = 0.0421
): MapRegion {
  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
}

// String utilities
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Error handling
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

// File utilities
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// Array utilities
export function groupBy<T, K extends string | number>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = key(item);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

export function uniqueBy<T, K>(array: T[], key: (item: T) => K): T[] {
  const seen = new Set<K>();
  return array.filter(item => {
    const keyValue = key(item);
    if (seen.has(keyValue)) {
      return false;
    }
    seen.add(keyValue);
    return true;
  });
}
