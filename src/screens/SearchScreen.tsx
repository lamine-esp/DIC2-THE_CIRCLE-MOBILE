import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';

import { ProductWithPrice, Produit, Region } from '../types/api';
import { useLanguage } from '../contexts/LanguageContext';
import productService from '../services/productService';
import regionService from '../services/regionService';
import priceService from '../services/priceService';

import ProductCard from '../components/ProductCard';

interface Props {
  navigation: any;
}

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductWithPrice[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithPrice[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showRegionFilter, setShowRegionFilter] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, selectedRegion, products]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [productsData, regionsData, pricesData] = await Promise.all([
        productService.getAllProducts(),
        regionService.getAllRegions(),
        priceService.getLatestPricesForAllProducts()
      ]);

      // Combiner les produits avec leurs prix
      const productsWithPrices = productsData.map((product: Produit) => {
        const currentPrice = pricesData.find(price => price.produit.id === product.id);
        return {
          ...product,
          currentPrice,
          priceHistory: [],
          priceChange: 0,
          priceChangePercent: 0,
          icon: getProductIcon(product.categorie),
        } as ProductWithPrice;
      });

      // Extraire les catégories uniques
      const uniqueCategories = [...new Set(productsData.map(p => p.categorie))];

      setProducts(productsWithPrices);
      setFilteredProducts(productsWithPrices);
      setCategories(uniqueCategories);
      setRegions(regionsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert(t('common.error'), t('search.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filtrer par recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.nom.toLowerCase().includes(query) ||
        product.categorie.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }

    // Filtrer par catégorie
    if (selectedCategory) {
      filtered = filtered.filter(product => product.categorie === selectedCategory);
    }

    // Filtrer par région (basé sur les prix disponibles)
    if (selectedRegion) {
      filtered = filtered.filter(product =>
        product.currentPrice?.region.id === selectedRegion.id
      );
    }

    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedRegion(null);
    setShowCategoryFilter(false);
    setShowRegionFilter(false);
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

  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowCategoryFilter(true)}
      >
        <Text style={styles.filterButtonText}>
          {selectedCategory || t('search.allCategories')}
        </Text>
        <Text style={styles.filterArrow}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegionFilter = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowRegionFilter(true)}
      >
        <Text style={styles.filterButtonText}>
          {selectedRegion ? selectedRegion.nom : t('search.allRegions')}
        </Text>
        <Text style={styles.filterArrow}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFiltersHeader = () => (
    <View style={styles.header}>
      {/* Filtres */}
      <View style={styles.filtersRow}>
        {renderCategoryFilter()}
        {renderRegionFilter()}
      </View>

      {/* Bouton de réinitialisation des filtres */}
      {(selectedCategory || selectedRegion || searchQuery) && (
        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
          <Text style={styles.clearFiltersText}>{t('search.clearFilters')}</Text>
        </TouchableOpacity>
      )}

      {/* Nombre de résultats */}
      <Text style={styles.resultsCount}>
        {t('search.resultsCount', { count: filteredProducts.length })}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('search.searchProducts')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres */}
      <View style={styles.filtersRow}>
        {renderCategoryFilter()}
        {renderRegionFilter()}
      </View>

      {/* Bouton de réinitialisation des filtres */}
      {(selectedCategory || selectedRegion || searchQuery) && (
        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
          <Text style={styles.clearFiltersText}>{t('search.clearFilters')}</Text>
        </TouchableOpacity>
      )}

      {/* Nombre de résultats */}
      <Text style={styles.resultsCount}>
        {t('search.resultsCount', { count: filteredProducts.length })}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🔍</Text>
      <Text style={styles.emptyStateTitle}>{t('search.noResults')}</Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery || selectedCategory || selectedRegion
          ? t('search.tryDifferentSearch')
          : t('search.startSearching')
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Barre de recherche fixe */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('search.searchProducts')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderFiltersHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal pour les catégories */}
      <Modal
        visible={showCategoryFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryFilter(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryFilter(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('search.selectCategory')}</Text>
            <ScrollView style={styles.modalScrollView}>
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => {
                  setSelectedCategory(null);
                  setShowCategoryFilter(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  !selectedCategory && styles.selectedFilterOptionText
                ]}>
                  {t('search.allCategories')}
                </Text>
                {!selectedCategory && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.filterOption}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowCategoryFilter(false);
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedCategory === category && styles.selectedFilterOptionText
                  ]}>
                    {category}
                  </Text>
                  {selectedCategory === category && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal pour les régions */}
      <Modal
        visible={showRegionFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRegionFilter(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRegionFilter(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('search.selectRegion')}</Text>
            <ScrollView style={styles.modalScrollView}>
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => {
                  setSelectedRegion(null);
                  setShowRegionFilter(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  !selectedRegion && styles.selectedFilterOptionText
                ]}>
                  {t('search.allRegions')}
                </Text>
                {!selectedRegion && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              {regions.map((region) => (
                <TouchableOpacity
                  key={region.id}
                  style={styles.filterOption}
                  onPress={() => {
                    setSelectedRegion(region);
                    setShowRegionFilter(false);
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedRegion?.id === region.id && styles.selectedFilterOptionText
                  ]}>
                    {region.nom}
                  </Text>
                  {selectedRegion?.id === region.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  searchHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  filtersRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  filterContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1000,
  },
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  filterArrow: {
    fontSize: 10,
    color: '#6B7280',
  },
  filterOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginTop: 2,
    maxHeight: 200,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedFilterOptionText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  clearFiltersText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
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
  // Styles pour les Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  checkmark: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
});

export default SearchScreen;
