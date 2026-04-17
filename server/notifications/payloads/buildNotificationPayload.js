// Constrói payload canônico de notificação a partir de evento de domínio
// Todos os canais (Telegram, Expo) consomem este shape normalizado

const SUPPORTED_KINDS = ['dose_reminder', 'stock_alert', 'daily_digest']

export function buildNotificationPayload({ kind, data }) {
  switch (kind) {
    case 'dose_reminder':
      return {
        title: 'Hora do seu remédio',
        body: `Tome ${data.medicineName} agora`,
        deeplink: `meusremedios://today?protocolId=${data.protocolId}`,
        metadata: { protocolId: data.protocolId, medicineId: data.medicineId },
      }

    case 'stock_alert':
      return {
        title: 'Estoque baixo',
        body: `${data.medicineName} está acabando`,
        deeplink: `meusremedios://stock`,
        metadata: { medicineId: data.medicineId },
      }

    case 'daily_digest':
      return {
        title: 'Resumo do dia',
        body: data.summary,
        deeplink: `meusremedios://today`,
        metadata: {},
      }

    default:
      throw new Error(
        `[buildNotificationPayload] Unsupported notification kind: "${kind}". Supported: ${SUPPORTED_KINDS.join(', ')}`
      )
  }
}
