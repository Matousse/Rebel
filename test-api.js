const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Basic configuration
const API_URL = 'http://localhost:5000/api';
let authToken = null;
let userId = null;
let trackId = '60a1f2c3d4e5f6a7b8c9d0e1'; // Fictitious track ID for testing

// Function to display test results
const displayResult = (title, response) => {
  console.log('\n===================================');
  console.log(`TEST: ${title}`);
  console.log('-----------------------------------');
  console.log('Status:', response.status);
  console.log('Data:', JSON.stringify(response.data, null, 2));
  console.log('===================================\n');
};

// Function to handle errors
const handleError = (title, error) => {
  console.error('\n===================================');
  console.error(`ERROR in ${title}:`);
  console.error('-----------------------------------');
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', JSON.stringify(error.response.data, null, 2));
  } else {
    console.error(error.message);
  }
  console.error('===================================\n');
};

// User functionality tests
const runTests = async () => {
  try {
    console.log('Starting API tests...\n');

    // 1. User registration test
    try {
      const registerResponse = await axios.post(`${API_URL}/users/register`, {
        username: `testuser_${Date.now().toString().slice(-4)}`,
        email: `testuser_${Date.now().toString().slice(-4)}@example.com`,
        password: 'password123',
        isArtist: true
      });
      displayResult('User registration', registerResponse);
      authToken = registerResponse.data.token;
      userId = registerResponse.data.user.id;
    } catch (error) {
      handleError('User registration', error);
    }

    // 2. User login test
    try {
      const loginResponse = await axios.post(`${API_URL}/users/login`, {
        email: `testuser_${Date.now().toString().slice(-4)}@example.com`,
        password: 'password123'
      });
      displayResult('User login', loginResponse);
      // Use token if registration token is not available
      if (!authToken) {
        authToken = loginResponse.data.token;
        userId = loginResponse.data.user.id;
      }
    } catch (error) {
      handleError('User login', error);
      // If both registration and login fail, we can't continue testing
      if (!authToken) {
        console.error('Cannot continue tests without authentication');
        return;
      }
    }

    // Authentication headers configuration for subsequent requests
    const authConfig = {
      headers: { Authorization: `Bearer ${authToken}` }
    };

    // 3. Profile retrieval test
    try {
      const profileResponse = await axios.get(`${API_URL}/users/profile`, authConfig);
      displayResult('Profile retrieval', profileResponse);
    } catch (error) {
      handleError('Profile retrieval', error);
    }

    // 4. Profile update test
    try {
      const updateResponse = await axios.put(`${API_URL}/users/profile`, {
        bio: `Bio updated on ${new Date().toISOString()}`,
        location: 'Paris, France'
      }, authConfig);
      displayResult('Profile update', updateResponse);
    } catch (error) {
      handleError('Profile update', error);
    }

    // 5. User retrieval by ID test
    try {
      const userResponse = await axios.get(`${API_URL}/users/${userId}`);
      displayResult('User retrieval by ID', userResponse);
    } catch (error) {
      handleError('User retrieval by ID', error);
    }

    // 6. Add track to favorites test
    try {
      const likeResponse = await axios.post(`${API_URL}/users/likes/${trackId}`, {}, authConfig);
      displayResult('Add track to favorites', likeResponse);
    } catch (error) {
      handleError('Add track to favorites', error);
    }

    // 7. Liked tracks retrieval test
    try {
      const likesResponse = await axios.get(`${API_URL}/users/${userId}/likes`);
      displayResult('Liked tracks retrieval', likesResponse);
    } catch (error) {
      handleError('Liked tracks retrieval', error);
    }

    // 8. Remove track from favorites test
    try {
      const unlikeResponse = await axios.delete(`${API_URL}/users/likes/${trackId}`, authConfig);
      displayResult('Remove track from favorites', unlikeResponse);
    } catch (error) {
      handleError('Remove track from favorites', error);
    }

    // Note: File upload tests require a real image

    console.log('Tests completed!');
  } catch (error) {
    console.error('Global error:', error.message);
  }
};

// Run tests
runTests();