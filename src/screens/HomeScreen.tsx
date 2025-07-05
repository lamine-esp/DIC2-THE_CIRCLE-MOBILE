import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { ProductWithPrice, Prix, Produit } from '../types/api';
import { RootStackParamList } from '../types/api';
import { useLanguage } from '../contexts/LanguageContext';
import productService from '../services/productService';
import priceService from '../services/priceService';

import ProductCard from '../components/ProductCard';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<ProductWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les données au montage du composant
  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Charger les produits et les prix en parallèle
      const [productsData, pricesData] = await Promise.all([
        productService.getAllProducts(),
        priceService.getLatestPricesForAllProducts()
      ]);

      // Combiner les données des produits avec leurs prix
      const productsWithPrices = await Promise.all(
        productsData.map(async (product: Produit) => {
          // Trouver le prix actuel pour ce produit
          const currentPrice = pricesData.find(
            (price: Prix) => price.produit.id === product.id
          );

          // Récupérer l'historique des prix pour ce produit
          let priceHistory: Prix[] = [];
          try {
            priceHistory = await priceService.getPriceHistory(product.id, 7);
          } catch (error) {
            console.warn(`Erreur lors du chargement de l'historique pour ${product.nom}:`, error);
          }

          // Calculer la variation de prix
          let priceChange = 0;
          let priceChangePercent = 0;
          if (currentPrice && priceHistory.length > 1) {
            const previousPrice = priceHistory[1].valeur;
            priceChange = currentPrice.valeur - previousPrice;
            priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;
          }

          return {
            ...product,
            currentPrice,
            priceHistory,
            priceChange,
            priceChangePercent,
            icon: getProductIcon(product.categorie),
          } as ProductWithPrice;
        })
      );

      // Trier par nom de produit
      productsWithPrices.sort((a, b) => a.nom.localeCompare(b.nom));
      
      setProducts(productsWithPrices);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      Alert.alert(
        t('common.error'),
        t('home.loadError'),
        [
          { text: t('common.retry'), onPress: loadProducts },
          { text: t('common.cancel'), style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const navigateToProductDetail = (productId: number) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const renderProduct = ({ item }: { item: ProductWithPrice }) => (
    <ProductCard
      product={item}
      onPress={() => navigateToProductDetail(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📦</Text>
      <Text style={styles.emptyStateTitle}>{t('home.noProducts')}</Text>
      <Text style={styles.emptyStateSubtitle}>{t('home.noProductsSubtitle')}</Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{t('home.title')}</Text>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
    </View>
  );

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('home.loadingProducts')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            title={t('home.pullToRefresh')}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// Fonction utilitaire pour obtenir l'icône du produit
const getProductIcon = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    'cereales': '🌾',
    'céréales': '🌾',
    'legumes': '🥕',
    'légumes': '🥕',
    'fruits': '🍎',
    'viandes': '🥩',
    'poissons': '🐟',
    'produits_laitiers': '🥛',
    'produits laitiers': '🥛',
    'huiles': '🫒',
    'epices': '🌶️',
    'épices': '🌶️',
  };

  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
  return iconMap[normalizedCategory] || iconMap[category.toLowerCase()] || '📦';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    paddingBottom: 100, // Espace pour le bottom tab navigator
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default HomeScreen;
