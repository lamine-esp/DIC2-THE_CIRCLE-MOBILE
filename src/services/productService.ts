import { Produit } from '../types/api';
import apiService from './api';

class ProductService {
  // Helper method to check network connectivity
  private async checkNetworkConnection(): Promise<boolean> {
    try {
      // Try to make a simple request to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('[ProductService] Network connectivity check failed:', error);
      return false;
    }
  }

  // Récupérer tous les produits
  async getAllProducts(): Promise<Produit[]> {
    try {
      console.log('[ProductService] Fetching all products...');
      return await apiService.get<Produit[]>('/api/produits');
    } catch (error: any) {
      console.error('[ProductService] Error fetching products:', error);
      
      // Check if it's a network error
      if (error?.code === 'NETWORK_ERROR' || error?.message === 'Network Error') {
        const isConnected = await this.checkNetworkConnection();
        if (!isConnected) {
          throw new Error('Pas de connexion internet. Veuillez vérifier votre connexion réseau.');
        } else {
          throw new Error('Serveur indisponible. Veuillez réessayer plus tard.');
        }
      }
      
      throw error;
    }
  }

  // Récupérer un produit par ID
  async getProductById(id: number): Promise<Produit> {
    return await apiService.get<Produit>(`/api/produits/${id}`);
  }

  // Créer un nouveau produit
  async createProduct(product: Omit<Produit, 'id'>): Promise<Produit> {
    return await apiService.post<Produit>('/api/produits', product);
  }

  // Mettre à jour un produit
  async updateProduct(id: number, product: Omit<Produit, 'id'>): Promise<Produit> {
    return await apiService.put<Produit>(`/api/produits/${id}`, product);
  }

  // Supprimer un produit
  async deleteProduct(id: number): Promise<void> {
    return await apiService.delete<void>(`/api/produits/${id}`);
  }

  // Récupérer les produits par catégorie
  async getProductsByCategory(category: string): Promise<Produit[]> {
    const products = await this.getAllProducts();
    return products.filter(product => 
      product.categorie.toLowerCase().includes(category.toLowerCase())
    );
  }

  // Rechercher des produits
  async searchProducts(query: string): Promise<Produit[]> {
    const products = await this.getAllProducts();
    const searchQuery = query.toLowerCase();
    return products.filter(product => 
      product.nom.toLowerCase().includes(searchQuery) ||
      product.categorie.toLowerCase().includes(searchQuery) ||
      product.description.toLowerCase().includes(searchQuery)
    );
  }
}

export const productService = new ProductService();
export default productService;
