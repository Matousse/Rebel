import { apiRequest } from './api';

/**
 * Create a new proof for a track
 */
export async function createProof(trackId) {
  const data = await apiRequest(`/api/tracks/${trackId}/proof`, {
    method: 'POST'
  });
  
  return data;
}

/**
 * Get proof for a track
 */
export async function getProof(trackId) {
  const data = await apiRequest(`/api/tracks/${trackId}/proof`);
  return data;
}

/**
 * Get all proofs for the current user
 */
export async function getUserProofs() {
  const data = await apiRequest('/api/proofs/user/me');
  return data;
}

/**
 * Verify a proof
 */
export async function verifyProof(proofId, audioFile) {
  const formData = new FormData();
  formData.append('audioFile', audioFile, audioFile.name);
  
  const data = await apiRequest(`/api/proofs/verify/${proofId}`, {
    method: 'POST',
    body: formData
  });
  
  return data;
}