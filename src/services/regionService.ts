import { Region } from '../types/api';
import apiService from './api';

class RegionService {
  // Récupérer toutes les régions
  async getAllRegions(): Promise<Region[]> {
    return await apiService.get<Region[]>('/api/regions');
  }

  // Récupérer une région par ID
  async getRegionById(id: number): Promise<Region> {
    return await apiService.get<Region>(`/api/regions/${id}`);
  }

  // Créer une nouvelle région
  async createRegion(region: Omit<Region, 'id'>): Promise<Region> {
    return await apiService.post<Region>('/api/regions', region);
  }

  // Mettre à jour une région
  async updateRegion(id: number, region: Omit<Region, 'id'>): Promise<Region> {
    return await apiService.put<Region>(`/api/regions/${id}`, region);
  }

  // Supprimer une région
  async deleteRegion(id: number): Promise<void> {
    return await apiService.delete<void>(`/api/regions/${id}`);
  }

  // Rechercher des régions
  async searchRegions(query: string): Promise<Region[]> {
    const regions = await this.getAllRegions();
    const searchQuery = query.toLowerCase();
    return regions.filter(region => 
      region.nom.toLowerCase().includes(searchQuery)
    );
  }
}

export const regionService = new RegionService();
export default regionService;
