import React from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useStock } from '../hooks/useStock'
import ScreenContainer from '../../../shared/components/ui/ScreenContainer'
import LoadingState from '../../../shared/components/states/LoadingState'
import EmptyState from '../../../shared/components/states/EmptyState'
import ErrorState from '../../../shared/components/states/ErrorState'
import StockItem from '../components/StockItem'

/**
 * Tela principal de Gerenciamento de Estoque (H5.5).
 */
export default function StockScreen() {
  const { data, loading, error, refreshing, refresh } = useStock()

  if (loading && !refreshing) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    )
  }

  if (error && !data) {
    return (
      <ScreenContainer>
        <ErrorState 
          message="Não foi possível carregar seu estoque." 
          onRetry={refresh} 
        />
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StockItem medicine={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={refresh} 
            tintColor="#6366f1"
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Meu Estoque</Text>
            <Text style={styles.subtitle}>
              Acompanhe a disponibilidade dos seus medicamentos
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState 
            message="Você não possui medicamentos cadastrados ou estoque registrado." 
          />
        }
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  }
})
