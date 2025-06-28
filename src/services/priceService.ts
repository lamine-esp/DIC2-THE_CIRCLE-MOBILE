import { Prix } from '../types/api';
import apiService from './api';

class PriceService {
  // Récupérer tous les prix
  async getAllPrices(): Promise<Prix[]> {
    return await apiService.get<Prix[]>('/api/prix');
  }

  // Récupérer un prix par ID
  async getPriceById(id: number): Promise<Prix> {
    return await apiService.get<Prix>(`/api/prix/${id}`);
  }

  // Récupérer les prix par nom de produit
  async getPricesByProductName(productName: string): Promise<Prix[]> {
    return await apiService.get<Prix[]>(`/api/prix/produit/${encodeURIComponent(productName)}`);
  }

  // Créer un nouveau prix
  async createPrice(price: Omit<Prix, 'id'>): Promise<Prix> {
    return await apiService.post<Prix>('/api/prix', price);
  }

  // Mettre à jour un prix
  async updatePrice(id: number, price: Omit<Prix, 'id'>): Promise<Prix> {
    return await apiService.put<Prix>(`/api/prix/${id}`, price);
  }

  // Supprimer un prix
  async deletePrice(id: number): Promise<void> {
    return await apiService.delete<void>(`/api/prix/${id}`);
  }

  // Récupérer les prix par produit ID
  async getPricesByProductId(productId: number): Promise<Prix[]> {
    const allPrices = await this.getAllPrices();
    return allPrices.filter(price => price.produit.id === productId);
  }

  // Récupérer les prix par région ID
  async getPricesByRegionId(regionId: number): Promise<Prix[]> {
    const allPrices = await this.getAllPrices();
    return allPrices.filter(price => price.region.id === regionId);
  }

  // Récupérer les prix officiels uniquement
  async getOfficialPrices(): Promise<Prix[]> {
    const allPrices = await this.getAllPrices();
    return allPrices.filter(price => price.prixOfficiel === true);
  }

  // Calculer la variation de prix
  calculatePriceVariation(currentPrice: number, previousPrice: number): {
    absolute: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  } {
    const absolute = currentPrice - previousPrice;
    const percentage = previousPrice > 0 ? (absolute / previousPrice) * 100 : 0;
    
    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (absolute > 0) direction = 'up';
    else if (absolute < 0) direction = 'down';

    return {
      absolute,
      percentage,
      direction
    };
  }

  // Récupérer l'historique des prix pour un produit
  async getPriceHistory(productId: number, limit: number = 30): Promise<Prix[]> {
    const prices = await this.getPricesByProductId(productId);
    // Trier par date de mise à jour (plus récent en premier)
    return prices
      .sort((a, b) => new Date(b.dateMiseAJour).getTime() - new Date(a.dateMiseAJour).getTime())
      .slice(0, limit);
  }

  // Récupérer les prix récents pour tous les produits (pour la page d'accueil)
  async getLatestPricesForAllProducts(): Promise<Prix[]> {
    const allPrices = await this.getAllPrices();
    const latestPrices: { [productId: number]: Prix } = {};

    // Garder seulement le prix le plus récent pour chaque produit
    allPrices.forEach(price => {
      const productId = price.produit.id;
      if (!latestPrices[productId] || 
          new Date(price.dateMiseAJour) > new Date(latestPrices[productId].dateMiseAJour)) {
        latestPrices[productId] = price;
      }
    });

    return Object.values(latestPrices);
  }
}

export const priceService = new PriceService();
export default priceService;
