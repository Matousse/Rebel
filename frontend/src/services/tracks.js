import { apiRequest } from './api';

/**
 * Upload a new track
 */
export async function uploadTrack(trackData) {
  const formData = new FormData();
  
  // Add track data to FormData
  Object.entries(trackData).forEach(([key, value]) => {
    if (key === 'audioFile') {
      formData.append(key, value, value.name);
    } else {
      formData.append(key, value);
    }
  });
  
  const data = await apiRequest('/api/tracks', {
    method: 'POST',
    body: formData
  });
  
  return data;
}

/**
 * Get all tracks for the current user
 */
export async function getUserTracks() {
  const data = await apiRequest('/api/tracks/user');
  return data;
}

/**
 * Get a specific track by ID
 */
export async function getTrack(trackId) {
  const data = await apiRequest(`/api/tracks/${trackId}`);
  return data;
}