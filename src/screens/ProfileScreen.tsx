import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';

import { Utilisateur, Signalement } from '../types/api';
import { useLanguage } from '../contexts/LanguageContext';
import authService from '../services/authService';
import reportService from '../services/reportService';

import LanguageSwitch from '../components/LanguageSwitch';

interface Props {
  navigation: any;
}

interface ProfileStats {
  totalReports: number;
  pendingReports: number;
  validatedReports: number;
  rejectedReports: number;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useLanguage();
  
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalReports: 0,
    pendingReports: 0,
    validatedReports: 0,
    rejectedReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        navigation.navigate('Auth');
        return;
      }

      setUser(currentUser);

      // Charger les statistiques des signalements
      try {
        const userReports = await reportService.getReportsByUserId(currentUser.id);
        const stats: ProfileStats = {
          totalReports: userReports.length,
          pendingReports: userReports.filter(r => r.statut === 'EN_ATTENTE').length,
          validatedReports: userReports.filter(r => r.statut === 'VALIDE').length,
          rejectedReports: userReports.filter(r => r.statut === 'REJETE').length,
        };
        setStats(stats);
      } catch (error) {
        console.warn('Erreur lors du chargement des statistiques:', error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      Alert.alert(t('common.error'), t('profile.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              navigation.navigate('Auth');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert(t('common.error'), t('profile.logoutError'));
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getRoleDisplayName = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      'ADMINISTRATEUR': t('profile.roleAdmin'),
      'VOLONTAIRE': t('profile.roleVolunteer'),
      'CONSOMMATEUR': t('profile.roleConsumer'),
    };
    return roleMap[role] || role;
  };

  const renderUserInfo = () => {
    if (!user) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.name')}</Text>
            <Text style={styles.infoValue}>{user.prenom} {user.nom}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.email')}</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.phone')}</Text>
            <Text style={styles.infoValue}>{user.telephone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.region')}</Text>
            <Text style={styles.infoValue}>{user.region.nom}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.role')}</Text>
            <Text style={styles.infoValue}>{getRoleDisplayName(user.role)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.memberSince')}</Text>
            <Text style={styles.infoValue}>{formatDate(user.dateInscription)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.myReports')}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalReports}</Text>
          <Text style={styles.statLabel}>{t('report.totalReports')}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.pendingReports}</Text>
          <Text style={styles.statLabel}>{t('report.pending')}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#16A34A' }]}>{stats.validatedReports}</Text>
          <Text style={styles.statLabel}>{t('report.validated')}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#DC2626' }]}>{stats.rejectedReports}</Text>
          <Text style={styles.statLabel}>{t('report.rejected')}</Text>
        </View>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
      
      <View style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('profile.language')}</Text>
          <LanguageSwitch showLabel={true} />
        </View>

        <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
          <Text style={styles.settingLabel}>{t('profile.notifications')}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
          <Text style={styles.settingLabel}>{t('profile.changePassword')}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow} onPress={() => {}}>
          <Text style={styles.settingLabel}>{t('profile.about')}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
        <Text style={styles.actionButtonText}>{t('profile.editProfile')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Report')}>
        <Text style={styles.actionButtonText}>{t('report.title')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
        <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
          {t('profile.logout')}
        </Text>
      </TouchableOpacity>
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('profile.notLoggedIn')}</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Auth')}>
            <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <Text style={styles.subtitle}>
            {t('profile.welcome', { name: user.prenom })}
          </Text>
        </View>

        {renderUserInfo()}
        {renderStats()}
        {renderSettings()}
        {renderActions()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
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
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLabel: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  settingArrow: {
    fontSize: 20,
    color: '#6B7280',
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
  },
  logoutButtonText: {
    color: '#FFFFFF',
  },
});

export default ProfileScreen;
