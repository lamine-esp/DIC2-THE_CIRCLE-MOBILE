import { Produit } from '../types/api';
import apiService from './api';

class ProductService {
  // Récupérer tous les produits
  async getAllProducts(): Promise<Produit[]> {
    return await apiService.get<Produit[]>('/api/produits');
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
