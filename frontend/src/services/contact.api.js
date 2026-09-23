import { apiClient } from './api.client.js';

export const contactApi = {
  /**
   * Dispatches a public brand sponsorship inquiry
   */
  submitSponsorshipInquiry: (data) =>
    apiClient.post('/contact/sponsorship', data),

  /**
   * Dispatches a general reader/visitor contact inquiry
   */
  submitContactMessage: (data) =>
    apiClient.post('/contact', data)
};
