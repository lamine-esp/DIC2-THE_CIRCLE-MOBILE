import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { ProductWithPrice, Prix, Produit, Signalement } from '../types/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLanguage } from '../contexts/LanguageContext';
import productService from '../services/productService';
import priceService from '../services/priceService';
import reportService from '../services/reportService';

import PriceChart from '../components/PriceChart';
import ReportButton from '../components/ReportButton';

type ProductDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

interface Props {
  navigation: ProductDetailScreenNavigationProp;
  route: ProductDetailScreenRouteProp;
}

const { width } = Dimensions.get('window');

const ProductDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { t } = useLanguage();
  
  const [product, setProduct] = useState<ProductWithPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Signalement[]>([]);

  useEffect(() => {
    loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      
      // Charger les données du produit, prix et signalements en parallèle
      const [productData, pricesData, reportsData] = await Promise.all([
        productService.getProductById(productId),
        priceService.getPriceHistory(productId, 30),
        reportService.getReportsByProductId(productId).catch(() => [])
      ]);

      // Préparer les données du produit avec historique des prix
      const currentPrice = pricesData[0];
      let priceChange = 0;
      let priceChangePercent = 0;
      
      if (pricesData.length > 1) {
        const previousPrice = pricesData[1].valeur;
        priceChange = currentPrice.valeur - previousPrice;
        priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;
      }

      const productWithPrice: ProductWithPrice = {
        ...productData,
        currentPrice,
        priceHistory: pricesData,
        priceChange,
        priceChangePercent,
      };

      setProduct(productWithPrice);
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading product data:', error);
      Alert.alert(
        t('common.error'),
        t('product.loadError'),
        [
          { text: t('common.retry'), onPress: loadProductData },
          { text: t('common.back'), onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleReport = () => {
    // Naviguer vers l'écran de signalement avec ce produit
    navigation.getParent()?.navigate('MainTabs', { 
      screen: 'Report',
      params: { productId: productId }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Produit non trouvé</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header avec prix principal */}
        <View style={styles.header}>
          <Text style={styles.productName}>{product.nom}</Text>
          
          <Text style={styles.sectionTitle}>{t('product.currentPrice')}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.priceType}>
              {product.currentPrice?.prixOfficiel ? t('product.officialPrice') : t('product.marketPrice')}
            </Text>
            
            <View style={styles.mainPriceRow}>
              <Text style={styles.currentPrice}>
                {formatPrice(product.currentPrice?.valeur || 0)} {t('units.fcfa')}
              </Text>
              
              {product.priceChange !== 0 && (
                <View style={[styles.priceChangeContainer, { 
                  backgroundColor: (product.priceChange || 0) > 0 ? '#ff453a' : '#30d158' 
                }]}>
                  <Text style={styles.priceChangeText}>
                    {' '}({(product.priceChange || 0) > 0 ? '+' : ''}{formatPrice(product.priceChange || 0)} {t('units.fcfa')})
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.lastUpdated}>
              {t('product.lastUpdated', { date: formatDate(product.currentPrice?.dateMiseAJour || '') })}
            </Text>
          </View>
        </View>

        {/* Graphique d'évolution des prix */}
        {product.priceHistory && product.priceHistory.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('product.priceEvolution')}</Text>
            <View style={styles.chartContainer}>
              <PriceChart
                data={product.priceHistory.slice().reverse().map(price => price.valeur)}
                width={width - 40}
                height={200}
              />
            </View>
          </View>
        )}

        {/* Historique des prix sous forme de liste */}
        {product.priceHistory && product.priceHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('product.priceHistory')}</Text>
            {product.priceHistory.slice(0, 5).map((price, index) => (
              <View key={index} style={styles.priceHistoryItem}>
                <Text style={styles.priceHistoryDate}>
                  {formatDate(price.dateMiseAJour)}
                </Text>
                <Text style={styles.priceHistoryValue}>
                  {formatPrice(price.valeur)} FCFA
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Détails du produit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('product.details')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('product.category')}</Text>
            <Text style={styles.infoValue}>{product.categorie}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('product.unit')}</Text>
            <Text style={styles.infoValue}>{product.unite}</Text>
          </View>
          
          {product.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('product.description')}</Text>
              <Text style={styles.infoValue}>{product.description}</Text>
            </View>
          )}
        </View>

        {/* Bouton de signalement */}
        <View style={styles.section}>
          <ReportButton
            onPress={handleReport}
            productId={productId}
          />
        </View>

        {/* Statistiques des signalements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('report.recentReports')}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reports.length}</Text>
              <Text style={styles.statLabel}>{t('report.totalReports')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  priceContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  priceType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  mainPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  priceChangeContainer: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceChangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#888',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chartContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 10,
  },
  noChartText: {
    color: '#666',
    fontSize: 16,
  },
  priceHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceHistoryDate: {
    fontSize: 14,
    color: '#666',
  },
  priceHistoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default ProductDetailScreen;
