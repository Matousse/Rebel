// Déterminer l'URL de base de l'API en fonction de l'environnement
const API_BASE_URL = '/rebel/api';

// Pour le développement local, décommenter la ligne ci-dessous
// const API_BASE_URL = 'http://localhost:5001';

/**
 * Base API service for making requests to the backend
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage if it exists
  const token = localStorage.getItem('token');
  
  // Set default headers
  const headers = {
    ...options.headers
  };
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Create request options
  const requestOptions = {
    ...options,
    headers
  };
  
  // Make request
  const response = await fetch(url, requestOptions);
  
  // Parse JSON response
  const data = await response.json();
  
  // Check if request was successful
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
}