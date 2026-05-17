// ProtocolFormScreen.jsx — stub Fase 2 Sprint T2.1 (Read screens only).
// Implementação completa em Sprint T2.2 (T2.6 da spec).
// Aqui apenas para registrar rota e evitar runtime crash.

import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { ArrowLeft } from 'lucide-react-native'
import ScreenContainer from '@shared/components/ui/ScreenContainer'
import { colors, spacing, typography } from '@shared/styles/tokens'

export default function ProtocolFormScreen() {
  const navigation = useNavigation()
  return (
    <ScreenContainer>
      <View style={styles.appbar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Novo tratamento</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.placeholder}>Em construção</Text>
        <Text style={styles.placeholderHint}>
          Formulário completo chega no próximo sprint (T2.2).
        </Text>
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  back: {
    padding: spacing[1],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  placeholder: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  placeholderHint: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
})
