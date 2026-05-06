import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Alert,
  Dimensions,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, typography, borderRadius, shadows } from '../shared/styles/tokens';
import { ROUTES } from '../navigation/routes';

const { width } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const handleCreateAccount = () => {
    Alert.alert('Em breve', 'Cadastro pelo app ainda não está disponível.');
  };

  const handleLogin = () => {
    navigation.navigate(ROUTES.LOGIN);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header Branding - Copied assets pattern from LoginScreen */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>dosiq</Text>
        </View>

        {/* 2. Hero Section Container */}
        <View style={styles.heroContainer}>
          {/* Adherence Card */}
          <View style={[styles.card, styles.adherenceCard]}>
            <View style={styles.adherenceContent}>
              <View style={styles.circularProgressContainer}>
                <Svg width="60" height="60" viewBox="0 0 40 40">
                  <Circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="#E1E3E8"
                    strokeWidth="4"
                    fill="none"
                  />
                  <Circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke={colors.brand.primary}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray="80 100"
                    strokeLinecap="round"
                    transform="rotate(-90 20 20)"
                  />
                  <View style={styles.progressTextContainer}>
                    <Text style={styles.progressPercent}>80%</Text>
                  </View>
                </Svg>
              </View>
              <View style={styles.adherenceInfo}>
                <Text style={styles.adherenceLabel}>Hoje</Text>
                <Text style={styles.adherenceTitle}>Adesão excelente!</Text>
              </View>
            </View>
          </View>

          {/* Next Dose Card */}
          <View style={[styles.card, styles.doseCard]}>
            <View style={styles.doseIconContainer}>
              <Ionicons name="medical-outline" size={24} color={colors.brand.primary} />
            </View>
            <View style={styles.doseInfo}>
              <Text style={styles.doseLabel}>PRÓXIMA DOSE</Text>
              <View style={styles.doseTimeRow}>
                <Text style={styles.doseTimeText}>08:00 AM</Text>
              </View>
              <Text style={styles.medicationName}>Atorvastatina</Text>
              <Text style={styles.medicationDetails}>10mg • 1 Comprimido</Text>
            </View>
          </View>
        </View>

        {/* 3. Headline Section */}
        <View style={styles.textSection}>
          <View style={styles.headlineContainer}>
            <Text style={styles.headlineText}>Sua saúde sob</Text>
            <View style={styles.highlightRow}>
              <View style={styles.highlightWrapper}>
                <Text style={[styles.headlineText, styles.highlightText]}>controle</Text>
                <View style={styles.thickUnderline} />
              </View>
              <Text style={styles.headlineText}>, sem</Text>
            </View>
            <Text style={styles.headlineText}>complicações.</Text>
          </View>

          <Text style={styles.descriptionText}>
            O dosiq ajuda você a gerenciar seus medicamentos, estoque e adesão em um só lugar. Gratuito e portátil.
          </Text>
        </View>

        {/* 4. Benefits Bar */}
        <View style={styles.benefitsBar}>
          <BenefitColumn top="100%" bottom="SEGURO" />
          <BenefitColumn top="Offline" bottom="ACESSO" />
          <BenefitColumn top="Grátis" bottom="PARA SEMPRE" />
        </View>

        {/* 5. Sponsored Space - Suppressed until ads/partnerships are active
        <View style={styles.sponsorSection}>
          <View style={styles.sponsorBox}>
            <Text style={styles.sponsorLabel}>ESPAÇO PATROCINADO</Text>
            <View style={styles.sponsorLogos}>
              <View style={styles.sponsorBrand}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.text.muted} style={styles.brandIcon} />
                <Text style={styles.brandText}>BIO-HEALTH</Text>
              </View>
              <View style={styles.sponsorBrand}>
                <Ionicons name="medkit-outline" size={18} color={colors.text.muted} style={styles.brandIcon} />
                <Text style={styles.brandText}>PHARMA-CORE</Text>
              </View>
            </View>
          </View>
        </View>
        */}
      </ScrollView>

      {/* 6. Action Bar (Fixed at bottom) */}
      <View style={[
        styles.actionBar, 
        { paddingBottom: Math.max(insets.bottom, spacing[6]) }
      ]}>
        <Pressable 
          style={styles.createAccountBtn} 
          onPress={handleCreateAccount}
          accessibilityRole="button"
          accessibilityLabel="Criar Conta"
        >
          <Ionicons name="person-add-outline" size={20} color="#fff" />
          <Text style={styles.createAccountText}>Criar Conta</Text>
        </Pressable>
        
        <Pressable 
          style={styles.loginBtn} 
          onPress={handleLogin}
          accessibilityRole="button"
          accessibilityLabel="Entrar na conta"
        >
          <Ionicons name="log-in-outline" size={24} color={colors.primary[600]} />
          <Text style={styles.loginBtnText}>Entrar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function BenefitColumn({ top, bottom }) {
  return (
    <View style={styles.benefitColumn}>
      <Text style={styles.benefitTop}>{top}</Text>
      <Text style={styles.benefitBottom}>{bottom}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.screen,
  },
  scrollContent: {
    paddingBottom: 140, // More space for the fixed bottom bar on iOS
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[4],
    marginBottom: spacing[6],
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: spacing[2],
  },
  brandName: {
    fontSize: 28,
    fontFamily: typography.fontFamily.brand,
    color: colors.text.brand,
    includeFontPadding: false,
    letterSpacing: -1,
  },
  heroContainer: {
    backgroundColor: '#f1f3f4',
    marginHorizontal: spacing[6],
    borderRadius: 32,
    padding: spacing[6],
    marginBottom: spacing[8],
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: 24,
    padding: spacing[4],
    width: '100%',
    ...shadows.sm,
  },
  adherenceCard: {
    marginBottom: spacing[4],
  },
  adherenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circularProgressContainer: {
    width: 60,
    height: 60,
    marginRight: spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  adherenceInfo: {
    flex: 1,
  },
  adherenceLabel: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: 2,
  },
  adherenceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  doseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  doseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e3f2fd', // Light blue/transparent
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  doseInfo: {
    flex: 1,
  },
  doseLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  doseTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  doseTimeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  medicationDetails: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  textSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[8],
  },
  headlineContainer: {
    marginBottom: spacing[4],
  },
  headlineText: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  highlightWrapper: {
    position: 'relative',
    paddingBottom: 4,
  },
  highlightText: {
    color: colors.brand.primary,
  },
  thickUnderline: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: colors.brand.primary,
    borderRadius: 3,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  benefitsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[8],
    marginBottom: spacing[8],
  },
  benefitColumn: {
    alignItems: 'center',
  },
  benefitTop: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  benefitBottom: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  sponsorSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  sponsorBox: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 16,
    padding: spacing[4],
    alignItems: 'center',
  },
  sponsorLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text.muted,
    marginBottom: spacing[3],
    letterSpacing: 1,
  },
  sponsorLogos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[6],
  },
  sponsorBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    marginRight: 6,
  },
  brandText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text.muted,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing[3],
  },
  createAccountBtn: {
    flex: 1.5,
    backgroundColor: colors.brand.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  createAccountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginBtn: {
    flex: 1,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  loginBtnText: {
    color: colors.primary[600],
    fontSize: 16,
    fontWeight: 'bold',
  },
});
