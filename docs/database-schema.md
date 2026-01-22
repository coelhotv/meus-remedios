# 🗄️ Esquema do Banco de Dados

O banco de dados do **Meus Remédios** é hospedado no Supabase (PostgreSQL) e utiliza Row-Level Security (RLS) para garantir a privacidade dos dados de cada usuário.

## Diagrama de Tabelas

```mermaid
erDiagram
    users ||--o{ medicines : "cadastra"
    users ||--o{ protocols : "configura"
    users ||--o{ stock : "possui"
    users ||--o{ medicine_logs : "registra"
    users ||--o{ treatment_plans : "organiza"
    users ||--|| user_settings : "define"

    medicines ||--o{ protocols : "usado em"
    medicines ||--o{ stock : "tem estoque"
    medicines ||--o{ medicine_logs : "logado como"
    
    treatment_plans ||--o{ protocols : "agrupa"
    protocols ||--o{ medicine_logs : "gera logs"
```

## Detalhes das Tabelas

### `auth.users` (Supabase Default)
Tabela interna do Supabase para gerenciamento de contas. O `id` do usuário é referenciado em todas as outras tabelas como `user_id`.

### `user_settings`
Configurações globais e integração com o Telegram.
- `id` (uuid, PK): ID único.
- `user_id` (uuid, FK, Unique): Referência ao usuário.
- `telegram_chat_id` (text): ID do chat do usuário no Telegram para notificações.
- `verification_token` (text): Código temporário para vincular o bot.

### `medicines`
Cadastro básico de medicamentos e suplementos.
- `id` (uuid, PK): ID único.
- `user_id` (uuid, FK): Dono do registro.
- `name` (text): Nome comercial.
- `laboratory` (text): Laboratório/Marca.
- `active_ingredient` (text): Princípio ativo.
- `dosage_per_pill` (numeric): Dosagem por unidade (ex: 50.0).
- `dosage_unit` (text): Unidade (mg, mcg, ml, etc).
- `type` (text): 'medicine' ou 'supplement'.

### `treatment_plans`
Agrupadores de protocolos (ex: "Protocolo Anti-Inflamatório").
- `id` (uuid, PK).
- `name` (text).
- `description` (text).
- `objective` (text).

### `protocols`
Dita como o medicamento deve ser tomado.
- `id` (uuid, PK).
- `medicine_id` (uuid, FK).
- `treatment_plan_id` (uuid, FK).
- `name` (text): Nome do protocolo.
- `frequency` (text): 'daily', 'alternate', etc.
- `time_schedule` (jsonb): Array de horários (ex: `["08:00", "20:00"]`).
- `dosage_per_intake` (numeric): Quantidade por tomada.
- `titration_status` (text): 'estável', 'titulando', 'alvo_atingido'.
- `titration_schedule` (jsonb): Estágios da titulação.
- `current_stage_index` (int).
- `stage_started_at` (timestamptz).

### `stock`
Controle de inventário.
- `id` (uuid, PK).
- `medicine_id` (uuid, FK).
- `quantity` (numeric): Quantidade atual em unidades.
- `purchase_date` (date).
- `expiration_date` (date).
- `unit_price` (numeric): Preço pago por unidade (ex: preço da caixa / quantidade total).

### `medicine_logs`
Histórico de doses tomadas.
- `id` (uuid, PK).
- `protocol_id` (uuid, FK).
- `medicine_id` (uuid, FK).
- `taken_at` (timestamptz): Data e hora real da tomada.
- `quantity_taken` (numeric).
- `notes` (text).

---

## Row-Level Security (RLS)

Todas as tabelas possuem RLS habilitado. As políticas padrão são:
1. **SELECT**: `auth.uid() = user_id`.
2. **INSERT**: `auth.uid() = user_id`.
3. **UPDATE**: `auth.uid() = user_id`.
4. **DELETE**: `auth.uid() = user_id`.

**Nota**: O Bot do Telegram utiliza a `SUPABASE_SERVICE_ROLE_KEY` para ignorar estas políticas e gerenciar dados de múltiplos usuários de forma segura no lado do servidor.
