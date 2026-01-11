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

### Phase 1: Core Stability & UX Foundation ✅
- ✅ **Smart Time Windows**: Prevents duplicate notifications within 5-minute window
- ✅ **Stock Warnings**: Alerts when stock is low after dose registration
- ✅ **Titration Info**: Shows current stage in notifications

### Phase 2: Query Commands ✅
- ✅ `/estoque` - View stock levels with days-remaining estimates
- ✅ `/hoje` - See today's schedule with taken/pending status
- ✅ `/proxima` - View next scheduled dose
- ✅ `/historico` - Last 10 logged doses
- ✅ `/ajuda` - Help message with all commands
- ✅ **Inline Queries** - Search medicines from any chat with `@botname <search>`

### Phase 4: Intelligent Alerts & Insights ✅
- ✅ **Stock Forecasting Alerts** - Daily at 9 AM, warns when stock ≤7 days
- ✅ **Weekly Adherence Reports** - Sundays at 8 PM, tracks dose adherence
- ✅ **Titration Stage Alerts** - Daily at 8 AM, notifies when to advance titration

## Database Migration Required

Before running the updated bot, execute this SQL in Supabase:

```sql
ALTER TABLE protocols 
ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;
```

Or run the migration file: `.migrations/add_last_notified_at.sql`

## Commands

### User Commands
- `/start` - Link Telegram account
- `/status` - View active protocols
- `/estoque` - Check medicine stock levels
- `/hoje` - Today's medication schedule
- `/proxima` - Next scheduled dose
- `/historico` - Recent dose history
- `/ajuda` - Show help message

### Notifications
- Automatic reminders at scheduled times
- Interactive buttons: "Tomei ✅" / "Pular ❌"
- Stock warnings when levels are low

## Development

```bash
# Run the bot locally
npm run bot

# The bot will automatically reload on file changes (--watch mode)
```

## Next Steps (Phase 3+)

Future enhancements planned:
- `/registrar` - Interactive dose logging
- `/adicionar_estoque` - Add stock via Telegram
- `/pausar` / `/retomar` - Protocol management
- Proactive stock alerts
- Weekly adherence reports
- Multi-user support with deep-link authentication
