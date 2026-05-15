// MedicineEmptyState.jsx — Estado vazio da biblioteca de medicamentos
// Componente puro (sem state, sem effects) exibido quando a lista está vazia

import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Pill } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import { colors, spacing } from '@shared/styles/tokens'
import { ROUTES } from '@navigation/routes'
import { lightTap } from '@shared/utils/haptics'

export function MedicineEmptyState() {
  const navigation = useNavigation()

  const handleCreateMedicine = () => {
    lightTap()
    navigation.navigate(ROUTES.MEDICINE_CREATE)
  }

  const handleAnvisaSearch = () => {
    lightTap()
    navigation.navigate(ROUTES.ANVISA_SEARCH)
  }

  return (
    <View style={styles.container}>
      {/* Ícone em círculo verde */}
      <View style={styles.iconCircle}>
        <Pill size={48} color={colors.primary[500]} strokeWidth={1.5} />
      </View>

      {/* Título */}
      <Text style={styles.title}>Biblioteca vazia</Text>

      {/* Subtítulo */}
      <Text style={styles.subtitle}>
        Cadastre medicamentos para começar a gerenciar tratamentos
      </Text>

      {/* Spacer */}
      <View style={{ height: spacing[6] }} />

      {/* Botão primário */}
      <Pressable style={styles.button} onPress={handleCreateMedicine}>
        <Text style={styles.buttonText}>+ Cadastrar primeiro medicamento</Text>
      </Pressable>

      {/* Link ANVISA */}
      <Pressable style={styles.anvisaLink} onPress={handleAnvisaSearch}>
        <Text style={styles.anvisaLinkText}>Buscar na base ANVISA · 6.816 registros</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[6],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: spacing[3],
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text.inverse,
    fontWeight: '600',
    fontSize: 15,
  },
  anvisaLink: {
    marginTop: spacing[3],
  },
  anvisaLinkText: {
    color: colors.primary[600],
    fontSize: 13,
    textDecorationLine: 'underline',
  },
})
