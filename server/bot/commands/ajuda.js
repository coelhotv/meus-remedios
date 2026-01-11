export async function handleAjuda(bot, msg) {
  const chatId = msg.chat.id;
  
    let botUsername = 'meus_remedios_bot';
    try {
      const me = await bot.getMe();
      if (me && me.username) botUsername = me.username;
    } catch (e) {
      console.warn('Could not get bot username:', e);
    }

    const helpMessage = `
🤖 *Comandos Disponíveis:*

*Informações*
/status - Ver seus protocolos ativos
/estoque - Verificar estoque de medicamentos
/hoje - Ver todas as doses de hoje
/proxima - Ver a próxima dose agendada
/historico - Ver últimas doses registradas

*Ações*
/registrar - Registrar uma dose manualmente
/adicionar_estoque - Adicionar medicamentos ao estoque
/repor <nome> <qtd> - Atalho rápido para repor estoque
/pausar <nome> - Pausar um protocolo
/retomar <nome> - Retomar um protocolo pausado

*Configuração*
/start - Vincular conta ao Telegram

*Ajuda*
/ajuda - Mostrar esta mensagem

🔍 *Busca Inline*
Digite \`@${botUsername} <nome>\` em qualquer chat para buscar seus medicamentos!

💡 *Dica:* Quando receber uma notificação de dose, você pode registrá-la diretamente tocando em "Tomei ✅"!

📊 *Relatórios Automáticos:*
• Alertas de estoque baixo (diariamente às 9h)
• Relatório semanal de adesão (domingos às 20h)
• Alertas de titulação (diariamente às 8h)
  `.trim();

  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
}
