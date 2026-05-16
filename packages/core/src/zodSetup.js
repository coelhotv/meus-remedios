// zodSetup.js — aplica locale PT-BR como mensagens default do Zod 4
// Importar uma vez no boot de cada app (mobile + web).

import { z } from 'zod'
import pt from 'zod/v4/locales/pt'

z.config(pt())
