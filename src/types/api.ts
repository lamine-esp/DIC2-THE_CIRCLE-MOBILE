// Types basés sur l'API OpenAPI
export interface Produit {
  id: number;
  nom: string;
  categorie: string;
  description: string;
  unite: string;
}

export interface Region {
  id: number;
  nom: string;
}

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motDePasse: string;
  role: 'ADMINISTRATEUR' | 'VOLONTAIRE' | 'CONSOMMATEUR';
  region: Region;
  dateInscription: string;
}

export interface Prix {
  id: number;
  produit: Produit;
  region: Region;
  valeur: number;
  dateMiseAJour: string;
  source: string;
  prixOfficiel: boolean;
}

export interface Signalement {
  id: number;
  utilisateur: Utilisateur;
  produit: Produit;
  region: Region;
  prixObserve: number;
  commentaire: string;
  dateSignalement: string;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE';
}

// Types pour l'interface utilisateur
export interface ProductWithPrice extends Produit {
  currentPrice?: Prix;
  priceHistory?: Prix[];
  priceChange?: number;
  priceChangePercent?: number;
  icon?: string;
}

export interface PriceVariation {
  value: number;
  percentage: number;
  direction: 'up' | 'down' | 'stable';
  color: string;
}

// Types pour les traductions
export interface Translation {
  [key: string]: string | Translation;
}

export interface Translations {
  fr: Translation;
  wo: Translation;
}

// Types pour la navigation
export type RootStackParamList = {
  Home: undefined;
  ProductDetail: { productId: number };
  Report: { productId?: number };
  Search: undefined;
  Profile: undefined;
  Onboarding: undefined;
};

// Types pour l'authentification
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motDePasse: string;
  regionId: number;
}

export interface AuthResponse {
  token: string;
  user: Utilisateur;
}
