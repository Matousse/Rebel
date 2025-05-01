import { apiRequest } from './api';

/**
 * Login with Magic Link
 */
export async function loginWithMagic(didToken, username, isArtist) {
  const data = await apiRequest('/api/magic/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      didToken,
      username,
      isArtist
    })
  });
  
  if (data.success && data.data.token) {
    localStorage.setItem('token', data.data.token);
    return { ...data.data.user, token: data.data.token };
  }
  
  throw new Error(data.message || 'Login failed');
}

/**
 * Get user profile
 */
export async function getUserProfile(token) {
  const data = await apiRequest('/api/users/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (data.success) {
    return data.data;
  }
  
  throw new Error(data.message || 'Failed to fetch user profile');
}

/**
 * Register new user
 */
export async function registerUser(userData) {
  const data = await apiRequest('/api/users/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  if (data.success && data.data.token) {
    localStorage.setItem('token', data.data.token);
    return { ...data.data.user, token: data.data.token };
  }
  
  throw new Error(data.message || 'Registration failed');
}

/**
 * Login with email and password
 */
export async function loginUser(email, password) {
  const data = await apiRequest('/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  if (data.success && data.data.token) {
    localStorage.setItem('token', data.data.token);
    return { ...data.data.user, token: data.data.token };
  }
  
  throw new Error(data.message || 'Login failed');
}