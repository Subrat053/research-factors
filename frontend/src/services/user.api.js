import { apiClient } from './api.client.js';

export const userApi = {
  getProfile: () => apiClient.get('/users/me/profile'),
  updateProfile: (data) => apiClient.patch('/users/me/profile', data),
  changePassword: (data) => apiClient.patch('/users/me/password', data)
};
