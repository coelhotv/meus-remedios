import { useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, Pill } from 'lucide-react-native'
import { useMedicineDatabase } from '@shared/hooks/useMedicineDatabase'
import FormAutocomplete from '@shared/components/form/FormAutocomplete'
import { colors, spacing, borderRadius } from '@shared/styles/tokens'

export default function AnvisaSearchScreen({ navigation, route }) {
  const [query, setQuery] = useState('')
  const { search, isReady, isLoading, error, lastUpdated } = useMedicineDatabase()
  const results = isReady && query.trim().length >= 3 ? search(query, 20) : []

  function handleSelect(medicine) {
    route?.params?.onSelect?.(medicine)
    navigation?.goBack()
  }

  function renderResultItem({ item }) {
    return (
      <Pressable
        style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
        onPress={() => handleSelect(item)}
        accessibilityRole="button"
        accessibilityLabel={item.name}
      >
        <Pill size={18} color={colors.primary[500]} strokeWidth={2} style={styles.pillIcon} />
        <View style={styles.resultText}>
          <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
          {item.activeIngredient ? (
            <Text style={styles.resultSub} numberOfLines={1}>{item.activeIngredient}</Text>
          ) : null}
          {item.laboratory ? (
            <Text style={styles.resultLab} numberOfLines={1}>{item.laboratory}</Text>
          ) : null}
        </View>
      </Pressable>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Cabeçalho com botão voltar e título centralizado */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          onPress={() => navigation?.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <ChevronLeft size={24} color={colors.text.primary} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Buscar medicamento</Text>
        {/* Espaçador para simetria do título centralizado */}
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        {/* Campo de busca com overlay de sugestões */}
        <FormAutocomplete
          name="anvisa"
          label="Nome do medicamento"
          placeholder="Digite ao menos 3 letras"
          value={query}
          onChange={(_, v) => setQuery(v)}
          search={search}
          getItemLabel={(m) => m.name}
          getItemSubtitle={(m) => m.activeIngredient}
          onSelect={handleSelect}
        />

        {/* Bloco de status enquanto a base não está pronta */}
        {!isReady && (
          <View style={styles.statusBlock}>
            {isLoading ? (
              <View style={styles.statusRow}>
                <ActivityIndicator color={colors.primary[700]} />
                <Text style={styles.statusText}>Baixando base ANVISA…</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>
                {`Falha ao baixar base: ${error}. Verifique sua conexão e tente novamente.`}
              </Text>
            ) : null}
          </View>
        )}

        {/* Dica quando base está pronta mas query curta */}
        {isReady && query.trim().length < 3 && (
          <Text style={styles.hintText}>Digite ao menos 3 caracteres para buscar.</Text>
        )}

        {/* Lista de resultados expandida (top 20) */}
        {results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item, idx) => `${item.name}-${idx}`}
            renderItem={renderResultItem}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Atualização da base (quando disponível) */}
        {isReady && lastUpdated ? (
          <Text style={styles.updatedText}>
            {`Base atualizada em ${lastUpdated.toLocaleDateString('pt-BR')}`}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.bg.card,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    backgroundColor: colors.neutral[100],
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  body: {
    flex: 1,
    padding: spacing[5],
  },
  statusBlock: {
    marginTop: spacing[4],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  statusText: {
    fontSize: 14,
    color: colors.text.muted,
  },
  errorText: {
    fontSize: 14,
    color: colors.status.error,
    lineHeight: 20,
  },
  hintText: {
    marginTop: spacing[4],
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
  },
  list: {
    marginTop: spacing[4],
  },
  listContent: {
    gap: 0,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing[3],
  },
  resultRowPressed: {
    backgroundColor: colors.primary[50],
  },
  pillIcon: {
    marginTop: 2,
  },
  resultText: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  resultSub: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 2,
  },
  resultLab: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  updatedText: {
    marginTop: spacing[4],
    fontSize: 11,
    color: colors.text.muted,
    textAlign: 'center',
  },
})
