import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Produit, Region } from '../types/api';
import { useLanguage } from '../contexts/LanguageContext';
import productService from '../services/productService';
import regionService from '../services/regionService';
import reportService from '../services/reportService';
import authService from '../services/authService';

interface Props {
  navigation: any;
  route: any;
}

interface FormData {
  productId: number | null;
  regionId: number | null;
  observedPrice: string;
  comment: string;
  photo: string | null;
}

const ReportScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params || {};
  const { t } = useLanguage();

  const [formData, setFormData] = useState<FormData>({
    productId: productId || null,
    regionId: null,
    observedPrice: '',
    comment: '',
    photo: null,
  });

  const [products, setProducts] = useState<Produit[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [productsData, regionsData] = await Promise.all([
        productService.getAllProducts(),
        regionService.getAllRegions()
      ]);

      setProducts(productsData);
      setRegions(regionsData);

      // Si un produit est pré-sélectionné
      if (productId) {
        const product = productsData.find(p => p.id === productId);
        if (product) {
          setSelectedProduct(product);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert(t('common.error'), t('report.loadError'));
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.error'),
        t('report.permissionRequired')
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      t('report.addPhoto'),
      t('report.selectPhotoMethod'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('report.takePhoto'), onPress: takePhoto },
        { text: t('report.chooseFromLibrary'), onPress: chooseFromLibrary },
      ]
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('report.cameraPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, photo: result.assets[0].uri }));
    }
  };

  const chooseFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, photo: result.assets[0].uri }));
    }
  };

  const validateForm = (): boolean => {
    if (!selectedProduct) {
      Alert.alert(t('common.error'), t('report.selectProductError'));
      return false;
    }

    if (!selectedRegion) {
      Alert.alert(t('common.error'), t('report.selectRegionError'));
      return false;
    }

    if (!formData.observedPrice.trim()) {
      Alert.alert(t('common.error'), t('report.enterPriceError'));
      return false;
    }

    const price = parseFloat(formData.observedPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert(t('common.error'), t('report.invalidPriceError'));
      return false;
    }

    return true;
  };

  const submitReport = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        Alert.alert(t('common.error'), t('auth.loginRequired'));
        return;
      }

      const reportData = {
        productId: selectedProduct!.id,
        regionId: selectedRegion!.id,
        userId: currentUser.id,
        observedPrice: parseFloat(formData.observedPrice),
        comment: formData.comment.trim(),
      };

      await reportService.submitPriceReport(reportData);

      Alert.alert(
        t('report.success'),
        t('report.successMessage'),
        [
          {
            text: t('common.confirm'),
            onPress: () => navigation.goBack(),
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de l\'envoi du signalement:', error);
      Alert.alert(t('common.error'), t('report.submitError'));
    } finally {
      setLoading(false);
    }
  };

  const renderProductPicker = () => (
    <View style={styles.pickerContainer}>
      <Text style={styles.label}>{t('report.product')} *</Text>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setShowProductPicker(!showProductPicker)}
      >
        <Text style={[styles.pickerText, !selectedProduct && styles.placeholderText]}>
          {selectedProduct ? selectedProduct.nom : t('report.selectProduct')}
        </Text>
        <Text style={styles.pickerArrow}>▼</Text>
      </TouchableOpacity>

      {showProductPicker && (
        <View style={styles.pickerOptions}>
          <ScrollView style={styles.optionsList} nestedScrollEnabled>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.option}
                onPress={() => {
                  setSelectedProduct(product);
                  setFormData(prev => ({ ...prev, productId: product.id }));
                  setShowProductPicker(false);
                }}
              >
                <Text style={styles.optionText}>{product.nom}</Text>
                <Text style={styles.optionCategory}>{product.categorie}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderRegionPicker = () => (
    <View style={styles.pickerContainer}>
      <Text style={styles.label}>{t('report.region')} *</Text>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setShowRegionPicker(!showRegionPicker)}
      >
        <Text style={[styles.pickerText, !selectedRegion && styles.placeholderText]}>
          {selectedRegion ? selectedRegion.nom : t('report.selectRegion')}
        </Text>
        <Text style={styles.pickerArrow}>▼</Text>
      </TouchableOpacity>

      {showRegionPicker && (
        <View style={styles.pickerOptions}>
          <ScrollView style={styles.optionsList} nestedScrollEnabled>
            {regions.map((region) => (
              <TouchableOpacity
                key={region.id}
                style={styles.option}
                onPress={() => {
                  setSelectedRegion(region);
                  setFormData(prev => ({ ...prev, regionId: region.id }));
                  setShowRegionPicker(false);
                }}
              >
                <Text style={styles.optionText}>{region.nom}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('report.title')}</Text>
            <Text style={styles.subtitle}>{t('report.subtitle')}</Text>
          </View>

          <View style={styles.form}>
            {/* Sélecteur de produit */}
            {renderProductPicker()}

            {/* Sélecteur de région */}
            {renderRegionPicker()}

            {/* Prix observé */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('report.observedPrice')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('report.enterPrice')}
                value={formData.observedPrice}
                onChangeText={(text) => setFormData(prev => ({ ...prev, observedPrice: text }))}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputSuffix}>{t('units.fcfa')}</Text>
            </View>

            {/* Commentaire */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('report.comment')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('report.optionalComment')}
                value={formData.comment}
                onChangeText={(text) => setFormData(prev => ({ ...prev, comment: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Photo */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('report.addPhoto')}</Text>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                {formData.photo ? (
                  <Image source={{ uri: formData.photo }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoIcon}>📷</Text>
                    <Text style={styles.photoText}>{t('report.selectPhoto')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Bouton de soumission */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={submitReport}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? t('common.loading') : t('report.submit')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    padding: 16,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  pickerText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  pickerOptions: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
  },
  optionsList: {
    maxHeight: 200,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  optionCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputSuffix: {
    position: 'absolute',
    right: 12,
    top: 38,
    fontSize: 16,
    color: '#6B7280',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  photoButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  photoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  photoText: {
    fontSize: 16,
    color: '#6B7280',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  submitButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportScreen;
