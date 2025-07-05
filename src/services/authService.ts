import { AuthResponse, LoginRequest, RegisterRequest, Utilisateur } from '../types/api';
import apiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  // Connexion
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/api/auth/login', {
      email: credentials.email,
      motDePasse: credentials.password
    });
    
    // Sauvegarder le token et les données utilisateur
    await apiService.setAuthToken(response.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
    
    return response;
  }

  // Inscription
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/api/auth/register', {
      nom: userData.nom,
      prenom: userData.prenom,
      email: userData.email,
      telephone: userData.telephone,
      motDePasse: userData.motDePasse,
      role: 'CONSOMMATEUR',
      regionId: userData.regionId.toString()
    });
    
    // Sauvegarder le token et les données utilisateur
    await apiService.setAuthToken(response.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
    
    return response;
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      // Appeler l'endpoint de déconnexion côté serveur
      await apiService.post<{message: string}>('/api/auth/logout', {});
    } catch (error) {
      console.warn('Erreur lors de la déconnexion côté serveur:', error);
    } finally {
      // Toujours nettoyer côté client
      await apiService.removeAuthToken();
    }
  }

  // Vérifier si l'utilisateur est connecté et si le token est valide
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await apiService.getAuthToken();
      if (!token) return false;

      // Vérifier la validité du token côté serveur
      const response = await apiService.get<{valid: boolean, email: string}>('/api/auth/verify');
      return response.valid;
    } catch (error) {
      console.warn('Token invalide:', error);
      await this.logout(); // Nettoyer en cas de token invalide
      return false;
    }
  }

  // Récupérer les données utilisateur depuis l'API
  async getCurrentUser(): Promise<Utilisateur | null> {
    try {
      const isAuth = await this.isAuthenticated();
      if (!isAuth) return null;

      const user = await apiService.get<Utilisateur>('/api/users/profile');
      
      // Mettre à jour les données stockées localement
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      
      // Fallback : essayer de récupérer les données stockées localement
      try {
        const userData = await AsyncStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
      } catch {
        return null;
      }
    }
  }

  // Mettre à jour le profil utilisateur
  async updateProfile(updates: {nom?: string, prenom?: string, telephone?: string}): Promise<Utilisateur> {
    const response = await apiService.put<{message: string, user: Utilisateur}>('/api/users/profile', updates);
    
    // Mettre à jour les données stockées localement
    await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
    
    return response.user;
  }

  // Rafraîchir le token
  async refreshToken(): Promise<string> {
    const response = await apiService.post<{token: string}>('/api/auth/refresh', {});
    
    // Sauvegarder le nouveau token
    await apiService.setAuthToken(response.token);
    
    return response.token;
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

      // Récupérer les données utilisateur actuelles depuis l'API
      const response = await apiService.get<Utilisateur>('/api/users/profile');
      await this.updateCurrentUser(response);
      return response;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données utilisateur:', error);
      await this.logout(); // Déconnecter en cas d'erreur
      return null;
    }
  }

  // Récupérer les données utilisateur stockées localement (sans appel API)
  async getCachedUser(): Promise<Utilisateur | null> {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur en cache:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;
