import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Import des traductions
import translations from '../assets/translations.json';

// Types
interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>;
  t: (key: string, options?: any) => string;
  availableLanguages: { code: string; name: string; nativeName: string }[];
}

// Configuration I18n
const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = 'fr';

// Langues disponibles
const AVAILABLE_LANGUAGES = [
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'wo', name: 'Wolof', nativeName: 'Wolof' },
];

// Création du contexte
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider du contexte
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('fr');

  // Initialiser la langue au démarrage
  useEffect(() => {
    initializeLanguage();
  }, []);

  const initializeLanguage = async () => {
    try {
      // Essayer de récupérer la langue sauvegardée
      const savedLanguage = await AsyncStorage.getItem('app_language');
      
      if (savedLanguage && AVAILABLE_LANGUAGES.some(lang => lang.code === savedLanguage)) {
        setCurrentLanguage(savedLanguage);
        i18n.locale = savedLanguage;
      } else {
        // Utiliser la langue du système si disponible, sinon français
        const systemLanguage = Localization.locale.split('-')[0];
        const defaultLanguage = AVAILABLE_LANGUAGES.some(lang => lang.code === systemLanguage) 
          ? systemLanguage 
          : 'fr';
        
        setCurrentLanguage(defaultLanguage);
        i18n.locale = defaultLanguage;
        await AsyncStorage.setItem('app_language', defaultLanguage);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la langue:', error);
      // Fallback vers le français
      setCurrentLanguage('fr');
      i18n.locale = 'fr';
    }
  };

  const changeLanguage = async (language: string) => {
    try {
      if (AVAILABLE_LANGUAGES.some(lang => lang.code === language)) {
        setCurrentLanguage(language);
        i18n.locale = language;
        await AsyncStorage.setItem('app_language', language);
      }
    } catch (error) {
      console.error('Erreur lors du changement de langue:', error);
    }
  };

  const t = (key: string, options?: any): string => {
    return i18n.t(key, options);
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    t,
    availableLanguages: AVAILABLE_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
