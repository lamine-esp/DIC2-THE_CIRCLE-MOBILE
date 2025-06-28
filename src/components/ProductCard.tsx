import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ProductWithPrice, PriceVariation } from '../types/api';
import { useLanguage } from '../contexts/LanguageContext';
import PriceChart from './PriceChart';

interface ProductCardProps {
  product: ProductWithPrice;
  onPress: () => void;
}

const { width } = Dimensions.get('window');

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { t } = useLanguage();

  // Calculer la variation de prix
  const getPriceVariation = (): PriceVariation => {
    if (!product.currentPrice || !product.priceHistory || product.priceHistory.length < 2) {
      return {
        value: 0,
        percentage: 0,
        direction: 'stable',
        color: '#6B7280'
      };
    }

    const currentPrice = product.currentPrice.valeur;
    const previousPrice = product.priceHistory[1]?.valeur || currentPrice;
    const value = currentPrice - previousPrice;
    const percentage = previousPrice > 0 ? (value / previousPrice) * 100 : 0;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    let color = '#6B7280'; // Gris pour stable

    if (value > 0) {
      direction = 'up';
      color = '#DC2626'; // Rouge pour hausse
    } else if (value < 0) {
      direction = 'down';
      color = '#16A34A'; // Vert pour baisse
    }

    return { value, percentage, direction, color };
  };

  const priceVariation = getPriceVariation();
  const currentPrice = product.currentPrice?.valeur || 0;
  const productIcon = product.icon || getProductIcon(product.categorie);

  // Données pour le mini-graphique
  const chartData = product.priceHistory?.slice(0, 7).reverse().map(p => p.valeur) || [currentPrice];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        {/* En-tête avec icône et nom */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{productIcon}</Text>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {product.nom}
            </Text>
            <Text style={styles.productCategory} numberOfLines={1}>
              {product.categorie}
            </Text>
          </View>
        </View>

        {/* Prix et variation */}
        <View style={styles.priceSection}>
          <View style={styles.priceInfo}>
            <Text style={styles.currentPrice}>
              {formatPrice(currentPrice)} {t('units.fcfa')}
            </Text>
            <Text style={styles.unit}>/ {product.unite}</Text>
          </View>

          <View style={[styles.variationContainer, { backgroundColor: priceVariation.color + '20' }]}>
            <Text style={[styles.variationText, { color: priceVariation.color }]}>
              {priceVariation.direction === 'up' ? '↗' : priceVariation.direction === 'down' ? '↘' : '→'}
              {' '}
              {Math.abs(priceVariation.percentage).toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Mini-graphique */}
        <View style={styles.chartContainer}>
          <PriceChart
            data={chartData}
            color={priceVariation.color}
            height={40}
            showAxis={false}
            showLabels={false}
          />
        </View>

        {/* Informations supplémentaires */}
        <View style={styles.footer}>
          <Text style={styles.source}>
            {product.currentPrice?.source || t('common.unknown')}
          </Text>
          <View style={[styles.officialBadge, { 
            backgroundColor: product.currentPrice?.prixOfficiel ? '#16A34A' : '#F59E0B' 
          }]}>
            <Text style={styles.officialText}>
              {product.currentPrice?.prixOfficiel ? t('product.officialPrice') : t('product.marketPrice')}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Fonction utilitaire pour formater le prix
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Fonction utilitaire pour obtenir l'icône du produit
const getProductIcon = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    'cereales': '🌾',
    'legumes': '🥕',
    'fruits': '🍎',
    'viandes': '🥩',
    'poissons': '🐟',
    'produits_laitiers': '🥛',
    'huiles': '🫒',
    'epices': '🌶️',
  };

  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
  return iconMap[normalizedCategory] || '📦';
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  unit: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  variationContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  variationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    height: 40,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  source: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  officialBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  officialText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProductCard;
