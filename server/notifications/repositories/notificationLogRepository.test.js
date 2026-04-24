import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationLogRepository } from './notificationLogRepository.js';
import { supabase } from '../../services/supabase.js';

vi.mock('../../services/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn()
          }))
        }))
      }))
    })),
  },
}));

describe('notificationLogRepository', () => {
  const mockUserId = '82ae6c78-b11a-4ea3-8884-63303d8a964a';
  const mockProtocolId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('deve inserir um novo log com sucesso', async () => {
      const mockData = {
        user_id: mockUserId,
        protocol_id: mockProtocolId,
        notification_type: 'dose_reminder',
        status: 'enviada',
        provider_metadata: { telegram_message_id: 123 }
      };

      const mockResponse = { ...mockData, id: 'log-id', created_at: new Date().toISOString() };
      
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockResponse, error: null })
        })
      });

      vi.mocked(supabase.from).mockReturnValue({ insert: insertMock });

      const result = await notificationLogRepository.create(mockData);

      expect(supabase.from).toHaveBeenCalledWith('notification_log');
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        user_id: mockUserId,
        protocol_id: mockProtocolId,
        notification_type: 'dose_reminder'
      }));
      expect(result).toEqual(mockResponse);
    });

    it('deve lançar erro se a validação Zod falhar', async () => {
      const invalidData = {
        user_id: 'not-a-uuid',
        notification_type: 'invalid_type'
      };

      await expect(notificationLogRepository.create(invalidData)).rejects.toThrow();
    });
  });

  describe('listByUser', () => {
    it('deve listar logs do usuário de forma paginada', async () => {
      const mockLogs = [{ id: '1', user_id: mockUserId }];
      
      const rangeMock = vi.fn().mockResolvedValue({ data: mockLogs, error: null });
      const orderMock = vi.fn().mockReturnValue({ range: rangeMock });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({ select: selectMock });

      const result = await notificationLogRepository.listByUser(mockUserId, { limit: 10, offset: 0 });

      expect(supabase.from).toHaveBeenCalledWith('notification_log');
      expect(selectMock).toHaveBeenCalledWith(expect.stringContaining('protocols:protocol_id'));
      expect(eqMock).toHaveBeenCalledWith('user_id', mockUserId);
      expect(rangeMock).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual(mockLogs);
    });
  });
});
