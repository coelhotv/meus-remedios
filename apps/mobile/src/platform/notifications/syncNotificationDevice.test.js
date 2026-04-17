// Testes para syncNotificationDevice.js
// Valida: upsert com onConflict, platform detection, is_active flag

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Application from 'expo-application'
import { syncNotificationDevice } from './syncNotificationDevice'

// Mock React Native plataforma
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: 17,
  },
}))

vi.mock('expo-device', () => ({
  modelName: 'iPhone 15 Pro',
}))

vi.mock('expo-application', () => ({
  nativeApplicationVersion: '4.0.0',
}))

describe('syncNotificationDevice', () => {
  let mockSupabase

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => ({
        upsert: vi.fn(() => Promise.resolve({ data: [{ id: 'test-device' }], error: null })),
      })),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('deve upsert device com onConflict correto', async () => {
    const result = await syncNotificationDevice({
      supabase: mockSupabase,
      userId: 'user-123',
      token: 'ExponentPushToken[abc123]',
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('notification_devices')

    const mockFrom = mockSupabase.from('notification_devices')
    const upsertCall = mockFrom.upsert.mock.calls[0]
    const [data, options] = upsertCall

    // Validar options.onConflict
    expect(options).toEqual({ onConflict: 'provider,push_token' })

    // Validar dados inseridos
    expect(data.user_id).toBe('user-123')
    expect(data.push_token).toBe('ExponentPushToken[abc123]')
    expect(data.provider).toBe('expo')
    expect(data.app_kind).toBe('native')

    expect(result).toEqual([{ id: 'test-device' }])
  })

  it('deve refletir platform correta (iOS neste teste)', async () => {
    await syncNotificationDevice({
      supabase: mockSupabase,
      userId: 'user-123',
      token: 'ExponentPushToken[abc123]',
    })

    const mockFrom = mockSupabase.from('notification_devices')
    const data = mockFrom.upsert.mock.calls[0][0]

    expect(data.platform).toBe('ios')
    expect(data.platform).toBe(Platform.OS)
  })

  it('deve sempre setar is_active: true', async () => {
    await syncNotificationDevice({
      supabase: mockSupabase,
      userId: 'user-123',
      token: 'ExponentPushToken[abc123]',
    })

    const mockFrom = mockSupabase.from('notification_devices')
    const data = mockFrom.upsert.mock.calls[0][0]

    expect(data.is_active).toBe(true)
  })

  it('device_fingerprint deve ser JSON válido', async () => {
    await syncNotificationDevice({
      supabase: mockSupabase,
      userId: 'user-123',
      token: 'ExponentPushToken[abc123]',
    })

    const mockFrom = mockSupabase.from('notification_devices')
    const data = mockFrom.upsert.mock.calls[0][0]

    // Validar que é JSON válido
    const parsed = JSON.parse(data.device_fingerprint)
    expect(parsed).toHaveProperty('os')
    expect(parsed).toHaveProperty('osVersion')
    expect(parsed).toHaveProperty('deviceModel')
    expect(parsed).toHaveProperty('appVersion')
    expect(parsed.os).toBe(Platform.OS)
  })

  it('deve rejeitar se supabase ausente', async () => {
    const promise = syncNotificationDevice({
      supabase: null,
      userId: 'user-123',
      token: 'ExponentPushToken[abc123]',
    })

    await expect(promise).rejects.toThrow('[syncNotificationDevice] supabase client required')
  })

  it('deve rejeitar se userId ausente', async () => {
    const promise = syncNotificationDevice({
      supabase: mockSupabase,
      userId: null,
      token: 'ExponentPushToken[abc123]',
    })

    await expect(promise).rejects.toThrow('[syncNotificationDevice] userId required')
  })

  it('deve rejeitar se token ausente', async () => {
    const promise = syncNotificationDevice({
      supabase: mockSupabase,
      userId: 'user-123',
      token: null,
    })

    await expect(promise).rejects.toThrow('[syncNotificationDevice] token required')
  })

  it('deve propagar erro do Supabase', async () => {
    const mockError = new Error('Network error')
    mockSupabase.from = vi.fn(() => ({
      upsert: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
    }))

    const promise = syncNotificationDevice({
      supabase: mockSupabase,
      userId: 'user-123',
      token: 'ExponentPushToken[abc123]',
    })

    await expect(promise).rejects.toThrow('[syncNotificationDevice] Upsert failed: Network error')
  })

  it('last_seen_at deve ser ISO string', async () => {
    const beforeCall = new Date()
    await syncNotificationDevice({
      supabase: mockSupabase,
      userId: 'user-123',
      token: 'ExponentPushToken[abc123]',
    })
    const afterCall = new Date()

    const mockFrom = mockSupabase.from('notification_devices')
    const data = mockFrom.upsert.mock.calls[0][0]

    expect(data.last_seen_at).toBeDefined()
    const timestamp = new Date(data.last_seen_at)
    expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime())
    expect(timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime())
  })
})
