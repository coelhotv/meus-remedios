import { z } from 'zod';

const HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const timeSchema = z.string()
  .regex(HH_MM_REGEX, 'Formato HH:MM inválido')
  .transform(v => v?.slice(0, 5));

const schema = z.object({
  quiet_hours_start: timeSchema.nullable().optional(),
});

console.log('Test 1 (HH:MM):', JSON.stringify(schema.safeParse({ quiet_hours_start: '22:00' })));
console.log('Test 2 (HH:MM:SS):', JSON.stringify(schema.safeParse({ quiet_hours_start: '22:00:00' })));
console.log('Test 3 (null):', JSON.stringify(schema.safeParse({ quiet_hours_start: null })));
console.log('Test 4 (undefined):', JSON.stringify(schema.safeParse({})));
