import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../shared/styles/tokens';
import { ROUTES } from '../navigation/routes';
import PrimaryButton from '../shared/components/ui/PrimaryButton';

const { width } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const handleCreateAccount = () => {
    Alert.alert('Funcionalidade em breve', 'O fluxo de cadastro nativo será implementado na próxima Wave.');
  };

  const handleLogin = () => {
    navigation.navigate(ROUTES.LOGIN);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
             <Ionicons name="checkmark-circle" size={32} color={colors.brand.primary} />
             <Text style={styles.brandName}>dosiq</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.headline}>
            Tome seus remédios sob{' '}
            <View style={styles.highlightWrapper}>
              <Text style={styles.highlightText}>controle</Text>
              <View style={styles.underline} />
            </View>
          </Text>
          
          <Text style={styles.description}>
            Gerencie seus protocolos, estoque e lembretes em um só lugar.
          </Text>

          {/* Hero Mockup Card */}
          <View style={styles.mockupContainer}>
             <View style={styles.mockCard}>
                <View style={styles.mockCardHeader}>
                   <View style={styles.mockIconContainer}>
                      <Ionicons name="water" size={24} color={colors.brand.primary} />
                   </View>
                   <View style={styles.mockTextContainer}>
                      <Text style={styles.mockTitle}>Paracetamol</Text>
                      <Text style={styles.mockSubtitle}>750mg • 1 comprimido</Text>
                   </View>
                   <View style={styles.mockBadge}>
                      <Text style={styles.mockBadgeText}>Agora</Text>
                   </View>
                </View>
                <View style={styles.mockCardFooter}>
                   <View style={styles.mockProgressBar}>
                      <View style={[styles.mockProgressInner, { width: '65%' }]} />
                   </View>
                   <Text style={styles.mockProgressText}>Próximo: 22:00</Text>
                </View>
             </View>
             
             {/* Decorative element */}
             <View style={[styles.mockCard, styles.mockCardSecondary]}>
                <View style={styles.mockCardHeader}>
                   <View style={[styles.mockIconContainer, { backgroundColor: colors.primary[100] }]}>
                      <Ionicons name="flask" size={24} color={colors.primary[700]} />
                   </View>
                   <View style={styles.mockTextContainer}>
                      <View style={styles.mockSkeletonTitle} />
                      <View style={styles.mockSkeletonSubtitle} />
                   </View>
                </View>
             </View>
          </View>
        </View>

        {/* Benefits Bar */}
        <View style={styles.benefitsBar}>
           <BenefitItem icon="flask-outline" label="Protocolos" />
           <BenefitItem icon="medkit-outline" label="Estoque" />
           <BenefitItem icon="notifications-outline" label="Lembretes" />
        </View>

        {/* Bottom Actions */}
        <View style={styles.actions}>
           <PrimaryButton 
              label="Criar Conta" 
              onPress={handleCreateAccount}
              style={styles.primaryBtn}
           />
           <Pressable style={styles.secondaryBtn} onPress={handleLogin}>
              <Text style={styles.secondaryBtnText}>Já tenho uma conta</Text>
           </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BenefitItem({ icon, label }) {
  return (
    <View style={styles.benefitItem}>
      <View style={styles.benefitIconContainer}>
        <Ionicons name={icon} size={20} color={colors.text.secondary} />
      </View>
      <Text style={styles.benefitLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.brand, // Mint
  },
  scrollContent: {
    paddingBottom: spacing[10],
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    marginBottom: spacing[8],
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 24,
    fontFamily: typography.fontFamily.brand,
    color: colors.brand.forest,
    marginLeft: spacing[2],
    includeFontPadding: false,
  },
  heroSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[8],
  },
  headline: {
    fontSize: 40,
    lineHeight: 48,
    fontFamily: typography.fontFamily.brand,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  highlightWrapper: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: {
    color: colors.brand.primary,
    fontFamily: typography.fontFamily.brand,
  },
  underline: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: colors.brand.primary,
    opacity: 0.15,
    borderRadius: 4,
  },
  description: {
    fontSize: 18,
    color: colors.text.secondary,
    lineHeight: 26,
    marginBottom: spacing[8],
  },
  mockupContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[4],
  },
  mockCard: {
    width: width * 0.8,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.md,
    zIndex: 2,
  },
  mockCardSecondary: {
    position: 'absolute',
    top: 20,
    right: width * 0.05,
    width: width * 0.7,
    opacity: 0.4,
    transform: [{ scale: 0.9 }, { translateY: 40 }],
    zIndex: 1,
  },
  mockCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  mockIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand.mint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  mockTextContainer: {
    flex: 1,
  },
  mockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  mockSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  mockBadge: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: 8,
  },
  mockBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  mockCardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mockProgressBar: {
    height: 6,
    flex: 1,
    backgroundColor: colors.bg.screen,
    borderRadius: 3,
    marginRight: spacing[4],
  },
  mockProgressInner: {
    height: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: 3,
  },
  mockProgressText: {
    fontSize: 12,
    color: colors.text.muted,
  },
  mockSkeletonTitle: {
    height: 14,
    width: '60%',
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    marginBottom: 6,
  },
  mockSkeletonSubtitle: {
    height: 10,
    width: '40%',
    backgroundColor: colors.neutral[100],
    borderRadius: 4,
  },
  benefitsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[12],
  },
  benefitItem: {
    alignItems: 'center',
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
    marginBottom: spacing[2],
  },
  benefitLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  actions: {
    paddingHorizontal: spacing[6],
  },
  primaryBtn: {
    height: 56,
    borderRadius: borderRadius.md,
    marginBottom: spacing[3],
  },
  secondaryBtn: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
