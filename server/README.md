# Telegram Bot - Meus Remédios

## Architecture

The bot is now organized in a modular structure for better maintainability:

```
server/
├── index.js                    # Entry point
├── bot/
│   ├── commands/               # Command handlers
│   │   ├── start.js           # /start
│   │   ├── status.js          # /status
│   │   ├── estoque.js         # /estoque (NEW)
│   │   ├── hoje.js            # /hoje (NEW)
│   │   ├── proxima.js         # /proxima (NEW)
│   │   ├── historico.js       # /historico (NEW)
│   │   └── ajuda.js           # /ajuda (NEW)
│   ├── callbacks/
│   │   └── doseActions.js     # Button callbacks
│   └── scheduler.js           # Cron notifications
├── services/
│   └── supabase.js            # Database client
└── utils/
    └── formatters.js          # Message formatting utilities
```

## Features Implemented

### Phase 3: Conversational Actions ✅
- ✅ `/registrar` - Interactive dose logging
- ✅ `/adicionar_estoque` - Add stock via Telegram
- ✅ `/pausar` / `/retomar` - Protocol management

### Phase 4: Intelligent Alerts & Insights ✅
- ✅ **Stock Forecasting Alerts** - Daily at 9 AM, warns when stock ≤7 days
- ✅ **Weekly Adherence Reports** - Sundays at 8 PM, tracks dose adherence
- ✅ **Titration Stage Alerts** - Daily at 8 AM, notifies when to advance titration

### Multi-User & Security ✅
- ✅ **Secure Authentication** - Integration with Supabase Auth
- ✅ **Token-Based Linking** - Secure chat registration using `/start <TOKEN>`
- ✅ **Data Isolation** - Per-user data access through dynamic session resolution

## Database Migration Required

Ensure your Supabase schema is up to date. Siga o guia em `MIGRATION_GUIDE.md` para adicionar os campos necessários, incluindo:

```sql
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS verification_token text;
```

## Setup & Deployment

1. **Local**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is in your `.env`.
2. **Vercel**: You **MUST** add `SUPABASE_SERVICE_ROLE_KEY` to your Vercel Environment Variables. Without it, the bot cannot link users due to RLS policies.

## Commands

### User Commands
- `/start <TOKEN>` - Link Telegram account using the code from App Settings
- `/status` - View active protocols
- `/estoque` - Check medicine stock levels
- `/hoje` - Today's medication schedule
- `/proxima` - Next scheduled dose
- `/historico` - Recent dose history
- `/ajuda` - Show help message
- `/registrar` - Register a dose interactively
- `/pausar [medicamento]` - Pause a protocol
- `/retomar [medicamento]` - Resume a protocol

### Notifications
- Automatic reminders at scheduled times
- Interactive buttons: "Tomei ✅" / "Pular ❌"
- Stock warnings when levels are low

## Development

```bash
# Run the bot locally
npm run bot
```
