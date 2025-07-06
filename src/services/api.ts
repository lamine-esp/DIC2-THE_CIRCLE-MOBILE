import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de base de l'API
const API_BASE_URL = 'https://dic2-the-circle-backend.onrender.com';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs de réponse
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expiré, essayer de rafraîchir le token
          const originalRequest = error.config;
          
          if (!originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
              // Importer dynamiquement pour éviter les dépendances circulaires
              const { authService } = await import('./authService');
              const newToken = await authService.refreshToken();
              
              // Mettre à jour le header et réessayer la requête
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            } catch (refreshError) {
              // Si le refresh échoue, déconnecter l'utilisateur
              await AsyncStorage.removeItem('auth_token');
              await AsyncStorage.removeItem('user_data');
              console.error('Échec du rafraîchissement du token:', refreshError);
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Méthodes génériques
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`[API] GET request to: ${API_BASE_URL}${url}`);
      const response = await this.api.get<T>(url, config);
      console.log(`[API] GET response from ${url}:`, response.status);
      return response.data;
    } catch (error) {
      console.error(`[API] GET error for ${url}:`, error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`[API] POST request to: ${API_BASE_URL}${url}`);
      const response = await this.api.post<T>(url, data, config);
      console.log(`[API] POST response from ${url}:`, response.status);
      return response.data;
    } catch (error) {
      console.error(`[API] POST error for ${url}:`, error);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`[API] PUT request to: ${API_BASE_URL}${url}`);
      const response = await this.api.put<T>(url, data, config);
      console.log(`[API] PUT response from ${url}:`, response.status);
      return response.data;
    } catch (error) {
      console.error(`[API] PUT error for ${url}:`, error);
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`[API] DELETE request to: ${API_BASE_URL}${url}`);
      const response = await this.api.delete<T>(url, config);
      console.log(`[API] DELETE response from ${url}:`, response.status);
      return response.data;
    } catch (error) {
      console.error(`[API] DELETE error for ${url}:`, error);
      throw error;
    }
  }

  // Méthodes utilitaires
  async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem('auth_token', token);
  }

  async removeAuthToken(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  }

  async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
  }
}

export const apiService = new ApiService();
export default apiService;
