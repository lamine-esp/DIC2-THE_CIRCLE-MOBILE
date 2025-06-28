import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ViewStyle,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

interface ReportButtonProps {
  productId: number;
  productName?: string;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
}

const ReportButton: React.FC<ReportButtonProps> = ({
  productId,
  productName,
  onPress,
  style,
  variant = 'danger',
  size = 'medium'
}) => {
  const { t } = useLanguage();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Comportement par défaut : afficher une alerte de confirmation
      Alert.alert(
        t('report.title'),
        t('report.confirmMessage', { productName: productName || t('product.selectedProduct') }),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('report.submit'),
            style: 'destructive',
            onPress: () => {
              // Navigation vers l'écran de signalement
              // Cette logique sera implémentée avec la navigation
              console.log(`Report abuse for product ${productId}`);
            },
          },
        ]
      );
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.primaryButton];
      case 'secondary':
        return [...baseStyle, styles.secondaryButton];
      case 'danger':
      default:
        return [...baseStyle, styles.dangerButton];
    }
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.primaryText];
      case 'secondary':
        return [...baseStyle, styles.secondaryText];
      case 'danger':
      default:
        return [...baseStyle, styles.dangerText];
    }
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={getTextStyle()}>
        {variant === 'danger' ? '⚠️ ' : '📢 '}
        {t('product.reportAbuse')}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Tailles
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  // Variantes de boutons
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderWidth: 0,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  dangerButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  // Styles de texte de base
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Tailles de texte
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },

  // Couleurs de texte
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#374151',
  },
  dangerText: {
    color: '#DC2626',
  },
});

export default ReportButton;
