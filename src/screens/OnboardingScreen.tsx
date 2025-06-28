import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitch from '../components/LanguageSwitch';

interface Props {
  navigation: any;
}

interface OnboardingStep {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

const { width, height } = Dimensions.get('window');

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: '1',
      icon: '📊',
      title: t('onboarding.step1Title'),
      subtitle: t('onboarding.step1Subtitle'),
    },
    {
      id: '2',
      icon: '🔍',
      title: t('onboarding.step2Title'),
      subtitle: t('onboarding.step2Subtitle'),
    },
    {
      id: '3',
      icon: '📢',
      title: t('onboarding.step3Title'),
      subtitle: t('onboarding.step3Subtitle'),
    },
    {
      id: '4',
      icon: '🌍',
      title: t('onboarding.step4Title'),
      subtitle: t('onboarding.step4Subtitle'),
    },
  ];

  const goToNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishOnboarding();
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      navigation.replace('MainTabs');
    }
  };

  const skipOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      navigation.replace('MainTabs');
    }
  };

  const renderStep = ({ item, index }: { item: OnboardingStep; index: number }) => (
    <View style={[styles.stepContainer, { width }]}>
      <View style={styles.stepContent}>
        <Text style={styles.stepIcon}>{item.icon}</Text>
        <Text style={styles.stepTitle}>{item.title}</Text>
        <Text style={styles.stepSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {steps.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.paginationDot,
            index === currentStep && styles.paginationDotActive
          ]}
          onPress={() => setCurrentStep(index)}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* En-tête avec sélecteur de langue */}
      <View style={styles.header}>
        <LanguageSwitch showLabel={true} />
        <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
          <Text style={styles.skipButtonText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Contenu principal */}
      <View style={styles.content}>
        <FlatList
          data={steps}
          renderItem={renderStep}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentStep(newIndex);
          }}
          getItemLayout={(data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          scrollEnabled={true}
        />

        {/* Pagination */}
        {renderPagination()}
      </View>

      {/* Pied de page avec boutons de navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, styles.backButton]}
          onPress={goToPrevious}
          disabled={currentStep === 0}
        >
          <Text style={[
            styles.navButtonText,
            styles.backButtonText,
            currentStep === 0 && styles.disabledButtonText
          ]}>
            {t('common.previous')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={goToNext}
        >
          <Text style={[styles.navButtonText, styles.nextButtonText]}>
            {currentStep === steps.length - 1 ? t('onboarding.getStarted') : t('common.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  stepContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  stepIcon: {
    fontSize: 80,
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  nextButton: {
    backgroundColor: '#3B82F6',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonText: {
    color: '#6B7280',
  },
  nextButtonText: {
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#D1D5DB',
  },
});

export default OnboardingScreen;
