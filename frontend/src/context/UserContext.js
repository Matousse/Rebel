import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginWithMagic, getUserProfile } from '../services/auth';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Fetch user profile
      getUserProfile(token)
        .then(userData => {
          setUser({ ...userData, token });
        })
        .catch(error => {
          console.error('Error fetching user profile:', error);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (didToken, username, isArtist) => {
    setLoading(true);
    try {
      const userData = await loginWithMagic(didToken, username, isArtist);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}