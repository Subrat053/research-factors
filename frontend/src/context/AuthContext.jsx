import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/auth.api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.data?.user || null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    setUser(response.data?.user);
    return response.data?.user;
  };

  const register = async (data) => {
    const response = await authApi.register(data);
    setUser(response.data?.user);
    return response.data?.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.roles?.includes('SUPER_ADMIN')) return true;
    return user.permissions?.includes(permission);
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user.roles?.includes(role);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    hasPermission,
    hasRole,
    refetchUser: fetchCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
