import { Signalement } from '../types/api';
import apiService from './api';

class ReportService {
  // Récupérer tous les signalements
  async getAllReports(): Promise<Signalement[]> {
    return await apiService.get<Signalement[]>('/api/signalements');
  }

  // Récupérer un signalement par ID
  async getReportById(id: number): Promise<Signalement> {
    return await apiService.get<Signalement>(`/api/signalements/${id}`);
  }

  // Créer un nouveau signalement
  async createReport(report: Omit<Signalement, 'id' | 'dateSignalement' | 'statut'>): Promise<Signalement> {
    const reportData = {
      ...report,
      dateSignalement: new Date().toISOString(),
      statut: 'EN_ATTENTE' as const
    };
    return await apiService.post<Signalement>('/api/signalements', reportData);
  }

  // Mettre à jour un signalement
  async updateReport(id: number, report: Partial<Signalement>): Promise<Signalement> {
    return await apiService.put<Signalement>(`/api/signalements/${id}`, report);
  }

  // Supprimer un signalement
  async deleteReport(id: number): Promise<void> {
    return await apiService.delete<void>(`/api/signalements/${id}`);
  }

  // Récupérer les signalements par utilisateur
  async getReportsByUserId(userId: number): Promise<Signalement[]> {
    const allReports = await this.getAllReports();
    return allReports.filter(report => report.utilisateur.id === userId);
  }

  // Récupérer les signalements par produit
  async getReportsByProductId(productId: number): Promise<Signalement[]> {
    const allReports = await this.getAllReports();
    return allReports.filter(report => report.produit.id === productId);
  }

  // Récupérer les signalements par région
  async getReportsByRegionId(regionId: number): Promise<Signalement[]> {
    const allReports = await this.getAllReports();
    return allReports.filter(report => report.region.id === regionId);
  }

  // Récupérer les signalements par statut
  async getReportsByStatus(status: 'EN_ATTENTE' | 'VALIDE' | 'REJETE'): Promise<Signalement[]> {
    const allReports = await this.getAllReports();
    return allReports.filter(report => report.statut === status);
  }

  // Récupérer les statistiques des signalements
  async getReportStats(): Promise<{
    total: number;
    enAttente: number;
    valides: number;
    rejetes: number;
    parProduit: { [productName: string]: number };
    parRegion: { [regionName: string]: number };
  }> {
    const allReports = await this.getAllReports();
    
    const stats = {
      total: allReports.length,
      enAttente: allReports.filter(r => r.statut === 'EN_ATTENTE').length,
      valides: allReports.filter(r => r.statut === 'VALIDE').length,
      rejetes: allReports.filter(r => r.statut === 'REJETE').length,
      parProduit: {} as { [productName: string]: number },
      parRegion: {} as { [regionName: string]: number }
    };

    // Compter par produit
    allReports.forEach(report => {
      const productName = report.produit.nom;
      stats.parProduit[productName] = (stats.parProduit[productName] || 0) + 1;
    });

    // Compter par région
    allReports.forEach(report => {
      const regionName = report.region.nom;
      stats.parRegion[regionName] = (stats.parRegion[regionName] || 0) + 1;
    });

    return stats;
  }

  // Créer un signalement simple (pour les utilisateurs)
  async submitPriceReport(data: {
    productId: number;
    regionId: number;
    userId: number;
    observedPrice: number;
    comment?: string;
  }): Promise<Signalement> {
    // Note: Dans une vraie application, vous devriez récupérer les objets complets
    // Pour cet exemple, nous créons des objets simplifiés
    const reportData = {
      utilisateur: { id: data.userId } as any,
      produit: { id: data.productId } as any,
      region: { id: data.regionId } as any,
      prixObserve: data.observedPrice,
      commentaire: data.comment || '',
    };

    return await this.createReport(reportData);
  }
}

export const reportService = new ReportService();
export default reportService;
