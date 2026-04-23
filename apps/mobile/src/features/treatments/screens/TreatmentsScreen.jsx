// TreatmentsScreen.jsx — tela "Tratamentos" do MVP mobile
// Exibe a lista de protocolos ativos do usuário

import { FlatList, View, Text, StyleSheet, RefreshControl } from 'react-native'
import ScreenContainer from '../../../shared/components/ui/ScreenContainer'
// ... (restante dos imports)
import LoadingState from '../../../shared/components/states/LoadingState'
import ErrorState from '../../../shared/components/states/ErrorState'
import EmptyState from '../../../shared/components/states/EmptyState'
import TreatmentCard from '../components/TreatmentCard'
import { useTreatments } from '../hooks/useTreatments'
import { colors, spacing, typography } from '../../../shared/styles/tokens'
import StaleBanner from '../../../shared/components/feedback/StaleBanner'

export default function TreatmentsScreen() {
  const { data, loading, error, stale, refresh } = useTreatments()

  if (loading && !data) {
    return (
      <ScreenContainer>
        <LoadingState message="Carregando seus tratamentos..." />
      </ScreenContainer>
    )
  }

  if (error && !data) {
    return (
      <ScreenContainer>
        <ErrorState message={error} onRetry={refresh} />
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer>
      {stale && <StaleBanner />}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TreatmentCard treatment={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading && !!data}
            onRefresh={refresh}
            tintColor={colors.status.success}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Meus Tratamentos</Text>
            <Text style={styles.subtitle}>Acompanhe seus protocolos ativos</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState 
            title="Nenhum tratamento ativo"
            message={'Sem tratamentos ativos.\nAdicione protocolos na versão web.'}
          />
        }
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing[10],
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
    fontFamily: typography.fontFamily.bold || 'System',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 4,
    fontFamily: typography.fontFamily.medium || 'System',
  },
})
