import { AuthResponse, LoginRequest, RegisterRequest, Utilisateur } from '../types/api';
import apiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  // Connexion
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/api/auth/login', credentials);
    
    // Sauvegarder le token et les données utilisateur
    await apiService.setAuthToken(response.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
    
    return response;
  }

  // Inscription
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/api/auth/register', userData);
    
    // Sauvegarder le token et les données utilisateur
    await apiService.setAuthToken(response.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
    
    return response;
  }

  // Déconnexion
  async logout(): Promise<void> {
    await apiService.removeAuthToken();
  }

  // Vérifier si l'utilisateur est connecté
  async isAuthenticated(): Promise<boolean> {
    const token = await apiService.getAuthToken();
    return token !== null;
  }

  // Récupérer les données utilisateur stockées
  async getCurrentUser(): Promise<Utilisateur | null> {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return null;
    }
  }

  // Mettre à jour les données utilisateur stockées
  async updateCurrentUser(user: Utilisateur): Promise<void> {
    await AsyncStorage.setItem('user_data', JSON.stringify(user));
  }

  // Vérifier le token et rafraîchir les données utilisateur si nécessaire
  async refreshUserData(): Promise<Utilisateur | null> {
    try {
      const isAuth = await this.isAuthenticated();
      if (!isAuth) return null;

      // Dans une vraie application, vous feriez un appel API pour récupérer les données utilisateur actuelles
      // Pour cet exemple, nous retournons simplement les données stockées
      return await this.getCurrentUser();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données utilisateur:', error);
      await this.logout(); // Déconnecter en cas d'erreur
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;
