GitHub Copilot: # Telegram Bot Architecture & Services Documentation

## Overview
This is a medication adherence tracking bot with multi-stage development (Phases 1-4). It uses Node.js with Telegram Bot API and Supabase as the backend.

---

## Services Architecture

### 1. **Core Services**

#### `server/services/supabase.js`
- **Purpose**: Centralized Supabase client initialization
- **Exports**: 
  - `supabase`: Authenticated client instance
  - `MOCK_USER_ID`: Single user ID for MVP
- **Issues**: 
  - Hardcoded single user (MVP limitation)
  - No authentication layer for multi-user

#### `server/utils/formatters.js`
- **Purpose**: Shared formatting utilities
- **Functions**:
  - `getCurrentTime()`: Brazil timezone aware HH:MM formatter
  - `calculateDaysRemaining()`: Stock forecasting math
  - `formatStockStatus()`: Medicine stock message builder
  - `formatProtocol()`: Protocol details formatter
  - `calculateStreak()`: Adherence streak calculator

---

### 2. **Bot Commands** (Implemented)

| Command | File | Purpose |
|---------|------|---------|
| `/start` | `bot/commands/start.js` | Bot initialization & user linking |
| `/status` | `bot/commands/status.js` | Current protocol overview |
| `/estoque` | `bot/commands/estoque.js` | Stock level review |
| `/hoje` | `bot/commands/hoje.js` | Today's scheduled doses |
| `/proxima` | `bot/commands/proxima.js` | Next dose notification |
| `/historico` | `bot/commands/historico.js` | Dose history & trends |
| `/ajuda` | `bot/commands/ajuda.js` | Help & command reference |
| `/registrar` | `bot/commands/registrar.js` | Register new medicine |
| `/adicionar_estoque` | `bot/commands/adicionar_estoque.js` | Add stock + shortcut `/repor` |
| `/pausar` | `bot/commands/protocols.js` | Pause protocol |
| `/retomar` | `bot/commands/protocols.js` | Resume protocol |

---

### 3. **Callback Handlers** (Interactive Buttons)

#### `bot/callbacks/doseActions.js`
- **Purpose**: Handle dose-related inline buttons
- **Actions**:
  - `take_:${protocolId}:${dosage}`: Mark dose as taken
  - `skip_:${protocolId}`: Skip dose
- **Linked to**: Dose notifications & reminders

#### `bot/callbacks/conversational.js`
- **Purpose**: Multi-step conversational flows
- **Flows**: Registration, stock addition, protocol management
- **State Management**: Uses `bot/state.js` for session tracking

#### `bot/state.js`
- **Purpose**: In-memory session management
- **Features**: 
  - Maps chatId → conversation context
  - 10-minute TTL for sessions
  - Basic garbage collection

---

### 4. **Scheduling & Alerts**

#### `bot/scheduler.js`
- **Cron Jobs**:
  - `* * * * *`: Dose reminders (every minute)
  - `0 23 * * *`: Daily digest (11 PM)

#### `bot/alerts.js`
- **Cron Jobs**:
  - `0 9 * * *`: Stock alerts (9 AM daily)
  - `0 8 * * *`: Titration alerts (8 AM daily)
  - `0 22 * * 0`: Adherence reports (10 PM Sundays)
  - `0 10 1 * *`: Monthly report (1st of month, 10 AM)

#### `bot/tasks.js`
- **Core Functions**:
  - `checkReminders()`: Main dose notification + soft reminders
  - `runDailyDigest()`: Daily recap (taken doses + tomorrow preview)
  - `checkStockAlerts()`: Low stock & out-of-stock warnings
  - `checkAdherenceReports()`: Weekly adherence metrics
  - `checkTitrationAlerts()`: Titration stage transition notifications
  - `checkMonthlyReport()`: Monthly trend analysis

---

### 5. **Advanced Features**

#### `bot/inlineQuery.js`
- **Purpose**: Inline medicine search (`@botname medicine_name`)
- **Results**: Medicine cards with stock & protocol info
- **Cache**: 10 seconds

---

### 6. **API Routes** (Vercel Serverless)

#### `api/telegram.js`
- **Purpose**: Webhook receiver for Telegram updates
- **Handlers**: Routes messages & callbacks to commands
- **Bot Adapter**: Fetch-based bot mock (no node-telegram-bot-api polling)

#### `api/notify.js`
- **Purpose**: Cron job endpoint for scheduled tasks
- **Auth**: Bearer token via `CRON_SECRET`
- **Logic**: Time-based dispatcher for all alerts & reminders

---

## Data Flow

```
User Message
    ↓
[Telegram Webhook] → api/telegram.js
    ↓
[Command Router] → bot/commands/*.js
    ↓
[Supabase Queries] ← server/services/supabase.js
    ↓
[Formatters & Responses] ← server/utils/formatters.js
    ↓
[Telegram API] → Bot sends message/inline buttons
    ↓
[Callback Event] → bot/callbacks/*.js (if button clicked)
    ↓
[State Management] → bot/state.js (for multi-step flows)
```

---

## Key Improvements Needed

### **High Priority**

1. **Multi-User Support**
   - Remove `MOCK_USER_ID` hardcoding
   - Implement user authentication flow
   - Store `user_id` in Telegram user context
   - Add user registration with encryption

2. **Timezone Handling**
   - `getCurrentTime()` uses `new Date()` in Vercel (UTC)
   - Issue: Dose reminders may trigger at wrong times
   - **Fix**: Either:
     - Pass timezone from user settings
     - Store user timezone in DB
     - Use date-fns with IANA timezones

3. **Error Handling & Logging**
   - No structured logging (just `console.error`)
   - No error recovery for partial failures
   - Missing error messages to users (silent failures)
   - **Fix**: Implement Winston or Pino logger + user error notifications

### **Medium Priority**

4. **State Management Issues**
   - In-memory sessions lost on Vercel restarts
   - 10-min TTL may be too short for complex flows
   - No persistence layer
   - **Fix**: Use Redis or Supabase for session storage

5. **Duplicate Notifications**
   - `last_notified_at` + 5-min check can still miss edge cases
   - Soft reminders may overlap with main notifications
   - **Fix**: Implement message deduplication queue (Redis)

6. **Performance Optimization**
   - `checkReminders()` queries all protocols every minute
   - No query result caching
   - Stock calculations repeated per request
   - **Fix**: Implement caching layer + query optimization

7. **Input Validation**
   - Commands don't validate user input thoroughly
   - Stock additions accept any quantity
   - No input sanitization for SQL injection
   - **Fix**: Add Zod/Joi validation schemas

### **Low Priority (Polish)**

8. **Testing**
   - No unit/integration tests
   - No mock Supabase setup
   - Difficult to test without live bot token
   - **Fix**: Add Jest + Supabase local testing

9. **Rate Limiting**
   - No rate limiting on endpoints
   - Users could spam `/registrar` to create infinite medicines
   - **Fix**: Add Telegram rate limit middleware

10. **Code Organization**
    - `tasks.js` is 400+ lines (single responsibility violated)
    - Commands mixed with callbacks in same handlers
    - Formatters intermingled with business logic
    - **Fix**: Split into smaller modules (e.g., `services/`, `features/`)

11. **Documentation**
    - No JSDoc comments on exported functions
    - Callback data format undocumented (`take_:${id}:${dosage}`)
    - Database schema not in code docs
    - **Fix**: Add comprehensive JSDoc + API docs

---

## Recommended Tech Debt Items

| Item | Impact | Effort |
|------|--------|--------|
| Multi-user auth | Blocker | High |
| Redis session store | High | Medium |
| Structured logging | Medium | Low |
| Input validation | Medium | Medium |
| Timezone fixes | High | Low |
| Query caching | Medium | Medium |
| Module splitting | Low | High |
| Test suite | Medium | High |